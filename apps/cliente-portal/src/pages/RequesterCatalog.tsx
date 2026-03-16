import { useState } from "react";
import { useListCatalogForRequester, useCreateWorkOrder } from "@workspace/api-client-react";
import { Search, MapPin, Clock, FileText, CalendarDays, X } from "lucide-react";
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
      catalogItemId: selectedService.id,
      location: fd.get('location') as string,
      cep: fd.get('cep') as string,
      description: fd.get('description') as string,
      notes: fd.get('notes') as string,
    });
    setLocation("/work-orders");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-primary/5 p-4 md:p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-primary">Catálogo de Serviços</h1>
          <p className="text-primary/70 mt-1 text-sm md:text-base">Solicite serviços de prestadores certificados</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar serviços..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/20 bg-background text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-card rounded-2xl animate-pulse"></div>)
        ) : !filtered?.length ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Nenhum serviço disponível no momento.</div>
        ) : (
          filtered?.map(item => (
            <div key={item.id} className="bg-card rounded-2xl p-4 md:p-6 border border-border/60 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
              <div className="mb-3 md:mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70 bg-primary/10 px-2.5 py-1 rounded-md">
                  {item.category}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg md:text-xl mb-2 text-foreground">{item.name}</h3>
              <p className="text-muted-foreground text-sm flex-1 line-clamp-3 mb-4 md:mb-6">
                {item.description || "Sem descrição disponível."}
              </p>
              <div className="mt-auto space-y-3 md:space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>~{item.estimatedDays || 1} dia(s)</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedService(item)}
                  className="w-full py-3 bg-muted text-foreground hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold transition-colors"
                >
                  Solicitar Serviço
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 md:px-8 md:py-6 border-b border-border/60 bg-primary/5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Solicitar Serviço</h2>
                <p className="text-muted-foreground mt-1">{selectedService.name}</p>
              </div>
              <button 
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequest} className="p-6 md:p-8 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary"/> Endereço do Serviço *
                  </label>
                  <input 
                    required 
                    name="location" 
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm md:text-base" 
                    placeholder="Rua Exemplo, 123, São Paulo, SP" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary"/> CEP *
                  </label>
                  <input 
                    required 
                    name="cep" 
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm md:text-base" 
                    placeholder="01310-000" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary"/> Descrição do Problema *
                </label>
                <textarea 
                  required 
                  name="description" 
                  rows={3} 
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-sm md:text-base" 
                  placeholder="Descreva o que precisa ser feito..."
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary"/> Disponibilidade / Observações
                </label>
                <input 
                  name="notes" 
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm md:text-base" 
                  placeholder="Datas preferidas, instruções de acesso..." 
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t border-border/60">
                <button 
                  type="button" 
                  onClick={() => setSelectedService(null)} 
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending} 
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
