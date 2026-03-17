import { useState } from "react";
import {
  useListTravelPricingRules,
  useCreateTravelPricingRule,
  useUpdateTravelPricingRule,
  useDeleteTravelPricingRule,
  useGetCommissionSettings,
  useUpdateCommissionSettings,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Pencil, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  cep_prefix: "Prefixo CEP",
  region_name: "Nome de Região",
  fixed: "Fixo",
};

export function AdminTravelPricing() {
  const { data: rules = [], refetch } = useListTravelPricingRules();
  const { data: commSettings, refetch: refetchComm } = useGetCommissionSettings();
  const createRule = useCreateTravelPricingRule();
  const updateRule = useUpdateTravelPricingRule();
  const deleteRule = useDeleteTravelPricingRule();
  const updateComm = useUpdateCommissionSettings();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [commRate, setCommRate] = useState<string>("");
  const [form, setForm] = useState({ name: "", ruleType: "cep_prefix", matchValue: "", price: "", description: "", isActive: true });

  const handleCreate = async () => {
    try {
      await createRule.mutateAsync({ data: { ...form, ruleType: form.ruleType as "cep_prefix" | "region_name" | "fixed", price: parseFloat(form.price) } });
      toast({ title: "Regra criada com sucesso" });
      setOpen(false);
      setForm({ name: "", ruleType: "cep_prefix", matchValue: "", price: "", description: "", isActive: true });
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível criar a regra.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(undefined as any);
      refetch();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleSaveComm = async () => {
    try {
      await updateComm.mutateAsync({ data: { defaultRate: parseFloat(commRate || String(commSettings?.defaultRate ?? 15)) } });
      toast({ title: "Comissão atualizada!" });
      refetchComm();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Precificação de Deslocamento</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Percent className="h-4 w-4" /> Comissão do Intermediador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>Taxa de Comissão (%)</Label>
              <Input
                type="number"
                className="w-32"
                value={commRate || (commSettings?.defaultRate ?? 15)}
                onChange={(e) => setCommRate(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveComm}>Salvar</Button>
            <p className="text-sm text-muted-foreground pb-2">Ex: 15 = 15% sobre o preço base do serviço</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Regras de Deslocamento</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Regra de Deslocamento</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.ruleType} onValueChange={(v) => setForm({ ...form, ruleType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cep_prefix">Prefixo CEP</SelectItem>
                    <SelectItem value="region_name">Nome de Região</SelectItem>
                    <SelectItem value="fixed">Fixo (qualquer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor de Correspondência (ex: "01" para CEPs 01xxx)</Label><Input value={form.matchValue} onChange={(e) => setForm({ ...form, matchValue: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Descrição (opcional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleCreate} disabled={!form.name || !form.price} className="w-full">Criar Regra</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Correspondência</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma regra configurada</TableCell></TableRow>
            )}
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell><Badge variant="outline">{typeLabels[rule.ruleType ?? ""] ?? rule.ruleType}</Badge></TableCell>
                <TableCell className="font-mono text-sm">{rule.matchValue}</TableCell>
                <TableCell className="text-right font-medium">R$ {Number(rule.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Ativa" : "Inativa"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{rule.description || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
