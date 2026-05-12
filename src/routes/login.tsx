import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [localLoading, setLocalLoading] = useState(false);

  // LOG DE DEPURAÇÃO: Verifica se as chaves estão sendo lidas pelo Vite
  useEffect(() => {
    console.log("Supabase URL configurada:", !!import.meta.env.VITE_SUPABASE_URL);
    console.log("Supabase Key configurada:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  }, []);

  const handle = async () => {
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      return toast.error("Preencha email e senha");
    }

    // Ativamos o loading local para travar o botão apenas durante a requisição
    setLocalLoading(true);
    console.log(`Iniciando tentativa de ${mode === "in" ? "Login" : "Cadastro"}...`);

    try {
      const result = mode === "in" 
        ? await signIn(email, password) 
        : await signUp(email, password);

      if (result?.error) {
        console.error("Erro retornado pelo Supabase:", result.error);
        const message = typeof result.error === 'string' ? result.error : result.error.message;
        
        // Mapeamento de erros comuns para mensagens amigáveis
        if (message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(message);
        }
        
        setLocalLoading(false);
      } else {
        console.log("Sucesso na autenticação!");
        toast.success(mode === "in" ? "Login realizado!" : "Conta criada! Verifique seu e-mail.");
        
        if (mode === "in") {
          // Usamos um redirecionamento forçado para garantir a limpeza do estado
          setTimeout(() => {
            window.location.href = "/";
          }, 800);
        } else {
          setLocalLoading(false);
          setMode("in");
        }
      }
    } catch (err) {
      console.error("Erro fatal no componente de login:", err);
      toast.error("Erro de conexão. Verifique seu terminal.");
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero, linear-gradient(to bottom, #1a1a1a, #000))" }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {mode === "in" ? "BOAS-VINDAS" : "NOVA CONTA"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "in" ? "Entre com suas credenciais" : "Preencha os dados abaixo"}
          </p>
        </div>

        <div className="mb-6 flex p-1 rounded-xl border border-border bg-muted/50">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "in" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"}`} 
            onClick={() => setMode("in")}
            disabled={localLoading}
          >
            Entrar
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "up" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"}`} 
            onClick={() => setMode("up")}
            disabled={localLoading}
          >
            Cadastro
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">E-mail</label>
            <input 
              ref={emailRef} 
              type="email" 
              placeholder="seu@email.com" 
              className="w-full rounded-xl border border-input p-3 bg-background outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
              disabled={localLoading} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Senha</label>
            <input 
              ref={passwordRef} 
              type="password" 
              placeholder="••••••••" 
              className="w-full rounded-xl border border-input p-3 bg-background outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
              disabled={localLoading} 
            />
          </div>
          
          <button 
            onClick={handle} 
            disabled={localLoading} 
            className="group relative w-full overflow-hidden rounded-xl bg-blue-600 py-3.5 text-white font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {localLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Autenticando...
              </span>
            ) : (
              <span>{mode === "in" ? "Acessar Sistema" : "Criar Minha Conta"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}