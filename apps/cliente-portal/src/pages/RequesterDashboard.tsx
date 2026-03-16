import { useGetRequesterDashboard } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Clock, CheckCircle2, FileText, CreditCard, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function SimpleStatusBadge({ status }: { status: string | undefined | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    requested:  { label: "Solicitado",  cls: "bg-blue-100 text-blue-700"   },
    accepted:   { label: "Solicitado",  cls: "bg-blue-100 text-blue-700"   },
    in_progress:{ label: "Em Andamento",cls: "bg-amber-100 text-amber-700" },
    completed:  { label: "Concluído",  cls: "bg-green-100 text-green-700" },
    invoiced:   { label: "Concluído",  cls: "bg-green-100 text-green-700" },
    paid:       { label: "Concluído",  cls: "bg-green-100 text-green-700" },
    paid_out:   { label: "Concluído",  cls: "bg-green-100 text-green-700" },
    closed:     { label: "Concluído",  cls: "bg-green-100 text-green-700" },
    cancelled:  { label: "Cancelado",  cls: "bg-red-100 text-red-700"    },
  };
  const info = map[status ?? ""] ?? { label: status ?? "—", cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${info.cls}`}>
      {info.label}
    </span>
  );
}

export function RequesterDashboard() {
  const { data: dashboard, isLoading } = useGetRequesterDashboard();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dashboard...</div>;
  if (!dashboard) return null;

  const kpis = [
    { label: "Solicitações Abertas", value: dashboard.openRequests, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Em Andamento", value: dashboard.inProgress, icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Concluídas", value: dashboard.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Valor em Aberto", value: formatCurrency(dashboard.totalPendingAmount), icon: CreditCard, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-4 md:space-y-8 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Acompanhe suas solicitações e pagamentos</p>
        </div>
        <Link href="/catalog">
          <button className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Solicitar Novo Serviço
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {kpis.map((kpi, i) => {
          const content = (
            <>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 md:w-6 md:h-6 ${kpi.color}`} />
                </div>
                {kpi.label === "Valor em Aberto" && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full hidden sm:inline-block">Ver Faturas</span>
                )}
              </div>
              <div>
                <p className="text-xl md:text-3xl font-display font-bold text-foreground mb-1">{kpi.value}</p>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">{kpi.label}</p>
              </div>
            </>
          );

          if (kpi.label === "Valor em Aberto") {
            return (
              <Link key={i} href="/invoices" className="bg-card p-3 md:p-6 rounded-2xl shadow-sm border border-border/60 hover:border-primary/30 transition-colors group block cursor-pointer ring-amber-200 hover:ring-2">
                {content}
              </Link>
            );
          }

          return (
            <div key={i} className="bg-card p-3 md:p-6 rounded-2xl shadow-sm border border-border/60 hover:border-primary/30 transition-colors group">
              {content}
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-muted/10">
          <h2 className="text-lg md:text-xl font-display font-bold">Ordens Recentes</h2>
          <Link href="/work-orders">
            <span className="text-sm font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
              Ver histórico completo
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        
        {/* Mobile Card View */}
        <div className="lg:hidden">
          {dashboard.recentWorkOrders?.slice(0, 5).map((wo) => (
            <div key={wo.id} className="p-4 border-b border-border/50 last:border-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{wo.serviceName}</p>
                  <p className="text-sm text-muted-foreground truncate">{wo.location}</p>
                </div>
                <SimpleStatusBadge status={wo.status} />
              </div>
              <p className="font-bold text-right">{formatCurrency(wo.finalPrice)}</p>
            </div>
          ))}
          {(!dashboard.recentWorkOrders || dashboard.recentWorkOrders.length === 0) && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              Você ainda não fez nenhuma solicitação.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold">Localização</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {dashboard.recentWorkOrders?.slice(0, 5).map((wo) => (
                <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{wo.serviceName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{wo.location}</td>
                  <td className="px-6 py-4"><SimpleStatusBadge status={wo.status} /></td>
                  <td className="px-6 py-4 font-medium text-right">{formatCurrency(wo.finalPrice)}</td>
                </tr>
              ))}
              {(!dashboard.recentWorkOrders || dashboard.recentWorkOrders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Você ainda não fez nenhuma solicitação.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
