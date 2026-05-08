import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (mode: "in" | "up") => {
    setLoading(true);
    const { error } = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) return toast.error(error);
    if (mode === "up") {
      toast.success("Conta criada! Verifique seu e-mail se necessário.");
    } else {
      toast.success("Bem-vindo!");
      window.location.href = "/perfil";
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
          <p className="text-sm text-muted-foreground">Jogadores e admin acessam por aqui. O primeiro cadastro vira admin.</p>
        </div>
        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="in">Entrar</TabsTrigger>
            <TabsTrigger value="up">Criar conta</TabsTrigger>
          </TabsList>
          {(["in", "up"] as const).map(m => (
            <TabsContent key={m} value={m} className="space-y-4 pt-4">
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Senha</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={() => handle(m)} disabled={loading || !email || !password}>
                {m === "in" ? "Entrar" : "Criar conta"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}