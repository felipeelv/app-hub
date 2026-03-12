import { useState } from "react";
import { useListProviderCatalog, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");

const emptyForm = { name: "", description: "", category: "", estimatedDays: "", basePrice: "", isAvailable: true, regions: "" };

export function ProviderCatalog() {
  const { data: items = [], refetch } = useListProviderCatalog();
  const createItem = useCreateCatalogItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : undefined,
      basePrice: parseFloat(form.basePrice),
      isAvailable: form.isAvailable,
      regions: form.regions ? form.regions.split(",").map((r) => r.trim()) : [],
    };
    try {
      await createItem.mutateAsync(payload);
      toast({ title: "Serviço criado com sucesso!" });
      setOpen(false);
      setForm(emptyForm);
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar o serviço.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meu Catálogo de Serviços</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setEditId(null); }}>
              <PlusCircle className="h-4 w-4 mr-1" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Cadastrar Serviço</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Nome do Serviço *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Categoria *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: HVAC, Elétrica, Pintura..." /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço Base (R$) *</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
                <div><Label>Prazo Estimado (dias)</Label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} /></div>
              </div>
              <div><Label>Regiões Atendidas (separadas por vírgula)</Label><Input value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} placeholder="SP, ABC, Guarulhos..." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                <Label>Disponível para contratação</Label>
              </div>
              <Button onClick={handleSave} disabled={!form.name || !form.category || !form.basePrice} className="w-full">Salvar Serviço</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço Base</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Regiões</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.</TableCell></TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                </TableCell>
                <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                <TableCell className="text-right font-medium">{fmtMoney(item.basePrice)}</TableCell>
                <TableCell>{item.estimatedDays ? `${item.estimatedDays} dia(s)` : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.regions?.join(", ") || "—"}</TableCell>
                <TableCell>
                  <Badge variant={item.isAvailable ? "default" : "secondary"}>{item.isAvailable ? "Disponível" : "Indisponível"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
