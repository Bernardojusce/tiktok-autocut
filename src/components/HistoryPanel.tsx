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
  created_at: string;
}

interface JobClip {
  id: string;
  clip_index: number;
  title: string;
  duration: string | null;
  storage_path: string | null;
  download_url: string | null;
}

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const { user, signOut } = useAuth();
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [clipsByJob, setClipsByJob] = useState<Record<string, JobClip[]>>({});

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

  const fetchJobClips = async (jobId: string) => {
    if (clipsByJob[jobId]) return;

    const { data } = await supabase
      .from("video_clips")
      .select("id, clip_index, title, duration, storage_path, download_url")
      .eq("job_id", jobId)
      .order("clip_index", { ascending: true });

    setClipsByJob((prev) => ({ ...prev, [jobId]: (data as JobClip[]) || [] }));
  };

  const resolveDownloadUrl = async (clip: JobClip) => {
    if (clip.download_url) return clip.download_url;
    if (!clip.storage_path) return null;

    const { data } = await supabase.storage.from("clips").createSignedUrl(clip.storage_path, 60);
    return data?.signedUrl ?? null;
  };

  const downloadClip = async (clip: JobClip) => {
    const url = await resolveDownloadUrl(clip);
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `${clip.title.replace(/\s+/g, "-").toLowerCase()}.mp4`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const toggleJob = async (jobId: string) => {
    const next = expandedJob === jobId ? null : jobId;
    setExpandedJob(next);
    if (next) await fetchJobClips(next);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background z-40 overflow-y-auto"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground font-system text-xs uppercase tracking-widest">{user?.email}</p>
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

        <h2 className="font-display text-foreground text-xl font-bold tracking-tight mb-6">Histórico</h2>

        {loading ? (
          <p className="text-muted-foreground font-system text-sm">Carregando...</p>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground font-system text-sm">Nenhum vídeo processado ainda.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const isExpanded = expandedJob === job.id;
              const clips = clipsByJob[job.id] || [];

              return (
                <div key={job.id} className="border border-border p-4">
                  <button
                    onClick={() => toggleJob(job.id)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="text-foreground font-system text-sm truncate max-w-xs">{job.source_label}</p>
                      <p className="text-muted-foreground font-system text-xs mt-1">
                        {job.source_type === "youtube" ? "YouTube" : job.source_type === "search" ? "Busca" : "Arquivo"} ·{" "}
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <span
                      className={`terminal-text text-xs ${
                        job.status === "completed"
                          ? "text-primary"
                          : job.status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {job.status === "completed" ? `${job.clips_count} cortes gerados` : job.status === "failed" ? "Falhou" : "Processando..."}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      {clips.length === 0 ? (
                        <p className="text-muted-foreground text-xs">Sem cortes disponíveis para download.</p>
                      ) : (
                        clips.map((clip) => (
                          <div key={clip.id} className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-foreground text-xs">{clip.title}</p>
                              <p className="text-muted-foreground text-[11px]">Corte {clip.clip_index} {clip.duration ? `· ${clip.duration}` : ""}</p>
                            </div>
                            <button
                              onClick={() => downloadClip(clip)}
                              className="text-primary text-[11px] uppercase tracking-wider hover:opacity-80 transition-opacity"
                            >
                              Baixar
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HistoryPanel;
