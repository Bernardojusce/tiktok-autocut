import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface GeneratedClip {
  id: string;
  clip_index?: number;
  title: string;
  duration: string;
  hook: string;
  storage_path?: string | null;
  download_url?: string | null;
}

interface ClipResultsProps {
  sourceLabel: string;
  clips: GeneratedClip[];
  onReset: () => void;
}

const toSafeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const ClipResults = ({ sourceLabel, clips, onReset }: ClipResultsProps) => {
  const [previewClip, setPreviewClip] = useState<GeneratedClip | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingClipId, setLoadingClipId] = useState<string | null>(null);

  const hasAnyPreview = useMemo(
    () => clips.some((clip) => Boolean(clip.download_url || clip.storage_path)),
    [clips]
  );

  const resolveClipUrl = async (clip: GeneratedClip) => {
    if (clip.download_url) return clip.download_url;
    if (signedUrls[clip.id]) return signedUrls[clip.id];
    if (!clip.storage_path) return null;

    const { data, error } = await supabase.storage
      .from("clips")
      .createSignedUrl(clip.storage_path, 60 * 5);

    if (error || !data?.signedUrl) return null;

    setSignedUrls((prev) => ({ ...prev, [clip.id]: data.signedUrl }));
    return data.signedUrl;
  };

  const openPreview = async (clip: GeneratedClip) => {
    setLoadingClipId(clip.id);
    const url = await resolveClipUrl(clip);
    setLoadingClipId(null);

    if (!url) {
      toast.error("Preview indisponível para este corte no momento.");
      return;
    }

    setPreviewClip({ ...clip, download_url: url });
  };

  const downloadClip = async (clip: GeneratedClip) => {
    setLoadingClipId(clip.id);
    const url = await resolveClipUrl(clip);

    if (!url) {
      setLoadingClipId(null);
      toast.error("Não foi possível gerar link de download deste corte.");
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha ao baixar arquivo");

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = localUrl;
      link.download = `${toSafeFilename(clip.title || `corte-${clip.clip_index ?? 1}`)}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(localUrl);
    } catch {
      toast.error("Falha no download. Tente novamente.");
    } finally {
      setLoadingClipId(null);
    }
  };

  const downloadAll = async () => {
    for (const clip of clips) {
      // sequencial para evitar muitos requests simultâneos
      // eslint-disable-next-line no-await-in-loop
      await downloadClip(clip);
    }
  };

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 gap-4">
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
          <div className="flex items-center gap-3">
            <button
              onClick={downloadAll}
              className="text-primary font-system text-xs uppercase tracking-[0.15em] hover:opacity-80 transition-opacity"
            >
              Baixar todos
            </button>
            <button
              onClick={onReset}
              className="text-muted-foreground font-system text-xs uppercase tracking-[0.15em] hover:text-primary transition-colors"
            >
              Novo vídeo
            </button>
          </div>
        </div>

        {!hasAnyPreview && (
          <p className="text-xs text-muted-foreground mb-4">
            Ainda não há arquivo de vídeo real disponível para preview/download neste lote.
          </p>
        )}

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
                  Corte {clip.clip_index ?? index + 1}
                </span>
                <span className="terminal-text text-xs text-primary">{clip.duration}</span>
              </div>

              <h3 className="font-system text-sm text-foreground mt-3 line-clamp-2">{clip.title}</h3>
              <p className="font-system text-xs text-muted-foreground mt-1 line-clamp-3">{clip.hook}</p>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={() => openPreview(clip)}
                  disabled={loadingClipId === clip.id}
                  className="text-muted-foreground text-xs uppercase tracking-widest font-system hover:text-primary transition-colors disabled:opacity-50"
                >
                  Preview
                </button>
                <button
                  onClick={() => downloadClip(clip)}
                  disabled={loadingClipId === clip.id}
                  className="text-primary text-xs uppercase tracking-widest font-system hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {loadingClipId === clip.id ? "Baixando..." : "Baixar"}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {previewClip && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-system text-foreground truncate mr-4">{previewClip.title}</h3>
              <button
                onClick={() => setPreviewClip(null)}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                Fechar
              </button>
            </div>
            <video
              key={previewClip.id}
              src={previewClip.download_url || undefined}
              controls
              playsInline
              className="w-full aspect-[9/16] bg-black"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => downloadClip(previewClip)}
                className="text-primary text-xs uppercase tracking-widest font-system hover:opacity-80 transition-opacity"
              >
                Baixar este corte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClipResults;
