import { useGetProviderFinancial } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/shared-ui/components/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendingUp, TrendingDown, Truck, Clock } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/format";

export function ProviderFinancial() {
  const { data } = useGetProviderFinancial();

  if (!data) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Financeiro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> A Receber</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{formatCurrency(data.totalReceivable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Total Recebido</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalReceived)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Truck className="h-4 w-4" /> Total Taxas de Deslocamento</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalTravelCost)}</p></CardContent>
        </Card>
      </div>

      {data.pendingWorkOrders && data.pendingWorkOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Ordens Aguardando Pagamento</h2>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="hidden sm:table-cell">Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Base</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Deslocamento</TableHead>
                    <TableHead className="text-right">A Receber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingWorkOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.serviceName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{o.location}</TableCell>
                      <TableCell><StatusBadge status={o.status} lang="pt" /></TableCell>
                      <TableCell className="text-right hidden md:table-cell">{formatCurrency(o.basePrice)}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{formatCurrency(o.travelCost)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatCurrency(o.providerReceivable)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {data.payouts && data.payouts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Histórico de Repasses</h2>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Ordens</TableHead>
                    <TableHead className="hidden sm:table-cell">Observações</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-right font-bold text-green-600">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.workOrderIds?.length ?? 0} OS(s)</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.notes || "—"}</TableCell>
                      <TableCell>{formatDateShort(p.paidAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {(!data.pendingWorkOrders?.length && !data.payouts?.length) && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma atividade financeira registrada ainda.</p>
        </div>
      )}
    </div>
  );
}
