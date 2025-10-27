import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [checkoutConfig, setCheckoutConfig] = useState<any | null>(null);
  const [pricingConfig, setPricingConfig] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    cpf: "",
    flightNumber: "",
    hotelName: "",
    specialNotes: "",
  });

  // Get params
  const vehicleId = searchParams.get("vehicleId");
  const tripType = searchParams.get("tripType") as "one-way" | "round-trip";
  const pickupAddress = searchParams.get("pickupAddress") || "";
  const destinationAddress = searchParams.get("destinationAddress") || "";
  const pickupDate = searchParams.get("pickupDate") || "";
  const pickupTime = searchParams.get("pickupTime") || "";
  const passengers = parseInt(searchParams.get("passengers") || "1");
  const distance = parseFloat(searchParams.get("distance") || "0");
  const duration = parseFloat(searchParams.get("duration") || "0");
  const returnPickupAddress = searchParams.get("returnPickupAddress") || "";
  const returnDestinationAddress = searchParams.get("returnDestinationAddress") || "";
  const returnPickupDate = searchParams.get("returnPickupDate") || "";
  const returnPickupTime = searchParams.get("returnPickupTime") || "";
  const returnPassengers = parseInt(searchParams.get("returnPassengers") || passengers.toString());
  const distanceReturn = parseFloat(searchParams.get("distanceReturn") || distance.toString());
  const durationReturn = parseFloat(searchParams.get("durationReturn") || duration.toString());

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
      loadConfigs();
    }
  }, [vehicleId]);

  // Mocks para simulação sem banco
  const MOCK_VEHICLES = [
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
  
  const MOCK_CHECKOUT_FIELDS = [
    { nome_campo: "Nome completo", tipo: "texto", obrigatorio: true, ordem: 1, ativo: true },
    { nome_campo: "E-mail", tipo: "email", obrigatorio: true, ordem: 2, ativo: true },
    { nome_campo: "Telefone/WhatsApp", tipo: "texto", obrigatorio: true, ordem: 3, ativo: true },
    { nome_campo: "CPF", tipo: "texto", obrigatorio: true, ordem: 4, ativo: true },
    { nome_campo: "Número do voo", tipo: "texto", obrigatorio: false, ordem: 5, ativo: true },
  ];
  const MOCK_CHECKOUT_CONFIG = { acao_pos_envio: "WEBHOOK", url_destino: "", metodo_http: "POST" };

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error) {
      console.error("Error loading vehicle:", error);
      // Fallback: tentar Admin API quando o ID vier do admin ou Supabase falhar
      try {
        const token = await adminLoginToken();
        if (token) {
          const idStr = String(vehicleId || "");
          const isAdminId = idStr.startsWith("admin-");
          const lookupId = isAdminId ? idStr.replace("admin-", "") : idStr;
          const adminVehicle = await fetchAdminVehicleById(lookupId);
          if (adminVehicle) {
            setVehicle(adminVehicle);
            return;
          }
        }
      } catch (e) {
        console.warn("Fallback Admin API falhou", e);
      }
      const mock = MOCK_VEHICLES.find(v => v.id === vehicleId);
      if (mock) {
        setVehicle(mock);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    let fieldsLoaded = false;
    try {
      const { data: fields } = await (supabase as any)
        .from("checkout_fields")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (fields && fields.length) {
        setDynamicFields(fields);
        fieldsLoaded = true;
      } else {
        setDynamicFields(MOCK_CHECKOUT_FIELDS);
      }
    } catch (e) {
      console.warn("Não foi possível carregar checkout_fields", e);
      setDynamicFields(MOCK_CHECKOUT_FIELDS);
    }
    let cfgLoaded = false;
    try {
      const { data: cfg } = await (supabase as any)
        .from("checkout_config")
        .select("*")
        .limit(1)
        .single();
      if (cfg) {
        setCheckoutConfig(cfg);
        cfgLoaded = true;
      } else {
        setCheckoutConfig(MOCK_CHECKOUT_CONFIG);
      }
    } catch (e) {
      console.warn("Não foi possível carregar checkout_config", e);
      setCheckoutConfig(MOCK_CHECKOUT_CONFIG);
    }
    try {
      const { data: pcfg } = await (supabase as any)
        .from("pricing_config")
        .select("*")
        .limit(1)
        .single();
      setPricingConfig(pcfg || null);
    } catch (e) {
      console.warn("Não foi possível carregar pricing_config", e);
      setPricingConfig(null);
    }

    // Fallback: se não carregou via Supabase, tentar Admin API
    if (!fieldsLoaded || !cfgLoaded) {
      try {
        await fetchAdminCheckoutData(setDynamicFields, setCheckoutConfig);
      } catch (e) {
        console.warn("Fallback Admin API para checkout falhou", e);
      }
    }
  };

  const calculatePrice = () => {
    if (!vehicle) return 0;
    const basePrice = Number(vehicle.base_rate);
    const kmRate = Number(vehicle.rate_per_km);
    const minuteRate = Number(pricingConfig?.preco_minuto ?? 0);
    const taxaMinima = Number(pricingConfig?.taxa_minima ?? 0);
    const descontoIdaVolta = Number(pricingConfig?.desconto_ida_volta ?? 0.1);

    const when = `${pickupDate}T${pickupTime}`;
    const dt = new Date(when);
    const hour = isNaN(dt.getTime()) ? null : dt.getHours();
    const isNight = hour !== null ? hour >= 22 || hour < 6 : false;
    const day = isNaN(dt.getTime()) ? null : dt.getDay();
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
      return total;
    }

    return adjustedOneWay;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);
    return [part1, part2, part3].filter(Boolean).join(".") + (part4 ? `-${part4}` : "");
  };

  // Validação de CPF (aceita com ou sem máscara)
  const isValidCPF = (value: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // rejeita sequências
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check1 = (sum * 10) % 11;
    if (check1 === 10) check1 = 0;
    if (check1 !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    let check2 = (sum * 10) % 11;
    if (check2 === 10) check2 = 0;
    return check2 === parseInt(digits[10]);
  };

  const handleDynamicChange = (field: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // validação de campos adicionais removida para simplificar o checkout

      // Validar CPF (sem bloquear por pattern do HTML)
      if (!isValidCPF(formData.cpf)) {
        toast({ title: "CPF inválido", description: "Verifique o número informado.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const totalPrice = calculatePrice();
      const totalDuration = tripType === "round-trip" ? (duration + durationReturn) : duration;

      const payload: any = {
        vehicle_id: vehicleId,
        trip_type: tripType,
        pickup_address: pickupAddress,
        destination_address: destinationAddress,
        pickup_datetime: `${pickupDate}T${pickupTime}`,
        passengers,
        distance_km: distance,
        duration_minutes: Math.round(totalDuration),
        base_price: Number(vehicle.base_rate),
        total_price: totalPrice,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        flight_number: formData.flightNumber,
        hotel_name: formData.hotelName,
        special_notes: formData.specialNotes,
        extra_fields: dynamicValues,
      };

      const { error } = await (supabase as any).from("bookings").insert(payload);
      if (error) throw error;

      // redirecionar sempre para a página de pré-reserva
      navigate("/pre-reserva");

      // clear form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        cpf: "",
        flightNumber: "",
        hotelName: "",
        specialNotes: "",
      });
      setDynamicValues({});

      // Redirect to confirmation page
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Erro ao criar reserva",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Veículo não encontrado</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const totalPrice = calculatePrice();
  const totalDistance = tripType === "round-trip" ? distance + distanceReturn : distance;
  const totalDuration = tripType === "round-trip" ? duration + durationReturn : duration;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-luxury-dark to-luxury-gray text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:bg-accent hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Finalizar Reserva</h1>
          <p className="text-white/80">Confirme os detalhes e complete sua reserva</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">De:</span>
                    <span className="font-medium text-right">{pickupAddress.slice(0, 30)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Para:</span>
                    <span className="font-medium text-right">{destinationAddress.slice(0, 30)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span className="font-medium">
                      {new Date(`${pickupDate}T${pickupTime}`).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passageiros:</span>
                    <span className="font-medium">{passengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distância (ida):</span>
                    <span className="font-medium">{distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração (ida):</span>
                    <span className="font-medium">{Math.round(duration)} min</span>
                  </div>
                </div>

                {tripType === "round-trip" && (
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="font-semibold text-muted-foreground">Dados da Volta</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">De:</span>
                      <span className="font-medium text-right">{(returnPickupAddress || "—").slice(0, 30)}{returnPickupAddress ? "..." : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Para:</span>
                      <span className="font-medium text-right">{(returnDestinationAddress || "—").slice(0, 30)}{returnDestinationAddress ? "..." : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data/Hora:</span>
                      <span className="font-medium">
                        {returnPickupDate && returnPickupTime
                          ? new Date(`${returnPickupDate}T${returnPickupTime}`).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passageiros:</span>
                      <span className="font-medium">{returnPassengers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distância (volta):</span>
                      <span className="font-medium">{distanceReturn ? distanceReturn.toFixed(1) + " km" : `≈ ${distance.toFixed(1)} km`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração (volta):</span>
                      <span className="font-medium">{durationReturn ? Math.round(durationReturn) + " min" : `≈ ${Math.round(duration)} min`}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="font-semibold text-muted-foreground">Totais</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distância total:</span>
                    <span className="font-medium">{totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração total:</span>
                    <span className="font-medium">{Math.round(totalDuration)} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Seus Dados</CardTitle>
                <CardDescription>
                  Preencha suas informações para confirmar a reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Nome Completo *</Label>
                      <Input
                        id="customerName"
                        required
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        placeholder="João Silva"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">E-mail *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                        placeholder="joao@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Telefone/WhatsApp *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        required
                        inputMode="numeric"
                        maxLength={14}
                        // pattern removido para aceitar com ou sem máscara
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                        }
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  {/* Campos de voo, hotel e observações removidos do checkout inicial */}

                  {/* Seção "Campos adicionais" removida para evitar duplicidade e simplificar o formulário */}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-primary"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Confirmar Reserva
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:4000";

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

async function adminLoginToken(): Promise<string | null> {
  try {
    const resp = await fetch(`${ADMIN_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@luxurydrive.com", senha: "admin123" }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.token || null;
  } catch {
    return null;
  }
}

async function fetchAdminVehicleById(idStr: string): Promise<any | null> {
  try {
    const token = await adminLoginToken();
    if (!token) return null;
    const res = await fetch(`${ADMIN_API_URL}/veiculos`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const items = await res.json();
    const idNum = Number(String(idStr).replace(/^[^0-9]*/,'').split('-').pop());
    const found = (Array.isArray(items) ? items : []).find((v: any) => Number(v.id) === idNum);
    return found ? mapAdminVehicle(found) : null;
  } catch (e) {
    console.warn("Falha ao obter veículo via Admin API:", e);
    return null;
  }
}

async function fetchAdminCheckoutData(setFields: Function, setConfig: Function) {
  try {
    const token = await adminLoginToken();
    if (!token) return;
    const [rFields, rConfig] = await Promise.all([
      fetch(`${ADMIN_API_URL}/checkout/campos`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${ADMIN_API_URL}/checkout/config`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (rFields.ok) {
      const campos = await rFields.json();
      if (Array.isArray(campos) && campos.length) setFields(campos);
    }
    if (rConfig.ok) {
      const cfg = await rConfig.json();
      if (cfg) setConfig(cfg);
    }
  } catch (e) {
    console.warn("Falha ao obter dados de checkout via Admin API:", e);
  }
}
