import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
}

const DropZone = ({ onFileDrop }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        onFileDrop(file);
      }
    },
    [onFileDrop]
  );

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onFileDrop(file);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-background cursor-pointer"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <input
        ref={inputRef}
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
      <div className="text-center select-none">
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
        <motion.p
          className="text-muted-foreground font-system text-xs mt-8 uppercase tracking-[0.2em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          arraste ou clique para selecionar
        </motion.p>
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
