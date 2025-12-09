import React, { useEffect, useMemo, useState } from 'react';
import {
  Checkbox,
  Divider,
  Select,
  Space,
  Spin,
  Typography,
  Alert
} from 'antd';
import { MapContainer, TileLayer, GeoJSON, Circle, Popup } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import './Map.css';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../components/ThemeProvider';
import { fetchWaterBodies, WaterBody, WaterBodyType } from '../api/waterBodies';
import { fetchHeatmapData, type HeatmapPoint } from '../api/heatmap';
import HeatmapLayer from '../components/HeatmapLayer';

const { Title, Text } = Typography;
const { Option } = Select;

// --- Types ---

interface RiskZone {
  id: string;
  name: string;
  district: string;
  severity: 'high' | 'medium' | 'low';
  center: [number, number];
  radius: number;
  summary?: string;
}

interface Hotspot {
  location?: string;
  disease: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  samples: Array<{ patientName?: string; predicted_at?: string; prediction_id?: string }>;
  center?: [number, number] | null;
}

// --- Constants & Mock Data ---

const riskZones: RiskZone[] = [
  {
    id: 'kamrup-metro',
    name: 'Guwahati Urban Zone',
    district: 'Kamrup Metro',
    severity: 'high',
    center: [26.17, 91.75],
    radius: 18000,
    summary: 'High case load of Cholera and Typhoid in dense urban pockets.',
  },
  {
    id: 'dibrugarh-core',
    name: 'Dibrugarh Core Belt',
    district: 'Dibrugarh',
    severity: 'medium',
    center: [27.48, 94.91],
    radius: 15000,
    summary: 'Moderate Typhoid activity in residential clusters.',
  },
  {
    id: 'jorhat-belt',
    name: 'Jorhat River Belt',
    district: 'Jorhat',
    severity: 'high',
    center: [26.75, 94.2],
    radius: 13000,
    summary: 'Hepatitis A detected around water supply sources.',
  },
  {
    id: 'cachar-silchar',
    name: 'Cachar / Silchar Zone',
    district: 'Cachar',
    severity: 'low',
    center: [24.82, 92.78],
    radius: 20000,
    summary: 'Currently stable with sporadic cases only.',
  },
  {
    id: 'sonitpur-tezpur',
    name: 'Sonitpur / Tezpur Zone',
    district: 'Sonitpur',
    severity: 'low',
    center: [26.63, 92.78],
    radius: 16000,
    summary: 'Low activity – considered a safe zone at present.',
  },
];

const mockHotspots: Hotspot[] = [
  {
    location: 'Jorhat',
    disease: 'Hepatitis A',
    count: 12,
    severity: 'high',
    center: [26.7509, 94.2037],
    samples: [{ patientName: 'Patient A', predicted_at: new Date().toISOString() }],
  },
  {
    location: 'Dibrugarh Town',
    disease: 'Typhoid',
    count: 8,
    severity: 'medium',
    center: [27.4728, 94.912],
    samples: [{ patientName: 'Patient B', predicted_at: new Date().toISOString() }],
  },
  {
    location: 'Guwahati Central',
    disease: 'Cholera',
    count: 16,
    severity: 'high',
    center: [26.1445, 91.7362],
    samples: [{ patientName: 'Patient C', predicted_at: new Date().toISOString() }],
  },
  {
    location: 'Tezpur',
    disease: 'Gastroenteritis',
    count: 4,
    severity: 'low',
    center: [26.6341, 92.7789],
    samples: [{ patientName: 'Patient D', predicted_at: new Date().toISOString() }],
  },
];

// --- Helper Functions ---

const getQualityColor = (qualityClass: string) => {
  switch (qualityClass?.toLowerCase()) {
    case 'good': return '#52c41a';
    case 'moderate': return '#faad14';
    case 'poor': return '#f5222d';
    default: return '#d9d9d9';
  }
};

// Professional severity color palette (WHO/CDC inspired)
const zoneFillColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high': return '#c0392b';
    case 'medium': return '#d68910';
    case 'low': default: return '#27ae60';
  }
};

const zoneStrokeColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high': return '#922b21';
    case 'medium': return '#9c640c';
    case 'low': default: return '#1e8449';
  }
};

const colorBySeverity = (s: string) =>
  s === 'high' ? '#c0392b' : s === 'medium' ? '#d68910' : '#27ae60';

const strokeBySeverity = (s: string) =>
  s === 'high' ? '#922b21' : s === 'medium' ? '#9c640c' : '#1e8449';

const radiusFromCount = (count: number) =>
  Math.min(3000, 200 * Math.sqrt(Math.max(1, count)));

// Distinct palette for rivers vs lakes (trace on map)
const RIVER_COLOR = '#2563eb';          // blue
const RIVER_HIGHLIGHT = '#1d4ed8';
const LAKE_STROKE_COLOR = '#0f766e';    // teal
const LAKE_FILL_COLOR = 'rgba(13, 148, 136, 0.35)';

const Map: React.FC = () => {
  const { isDark } = useTheme();

  // --- State ---
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  
  // Filters
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showLakes, setShowLakes] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showRiskZones, setShowRiskZones] = useState<boolean>(true);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [minQuality, setMinQuality] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const types: WaterBodyType[] = [];
        if (showRivers) types.push('river');
        if (showLakes) types.push('lake');

        const data = await fetchWaterBodies({
          types: types.length > 0 ? types : undefined,
          state: selectedState || undefined,
          district: selectedDistrict || undefined,
          quality: minQuality || undefined,
        });
        setWaterBodies(data as unknown as WaterBody[]);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
        setError("Failed to load map data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showRivers, showLakes, selectedState, selectedDistrict, minQuality]);

  // --- Heatmap Data Fetching ---
  useEffect(() => {
    const loadHeatmap = async () => {
      try {
        const data = await fetchHeatmapData();
        setHeatmapData(data);
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
      }
    };

    if (showHeatmap) {
      loadHeatmap();
    }
  }, [showHeatmap]);

  // --- Derived State ---
  const filteredWaterBodies = useMemo(() => {
    return waterBodies.filter(wb => wb.geometry);
  }, [waterBodies]);

  const states = useMemo(() => {
    const s = new Set(waterBodies.map(wb => wb.state).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [waterBodies]);

  const districts = useMemo(() => {
    const d = new Set(waterBodies.map(wb => wb.district).filter(Boolean) as string[]);
    return Array.from(d).sort();
  }, [waterBodies]);

  // --- Map Layer Generation ---
  const riverFeatures: FeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredWaterBodies
        .filter(wb => wb.type === 'river')
        .map(wb => ({
          type: 'Feature',
          geometry: wb.geometry,
          properties: wb
        }))
    };
  }, [filteredWaterBodies]);

  const lakeFeatures: FeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredWaterBodies
        .filter(wb => wb.type === 'lake')
        .map(wb => ({
          type: 'Feature',
          geometry: wb.geometry,
          properties: wb
        }))
    };
  }, [filteredWaterBodies]);

  // --- Heatmap Points ---
  const heatmapPoints: Array<[number, number, number]> = useMemo(() => {
    return heatmapData.map(point => [point.lat, point.lng, point.intensity]);
  }, [heatmapData]);

  // --- Render Helpers ---

  const onEachFeature = (feature: any, layer: any) => {
    if (!feature.properties) return;

    const { name, type, qualityClass, qualityIndex, lastUpdated } = feature.properties;
    const qualityColor = getQualityColor(qualityClass);

    const popupContent = `
      <div class="map-popup">
        <h3>${name}</h3>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Quality:</strong> 
          <span style="color:${qualityColor}">
            ${qualityClass || 'Unknown'} ${qualityIndex ? `(WQI: ${qualityIndex})` : ''}
          </span>
        </p>
        ${lastUpdated ? `<p><strong>Updated:</strong> ${lastUpdated}</p>` : ''}
      </div>
    `;
    layer.bindPopup(popupContent);

    // Base style by geometry type (trace colors)
    const isRiver = type === 'river';
    const baseStyle = isRiver
      ? {
          color: RIVER_COLOR,
          weight: 3,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }
      : {
          color: LAKE_STROKE_COLOR,
          fillColor: LAKE_FILL_COLOR,
          fillOpacity: 0.55,
          weight: 1.4
        };

    // Slight tweak by quality – thicker + more opaque if poorer
    const q = qualityClass?.toLowerCase?.() || '';
    if (q === 'poor') {
      baseStyle.weight = isRiver ? 4 : 1.8;
      baseStyle.opacity = 1;
    } else if (q === 'moderate') {
      baseStyle.weight = isRiver ? 3.5 : 1.6;
    }

    layer.setStyle(baseStyle);

    // Professional hover interaction
    layer.on('mouseover', () => {
      layer.setStyle({
        ...(baseStyle as any),
        color: isRiver ? RIVER_HIGHLIGHT : LAKE_STROKE_COLOR,
        weight: (baseStyle.weight || 3) + 1,
        opacity: 1
      });
      layer.bringToFront();
    });

    layer.on('mouseout', () => {
      layer.setStyle(baseStyle);
    });
  };

  return (
    <div className="map-page-container">
      {/* Sidebar */}
      <div className={`map-sidebar ${isDark ? 'dark' : ''}`}>
        <div className="sidebar-header">
          <Title level={4}>Nirogya Map</Title>
          <Text type="secondary">Water & Disease Surveillance</Text>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="filter-section">
          <Title level={5}>Layers</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox 
              checked={showRivers} 
              onChange={e => setShowRivers(e.target.checked)}
            >
              Rivers (Trace)
            </Checkbox>
            <Checkbox 
              checked={showLakes} 
              onChange={e => setShowLakes(e.target.checked)}
            >
              Lakes (Polygons)
            </Checkbox>
            <Checkbox 
              checked={showHeatmap} 
              onChange={e => setShowHeatmap(e.target.checked)}
            >
              Symptom Heatmap
            </Checkbox>
            <Checkbox 
              checked={showRiskZones} 
              onChange={e => setShowRiskZones(e.target.checked)}
            >
              Risk Zones
            </Checkbox>
            <Checkbox 
              checked={showHotspots} 
              onChange={e => setShowHotspots(e.target.checked)}
            >
              Disease Hotspots
            </Checkbox>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="filter-section">
          <Title level={5}>Filters</Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Select
              placeholder="Select State"
              style={{ width: '100%' }}
              allowClear
              onChange={setSelectedState}
              value={selectedState}
            >
              {states.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>

            <Select
              placeholder="Select District"
              style={{ width: '100%' }}
              allowClear
              onChange={setSelectedDistrict}
              value={selectedDistrict}
              disabled={!selectedState && districts.length > 10}
            >
              {districts.map(d => <Option key={d} value={d}>{d}</Option>)}
            </Select>

            <Select
              placeholder="Min Quality"
              style={{ width: '100%' }}
              allowClear
              onChange={setMinQuality}
            >
              <Option value="Good">Good</Option>
              <Option value="Moderate">Moderate</Option>
              <Option value="Poor">Poor</Option>
            </Select>
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="legend-section">
          <Title level={5}>Water Layers</Title>
          <div className="legend-item">
            <span className="legend-color" style={{ background: RIVER_COLOR }}></span>
            <span>Rivers (Trace)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: LAKE_STROKE_COLOR }}></span>
            <span>Lakes (Areas)</span>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="legend-section">
          <Title level={5}>Water Quality (WQI)</Title>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#52c41a' }}></span>
            <span>Good</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#faad14' }}></span>
            <span>Moderate</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#f5222d' }}></span>
            <span>Poor</span>
          </div>
        </div>

        {showHeatmap && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div className="legend-section">
              <Title level={5}>Symptom Intensity</Title>
              <div className="legend-item">
                <span className="legend-color heatmap-low"></span>
                <span>Low (Baseline)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color heatmap-medium"></span>
                <span>Medium (Alert)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color heatmap-high"></span>
                <span>High (Critical)</span>
              </div>
            </div>
          </>
        )}

        {(showRiskZones || showHotspots) && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div className="legend-section">
              <Title level={5}>Disease Risk Zones</Title>
              <div className="legend-item">
                <span className="legend-color" style={{ background: 'linear-gradient(135deg, #c0392b 0%, #922b21 100%)' }}></span>
                <span>High Risk</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: 'linear-gradient(135deg, #d68910 0%, #9c640c 100%)' }}></span>
                <span>Medium Risk</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)' }}></span>
                <span>Low Risk</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Map Area */}
      <div className="map-view-container">
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            style={{ position: 'absolute', top: 20, left: 60, zIndex: 1000, width: 300 }}
            onClose={() => setError(null)}
          />
        )}
        
        {loading && (
          <div className="map-loading-overlay">
            <Spin size="large" tip="Loading Map Data..." />
          </div>
        )}

        <MapContainer 
          center={[26.2006, 92.9376]} 
          zoom={7} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {showRivers && riverFeatures.features.length > 0 && (
            <GeoJSON 
              key={`rivers-${riverFeatures.features.length}`} 
              data={riverFeatures} 
              onEachFeature={onEachFeature} 
            />
          )}

          {showLakes && lakeFeatures.features.length > 0 && (
            <GeoJSON 
              key={`lakes-${lakeFeatures.features.length}`} 
              data={lakeFeatures} 
              onEachFeature={onEachFeature} 
            />
          )}

          {showHeatmap && heatmapPoints.length > 0 && (
            <HeatmapLayer
              points={heatmapPoints}
              // If your HeatmapLayer supports these props, this will make it look
              // more "pro dashboard":
              // radius={35}
              // blur={22}
              // max={1}
              // gradient={{
              //   0.2: '#6baed6',
              //   0.4: '#fc9272',
              //   0.65: '#fb6a4a',
              //   1.0: '#cb181d',
              // }}
            />
          )}

          {/* Risk Zones - tuned fillOpacity + crisp stroke */}
          {showRiskZones && riskZones.map(zone => (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: zoneStrokeColor(zone.severity),
                weight: 2.4,
                opacity: 0.9,
                fillColor: zoneFillColor(zone.severity),
                fillOpacity: 0.22,
                dashArray: zone.severity === 'high' ? undefined : '6 10',
              }}
              className={zone.severity === 'high' ? 'risk-zone-critical' : ''}
            >
              <Popup>
                <div className="map-popup risk-popup">
                  <div className={`risk-badge ${zone.severity}`}>{zone.severity.toUpperCase()}</div>
                  <h3>{zone.name}</h3>
                  <p className="popup-district"><i className="fa-solid fa-location-dot"></i> {zone.district}</p>
                  <p className="popup-summary">{zone.summary}</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Hotspots - clean concentric circles */}
          {showHotspots && mockHotspots.map((h, idx) => {
            if (!h.center) return null;
            const baseRadius = radiusFromCount(h.count);
            return (
              <React.Fragment key={`hotspot-${idx}`}>
                {h.severity === 'high' && (
                  <Circle
                    center={h.center}
                    radius={baseRadius * 1.5}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: colorBySeverity(h.severity),
                      fillOpacity: 0.06,
                      weight: 0,
                    }}
                    className="hotspot-outer-glow"
                  />
                )}
                <Circle
                  center={h.center}
                  radius={baseRadius}
                  pathOptions={{
                    color: strokeBySeverity(h.severity),
                    weight: 2.2,
                    opacity: 0.95,
                    fillColor: colorBySeverity(h.severity),
                    fillOpacity: 0.3,
                  }}
                  className={`hotspot-marker ${h.severity}`}
                >
                  <Popup>
                    <div className="map-popup hotspot-popup">
                      <div className={`disease-header ${h.severity}`}>
                        <span className="disease-icon">⚠</span>
                        <h3>{h.disease}</h3>
                      </div>
                      <div className="hotspot-stats">
                        <div className="stat-item">
                          <span className="stat-value">{h.count}</span>
                          <span className="stat-label">Cases</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value location">{h.location}</span>
                          <span className="stat-label">Location</span>
                        </div>
                      </div>
                      {h.samples && h.samples.length > 0 && (
                        <div className="recent-cases">
                          <span className="cases-header">Recent Reports</span>
                          <ul>
                            {h.samples.slice(0, 3).map((s, i) => (
                              <li key={i}>
                                <span className="case-dot"></span>
                                {s.patientName || 'Anonymous'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}

        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
