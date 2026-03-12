import { useParams, useLocation } from "wouter";
import { useGetRequesterWorkOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";
const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "Aguardando atribuição");

export function RequesterWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: order } = useGetRequesterWorkOrder(id!);

  if (!order) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/requester/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-xl font-semibold">{order.serviceName}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações do Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Local</span><span>{order.location}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Solicitado em</span><span>{fmtDate(order.requestedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Concluído em</span><span>{fmtDate(order.completedAt)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Valor</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor Total</span>
              <span className="text-2xl font-bold">{fmtMoney(order.finalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Inclui serviço, deslocamento e taxa de intermediação</p>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.description}</p></CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{order.notes}</p></CardContent>
        </Card>
      )}

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Acompanhamento</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <StatusBadge status={h.status} />
                  <div>
                    <p className="text-muted-foreground text-xs">{fmtDate(h.changedAt)}</p>
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
