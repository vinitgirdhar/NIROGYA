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

    const defaultOptions = {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: '#00ff00',  // Green (low)
        0.4: '#ffff00',  // Yellow (medium)
        0.6: '#ffa500',  // Orange
        0.8: '#ff0000',  // Red (high)
        1.0: '#8b0000',  // Dark red (very high)
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
