import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: Array<[number, number, number]>; // [lat, lng, intensity]
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: { [key: number]: string };
  };
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ points, options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Professional epidemiological color palette
    // Inspired by CDC/WHO disease mapping standards
    const defaultOptions = {
      radius: 30,
      blur: 20,
      maxZoom: 12,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.0: 'rgba(49, 130, 189, 0.1)',   // Light blue (minimal)
        0.15: 'rgba(107, 174, 214, 0.4)', // Sky blue (low)
        0.3: 'rgba(158, 202, 225, 0.5)',  // Pale blue (low-moderate)
        0.45: 'rgba(253, 205, 172, 0.6)', // Peach (moderate)
        0.6: 'rgba(252, 146, 114, 0.7)',  // Salmon (moderate-high)
        0.75: 'rgba(239, 101, 72, 0.8)',  // Coral (high)
        0.85: 'rgba(203, 24, 29, 0.85)',  // Crimson (very high)
        1.0: 'rgba(103, 0, 13, 0.9)',     // Dark burgundy (critical)
      },
      ...options,
    };

    // @ts-ignore - leaflet.heat adds heatLayer to L
    const heatLayer = L.heatLayer(points, defaultOptions);
    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
};

export default HeatmapLayer;
