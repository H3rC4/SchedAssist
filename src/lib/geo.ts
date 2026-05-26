'use client';

interface GeoData {
  country_code: string;
  country_name?: string;
}

const GEO_KEY = 'schedassist_geo_data';
const GEO_TIMESTAMP_KEY = 'schedassist_geo_timestamp';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

/**
 * Obtiene datos de geolocalización cacheados en localStorage.
 * Retorna null si no hay datos o expiraron.
 */
export function getCachedGeoData(): GeoData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(GEO_KEY);
    const timestamp = localStorage.getItem(GEO_TIMESTAMP_KEY);

    if (!raw || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(GEO_KEY);
      localStorage.removeItem(GEO_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(raw) as GeoData;
  } catch {
    return null;
  }
}

/**
 * Guarda datos de geolocalización en localStorage.
 */
function setCachedGeoData(data: GeoData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GEO_KEY, JSON.stringify(data));
    localStorage.setItem(GEO_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Intenta obtener datos de geolocalización desde múltiples proveedores gratuitos.
 * Usa cacheo en localStorage para evitar múltiples requests por sesión.
 */
export async function fetchGeoData(): Promise<GeoData | null> {
  // 1. Revisar cache primero
  const cached = getCachedGeoData();
  if (cached) return cached;

  // 2. Proveedores con fallback
  const providers = [
    { url: 'https://ipwho.is/', extractor: (d: any) => ({ country_code: d.country_code, country_name: d.country }) },
    { url: 'https://ipinfo.io/json', extractor: (d: any) => ({ country_code: d.country, country_name: d.country_name }) },
  ];

  for (const provider of providers) {
    try {
      const res = await fetch(provider.url, { cache: 'no-store' });
      if (!res.ok) continue;

      const data = await res.json();
      if (data.country_code || data.country) {
        const geo = provider.extractor(data);
        setCachedGeoData(geo);
        return geo;
      }
    } catch {
      // Intentar siguiente proveedor
      continue;
    }
  }

  return null;
}
