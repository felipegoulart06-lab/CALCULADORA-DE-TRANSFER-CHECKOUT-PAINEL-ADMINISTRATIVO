import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { geocodeBrazil } from "@/lib/maps";

export interface BookingFormData {
  tripType: "one-way" | "round-trip";
  pickupAddress: string;
  destinationAddress: string;
  returnPickupAddress?: string;
  returnDestinationAddress?: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  returnPickupDate?: string;
  returnPickupTime?: string;
  returnPassengers?: number;
}

export function BookingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookingFormData>({
    tripType: "one-way",
    pickupAddress: "",
    destinationAddress: "",
    pickupDate: "",
    pickupTime: "",
    passengers: 1,
    returnPickupAddress: "",
    returnDestinationAddress: "",
    returnPickupDate: "",
    returnPickupTime: "",
    returnPassengers: 1,
  });
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const origin = await geocodeBrazil(formData.pickupAddress);
      const dest = await geocodeBrazil(formData.destinationAddress);

      const params = new URLSearchParams({
        tripType: formData.tripType,
        pickupAddress: formData.pickupAddress,
        destinationAddress: formData.destinationAddress,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        passengers: formData.passengers.toString(),
        originLat: String(origin.lat),
        originLng: String(origin.lng),
        destLat: String(dest.lat),
        destLng: String(dest.lng),
      });

      if (formData.tripType === "round-trip" && formData.returnPickupAddress) {
        params.append("returnPickupAddress", formData.returnPickupAddress);
        params.append("returnDestinationAddress", formData.returnDestinationAddress || "");
        params.append("returnPickupDate", formData.returnPickupDate || "");
        params.append("returnPickupTime", formData.returnPickupTime || "");
        params.append("returnPassengers", String(formData.returnPassengers || 1));
      }

      navigate(`/results?${params.toString()}`);
    } catch (error) {
      toast({
        title: "Endereço não encontrado no Brasil",
        description: "Verifique os endereços de embarque e destino.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Tipo de Viagem</Label>
        <RadioGroup
          value={formData.tripType}
          onValueChange={(value: "one-way" | "round-trip") =>
            setFormData({ ...formData, tripType: value })
          }
          className="flex gap-4"
        >
          {/* Botão Somente Ida */}
          <div
            className={`flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${formData.tripType === "one-way" ? "border-accent bg-accent/10" : "hover:border-accent"}`}
            onClick={() => setFormData({ ...formData, tripType: "one-way" })}
            role="button"
            aria-pressed={formData.tripType === "one-way"}
          >
            <RadioGroupItem value="one-way" id="one-way" />
            <Label htmlFor="one-way" className="cursor-pointer">Somente Ida</Label>
          </div>

          {/* Botão Ida e Volta */}
          <div
            className={`flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${formData.tripType === "round-trip" ? "border-accent bg-accent/10" : "hover:border-accent"}`}
            onClick={() => setFormData({ ...formData, tripType: "round-trip" })}
            role="button"
            aria-pressed={formData.tripType === "round-trip"}
          >
            <RadioGroupItem value="round-trip" id="round-trip" />
            <Label htmlFor="round-trip" className="cursor-pointer">Ida e Volta</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="pickupAddress">Endereço de Embarque *</Label>
          <Input
            id="pickupAddress"
            placeholder="Ex: Aeroporto Internacional de Guarulhos"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            required
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationAddress">Endereço de Destino *</Label>
          <Input
            id="destinationAddress"
            placeholder="Ex: Av. Paulista, 1000 - São Paulo"
            value={formData.destinationAddress}
            onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
            required
            className="h-12"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="pickupDate">Data *</Label>
          <Input
            id="pickupDate"
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            required
            min={new Date().toISOString().split("T")[0]}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickupTime">Horário *</Label>
          <Input
            id="pickupTime"
            type="time"
            value={formData.pickupTime}
            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            required
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passengers">Passageiros *</Label>
          <Input
            id="passengers"
            type="number"
            min="1"
            max="14"
            value={formData.passengers}
            onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
            required
            className="h-12"
          />
        </div>
      </div>

      {formData.tripType === "round-trip" && (
        <div className="grid md:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-lg border">
          <div className="space-y-2">
            <Label htmlFor="returnPickupAddress">Endereço de Embarque (Volta)</Label>
            <Input
              id="returnPickupAddress"
              placeholder="Normalmente o destino da ida"
              value={formData.returnPickupAddress}
              onChange={(e) => setFormData({ ...formData, returnPickupAddress: e.target.value })}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnDestinationAddress">Endereço de Destino (Volta)</Label>
            <Input
              id="returnDestinationAddress"
              placeholder="Normalmente a origem da ida"
              value={formData.returnDestinationAddress}
              onChange={(e) => setFormData({ ...formData, returnDestinationAddress: e.target.value })}
              className="h-12"
              required
            />
          </div>

          <div className="md:col-span-2 grid md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="returnPickupDate">Data (Volta) *</Label>
              <Input
                id="returnPickupDate"
                type="date"
                value={formData.returnPickupDate}
                onChange={(e) => setFormData({ ...formData, returnPickupDate: e.target.value })}
                required
                min={new Date().toISOString().split("T")[0]}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPickupTime">Horário (Volta) *</Label>
              <Input
                id="returnPickupTime"
                type="time"
                value={formData.returnPickupTime}
                onChange={(e) => setFormData({ ...formData, returnPickupTime: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPassengers">Passageiros (Volta) *</Label>
              <Input
                id="returnPassengers"
                type="number"
                min="1"
                max="14"
                value={formData.returnPassengers}
                onChange={(e) => setFormData({ ...formData, returnPassengers: parseInt(e.target.value) })}
                required
                className="h-12"
              />
            </div>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        size="lg" 
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-primary shadow-lg hover:shadow-xl transition-all"
        disabled={submitting}
      >
        <Calendar className="mr-2 h-5 w-5" />
        {submitting ? "Validando endereços..." : "Ver Opções e Preços"}
      </Button>
    </form>
  );
}
