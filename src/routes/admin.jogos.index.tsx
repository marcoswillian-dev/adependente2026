import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";

import {
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { format } from "date-fns";

export const Route = createFileRoute("/admin/jogos/")({
  component: MatchesAdmin,
});

function MatchesAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/login",
        search: { redirect: "/admin/jogos" },
      });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          match_goals(
            goals,
            player:players(name,nickname)
          )
        `)
        .order("match_date", { ascending: false });

      if (error) throw error;

      return data || [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Excluir este jogo?")) return;

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Jogo removido");

      qc.invalidateQueries({
        queryKey: ["admin-matches"],
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar jogos
          </div>

          <p className="mt-2 text-sm">
            {error instanceof Error
              ? error.message
              : "Erro inesperado"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between rounded-2xl border bg-card p-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic text-primary">
            Jogos
          </h1>

          <p className="text-sm text-muted-foreground">
            Gerencie partidas do time
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);

            if (!o) {
              setEditId(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo jogo
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Editar jogo" : "Novo jogo"}
              </DialogTitle>
            </DialogHeader>

            <MatchForm
              matchId={editId}
              onDone={() => {
                setOpen(false);
                setEditId(null);

                qc.invalidateQueries({
                  queryKey: ["admin-matches"],
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {matches?.map((m: any) => (
          <div
            key={m.id}
            className="rounded-2xl border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  {format(
                    new Date(m.match_date + "T12:00:00"),
                    "dd/MM/yyyy"
                  )}
                </div>

                <div className="text-xl font-black uppercase italic">
                  {m.opponent}
                </div>

                <div className="mt-1 text-sm font-bold">
                  {m.our_score} x {m.opponent_score}
                </div>

                {m.match_goals?.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    ⚽{" "}
                    {m.match_goals
                      .map(
                        (g: any) =>
                          `${g.player?.nickname || g.player?.name} (${g.goals})`
                      )
                      .join(", ")}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditId(m.id);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchForm({
  matchId,
  onDone,
}: {
  matchId: string | null;
  onDone: () => void;
}) {

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

  const { data: players } = useQuery({
    queryKey: ["players-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("id,name,nickname")
        .eq("active", true)
        .order("name");

      return data || [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["match-edit", matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const [{ data: m }, { data: parts }, { data: goals }] =
        await Promise.all([
          supabase
            .from("matches")
            .select("*")
            .eq("id", matchId!)
            .single(),

          supabase
            .from("match_participations")
            .select("player_id")
            .eq("match_id", matchId!),

          supabase
            .from("match_goals")
            .select("player_id, goals")
            .eq("match_id", matchId!),
        ]);

      return {
        m,
        parts: parts || [],
        goals: goals || [],
      };
    },
  });

  useEffect(() => {
    if (existing?.m) {
      setForm({
        match_date: existing.m.match_date,
        opponent: existing.m.opponent,
        our_score: String(existing.m.our_score),
        opponent_score: String(existing.m.opponent_score),
        location: existing.m.location || "",
        notes: existing.m.notes || "",
      });

      setParticipated(
        new Set(
          existing.parts.map((p: any) => p.player_id)
        )
      );

      setGoalsMap(
        new Map(
          existing.goals.map((g: any) => [
            g.player_id,
            g.goals,
          ])
        )
      );
    }
  }, [existing]);

  const togglePlayer = (id: string) => {
    const updated = new Set(participated);

    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    setParticipated(updated);
  };

  const setGoals = (
    playerId: string,
    goals: number
  ) => {
    const updated = new Map(goalsMap);

    if (goals <= 0) {
      updated.delete(playerId);
    } else {
      updated.set(playerId, goals);
    }

    setGoalsMap(updated);

    if (goals > 0 && !participated.has(playerId)) {
      togglePlayer(playerId);
    }
  };

  const save = async () => {
    if (!form.opponent.trim()) {
      return toast.error("Digite o adversário");
    }

    const payload = {
      match_date: form.match_date,
      opponent: form.opponent,
      our_score: Number(form.our_score),
      opponent_score: Number(form.opponent_score),
      location: form.location || null,
      notes: form.notes || null,
    };

    let currentMatchId = matchId;

    if (matchId) {
      const { error } = await supabase
        .from("matches")
        .update(payload)
        .eq("id", matchId);

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase
        .from("match_participations")
        .delete()
        .eq("match_id", matchId);

      await supabase
        .from("match_goals")
        .delete()
        .eq("match_id", matchId);

    } else {
      const { data, error } = await supabase
        .from("matches")
        .insert([payload])
        .select()
        .single();

      if (error || !data) {
        toast.error(error?.message || "Erro");
        return;
      }

      currentMatchId = data.id;
    }

    if (participated.size > 0) {
      const rows = Array.from(participated).map(
        (player_id) => ({
          match_id: currentMatchId!,
          player_id,
        })
      );

      await supabase
        .from("match_participations")
        .insert(rows);
    }

    if (goalsMap.size > 0) {
      const rows = Array.from(goalsMap.entries()).map(
        ([player_id, goals]) => ({
          match_id: currentMatchId!,
          player_id,
          goals,
        })
      );

      await supabase
        .from("match_goals")
        .insert(rows);
    }

    toast.success("Jogo salvo com sucesso!");

    onDone();
  };

  return (
    <div className="space-y-6 pt-4">

      <div className="grid grid-cols-2 gap-4">

        <div>
          <Label>Data</Label>

          <Input
            type="date"
            value={form.match_date}
            onChange={(e) =>
              setForm({
                ...form,
                match_date: e.target.value,
              })
            }
          />
        </div>

        <div>
          <Label>Adversário</Label>

          <Input
            value={form.opponent}
            onChange={(e) =>
              setForm({
                ...form,
                opponent: e.target.value,
              })
            }
          />
        </div>

        <div>
          <Label>Nosso placar</Label>

          <Input
            type="number"
            value={form.our_score}
            onChange={(e) =>
              setForm({
                ...form,
                our_score: e.target.value,
              })
            }
          />
        </div>

        <div>
          <Label>Placar adversário</Label>

          <Input
            type="number"
            value={form.opponent_score}
            onChange={(e) =>
              setForm({
                ...form,
                opponent_score: e.target.value,
              })
            }
          />
        </div>

      </div>

      <div>
        <Label>Local</Label>

        <Input
          value={form.location}
          onChange={(e) =>
            setForm({
              ...form,
              location: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Observações</Label>

        <Textarea
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />
      </div>

      <div className="rounded-2xl border p-4">
        <h3 className="mb-4 text-lg font-black uppercase text-primary">
          Participantes e gols
        </h3>

        <div className="space-y-3">

          {players?.map((player: any) => (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-xl border p-3"
            >

              <Checkbox
                checked={participated.has(player.id)}
                onCheckedChange={() =>
                  togglePlayer(player.id)
                }
              />

              <div className="flex-1">
                <div className="font-bold uppercase">
                  {player.nickname || player.name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">⚽</span>

                <Input
                  type="number"
                  min="0"
                  className="w-20"
                  placeholder="0"
                  value={goalsMap.get(player.id) || ""}
                  onChange={(e) =>
                    setGoals(
                      player.id,
                      Number(e.target.value)
                    )
                  }
                />
              </div>

            </div>
          ))}

        </div>
      </div>

      <Button className="w-full" onClick={save}>
        Salvar jogo
      </Button>

    </div>
  );
}