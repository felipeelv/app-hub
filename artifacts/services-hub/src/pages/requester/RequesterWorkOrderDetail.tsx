import { useParams, useLocation } from "wouter";
import { useGetRequesterWorkOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard } from "lucide-react";
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
    requested:   { label: "Requested",   cls: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"   },
    in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"},
    completed:   { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"},
    cancelled:   { label: "Cancelled",   cls: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"       },
  };
  const info = map[simplified];
  return <Badge className={info.cls}>{info.label}</Badge>;
}

const historyMap: Record<string, { label: string; cls: string }> = {
  requested:   { label: "Requested",   cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  accepted:    { label: "Requested",   cls: "bg-blue-100 text-blue-700 border-blue-200"  },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700 border-amber-200"},
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200"},
  invoiced:    { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200"},
  paid:        { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200"},
  paid_out:    { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200"},
  closed:      { label: "Completed",   cls: "bg-green-100 text-green-700 border-green-200"},
  cancelled:   { label: "Cancelled",   cls: "bg-red-100 text-red-700 border-red-200"     },
};

export function RequesterWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: order } = useGetRequesterWorkOrder(id!);

  if (!order) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/requester/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-semibold">{order.serviceName}</h1>
        <SimplifiedBadge status={order.status} />
      </div>

      {(order.status === "invoiced" || order.status === "paid") && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Payment pending</p>
            <p className="text-sm text-amber-700">This service has been completed. Please proceed to Invoices to complete your payment.</p>
          </div>
          <Button onClick={() => navigate(`/requester/invoices?workOrderId=${id}`)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
            Go to Invoices
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Service Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{order.location}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Requested</span><span>{formatDate(order.requestedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{order.completedAt ? formatDate(order.completedAt) : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Amount</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Due</span>
              <span className="text-2xl font-bold">{order.finalPrice != null ? formatCurrency(order.finalPrice) : "Pending assignment"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Includes service, travel fee, and platform fee</p>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.description}</p></CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{order.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Localização</CardTitle></CardHeader>
        <CardContent>
          <MapView address={order.location} cep={order.cep} />
        </CardContent>
      </Card>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h) => {
                const info = historyMap[h.status ?? ""] ?? { label: "Updated", cls: "bg-muted text-muted-foreground" };
                return (
                  <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <Badge className={`${info.cls} shrink-0`}>{info.label}</Badge>
                    <div>
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
