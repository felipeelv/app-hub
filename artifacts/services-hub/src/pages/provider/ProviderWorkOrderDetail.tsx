import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, CheckCircle, Play, Flag, Zap } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { MapView } from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";
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
    onSuccess: (data) => {
      toast({ title: "Status updated!" });
      refetch();
      // If we just claimed it, update the title
    },
    onError: (err: any) => {
      toast({ title: "Could not update status", description: err.message, variant: "destructive" });
      refetch();
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!order) return <div className="p-8 text-muted-foreground">Order not found.</div>;

  const isPoolOrder = order.providerCompanyId === null;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/provider/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-xl font-semibold">{order.serviceName}</h1>
        {isPoolOrder ? (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">Open — Unassigned</Badge>
        ) : (
          <StatusBadge status={order.status} lang="en" />
        )}
      </div>

      {isPoolOrder && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/10 p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Open Job — First to accept wins</p>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-0.5">This request is waiting for a provider. Click <strong>Accept Job</strong> to claim it.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Service Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{order.location}</span></div>
            {order.cep && <div className="flex justify-between"><span className="text-muted-foreground">ZIP Code</span><span>{order.cep}</span></div>}
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
        <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
        <CardContent>
          <MapView address={order.location} cep={order.cep} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {(isPoolOrder || order.status === "requested") && (
          <Button
            onClick={() => actionMutation.mutate("accept")}
            disabled={actionMutation.isPending}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Zap className="h-4 w-4" />
            {actionMutation.isPending ? "Claiming..." : "Accept Job"}
          </Button>
        )}
        {order.status === "accepted" && !isPoolOrder && (
          <Button onClick={() => actionMutation.mutate("start")} disabled={actionMutation.isPending} className="gap-2">
            <Play className="h-4 w-4" /> Start Job
          </Button>
        )}
        {order.status === "in_progress" && (
          <Button onClick={() => actionMutation.mutate("complete")} disabled={actionMutation.isPending} className="gap-2 bg-green-600 hover:bg-green-700">
            <Flag className="h-4 w-4" /> Mark as Completed
          </Button>
        )}
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h: any) => (
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
