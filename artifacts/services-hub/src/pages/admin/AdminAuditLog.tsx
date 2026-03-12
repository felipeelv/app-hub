import { useListAuditLog } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDate = (d: string | Date | undefined | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

export function AdminAuditLog() {
  const { data: logs = [] } = useListAuditLog({});

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Auditoria / Histórico</h1>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidade</TableHead>
              <TableHead>Ação / Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum registro de auditoria</TableCell></TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{log.entityType}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{log.entityId.slice(0, 8)}...</span>
                </TableCell>
                <TableCell><StatusBadge status={log.action} /></TableCell>
                <TableCell className="text-sm">{log.actor}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details || "—"}</TableCell>
                <TableCell className="text-sm">{fmtDate(log.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
