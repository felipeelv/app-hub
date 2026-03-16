import { useState } from "react";
import { useListProviderCatalog, useCreateCatalogItem } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/components/card";
import { Button } from "@workspace/shared-ui/components/button";
import { Input } from "@workspace/shared-ui/components/input";
import { Label } from "@workspace/shared-ui/components/label";
import { Badge } from "@workspace/shared-ui/components/badge";
import { Switch } from "@workspace/shared-ui/components/switch";
import { Textarea } from "@workspace/shared-ui/components/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/components/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/shared-ui/components/table";
import { PlusCircle } from "lucide-react";
import { useToast } from "@workspace/shared-ui/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

const emptyForm = { name: "", description: "", category: "", estimatedDays: "", basePrice: "", isAvailable: true, regions: "" };

export function ProviderCatalog() {
  const { data: items = [], refetch } = useListProviderCatalog();
  const createItem = useCreateCatalogItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Meu Catálogo</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(emptyForm)}>
              <PlusCircle className="h-4 w-4 mr-1" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader><DialogTitle>Adicionar Serviço</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Nome do Serviço *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Categoria *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: HVAC, Elétrica, Pintura..." /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Preço Base ($) *</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
                <div><Label>Dias Estimados</Label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} /></div>
              </div>
              <div><Label>Áreas de Atuação (separadas por vírgula)</Label><Input value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} placeholder="Orlando, Kissimmee, Sanford..." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                <Label>Disponível para agendamento</Label>
              </div>
              <Button onClick={handleSave} disabled={!form.name || !form.category || !form.basePrice} className="w-full">Salvar Serviço</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Preço Base</TableHead>
                <TableHead className="hidden md:table-cell">Dias Est.</TableHead>
                <TableHead className="hidden lg:table-cell">Áreas</TableHead>
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
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.basePrice)}</TableCell>
                  <TableCell className="hidden md:table-cell">{item.estimatedDays ? `${item.estimatedDays} dia(s)` : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{item.regions?.join(", ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.isAvailable ? "default" : "secondary"}>{item.isAvailable ? "Disponível" : "Indisponível"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
