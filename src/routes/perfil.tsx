import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, User } from "lucide-react";

export const Route = createFileRoute("/perfil")({ component: PerfilPage });

function PerfilPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: myPlayer } = useQuery({
    queryKey: ["my-player", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: unowned } = useQuery({
    queryKey: ["unowned-players"],
    enabled: !!user && !myPlayer,
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").is("user_id", null).order("name");
      return data ?? [];
    },
  });

  const claim = async (playerId: string) => {
    const { error } = await supabase.from("players").update({ user_id: user!.id }).eq("id", playerId);
    if (error) return toast.error(error.message);
    toast.success("Perfil vinculado!");
    qc.invalidateQueries({ queryKey: ["my-player"] });
    qc.invalidateQueries({ queryKey: ["unowned-players"] });
  };

  if (loading || !user) return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-5xl tracking-wider">MEU PERFIL</h1>
      <p className="mb-8 text-muted-foreground">Vincule seu nome de jogador para confirmar presença nos jogos.</p>

      {myPlayer ? (
        <div className="rounded-2xl border border-primary/30 bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
              <UserCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Você está vinculado a</p>
              <p className="font-display text-2xl">{myPlayer.nickname || myPlayer.name}</p>
              {myPlayer.position && <p className="text-sm text-muted-foreground">{myPlayer.position} {myPlayer.jersey_number ? `· #${myPlayer.jersey_number}` : ""}</p>}
            </div>
          </div>
          <Button className="mt-6 w-full" onClick={() => navigate({ to: "/jogos" })}>Ver jogos e confirmar presença</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Selecione seu nome na lista do elenco:</p>
          {unowned?.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
              Nenhum jogador disponível. Peça ao admin para te cadastrar no elenco.
            </div>
          )}
          {unowned?.map(p => (
            <button key={p.id} onClick={() => claim(p.id)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-secondary">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-semibold">{p.nickname || p.name}</p>
                {p.position && <p className="text-xs text-muted-foreground">{p.position}</p>}
              </div>
              <span className="text-xs text-primary">Sou eu →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
