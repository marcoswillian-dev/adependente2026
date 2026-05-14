import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  Pencil,
  Trash2,
  Loader2,
  Shield,
  Upload,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: PlayersAdmin,
});

function PlayersAdmin() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  const qc = useQueryClient();

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<any>(null);

  const [teamId, setTeamId] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");

  const [description, setDescription] = useState("");

  const [logoUrl, setLogoUrl] = useState("");

  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/login",
        search: { redirect: "/admin" },
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    const { data } = await supabase
      .from("team_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setTeamId(data.id);

      setTeamName(data.name || "");

      setDescription(data.description || "");

      setLogoUrl(data.logo_url || "");
    }
  }

  async function saveTeam() {
    if (!teamId) {
      const { error } = await supabase
        .from("team_settings")
        .insert([
          {
            name: teamName,
            description,
            logo_url: logoUrl,
          },
        ]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Time criado!");
        loadTeam();
      }

      return;
    }

    const { error } = await supabase
      .from("team_settings")
      .update({
        name: teamName,
        description,
        logo_url: logoUrl,
      })
      .eq("id", teamId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Time atualizado!");
    }
  }

  async function uploadBanner(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("team")
      .upload(fileName, file);

    if (error) {
      toast.error(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("team")
      .getPublicUrl(fileName);

    setLogoUrl(publicUrl);

    toast.success("Banner enviado!");
  }

  async function makeAdmin() {
    if (!adminEmail.trim()) {
      return toast.error("Digite o email");
    }

    const { data: player, error: playerError } =
      await supabase
        .from("players")
        .select("*")
        .eq("email", adminEmail)
        .maybeSingle();

    if (playerError) {
      return toast.error(playerError.message);
    }

    if (!player?.user_id) {
      return toast.error(
        "Usuário precisa fazer login primeiro"
      );
    }

    const { error } = await supabase
      .from("user_roles")
      .insert([
        {
          user_id: player.user_id,
          role: "admin",
        },
      ]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Novo admin criado!");
      setAdminEmail("");
    }
  }

  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-players"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []) as any[];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Excluir atleta?")) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Atleta removido");

      qc.invalidateQueries({
        queryKey: ["admin-players"],
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">

          <h1 className="text-4xl font-black uppercase">
            Painel Admin
          </h1>

          <p className="text-zinc-400 mt-2">
            Gerencie o time e jogadores
          </p>

          <div className="mt-6">
            <Link to="/admin/jogos">
              <Button className="gap-2">
                <Trophy className="h-4 w-4" />
                Gerenciar Jogos
              </Button>
            </Link>
          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-5">

            <h2 className="text-2xl font-black uppercase">
              Informações do Time
            </h2>

            <div className="space-y-2">
              <Label>Nome do Time</Label>

              <Input
                value={teamName}
                onChange={(e) =>
                  setTeamName(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>

              <Input
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Banner / Logo</Label>

              <Input
                type="file"
                onChange={uploadBanner}
              />

              {logoUrl && (
                <img
                  src={logoUrl}
                  className="h-56 w-full rounded-2xl object-cover"
                />
              )}
            </div>

            <Button
              onClick={saveTeam}
              className="w-full h-12 font-black uppercase"
            >
              <Upload className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-5">

            <h2 className="text-2xl font-black uppercase">
              Administradores
            </h2>

            <div className="space-y-2">
              <Label>Email do Usuário</Label>

              <Input
                placeholder="usuario@email.com"
                value={adminEmail}
                onChange={(e) =>
                  setAdminEmail(e.target.value)
                }
              />
            </div>

            <Button
              onClick={makeAdmin}
              className="w-full h-12 font-black uppercase"
            >
              <Shield className="mr-2 h-4 w-4" />
              Tornar Admin
            </Button>
          </div>

        </div>

        <div className="flex justify-between items-center rounded-3xl border border-white/10 bg-zinc-900 p-6">

          <h2 className="text-2xl font-black uppercase">
            Gestão de Atletas
          </h2>

          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);

              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Atleta
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Cadastro de Atleta
                </DialogTitle>
              </DialogHeader>

              <PlayerForm
                player={editing}
                onDone={() => {
                  setOpen(false);

                  qc.invalidateQueries({
                    queryKey: ["admin-players"],
                  });
                }}
              />
            </DialogContent>
          </Dialog>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {players?.map((p) => (

            <div
              key={p.id}
              className="rounded-3xl border border-white/10 bg-zinc-900 p-5"
            >

              {p.photo_url && (
                <img
                  src={p.photo_url}
                  className="mb-4 h-48 w-full rounded-2xl object-cover"
                />
              )}

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-black uppercase">
                    {p.nickname || p.name}
                  </h3>

                  <p className="text-sm text-zinc-400">
                    {p.position || "Sem posição"}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {p.email || "Sem email"}
                  </p>

                </div>

                <div className="flex gap-2">

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);

                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    </div>
  );
}

function PlayerForm({
  player,
  onDone,
}: {
  player: any;
  onDone: () => void;
}) {

  const [form, setForm] = useState({
    name: player?.name ?? "",
    nickname: player?.nickname ?? "",
    position: player?.position ?? "",
    jersey_number:
      player?.jersey_number?.toString() ?? "",
    photo_url: player?.photo_url ?? "",
    email: player?.email ?? "",
  });

  async function uploadPhoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("players")
      .upload(fileName, file);

    if (error) {
      toast.error(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("players")
      .getPublicUrl(fileName);

    setForm({
      ...form,
      photo_url: publicUrl,
    });

    toast.success("Foto enviada!");
  }

  const save = async () => {

    if (!form.name.trim()) {
      return toast.error("Nome obrigatório");
    }

    const payload: any = {
      name: form.name,
      nickname: form.nickname || null,
      position: form.position || null,
      jersey_number: form.jersey_number
        ? parseInt(form.jersey_number)
        : null,
      photo_url: form.photo_url || null,
      email: form.email || null,
      active: true,
    };

    const { error } = player
      ? await supabase
          .from("players")
          .update(payload)
          .eq("id", player.id)
      : await supabase
          .from("players")
          .insert([payload]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Atleta salvo!");
      onDone();
    }
  };

  return (
    <div className="space-y-4 pt-4">

      <div>
        <Label>Nome</Label>

        <Input
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Email</Label>

        <Input
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Apelido</Label>

        <Input
          value={form.nickname}
          onChange={(e) =>
            setForm({
              ...form,
              nickname: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Posição</Label>

        <Input
          value={form.position}
          onChange={(e) =>
            setForm({
              ...form,
              position: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Número</Label>

        <Input
          type="number"
          value={form.jersey_number}
          onChange={(e) =>
            setForm({
              ...form,
              jersey_number: e.target.value,
            })
          }
        />
      </div>

      <div>
        <Label>Foto do Jogador</Label>

        <Input
          type="file"
          onChange={uploadPhoto}
        />

        {form.photo_url && (
          <img
            src={form.photo_url}
            className="mt-4 h-48 w-full rounded-2xl object-cover"
          />
        )}
      </div>

      <Button
        onClick={save}
        className="w-full h-12"
      >
        {player ? "Atualizar" : "Cadastrar"}
      </Button>

    </div>
  );
}