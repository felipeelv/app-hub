import { useState } from "react";
import { useListCatalogForRequester, useCreateWorkOrder } from "@workspace/api-client-react";
import { Search, MapPin, Clock, FileText, CalendarDays } from "lucide-react";
import { useLocation } from "wouter";

export function RequesterCatalog() {
  const { data: catalog, isLoading } = useListCatalogForRequester({});
  const createMutation = useCreateWorkOrder();
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [searchText, setSearchText] = useState("");

  const filtered = catalog?.filter((item) =>
    item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedService) return;
    const fd = new FormData(e.currentTarget);
    await createMutation.mutateAsync({
      data: {
        catalogItemId: selectedService.id,
        location: fd.get('location') as string,
        cep: fd.get('cep') as string,
        description: fd.get('description') as string,
        notes: fd.get('notes') as string,
      },
    });
    setLocation("/requester/work-orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Service Catalog</h1>
          <p className="text-primary/70 mt-1">Request services from certified providers</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/20 bg-background text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-card rounded-2xl animate-pulse"></div>)
        ) : !filtered?.length ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">No services available at the moment.</div>
        ) : (
          filtered?.map(item => (
            <div key={item.id} className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70 bg-primary/10 px-2.5 py-1 rounded-md">
                  {item.category}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">{item.name}</h3>
              <p className="text-muted-foreground text-sm flex-1 line-clamp-3 mb-6">
                {item.description || "No description available."}
              </p>
              <div className="mt-auto space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>~{item.estimatedDays || 1} day(s)</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(item)}
                  className="w-full py-3 bg-muted text-foreground hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold transition-colors"
                >
                  Request Service
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border/60 bg-primary/5">
              <h2 className="text-2xl font-display font-bold text-foreground">Request Service</h2>
              <p className="text-muted-foreground mt-1">{selectedService.name}</p>
            </div>
            <form onSubmit={handleRequest} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> Service Address *</label>
                  <input required name="location" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="123 Example St, Orlando, FL" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> ZIP Code *</label>
                  <input required name="cep" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="32801" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary"/> Problem Description *</label>
                <textarea required name="description" rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all resize-none" placeholder="Describe what needs to be done..."></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary"/> Availability / Notes</label>
                <input name="notes" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Preferred dates, access instructions..." />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-border/60">
                <button type="button" onClick={() => setSelectedService(null)} className="px-6 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {createMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
