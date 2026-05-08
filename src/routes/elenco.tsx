import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/elenco")({ component: Squad });

function Squad() {
  const { data: players } = useQuery({
    queryKey: ["players-public"],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("active", true).order("jersey_number", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-5xl">ELENCO</h1>
      <p className="mb-8 text-muted-foreground">Conheça os atletas do clube</p>
      {players?.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhum jogador cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {players?.map(p => (
            <div key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="relative aspect-square overflow-hidden bg-secondary">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-6xl text-muted-foreground">
                    {p.name.charAt(0)}
                  </div>
                )}
                {p.jersey_number != null && (
                  <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-display text-2xl text-primary-foreground">
                    {p.jersey_number}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-semibold">{p.nickname || p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.position || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
