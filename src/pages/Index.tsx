import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import DropZone, { type InputSource } from "@/components/DropZone";
import GuillotineCut from "@/components/GuillotineCut";
import TerminalLog from "@/components/TerminalLog";
import HistoryPanel from "@/components/HistoryPanel";
import { useAuth } from "@/contexts/AuthContext";

type AppState = "idle" | "cutting" | "processing";

const Index = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("idle");
  const [inputSource, setInputSource] = useState<InputSource | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (source: InputSource) => {
    setInputSource(source);
    setState("cutting");
  };

  const handleCutComplete = () => {
    setState("processing");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* History button - top right */}
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

      {state === "cutting" && (
        <GuillotineCut onComplete={handleCutComplete} />
      )}

      {state === "processing" && inputSource && (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
          <TerminalLog source={inputSource} />
        </div>
      )}

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
