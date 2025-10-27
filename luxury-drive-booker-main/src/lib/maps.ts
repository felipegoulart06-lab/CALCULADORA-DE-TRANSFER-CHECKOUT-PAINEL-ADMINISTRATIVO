export type LatLng = { lat: number; lng: number };

// Geocoding usando Nominatim (OpenStreetMap) restrito ao Brasil
export async function geocodeBrazil(address: string): Promise<LatLng & { displayName: string }> {
  if (!address || address.trim().length < 3) {
    throw new Error("Endereço inválido");
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
    address,
  )}&countrycodes=br&limit=1`;

  const res = await fetch(url, {
    // Em navegadores não é possível definir User-Agent; usamos Accept-Language
    headers: {
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Falha ao geocodificar: ${res.status}`);
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  if (!data?.length) {
    throw new Error("Endereço não encontrado no Brasil");
  }

  const item = data[0];
  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
  };
}

// Cálculo de rota/distância/duração com OSRM público
export async function routeOsrm(origin: LatLng, destination: LatLng): Promise<{ distanceKm: number; durationMin: number }> {
  const base = "https://router.project-osrm.org/route/v1/driving";
  const url = `${base}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao obter rota: ${res.status}`);
  }

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) {
    throw new Error("Rota indisponível");
  }

  const distanceKm = route.distance / 1000; // metros -> km
  const durationMin = route.duration / 60; // segundos -> minutos
  return { distanceKm, durationMin };
}