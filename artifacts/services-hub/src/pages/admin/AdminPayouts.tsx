import { useState } from "react";
import { useListAdminPayouts, useListAdminWorkOrders, useListProviderCompanies, useRegisterPayout } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");
const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

export function AdminPayouts() {
  const { data: payouts = [], refetch } = useListAdminPayouts();
  const { data: workOrders = [] } = useListAdminWorkOrders({});
  const { data: providers = [] } = useListProviderCompanies();
  const registerPayout = useRegisterPayout();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedWOs, setSelectedWOs] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const total = payouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const eligibleOrders = workOrders.filter(
    (o) => o.status === "paid" && o.providerCompanyId === selectedProvider
  );

  const toggleWO = (id: string) => {
    setSelectedWOs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRegister = async () => {
    try {
      await registerPayout.mutateAsync({
        providerCompanyId: selectedProvider,
        workOrderIds: selectedWOs,
        amount: parseFloat(amount),
        notes,
      });
      toast({ title: "Repasse registrado!", description: `R$ ${amount} repassado com sucesso.` });
      setOpen(false);
      setSelectedProvider("");
      setSelectedWOs([]);
      setAmount("");
      setNotes("");
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível registrar o repasse.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Repasses aos Prestadores</h1>
          <p className="text-sm text-muted-foreground mt-1">Total repassado: <span className="font-bold text-green-600">{fmtMoney(total)}</span></p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-1" /> Registrar Repasse</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Repasse</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Prestador</Label>
                <Select onValueChange={(v) => { setSelectedProvider(v); setSelectedWOs([]); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar prestador..." /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {selectedProvider && eligibleOrders.length > 0 && (
                <div>
                  <Label>Ordens elegíveis (status: pago)</Label>
                  <div className="border rounded-md mt-1 max-h-48 overflow-y-auto">
                    {eligibleOrders.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer text-sm">
                        <Checkbox checked={selectedWOs.includes(o.id)} onCheckedChange={() => toggleWO(o.id)} />
                        <span className="flex-1">{o.serviceName} — {o.location}</span>
                        <span className="text-green-600 font-medium">{fmtMoney(o.providerReceivable)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Valor do Repasse (R$)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button onClick={handleRegister} disabled={!selectedProvider || !amount} className="w-full">Confirmar Repasse</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prestador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Ordens</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum repasse registrado</TableCell></TableRow>
            )}
            {payouts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.providerCompanyName}</TableCell>
                <TableCell className="text-right font-bold text-green-600">{fmtMoney(p.amount)}</TableCell>
                <TableCell>{p.workOrderIds?.length ?? 0} OS(s)</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.notes || "—"}</TableCell>
                <TableCell>{fmtDate(p.paidAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
