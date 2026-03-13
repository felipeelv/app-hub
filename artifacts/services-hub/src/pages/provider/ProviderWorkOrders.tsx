import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListProviderWorkOrders, useProviderWorkOrderAction } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Play, Check, Zap, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/utils";

async function fetchAvailableOrders() {
  const res = await fetch(`${apiBase()}/api/provider/work-orders?available=true`);
  if (!res.ok) throw new Error("Failed to fetch available orders");
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

function AvailableJobCard({ wo, onClaim }: { wo: any; onClaim: (id: string) => void }) {
  const [, navigate] = useLocation();
  return (
    <div className="bg-background rounded-xl border border-amber-300/60 shadow-sm flex flex-col md:flex-row overflow-hidden transition-all hover:border-amber-400/80 hover:shadow-md">
      <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-border/60 cursor-pointer" onClick={() => navigate(`/provider/work-orders/${wo.id}`)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300">Open</Badge>
              <span className="text-xs text-muted-foreground">{wo.category}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{wo.serviceName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Requested {formatDate(wo.requestedAt)} · WO: {wo.id.split('-')[0]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">Location</p>
            <p className="font-medium text-foreground">{wo.location}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">You Earn</p>
            <p className="font-bold text-emerald-600 text-base">{formatCurrency(wo.providerReceivable)}</p>
          </div>
        </div>
        {wo.description && (
          <div className="mt-4 bg-muted/30 p-4 rounded-lg text-sm text-foreground/80">
            <span className="font-semibold text-xs uppercase tracking-wider block mb-1 text-muted-foreground">Description</span>
            {wo.description}
          </div>
        )}
      </div>
      <div className="w-full md:w-64 bg-amber-50/50 dark:bg-amber-950/10 p-6 flex flex-col justify-center gap-4">
        <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">First to accept wins</p>
        <button
          onClick={() => onClaim(wo.id)}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" /> Accept Job
        </button>
      </div>
    </div>
  );
}

function MyJobCard({ wo, onAction }: { wo: any; onAction: (id: string, action: "accept" | "start" | "complete") => void }) {
  const [, navigate] = useLocation();
  return (
    <div className="bg-background rounded-xl border border-border/80 shadow-sm flex flex-col md:flex-row overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-border/60 cursor-pointer" onClick={() => navigate(`/provider/work-orders/${wo.id}`)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{wo.serviceName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Requested {formatDate(wo.requestedAt)} · WO: {wo.id.split('-')[0]}
            </p>
          </div>
          <StatusBadge status={wo.status} lang="en" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">Location</p>
            <p className="font-medium text-foreground">{wo.location}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-1">Receivable</p>
            <p className="font-bold text-emerald-600 text-base">{formatCurrency(wo.providerReceivable)}</p>
          </div>
        </div>
        {wo.description && (
          <div className="mt-4 bg-muted/30 p-4 rounded-lg text-sm text-foreground/80">
            <span className="font-semibold text-xs uppercase tracking-wider block mb-1 text-muted-foreground">Description</span>
            {wo.description}
          </div>
        )}
      </div>
      <div className="w-full md:w-64 bg-muted/10 p-6 flex flex-col justify-center gap-4">
        <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">Required Action</p>
        {wo.status === 'accepted' && (
          <button onClick={() => onAction(wo.id, 'start')} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> Start Job
          </button>
        )}
        {wo.status === 'in_progress' && (
          <button onClick={() => onAction(wo.id, 'complete')} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Mark Complete
          </button>
        )}
        {(wo.status === 'completed' || wo.status === 'invoiced' || wo.status === 'paid' || wo.status === 'paid_out') && (
          <div className="text-center py-4 bg-background rounded-xl border border-border border-dashed">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Job Completed</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
          </div>
        )}
        {wo.status === 'cancelled' && (
          <div className="text-center py-4 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive font-semibold">Cancelled</div>
        )}
      </div>
    </div>
  );
}

export function ProviderWorkOrders() {
  const [tab, setTab] = useState<"available" | "mine">("available");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: availableOrders = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ["provider-available-orders"],
    queryFn: fetchAvailableOrders,
    refetchInterval: 15000,
  });

  const { data: myOrders = [], isLoading: loadingMine, refetch: refetchMine } = useListProviderWorkOrders({});

  const claimMutation = useMutation({
    mutationFn: (id: string) => postAction(id, "accept"),
    onSuccess: () => {
      toast({ title: "Job accepted!", description: "The job is now in your assigned list." });
      qc.invalidateQueries({ queryKey: ["provider-available-orders"] });
      refetchMine();
      setTab("mine");
    },
    onError: (err: any) => {
      toast({ title: "Could not accept job", description: err.message, variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["provider-available-orders"] });
    },
  });

  const { mutateAsync: doAction } = useProviderWorkOrderAction();
  const handleAction = async (id: string, action: "accept" | "start" | "complete") => {
    try {
      await doAction({ id, data: { action } });
      refetchMine();
    } catch {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-0">
        <button
          onClick={() => setTab("available")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "available" ? "border-amber-500 text-amber-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Zap className="w-4 h-4" />
          Available Jobs
          {availableOrders.length > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {availableOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "mine" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Briefcase className="w-4 h-4" />
          My Jobs
          {(myOrders as any[]).length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {(myOrders as any[]).length}
            </span>
          )}
        </button>
      </div>

      {/* Available Jobs tab */}
      {tab === "available" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold">Available Jobs</h2>
              <p className="text-sm text-muted-foreground">Open requests from clients — first to accept wins the job.</p>
            </div>
          </div>
          {loadingAvailable ? (
            [1,2,3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />)
          ) : availableOrders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-border/60">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No open jobs right now</p>
              <p className="text-sm mt-1">Check back soon — new requests appear here as clients submit them.</p>
            </div>
          ) : (
            availableOrders.map((wo: any) => (
              <AvailableJobCard key={wo.id} wo={wo} onClaim={(id) => claimMutation.mutate(id)} />
            ))
          )}
        </div>
      )}

      {/* My Jobs tab */}
      {tab === "mine" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">My Jobs</h2>
            <p className="text-sm text-muted-foreground">Jobs you have accepted — manage their progress here.</p>
          </div>
          {loadingMine ? (
            [1,2,3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />)
          ) : (myOrders as any[]).length === 0 ? (
            <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-border/60">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No jobs assigned yet</p>
              <p className="text-sm mt-1">Accept an available job and it will appear here.</p>
            </div>
          ) : (
            (myOrders as any[]).map(wo => <MyJobCard key={wo.id} wo={wo} onAction={handleAction} />)
          )}
        </div>
      )}
    </div>
  );
}
