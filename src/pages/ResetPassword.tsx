import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <motion.div
        className="w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-foreground text-2xl font-bold tracking-tight text-center">
          Nova senha
        </h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="nova senha"
            required
            minLength={6}
            className="w-full bg-transparent border border-border px-4 py-3 text-sm font-system text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-primary bg-primary text-primary-foreground px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Atualizar senha"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
