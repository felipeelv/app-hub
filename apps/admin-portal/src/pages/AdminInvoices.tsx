import { useState } from "react";
import { useListAdminInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/components/card";
import { Badge } from "@workspace/shared-ui/components/badge";
import { Input } from "@workspace/shared-ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/shared-ui/components/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");
const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
};

export function AdminInvoices() {
  const { data: invoices = [] } = useListAdminInvoices({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.requesterCompanyName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.finalPrice ?? 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.finalPrice ?? 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Faturas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendente de Recebimento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{fmtMoney(totalPending)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmtMoney(totalPaid)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Buscar por serviço ou empresa..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="max-w-sm" 
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead className="hidden sm:table-cell">Prestador</TableHead>
                <TableHead className="text-right hidden md:table-cell">Base</TableHead>
                <TableHead className="text-right hidden md:table-cell">Desl.</TableHead>
                <TableHead className="text-right hidden lg:table-cell text-amber-600">Comissão</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right hidden lg:table-cell text-green-600">Prestador recebe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Gerada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Nenhuma fatura encontrada</TableCell></TableRow>
              )}
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.serviceName}</TableCell>
                  <TableCell>{inv.requesterCompanyName}</TableCell>
                  <TableCell className="hidden sm:table-cell">{inv.providerCompanyName}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{fmtMoney(inv.basePrice)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{fmtMoney(inv.travelCost)}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-amber-600">{fmtMoney(inv.commissionAmount)}</TableCell>
                  <TableCell className="text-right font-bold">{fmtMoney(inv.finalPrice)}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-green-600">{fmtMoney(inv.providerReceivable)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status ?? "pending"]}`}>
                      {statusLabels[inv.status ?? "pending"]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{fmtDate(inv.generatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
