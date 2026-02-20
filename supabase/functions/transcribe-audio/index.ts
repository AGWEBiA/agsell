// Audio Transcription using Lovable AI (Gemini)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const audioUrl = formData.get("audio_url") as string | null;
    const language = formData.get("language") as string || "pt-BR";

    if (!audioFile && !audioUrl) {
      return new Response(
        JSON.stringify({ error: "Audio file or URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let audioBase64: string;
    let mimeType: string;

    if (audioFile) {
      // Handle uploaded file
      const arrayBuffer = await audioFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      audioBase64 = btoa(String.fromCharCode(...uint8Array));
      mimeType = audioFile.type || "audio/ogg";
    } else if (audioUrl) {
      // Fetch audio from URL
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio from URL");
      }
      const arrayBuffer = await audioResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      audioBase64 = btoa(String.fromCharCode(...uint8Array));
      mimeType = audioResponse.headers.get("content-type") || "audio/ogg";
    } else {
      throw new Error("No audio source provided");
    }

    // Use Lovable AI Gateway with Gemini for transcription
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an audio transcription assistant. Transcribe the audio accurately in ${language}. 
Return ONLY the transcribed text, nothing else. No explanations, no formatting, just the exact words spoken.
If the audio is unclear or contains no speech, respond with "[Audio não reconhecível]".`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe this audio message:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${audioBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content?.trim() || "[Transcrição não disponível]";

    return new Response(
      JSON.stringify({ 
        transcription,
        language,
        success: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : "Transcription failed";
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
