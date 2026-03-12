import { useGetProviderFinancial } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendingUp, TrendingDown, Truck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");
const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

export function ProviderFinancial() {
  const { data } = useGetProviderFinancial();

  if (!data) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Financeiro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> A Receber</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{fmtMoney(data.totalReceivable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Total Recebido</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmtMoney(data.totalReceived)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Truck className="h-4 w-4" /> Total Deslocamento</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmtMoney(data.totalTravelCost)}</p></CardContent>
        </Card>
      </div>

      {data.pendingWorkOrders && data.pendingWorkOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Ordens Aguardando Repasse</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Desl.</TableHead>
                  <TableHead className="text-right">A Receber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingWorkOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.serviceName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.location}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-right">{fmtMoney(o.basePrice)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(o.travelCost)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{fmtMoney(o.providerReceivable)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {data.payouts && data.payouts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Histórico de Repasses Recebidos</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Ordens</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-right font-bold text-green-600">{fmtMoney(p.amount)}</TableCell>
                    <TableCell>{p.workOrderIds?.length ?? 0} OS(s)</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                    <TableCell>{fmtDate(p.paidAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {(!data.pendingWorkOrders?.length && !data.payouts?.length) && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma movimentação financeira registrada ainda.</p>
        </div>
      )}
    </div>
  );
}
