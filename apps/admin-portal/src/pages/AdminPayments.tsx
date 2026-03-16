import { useListAdminPayments } from "@workspace/api-client-react";
import { Card } from "@workspace/shared-ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/shared-ui/components/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtMoney = (v: number | null | undefined) => (v != null ? `R$ ${v.toFixed(2)}` : "—");
const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

const methodLabels: Record<string, string> = {
  pix: "PIX",
  bank_transfer: "Transferência",
  credit_card: "Cartão",
};

export function AdminPayments() {
  const { data: payments = [] } = useListAdminPayments();

  const total = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Pagamentos Recebidos</h1>
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600">{fmtMoney(total)}</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contratante</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Nº Faturas</TableHead>
                <TableHead className="hidden md:table-cell">Pago em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum pagamento registrado</TableCell></TableRow>
              )}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.requesterCompanyName}</TableCell>
                  <TableCell>{methodLabels[p.paymentMethod ?? ""] ?? p.paymentMethod}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{fmtMoney(p.amount)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{p.invoiceIds?.length ?? 0} fatura(s)</TableCell>
                  <TableCell className="hidden md:table-cell">{fmtDate(p.paidAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
