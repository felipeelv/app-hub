import { useState } from "react";
import { useLocation } from "wouter";
import { useListRequesterWorkOrders } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";
const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");

export function RequesterWorkOrders() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useListRequesterWorkOrders({});

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      o.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Minhas Solicitações</h1>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar por serviço ou local..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="requested">Solicitado</SelectItem>
            <SelectItem value="accepted">Aceito</SelectItem>
            <SelectItem value="in_progress">Em execução</SelectItem>
            <SelectItem value="invoiced">Faturado</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Solicitado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</TableCell></TableRow>
            )}
            {filtered.map((o) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/requester/work-orders/${o.id}`)}>
                <TableCell className="font-medium">{o.serviceName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{o.location}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-right">{fmtMoney(o.finalPrice)}</TableCell>
                <TableCell>{fmtDate(o.requestedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
