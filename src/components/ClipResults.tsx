import { motion } from "framer-motion";

export interface GeneratedClip {
  id: string;
  title: string;
  duration: string;
  hook: string;
}

interface ClipResultsProps {
  sourceLabel: string;
  clips: GeneratedClip[];
  onReset: () => void;
}

const ClipResults = ({ sourceLabel, clips, onReset }: ClipResultsProps) => {
  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted-foreground font-system text-xs uppercase tracking-widest">
              Resultado dos cortes
            </p>
            <h2 className="font-display text-foreground text-2xl font-bold tracking-tight mt-2">
              Cortes prontos para revisão
            </h2>
            <p className="text-muted-foreground font-system text-sm mt-2 max-w-xl truncate">
              Fonte: {sourceLabel}
            </p>
          </div>
          <button
            onClick={onReset}
            className="text-muted-foreground font-system text-xs uppercase tracking-[0.15em] hover:text-primary transition-colors"
          >
            Novo vídeo
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip, index) => (
            <motion.article
              key={clip.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.2 }}
              className="border border-border bg-card p-3"
            >
              <div className="aspect-[9/16] w-full bg-gradient-to-b from-primary/30 via-muted to-background border border-border flex items-end justify-between p-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-system">
                  Corte {index + 1}
                </span>
                <span className="terminal-text text-xs text-primary">{clip.duration}</span>
              </div>

              <h3 className="font-system text-sm text-foreground mt-3 line-clamp-2">{clip.title}</h3>
              <p className="font-system text-xs text-muted-foreground mt-1 line-clamp-3">{clip.hook}</p>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-system">
                  Prévia estilo TikTok
                </span>
                <button className="text-primary text-xs uppercase tracking-widest font-system hover:opacity-80 transition-opacity">
                  Assistir
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClipResults;
