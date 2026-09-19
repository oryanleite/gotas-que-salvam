export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

// Instância pública de demonstração do OSRM (Open Source Routing Machine).
// É gratuita e não exige chave de API, mas não tem SLA garantido — por isso
// todo uso aqui tem fallback silencioso para a distância geodésica existente
// em lib/domain.mjs. Se o volume de acesso crescer, troque OSRM_BASE_URL por
// uma instância própria (self-hosted) sem alterar o restante do código.
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

// Cache em memória por sessão de página — evita recalcular a mesma rota
// múltiplas vezes enquanto o usuário navega pelos filtros.
const routeCache = new Map<string, RouteInfo>();

function cacheKey(origin: LatLng, destination: LatLng): string {
  return [
    origin.latitude.toFixed(4),
    origin.longitude.toFixed(4),
    destination.latitude.toFixed(4),
    destination.longitude.toFixed(4),
  ].join(",");
}

/**
 * Busca a distância e o tempo de rota real (carro) entre dois pontos.
 * Retorna null em qualquer falha (rede, timeout, resposta inesperada) —
 * quem chamar deve manter a distância geodésica como alternativa visível
 * nesse caso, nunca travar a interface esperando essa chamada.
 */
export async function getRouteDistance(
  origin: LatLng,
  destination: LatLng,
  signal?: AbortSignal
): Promise<RouteInfo | null> {
  const key = cacheKey(origin, destination);
  const cached = routeCache.get(key);
  if (cached) return cached;

  try {
    const url = `${OSRM_BASE_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false`;
    const response = await fetch(url, { signal });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      code?: string;
      routes?: { distance: number; duration: number }[];
    };
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const info: RouteInfo = {
      distanceKm: data.routes[0].distance / 1000,
      durationMin: Math.max(1, Math.round(data.routes[0].duration / 60)),
    };
    routeCache.set(key, info);
    return info;
  } catch {
    // Sem rede, requisição abortada (troca rápida de filtro) ou serviço
    // fora do ar: falha silenciosa, a UI mantém a distância geodésica.
    return null;
  }
}

export function formatRouteDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
