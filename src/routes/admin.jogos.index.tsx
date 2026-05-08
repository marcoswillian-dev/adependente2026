import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Ajuste da rota para o novo padrão de pastas
export const Route = createFileRoute("/admin/jogos/")({ 
  component: MatchesAdmin 
});

function MatchesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: matches, isLoading, error } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: false });
      
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Excluir este jogo?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-bold uppercase italic">Buscando partidas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        <div className="flex items-center gap-2 font-black uppercase italic">
          <AlertCircle className="h-5 w-5" /> Erro de Conexão
        </div>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : "Erro no banco de dados"}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">JOGOS</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Histórico e Resultados</p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold uppercase italic">
              <Plus className="h-4 w-4" /> Registrar Jogo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic text-primary">
                {editId ? "Editar Partida" : "Nova Partida"}
              </DialogTitle>
            </DialogHeader>
            <MatchForm matchId={editId} onDone={() => { setOpen(false); setEditId(null); qc.invalidateQueries({ queryKey: ["admin-matches"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {matches?.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-50">
            <p className="font-bold uppercase italic text-muted-foreground">Nenhuma partida registrada</p>
          </div>
        )}
        {matches?.map((m: any) => (
          <div key={m.id} className="group flex items-center gap-6 rounded-2xl border bg-card p-5 shadow-sm hover:border-primary/50 transition-all">
            <div className="text-center bg-secondary/50 p-2 rounded-xl min-w-[80px]">
              <span className="block text-[10px] font-black text-muted-foreground uppercase">Data</span>
              <span className="font-bold text-sm">{format(new Date(m.match_date + 'T12:00:00'), "dd/MM/yy")}</span>
            </div>
            
            <div className="flex-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Adversário</span>
              <div className="text-xl font-black uppercase italic">{m.opponent}</div>
            </div>

            <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <span className="text-2xl font-black italic text-primary">{m.our_score}</span>
              <span className="font-bold text-muted-foreground">X</span>
              <span className="text-2xl font-black italic">{m.opponent_score}</span>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" onClick={() => { setEditId(m.id); setOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(m.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchForm({ matchId, onDone }: { matchId: string | null; onDone: () => void }) {
  const { data: existing } = useQuery({
    queryKey: ["match-edit", matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const [{ data: m }, { data: parts }, { data: goals }] = await Promise.all([
        supabase.from("matches").select("*").eq("id", matchId!).single(),
        supabase.from("match_participations").select("player_id").eq("match_id", matchId!),
        supabase.from("match_goals").select("player_id, goals").eq("match_id", matchId!),
      ]);
      return { m, parts: parts ?? [], goals: goals ?? [] };
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players-list"],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("id,name,nickname").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    match_date: new Date().toISOString().slice(0, 10),
    opponent: "",
    our_score: "0",
    opponent_score: "0",
    location: "",
    notes: "",
  });
  const [participated, setParticipated] = useState<Set<string>>(new Set());
  const [goalsMap, setGoalsMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (existing?.m) {
      setForm({
        match_date: existing.m.match_date,
        opponent: existing.m.opponent,
        our_score: String(existing.m.our_score),
        opponent_score: String(existing.m.opponent_score),
        location: existing.m.location ?? "",
        notes: existing.m.notes ?? "",
      });
      setParticipated(new Set(existing.parts.map((p: any) => p.player_id)));
      setGoalsMap(new Map(existing.goals.map((g: any) => [g.player_id, g.goals])));
    }
  }, [existing]);

  const togglePart = (id: string) => {
    const n = new Set(participated);
    n.has(id) ? n.delete(id) : n.add(id);
    setParticipated(n);
  };

  const setGoals = (id: string, g: number) => {
    const n = new Map(goalsMap);
    if (g <= 0) n.delete(id); else n.set(id, g);
    setGoalsMap(n);
    if (g > 0 && !participated.has(id)) togglePart(id);
  };

  const save = async () => {
    if (!form.opponent.trim()) return toast.error("Adversário obrigatório");
    
    const payload = {
      match_date: form.match_date,
      opponent: form.opponent.trim(),
      our_score: parseInt(form.our_score) || 0,
      opponent_score: parseInt(form.opponent_score) || 0,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    };

    let id = matchId;
    if (id) {
      const { error } = await supabase.from("matches").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
      await supabase.from("match_participations").delete().eq("match_id", id);
      await supabase.from("match_goals").delete().eq("match_id", id);
    } else {
      const { data, error } = await supabase.from("matches").insert(payload).select().single();
      if (error || !data) return toast.error(error?.message ?? "Erro ao salvar");
      id = data.id;
    }

    if (participated.size > 0) {
      await supabase.from("match_participations").insert(Array.from(participated).map(player_id => ({ match_id: id!, player_id })));
    }
    if (goalsMap.size > 0) {
      await supabase.from("match_goals").insert(Array.from(goalsMap.entries()).map(([player_id, goals]) => ({ match_id: id!, player_id, goals })));
    }

    toast.success("Jogo salvo com sucesso!");
    onDone();
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Data</Label><Input type="date" className="rounded-xl" value={form.match_date} onChange={e => setForm({ ...form, match_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Adversário *</Label><Input className="rounded-xl" placeholder="Nome do time" value={form.opponent} onChange={e => setForm({ ...form, opponent: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Placar (Nós)</Label><Input type="number" className="rounded-xl" value={form.our_score} onChange={e => setForm({ ...form, our_score: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Placar (Eles)</Label><Input type="number" className="rounded-xl" value={form.opponent_score} onChange={e => setForm({ ...form, opponent_score: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Local</Label><Input className="rounded-xl" placeholder="Estádio, Campo..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Observações</Label><Textarea className="rounded-xl" placeholder="Detalhes da partida..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

      <div className="border-t pt-4">
        <Label className="mb-3 block font-black uppercase italic text-primary">Relatório de Atletas</Label>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-border p-3 bg-secondary/10">
          {players?.length === 0 && <p className="text-xs text-center p-4">Cadastre jogadores primeiro para selecioná-los aqui.</p>}
          {players?.map(p => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-card transition-colors border border-transparent hover:border-border">
              <Checkbox id={`p-${p.id}`} checked={participated.has(p.id)} onCheckedChange={() => togglePart(p.id)} />
              <Label htmlFor={`p-${p.id}`} className="flex-1 text-sm font-bold uppercase cursor-pointer">{p.nickname || p.name}</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" placeholder="0" className="h-8 w-14 text-center rounded-lg"
                  value={goalsMap.get(p.id) ?? ""}
                  onChange={e => setGoals(p.id, parseInt(e.target.value) || 0)} />
                <span title="Gols marcados">⚽</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full h-14 text-lg font-black uppercase italic rounded-2xl shadow-lg shadow-primary/20 mt-4" onClick={save}>Finalizar Registro</Button>
    </div>
  );
}