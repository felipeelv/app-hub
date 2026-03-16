import { useState } from "react";
import { useLocation } from "wouter";
import { useListRequesterWorkOrders } from "@workspace/api-client-react";
import { Card } from "@workspace/shared-ui";
import { Input } from "@workspace/shared-ui";
import { Badge } from "@workspace/shared-ui";
import { Button } from "@workspace/shared-ui";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Search, Filter, ChevronDown } from "lucide-react";

type SimplifiedStatus = "requested" | "in_progress" | "completed" | "cancelled";

function toSimplified(status: string | undefined | null): SimplifiedStatus {
  switch (status) {
    case "requested":
    case "accepted":
      return "requested";
    case "in_progress":
      return "in_progress";
    case "completed":
    case "invoiced":
    case "paid":
    case "paid_out":
    case "closed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "requested";
  }
}

function SimplifiedBadge({ status }: { status: string | undefined | null }) {
  const simplified = toSimplified(status);
  const map = {
    requested:   { label: "Solicitado",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
    in_progress: { label: "Em Andamento",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
    completed:   { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200" },
    cancelled:   { label: "Cancelado",     cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const info = map[simplified];
  return <Badge className={info.cls}>{info.label}</Badge>;
}

export function RequesterWorkOrders() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"all" | SimplifiedStatus>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: orders = [] } = useListRequesterWorkOrders({});

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || toSimplified(o.status) === statusFilter;
    const matchSearch =
      o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      o.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusOptions = [
    { value: "all", label: "Todos os Status" },
    { value: "requested", label: "Solicitado" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" },
  ];

  return (
    <div className="space-y-3 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
        <h1 className="text-lg md:text-2xl font-semibold">Minhas Solicitações</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por serviço ou local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm">
                {statusOptions.find(o => o.value === statusFilter)?.label}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {showFilters && (
            <div className="absolute top-full left-0 right-0 sm:w-48 mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value as typeof statusFilter);
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    statusFilter === option.value ? "bg-primary/5 text-primary font-medium" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-2 md:space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border/60">
            Nenhuma solicitação encontrada
          </div>
        )}
        {filtered.map((o) => (
          <Card 
            key={o.id} 
            className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/work-orders/${o.id}`)}
          >
            <div className="flex items-start justify-between gap-3 mb-2 md:mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{o.serviceName}</p>
                <p className="text-sm text-muted-foreground truncate">{o.location}</p>
              </div>
              <SimplifiedBadge status={o.status} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formatDateShort(o.requestedAt)}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatCurrency(o.finalPrice)}</span>
                {(o.status === "invoiced" || o.status === "paid") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/invoices?workOrderId=${o.id}`);
                    }}
                  >
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold">Localização</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold">Solicitado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/work-orders/${o.id}`)}
                >
                  <td className="px-6 py-4 font-medium">{o.serviceName}</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{o.location}</td>
                  <td className="px-6 py-4">
                    <SimplifiedBadge status={o.status} />
                  </td>
                  <td className="px-6 py-4 font-medium text-right">{formatCurrency(o.finalPrice)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDateShort(o.requestedAt)}</td>
                  <td className="px-6 py-4">
                    {(o.status === "invoiced" || o.status === "paid") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices?workOrderId=${o.id}`);
                        }}
                      >
                        Pagar agora
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
