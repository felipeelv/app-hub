import { Switch, Route, useLocation } from "wouter";
import { AppLayout } from "./components/layout/AppLayout";
import { ProviderDashboard } from "./pages/ProviderDashboard";
import { ProviderCatalog } from "./pages/ProviderCatalog";
import { ProviderWorkOrders } from "./pages/ProviderWorkOrders";
import { ProviderWorkOrderDetail } from "./pages/ProviderWorkOrderDetail";
import { ProviderFinancial } from "./pages/ProviderFinancial";
import { Agenda } from "./pages/Agenda";
import { Notifications } from "./pages/Notifications";
import { NotFound } from "./pages/NotFound";
import { useAuth } from "./lib/auth";

function AppContent() {
  const { isLoading, activeProfile } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você precisa fazer login para acessar o portal.</p>
          <button 
            onClick={() => setLocation("/login")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  if (activeProfile.role !== "provider") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Acesso restrito a prestadores de serviço.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={ProviderDashboard} />
        <Route path="/dashboard" component={ProviderDashboard} />
        <Route path="/catalog" component={ProviderCatalog} />
        <Route path="/work-orders" component={ProviderWorkOrders} />
        <Route path="/work-orders/:id" component={ProviderWorkOrderDetail} />
        <Route path="/financial" component={ProviderFinancial} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/notifications" component={Notifications} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return <AppContent />;
}

export default App;
