import { BookingForm } from "@/components/BookingForm";

import heroImage from "/placeholder.svg";

const Index = () => {
  const projectName = localStorage.getItem('lux-project-name') || 'Luxury Drive';
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-luxury-dark text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-accent/10 border border-accent rounded-full text-accent text-sm font-semibold mb-4">
              Transfer Executivo Premium
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              {projectName}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 font-light">
              Experiência Premium em Transfer Executivo
            </p>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Reserve online seu transporte VIP com a frota mais sofisticada. 
              Mercedes-Benz, BMW e Range Rover ao seu serviço.
            </p>
          </div>
        </div>
      </section>



      {/* Booking Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Reserve Sua Viagem</h2>
              <p className="text-lg text-muted-foreground">
                Preencha os dados abaixo e encontre o veículo perfeito para você
              </p>
            </div>

            <div className="bg-card border shadow-xl rounded-2xl p-8 md:p-12">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-luxury-dark text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70">
            © 2025 {projectName}. Transfer Executivo de Luxo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
