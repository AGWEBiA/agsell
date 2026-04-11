import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is called by pg_cron every minute to process scheduled automation steps
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find pending scheduled steps that are due
    const { data: pendingSteps, error: fetchError } = await supabase
      .from('automation_scheduled_steps')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!pendingSteps || pendingSteps.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const step of pendingSteps) {
      try {
        // Mark as processing
        await supabase
          .from('automation_scheduled_steps')
          .update({ status: 'processing' })
          .eq('id', step.id);

        // Always use service role key for internal cron calls
        // User JWT tokens expire and cannot be used for delayed resumption
        const resp = await fetch(`${supabaseUrl}/functions/v1/process-automation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'X-Internal-Cron': 'true',
          },
          body: JSON.stringify({
            automation_id: step.automation_id,
            contact_id: step.contact_id,
            trigger_event: 'scheduled_resume',
            resume_from_step: step.current_step,
            execution_id: step.execution_id,
          }),
        });

        if (resp.ok) {
          await supabase
            .from('automation_scheduled_steps')
            .update({ status: 'completed' })
            .eq('id', step.id);
          processed++;
        } else {
          const errBody = await resp.text();
          console.error(`Scheduled step ${step.id} failed:`, errBody);
          await supabase
            .from('automation_scheduled_steps')
            .update({ status: 'error' })
            .eq('id', step.id);
          errors++;
        }
      } catch (stepErr) {
        console.error(`Error processing scheduled step ${step.id}:`, stepErr);
        await supabase
          .from('automation_scheduled_steps')
          .update({ status: 'error' })
          .eq('id', step.id);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingSteps.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process scheduled steps error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
