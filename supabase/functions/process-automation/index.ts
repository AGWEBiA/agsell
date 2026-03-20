import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutomationAction {
  type: string;
  config: Record<string, unknown>;
}

interface Automation {
  id: string;
  name: string;
  actions: AutomationAction[];
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  user_id: string;
}

interface ExecutionPayload {
  automation_id: string;
  contact_id?: string;
  trigger_event: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { automation_id, contact_id, trigger_event }: ExecutionPayload = await req.json();

    if (!automation_id || !trigger_event) {
      return new Response(
        JSON.stringify({ error: 'automation_id and trigger_event are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch automation
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

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('automation_executions')
      .insert({
        automation_id,
        contact_id,
        trigger_event,
        status: 'running',
        total_steps: actions.length,
        current_step: 0,
      })
      .select()
      .single();

    if (execError) {
      throw execError;
    }

    const results: Array<{ step: number; action: string; status: string; result?: unknown; error?: string }> = [];
    let currentStep = 0;

    // Execute each action
    for (const action of actions) {
      currentStep++;

      try {
        let actionResult: unknown;

        switch (action.type) {
          case 'send_email':
            // Call send-email function using user's token for proper auth
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify({
                organization_id: automation.organization_id,
                to: action.config.to || action.config.email,
                subject: action.config.subject,
                html: action.config.content || action.config.body,
              }),
            });
            actionResult = await emailResponse.json();
            break;

          case 'send_whatsapp':
            // Call send-whatsapp function using user's token for proper auth
            const waResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify({
                organization_id: automation.organization_id,
                to: action.config.to || action.config.phone,
                message: action.config.message,
              }),
            });
            actionResult = await waResponse.json();
            break;

          case 'add_tag':
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .insert({ contact_id, tag_id: action.config.tag_id as string });
              actionResult = { success: !error };
            }
            break;

          case 'remove_tag':
            if (contact_id && action.config.tag_id) {
              const { error } = await supabase
                .from('contact_tags')
                .delete()
                .eq('contact_id', contact_id)
                .eq('tag_id', action.config.tag_id as string);
              actionResult = { success: !error };
            }
            break;

          case 'update_score':
            if (contact_id && action.config.points) {
              const points = Number(action.config.points) || 0;
              const { data: contact } = await supabase
                .from('contacts')
                .select('lead_score')
                .eq('id', contact_id)
                .single();

              const newScore = Math.max(0, Math.min(100, (contact?.lead_score || 0) + points));
              
              const { error } = await supabase
                .from('contacts')
                .update({ lead_score: newScore })
                .eq('id', contact_id);

              actionResult = { success: !error, new_score: newScore };
            }
            break;

          case 'create_task':
            const { error: taskError } = await supabase
              .from('tasks')
              .insert({
                title: action.config.title as string,
                description: action.config.description as string,
                contact_id,
                user_id: automation.user_id,
                due_date: action.config.due_days 
                  ? new Date(Date.now() + Number(action.config.due_days) * 86400000).toISOString()
                  : null,
              });
            actionResult = { success: !taskError };
            break;

          case 'send_notification':
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: automation.user_id,
                type: 'automation',
                title: action.config.title as string || 'Automação executada',
                message: action.config.message as string,
                link: action.config.link as string,
              });
            actionResult = { success: !notifError };
            break;

          case 'wait':
            // For wait actions, we log it but actual waiting would need a queue system
            const waitMinutes = Number(action.config.minutes) || 0;
            actionResult = { waited_minutes: waitMinutes, note: 'Immediate execution - queue system needed for real delays' };
            break;

          case 'update_status':
            if (contact_id && action.config.status) {
              const { error } = await supabase
                .from('contacts')
                .update({ status: action.config.status as string })
                .eq('id', contact_id);
              actionResult = { success: !error };
            }
            break;

          case 'add_to_whatsapp_group': {
            // Add contact to WhatsApp group via Evolution API
            if (contact_id && action.config.group_id) {
              // Get contact's WhatsApp number
              const { data: contactData } = await supabase
                .from('contacts')
                .select('whatsapp, phone')
                .eq('id', contact_id)
                .single();

              const phoneNumber = contactData?.whatsapp || contactData?.phone;
              if (phoneNumber) {
                // Get group info
                const { data: groupData } = await supabase
                  .from('whatsapp_groups')
                  .select('external_group_id, settings')
                  .eq('id', action.config.group_id as string)
                  .single();

                if (groupData?.external_group_id) {
                  // Get Evolution API config
                  const { data: platformSettings } = await supabase
                    .from('platform_settings')
                    .select('value')
                    .eq('key', 'evolution_api')
                    .single();

                  const evoConfig = platformSettings?.value as { api_url?: string; api_key?: string } | null;
                  if (evoConfig?.api_url && evoConfig?.api_key) {
                    const apiUrl = evoConfig.api_url.replace(/\/+$/, '');
                    const instanceName = (action.config.instance_name as string) || 
                      ((groupData.settings as Record<string, unknown>)?.instance_name as string) || '';
                    
                    // Format Brazilian number
                    let digits = phoneNumber.replace(/\D/g, '');
                    if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
                      digits = '55' + digits;
                    }

                    const addResponse = await fetch(`${apiUrl}/group/updateParticipant/${instanceName}`, {
                      method: 'PUT',
                      headers: { apikey: evoConfig.api_key, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        groupJid: groupData.external_group_id,
                        action: 'add',
                        participants: [`${digits}@s.whatsapp.net`],
                      }),
                    });
                    const addResult = await addResponse.text();
                    console.log('[AUTOMATION] Add to group result:', addResponse.status, addResult);
                    actionResult = { success: addResponse.ok, response: addResult };
                  } else {
                    actionResult = { skipped: true, reason: 'Evolution API not configured' };
                  }
                } else {
                  actionResult = { skipped: true, reason: 'Group has no external JID' };
                }
              } else {
                actionResult = { skipped: true, reason: 'Contact has no WhatsApp number' };
              }
            }
            break;
          }

          default:
            actionResult = { skipped: true, reason: `Unknown action type: ${action.type}` };
        }

        results.push({
          step: currentStep,
          action: action.type,
          status: 'success',
          result: actionResult,
        });

        // Update execution progress
        await supabase
          .from('automation_executions')
          .update({ current_step: currentStep, results })
          .eq('id', execution.id);

      } catch (actionError) {
        results.push({
          step: currentStep,
          action: action.type,
          status: 'error',
          error: actionError instanceof Error ? actionError.message : 'Unknown error',
        });
      }
    }

    // Mark execution as completed
    await supabase
      .from('automation_executions')
      .update({
        status: results.some(r => r.status === 'error') ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString(),
        current_step: currentStep,
        results,
      })
      .eq('id', execution.id);

    // Update automation execution count
    await supabase.rpc('increment_automation_executions', { automation_id });

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: execution.id,
        results,
      }),
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
