import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOG_SEQUENCE = [
  { text: "> Arquivo recebido. Iniciando trituração...", delay: 800 },
  { text: "> Decodificando stream de vídeo...", delay: 1500 },
  { text: "> Analisando picos de áudio...", delay: 2200 },
  { text: "> Detectando momentos de alto engajamento...", delay: 3500 },
  { text: "> 7 pontos de corte identificados.", delay: 4800 },
  { text: "> Extraindo clipe 01/07...", delay: 5500 },
  { text: "> Extraindo clipe 02/07...", delay: 6000 },
  { text: "> Extraindo clipe 03/07...", delay: 6400 },
  { text: "> Extraindo clipe 04/07...", delay: 6800 },
  { text: "> Extraindo clipe 05/07...", delay: 7200 },
  { text: "> Extraindo clipe 06/07...", delay: 7600 },
  { text: "> Extraindo clipe 07/07...", delay: 8000 },
  { text: "> Aplicando formato vertical 9:16...", delay: 8800 },
  { text: "> Gerando legendas automáticas...", delay: 9800 },
  { text: "> Conectando ao TikTok...", delay: 11000 },
  { text: "> Publicando clipe 01... ✓", delay: 12000 },
  { text: "> Publicando clipe 02... ✓", delay: 12800 },
  { text: "> Publicando clipe 03... ✓", delay: 13600 },
  { text: "> Publicando clipe 04... ✓", delay: 14200 },
  { text: "> Publicando clipe 05... ✓", delay: 14800 },
  { text: "> Publicando clipe 06... ✓", delay: 15400 },
  { text: "> Publicando clipe 07... ✓", delay: 16000 },
  { text: "", delay: 16500 },
  { text: "> COMPLETO. 7 clipes publicados no TikTok.", delay: 17000 },
  { text: "> Pode fechar esta aba.", delay: 18000 },
];

interface TerminalLogProps {
  fileName: string;
}

const TerminalLog = ({ fileName }: TerminalLogProps) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    LOG_SEQUENCE.forEach((entry) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, entry.text]);
      }, entry.delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-6">
      <div className="mb-6 text-muted-foreground font-system text-xs uppercase tracking-widest">
        {fileName}
      </div>
      <div className="space-y-1">
        <AnimatePresence>
          {visibleLines.map((line, i) => (
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
                  : line === ""
                  ? "h-4"
                  : "text-muted-foreground"
              }`}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.span
          className="inline-block w-2 h-4 bg-primary ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

export default TerminalLog;
