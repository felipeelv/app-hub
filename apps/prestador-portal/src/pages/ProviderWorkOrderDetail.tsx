import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/shared-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/components/card";
import { Badge } from "@workspace/shared-ui/components/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, CheckCircle, Play, Flag, Zap } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { MapView } from "@/components/MapView";
import { useToast } from "@workspace/shared-ui/hooks/use-toast";
import { apiBase } from "@/lib/utils";

async function fetchOrder(id: string) {
  const res = await fetch(`${apiBase()}/api/provider/work-orders/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

async function postAction(id: string, action: string) {
  const res = await fetch(`${apiBase()}/api/provider/work-orders/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

export function ProviderWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: order, refetch, isLoading } = useQuery({
    queryKey: ["provider-order", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => postAction(id!, action),
    onSuccess: () => {
      toast({ title: "Status atualizado!" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Não foi possível atualizar", description: err.message, variant: "destructive" });
      refetch();
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!order) return <div className="p-8 text-muted-foreground">Ordem não encontrada.</div>;

  const isPoolOrder = order.providerCompanyId === null;

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl p-2 md:p-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-lg md:text-xl font-semibold line-clamp-2">{order.serviceName}</h1>
        {isPoolOrder ? (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">Aberto — Não Atribuído</Badge>
        ) : (
          <StatusBadge status={order.status} lang="pt" />
        )}
      </div>

      {isPoolOrder && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/10 p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Trabalho Aberto — O primeiro a aceitar ganha</p>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">Esta solicitação está aguardando um prestador. Clique em <strong>Aceitar Trabalho</strong> para reservá-la.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Detalhes do Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Localização</span><span>{order.location}</span></div>
            {order.cep && <div className="flex justify-between"><span className="text-muted-foreground">CEP</span><span>{order.cep}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Solicitado em</span><span>{formatDate(order.requestedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Concluído em</span><span>{order.completedAt ? formatDate(order.completedAt) : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Seus Ganhos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Preço Base</span><span>{formatCurrency(order.basePrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Taxa de Deslocamento</span><span>{formatCurrency(order.travelCost)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Total a Receber</span><span className="font-bold text-green-600">{formatCurrency(order.providerReceivable)}</span></div>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Descrição do Trabalho</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.description}</p></CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{order.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Localização</CardTitle></CardHeader>
        <CardContent>
          <MapView address={order.location} cep={order.cep} />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")} className="w-full sm:w-auto order-first">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        {(isPoolOrder || order.status === "requested") && (
          <Button
            onClick={() => actionMutation.mutate("accept")}
            disabled={actionMutation.isPending}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
          >
            <Zap className="h-4 w-4" />
            {actionMutation.isPending ? "Reservando..." : "Aceitar Trabalho"}
          </Button>
        )}
        {order.status === "accepted" && !isPoolOrder && (
          <Button onClick={() => actionMutation.mutate("start")} disabled={actionMutation.isPending} className="gap-2 w-full sm:w-auto">
            <Play className="h-4 w-4" /> Iniciar Trabalho
          </Button>
        )}
        {order.status === "in_progress" && (
          <Button onClick={() => actionMutation.mutate("complete")} disabled={actionMutation.isPending} className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Flag className="h-4 w-4" /> Marcar como Concluído
          </Button>
        )}
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Histórico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <StatusBadge status={h.status} lang="pt" />
                  <div>
                    <p className="text-muted-foreground text-xs">{h.changedBy} · {formatDate(h.changedAt)}</p>
                    {h.note && <p className="mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
