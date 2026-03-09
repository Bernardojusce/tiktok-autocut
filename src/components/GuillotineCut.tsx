import { motion } from "framer-motion";

interface GuillotineCutProps {
  onComplete: () => void;
}

const GuillotineCut = ({ onComplete }: GuillotineCutProps) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {/* The cut line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-primary neon-glow"
        style={{ top: "50%", transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Top half splits up */}
      <motion.div
        className="absolute inset-0 bottom-1/2 bg-background"
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Bottom half splits down */}
      <motion.div
        className="absolute inset-0 top-1/2 bg-background"
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
};

export default GuillotineCut;
