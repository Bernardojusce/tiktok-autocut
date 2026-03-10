import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOTSTACK_API = "https://api.shotstack.io/edit/stage"; // use "v1" for production

interface ShotstackRenderResponse {
  success: boolean;
  message: string;
  response: { id: string; message: string };
}

interface ShotstackStatusResponse {
  success: boolean;
  response: {
    id: string;
    status: string;
    url?: string;
    data?: { output?: { src?: string } };
    error?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
  if (!SHOTSTACK_API_KEY) {
    return new Response(
      JSON.stringify({ error: "SHOTSTACK_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { video_url, storage_path, job_id, user_id, clip_segments } = await req.json();

    // Resolve the source video URL
    let sourceUrl = video_url;
    if (!sourceUrl && storage_path) {
      const { data } = await supabase.storage
        .from("clips")
        .createSignedUrl(storage_path, 3600);
      if (data?.signedUrl) sourceUrl = data.signedUrl;
    }

    if (!sourceUrl) {
      return new Response(
        JSON.stringify({ error: "No video source provided. Upload a file or provide a URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default clip segments if not provided — split into ~20-30s clips
    const segments: Array<{ start: number; length: number }> =
      clip_segments && clip_segments.length > 0
        ? clip_segments
        : generateDefaultSegments();

    const steps: string[] = [];
    steps.push(`Fonte de vídeo detectada.`);
    steps.push("Enviando para engine de renderização...");

    // Build Shotstack timeline for each clip
    const renderIds: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      steps.push(`Renderizando clipe ${i + 1}/${segments.length} (${seg.length}s)...`);

      const timeline = {
        timeline: {
          tracks: [
            {
              clips: [
                {
                  asset: {
                    type: "video",
                    src: sourceUrl,
                    trim: seg.start,
                    volume: 1,
                  },
                  start: 0,
                  length: seg.length,
                  fit: "crop",
                  position: "center",
                },
              ],
            },
          ],
        },
        output: {
          format: "mp4",
          resolution: "sd",
          aspectRatio: "9:16",
          size: { width: 1080, height: 1920 },
        },
      };

      const renderRes = await fetch(`${SHOTSTACK_API}/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SHOTSTACK_API_KEY,
        },
        body: JSON.stringify(timeline),
      });

      const renderData: ShotstackRenderResponse = await renderRes.json();

      if (!renderRes.ok || !renderData.success) {
        steps.push(`ERRO no clipe ${i + 1}: ${renderData.message || "render failed"}`);
        continue;
      }

      renderIds.push(renderData.response.id);
    }

    steps.push("Aguardando renderização finalizar...");

    // Poll for each render
    const clips: Array<{
      clip_index: number;
      title: string;
      duration: string;
      hook: string;
      storage_path: string | null;
      download_url: string;
    }> = [];

    for (let i = 0; i < renderIds.length; i++) {
      const renderId = renderIds[i];
      const seg = segments[i];
      let downloadUrl = "";
      let attempts = 0;
      const maxAttempts = 60; // up to ~5 min

      while (attempts < maxAttempts) {
        await delay(5000);
        attempts++;

        const statusRes = await fetch(`${SHOTSTACK_API}/render/${renderId}`, {
          headers: { "x-api-key": SHOTSTACK_API_KEY },
        });

        const statusData: ShotstackStatusResponse = await statusRes.json();
        const status = statusData.response.status;

        if (status === "done") {
          downloadUrl = statusData.response.url || statusData.response.data?.output?.src || "";
          steps.push(`Clipe ${i + 1} pronto! ✓`);
          break;
        } else if (status === "failed") {
          steps.push(`Clipe ${i + 1} falhou: ${statusData.response.error || "unknown"}`);
          break;
        }
        // still rendering, continue polling
      }

      if (downloadUrl) {
        const clipIndex = i + 1;
        const duration = `00:${String(seg.length).padStart(2, "0")}`;

        clips.push({
          clip_index: clipIndex,
          title: `Corte ${String(clipIndex).padStart(2, "0")}`,
          duration,
          hook: "Formato vertical 9:16 otimizado para TikTok/Reels.",
          storage_path: null,
          download_url: downloadUrl,
        });

        // Persist to DB if we have user context
        if (job_id && user_id) {
          await supabase.from("video_clips").insert({
            job_id,
            user_id,
            clip_index: clipIndex,
            title: `Corte ${String(clipIndex).padStart(2, "0")}`,
            duration,
            hook: "Formato vertical 9:16 otimizado para TikTok/Reels.",
            download_url: downloadUrl,
          });
        }
      }
    }

    if (clips.length > 0) {
      steps.push("");
      steps.push(`COMPLETO. ${clips.length} cortes prontos para visualizar e baixar.`);
    } else {
      steps.push("Nenhum clipe foi renderizado com sucesso.");
    }

    // Update job status
    if (job_id && user_id) {
      await supabase
        .from("video_jobs")
        .update({
          status: clips.length > 0 ? "completed" : "failed",
          clips_count: clips.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);
    }

    return new Response(JSON.stringify({ steps, clips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateDefaultSegments() {
  const count = Math.floor(Math.random() * 3) + 3; // 3-5 clips
  return Array.from({ length: count }, (_, i) => ({
    start: i * 25,
    length: 20 + Math.floor(Math.random() * 15), // 20-34s each
  }));
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
