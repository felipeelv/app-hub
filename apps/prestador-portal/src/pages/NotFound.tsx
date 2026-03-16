import { useLocation } from "wouter";
import { Button } from "@workspace/shared-ui/components/button";
import { Card, CardContent } from "@workspace/shared-ui/components/card";
import { FileQuestion, ArrowLeft } from "lucide-react";

export function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileQuestion className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Página Não Encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
