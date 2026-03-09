import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type InputSource =
  | { type: "file"; file: File; label: string }
  | { type: "youtube"; url: string; label: string }
  | { type: "search"; query: string; label: string };

interface DropZoneProps {
  onSubmit: (source: InputSource) => void;
}

const DropZone = ({ onSubmit }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isYouTubeUrl = (text: string) =>
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(text);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("video/")) {
        onSubmit({ type: "file", file, label: file.name });
      }
    },
    [onSubmit]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onSubmit({ type: "file", file, label: file.name });
    }
  };

  const handleTextSubmit = () => {
    const val = textInput.trim();
    if (!val) return;
    if (isYouTubeUrl(val)) {
      onSubmit({ type: "youtube", url: val, label: val });
    } else {
      onSubmit({ type: "search", query: val, label: val });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Border pulse on drag */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="absolute inset-4 border border-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Center content */}
      <div className="text-center select-none w-full max-w-xl px-6">
        <motion.h1
          className="font-display text-foreground text-2xl md:text-4xl font-bold tracking-tight leading-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Jogue o vídeo aqui.
        </motion.h1>
        <motion.p
          className="font-display text-primary neon-text text-lg md:text-xl font-medium mt-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Nós fazemos o resto.
        </motion.p>

        {/* Text input for YouTube URL or search */}
        <motion.div
          className="mt-10 w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div
            className={`flex items-center border transition-colors duration-200 ${
              isFocused ? "border-primary neon-glow" : "border-border"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="cole um link do YouTube ou digite o nome do vídeo"
              className="flex-1 bg-transparent px-4 py-3 text-sm font-system text-foreground placeholder:text-muted-foreground outline-none"
            />
            {textInput.trim() && (
              <button
                onClick={handleTextSubmit}
                className="px-4 py-3 text-primary font-display text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Triturar
              </button>
            )}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground font-system text-xs uppercase tracking-[0.2em]">
            ou
          </span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* File upload button */}
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 border border-border px-6 py-3 text-muted-foreground font-system text-xs uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          arraste ou clique para enviar arquivo
        </motion.button>
      </div>

      {/* Bottom signature */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <span className="font-display text-xs text-muted-foreground tracking-[0.3em] uppercase">
          Guilhotina
        </span>
      </motion.div>
    </motion.div>
  );
};

export default DropZone;
