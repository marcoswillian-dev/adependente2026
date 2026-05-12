import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [localLoading, setLocalLoading] = useState(false);

  const handle = async () => {
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      return toast.error("Preencha email e senha");
    }

    setLocalLoading(true);

    try {
      const result = mode === "in" 
        ? await signIn(email, password) 
        : await signUp(email, password);

      // Tratamento de erro robusto para evitar que o botão trave em "Aguarde"
      if (result?.error) {
        const message = typeof result.error === 'string' ? result.error : result.error.message;
        toast.error(message || "Falha na autenticação");
        setLocalLoading(false);
      } else {
        toast.success(mode === "in" ? "Login realizado!" : "Conta criada!");
        
        if (mode === "in") {
          // Pequeno delay para garantir que a sessão foi gravada no storage
          setTimeout(() => {
            // Em vez de navigate, usamos window.location para um "reset" limpo
            // Isso resolve o travamento visual do TanStack Router
            window.location.href = "/";
          }, 500);
        } else {
          setLocalLoading(false);
          setMode("in");
        }
      }
    } catch (err) {
      console.error("Erro no login:", err);
      toast.error("Erro inesperado ao conectar com o servidor");
      setLocalLoading(false);
    }
  };

  const isLoading = authLoading || localLoading;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{mode === "in" ? "ENTRAR" : "CRIAR CONTA"}</h1>
        </div>

        <div className="mb-4 flex rounded-xl border border-border overflow-hidden">
          <button 
            className={`flex-1 py-2 transition-colors ${mode === "in" ? "bg-primary text-white" : "hover:bg-secondary"}`} 
            onClick={() => setMode("in")}
            disabled={isLoading}
          >
            Entrar
          </button>
          <button 
            className={`flex-1 py-2 transition-colors ${mode === "up" ? "bg-primary text-white" : "hover:bg-secondary"}`} 
            onClick={() => setMode("up")}
            disabled={isLoading}
          >
            Cadastro
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <input 
              ref={emailRef} 
              type="email" 
              placeholder="exemplo@email.com" 
              className="w-full rounded-xl border p-2 bg-secondary outline-none focus:ring-2 focus:ring-primary" 
              disabled={isLoading} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input 
              ref={passwordRef} 
              type="password" 
              placeholder="••••••••" 
              className="w-full rounded-xl border p-2 bg-secondary outline-none focus:ring-2 focus:ring-primary" 
              disabled={isLoading} 
            />
          </div>
          
          <button 
            onClick={handle} 
            disabled={isLoading} 
            className="w-full rounded-xl bg-blue-600 py-3 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Aguarde...
              </span>
            ) : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}