import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import DropZone, { type InputSource } from "@/components/DropZone";
import GuillotineCut from "@/components/GuillotineCut";
import TerminalLog from "@/components/TerminalLog";

type AppState = "idle" | "cutting" | "processing";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");
  const [sourceLabel, setSourceLabel] = useState("");
  const [inputSource, setInputSource] = useState<InputSource | null>(null);

  const handleSubmit = (source: InputSource) => {
    setSourceLabel(source.label);
    setInputSource(source);
    setState("cutting");
  };

  const handleCutComplete = () => {
    setState("processing");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
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
    </div>
  );
};

export default Index;
