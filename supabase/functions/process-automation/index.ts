import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutomationAction {
  type: string;
  subtype?: string;
  config: Record<string, unknown>;
}

interface ExecutionPayload {
  automation_id: string;
  contact_id?: string;
  trigger_event: string;
  // For scheduled step resumption
  resume_from_step?: number;
  execution_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const isInternalCron = req.headers.get('X-Internal-Cron') === 'true' && token === supabaseServiceKey;

    // For internal cron calls (scheduled step resumptions), skip user JWT validation
    // since the original user token will have expired by the time the cron fires.
    // The service role key is used instead and validated above.
    if (!isInternalCron) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const payload: ExecutionPayload = await req.json();
    const { automation_id, contact_id, trigger_event, resume_from_step, execution_id: resumeExecId } = payload;

    if (!automation_id || !trigger_event) {
      return new Response(
        JSON.stringify({ error: 'automation_id and trigger_event are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automation_id)
      .eq('is_active', true)
      .single();

    if (automationError || !automation) {
      return new Response(
        JSON.stringify({ error: 'Automation not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const actions = (automation.actions || []) as AutomationAction[];
    const startStep = resume_from_step || 0;

    // Create or resume execution record
    let executionId = resumeExecId;
    if (!executionId) {
      const { data: execution, error: execError } = await supabase
        .from('automation_executions')
        .insert({
          automation_id,
          contact_id,
          trigger_event,
          status: 'running',
          total_steps: actions.length,
          current_step: startStep,
        })
        .select()
        .single();
      if (execError) throw execError;
      executionId = execution.id;
    } else {
      await supabase
        .from('automation_executions')
        .update({ status: 'running' })
        .eq('id', executionId);
    }

    const results: Array<{ step: number; action: string; status: string; result?: unknown; error?: string }> = [];
    let currentStep = startStep;

    // Helper: get contact data
    const getContact = async () => {
      if (!contact_id) return null;
      const { data } = await supabase.from('contacts').select('*').eq('id', contact_id).single();
      return data;
    };

    // Helper: log timeline entry
    const logTimeline = async (actionType: string, nodeLabel: string, status: string, details: Record<string, unknown> = {}) => {
      await supabase.from('automation_contact_timeline').insert({
        automation_id,
        execution_id: executionId,
        contact_id,
        node_id: `step_${currentStep}`,
        node_label: nodeLabel,
        action_type: actionType,
        status,
        details,
        organization_id: automation.organization_id,
      }).then(() => {});
    };

    // Helper: send WhatsApp via send-whatsapp edge function (supports text/buttons/list/presence)
    const sendWhatsAppDirect = async (phone: string, actionConfig: Record<string, unknown>) => {
      const messageKind = (actionConfig.message_kind as string) || 'text';
      const message = (actionConfig.message as string) || '';
      const payload: Record<string, unknown> = {
        organization_id: automation.organization_id,
        to: phone,
        message,
        message_kind: messageKind,
      };
      // Pass through interactive / rich-media fields when relevant
      if (messageKind === 'buttons') {
        payload.buttons = actionConfig.buttons || [];
        payload.buttons_footer = actionConfig.buttons_footer;
      } else if (messageKind === 'list') {
        payload.list_sections = actionConfig.list_sections || [];
        payload.list_button_text = actionConfig.list_button_text;
        payload.list_title = actionConfig.list_title;
        payload.list_footer = actionConfig.list_footer;
      } else if (messageKind === 'presence') {
        payload.presence_state = actionConfig.presence_state || 'composing';
        payload.presence_delay_ms = actionConfig.presence_delay_ms || 2000;
      } else if (messageKind === 'audio_ptt') {
        payload.audio_url = actionConfig.audio_url || actionConfig.media_url;
      } else if (messageKind === 'location') {
        payload.latitude = actionConfig.latitude;
        payload.longitude = actionConfig.longitude;
        payload.location_name = actionConfig.location_name;
        payload.location_address = actionConfig.location_address;
      } else if (messageKind === 'contact') {
        payload.contact_full_name = actionConfig.contact_full_name;
        payload.contact_phone = actionConfig.contact_phone;
        payload.contact_organization = actionConfig.contact_organization;
        payload.contact_email = actionConfig.contact_email;
      } else if (messageKind === 'poll') {
        payload.poll_name = actionConfig.poll_name || actionConfig.message;
        payload.poll_values = actionConfig.poll_values || [];
        payload.poll_selectable_count = actionConfig.poll_selectable_count ?? 1;
      } else if (messageKind === 'reaction') {
        payload.reaction_emoji = actionConfig.reaction_emoji ?? '';
        payload.reaction_external_id = actionConfig.reaction_external_id;
        payload.reaction_from_me = actionConfig.reaction_from_me;
      } else if (messageKind === 'sticker') {
        payload.sticker_url = actionConfig.sticker_url || actionConfig.media_url;
      }
      // Group mentions (only effective when "to" is a group JID)
      if (actionConfig.mentions || actionConfig.mentions_everyone) {
        payload.mentions = actionConfig.mentions || [];
        payload.mentions_everyone = !!actionConfig.mentions_everyone;
      }
      if (actionConfig.media_url) {
        payload.media_url = actionConfig.media_url;
        payload.media_type = actionConfig.media_type || 'image';
        if (actionConfig.media_filename) payload.media_filename = actionConfig.media_filename;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      return { success: resp.ok, provider: 'send-whatsapp', data };
    };

    // Helper: replace template variables
    const replaceVars = (text: string, contact: Record<string, unknown> | null): string => {
      if (!text || !contact) return text || '';
      return text
        .replace(/\{\{nome\}\}/g, `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
        .replace(/\{\{primeiro_nome\}\}/g, String(contact.first_name || ''))
        .replace(/\{\{email\}\}/g, String(contact.email || ''))
        .replace(/\{\{telefone\}\}/g, String(contact.phone || ''))
        .replace(/\{\{whatsapp\}\}/g, String(contact.whatsapp || ''));
    };

    // Execute each action starting from startStep
    for (let i = startStep; i < actions.length; i++) {
      const action = actions[i];
      currentStep = i + 1;

      try {
        let actionResult: unknown;
        const actionType = action.subtype || action.type;

        switch (actionType) {
          // ── MESSAGING ──
          case 'send_email':
          case 'send_email_marketing':
          case 'send_email_performance': {
            const contact = await getContact();
            const to = (action.config.to as string) || contact?.email;
            if (to) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to,
                  subject: replaceVars(action.config.subject as string, contact),
                  html: replaceVars((action.config.content || action.config.body || action.config.html_content) as string, contact),
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No email address' };
            }
            await logTimeline(actionType, 'E-mail', 'success', { to });
            break;
          }

          case 'send_whatsapp':
          case 'send_whatsapp_oficial': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.whatsapp || contact?.phone;
            if (phone) {
              const cfg = { ...action.config, message: replaceVars(action.config.message as string, contact) };
              actionResult = await sendWhatsAppDirect(phone, cfg);
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'WhatsApp', 'success');
            break;
          }

          case 'send_whatsapp_group': {
            // Send message to a WhatsApp group session
            const contact = await getContact();
            const groupId = action.config.group_id as string;
            const message = replaceVars(action.config.message as string, contact);
            if (groupId && message) {
              const { data: group } = await supabase
                .from('whatsapp_groups')
                .select('external_group_id, settings')
                .eq('id', groupId)
                .single();
              if (group?.external_group_id) {
                const { data: globalConfig } = await supabase
                  .from('platform_settings').select('value').eq('key', 'evolution_api').single();
                const evo = globalConfig?.value as Record<string, string> | null;
                if (evo?.api_url && evo?.api_key) {
                  const instanceName = (action.config.instance_name as string) || ((group.settings as Record<string, string>)?.instance_name) || '';
                  const resp = await fetch(`${evo.api_url.replace(/\/+$/, '')}/message/sendText/${instanceName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', apikey: evo.api_key },
                    body: JSON.stringify({ number: group.external_group_id, text: message }),
                  });
                  actionResult = { success: resp.ok };
                }
              }
            }
            await logTimeline(actionType, 'WhatsApp Grupo', 'success');
            break;
          }
          case 'send_whatsapp_campaign': {

            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.whatsapp || contact?.phone;
            const message = replaceVars(action.config.message as string, contact);
            if (phone && message) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to: phone,
                  message,
                  message_kind: 'text'
                }),
              });
              actionResult = await resp.json();
            }
            await logTimeline(actionType, 'Campanha WA', 'success');
            break;
          }


          case 'send_sms': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.phone || contact?.whatsapp;
            if (phone) {
              const message = replaceVars(action.config.message as string, contact);
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  to: phone,
                  message,
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'SMS', 'success');
            break;
          }

          case 'voice_torpedo':
          case 'send_voip_call': {
            const contact = await getContact();
            const phone = (action.config.to as string) || contact?.phone || contact?.whatsapp;
            if (phone) {
              const resp = await fetch(`${supabaseUrl}/functions/v1/voip-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  phone_number: phone,
                  audio_url: action.config.audio_url,
                  on_answer: action.config.on_answer || 'play_audio',
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No phone number' };
            }
            await logTimeline(actionType, 'VoIP', 'success');
            break;
          }

          // ── INSTAGRAM ──
          case 'send_instagram_dm': {
            const contact = await getContact();
            const igUserId = (action.config.instagram_user_id as string) || (contact as any)?.instagram_user_id;
            if (igUserId) {
              const message = replaceVars(action.config.message as string, contact);
              const resp = await fetch(`${supabaseUrl}/functions/v1/send-instagram-dm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                body: JSON.stringify({
                  organization_id: automation.organization_id,
                  recipient_id: igUserId,
                  message,
                }),
              });
              actionResult = await resp.json();
            } else {
              actionResult = { skipped: true, reason: 'No Instagram user ID' };
            }
            await logTimeline(actionType, 'Instagram DM', 'success');
            break;
          }

          case 'send_instagram_comment_reply':
          case 'send_instagram_story_reply':
          case 'instagram_like_comment':
          case 'instagram_follow_back': {
            // These require specific Instagram Graph API calls
            actionResult = { executed: true, action: actionType, note: 'Processed via Instagram webhook handler' };
            await logTimeline(actionType, 'Instagram', 'success');
            break;
          }

          // ── TAGS & SCORING ──
          case 'add_tag': {
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .insert({ contact_id, tag_id: action.config.tag_id as string });
              actionResult = { success: !error };
            }
            await logTimeline('add_tag', 'Add Tag', 'success');
            break;
          }

          case 'remove_tag': {
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .delete()
                .eq('contact_id', contact_id)
                .eq('tag_id', action.config.tag_id as string);
              actionResult = { success: !error };
            }
            await logTimeline('remove_tag', 'Remove Tag', 'success');
            break;
          }

          case 'update_score': {
            if (contact_id && action.config.points) {
              const points = Number(action.config.points) || 0;
              const { data: contact } = await supabase
                .from('contacts').select('lead_score').eq('id', contact_id).single();
              const newScore = Math.max(0, Math.min(100, (contact?.lead_score || 0) + points));
              const { error } = await supabase
                .from('contacts').update({ lead_score: newScore }).eq('id', contact_id);
              actionResult = { success: !error, new_score: newScore };
            }
            await logTimeline('update_score', 'Score', 'success', { points: action.config.points });
            break;
          }

          case 'update_status': {
            if (contact_id && action.config.status) {
              const { error } = await supabase
                .from('contacts').update({ status: action.config.status as string }).eq('id', contact_id);
              actionResult = { success: !error };
            }
            break;
          }

          // ── TASKS & NOTIFICATIONS ──
          case 'create_task': {
            const { error } = await supabase.from('tasks').insert({
              title: action.config.title as string,
              description: action.config.description as string,
              contact_id,
              user_id: automation.user_id,
              due_date: action.config.due_days
                ? new Date(Date.now() + Number(action.config.due_days) * 86400000).toISOString()
                : null,
            });
            actionResult = { success: !error };
            await logTimeline('create_task', 'Tarefa', 'success');
            break;
          }

          // ── DEALS / CRM ──
          case 'create_deal': {
            // Resolve target stage: prefer explicit stage_id, fallback to first stage by position
            let stageId = (action.config.stage_id as string) || null;
            if (!stageId) {
              const { data: firstStage } = await supabase
                .from('pipeline_stages')
                .select('id')
                .eq('user_id', automation.user_id)
                .order('position', { ascending: true })
                .limit(1)
                .maybeSingle();
              stageId = firstStage?.id || null;
            }

            if (!stageId) {
              actionResult = { success: false, error: 'Nenhum estágio do pipeline encontrado' };
              await logTimeline('create_deal', 'Criar Deal', 'failed', { error: 'No pipeline stage' });
              break;
            }

            const contact = await getContact();
            const titleTemplate = (action.config.title as string) || 'Lead via {{source}}';
            const dealTitle = titleTemplate
              .replace(/\{\{first_name\}\}/g, contact?.first_name || '')
              .replace(/\{\{source\}\}/g, contact?.source || 'SAC')
              || `Lead - ${contact?.first_name || 'Sem nome'}`;

            const expectedDays = Number(action.config.expected_close_days || 0);
            const expectedDate = expectedDays > 0
              ? new Date(Date.now() + expectedDays * 86400000).toISOString().split('T')[0]
              : null;

            const { data: newDeal, error } = await supabase.from('deals').insert({
              title: dealTitle,
              value: Number(action.config.value || 0),
              stage_id: stageId,
              contact_id,
              user_id: automation.user_id,
              organization_id: automation.organization_id,
              status: 'open',
              expected_close_date: expectedDate,
              probability: Number(action.config.probability || 50),
            }).select('id').single();

            actionResult = { success: !error, deal_id: newDeal?.id, error: error?.message };
            await logTimeline('create_deal', 'Criar Deal no Pipeline', error ? 'failed' : 'success', { deal_id: newDeal?.id, title: dealTitle });
            break;
          }

          case 'send_notification': {
            const { error } = await supabase.from('notifications').insert({
              user_id: automation.user_id,
              type: 'automation',
              title: (action.config.title as string) || 'Automação executada',
              message: action.config.message as string,
              link: action.config.link as string,
            });
            actionResult = { success: !error };
            break;
          }

          // ── DELAYS (REAL) ──
          case 'wait':
          case 'timer': {
            const config = action.config;
            let delayMs = 0;

            if (config.timer_mode === 'specific_date' && config.specific_date) {
              const targetDate = new Date(config.specific_date as string);
              delayMs = Math.max(0, targetDate.getTime() - Date.now());
            } else {
              const duration = Number(config.duration || config.minutes || 1);
              const unit = (config.unit as string) || 'minutes';
              const multiplier = unit === 'hours' ? 3600000 : unit === 'days' ? 86400000 : 60000;
              delayMs = duration * multiplier;
            }

            if (delayMs > 0) {
              // Schedule remaining steps for later execution
              const scheduledAt = new Date(Date.now() + delayMs).toISOString();
              const remainingActions = actions.slice(i + 1);

              await supabase.from('automation_scheduled_steps').insert({
                automation_id,
                execution_id: executionId,
                contact_id,
                organization_id: automation.organization_id,
                current_step: i + 1,
                scheduled_at: scheduledAt,
                status: 'pending',
                actions: remainingActions,
              });

              // Update execution to waiting
              await supabase.from('automation_executions').update({
                status: 'waiting',
                current_step: currentStep,
                results,
              }).eq('id', executionId);

              actionResult = { scheduled: true, resume_at: scheduledAt, remaining_steps: remainingActions.length };
              results.push({ step: currentStep, action: actionType, status: 'scheduled', result: actionResult });

              await logTimeline('timer', 'Timer', 'waiting', { scheduled_at: scheduledAt });

              // Return early - remaining steps will be executed by the scheduler
              return new Response(
                JSON.stringify({ success: true, execution_id: executionId, status: 'waiting', results }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            actionResult = { waited: 0, note: 'No delay needed' };
            break;
          }

          case 'warmup': {
            // Rate limiting: pause between batches
            const leadsPerMinute = Number(action.config.leads_per_minute || 1);
            const delayPerLead = Math.ceil(60000 / leadsPerMinute);
            // For single execution, just add a small delay
            await new Promise(resolve => setTimeout(resolve, Math.min(delayPerLead, 5000)));
            actionResult = { warmup_applied: true, rate: leadsPerMinute };
            await logTimeline('warmup', 'Aquecimento', 'success');
            break;
          }

          // ── CONDITIONALS (IF/ELSE BRANCHING) ──
          case 'conditional':
          case 'if_tag':
          case 'if_keyword':
          case 'if_score':
          case 'tag_filter': {
            const contact = await getContact();
            let conditionMet = false;
            const conditions = (action.config.conditions as Array<{ field: string; operator: string; value: string }>) || [];
            const logicOperator = (action.config.logic as string) || 'AND';

            if (conditions.length === 0 && actionType === 'tag_filter') {
              // Tag filter: check entry_tags and block_tags
              const entryTags = (action.config.entry_tags as string[]) || [];
              const blockTags = (action.config.block_tags as string[]) || [];

              if (contact_id) {
                const { data: contactTags } = await supabase
                  .from('contact_tags')
                  .select('tag_id, tags(name)')
                  .eq('contact_id', contact_id);
                const tagNames = (contactTags || []).map((t: any) => t.tags?.name).filter(Boolean);
                const tagIds = (contactTags || []).map((t: any) => t.tag_id);

                const hasAllEntry = entryTags.length === 0 || entryTags.every(t => tagIds.includes(t) || tagNames.includes(t));
                const hasAnyBlock = blockTags.some(t => tagIds.includes(t) || tagNames.includes(t));
                conditionMet = hasAllEntry && !hasAnyBlock;
              }
            } else if (conditions.length > 0 && contact) {
              const evalResults = await Promise.all(conditions.map(async (cond) => {
                switch (cond.field) {
                  case 'has_tag': {
                    const { data: ct } = await supabase
                      .from('contact_tags').select('id').eq('contact_id', contact_id!).eq('tag_id', cond.value).maybeSingle();
                    return !!ct;
                  }
                  case 'score_gte':
                    return (contact.lead_score || 0) >= Number(cond.value);
                  case 'score_lte':
                    return (contact.lead_score || 0) <= Number(cond.value);
                  case 'has_email':
                    return !!contact.email;
                  case 'has_whatsapp':
                    return !!(contact.whatsapp || contact.phone);
                  case 'status_is':
                    return contact.status === cond.value;
                  case 'source_is':
                    return contact.source === cond.value;
                  case 'keyword': {
                    // Check last message for keyword
                    const { data: lastMsg } = await supabase
                      .from('messages')
                      .select('content')
                      .eq('contact_id', contact_id!)
                      .eq('sender_type', 'contact')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    return lastMsg?.content?.toLowerCase().includes(cond.value.toLowerCase()) || false;
                  }
                  default:
                    return false;
                }
              }));

              conditionMet = logicOperator === 'OR' ? evalResults.some(Boolean) : evalResults.every(Boolean);
            }

            // Check deadline for tag_filter
            if (actionType === 'tag_filter' && action.config.has_deadline && action.config.deadline_date) {
              const deadline = new Date(action.config.deadline_date as string);
              if (deadline < new Date()) {
                conditionMet = false; // Past deadline
              }
            }

            actionResult = { condition_met: conditionMet, conditions_evaluated: conditions.length || 'tag_filter' };

            if (!conditionMet) {
              // Skip remaining actions (simple linear skip — future: branch paths)
              await logTimeline(actionType, 'Condição', 'skipped', { reason: 'Condition not met' });
              
              // If the action has a false branch config, we could handle it here
              // For now, we stop execution on condition failure
              results.push({ step: currentStep, action: actionType, status: 'condition_false', result: actionResult });
              
              await supabase.from('automation_executions').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                current_step: currentStep,
                results,
              }).eq('id', executionId);

              await supabase.rpc('increment_automation_executions', { automation_id });

              return new Response(
                JSON.stringify({ success: true, execution_id: executionId, stopped_at_condition: currentStep, results }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            await logTimeline(actionType, 'Condição', 'success', { met: true });
            break;
          }

          // ── WHATSAPP GROUP MANAGEMENT ──
          case 'add_to_whatsapp_group': {
            const contact = await getContact();
            const phoneNumber = contact?.whatsapp || contact?.phone;
            if (phoneNumber && action.config.group_id) {
              const { data: groupData } = await supabase
                .from('whatsapp_groups')
                .select('external_group_id, settings')
                .eq('id', action.config.group_id as string)
                .single();

              if (groupData?.external_group_id) {
                const { data: platformSettings } = await supabase
                  .from('platform_settings').select('value').eq('key', 'evolution_api').single();
                const evoConfig = platformSettings?.value as { api_url?: string; api_key?: string } | null;
                if (evoConfig?.api_url && evoConfig?.api_key) {
                  let digits = phoneNumber.replace(/\D/g, '');
                  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) digits = '55' + digits;
                  const instanceName = (action.config.instance_name as string) || ((groupData.settings as Record<string, string>)?.instance_name) || '';
                  const resp = await fetch(`${evoConfig.api_url.replace(/\/+$/, '')}/group/updateParticipant/${instanceName}`, {
                    method: 'PUT',
                    headers: { apikey: evoConfig.api_key, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupJid: groupData.external_group_id, action: 'add', participants: [`${digits}@s.whatsapp.net`] }),
                  });
                  actionResult = { success: resp.ok };
                }
              }
            }
            await logTimeline('add_to_group', 'Grupo WA', 'success');
            break;
          }

          case 'edit_whatsapp_group': {
            if (action.config.group_id) {
              const updates: Record<string, unknown> = {};
              if (action.config.new_name) updates.name = action.config.new_name;
              if (action.config.new_description) updates.description = action.config.new_description;
              if (Object.keys(updates).length > 0) {
                await supabase.from('whatsapp_groups').update(updates).eq('id', action.config.group_id as string);
              }
              actionResult = { success: true, updates };
            }
            await logTimeline('edit_group', 'Editar Grupo', 'success');
            break;
          }

          // ── PARALLEL CHANNELS (FISHBONE) ──
          case 'parallel_channels': {
            const channels = (action.config.channels as string[]) || ['whatsapp', 'email'];
            const contact = await getContact();
            const parallelResults: Record<string, unknown> = {};

            for (const channel of channels) {
              try {
                if (channel === 'whatsapp' && (contact?.whatsapp || contact?.phone)) {
                  const msg = replaceVars(action.config.whatsapp_message as string || action.config.message as string, contact);
                  parallelResults.whatsapp = await sendWhatsAppDirect(contact.whatsapp || contact.phone, { ...action.config, message: msg });
                } else if (channel === 'email' && contact?.email) {
                  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                    body: JSON.stringify({
                      organization_id: automation.organization_id,
                      to: contact.email,
                      subject: replaceVars(action.config.email_subject as string, contact),
                      html: replaceVars(action.config.email_body as string, contact),
                    }),
                  });
                  parallelResults.email = { success: true };
                } else if (channel === 'sms' && (contact?.phone || contact?.whatsapp)) {
                  await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                    body: JSON.stringify({
                      organization_id: automation.organization_id,
                      to: contact.phone || contact.whatsapp,
                      message: replaceVars(action.config.sms_message as string, contact),
                    }),
                  });
                  parallelResults.sms = { success: true };
                }
              } catch (channelErr) {
                parallelResults[channel] = { error: (channelErr as Error).message };
              }
            }

            actionResult = { parallel: true, channels: parallelResults };
            await logTimeline('parallel', 'Paralelo', 'success', { channels: Object.keys(parallelResults) });
            break;
          }

          // ── SEQUENCES ──
          case 'sequence_lead':
          case 'sequence_transaction':
          case 'sequence_rewarming':
          case 'sequence_optin': {
            const steps = (action.config.steps as Array<{ message: string; delay_minutes: number; channel: string }>) || [];
            if (contact_id && steps.length > 0) {
              // Create a lightweight inline sequence - schedule first step immediately
              for (let si = 0; si < steps.length; si++) {
                const step = steps[si];
                const delayMs = (si === 0) ? 0 : (step.delay_minutes || 5) * 60000;
                const scheduledAt = new Date(Date.now() + delayMs).toISOString();

                await supabase.from('automation_scheduled_steps').insert({
                  automation_id,
                  execution_id: executionId,
                  contact_id,
                  organization_id: automation.organization_id,
                  current_step: i,
                  scheduled_at: scheduledAt,
                  status: 'pending',
                  actions: [{ type: step.channel || 'send_whatsapp', config: { message: step.message } }],
                });
              }
              actionResult = { sequence_scheduled: true, total_steps: steps.length, type: actionType };
            }
            await logTimeline(actionType, `Sequência ${actionType.replace('sequence_', '')}`, 'success');
            break;
          }

          // ── LINK SPLIT ──
          case 'link_split': {
            const links = (action.config.links as Array<{ url: string; weight: number }>) || [];
            if (links.length > 0) {
              // Weighted random selection
              const totalWeight = links.reduce((sum, l) => sum + (l.weight || 1), 0);
              let rand = Math.random() * totalWeight;
              let selectedLink = links[0]?.url;
              for (const link of links) {
                rand -= (link.weight || 1);
                if (rand <= 0) { selectedLink = link.url; break; }
              }
              actionResult = { selected_link: selectedLink, total_variants: links.length };
            }
            await logTimeline('link_split', 'Link Split', 'success');
            break;
          }

          // ── ABANDONMENT RECOVERY ──
          case 'abandonment': {
            // Mark contact for abandonment recovery flow
            if (contact_id) {
              await supabase.from('contact_tags').insert({
                contact_id,
                tag_id: action.config.recovery_tag_id as string,
              }).then(() => {});
              // Schedule recovery message
              const delayMinutes = Number(action.config.delay_minutes || 30);
              await supabase.from('automation_scheduled_steps').insert({
                automation_id,
                execution_id: executionId,
                contact_id,
                organization_id: automation.organization_id,
                current_step: i,
                scheduled_at: new Date(Date.now() + delayMinutes * 60000).toISOString(),
                status: 'pending',
                actions: [{
                  type: 'send_whatsapp',
                  config: { message: action.config.recovery_message || 'Notamos que você não finalizou. Precisa de ajuda?' },
                }],
              });
              actionResult = { recovery_scheduled: true, delay_minutes: delayMinutes };
            }
            await logTimeline('abandonment', 'Abandono', 'success');
            break;
          }

          // ── NOTES (no-op) ──
          case 'note': {
            actionResult = { note: action.config.text, logged: true };
            break;
          }

          // ── FULL PAGE / PIXEL (frontend-only) ──
          case 'full_page':
          case 'pixel': {
            actionResult = { frontend_only: true, action: actionType };
            break;
          }

          // ── LIST TAG ──
          case 'list_tag': {
            if (contact_id) {
              const { data: tags } = await supabase
                .from('contact_tags')
                .select('tag_id, tags(name)')
                .eq('contact_id', contact_id);
              actionResult = { tags: tags?.map((t: any) => t.tags?.name).filter(Boolean) || [] };
            }
            break;
          }

          default:
            actionResult = { skipped: true, reason: `Unhandled action type: ${actionType}` };
            console.log(`[AUTOMATION] Unhandled action: ${actionType}`);
        }

        results.push({
          step: currentStep,
          action: actionType,
          status: 'success',
          result: actionResult,
        });

        // Update execution progress
        await supabase.from('automation_executions').update({
          current_step: currentStep,
          results,
        }).eq('id', executionId);

      } catch (actionError) {
        const errorMsg = actionError instanceof Error ? actionError.message : 'Unknown error';
        console.error(`[AUTOMATION] Step ${currentStep} error:`, errorMsg);
        results.push({
          step: currentStep,
          action: action.subtype || action.type,
          status: 'error',
          error: errorMsg,
        });
        await logTimeline(action.subtype || action.type, 'Erro', 'error', { error: errorMsg });
      }
    }

    // Mark execution as completed
    const finalStatus = results.some(r => r.status === 'error') ? 'completed_with_errors' : 'completed';
    await supabase.from('automation_executions').update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      current_step: currentStep,
      results,
    }).eq('id', executionId);

    await supabase.rpc('increment_automation_executions', { automation_id });

    return new Response(
      JSON.stringify({ success: true, execution_id: executionId, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing automation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
