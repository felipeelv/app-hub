import { useLocation } from "wouter";
import { useGetProviderDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/shared-ui/components/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Inbox, Loader, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/format";

export function ProviderDashboard() {
  const { data } = useGetProviderDashboard();
  const [, navigate] = useLocation();

  if (!data) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1"><Inbox className="h-4 w-4" /> Novas Ordens</CardTitle></CardHeader>
          <CardContent><p className="text-2xl md:text-3xl font-bold">{data.newOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1"><Loader className="h-4 w-4" /> Em Andamento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl md:text-3xl font-bold text-orange-500">{data.inProgress}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> A Receber</CardTitle></CardHeader>
          <CardContent><p className="text-xl md:text-2xl font-bold text-yellow-600">{formatCurrency(data.totalReceivable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs md:text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total Recebido</CardTitle></CardHeader>
          <CardContent><p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(data.totalReceived)}</p></CardContent>
        </Card>
      </div>

      {data.recentWorkOrders && data.recentWorkOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base md:text-lg">Ordens Recentes</CardTitle></CardHeader>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="hidden sm:table-cell">Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right hidden md:table-cell">A Receber</TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentWorkOrders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/work-orders/${o.id}`)}>
                    <TableCell className="font-medium">{o.serviceName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{o.location}</TableCell>
                    <TableCell><StatusBadge status={o.status} lang="pt" /></TableCell>
                    <TableCell className="text-right font-medium text-green-600 hidden md:table-cell">{formatCurrency(o.providerReceivable)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDateShort(o.requestedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
