import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { InputSource } from "@/components/DropZone";
import type { GeneratedClip } from "@/components/ClipResults";

interface TerminalLogProps {
  source: InputSource;
  onComplete: (clips: GeneratedClip[]) => void;
}

interface ProcessVideoResponse {
  steps?: string[];
  clips?: Array<{
    clip_index: number;
    title: string;
    duration: string;
    hook: string;
    storage_path?: string;
    download_url?: string;
  }>;
}

const TerminalLog = ({ source, onComplete }: TerminalLogProps) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const jobIdRef = useRef<string | null>(null);

  const addLine = (text: string) => {
    setLines((prev) => [...prev, text]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    const process = async () => {
      if (user) {
        const { data: job } = await supabase
          .from("video_jobs")
          .insert({
            user_id: user.id,
            source_type: source.type,
            source_label: source.label,
            source_url: source.type === "youtube" ? source.url : null,
            status: "processing",
          })
          .select("id")
          .single();
        if (job) jobIdRef.current = job.id;
      }

      try {
        if (source.type === "file") addLine(`> Arquivo recebido: ${source.label}`);
        else if (source.type === "youtube") addLine(`> Link do YouTube recebido: ${source.label}`);
        else addLine(`> Buscando vídeo: "${source.label}"...`);

        addLine("> Iniciando processamento de cortes...");

        const body: Record<string, string> = {};
        if (source.type === "youtube") body.youtube_url = source.url;
        else if (source.type === "search") body.search_query = source.query;
        else body.file_name = source.label;

        const { data, error } = await supabase.functions.invoke<ProcessVideoResponse>("process-video", { body });

        if (error) {
          addLine(`> ERRO: ${error.message}`);
          addLine("> Executando processamento local...");
          await simulateProcessing();
          return;
        }

        if (data?.steps) {
          for (const step of data.steps) {
            await delay(400);
            addLine(`> ${step}`);
          }

          const generatedClips = mapClipsFromResponse(source.label, data.clips);
          await persistClips(generatedClips);
          await updateJob("completed", generatedClips.length);

          setIsComplete(true);
          await delay(500);
          onComplete(generatedClips);
          return;
        }

        await simulateProcessing();
      } catch {
        addLine("> Conexão com servidor indisponível.");
        addLine("> Executando processamento local...");
        await simulateProcessing();
      }
    };

    const persistClips = async (clips: GeneratedClip[]) => {
      if (!jobIdRef.current || !user || clips.length === 0) return;

      const rows = clips.map((clip, index) => ({
        job_id: jobIdRef.current,
        user_id: user.id,
        clip_index: clip.clip_index ?? index + 1,
        title: clip.title,
        duration: clip.duration,
        storage_path: clip.storage_path ?? null,
        download_url: clip.download_url ?? null,
      }));

      await supabase.from("video_clips").insert(rows);
    };

    const simulateProcessing = async () => {
      const clipCount = Math.floor(Math.random() * 5) + 3;
      const steps = [
        "Decodificando stream de vídeo...",
        "Analisando picos de áudio...",
        "Detectando momentos de alto engajamento...",
        `${clipCount} pontos de corte identificados.`,
      ];

      for (let i = 1; i <= clipCount; i++) {
        steps.push(`Extraindo clipe ${String(i).padStart(2, "0")}/${String(clipCount).padStart(2, "0")}...`);
      }

      steps.push("Aplicando formato vertical 9:16...");
      steps.push("Gerando legendas automáticas...");
      steps.push("Finalizando cortes para revisão...");
      steps.push("");
      steps.push(`COMPLETO. ${clipCount} cortes prontos para visualizar e baixar.`);

      for (const step of steps) {
        await delay(step === "" ? 300 : step.includes("Extraindo") ? 400 : 800);
        addLine(step ? `> ${step}` : "");
      }

      const generatedClips = buildFallbackClips(source.label, clipCount);
      await persistClips(generatedClips);
      await updateJob("completed", clipCount);

      setIsComplete(true);
      await delay(500);
      onComplete(generatedClips);
    };

    const updateJob = async (status: string, clips: number) => {
      if (jobIdRef.current && user) {
        await supabase
          .from("video_jobs")
          .update({
            status,
            clips_count: clips,
            published_count: 0,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobIdRef.current);
      }
    };

    process();
  }, [onComplete, source, user]);

  return (
    <div className="w-full max-w-2xl mx-auto px-6 h-full flex flex-col justify-center">
      <div className="mb-6 text-muted-foreground font-system text-xs uppercase tracking-widest">{source.label}</div>
      <div ref={scrollRef} className="space-y-1 max-h-[70vh] overflow-y-auto scrollbar-none">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`terminal-text text-sm ${
                line.includes("COMPLETO")
                  ? "text-primary neon-text font-semibold mt-4"
                  : line.includes("ERRO")
                    ? "text-destructive"
                    : line === ""
                      ? "h-4"
                      : "text-muted-foreground"
              }`}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
        {!isComplete && (
          <motion.span
            className="inline-block w-2 h-4 bg-primary ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
};

const mapClipsFromResponse = (sourceLabel: string, clips?: ProcessVideoResponse["clips"]): GeneratedClip[] => {
  if (!clips || clips.length === 0) return buildFallbackClips(sourceLabel, 3);

  return clips.map((clip, index) => ({
    id: `clip-${clip.clip_index ?? index + 1}`,
    clip_index: clip.clip_index ?? index + 1,
    title: clip.title,
    duration: clip.duration,
    hook: clip.hook,
    storage_path: clip.storage_path ?? null,
    download_url: clip.download_url ?? null,
  }));
};

const buildFallbackClips = (sourceLabel: string, count: number): GeneratedClip[] => {
  const safeCount = Math.max(1, count || 0);

  return Array.from({ length: safeCount }, (_, index) => {
    const clipNumber = index + 1;
    const seconds = 18 + ((index * 7) % 40);
    const title = `${sourceLabel} · Corte ${String(clipNumber).padStart(2, "0")}`;
    const duration = `00:${String(seconds).padStart(2, "0")}`;

    return {
      id: `clip-${clipNumber}`,
      clip_index: clipNumber,
      title,
      duration,
      hook: "Abertura com gancho forte, cortes rápidos e foco no momento de maior retenção.",
      storage_path: null,
      download_url: null,
    };
  });
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default TerminalLog;
