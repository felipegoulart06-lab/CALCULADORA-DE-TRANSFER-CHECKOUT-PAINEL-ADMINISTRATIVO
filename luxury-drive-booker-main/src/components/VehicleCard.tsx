import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Luggage, Car } from "lucide-react";

interface VehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    image_url: string | null;
    capacity_passengers: number;
    capacity_luggage: number;
    base_rate: number;
    rate_per_km: number;
  };
  distance?: number;
  duration?: number;
  distanceReturn?: number;
  durationReturn?: number;
  tripType: "one-way" | "round-trip";
  pricingConfig?: any;
  pickupDate?: string;
  pickupTime?: string;
  onSelect: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, distance = 0, duration = 0, distanceReturn = 0, durationReturn = 0, tripType, pricingConfig, pickupDate, pickupTime, onSelect }: VehicleCardProps) {
  const calculatePrice = () => {
    const basePrice = Number(vehicle.base_rate);
    const kmRate = Number(vehicle.rate_per_km);
    const minuteRate = Number(pricingConfig?.preco_minuto ?? 0);
    const taxaMinima = Number(pricingConfig?.taxa_minima ?? 0);
    const descontoIdaVolta = Number(pricingConfig?.desconto_ida_volta ?? 0.1);

    let dateObj: Date | null = null;
    if (pickupDate && pickupTime) {
      const iso = `${pickupDate}T${pickupTime}`;
      const parsed = new Date(iso);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
    const hour = dateObj ? dateObj.getHours() : null;
    const isNight = hour !== null ? hour >= 22 || hour < 6 : false;
    const day = dateObj ? dateObj.getDay() : null;
    const isWeekend = day === 0 || day === 6;

    const multNight = Number(pricingConfig?.multiplicador_noturno ?? 1);
    const multWeekend = Number(pricingConfig?.multiplicador_fim_semana ?? 1);

    const oneWayMinutes = duration ?? 0;
    const oneWayCost = basePrice + kmRate * (distance ?? 0) + minuteRate * oneWayMinutes;
    const adjustedOneWay = Math.max(oneWayCost, taxaMinima) * (isNight ? multNight : 1) * (isWeekend ? multWeekend : 1);

    if (tripType === "round-trip") {
      const retMinutes = durationReturn || oneWayMinutes;
      const retDistance = distanceReturn || (distance ?? 0);
      const retCost = basePrice + kmRate * retDistance + minuteRate * retMinutes;
      const adjustedReturn = Math.max(retCost, taxaMinima) * (isNight ? multNight : 1) * (isWeekend ? multWeekend : 1);
      const total = (adjustedOneWay + adjustedReturn) * (1 - descontoIdaVolta);
      return total.toFixed(2);
    }

    return adjustedOneWay.toFixed(2);
  };

  const totalPrice = calculatePrice();

  const oneWayDistance = distance ?? 0;
  const oneWayDuration = duration ?? 0;
  const totalDistance = tripType === "round-trip" ? oneWayDistance + (distanceReturn || oneWayDistance) : oneWayDistance;
  const totalDuration = tripType === "round-trip" ? oneWayDuration + (durationReturn || oneWayDuration) : oneWayDuration;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-accent">
      <div className="relative h-48 bg-gradient-to-br from-luxury-dark to-luxury-gray overflow-hidden">
        {vehicle.image_url ? (
          <img 
            src={vehicle.image_url} 
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Car className="h-24 w-24 text-accent" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">{vehicle.name}</CardTitle>
        <CardDescription className="text-base">{vehicle.category}</CardDescription>
        {vehicle.description && (
          <p className="text-sm text-muted-foreground">{vehicle.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span>{vehicle.capacity_passengers} passageiros</span>
          </div>
          <div className="flex items-center gap-2">
            <Luggage className="h-4 w-4 text-accent" />
            <span>{vehicle.capacity_luggage} malas</span>
          </div>
        </div>

        {oneWayDistance > 0 && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Distância (ida):</span>
                <p className="font-semibold">{oneWayDistance.toFixed(1)} km</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duração (ida):</span>
                <p className="font-semibold">{Math.round(oneWayDuration)} min</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tarifa base:</span>
                <p className="font-semibold">R$ {Number(vehicle.base_rate).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Por km:</span>
                <p className="font-semibold">R$ {Number(vehicle.rate_per_km).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {tripType === "round-trip" && totalDistance > 0 && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Distância total (ida + volta):</span>
                <p className="font-semibold">{totalDistance.toFixed(1)} km</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duração total (ida + volta):</span>
                <p className="font-semibold">{Math.round(totalDuration)} min</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Preço Total</p>
              <p className="text-3xl font-bold text-accent">R$ {totalPrice}</p>
              {tripType === "round-trip" && (
                <p className="text-xs text-muted-foreground">{pricingConfig?.desconto_ida_volta ? `${Math.round(Number(pricingConfig.desconto_ida_volta) * 100)}%` : '10%'} de desconto aplicado</p>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => onSelect(vehicle.id)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Selecionar e Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
