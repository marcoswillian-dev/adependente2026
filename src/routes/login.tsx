import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  console.log("LOGIN PAGE RENDERIZOU");

  const { signIn, signUp } = useAuth();

  console.log("AUTH CARREGADO");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  useEffect(() => {
    console.log("LOGIN PAGE MONTADA");

    return () => {
      console.log("LOGIN PAGE DESMONTADA");
    };
  }, []);

  useEffect(() => {
    console.log("MODE ALTERADO:", mode);
  }, [mode]);

  useEffect(() => {
    console.log("LOADING ALTERADO:", loading);
  }, [loading]);

  const handle = async () => {
    console.log("HANDLE INICIADO");

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    console.log("EMAIL:", email);
    console.log("PASSWORD LENGTH:", password.length);

    if (!email || !password) {
      console.log("EMAIL OU SENHA VAZIOS");
      return toast.error("Preencha email e senha");
    }

    setLoading(true);

    try {
      console.log("INICIANDO AUTH");

      const result =
        mode === "in"
          ? await signIn(email, password)
          : await signUp(email, password);

      console.log("RESULTADO AUTH:", result);

      if (result.error) {
        console.error("ERRO AUTH:", result.error);
        toast.error(result.error);
        return;
      }

      if (mode === "up") {
        console.log("CONTA CRIADA");
        toast.success("Conta criada com sucesso!");
      } else {
        console.log("LOGIN REALIZADO");
        toast.success("Login realizado!");
      }
    } catch (err) {
      console.error("ERRO GERAL:", err);
      toast.error("Erro inesperado");
    } finally {
      console.log("FINALIZANDO LOADING");
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>

          <h1 className="font-display text-3xl tracking-wider">
            ENTRAR
          </h1>
        </div>

        <div className="mb-4 flex overflow-hidden rounded-xl border border-border">
          <button
            className={`flex-1 py-2 text-sm font-bold ${
              mode === "in"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
            onClick={() => {
              console.log("MODO LOGIN");
              setMode("in");
            }}
          >
            Entrar
          </button>

          <button
            className={`flex-1 py-2 text-sm font-bold ${
              mode === "up"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
            onClick={() => {
              console.log("MODO CADASTRO");
              setMode("up");
            }}
          >
            Criar conta
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              E-mail
            </label>

            <input
              ref={emailRef}
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
              onFocus={() => console.log("INPUT EMAIL FOCADO")}
              onChange={(e) =>
                console.log("EMAIL DIGITANDO:", e.target.value)
              }
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
              style={{ pointerEvents: "auto" }}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Senha
            </label>

            <input
              ref={passwordRef}
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              onFocus={() => console.log("INPUT SENHA FOCADO")}
              onChange={(e) =>
                console.log("SENHA DIGITANDO")
              }
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none"
              style={{ pointerEvents: "auto" }}
            />
          </div>

          <button
            onClick={handle}
            disabled={loading}
            className="w-full rounded-xl bg-blue-500 py-2 text-white font-semibold"
          >
            {loading
              ? "Aguarde..."
              : mode === "in"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}