import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Wallet, 
  Bell,
  CalendarDays
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meu Catálogo", href: "/catalog", icon: Briefcase },
  { name: "Ordens Atribuídas", href: "/work-orders", icon: FileText },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Financeiro", href: "/financial", icon: Wallet },
  { name: "Notificações", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.name} href={item.href} className="block">
            <div className={`
              flex items-center px-3 py-3 rounded-xl transition-all group cursor-pointer
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
            `}>
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
