import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@workspace/shared-ui";
import { Button } from "@workspace/shared-ui";
import { Badge } from "@workspace/shared-ui";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

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
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const unread = notifs.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    await markAll.mutateAsync(undefined);
    refetch();
  };

  const handleMarkOne = async (id: string) => {
    await markRead.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Notificações</h1>
            {unread > 0 && (
              <p className="text-sm text-muted-foreground">{unread} não lida(s)</p>
            )}
          </div>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="w-full sm:w-auto">
            <CheckCheck className="h-4 w-4 mr-2" /> 
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border/60">
          <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nenhuma notificação ainda</p>
          <p className="text-sm">Você receberá notificações sobre suas solicitações aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <Card 
              key={n.id} 
              className={`transition-all hover:shadow-md ${n.isRead ? "opacity-60" : "border-l-4 border-l-primary"}`}
            >
              <CardContent className="py-4 px-4 md:px-6">
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Type Badge */}
                  <div className={`mt-0.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    typeColors[n.type ?? ""] ?? "bg-gray-100 text-gray-800"
                  }`}>
                    {typeLabels[n.type ?? ""] ?? n.type}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(n.createdAt)}</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && (
                      <>
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <button
                          onClick={() => handleMarkOne(n.id)}
                          className="text-xs text-muted-foreground hover:text-foreground underline hidden sm:block"
                        >
                          Marcar como lida
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Mobile mark as read button */}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground underline sm:hidden"
                  >
                    Marcar como lida
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
