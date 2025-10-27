import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PreReserva() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Pré-reserva enviada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Sua solicitação de reserva foi registrada com sucesso.
            </p>
            <p>
              Um atendente entrará em contato em breve para confirmar os detalhes
              e finalizar o processo.
            </p>
            <div className="pt-2">
              <Button asChild className="w-full">
                <Link to="/">Voltar à página inicial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}