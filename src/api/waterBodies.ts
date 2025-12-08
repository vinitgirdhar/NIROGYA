import type { Geometry } from 'geojson';

export type WaterBodyType = 'river' | 'lake';

export interface WaterBody {
  id: string;
  name: string;
  type: WaterBodyType;
  state?: string;
  district?: string;
  qualityIndex: number;
  qualityClass: string;
  lastUpdated?: string;
  pollution: Record<string, number | undefined>;
  geometry: Geometry;
}

export interface WaterBodyFilters {
  types?: WaterBodyType[];
  state?: string;
  district?: string;
  quality?: string;
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export async function fetchWaterBodies(filters: WaterBodyFilters = {}, signal?: AbortSignal): Promise<WaterBody[]> {
  const params = new URLSearchParams();
  if (filters.types && filters.types.length && filters.types.length < 2) {
    params.set('types', filters.types.join(','));
  }
  if (filters.state) params.set('state', filters.state);
  if (filters.district) params.set('district', filters.district);
  if (filters.quality) params.set('quality', filters.quality);

  const res = await fetch(`${API_BASE}/api/water-bodies?${params.toString()}`, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch water bodies: ${res.status} ${text}`);
  }
  return res.json();
}
