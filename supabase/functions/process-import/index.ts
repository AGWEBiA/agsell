import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Não autorizado");

    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId é obrigatório");

    // Verify ownership
    const { data: job } = await supabase
      .from("import_jobs")
      .select("user_id, status")
      .eq("id", jobId)
      .single();

    if (!job) throw new Error("Job não encontrado");
    if (job.user_id !== user.id) throw new Error("Não autorizado");
    if (job.status !== "pending") {
      return new Response(JSON.stringify({ message: "Job já processado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the PostgreSQL function that does all the heavy lifting
    const { data, error } = await supabase.rpc("process_import_job", {
      _job_id: jobId,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, ...(data as object) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-import error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
