import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Link de redefinição enviado para seu email.");
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
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
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-foreground text-2xl font-bold tracking-tight text-center">
          Guilhotina
        </h1>
        <p className="text-muted-foreground font-system text-xs text-center mt-2 uppercase tracking-[0.2em]">
          {mode === "login" ? "entrar" : mode === "signup" ? "criar conta" : "redefinir senha"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            className="w-full bg-transparent border border-border px-4 py-3 text-sm font-system text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="senha"
              required
              minLength={6}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm font-system text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-primary bg-primary text-primary-foreground px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider hover:bg-transparent hover:text-primary transition-colors disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "login"
              ? "Entrar"
              : mode === "signup"
              ? "Criar conta"
              : "Enviar link"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          {mode === "login" && (
            <>
              <button
                onClick={() => setMode("signup")}
                className="text-muted-foreground font-system text-xs hover:text-primary transition-colors"
              >
                Não tem conta? Criar uma
              </button>
              <button
                onClick={() => setMode("forgot")}
                className="text-muted-foreground font-system text-xs hover:text-primary transition-colors"
              >
                Esqueceu a senha?
              </button>
            </>
          )}
          {mode !== "login" && (
            <button
              onClick={() => setMode("login")}
              className="text-muted-foreground font-system text-xs hover:text-primary transition-colors"
            >
              Voltar ao login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
