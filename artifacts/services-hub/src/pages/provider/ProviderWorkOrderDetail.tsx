import { useParams, useLocation } from "wouter";
import { useGetProviderWorkOrder, useProviderWorkOrderAction } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, CheckCircle, Play, Flag } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { MapView } from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";

export function ProviderWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: order, refetch } = useGetProviderWorkOrder(id!);
  const action = useProviderWorkOrderAction(id!);

  if (!order) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const handleAction = async (a: "accept" | "start" | "complete") => {
    try {
      await action.mutateAsync({ action: a });
      toast({ title: "Success", description: "Status updated!" });
      refetch();
    } catch {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/provider/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-semibold">{order.serviceName}</h1>
        <StatusBadge status={order.status} lang="en" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Service Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{order.location}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Requested</span><span>{formatDate(order.requestedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{order.completedAt ? formatDate(order.completedAt) : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Your Earnings</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Base Price</span><span>{formatCurrency(order.basePrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Travel Fee</span><span>{formatCurrency(order.travelCost)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Total Receivable</span><span className="font-bold text-green-600">{formatCurrency(order.providerReceivable)}</span></div>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Job Description</CardTitle></CardHeader>
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

      <div className="flex gap-3">
        {order.status === "requested" && (
          <Button onClick={() => handleAction("accept")} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Accept Job
          </Button>
        )}
        {order.status === "accepted" && (
          <Button onClick={() => handleAction("start")} className="gap-2">
            <Play className="h-4 w-4" /> Start Job
          </Button>
        )}
        {order.status === "in_progress" && (
          <Button onClick={() => handleAction("complete")} className="gap-2 bg-green-600 hover:bg-green-700">
            <Flag className="h-4 w-4" /> Mark as Completed
          </Button>
        )}
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <StatusBadge status={h.status} lang="en" />
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
