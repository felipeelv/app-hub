import { useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@workspace/shared-ui/components/card";
import { Button } from "@workspace/shared-ui/components/button";
import { Badge } from "@workspace/shared-ui/components/badge";
import { Bell, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM HH:mm", { locale: ptBR }) : "—";

const typeColors: Record<string, string> = {
  new_request: "bg-blue-100 text-blue-800",
  request_accepted: "bg-green-100 text-green-800",
  service_started: "bg-orange-100 text-orange-800",
  service_completed: "bg-purple-100 text-purple-800",
  invoice_generated: "bg-yellow-100 text-yellow-800",
  payment_confirmed: "bg-emerald-100 text-emerald-800",
  payout_confirmed: "bg-teal-100 text-teal-800",
};

const typeLabels: Record<string, string> = {
  new_request: "Nova Solicitação",
  request_accepted: "Aceito",
  service_started: "Iniciado",
  service_completed: "Concluído",
  invoice_generated: "Fatura",
  payment_confirmed: "Pagamento",
  payout_confirmed: "Repasse",
};

export function Notifications() {
  const { data: notifs = [], refetch } = useListNotifications({});
  const markAll = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const unread = notifs.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync(undefined);
      refetch();
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch {
      toast.error("Erro ao marcar notificações");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Notificações</h1>
          {unread > 0 && <Badge variant="destructive">{unread} nova(s)</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4 mr-1" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Card key={n.id} className={n.isRead ? "opacity-60" : ""}>
              <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 w-fit ${typeColors[n.type ?? ""] ?? "bg-gray-100 text-gray-800"}`}>
                  {typeLabels[n.type ?? ""] ?? n.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">{fmtDate(n.createdAt)}</div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5 hidden sm:block" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
