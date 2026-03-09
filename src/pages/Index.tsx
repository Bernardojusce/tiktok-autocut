import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import DropZone from "@/components/DropZone";
import GuillotineCut from "@/components/GuillotineCut";
import TerminalLog from "@/components/TerminalLog";

type AppState = "idle" | "cutting" | "processing";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");
  const [fileName, setFileName] = useState("");

  const handleFileDrop = (file: File) => {
    setFileName(file.name);
    setState("cutting");
  };

  const handleCutComplete = () => {
    setState("processing");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {state === "idle" && <DropZone key="drop" onFileDrop={handleFileDrop} />}
      </AnimatePresence>

      {state === "cutting" && (
        <GuillotineCut onComplete={handleCutComplete} />
      )}

      {state === "processing" && (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
          <TerminalLog fileName={fileName} />
        </div>
      )}
    </div>
  );
};

export default Index;
