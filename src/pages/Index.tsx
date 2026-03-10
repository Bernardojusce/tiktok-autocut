import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import DropZone, { type InputSource } from "@/components/DropZone";
import GuillotineCut from "@/components/GuillotineCut";
import TerminalLog from "@/components/TerminalLog";
import HistoryPanel from "@/components/HistoryPanel";
import ClipResults, { type GeneratedClip } from "@/components/ClipResults";
import { useAuth } from "@/contexts/AuthContext";

type AppState = "idle" | "cutting" | "processing" | "results";

const Index = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (source: InputSource) => {
    setInputSource(source);
    setClips([]);
    setState("cutting");
  };

  const handleCutComplete = () => {
    setState("processing");
  };

  const handleProcessComplete = (generatedClips: GeneratedClip[]) => {
    setClips(generatedClips);
    setState("results");
  };

  const handleReset = () => {
    setInputSource(null);
    setClips([]);
    setState("idle");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {user && state === "idle" && (
        <button
          onClick={() => setShowHistory(true)}
          className="fixed top-6 right-6 z-30 text-muted-foreground font-system text-xs uppercase tracking-[0.15em] hover:text-primary transition-colors"
        >
          Histórico
        </button>
      )}

      <AnimatePresence mode="wait">
        {state === "idle" && <DropZone key="drop" onSubmit={handleSubmit} />}
      </AnimatePresence>

      {state === "cutting" && <GuillotineCut onComplete={handleCutComplete} />}

      {state === "processing" && inputSource && (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
          <TerminalLog source={inputSource} onComplete={handleProcessComplete} />
        </div>
      )}

      {state === "results" && inputSource && (
        <ClipResults sourceLabel={inputSource.label} clips={clips} onReset={handleReset} />
      )}

      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
