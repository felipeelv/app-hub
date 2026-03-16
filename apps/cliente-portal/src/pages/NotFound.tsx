import { Link } from "wouter";
import { Home, AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-display font-bold text-foreground mb-2 text-center">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/dashboard">
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Home className="w-5 h-5" />
          Voltar para o Dashboard
        </button>
      </Link>
    </div>
  );
}
