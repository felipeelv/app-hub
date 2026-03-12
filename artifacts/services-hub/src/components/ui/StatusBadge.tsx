import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    requested: { label: "Solicitado", bg: "bg-blue-100", text: "text-blue-800" },
    accepted: { label: "Aceito", bg: "bg-yellow-100", text: "text-yellow-800" },
    in_progress: { label: "Em Andamento", bg: "bg-orange-100", text: "text-orange-800" },
    completed: { label: "Concluído", bg: "bg-green-100", text: "text-green-800" },
    invoiced: { label: "Faturado", bg: "bg-purple-100", text: "text-purple-800" },
    paid: { label: "Pago", bg: "bg-emerald-100", text: "text-emerald-800" },
    paid_out: { label: "Repassado", bg: "bg-teal-100", text: "text-teal-800" },
    closed: { label: "Encerrado", bg: "bg-gray-100", text: "text-gray-800" },
    cancelled: { label: "Cancelado", bg: "bg-red-100", text: "text-red-800" },
    pending: { label: "Pendente", bg: "bg-yellow-100", text: "text-yellow-800" },
    new_request: { label: "Nova Solicitação", bg: "bg-blue-100", text: "text-blue-800" },
    request_accepted: { label: "Aceito", bg: "bg-green-100", text: "text-green-800" },
    service_started: { label: "Iniciado", bg: "bg-orange-100", text: "text-orange-800" },
    service_completed: { label: "Concluído", bg: "bg-purple-100", text: "text-purple-800" },
    invoice_generated: { label: "Fatura", bg: "bg-yellow-100", text: "text-yellow-800" },
    payment_confirmed: { label: "Pagamento", bg: "bg-emerald-100", text: "text-emerald-800" },
    payout_confirmed: { label: "Repasse", bg: "bg-teal-100", text: "text-teal-800" },
  };

  const config = map[status] || { label: status, bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}
