import { useParams, useLocation } from "wouter";
import { useGetRequesterWorkOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";
const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "Aguardando atribuição");

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

const simplifiedLabel: Record<SimplifiedStatus, string> = {
  solicitado: "Solicitado",
  aguardando: "Aguardando",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function SimplifiedBadge({ status }: { status: string | undefined | null }) {
  const simplified = toSimplified(status);
  const classMap: Record<SimplifiedStatus, string> = {
    solicitado: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    aguardando: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    concluido: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    cancelado: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  };
  return (
    <Badge className={classMap[simplified]}>
      {simplifiedLabel[simplified]}
    </Badge>
  );
}

const historyLabelMap: Record<string, { label: string; cls: string }> = {
  requested:  { label: "Solicitado",  cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  accepted:   { label: "Solicitado",  cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  in_progress:{ label: "Aguardando", cls: "bg-amber-100 text-amber-700 border-amber-200"},
  completed:  { label: "Concluído",  cls: "bg-green-100 text-green-700 border-green-200"},
  invoiced:   { label: "Concluído",  cls: "bg-green-100 text-green-700 border-green-200"},
  paid:       { label: "Concluído",  cls: "bg-green-100 text-green-700 border-green-200"},
  paid_out:   { label: "Concluído",  cls: "bg-green-100 text-green-700 border-green-200"},
  closed:     { label: "Concluído",  cls: "bg-green-100 text-green-700 border-green-200"},
  cancelled:  { label: "Cancelado",  cls: "bg-red-100 text-red-700 border-red-200"     },
};

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
        <SimplifiedBadge status={order.status} />
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
              {order.statusHistory.map((h) => {
                const info = historyLabelMap[h.status ?? ""] ?? { label: "Atualizado", cls: "bg-muted text-muted-foreground" };
                return (
                  <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <Badge className={`${info.cls} shrink-0`}>{info.label}</Badge>
                    <div>
                      <p className="text-muted-foreground text-xs">{fmtDate(h.changedAt)}</p>
                      {h.note && <p className="mt-0.5">{h.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
