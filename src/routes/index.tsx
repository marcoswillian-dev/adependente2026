import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: team } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data } = await supabase.from("team_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [{ count: players }, { count: matches }, goalsRes, winsRes] = await Promise.all([
        supabase.from("players").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("match_goals").select("goals"),
        supabase.from("matches").select("our_score, opponent_score"),
      ]);
      const totalGoals = (goalsRes.data ?? []).reduce((s, g) => s + g.goals, 0);
      const wins = (winsRes.data ?? []).filter(m => m.our_score > m.opponent_score).length;
      return { players: players ?? 0, matches: matches ?? 0, goals: totalGoals, wins };
    },
  });

  const { data: topScorers } = useQuery({
    queryKey: ["top-scorers-home"],
    queryFn: async () => {
      const { data } = await supabase.from("match_goals").select("goals, player:players(id,name,nickname,photo_url)");
      const map = new Map<string, { name: string; nickname: string | null; photo: string | null; goals: number }>();
      (data ?? []).forEach((g: any) => {
        if (!g.player) return;
        const cur = map.get(g.player.id) ?? { name: g.player.name, nickname: g.player.nickname, photo: g.player.photo_url, goals: 0 };
        cur.goals += g.goals;
        map.set(g.player.id, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.goals - a.goals).slice(0, 5);
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent 0 80px, oklch(0.97 0.01 150 / 0.05) 80px 81px)"
        }} />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {team?.logo_url && (
              <img src={team.logo_url} alt={team.name} className="mx-auto mb-6 h-32 w-32 rounded-full object-cover ring-4 ring-primary/40" style={{ boxShadow: "var(--shadow-glow)" }} />
            )}
            <h1 className="font-display text-6xl tracking-wider md:text-8xl">
              <span className="text-primary">{team?.name ?? "MEU TIME"}</span>
            </h1>
            {team?.description && (
              <p className="mt-4 text-lg text-muted-foreground">{team.description}</p>
            )}
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              A central completa do nosso clube. Acompanhe elenco, resultados, gols e o ranking dos craques.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/jogos">
                <Button size="lg" className="font-semibold">Ver Jogos</Button>
              </Link>
              <Link to="/ranking" search={{ tab: "goals" }}>
                <Button size="lg" variant="outline">Ranking</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Users />} label="Jogadores" value={stats?.players ?? 0} />
          <StatCard icon={<Calendar />} label="Jogos" value={stats?.matches ?? 0} />
          <StatCard icon={<Target />} label="Gols" value={stats?.goals ?? 0} />
          <StatCard icon={<Trophy />} label="Vitórias" value={stats?.wins ?? 0} />
        </div>
      </section>

      {/* Top scorers */}
      <section className="container mx-auto px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl">ARTILHEIROS</h2>
            <p className="text-sm text-muted-foreground">Top 5 do clube</p>
          </div>
          <Link to="/ranking" search={{ tab: "goals" }} className="text-sm text-primary hover:underline">Ver tudo →</Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-2" style={{ boxShadow: "var(--shadow-card)" }}>
          {(topScorers ?? []).length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Nenhum gol registrado ainda.</p>
          ) : topScorers?.map((p, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl p-4 hover:bg-secondary/50">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-xl ${i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                {i + 1}
              </div>
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-secondary" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{p.nickname || p.name}</p>
                {p.nickname && <p className="text-xs text-muted-foreground">{p.name}</p>}
              </div>
              <div className="font-display text-3xl text-primary">{p.goals}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <p className="font-display text-4xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}