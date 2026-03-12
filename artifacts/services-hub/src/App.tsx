import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";

import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminWorkOrders } from "@/pages/admin/AdminWorkOrders";
import { AdminWorkOrderDetail } from "@/pages/admin/AdminWorkOrderDetail";
import { AdminCompanies } from "@/pages/admin/AdminCompanies";
import { AdminInvoices } from "@/pages/admin/AdminInvoices";
import { AdminPayments } from "@/pages/admin/AdminPayments";
import { AdminPayouts } from "@/pages/admin/AdminPayouts";
import { AdminTravelPricing } from "@/pages/admin/AdminTravelPricing";
import { AdminAuditLog } from "@/pages/admin/AdminAuditLog";

import { RequesterDashboard } from "@/pages/requester/RequesterDashboard";
import { RequesterCatalog } from "@/pages/requester/RequesterCatalog";
import { RequesterInvoices } from "@/pages/requester/RequesterInvoices";
import { RequesterWorkOrders } from "@/pages/requester/RequesterWorkOrders";
import { RequesterWorkOrderDetail } from "@/pages/requester/RequesterWorkOrderDetail";

import { ProviderDashboard } from "@/pages/provider/ProviderDashboard";
import { ProviderWorkOrders } from "@/pages/provider/ProviderWorkOrders";
import { ProviderWorkOrderDetail } from "@/pages/provider/ProviderWorkOrderDetail";
import { ProviderCatalog } from "@/pages/provider/ProviderCatalog";
import { ProviderFinancial } from "@/pages/provider/ProviderFinancial";

import { Notifications } from "@/pages/shared/Notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function Fallback() {
  return (
    <div className="p-12 text-center text-muted-foreground">
      <p className="text-lg">Página não encontrada</p>
      <p className="text-sm mt-1">Use o menu lateral para navegar.</p>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Admin */}
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/work-orders/:id" component={AdminWorkOrderDetail} />
        <Route path="/admin/work-orders" component={AdminWorkOrders} />
        <Route path="/admin/companies" component={AdminCompanies} />
        <Route path="/admin/invoices" component={AdminInvoices} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/payouts" component={AdminPayouts} />
        <Route path="/admin/travel-pricing" component={AdminTravelPricing} />
        <Route path="/admin/audit" component={AdminAuditLog} />
        <Route path="/admin/notifications" component={Notifications} />

        {/* Requester */}
        <Route path="/requester/dashboard" component={RequesterDashboard} />
        <Route path="/requester/catalog" component={RequesterCatalog} />
        <Route path="/requester/work-orders/:id" component={RequesterWorkOrderDetail} />
        <Route path="/requester/work-orders" component={RequesterWorkOrders} />
        <Route path="/requester/invoices" component={RequesterInvoices} />
        <Route path="/requester/notifications" component={Notifications} />

        {/* Provider */}
        <Route path="/provider/dashboard" component={ProviderDashboard} />
        <Route path="/provider/catalog" component={ProviderCatalog} />
        <Route path="/provider/work-orders/:id" component={ProviderWorkOrderDetail} />
        <Route path="/provider/work-orders" component={ProviderWorkOrders} />
        <Route path="/provider/financial" component={ProviderFinancial} />
        <Route path="/provider/notifications" component={Notifications} />

        <Route path="/" component={() => <div className="p-12 text-center text-muted-foreground">Use o menu lateral para navegar.</div>} />
        <Route component={Fallback} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
