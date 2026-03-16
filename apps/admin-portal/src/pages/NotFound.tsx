import { Link } from "wouter";
import { Button } from "@workspace/shared-ui/components/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-4">Página não encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        A página que você está procurando não existe ou foi movida. 
        Verifique o endereço ou volte para o dashboard.
      </p>
      <Link href="/dashboard">
        <Button className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Dashboard
        </Button>
      </Link>
    </div>
  );
}
