import { useState, useMemo } from "react";
import { useListAdminPayouts, useListAdminWorkOrders, useListProviderCompanies, useRegisterPayout } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, FileText } from "lucide-react";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");
const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

interface PendingProviderGroup {
  providerCompanyId: string;
  providerCompanyName: string;
  orders: Array<{
    id: string;
    serviceName: string;
    location: string;
    finalPrice: number | null;
    commissionAmount: number;
    providerReceivable: number | null;
  }>;
  totalFinalPrice: number;
  totalCommission: number;
  totalReceivable: number;
}

export function AdminPayouts() {
  const { data: payouts = [], refetch: refetchPayouts } = useListAdminPayouts();
  const { data: workOrders = [], refetch: refetchOrders, isLoading: loadingOrders } = useListAdminWorkOrders({});
  const { data: providers = [], isLoading: loadingProviders } = useListProviderCompanies();
  const registerPayout = useRegisterPayout();
  const { toast } = useToast();

  const [confirmGroup, setConfirmGroup] = useState<PendingProviderGroup | null>(null);

  const pendingGroups = useMemo(() => {
    const paidOrders = workOrders.filter((o) => o.status === "paid");
    const providerMap = new Map<string, PendingProviderGroup>();

    for (const order of paidOrders) {
      const pid = order.providerCompanyId;
      if (!pid) continue;

      if (!providerMap.has(pid)) {
        const provider = providers.find((p) => p.id === pid);
        providerMap.set(pid, {
          providerCompanyId: pid,
          providerCompanyName: provider?.name ?? order.providerCompanyName ?? "N/A",
          orders: [],
          totalFinalPrice: 0,
          totalCommission: 0,
          totalReceivable: 0,
        });
      }

      const group = providerMap.get(pid)!;
      const finalPrice = order.finalPrice ?? 0;
      const commission = order.commissionAmount ?? 0;
      const receivable = order.providerReceivable ?? 0;

      group.orders.push({
        id: order.id,
        serviceName: order.serviceName ?? "—",
        location: order.location ?? "—",
        finalPrice,
        commissionAmount: commission,
        providerReceivable: receivable,
      });

      group.totalFinalPrice += finalPrice;
      group.totalCommission += commission;
      group.totalReceivable += receivable;
    }

    return Array.from(providerMap.values()).filter((g) => g.orders.length > 0);
  }, [workOrders, providers]);

  const totalPaidOut = payouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const handleAuthorize = async (group: PendingProviderGroup) => {
    try {
      await registerPayout.mutateAsync({
        data: {
          providerCompanyId: group.providerCompanyId,
          workOrderIds: group.orders.map((o) => o.id),
          amount: group.totalReceivable,
          notes: "",
        },
      });
      toast({ title: "Repasse autorizado!", description: `${fmtMoney(group.totalReceivable)} repassado para ${group.providerCompanyName}.` });
      setConfirmGroup(null);
      refetchPayouts();
      refetchOrders();
    } catch {
      toast({ title: "Erro", description: "Não foi possível registrar o repasse.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Repasses aos Prestadores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Total repassado: <span className="font-bold text-green-600">{fmtMoney(totalPaidOut)}</span>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-orange-500" />
          Repasses Pendentes
        </h2>

        {(loadingOrders || loadingProviders) ? (
          <Card className="p-8 text-center text-muted-foreground">
            Carregando repasses pendentes...
          </Card>
        ) : pendingGroups.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum repasse pendente. Todas as ordens pagas já foram repassadas.
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingGroups.map((group) => (
              <Card key={group.providerCompanyId} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{group.providerCompanyName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {group.orders.length} OS(s) pendente(s)
                    </p>
                  </div>
                  <Button onClick={() => setConfirmGroup(group)} disabled={group.totalReceivable <= 0} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Autorizar Repasse
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Valor Pago pelo Cliente</p>
                    <p className="text-lg font-bold text-blue-700">{fmtMoney(group.totalFinalPrice)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Comissões/Taxas</p>
                    <p className="text-lg font-bold text-red-600">{fmtMoney(group.totalCommission)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Valor Líquido a Repassar</p>
                    <p className="text-lg font-bold text-green-700">{fmtMoney(group.totalReceivable)}</p>
                  </div>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead className="text-right">Valor Pago</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.serviceName}</TableCell>
                          <TableCell>{order.location}</TableCell>
                          <TableCell className="text-right">{fmtMoney(order.finalPrice)}</TableCell>
                          <TableCell className="text-right text-red-600">{fmtMoney(order.commissionAmount)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{fmtMoney(order.providerReceivable)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Histórico de Repasses</h2>
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

      <Dialog open={!!confirmGroup} onOpenChange={(open) => !open && setConfirmGroup(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Repasse</DialogTitle>
          </DialogHeader>
          {confirmGroup && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prestador</span>
                  <span className="font-medium">{confirmGroup.providerCompanyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ordens de Serviço</span>
                  <span className="font-medium">{confirmGroup.orders.length} OS(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Pago pelo Cliente</span>
                  <span className="font-medium">{fmtMoney(confirmGroup.totalFinalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Comissões/Taxas</span>
                  <span className="font-medium text-red-600">- {fmtMoney(confirmGroup.totalCommission)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Valor Líquido</span>
                  <span className="font-bold text-green-600 text-lg">{fmtMoney(confirmGroup.totalReceivable)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmGroup(null)}>Cancelar</Button>
            <Button
              onClick={() => confirmGroup && handleAuthorize(confirmGroup)}
              disabled={registerPayout.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {registerPayout.isPending ? "Processando..." : "Confirmar Repasse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
