export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  count: number;
  symptoms: string[];
}

export interface HeatmapStats {
  total_reports: number;
  high_risk_areas: number;
  medium_risk_areas: number;
  low_risk_areas: number;
  most_common_symptoms: Array<{
    name: string;
    count: number;
  }>;
  last_updated: string;
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export async function fetchHeatmapData(
  bounds?: {
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
  },
  signal?: AbortSignal
): Promise<HeatmapPoint[]> {
  const params = new URLSearchParams();
  
  if (bounds?.minLat !== undefined) params.set('min_lat', bounds.minLat.toString());
  if (bounds?.maxLat !== undefined) params.set('max_lat', bounds.maxLat.toString());
  if (bounds?.minLng !== undefined) params.set('min_lng', bounds.minLng.toString());
  if (bounds?.maxLng !== undefined) params.set('max_lng', bounds.maxLng.toString());

  const res = await fetch(`${API_BASE}/api/heatmap/symptoms?${params.toString()}`, { signal });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch heatmap data: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function fetchHeatmapStats(signal?: AbortSignal): Promise<HeatmapStats> {
  const res = await fetch(`${API_BASE}/api/heatmap/stats`, { signal });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch heatmap stats: ${res.status} ${text}`);
  }
  
  return res.json();
}
