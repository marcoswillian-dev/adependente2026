import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trophy, Loader2, LogIn, UserPlus } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [localLoading, setLocalLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value.trim() || "";
    const password = passwordRef.current?.value || "";

    if (!email || !password) return toast.error("Preencha todos os campos");

    setLocalLoading(true);
    try {
      const result = mode === "in" 
        ? await signIn(email, password) 
        : await signUp(email, password);

      if (result?.error) {
        const msg = typeof result.error === 'string' ? result.error : result.error.message;
        toast.error(msg);
        setLocalLoading(false);
      } else {
        if (mode === "up") {
          toast.success("Cadastro realizado! Faça login agora.");
          setMode("in");
          setLocalLoading(false);
        } else {
          toast.success("Sucesso!");
          window.location.href = "/";
        }
      }
    } catch (err) {
      toast.error("Erro de conexão local");
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="relative z-50 w-full max-w-md space-y-8 rounded-[2rem] border border-white/5 bg-[#111] p-10 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            {mode === "in" ? "Acessar" : "Registrar"}
          </h1>
        </div>

        <div className="flex gap-2 rounded-xl bg-black/50 p-1 border border-white/5 relative z-50">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode("in"); }}
            className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all ${mode === "in" ? "bg-blue-600 text-white" : "text-gray-500"}`}
          >
            <LogIn className="inline h-4 w-4 mr-2" /> LOGIN
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode("up"); }}
            className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all ${mode === "up" ? "bg-blue-600 text-white" : "text-gray-500"}`}
          >
            <UserPlus className="inline h-4 w-4 mr-2" /> CADASTRO
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <input ref={emailRef} type="email" placeholder="E-mail" className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500" required />
          <input ref={passwordRef} type="password" placeholder="Senha" className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500" required />
          <button type="submit" disabled={localLoading} className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-500 disabled:opacity-50">
            {localLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : mode === "in" ? "ENTRAR AGORA" : "CRIAR MINHA CONTA"}
          </button>
        </form>
      </div>
    </div>
  );
}