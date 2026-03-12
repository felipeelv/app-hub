import { useLocation } from "wouter";
import { useListProviderWorkOrders, useProviderWorkOrderAction } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircle2, Play, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function WorkOrderCard({ wo, onAction }: { wo: any; onAction: (id: string, action: "accept" | "start" | "complete") => void }) {
  const [, navigate] = useLocation();
  return (
    <div className="bg-background rounded-xl border border-border/80 shadow-sm flex flex-col md:flex-row overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-border/60 cursor-pointer" onClick={() => navigate(`/provider/work-orders/${wo.id}`)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{wo.serviceName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Solicitado {formatDate(wo.requestedAt)} · OS: {wo.id.split('-')[0]}
            </p>
          </div>
          <StatusBadge status={wo.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">Local</p>
            <p className="font-medium text-foreground">{wo.location}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">A Receber</p>
            <p className="font-bold text-emerald-600 text-base">{formatCurrency(wo.providerReceivable)}</p>
          </div>
        </div>
        {wo.description && (
          <div className="mt-4 bg-muted/30 p-4 rounded-lg text-sm text-foreground/80">
            <span className="font-semibold text-xs uppercase tracking-wider block mb-1 text-muted-foreground">Descrição</span>
            {wo.description}
          </div>
        )}
      </div>
      <div className="w-full md:w-64 bg-muted/10 p-6 flex flex-col justify-center gap-4">
        <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">Ação Necessária</p>
        {wo.status === 'requested' && (
          <button onClick={() => onAction(wo.id, 'accept')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Aceitar Serviço
          </button>
        )}
        {wo.status === 'accepted' && (
          <button onClick={() => onAction(wo.id, 'start')} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> Iniciar Serviço
          </button>
        )}
        {wo.status === 'in_progress' && (
          <button onClick={() => onAction(wo.id, 'complete')} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Concluir
          </button>
        )}
        {(wo.status === 'completed' || wo.status === 'invoiced' || wo.status === 'paid' || wo.status === 'paid_out') && (
          <div className="text-center py-4 bg-background rounded-xl border border-border border-dashed">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Serviço Concluído</p>
            <p className="text-xs text-muted-foreground mt-1">Aguardando repasse</p>
          </div>
        )}
        {wo.status === 'cancelled' && (
          <div className="text-center py-4 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive font-semibold">Cancelado</div>
        )}
      </div>
    </div>
  );
}

export function ProviderWorkOrders() {
  const { data: workOrders, isLoading, refetch } = useListProviderWorkOrders({});
  const actionMutation = useProviderWorkOrderAction();
  const { toast } = useToast();

  const handleAction = async (id: string, action: "accept" | "start" | "complete") => {
    try {
      await actionMutation.mutateAsync({ id, data: { action } });
      refetch();
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-6 border-b border-border/60 bg-muted/10">
          <h2 className="text-xl font-display font-bold">Ordens Atribuídas</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie e atualize o status das suas ordens de serviço.</p>
        </div>
        <div className="p-6 grid grid-cols-1 gap-6">
          {isLoading ? (
            [1,2,3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse"></div>)
          ) : !workOrders?.length ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma ordem atribuída ainda.</div>
          ) : (
            workOrders?.map(wo => <WorkOrderCard key={wo.id} wo={wo} onAction={handleAction} />)
          )}
        </div>
      </div>
    </div>
  );
}
