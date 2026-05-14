import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Trophy,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const { signIn, signUp } = useAuth();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"in" | "up">("in");

  const [localLoading, setLocalLoading] =
    useState(false);

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.value = "";
    }

    if (passwordRef.current) {
      passwordRef.current.value = "";
    }
  }, [mode]);

  const handleAuth = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (localLoading) return;

    const email =
      emailRef.current?.value.trim() || "";

    const password =
      passwordRef.current?.value || "";

    if (!email || !password) {
      toast.error(
        "Preencha todos os campos"
      );
      return;
    }

    setLocalLoading(true);

    try {

      // =========================
      // LOGIN
      // =========================

      if (mode === "in") {

        const result = await signIn(
          email,
          password
        );

        if (result.error) {
          toast.error(
            result.error.message
          );

          setLocalLoading(false);

          return;
        }

        toast.success(
          "Login realizado!"
        );

        navigate({
          to: "/",
        });

        return;
      }

      // =========================
      // CADASTRO
      // =========================

      const result = await signUp(
        email,
        password
      );

      if (result.error) {
        toast.error(
          result.error.message
        );

        setLocalLoading(false);

        return;
      }

      const userId =
        result.data?.user?.id;

      if (userId) {

        // procura jogador já cadastrado
        const { data: player } =
          await supabase
            .from("players")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        // se encontrou jogador -> vincula user_id
        if (player?.id) {

          await supabase
            .from("players")
            .update({
              user_id: userId,
            })
            .eq("id", player.id);

          toast.success(
            "Conta criada e vinculada ao jogador!"
          );

        } else {

          // cria jogador automaticamente
          await supabase
            .from("players")
            .insert([
              {
                name: email.split("@")[0],
                email,
                user_id: userId,
                active: true,
              },
            ]);

          toast.success(
            "Conta criada com sucesso!"
          );
        }
      }

      setMode("in");

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao autenticar"
      );

    } finally {

      setLocalLoading(false);

    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">

      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-10 shadow-2xl">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">

            <Trophy className="h-8 w-8 text-white" />

          </div>

          <h1 className="text-3xl font-black text-white">

            {mode === "in"
              ? "Entrar"
              : "Criar Conta"}

          </h1>

          <p className="mt-2 text-sm text-zinc-400">

            Sistema do Time

          </p>

        </div>

        <div className="mb-6 flex gap-2 rounded-xl bg-black/40 p-1">

          <button
            type="button"
            onClick={() =>
              !localLoading &&
              setMode("in")
            }
            className={`flex-1 rounded-lg py-3 text-sm font-bold transition ${
              mode === "in"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >

            <LogIn className="mr-2 inline h-4 w-4" />

            LOGIN

          </button>

          <button
            type="button"
            onClick={() =>
              !localLoading &&
              setMode("up")
            }
            className={`flex-1 rounded-lg py-3 text-sm font-bold transition ${
              mode === "up"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >

            <UserPlus className="mr-2 inline h-4 w-4" />

            CADASTRO

          </button>

        </div>

        <form
          onSubmit={handleAuth}
          className="space-y-5"
        >

          <input
            ref={emailRef}
            type="email"
            placeholder="Seu e-mail"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
          />

          <input
            ref={passwordRef}
            type="password"
            placeholder="Sua senha"
            autoComplete={
              mode === "in"
                ? "current-password"
                : "new-password"
            }
            className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={localLoading}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >

            {localLoading ? (

              <div className="flex items-center justify-center gap-2">

                <Loader2 className="h-5 w-5 animate-spin" />

                PROCESSANDO...

              </div>

            ) : mode === "in" ? (

              "ENTRAR"

            ) : (

              "CRIAR CONTA"

            )}

          </button>

        </form>

      </div>

    </div>
  );
}