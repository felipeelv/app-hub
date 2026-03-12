import { useState } from "react";
import { useLocation } from "wouter";
import { useListRequesterWorkOrders } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/format";

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

export function RequesterWorkOrders() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"all" | SimplifiedStatus>("all");
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useListRequesterWorkOrders({});

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || toSimplified(o.status) === statusFilter;
    const matchSearch =
      o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
      o.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Requests</h1>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search by service or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Requested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No requests found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/requester/work-orders/${o.id}`)}
              >
                <TableCell className="font-medium">{o.serviceName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{o.location}</TableCell>
                <TableCell>
                  <SimplifiedBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(o.finalPrice)}</TableCell>
                <TableCell>{formatDateShort(o.requestedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
