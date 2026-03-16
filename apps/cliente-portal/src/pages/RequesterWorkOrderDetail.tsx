import { useParams, useLocation } from "wouter";
import { useGetRequesterWorkOrder } from "@workspace/api-client-react";
import { Button } from "@workspace/shared-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui";
import { Badge } from "@workspace/shared-ui";
import { ArrowLeft, CreditCard, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { MapView } from "@/components/MapView";

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

const historyMap: Record<string, { label: string; cls: string }> = {
  requested:   { label: "Solicitado",    cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  accepted:    { label: "Solicitado",    cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  in_progress: { label: "Em Andamento",  cls: "bg-amber-100 text-amber-700 border-amber-200"},
  completed:   { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200"},
  invoiced:    { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200"},
  paid:        { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200"},
  paid_out:    { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200"},
  closed:      { label: "Concluído",     cls: "bg-green-100 text-green-700 border-green-200"},
  cancelled:   { label: "Cancelado",     cls: "bg-red-100 text-red-700 border-red-200"     },
};

export function RequesterWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: order } = useGetRequesterWorkOrder(id!);

  if (!order) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3 md:space-y-6 max-w-4xl p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-base md:text-xl font-semibold line-clamp-2">{order.serviceName}</h1>
        <SimplifiedBadge status={order.status} />
      </div>

      {/* Payment Alert */}
      {(order.status === "invoiced" || order.status === "paid") && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base">Pagamento pendente</p>
            <p className="text-xs md:text-sm text-amber-700">Este serviço foi concluído. Por favor, acesse as Faturas para realizar o pagamento.</p>
          </div>
          <Button 
            onClick={() => navigate(`/invoices?workOrderId=${id}`)} 
            className="w-full sm:w-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Ir para Faturas
          </Button>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria</span>
              <span>{order.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Localização</span>
              <span className="text-right max-w-[60%]">{order.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Solicitado em</span>
              <span>{formatDate(order.requestedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concluído em</span>
              <span>{order.completedAt ? formatDate(order.completedAt) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm">Valor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl md:text-2xl font-bold">
                {order.finalPrice != null ? formatCurrency(order.finalPrice) : "Aguardando atribuição"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Inclui serviço, taxa de deslocamento e taxa da plataforma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {order.description && (
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{order.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapView address={order.location} cep={order.cep} />
        </CardContent>
      </Card>

      {/* Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              {order.statusHistory.map((h) => {
                const info = historyMap[h.status ?? ""] ?? { label: "Atualizado", cls: "bg-muted text-muted-foreground" };
                return (
                  <div key={h.id} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm border-b pb-2 md:pb-3 last:border-0 last:pb-0">
                    <Badge className={`${info.cls} shrink-0 text-xs`}>{info.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-xs">{formatDate(h.changedAt)}</p>
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
