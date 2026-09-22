import type { LocationReference } from "@/lib/locations";

// Busca de localidades no Nominatim (OpenStreetMap), usada apenas como reserva:
// só é acionada quando a lista local de referências (lib/locations.ts) não
// encontra nada para o texto digitado. Assim, a grande maioria das buscas
// continua sendo resolvida sem sair do navegador.
//
// Política de uso do Nominatim: no máximo 1 requisição por segundo. O
// componente de busca faz debounce e só consulta quando não há resultado local.

// Recorte aproximado da Grande São Paulo (oeste, norte, leste, sul).
const VIEWBOX = "-47.40,-23.00,-45.50,-24.40";
const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export interface GeocodeResult extends LocationReference {
  source: "osm";
}

interface NominatimItem {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  addresstype?: string;
  type?: string;
  address?: Record<string, string | undefined>;
}

function pickCity(address: Record<string, string | undefined> | undefined): string {
  if (!address) return "";
  return (
    address.city ??
    address.town ??
    address.municipality ??
    address.village ??
    address.county ??
    ""
  );
}

function pickNeighborhood(item: NominatimItem): string {
  const a = item.address ?? {};
  return (
    a.suburb ??
    a.neighbourhood ??
    a.city_district ??
    a.quarter ??
    a.road ??
    item.name ??
    ""
  );
}

function buildId(item: NominatimItem, index: number): string {
  const base = `${item.lat}-${item.lon}-${index}`;
  return `osm-${base.replace(/[^a-z0-9.-]+/gi, "")}`;
}

/**
 * Procura bairros, ruas e municípios no OpenStreetMap, limitado à Grande SP.
 * Devolve uma lista vazia quando nada é encontrado; lança erro quando a
 * consulta em si falha (rede indisponível, serviço fora do ar, etc.).
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const term = query.trim();
  if (term.length < 3) return [];

  const params = new URLSearchParams({
    q: term,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "br",
    viewbox: VIEWBOX,
    bounded: "1",
    "accept-language": "pt-BR",
  });

  const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Nominatim respondeu ${response.status}`);

  const data = (await response.json()) as NominatimItem[];
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];

  for (const [index, item] of data.entries()) {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const city = pickCity(item.address);
    const neighborhood = pickNeighborhood(item);
    if (!neighborhood && !city) continue;

    // Rótulo curto: "Bairro — Cidade", caindo para as duas primeiras partes do
    // display_name quando o endereço estruturado não ajuda.
    const label = neighborhood && city
      ? `${neighborhood} — ${city}`
      : (item.display_name ?? "").split(",").slice(0, 2).map((p) => p.trim()).filter(Boolean).join(" — ")
        || neighborhood
        || city;
    if (!label) continue;

    const key = label.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      id: buildId(item, index),
      neighborhood: neighborhood || city,
      city: city || neighborhood,
      label,
      latitude,
      longitude,
      kind: "bairro",
      source: "osm",
    });
  }

  return results;
}
