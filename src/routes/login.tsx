import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trophy, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Estados locais para garantir re-renderização imediata
  const [mode, setMode] = useState<"in" | "up">("in");
  const [localLoading, setLocalLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página
    
    const email = emailRef.current?.value.trim() || "";
    const password = passwordRef.current?.value || "";

    if (!email || !password) {
      return toast.error("Preencha todos os campos");
    }

    setLocalLoading(true);

    try {
      const result = mode === "in" 
        ? await signIn(email, password) 
        : await signUp(email, password);

      if (result?.error) {
        const msg = typeof result.error === 'string' ? result.error : result.error.message;
        toast.error(msg === "Invalid login credentials" ? "E-mail ou senha incorretos" : msg);
        setLocalLoading(false);
      } else {
        toast.success(mode === "in" ? "Sucesso!" : "Verifique seu e-mail");
        if (mode === "in") {
          setTimeout(() => { window.location.href = "/"; }, 500);
        } else {
          setLocalLoading(false);
          setMode("in");
        }
      }
    } catch (err) {
      toast.error("Erro de conexão");
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-[#141414] p-8 shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {mode === "in" ? "Entrar" : "Criar Conta"}
          </h2>
        </div>

        {/* Alternador de Modo (Tabs) */}
        <div className="flex gap-2 rounded-xl bg-black/50 p-1.5 border border-white/5">
          <button
            type="button"
            onClick={() => setMode("in")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${mode === "in" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => setMode("up")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${mode === "up" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            CADASTRO
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 ml-1">E-mail</label>
            <input
              ref={emailRef}
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 ml-1">Senha</label>
            <input
              ref={passwordRef}
              type="password"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            {localLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> PROCESSANDO...
              </span>
            ) : (
              mode === "in" ? "ACESSAR AGORA" : "FINALIZAR CADASTRO"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}