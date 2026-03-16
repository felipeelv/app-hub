import { Switch, Route } from 'wouter'
import { AppLayout } from './components/layout/AppLayout'
import { RequesterDashboard } from './pages/RequesterDashboard'
import { RequesterCatalog } from './pages/RequesterCatalog'
import { RequesterWorkOrders } from './pages/RequesterWorkOrders'
import { RequesterWorkOrderDetail } from './pages/RequesterWorkOrderDetail'
import { RequesterInvoices } from './pages/RequesterInvoices'
import Agenda from './pages/Agenda'
import { Notifications } from './pages/Notifications'
import { NotFound } from './pages/NotFound'
import { useAuth } from './lib/auth'

function App() {
  const { isLoading, activeProfile } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você precisa fazer login para acessar o portal.</p>
          <a 
            href="/login" 
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={RequesterDashboard} />
        <Route path="/dashboard" component={RequesterDashboard} />
        <Route path="/catalog" component={RequesterCatalog} />
        <Route path="/work-orders" component={RequesterWorkOrders} />
        <Route path="/work-orders/:id" component={RequesterWorkOrderDetail} />
        <Route path="/invoices" component={RequesterInvoices} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/notifications" component={Notifications} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  )
}

export default App
