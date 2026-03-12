import { useGetProviderFinancial } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendingUp, TrendingDown, Truck, Clock } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/format";

export function ProviderFinancial() {
  const { data } = useGetProviderFinancial();

  if (!data) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Financials</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Receivable</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{formatCurrency(data.totalReceivable)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Total Received</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalReceived)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Truck className="h-4 w-4" /> Total Travel Fees</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalTravelCost)}</p></CardContent>
        </Card>
      </div>

      {data.pendingWorkOrders && data.pendingWorkOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Orders Pending Payout</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Travel</TableHead>
                  <TableHead className="text-right">Receivable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingWorkOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.serviceName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.location}</TableCell>
                    <TableCell><StatusBadge status={o.status} lang="en" /></TableCell>
                    <TableCell className="text-right">{formatCurrency(o.basePrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(o.travelCost)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(o.providerReceivable)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {data.payouts && data.payouts.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Payout History</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{p.workOrderIds?.length ?? 0} WO(s)</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.notes || "—"}</TableCell>
                    <TableCell>{formatDateShort(p.paidAt)}</TableCell>
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
          <p>No financial activity recorded yet.</p>
        </div>
      )}
    </div>
  );
}
