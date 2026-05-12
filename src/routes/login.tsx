import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react"; // Adicionado useEffect para debug
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

  // 1. Limpa os campos ao trocar de modo para evitar que o React "trave" com valores antigos
  useEffect(() => {
    if (emailRef.current) emailRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 2. Bloqueia cliques duplos se já estiver carregando
    if (localLoading) return;

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
          // 3. Use location.replace para garantir que o redirecionamento limpe o estado da página anterior
          window.location.replace("/");
        }
      }
    } catch (err) {
      toast.error("Erro de conexão local");
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      {/* 4. Aumentamos o z-index e garantimos que o formulário não interaja com o fundo */}
      <div className="relative z-[100] w-full max-w-md space-y-8 rounded-[2rem] border border-white/5 bg-[#111] p-10 shadow-2xl overflow-hidden">
        
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            {mode === "in" ? "Acessar" : "Registrar"}
          </h1>
        </div>

        {/* BOTOES DE ALTERNÂNCIA */}
        <div className="flex gap-2 rounded-xl bg-black/50 p-1 border border-white/5 relative z-50">
          <button
            type="button"
            // 5. Adicionado verificação de loading para não travar o estado durante o envio
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if(!localLoading) setMode("in"); 
            }}
            className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all duration-200 ${
              mode === "in" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            <LogIn className="inline h-4 w-4 mr-2" /> LOGIN
          </button>
          <button
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if(!localLoading) setMode("up"); 
            }}
            className={`flex-1 rounded-lg py-3 text-xs font-bold transition-all duration-200 ${
              mode === "up" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            <UserPlus className="inline h-4 w-4 mr-2" /> CADASTRO
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <input 
              ref={emailRef} 
              type="email" 
              placeholder="E-mail" 
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500 transition-colors" 
              required 
            />
            <input 
              ref={passwordRef} 
              type="password" 
              placeholder="Senha" 
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500 transition-colors" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={localLoading} 
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {localLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>PROCESSANDO...</span>
              </div>
            ) : (
              mode === "in" ? "ENTRAR AGORA" : "CRIAR MINHA CONTA"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}