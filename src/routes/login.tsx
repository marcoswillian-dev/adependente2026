import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, loading: authLoading } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"in" | "up">("in");

  const handle = async () => {
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      return toast.error("Preencha email e senha");
    }

    try {
      const result = mode === "in" 
        ? await signIn(email, password) 
        : await signUp(email, password);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "in" ? "Login realizado!" : "Conta criada!");
      }
    } catch (err) {
      toast.error("Erro inesperado");
    }
  };

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
          <button className={`flex-1 py-2 ${mode === "in" ? "bg-primary text-white" : ""}`} onClick={() => setMode("in")}>Entrar</button>
          <button className={`flex-1 py-2 ${mode === "up" ? "bg-primary text-white" : ""}`} onClick={() => setMode("up")}>Cadastro</button>
        </div>

        <div className="space-y-4">
          <input ref={emailRef} type="email" placeholder="E-mail" className="w-full rounded-xl border p-2 bg-secondary" disabled={authLoading} />
          <input ref={passwordRef} type="password" placeholder="Senha" className="w-full rounded-xl border p-2 bg-secondary" disabled={authLoading} />
          <button onClick={handle} disabled={authLoading} className="w-full rounded-xl bg-blue-600 py-2 text-white font-bold">
            {authLoading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}