import { useState } from "react";
import { useLocation } from "wouter";
import { useListAdminWorkOrders } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search, Eye } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Todos os Status" },
  { value: "requested", label: "Solicitado" },
  { value: "accepted", label: "Aceito" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
  { value: "invoiced", label: "Faturado" },
  { value: "paid", label: "Pago" },
  { value: "cancelled", label: "Cancelado" },
];

export function AdminWorkOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: workOrders, isLoading } = useListAdminWorkOrders({ status: statusFilter || undefined });

  const filtered = workOrders?.filter((wo) => {
    if (!search) return true;
    return (
      wo.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      wo.requesterCompanyName?.toLowerCase().includes(search.toLowerCase()) ||
      wo.providerCompanyName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col min-h-[400px] md:min-h-[600px]">
        <div className="p-4 md:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 bg-muted/10">
          <h2 className="text-lg md:text-xl font-display font-bold">Ordens de Serviço</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="px-4 py-2 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40">
              <tr>
                <th className="px-6 py-4 font-semibold">ID / Data</th>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold">Contratante</th>
                <th className="px-6 py-4 font-semibold">Prestador</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Valor Final</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Carregando ordens...</td></tr>
              ) : !filtered?.length ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Nenhuma ordem encontrada.</td></tr>
              ) : (
                filtered?.map(wo => (
                  <tr key={wo.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-muted-foreground">{wo.id.split('-')[0]}</div>
                      <div className="mt-1 text-sm">{formatDate(wo.requestedAt).split(',')[0]}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{wo.serviceName}</td>
                    <td className="px-6 py-4">{wo.requesterCompanyName || '—'}</td>
                    <td className="px-6 py-4">
                      {wo.providerCompanyName && wo.providerCompanyName !== "N/A"
                        ? wo.providerCompanyName
                        : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Aguardando prestador
                          </span>
                        )
                      }
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={wo.status} /></td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(wo.finalPrice)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/work-orders/${wo.id}`); }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-semibold">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
