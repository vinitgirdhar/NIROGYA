import React, { useEffect, useRef, useState } from 'react';
import { MapLocation } from '../pages/Map';

// Global declaration for Leaflet to avoid TypeScript errors with window.L
declare global {
  interface Window { L: any; }
}

interface LeafletMapProps {
  /** Callback triggered when user zooms out far enough to switch modes */
  onSwitchTo3D?: () => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  onSwitchTo3D, 
  className, 
  center = [20.5937, 78.9629], // Default to India
  zoom = 10,
  locations = []
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  const TRIGGER_ZOOM_LEVEL = 4;

  // 1. Load Leaflet Resources (Script & CSS) dynamically
  useEffect(() => {
    // Robust check: ensure both L and L.map exist
    const checkForLeaflet = () => {
      if (window.L && typeof window.L.map === 'function') {
        setIsScriptLoaded(true);
        return true;
      }
      return false;
    };

    if (checkForLeaflet()) return;

    // Prevent duplicate script injection
    if (document.querySelector('script[src*="leaflet.js"]')) {
      // If script exists but L isn't ready, wait for load
      const existingScript = document.querySelector('script[src*="leaflet.js"]');
      existingScript?.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Inject Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
       if (window.L && typeof window.L.map === 'function') {
         setIsScriptLoaded(true);
       }
    };
    script.onerror = () => console.error("Failed to load Leaflet script");
    document.body.appendChild(script);
  }, []);

  // 2. Initialize Map
  useEffect(() => {
    // Guard clauses
    if (!isScriptLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    if (!window.L || typeof window.L.map !== 'function') return;

    try {
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: center,
        zoom: zoom
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Add markers for all locations
      if (locations.length > 0) {
        locations.forEach(location => {
          // Create custom icon based on status if needed, for now use default
          const marker = window.L.marker(location.coordinates).addTo(map);
          
          // Add popup with details
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">${location.name}</h3>
              <div style="margin-bottom: 5px;">
                <span style="
                  display: inline-block;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: bold;
                  color: white;
                  background-color: ${
                    location.status === 'safe' ? '#52c41a' :
                    location.status === 'warning' ? '#faad14' :
                    location.status === 'danger' ? '#ff7a45' : '#ff4d4f'
                  }
                ">
                  ${location.status.toUpperCase()}
                </span>
                <span style="font-size: 12px; color: #666; margin-left: 8px;">
                  ${location.type.replace('_', ' ')}
                </span>
              </div>
              <p style="margin: 0; font-size: 13px; color: #333;">
                ${location.details.description}
              </p>
            </div>
          `;
          
          marker.bindPopup(popupContent);
        });
      } else {
        // Fallback to center marker if no locations provided
        window.L.marker(center).addTo(map);
      }

      // Add Zoom Listener
      map.on('zoomend', () => {
        const z = map.getZoom();
        setCurrentZoom(z); // Update React state
        
        if (z < TRIGGER_ZOOM_LEVEL) {
          console.log("Trigger: Switch back to 3D Globe");
          if (onSwitchTo3D) {
            onSwitchTo3D();
          }
        }
      });

      mapInstanceRef.current = map;

      // Fix for tile loading if container size changes
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (err) {
      console.error("Map initialization failed:", err);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isScriptLoaded, center, zoom, onSwitchTo3D, locations]);

  return (
    <div 
      ref={mapContainerRef} 
      className={className}
      style={{ 
        width: '100%', 
        height: '100%', 
        background: '#000', 
        position: 'relative',
        zIndex: 10 
      }} 
    />
  );
};

export default LeafletMap;
