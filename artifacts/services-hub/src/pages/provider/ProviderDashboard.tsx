import { useLocation } from "wouter";
import { useGetProviderDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Inbox, Loader, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/format";

export function ProviderDashboard() {
  const { data } = useGetProviderDashboard();
  const [, navigate] = useLocation();

  if (!data) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Inbox className="h-4 w-4" /> New Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.newOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Loader className="h-4 w-4" /> In Progress</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-orange-500">{data.inProgress}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Receivable</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{formatCurrency(data.totalReceivable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total Received</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalReceived)}</p></CardContent>
        </Card>
      </div>

      {data.recentWorkOrders && data.recentWorkOrders.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receivable</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentWorkOrders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/provider/work-orders/${o.id}`)}>
                  <TableCell className="font-medium">{o.serviceName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.location}</TableCell>
                  <TableCell><StatusBadge status={o.status} lang="en" /></TableCell>
                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(o.providerReceivable)}</TableCell>
                  <TableCell>{formatDateShort(o.requestedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
