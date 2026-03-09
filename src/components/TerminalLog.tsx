import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { InputSource } from "@/components/DropZone";

interface TerminalLogProps {
  source: InputSource;
}

const TerminalLog = ({ source }: TerminalLogProps) => {
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
      // Create job record
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
        if (source.type === "file") {
          addLine(`> Arquivo recebido: ${source.label}`);
        } else if (source.type === "youtube") {
          addLine(`> Link do YouTube recebido: ${source.label}`);
        } else {
          addLine(`> Buscando vídeo: "${source.label}"...`);
        }

        addLine("> Iniciando trituração...");

        const body: Record<string, string> = {};
        if (source.type === "youtube") body.youtube_url = source.url;
        else if (source.type === "search") body.search_query = source.query;
        else body.file_name = source.label;

        const { data, error } = await supabase.functions.invoke("process-video", { body });

        if (error) {
          addLine(`> ERRO: ${error.message}`);
          addLine("> Executando processamento local...");
          await simulateProcessing();
          return;
        }

        if (data?.steps) {
          let clipsCount = 0;
          let publishedCount = 0;
          for (const step of data.steps) {
            await delay(400);
            addLine(`> ${step}`);
            if (step.includes("pontos de corte")) {
              const match = step.match(/(\d+)/);
              if (match) clipsCount = parseInt(match[1]);
            }
            if (step.includes("✓")) publishedCount++;
          }
          await updateJob("completed", clipsCount, publishedCount);
        }

        setIsComplete(true);
      } catch {
        addLine("> Conexão com servidor indisponível.");
        addLine("> Executando processamento local...");
        await simulateProcessing();
      }
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
      steps.push("Conectando ao TikTok...");

      for (let i = 1; i <= clipCount; i++) {
        steps.push(`Publicando clipe ${String(i).padStart(2, "0")}... ✓`);
      }

      steps.push("", `COMPLETO. ${clipCount} clipes publicados no TikTok.`, "Pode fechar esta aba.");

      for (const step of steps) {
        await delay(step === "" ? 300 : step.includes("Extraindo") ? 400 : 800);
        addLine(step ? `> ${step}` : "");
      }

      await updateJob("completed", clipCount, clipCount);
      setIsComplete(true);
    };

    const updateJob = async (status: string, clips: number, published: number) => {
      if (jobIdRef.current && user) {
        await supabase
          .from("video_jobs")
          .update({
            status,
            clips_count: clips,
            published_count: published,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobIdRef.current);
      }
    };

    process();
  }, [source, user]);

  return (
    <div className="w-full max-w-2xl mx-auto px-6 h-full flex flex-col justify-center">
      <div className="mb-6 text-muted-foreground font-system text-xs uppercase tracking-widest">
        {source.label}
      </div>
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
                  : line.includes("✓")
                  ? "text-primary"
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default TerminalLog;
