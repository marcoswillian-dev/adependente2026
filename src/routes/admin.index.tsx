import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

// Definição da rota limpa para o gerador reconhecer
export const Route = createFileRoute("/admin/")({
  component: PlayersAdmin,
});

function PlayersAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

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
    if (!confirm("Excluir este atleta?")) return;
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["admin-players"] });
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
        <h1 className="text-2xl font-black italic uppercase text-primary">Gestão de Atletas</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="font-bold uppercase italic"><Plus className="mr-2 h-4 w-4" /> Novo Atleta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-black uppercase italic">Cadastro de Atleta</DialogTitle>
            </DialogHeader>
            <PlayerForm 
              player={editing} 
              onDone={() => { 
                setOpen(false); 
                qc.invalidateQueries({ queryKey: ["admin-players"] }); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players?.map((p) => (
          <div key={p.id} className="p-5 border rounded-2xl flex items-center justify-between bg-card hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex flex-col">
              <span className="font-black uppercase italic text-lg">{p.nickname || p.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {p.position || "Sem posição"} {p.jersey_number ? `• Nº ${p.jersey_number}` : ""}
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="rounded-full" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="rounded-full text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerForm({ player, onDone }: { player: any; onDone: () => void }) {
  const [form, setForm] = useState({
    name: player?.name ?? "",
    nickname: player?.nickname ?? "",
    position: player?.position ?? "",
    jersey_number: player?.jersey_number?.toString() ?? "",
    email: player?.email ?? "",
  });

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    
    // Forçamos o tipo 'any' aqui para evitar o erro de 'never' no campo email
    const payload: any = { 
      name: form.name.trim(),
      nickname: form.nickname.trim() || null,
      position: form.position.trim() || null,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      email: form.email.trim() || null,
      active: true
    };

    const { error } = player 
      ? await supabase.from("players").update(payload).eq("id", player.id)
      : await supabase.from("players").insert([payload]);

    if (error) {
      toast.error(error.message);
    } else { 
      toast.success("Dados salvos!"); 
      onDone(); 
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase ml-1">Nome Completo</Label>
        <Input className="rounded-xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase ml-1">Apelido</Label>
          <Input className="rounded-xl" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase ml-1">Nº Camisa</Label>
          <Input className="rounded-xl" type="number" value={form.jersey_number} onChange={e => setForm({...form, jersey_number: e.target.value})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase ml-1">Posição</Label>
        <Input className="rounded-xl" value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase ml-1">E-mail</Label>
        <Input className="rounded-xl" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
      </div>
      <Button className="w-full h-12 font-black uppercase italic rounded-xl mt-2" onClick={save}>
        {player ? "Atualizar Atleta" : "Cadastrar Atleta"}
      </Button>
    </div>
  );
}