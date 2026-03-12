import { useGetRequesterDashboard } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Clock, CheckCircle2, FileText, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "wouter";

export function RequesterDashboard() {
  const { data: dashboard, isLoading } = useGetRequesterDashboard();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dashboard...</div>;
  if (!dashboard) return null;

  const kpis = [
    { label: "Solicitações Abertas", value: dashboard.openRequests, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Em Andamento", value: dashboard.inProgress, icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Concluídas", value: dashboard.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Valor a Pagar", value: formatCurrency(dashboard.totalPendingAmount), icon: CreditCard, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Acompanhe suas solicitações de serviço e pagamentos</p>
        </div>
        <Link href="/requester/catalog">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Solicitar Novo Serviço
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border/60 hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-foreground mb-1">{kpi.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/60 flex justify-between items-center bg-muted/10">
          <h2 className="text-xl font-display font-bold">Ordens Recentes</h2>
          <Link href="/requester/work-orders">
            <span className="text-sm font-semibold text-primary hover:underline cursor-pointer">Ver histórico completo</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold">Local</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {dashboard.recentWorkOrders?.slice(0, 5).map((wo) => (
                <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{wo.serviceName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{wo.location}</td>
                  <td className="px-6 py-4"><StatusBadge status={wo.status} /></td>
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
