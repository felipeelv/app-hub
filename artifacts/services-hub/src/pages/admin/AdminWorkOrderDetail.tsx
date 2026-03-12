import { useParams, useLocation } from "wouter";
import { useState } from "react";
import {
  useGetAdminWorkOrder,
  useAdminAdjustWorkOrder,
  useAdminAssignWorkOrder,
  useListProviderCompanies,
  useListAdminWorkOrders,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { MapView } from "@/components/MapView";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export function AdminWorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: order, refetch } = useGetAdminWorkOrder(id!);
  const { data: providers = [] } = useListProviderCompanies();
  const adjust = useAdminAdjustWorkOrder(id!);
  const assign = useAdminAssignWorkOrder(id!);

  const [adjustNotes, setAdjustNotes] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  if (!order) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  const fmtDate = (d: string | Date | undefined | null) =>
    d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

  const fmtMoney = (v: number | null | undefined) =>
    v != null ? `R$ ${v.toFixed(2)}` : "—";

  const handleAdjust = async (action: "cancel" | "reopen" | "correct") => {
    if (!adjustNotes && action !== "reopen") return;
    try {
      await adjust.mutateAsync({ action, notes: adjustNotes });
      toast({ title: "Sucesso", description: "Ordem de serviço atualizada." });
      setAdjustOpen(false);
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!selectedProvider) return;
    try {
      // Use first catalog item of selected provider as fallback
      await assign.mutateAsync({ providerCompanyId: selectedProvider, catalogItemId: order.serviceCatalogItemId || "" });
      toast({ title: "Prestador atribuído", description: "Ordem atualizada com sucesso." });
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível atribuir prestador.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-xl font-semibold">{order.serviceName}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações Gerais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Contratante</span><span>{order.requesterCompanyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Prestador</span><span>{order.providerCompanyName ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{order.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Local</span><span>{order.location}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Solicitado em</span><span>{fmtDate(order.requestedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Concluído em</span><span>{fmtDate(order.completedAt)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Valores Financeiros (Admin)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Preço Base</span><span className="font-medium">{fmtMoney(order.basePrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deslocamento</span><span>{fmtMoney(order.travelCost)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Comissão</span><span className="text-amber-600 font-medium">{fmtMoney(order.commissionAmount)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Valor Final (Contratante)</span><span className="font-bold text-base">{fmtMoney(order.finalPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">A Receber (Prestador)</span><span className="text-green-600 font-medium">{fmtMoney(order.providerReceivable)}</span></div>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.description}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Localização</CardTitle></CardHeader>
        <CardContent>
          <MapView address={order.location} cep={order.cep} />
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {!order.providerCompanyId && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Atribuir Prestador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Atribuir Prestador</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Label>Prestador</Label>
                <Select onValueChange={setSelectedProvider}>
                  <SelectTrigger><SelectValue placeholder="Selecionar prestador..." /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedProvider} className="w-full">Atribuir</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><AlertCircle className="h-4 w-4 mr-1" /> Ajustar / Cancelar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ação Administrativa</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Textarea placeholder="Motivo / observação (obrigatório)" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAdjust("reopen")} className="flex-1"><RotateCcw className="h-4 w-4 mr-1" />Reabrir</Button>
                <Button variant="destructive" onClick={() => handleAdjust("cancel")} disabled={!adjustNotes} className="flex-1"><XCircle className="h-4 w-4 mr-1" />Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Histórico de Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <StatusBadge status={h.status} />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">{h.changedBy} · {fmtDate(h.changedAt)}</p>
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
