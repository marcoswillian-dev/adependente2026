import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import {
  format,
  isAfter,
  startOfDay,
} from "date-fns";

import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import {
  Check,
  X,
  HelpCircle,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/jogos")({
  component: Matches,
});

type Status =
  | "vou"
  | "nao_vou"
  | "talvez";

function Matches() {

  const { user } = useAuth();

  const qc = useQueryClient();

  const { data: myPlayer } = useQuery({
    queryKey: ["my-player", user?.id],

    enabled: !!user,

    queryFn: async () => {

      const { data } = await supabase
        .from("players")
        .select(
          "id,name,nickname"
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      return data;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["matches-public"],

    queryFn: async () => {

      const { data } = await supabase
        .from("matches")
        .select(`
          *,
          match_goals (
            goals,
            player:players (
              id,
              name,
              nickname,
              photo_url
            )
          ),
          match_participations (
            player:players (
              id,
              name,
              nickname
            )
          ),
          match_attendance (
            status,
            player:players (
              id,
              name,
              nickname
            )
          )
        `)
        .order("match_date", {
          ascending: false,
        });

      return data ?? [];
    },
  });

  const setAttendance = async (
    matchId: string,
    status: Status
  ) => {

    if (!myPlayer) {

      return toast.error(
        "Vincule seu perfil em /perfil primeiro"
      );
    }

    const { error } =
      await supabase
        .from("match_attendance")
        .upsert(
          {
            match_id: matchId,
            player_id: myPlayer.id,
            status,
          },
          {
            onConflict:
              "match_id,player_id",
          }
        );

    if (error) {

      return toast.error(
        error.message
      );
    }

    toast.success(
      "Presença atualizada!"
    );

    qc.invalidateQueries({
      queryKey: ["matches-public"],
    });
  };

  const today = startOfDay(
    new Date()
  );

  const upcoming =
    matches?.filter(
      (m) =>
        isAfter(
          new Date(m.match_date),
          today
        ) ||
        +new Date(m.match_date) ===
          +today
    ) ?? [];

  const past =
    matches?.filter(
      (m) =>
        !(
          isAfter(
            new Date(m.match_date),
            today
          ) ||
          +new Date(m.match_date) ===
            +today
        )
    ) ?? [];

  return (
    <div className="container mx-auto px-4 py-12">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h1 className="font-display text-5xl tracking-wider">
            JOGOS
          </h1>

          <p className="text-muted-foreground">
            Confirme sua presença e veja o histórico
          </p>

        </div>

      </div>

      {user && !myPlayer && (

        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">

          Para confirmar presença,{" "}

          <Link
            to="/perfil"
            className="font-bold text-primary underline"
          >
            vincule seu nome de jogador
          </Link>

          .

        </div>

      )}

      {!user && (

        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">

          <Link
            to="/login"
            className="font-bold text-primary underline"
          >
            Faça login
          </Link>{" "}

          para confirmar presença nos próximos jogos.

        </div>

      )}

      {upcoming.length > 0 && (
        <>

          <h2 className="mb-3 font-display text-2xl tracking-wider text-primary">

            PRÓXIMOS

          </h2>

          <div className="mb-10 space-y-4">

            {upcoming.map((m) => (

              <UpcomingCard
                key={m.id}
                m={m}
                myPlayerId={myPlayer?.id}
                onSet={(s) =>
                  setAttendance(
                    m.id,
                    s
                  )
                }
                canConfirm={!!myPlayer}
              />

            ))}

          </div>

        </>
      )}

      <h2 className="mb-3 font-display text-2xl tracking-wider">

        HISTÓRICO

      </h2>

      <div className="space-y-4">

        {past.length === 0 && (

          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">

            Nenhum jogo no histórico.

          </div>

        )}

        {past.map((m) => {

          const win =
            m.our_score >
            m.opponent_score;

          const draw =
            m.our_score ===
            m.opponent_score;

          return (

            <div
              key={m.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{
                boxShadow:
                  "var(--shadow-card)",
              }}
            >

              <div className="flex items-center justify-between border-b border-border px-6 py-3 text-sm">

                <span className="text-muted-foreground">

                  {format(
                    new Date(
                      m.match_date
                    ),
                    "EEEE, d 'de' MMMM yyyy",
                    {
                      locale: ptBR,
                    }
                  )}

                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    win
                      ? "bg-primary/20 text-primary"
                      : draw
                      ? "bg-accent/20 text-accent"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >

                  {win
                    ? "VITÓRIA"
                    : draw
                    ? "EMPATE"
                    : "DERROTA"}

                </span>

              </div>

              <div className="grid grid-cols-3 items-center gap-4 px-6 py-6">

                <div className="text-right">

                  <p className="font-display text-2xl">
                    MEU TIME
                  </p>

                </div>

                <div className="text-center font-display text-5xl">

                  <span className="text-primary">
                    {m.our_score}
                  </span>

                  <span className="mx-3 text-muted-foreground">
                    ×
                  </span>

                  <span>
                    {m.opponent_score}
                  </span>

                </div>

                <div>

                  <p className="font-display text-2xl">
                    {m.opponent}
                  </p>

                </div>

              </div>

              {(m.match_goals.length > 0 ||
                m.location ||
                m.notes) && (

                <div className="space-y-4 border-t border-border bg-secondary/30 px-6 py-4 text-sm">

                  {/* GOLS */}

                  {m.match_goals.length >
                    0 && (

                    <div>

                      <p className="mb-2 font-bold uppercase text-primary">

                        ⚽ Artilheiros

                      </p>

                      <div className="space-y-2">

                        {m.match_goals.map(
                          (
                            g: any,
                            index: number
                          ) => (

                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                            >

                              {g.player
                                ?.photo_url && (

                                <img
                                  src={
                                    g.player
                                      .photo_url
                                  }
                                  className="h-10 w-10 rounded-full object-cover"
                                />

                              )}

                              <div className="flex-1">

                                <p className="font-bold uppercase">

                                  {g.player
                                    ?.nickname ||
                                    g.player
                                      ?.name}

                                </p>

                              </div>

                              <div className="text-right">

                                <p className="text-xl font-black text-primary">

                                  {g.goals}

                                </p>

                                <p className="text-[10px] uppercase text-muted-foreground">

                                  gol
                                  {g.goals >
                                  1
                                    ? "s"
                                    : ""}

                                </p>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* PARTICIPANTES */}

                  {m.match_participations
                    .length > 0 && (

                    <div>

                      <p className="mb-2 font-bold uppercase text-primary">

                        👥 Participaram

                      </p>

                      <p className="text-muted-foreground">

                        {m.match_participations
                          .map(
                            (p: any) =>
                              p.player
                                ?.nickname ||
                              p.player
                                ?.name
                          )
                          .join(", ")}

                      </p>

                    </div>

                  )}

                  {/* LOCAL */}

                  {m.location && (

                    <p className="text-muted-foreground">

                      📍 {m.location}

                    </p>

                  )}

                  {/* OBS */}

                  {m.notes && (

                    <p className="italic text-muted-foreground">

                      {m.notes}

                    </p>

                  )}

                </div>

              )}

            </div>

          );
        })}

      </div>

    </div>
  );
}

function UpcomingCard({
  m,
  myPlayerId,
  onSet,
  canConfirm,
}: {
  m: any;
  myPlayerId?: string;
  onSet: (s: Status) => void;
  canConfirm: boolean;
}) {

  const att: any[] =
    m.match_attendance ?? [];

  const myStatus:
    | Status
    | undefined = att.find(
    (a) =>
      a.player?.id ===
      myPlayerId
  )?.status;

  const counts = {
    vou: att.filter(
      (a) =>
        a.status === "vou"
    ).length,

    talvez: att.filter(
      (a) =>
        a.status === "talvez"
    ).length,

    nao_vou: att.filter(
      (a) =>
        a.status ===
        "nao_vou"
    ).length,
  };

  const list = (
    s: Status
  ) =>
    att
      .filter(
        (a) => a.status === s
      )
      .map(
        (a) =>
          a.player?.nickname ||
          a.player?.name
      )
      .filter(Boolean);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-primary/30 bg-card"
      style={{
        boxShadow:
          "var(--shadow-card)",
      }}
    >

      <div className="border-b border-border bg-primary/10 px-6 py-3 text-sm font-semibold text-primary">

        {format(
          new Date(m.match_date),
          "EEEE, d 'de' MMMM",
          {
            locale: ptBR,
          }
        ).toUpperCase()}

      </div>

      <div className="grid grid-cols-3 items-center gap-4 px-6 py-6">

        <div className="text-right">

          <p className="font-display text-2xl">
            MEU TIME
          </p>

        </div>

        <div className="text-center font-display text-3xl text-muted-foreground">

          VS

        </div>

        <div>

          <p className="font-display text-2xl">
            {m.opponent}
          </p>

        </div>

      </div>

      {m.location && (

        <p className="px-6 pb-3 text-sm text-muted-foreground">

          📍 {m.location}

        </p>

      )}

      {canConfirm && (

        <div className="grid grid-cols-3 gap-2 border-t border-border bg-secondary/30 px-6 py-4">

          <Button
            variant={
              myStatus === "vou"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              onSet("vou")
            }
          >

            <Check className="h-4 w-4" />

            Vou

          </Button>

          <Button
            variant={
              myStatus ===
              "talvez"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              onSet("talvez")
            }
          >

            <HelpCircle className="h-4 w-4" />

            Talvez

          </Button>

          <Button
            variant={
              myStatus ===
              "nao_vou"
                ? "destructive"
                : "outline"
            }
            size="sm"
            onClick={() =>
              onSet("nao_vou")
            }
          >

            <X className="h-4 w-4" />

            Não vou

          </Button>

        </div>

      )}

      <div className="grid grid-cols-3 gap-px border-t border-border bg-border text-center text-sm">

        <Block
          label="Vou"
          color="text-primary"
          count={counts.vou}
          names={list("vou")}
        />

        <Block
          label="Talvez"
          color="text-accent"
          count={counts.talvez}
          names={list("talvez")}
        />

        <Block
          label="Não vão"
          color="text-destructive"
          count={counts.nao_vou}
          names={list("nao_vou")}
        />

      </div>

    </div>
  );
}

function Block({
  label,
  color,
  count,
  names,
}: {
  label: string;
  color: string;
  count: number;
  names: string[];
}) {

  return (
    <div className="bg-card p-4">

      <p
        className={`font-display text-3xl ${color}`}
      >

        {count}

      </p>

      <p className="text-xs uppercase tracking-wider text-muted-foreground">

        {label}

      </p>

      {names.length > 0 && (

        <p className="mt-2 text-xs text-muted-foreground">

          {names.join(", ")}

        </p>

      )}

    </div>
  );
}