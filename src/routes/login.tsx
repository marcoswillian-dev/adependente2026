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
  
  // Estado para alternar entre 'in' (login) e 'up' (cadastro)
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
        toast.error(msg === "Invalid login credentials" ? "E-mail ou senha incorretos" : msg);
        setLocalLoading(false);
      } else {
        if (mode === "up") {
          toast.success("Cadastro realizado! Tente fazer o login agora.");
          setMode("in");
          setLocalLoading(false);
        } else {
          toast.success("Login realizado!");
          setTimeout(() => { window.location.href = "/"; }, 500);
        }
      }
    } catch (err) {
      toast.error("Erro ao conectar com o servidor");
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-[#111] p-8 shadow-2xl">
        
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">
            {mode === "in" ? "Acessar Conta" : "Criar Registro"}
          </h2>
        </div>

        {/* BOTÕES DE TROCA - Verifique se ao clicar o estado muda no seu console */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => { console.log("Mudando para Login"); setMode("in"); }}
            className={`rounded-lg py-3 text-xs font-black transition-all ${mode === "in" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"}`}
          >
            ENTRAR
          </button>
          <button
            type="button"
            onClick={() => { console.log("Mudando para Cadastro"); setMode("up"); }}
            className={`rounded-lg py-3 text-xs font-black transition-all ${mode === "up" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"}`}
          >
            CADASTRE-SE
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">E-mail</label>
            <input
              ref={emailRef}
              type="email"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Senha</label>
            <input
              ref={passwordRef}
              type="password"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-xl shadow-blue-600/10"
          >
            {localLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : mode === "in" ? "LOGAR NO SISTEMA" : "FINALIZAR MEU CADASTRO"}
          </button>
        </form>
      </div>
    </div>
  );
}