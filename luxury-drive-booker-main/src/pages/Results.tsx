import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { geocodeBrazil, routeOsrm } from "@/lib/maps";

interface Vehicle {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  capacity_passengers: number;
  capacity_luggage: number;
  base_rate: number;
  rate_per_km: number;
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [distanceReturn, setDistanceReturn] = useState(0);
  const [durationReturn, setDurationReturn] = useState(0);
  const [pricingConfig, setPricingConfig] = useState<any | null>(null);

  const tripType = searchParams.get("tripType") as "one-way" | "round-trip";
  const pickupAddress = searchParams.get("pickupAddress") || "";
  const destinationAddress = searchParams.get("destinationAddress") || "";
  const pickupDate = searchParams.get("pickupDate") || "";
  const pickupTime = searchParams.get("pickupTime") || "";
  const passengers = parseInt(searchParams.get("passengers") || "1");
  const originLat = parseFloat(searchParams.get("originLat") || "");
  const originLng = parseFloat(searchParams.get("originLng") || "");
  const destLat = parseFloat(searchParams.get("destLat") || "");
  const destLng = parseFloat(searchParams.get("destLng") || "");
  const hasCoords = [originLat, originLng, destLat, destLng].every((v) => Number.isFinite(v));
  const returnPickupAddress = searchParams.get("returnPickupAddress") || "";
  const returnDestinationAddress = searchParams.get("returnDestinationAddress") || "";
  const returnPickupDate = searchParams.get("returnPickupDate") || "";
  const returnPickupTime = searchParams.get("returnPickupTime") || "";
  const returnPassengers = parseInt(searchParams.get("returnPassengers") || passengers.toString());

  useEffect(() => {
    loadVehicles();
    calculateDistanceAndDuration();
    loadPricingConfig();
  }, [tripType, passengers, pickupAddress, destinationAddress, originLat, originLng, destLat, destLng, returnPickupAddress, returnDestinationAddress, returnPickupDate, returnPickupTime]);

  const calculateDistanceAndDuration = async () => {
    if (!pickupAddress || !destinationAddress) return;
    // reset volta
    setDistanceReturn(0);
    setDurationReturn(0);
    try {
      let origin: { lat: number; lng: number };
      let dest: { lat: number; lng: number };

      if (hasCoords) {
        origin = { lat: originLat, lng: originLng };
        dest = { lat: destLat, lng: destLng };
      } else {
        origin = await geocodeBrazil(pickupAddress);
        dest = await geocodeBrazil(destinationAddress);
      }

      const { distanceKm, durationMin } = await routeOsrm(origin, dest);
      setDistance(distanceKm);
      setDuration(durationMin);
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      const fallbackDistance = 20; // 20 km
      const fallbackDuration = fallbackDistance / 0.6; // ~60 km/h
      setDistance(fallbackDistance);
      setDuration(fallbackDuration);
      toast({
        title: "Não foi possível calcular a rota real",
        description: "Mostrando estimativa baseada em distância média.",
        variant: "destructive",
      });
    }

    // calcular volta quando houver ida e volta
    if (tripType === "round-trip" && returnPickupAddress && returnDestinationAddress) {
      try {
        const returnOrigin = await geocodeBrazil(returnPickupAddress);
        const returnDest = await geocodeBrazil(returnDestinationAddress);
        const { distanceKm: distanceKmReturn, durationMin: durationMinReturn } = await routeOsrm(returnOrigin, returnDest);
        setDistanceReturn(distanceKmReturn);
        setDurationReturn(durationMinReturn);
      } catch (error) {
        console.error("Erro ao calcular rota de volta:", error);
        // usa a ida como estimativa para a volta
        setDistanceReturn((prev) => prev || distance);
        setDurationReturn((prev) => prev || duration);
        toast({
          title: "Não foi possível calcular a rota da volta",
          description: "Usando estimativa igual à ida para o total.",
          variant: "destructive",
        });
      }
    }
  };

  // Mock vehicles para simulação quando o banco estiver indisponível
  const MOCK_VEHICLES: Vehicle[] = [
    {
      id: "mock-mercedes-e",
      name: "Mercedes-Benz Classe E",
      category: "Sedan",
      description: "Sedan executivo de luxo com conforto excepcional.",
      image_url: "/placeholder.svg",
      capacity_passengers: 3,
      capacity_luggage: 3,
      base_rate: 250,
      rate_per_km: 6,
    },
    {
      id: "mock-bmw-x5",
      name: "BMW X5",
      category: "SUV",
      description: "SUV premium com amplo espaço e tecnologia.",
      image_url: "/placeholder.svg",
      capacity_passengers: 4,
      capacity_luggage: 6,
      base_rate: 300,
      rate_per_km: 7,
    },
    {
      id: "mock-sprinter",
      name: "Mercedes-Benz Sprinter",
      category: "Van",
      description: "Van executiva para grupos e bagagens volumosas.",
      image_url: "/placeholder.svg",
      capacity_passengers: 12,
      capacity_luggage: 12,
      base_rate: 450,
      rate_per_km: 9,
    },
  ];
  const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:4000";
  
  // Mapeia veículo do Admin API para o modelo público
  const mapAdminVehicle = (v: any) => ({
    id: `admin-${v.id}`,
    name: v.nome || `${v.marca || ""} ${v.modelo || ""}`.trim(),
    category: v.categoria || "Sedan",
    description: v.descricao_curta || null,
    image_url: v.imagem_principal || "/placeholder.svg",
    capacity_passengers: Number(v.passageiros || 0),
    capacity_luggage: Number(v.malas || 0),
    base_rate: Number(v.tarifa_base || 0),
    rate_per_km: Number(v.preco_km || 0),
  });
  
  async function fetchAdminVehicles(minPassengers: number): Promise<any[] | null> {
    try {
      const loginRes = await fetch(`${ADMIN_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@luxurydrive.com", senha: "admin123" }),
      });
      if (!loginRes.ok) return null;
      const { token } = await loginRes.json();
      if (!token) return null;
      const res = await fetch(`${ADMIN_API_URL}/veiculos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const items = await res.json();
      const mapped = (Array.isArray(items) ? items : []).map(mapAdminVehicle).filter((v: any) => v.capacity_passengers >= minPassengers);
      return mapped;
    } catch (e) {
      console.warn("Falha ao obter veículos do Admin API:", e);
      return null;
    }
  }

  const loadVehicles = async () => {
    setLoading(true);
    try {
      // 1) Tenta obter do Admin API para refletir o painel
      const adminList = await fetchAdminVehicles(passengers);
      if (adminList && adminList.length) {
        setVehicles(adminList as any);
        return;
      }
  
      // 2) Supabase
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("is_available", true)
        .gte("capacity_passengers", passengers)
        .order("display_order");
      if (error) throw error;
      const list = (data && data.length ? data : MOCK_VEHICLES.filter(v => v.capacity_passengers >= passengers));
      setVehicles(list as any);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      // 3) Fallback: tenta novamente Admin API, senão usa mocks locais
      const adminFallback = await fetchAdminVehicles(passengers);
      if (adminFallback && adminFallback.length) {
        setVehicles(adminFallback as any);
      } else {
        setVehicles(MOCK_VEHICLES.filter(v => v.capacity_passengers >= passengers));
      }
    } finally {
      setLoading(false);
    }
  };



  const loadPricingConfig = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("pricing_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      setPricingConfig(data || null);
    } catch (err) {
      console.error("Erro ao carregar pricing_config:", err);
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (!selectedVehicle) return;

    const params = new URLSearchParams(searchParams);
    params.append("vehicleId", vehicleId);
    params.append("distance", distance.toString());
    params.append("duration", duration.toString());
    if (tripType === "round-trip") {
      params.set("distanceReturn", distanceReturn.toString());
      params.set("durationReturn", durationReturn.toString());
    }
    
    navigate(`/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando opções de veículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-luxury-dark to-luxury-gray text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-white hover:bg-accent hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar e Editar
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Sua Viagem de Luxo</h1>
          <p className="text-white/80">Selecione o veículo perfeito para sua viagem</p>
        </div>
      </header>

      {/* Trip Summary */}
      <div className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="font-semibold">De:</span>
              <span className="text-muted-foreground">{pickupAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="font-semibold">Para:</span>
              <span className="text-muted-foreground">{destinationAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="font-semibold">Quando:</span>
              <span className="text-muted-foreground">
                {new Date(`${pickupDate}T${pickupTime}`).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {/* Ida — Passageiros */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">Ida — Passageiros:</span>
              <span className="text-muted-foreground">{passengers}</span>
            </div>
            <div className="w-full" />
            {tripType === "round-trip" && (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-semibold">Volta — De:</span>
                  <span className="text-muted-foreground">{returnPickupAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-semibold">Volta — Para:</span>
                  <span className="text-muted-foreground">{returnDestinationAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <span className="font-semibold">Volta — Quando:</span>
                  <span className="text-muted-foreground">
                    {returnPickupDate && returnPickupTime
                      ? new Date(`${returnPickupDate}T${returnPickupTime}`).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Volta — Passageiros:</span>
                  <span className="text-muted-foreground">{returnPassengers}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <main className="container mx-auto px-4 py-12">
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              Nenhum veículo disponível para {passengers} passageiros
            </p>
            <Button onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Opções de Veículos Disponíveis</h2>
              <p className="text-muted-foreground">
                Encontramos {vehicles.length} veículo(s) para sua viagem
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  distance={distance}
                  duration={duration}
                  distanceReturn={distanceReturn}
                  durationReturn={durationReturn}
                  tripType={tripType}
                  pricingConfig={pricingConfig}
                  pickupDate={pickupDate}
                  pickupTime={pickupTime}
                  onSelect={handleVehicleSelect}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
