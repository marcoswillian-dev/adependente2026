import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const Route = createFileRoute("/ranking")({
  validateSearch: (search) => ({ tab: (search.tab as string) ?? "goals" }),
  component: Ranking
});

type Period = "all" | "month" | "year";

function periodFilter(period: Period) {
  if (period === "all") return null;
  const d = new Date();
  if (period === "month") return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function Ranking() {
  const { tab } = Route.useSearch();
  const [period, setPeriod] = useState<Period>("all");
  const since = periodFilter(period);

  const { data: scorers } = useQuery({
    queryKey: ["ranking-goals", period],
    queryFn: async () => {
      let q = supabase.from("match_goals").select("goals, match:matches!inner(match_date), player:players(id,name,nickname,photo_url)");
      if (since) q = q.gte("match.match_date", since);
      const { data } = await q;
      const map = new Map<string, any>();
      (data ?? []).forEach((g: any) => {
        if (!g.player) return;
        const c = map.get(g.player.id) ?? { ...g.player, total: 0 };
        c.total += g.goals;
        map.set(g.player.id, c);
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  const { data: participations } = useQuery({
    queryKey: ["ranking-part", period],
    queryFn: async () => {
      let q = supabase.from("match_participations").select("match:matches!inner(match_date), player:players(id,name,nickname,photo_url)");
      if (since) q = q.gte("match.match_date", since);
      const { data } = await q;
      const map = new Map<string, any>();
      (data ?? []).forEach((p: any) => {
        if (!p.player) return;
        const c = map.get(p.player.id) ?? { ...p.player, total: 0 };
        c.total += 1;
        map.set(p.player.id, c);
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">RANKINGS</h1>
          <p className="text-muted-foreground">Quem manda no clube</p>
        </div>
        <Select value={period} onValueChange={v => setPeriod(v as Period)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o histórico</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue={tab ?? "goals"}>
        <TabsList>
          <TabsTrigger value="goals">⚽ Artilharia</TabsTrigger>
          <TabsTrigger value="participations">👕 Participações</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-4">
          <RankList items={scorers ?? []} unit="gols" />
        </TabsContent>
        <TabsContent value="participations" className="mt-4">
          <RankList items={participations ?? []} unit="jogos" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankList({ items, unit }: { items: any[]; unit: string }) {
  if (items.length === 0) return <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Sem dados no período.</div>;
  return (
    <div className="rounded-2xl border border-border bg-card p-2" style={{ boxShadow: "var(--shadow-card)" }}>
      {items.map((p, i) => (
        <div key={p.id} className="flex items-center gap-4 rounded-xl p-4 hover:bg-secondary/50">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-xl ${i === 0 ? "bg-accent text-accent-foreground" : i < 3 ? "bg-primary/20 text-primary" : "bg-secondary"}`}>{i + 1}</div>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-secondary" />}
          <div className="flex-1">
            <p className="font-semibold">{p.nickname || p.name}</p>
            {p.nickname && <p className="text-xs text-muted-foreground">{p.name}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-primary">{p.total}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
        </div>
      ))}
    </div>
  );
}