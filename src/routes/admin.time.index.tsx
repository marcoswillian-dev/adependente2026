import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Shield, Loader2 } from "lucide-react";

// 1. CORREÇÃO DA ROTA: O componente deve ser o TeamSettings
export const Route = createFileRoute("/admin/time/")({ 
  component: TeamSettings 
});

function TeamSettings() {
  const qc = useQueryClient();
  
  const { data: team, isLoading } = useQuery({
    queryKey: ["team-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ name: "", description: "", logo_url: "", founded_year: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (team) setForm({
      name: team.name ?? "",
      description: team.description ?? "",
      logo_url: team.logo_url ?? "",
      founded_year: team.founded_year?.toString() ?? "",
    });
  }, [team]);

  const upload = async (file: File) => {
    setUploading(true);
    // Limpeza de nome de arquivo para evitar erros no Storage do Supabase
    const path = `team/logo-${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    
    const { error: uploadError } = await supabase.storage.from("team").upload(path, file);
    
    if (uploadError) {
      setUploading(false);
      return toast.error("Erro no upload: " + uploadError.message);
    }

    const { data } = supabase.storage.from("team").getPublicUrl(path);
    setForm(f => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
    toast.success("Escudo carregado!");
  };

  const save = async () => {
    if (!team?.id) return toast.error("Configurações não encontradas");

    const { error } = await supabase.from("team_settings").update({
      name: form.name.trim() || "Meu Time",
      description: form.description.trim() || null,
      logo_url: form.logo_url || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", team.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Informações do time atualizadas!");
      qc.invalidateQueries({ queryKey: ["team-admin"] });
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary mb-1">Configurações do Time</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Identidade Visual e Informações</p>

        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-4 bg-secondary/10 rounded-2xl border border-dashed border-primary/20">
          <div className="relative group">
            {form.logo_url ? (
              <img src={form.logo_url} className="h-32 w-32 rounded-full object-cover ring-4 ring-primary shadow-xl" />
            ) : (
              <div className="h-32 w-32 rounded-full bg-secondary flex items-center justify-center">
                <Shield className="h-16 w-16 text-muted-foreground opacity-20" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 flex-1 items-center md:items-start">
            <h3 className="font-black uppercase italic text-lg">Escudo do Clube</h3>
            <Label className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase italic text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando…" : "Trocar Escudo"}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
            </Label>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">PNG ou JPG (Recomendado: 512x512px)</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase ml-1">Nome Oficial</Label>
              <Input className="rounded-xl h-12" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase ml-1">Ano de Fundação</Label>
              <Input className="rounded-xl h-12" type="number" value={form.founded_year} onChange={e => setForm({ ...form, founded_year: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase ml-1">Descrição / História</Label>
            <Textarea className="rounded-xl min-h-[120px] resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Conte um pouco sobre o clube..." />
          </div>

          <Button className="w-full h-14 text-lg font-black uppercase italic rounded-2xl shadow-lg shadow-primary/20" onClick={save}>
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}