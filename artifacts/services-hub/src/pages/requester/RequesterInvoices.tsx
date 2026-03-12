import { useState, useEffect, useRef } from "react";
import { useListRequesterInvoices, usePayInvoices } from "@workspace/api-client-react";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CreditCard, CheckSquare, Square } from "lucide-react";

export function RequesterInvoices() {
  const highlightWorkOrderId = new URLSearchParams(window.location.search).get("workOrderId");
  const { data: invoices, isLoading, refetch } = useListRequesterInvoices({ status: "pending" });
  const payMutation = usePayInvoices();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [invoices]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectedTotal = invoices?.filter(i => selectedIds.has(i.id)).reduce((sum, i) => sum + i.finalPrice, 0) || 0;

  const handlePay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await payMutation.mutateAsync({
      invoiceIds: Array.from(selectedIds),
      paymentMethod: fd.get("paymentMethod") as any
    });
    setIsPayModalOpen(false);
    setSelectedIds(new Set());
    refetch();
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/60 bg-muted/10">
          <h2 className="text-xl font-display font-bold">Pending Invoices</h2>
          <p className="text-muted-foreground text-sm mt-1">Select invoices to pay them together</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40">
              <tr>
                <th className="p-4 w-12 text-center">
                  <button className="text-muted-foreground hover:text-foreground">
                    <CheckSquare className="w-5 h-5" />
                  </button>
                </th>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Issued</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Loading invoices...</td></tr>
              ) : invoices?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No pending invoices. All caught up!</td></tr>
              ) : (
                invoices?.map(inv => {
                  const isHighlighted = highlightWorkOrderId === inv.workOrderId;
                  return (
                  <tr key={inv.id} ref={isHighlighted ? highlightRef : undefined} className={`transition-colors cursor-pointer ${isHighlighted ? 'ring-2 ring-amber-400 bg-amber-50' : selectedIds.has(inv.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`} onClick={() => toggleSelect(inv.id)}>
                    <td className="p-4 text-center">
                      <button className={selectedIds.has(inv.id) ? "text-primary" : "text-muted-foreground/50"}>
                        {selectedIds.has(inv.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {inv.serviceName}
                      <div className="text-xs font-mono text-muted-foreground mt-1">WO: {inv.workOrderId.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDateShort(inv.generatedAt)}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} lang="en" /></td>
                    <td className="px-6 py-4 font-bold text-right text-foreground">{formatCurrency(inv.finalPrice)}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card/80 backdrop-blur-xl border-t border-border/60 p-4 z-40 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{selectedIds.size} invoice(s) selected</p>
                <p className="text-2xl font-display font-bold text-foreground leading-none">{formatCurrency(selectedTotal)}</p>
              </div>
            </div>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
            >
              Pay Selected
            </button>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60">
              <h2 className="text-xl font-display font-bold">Confirm Payment</h2>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-6">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-3xl font-display font-bold text-foreground">{formatCurrency(selectedTotal)}</p>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold">Payment Method</label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-primary cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <div className="font-medium">ACH / Bank Transfer</div>
                  <input required type="radio" name="paymentMethod" value="bank_transfer" className="w-4 h-4 text-primary focus:ring-primary" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-primary cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <div className="font-medium">Credit Card</div>
                  <input type="radio" name="paymentMethod" value="credit_card" className="w-4 h-4 text-primary focus:ring-primary" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-primary cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <div className="font-medium">Check</div>
                  <input type="radio" name="paymentMethod" value="pix" className="w-4 h-4 text-primary focus:ring-primary" />
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={payMutation.isPending} className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50">
                  {payMutation.isPending ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
