import { useState } from "react";
import { 
  useListRequesterCompanies, 
  useListProviderCompanies,
  useCreateRequesterCompany,
  useCreateProviderCompany
} from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { Plus, Building, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export function AdminCompanies() {
  const [tab, setTab] = useState<'requester'|'provider'>('requester');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: requesters, refetch: refetchReq } = useListRequesterCompanies();
  const { data: providers, refetch: refetchProv } = useListProviderCompanies();
  
  const createReq = useCreateRequesterCompany();
  const createProv = useCreateProviderCompany();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      taxId: fd.get('taxId') as string,
      address: fd.get('address') as string,
      city: fd.get('city') as string,
      state: fd.get('state') as string,
      cep: fd.get('cep') as string,
    };

    try {
      if (tab === 'requester') {
        await createReq.mutateAsync({ data });
        refetchReq();
      } else {
        await createProv.mutateAsync({ data: { ...data, commissionRate: 15 } });
        refetchProv();
      }
      toast.success("Empresa criada com sucesso!");
      setIsFormOpen(false);
    } catch {
      toast.error("Erro ao criar empresa.");
    }
  };

  const list = tab === 'requester' ? requesters : providers;

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex bg-muted p-1 rounded-xl w-fit">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'requester' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('requester')}
          >
            Contratantes
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'provider' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('provider')}
          >
            Prestadores
          </button>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-primary text-primary-foreground px-4 md:px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" /> 
          <span className="hidden sm:inline">{tab === 'requester' ? 'Nova Contratante' : 'Novo Prestador'}</span>
          <span className="sm:hidden">{tab === 'requester' ? 'Nova' : 'Novo'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {list?.map(company => (
          <div key={company.id} className="bg-card rounded-2xl p-4 md:p-6 border border-border/60 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base md:text-lg leading-tight group-hover:text-primary transition-colors truncate">{company.name}</h3>
                <p className="text-sm text-muted-foreground">CNPJ: {company.taxId || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-2 text-primary/60 shrink-0" /> 
                <span className="truncate">{company.email}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-2 text-primary/60 shrink-0" /> {company.phone || '-'}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2 text-primary/60 shrink-0" /> 
                {company.city ? `${company.city}, ${company.state}` : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border/60 bg-muted/30">
              <h2 className="text-xl font-display font-bold">
                {tab === 'requester' ? 'Nova Contratante' : 'Novo Prestador'}
              </h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nome da Empresa *</label>
                <input required name="name" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Email *</label>
                  <input required type="email" name="email" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Telefone</label>
                  <input name="phone" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">CNPJ</label>
                <input name="taxId" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Endereço</label>
                <input name="address" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Cidade</label>
                  <input name="city" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Estado</label>
                  <input name="state" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">CEP</label>
                <input name="cep" className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-border/60">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createReq.isPending || createProv.isPending} className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:shadow-lg transition-all disabled:opacity-50">
                  {createReq.isPending || createProv.isPending ? "Criando..." : "Criar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
