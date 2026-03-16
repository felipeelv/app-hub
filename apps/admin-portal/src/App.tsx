import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/components/sonner";
import { TooltipProvider } from "@workspace/shared-ui/components/tooltip";
import { AuthProvider } from "./lib/auth";
import { AppLayout } from "./components/layout/AppLayout";

import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminWorkOrders } from "./pages/AdminWorkOrders";
import { AdminWorkOrderDetail } from "./pages/AdminWorkOrderDetail";
import { AdminCompanies } from "./pages/AdminCompanies";
import { AdminInvoices } from "./pages/AdminInvoices";
import { AdminPayments } from "./pages/AdminPayments";
import { AdminPayouts } from "./pages/AdminPayouts";
import { AdminTravelPricing } from "./pages/AdminTravelPricing";
import { AdminAuditLog } from "./pages/AdminAuditLog";
import { Notifications } from "./pages/Notifications";
import Agenda from "./pages/Agenda";
import { NotFound } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/work-orders" component={AdminWorkOrders} />
        <Route path="/work-orders/:id" component={AdminWorkOrderDetail} />
        <Route path="/companies" component={AdminCompanies} />
        <Route path="/invoices" component={AdminInvoices} />
        <Route path="/payments" component={AdminPayments} />
        <Route path="/payouts" component={AdminPayouts} />
        <Route path="/travel-pricing" component={AdminTravelPricing} />
        <Route path="/audit" component={AdminAuditLog} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/agenda" component={Agenda} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
