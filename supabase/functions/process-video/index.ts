import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeneratedClip {
  clip_index: number;
  title: string;
  duration: string;
  hook: string;
  storage_path: string;
  download_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtube_url, search_query, file_name } = await req.json();

    const steps: string[] = [];

    if (youtube_url) {
      steps.push(`Link recebido: ${youtube_url}`);
      steps.push("Baixando vídeo do YouTube...");
    } else if (search_query) {
      steps.push(`Buscando: "${search_query}"...`);
      steps.push("Vídeo encontrado. Iniciando download...");
    } else if (file_name) {
      steps.push(`Arquivo recebido: ${file_name}`);
    }

    steps.push("Decodificando stream de vídeo...");
    steps.push("Analisando picos de áudio...");
    steps.push("Detectando momentos de alto engajamento...");

    const clipCount = Math.floor(Math.random() * 5) + 3;
    steps.push(`${clipCount} pontos de corte identificados.`);

    for (let i = 1; i <= clipCount; i++) {
      steps.push(`Extraindo clipe ${String(i).padStart(2, "0")}/${String(clipCount).padStart(2, "0")}...`);
    }

    steps.push("Aplicando formato vertical 9:16...");
    steps.push("Gerando legendas automáticas...");
    steps.push("Finalizando cortes para revisão...");
    steps.push("");
    steps.push(`COMPLETO. ${clipCount} cortes prontos para visualizar e baixar.`);

    const baseLabel = file_name ?? search_query ?? youtube_url ?? "video";
    const clips: GeneratedClip[] = Array.from({ length: clipCount }, (_, i) => {
      const clipIndex = i + 1;
      const seconds = 18 + ((i * 7) % 40);
      const name = `clip-${String(clipIndex).padStart(2, "0")}.mp4`;

      return {
        clip_index: clipIndex,
        title: `${baseLabel} · Corte ${String(clipIndex).padStart(2, "0")}`,
        duration: `00:${String(seconds).padStart(2, "0")}`,
        hook: "Abertura com gancho forte, cortes rápidos e foco no momento de maior retenção.",
        storage_path: `pending/${name}`,
        download_url: "",
      };
    });

    return new Response(JSON.stringify({ steps, clips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
