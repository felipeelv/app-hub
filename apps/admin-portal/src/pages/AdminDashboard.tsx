import { useGetAdminDashboard } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { FileText, Briefcase, DollarSign, Wallet, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Link } from "wouter";

export function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dashboard...</div>;
  if (!dashboard) return null;

  const kpis = [
    { label: "Total Faturado", value: formatCurrency(dashboard.totalBilled), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Comissão Gerada", value: formatCurrency(dashboard.totalCommission), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Pagamentos Pendentes", value: `R$ ${Number(dashboard.pendingPayments ?? 0).toFixed(2)}`, icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Repasses Pendentes", value: `R$ ${Number(dashboard.pendingPayouts ?? 0).toFixed(2)}`, icon: Wallet, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-xl md:text-2xl font-display font-bold text-foreground mt-2">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} transition-transform group-hover:scale-110`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-base md:text-lg font-display font-bold">Ordens de Serviço Recentes</h2>
            <Link href="/work-orders">
              <span className="text-sm font-medium text-primary hover:underline cursor-pointer">Ver todas</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Serviço</th>
                  <th className="px-6 py-4 font-semibold">Contratante</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dashboard.recentWorkOrders?.slice(0, 5).map((wo) => (
                  <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{wo.serviceName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{wo.requesterCompanyName}</td>
                    <td className="px-6 py-4"><StatusBadge status={wo.status} /></td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(wo.finalPrice)}</td>
                  </tr>
                ))}
                {(!dashboard.recentWorkOrders || dashboard.recentWorkOrders.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Nenhuma ordem recente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 md:p-6 flex flex-col">
          <h2 className="text-base md:text-lg font-display font-bold mb-4 md:mb-6">Resumo Operacional</h2>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total de Ordens</p>
                  <p className="text-xs text-muted-foreground">Acumulado</p>
                </div>
              </div>
              <p className="text-xl font-bold">{dashboard.totalWorkOrders}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ordens Abertas</p>
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                </div>
              </div>
              <p className="text-xl font-bold">{dashboard.openWorkOrders}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Concluídas</p>
                  <p className="text-xs text-muted-foreground">Com sucesso</p>
                </div>
              </div>
              <p className="text-xl font-bold">{dashboard.completedWorkOrders}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
