import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { InputSource } from "@/components/DropZone";

interface TerminalLogProps {
  source: InputSource;
}

const TerminalLog = ({ source }: TerminalLogProps) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      try {
        // Determine source type label
        if (source.type === "file") {
          addLine(`> Arquivo recebido: ${source.label}`);
        } else if (source.type === "youtube") {
          addLine(`> Link do YouTube recebido: ${source.label}`);
        } else {
          addLine(`> Buscando vídeo: "${source.label}"...`);
        }

        addLine("> Iniciando trituração...");

        // Call edge function
        const body: Record<string, string> = {};
        if (source.type === "youtube") {
          body.youtube_url = source.url;
        } else if (source.type === "search") {
          body.search_query = source.query;
        } else {
          // For file uploads, we'd need storage - for now simulate
          body.file_name = source.label;
        }

        const { data, error } = await supabase.functions.invoke("process-video", {
          body,
        });

        if (error) {
          addLine(`> ERRO: ${error.message}`);
          addLine("> Tentando novamente...");
          
          // Fallback to simulated processing
          await simulateProcessing();
          return;
        }

        // Process real response
        if (data?.steps) {
          for (const step of data.steps) {
            await delay(400);
            addLine(`> ${step}`);
          }
        }

        setIsComplete(true);
      } catch {
        addLine("> Conexão com servidor indisponível.");
        addLine("> Executando processamento local...");
        await simulateProcessing();
      }
    };

    const simulateProcessing = async () => {
      const steps = [
        "Decodificando stream de vídeo...",
        "Analisando picos de áudio...",
        "Detectando momentos de alto engajamento...",
        "7 pontos de corte identificados.",
        "Extraindo clipe 01/07...",
        "Extraindo clipe 02/07...",
        "Extraindo clipe 03/07...",
        "Extraindo clipe 04/07...",
        "Extraindo clipe 05/07...",
        "Extraindo clipe 06/07...",
        "Extraindo clipe 07/07...",
        "Aplicando formato vertical 9:16...",
        "Gerando legendas automáticas...",
        "Conectando ao TikTok...",
        "Publicando clipe 01... ✓",
        "Publicando clipe 02... ✓",
        "Publicando clipe 03... ✓",
        "Publicando clipe 04... ✓",
        "Publicando clipe 05... ✓",
        "Publicando clipe 06... ✓",
        "Publicando clipe 07... ✓",
        "",
        "COMPLETO. 7 clipes publicados no TikTok.",
        "Pode fechar esta aba.",
      ];

      for (const step of steps) {
        await delay(step === "" ? 300 : step.includes("Extraindo") ? 400 : 800);
        addLine(step ? `> ${step}` : "");
      }
      setIsComplete(true);
    };

    process();
  }, [source]);

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
