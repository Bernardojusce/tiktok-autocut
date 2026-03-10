import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VideoJob {
  id: string;
  source_type: string;
  source_label: string;
  status: string;
  clips_count: number;
  published_count: number;
  created_at: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const { user, signOut } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("video_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setJobs((data as VideoJob[]) || []);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-background z-40 overflow-y-auto"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted-foreground font-system text-xs uppercase tracking-widest">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={signOut}
              className="text-muted-foreground font-system text-xs uppercase tracking-[0.15em] hover:text-destructive transition-colors"
            >
              Sair
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground font-system text-xs uppercase tracking-[0.15em] hover:text-primary transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        <h2 className="font-display text-foreground text-xl font-bold tracking-tight mb-6">
          Histórico
        </h2>

        {loading ? (
          <p className="text-muted-foreground font-system text-sm">Carregando...</p>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground font-system text-sm">
            Nenhum vídeo processado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-foreground font-system text-sm truncate max-w-xs">
                    {job.source_label}
                  </p>
                  <p className="text-muted-foreground font-system text-xs mt-1">
                    {job.source_type === "youtube"
                      ? "YouTube"
                      : job.source_type === "search"
                      ? "Busca"
                      : "Arquivo"}{" "}
                    · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`terminal-text text-xs ${
                      job.status === "completed"
                        ? "text-primary"
                        : job.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {job.status === "completed"
                      ? `${job.clips_count} cortes gerados`
                      : job.status === "failed"
                      ? "Falhou"
                      : "Processando..."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HistoryPanel;
