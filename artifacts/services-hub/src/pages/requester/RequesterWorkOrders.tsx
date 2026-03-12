import { useState } from "react";
import { useLocation } from "wouter";
import { useListRequesterWorkOrders } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: ptBR }) : "—";
const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");

type SimplifiedStatus = "solicitado" | "aguardando" | "concluido" | "cancelado";

function toSimplified(status: string | undefined | null): SimplifiedStatus {
  switch (status) {
    case "requested":
    case "accepted":
      return "solicitado";
    case "in_progress":
      return "aguardando";
    case "completed":
    case "invoiced":
    case "paid":
    case "paid_out":
    case "closed":
      return "concluido";
    case "cancelled":
      return "cancelado";
    default:
      return "solicitado";
  }
}

function SimplifiedBadge({ status }: { status: string | undefined | null }) {
  const simplified = toSimplified(status);
  if (simplified === "solicitado") {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        Solicitado
      </Badge>
    );
  }
  if (simplified === "aguardando") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        Aguardando
      </Badge>
    );
  }
  if (simplified === "concluido") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        Concluído
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
      Cancelado
    </Badge>
  );
}

export function RequesterWorkOrders() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"all" | SimplifiedStatus>("all");
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useListRequesterWorkOrders({});

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || toSimplified(o.status) === statusFilter;
    const matchSearch =
      o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      o.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Minhas Solicitações</h1>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar por serviço ou local..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="solicitado">Solicitado</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
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
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/requester/work-orders/${o.id}`)}
              >
                <TableCell className="font-medium">{o.serviceName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{o.location}</TableCell>
                <TableCell>
                  <SimplifiedBadge status={o.status} />
                </TableCell>
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
