import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  const handle = async () => {
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!email || !password) return toast.error("Preencha email e senha");
    setLoading(true);
    const { error } = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) return toast.error(error);
    if (mode === "up") {
      toast.success("Conta criada!");
    } else {
      toast.success("Bem-vindo!");
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl tracking-wider">ENTRAR</h1>
        </div>
        <div className="mb-4 flex rounded-xl border border-border overflow-hidden">
          <button className={`flex-1 py-2 text-sm font-bold ${mode === "in" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`} onClick={() => setMode("in")}>Entrar</button>
          <button className={`flex-1 py-2 text-sm font-bold ${mode === "up" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`} onClick={() => setMode("up")}>Criar conta</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">E-mail</label>
            <input ref={emailRef} type="email" className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium">Senha</label>
            <input ref={passwordRef} type="password" className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          </div>
          <Button className="w-full" onClick={handle} disabled={loading}>
            {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
        </div>
      </div>
    </div>
  );
}