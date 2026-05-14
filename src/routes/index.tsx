import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Trophy, ThumbsDown, User, CalendarDays, MessageSquare, Flame, Target } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [corneta, setCorneta] = useState<{ [key: string]: string }>({});

  const { data: myPlayer } = useQuery({
    queryKey: ["my-player-home", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: recentMatches } = useQuery({
    queryKey: ["recent-matches-played"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data: latestMatch } = await supabase.from("matches").select("match_date").lte("match_date", now).order("match_date", { ascending: false }).limit(1).maybeSingle();
      if (!latestMatch) return [];
      const { data: matches } = await supabase.from("matches").select("*").eq("match_date", latestMatch.match_date).order("created_at", { ascending: true });
      return matches || [];
    },
  });

  const { data: allPlayers } = useQuery({
    queryKey: ["all-players-voting"],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").order("name", { ascending: true });
      return data;
    },
  });

  const { data: rankingMvp } = useQuery({
    queryKey: ["ranking-mvp-anual"],
    queryFn: async () => {
      const { data } = await supabase.from("match_votes" as any).select(`voted_player_id, player:players!match_votes_voted_player_id_fkey(name, nickname)`).eq("type", "best_player");
      const map = new Map();
      data?.forEach((v: any) => {
        const id = v.voted_player_id;
        const name = v.player?.nickname || v.player?.name || "Desconhecido";
        if (!map.has(id)) map.set(id, { name, total: 0 });
        map.get(id).total++;
      });
      return [...map.values()].sort((a, b) => b.total - a.total);
    },
  });

  const { data: rankingBolaMurcha } = useQuery({
    queryKey: ["ranking-bola-anual"],
    queryFn: async () => {
      const { data } = await supabase.from("match_votes" as any).select(`voted_player_id, comment, player:players!match_votes_voted_player_id_fkey(name, nickname)`).eq("type", "bola_murcha");
      const map = new Map();
      data?.forEach((v: any) => {
        const id = v.voted_player_id;
        const name = v.player?.nickname || v.player?.name || "Desconhecido";
        if (!map.has(id)) map.set(id, { name, total: 0, comments: [] });
        if (v.comment) map.get(id).comments.push(v.comment);
        map.get(id).total++;
      });
      return [...map.values()].sort((a, b) => b.total - a.total);
    },
  });

  async function vote(matchId: string, votedPlayerId: string, type: "best_player" | "bola_murcha") {
    if (!user || !myPlayer) return toast.error("Vínculo de jogador não encontrado.");
    if (votedPlayerId === myPlayer.id) return toast.error("Não pode votar em si mesmo!");

    const comment = type === "bola_murcha" ? corneta[`${matchId}-${votedPlayerId}`] : null;

    const { error } = await supabase.from("match_votes" as any).upsert({
      match_id: matchId,
      voter_player_id: myPlayer.id,
      voted_player_id: votedPlayerId,
      type,
      comment
    } as any, { onConflict: "match_id,voter_player_id,type" });

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(type === "best_player" ? "Voto de craque registrado!" : "Corneta enviada com sucesso!");
      qc.invalidateQueries({ queryKey: ["ranking-mvp-anual"] });
      qc.invalidateQueries({ queryKey: ["ranking-bola-anual"] });
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-4 border-primary pb-6">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none flex items-center gap-4">
            ARENA RESENHA <Flame className="text-orange-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 font-bold uppercase text-xs tracking-[0.2em]">Onde os mitos se encontram e os pernas de pau choram</p>
        </div>
      </header>

      {/* JOGOS E VOTAÇÃO */}
      <div className="grid gap-8">
        {recentMatches?.map((match, idx) => (
          <section key={match.id} className="rounded-3xl border bg-card shadow-2xl overflow-hidden border-primary/20">
            <div className="bg-primary p-2 text-center text-[10px] font-black text-white uppercase tracking-widest">
              CONVOCAÇÃO PARA A CORNETA - JOGO #{idx + 1}
            </div>
            
            <div className="p-8">
              <div className="flex justify-around items-center mb-8">
                <div className="text-center"><h3 className="font-black text-xl italic">RESENHA FC</h3></div>
                <div className="bg-black text-white px-6 py-2 rounded-xl font-black text-4xl italic">{match.our_score} x {match.opponent_score}</div>
                <div className="text-center"><h3 className="font-black text-xl italic text-muted-foreground">{match.opponent}</h3></div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* MVP */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-black text-yellow-600 uppercase italic"><Target size={18}/> Quem foi o Brabo?</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allPlayers?.map(p => (
                      <Button key={p.id} variant="outline" className="h-10 text-[10px] font-bold uppercase border-yellow-500/30 hover:bg-yellow-500 hover:text-white" onClick={() => vote(match.id, p.id, "best_player")}>
                        {p.nickname || p.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* BOLA MURCHA COM CORNETA */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-black text-red-600 uppercase italic"><MessageSquare size={18}/> Muro das Lamentações (Bola Murcha)</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {allPlayers?.map(p => (
                      <div key={p.id} className="flex flex-col gap-1 border p-2 rounded-xl bg-muted/20">
                        <span className="text-[10px] font-black uppercase ml-1">{p.nickname || p.name}</span>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Motivo da corneta..." 
                            className="h-8 text-[10px]" 
                            onChange={(e) => setCorneta(prev => ({ ...prev, [`${match.id}-${p.id}`]: e.target.value }))}
                          />
                          <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => vote(match.id, p.id, "bola_murcha")}>
                            <ThumbsDown size={14}/>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* PÓDIO VISUAL MVP */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic uppercase text-center flex items-center justify-center gap-3">
           <Trophy className="text-yellow-500"/> Pódio da Temporada
        </h2>
        <div className="grid grid-cols-3 items-end gap-2 max-w-2xl mx-auto h-64 text-white text-center">
          {/* 2º LUGAR */}
          <div className="bg-slate-400 rounded-t-3xl p-4 h-[70%] flex flex-col justify-between shadow-lg">
            <span className="font-black text-lg">2º</span>
            <span className="font-bold text-xs uppercase truncate">{rankingMvp?.[1]?.name || "-"}</span>
            <div className="text-[10px] bg-black/20 rounded-full py-1">{rankingMvp?.[1]?.total || 0} pts</div>
          </div>
          {/* 1º LUGAR */}
          <div className="bg-yellow-500 rounded-t-3xl p-4 h-[100%] flex flex-col justify-between shadow-2xl border-x-4 border-t-4 border-yellow-300">
             <Trophy className="mx-auto text-yellow-200" size={32}/>
             <span className="font-black text-xl uppercase truncate">{rankingMvp?.[0]?.name || "-"}</span>
             <div className="text-sm bg-black/20 rounded-full py-2 font-black italic">{rankingMvp?.[0]?.total || 0} VOTOS</div>
          </div>
          {/* 3º LUGAR */}
          <div className="bg-orange-700 rounded-t-3xl p-4 h-[50%] flex flex-col justify-between shadow-lg">
            <span className="font-black text-lg">3º</span>
            <span className="font-bold text-xs uppercase truncate">{rankingMvp?.[2]?.name || "-"}</span>
            <div className="text-[10px] bg-black/20 rounded-full py-1">{rankingMvp?.[2]?.total || 0} pts</div>
          </div>
        </div>
      </div>

      {/* MURAL DA CORNETA (BOLA MURCHA) */}
      <div className="rounded-3xl border bg-card p-8">
        <h2 className="text-2xl font-black uppercase mb-6 italic flex items-center gap-2">
          <MessageSquare className="text-red-500"/> Mural da Corneta (Últimos Votos)
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {rankingBolaMurcha?.filter(p => p.comments.length > 0).map((p: any) => (
            <div key={p.name} className="bg-red-500/5 border-l-4 border-red-500 p-4 rounded-r-xl">
              <span className="font-black text-[10px] uppercase text-red-600 italic">{p.name}</span>
              <p className="text-xs italic text-muted-foreground mt-1">"{p.comments[p.comments.length - 1]}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}