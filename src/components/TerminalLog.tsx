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

const TerminalLog = ({ source, onComplete }: TerminalLogProps) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const addLine = (text: string) => {
    setLines((prev) => [...prev, text]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const process = async () => {
      let jobId: string | null = null;

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
        if (job) jobId = job.id;
      }

      try {
        // Step 1: Upload file to storage if it's a file input
        let videoUrl: string | null = null;
        let storagePath: string | null = null;

        if (source.type === "file") {
          addLine(`> Arquivo recebido: ${source.label}`);
          addLine("> Enviando arquivo para o servidor...");

          const fileName = `uploads/${user?.id || "anon"}/${Date.now()}-${source.label}`;
          const { error: uploadError } = await supabase.storage
            .from("clips")
            .upload(fileName, source.file, { contentType: source.file.type });

          if (uploadError) {
            addLine(`> ERRO no upload: ${uploadError.message}`);
            addLine("> Tente novamente com outro arquivo.");
            return;
          }

          storagePath = fileName;
          addLine("> Upload concluído ✓");
        } else if (source.type === "youtube") {
          videoUrl = source.url;
          addLine(`> Link do YouTube: ${source.label}`);
          addLine("> NOTA: Para processar vídeos do YouTube, é necessário fornecer o link direto do vídeo (.mp4).");
          addLine("> Enviando para processamento...");
        } else {
          addLine(`> Busca: "${source.label}"`);
          addLine("> NOTA: Envie um arquivo de vídeo para obter clipes reais com download.");
          addLine("> Executando simulação de preview...");
        }

        addLine("> Iniciando engine de cortes Shotstack...");

        // Call edge function
        const body: Record<string, unknown> = {};
        if (videoUrl) body.video_url = videoUrl;
        if (storagePath) body.storage_path = storagePath;
        if (jobId) body.job_id = jobId;
        if (user) body.user_id = user.id;

        const { data, error } = await supabase.functions.invoke("process-video", { body });

        if (error) {
          addLine(`> ERRO: ${error.message}`);
          addLine("> Verifique sua chave Shotstack ou tente novamente.");
          return;
        }

        if (data?.steps) {
          for (const step of data.steps) {
            await delay(300);
            addLine(step ? `> ${step}` : "");
          }
        }

        const generatedClips: GeneratedClip[] = (data?.clips || []).map(
          (clip: any, index: number) => ({
            id: `clip-${clip.clip_index ?? index + 1}`,
            clip_index: clip.clip_index ?? index + 1,
            title: clip.title,
            duration: clip.duration,
            hook: clip.hook,
            storage_path: clip.storage_path ?? null,
            download_url: clip.download_url ?? null,
          })
        );

        if (generatedClips.length === 0) {
          addLine("> Nenhum clipe foi gerado. Verifique o vídeo de entrada.");
          return;
        }

        setIsComplete(true);
        await delay(500);
        onComplete(generatedClips);
      } catch (err) {
        addLine("> Erro inesperado na conexão.");
        addLine(`> ${err instanceof Error ? err.message : "Tente novamente."}`);
      }
    };

    process();
  }, []);

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
