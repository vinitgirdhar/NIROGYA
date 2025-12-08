// src/pages/DiseaseMapping.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Badge,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Space,
  Tag,
  Alert,
  Spin,
  InputNumber,
  Switch,
} from 'antd';
import {
  EnvironmentFilled,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './DiseaseMapping.css';

// Leaflet (map) imports
import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const { Option } = Select;

/* ---------------------- Types ---------------------- */

interface DiseaseReport {
  id: string;
  location: string;
  district: string;
  village: string;
  disease: string;
  severity: 'high' | 'medium' | 'low';
  casesCount: number;
  reportedBy: string;
  reportedDate: string;
  status: 'active' | 'contained' | 'resolved';
  coordinates?: [number, number];
  description: string;
  actionTaken?: string;
}

type Hotspot = {
  location?: string;
  disease: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  samples: Array<{ patientName?: string; predicted_at?: string; prediction_id?: string }>;
  center?: [number, number] | null;
};

interface DistrictStats {
  district: string;
  total_reports: number;
  diseases: { name: string; count: number; outbreak: boolean }[];
  threshold?: number;
};

interface RiskZone {
  id: string;
  name: string;
  district: string;
  severity: 'high' | 'medium' | 'low';
  center: [number, number];   // [lat, lng]
  radius: number;             // meters
  summary?: string;
}

// Prediction-based outbreak from backend
interface PredictionOutbreak {
  id: string;
  district: string;
  areaName: string;
  disease: string;
  totalPredictions: number;
  latestPredictionDate: string;
  earliestPredictionDate?: string;
  coordinates: [number, number] | null;
  color: 'red' | 'yellow' | 'green';
  severity: 'high' | 'medium' | 'low';
  status: string;
}

/* ---------------------- Map helpers ---------------------- */

const NE_BOUNDS = {
  minLat: 21.5,
  maxLat: 29.5,
  minLng: 88,
  maxLng: 98,
};

const DEFAULT_NE_CENTER: [number, number] = [26.2, 92.8];

function clampToNorthEast(lat: number, lng: number): [number, number] {
  const clampedLat = Math.min(NE_BOUNDS.maxLat, Math.max(NE_BOUNDS.minLat, lat));
  const clampedLng = Math.min(NE_BOUNDS.maxLng, Math.max(NE_BOUNDS.minLng, lng));
  return [clampedLat, clampedLng];
}

function isWithinNorthEast(lat: number, lng: number): boolean {
  return (
    lat >= NE_BOUNDS.minLat &&
    lat <= NE_BOUNDS.maxLat &&
    lng >= NE_BOUNDS.minLng &&
    lng <= NE_BOUNDS.maxLng
  );
}

const zoneFillColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high':
      return '#ff0000';
    case 'medium':
      return '#ffa500';
    case 'low':
    default:
      return '#00c853';
  }
};

/* ---------------------- Mock Risk Zones ---------------------- */

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

/* ---------------------- Main Component ---------------------- */

const DiseaseMapping: React.FC = () => {
  const { user } = useAuth();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([]);
  const [form] = Form.useForm();

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [hotspotDays, setHotspotDays] = useState<number>(7);
  const [hotspotThreshold, setHotspotThreshold] = useState<number>(10);
  const [hotspotDiseaseFilter, setHotspotDiseaseFilter] =
    useState<string | undefined>(undefined);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showCircles, setShowCircles] = useState<boolean>(true);

  const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null);
  const [loadingDistrictStats, setLoadingDistrictStats] =
    useState<boolean>(false);

  // Prediction-based outbreaks state
  const [predictionOutbreaks, setPredictionOutbreaks] = useState<PredictionOutbreak[]>([]);
  const [loadingPredictionOutbreaks, setLoadingPredictionOutbreaks] = useState<boolean>(false);
  const [showPredictionOutbreaks, setShowPredictionOutbreaks] = useState<boolean>(true);
  const [outbreakDays, setOutbreakDays] = useState<number>(30);

  /* ---------------------- Mock Data ---------------------- */

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
      location: 'Vasai (test)',
      disease: 'Typhoid',
      count: 10,
      severity: 'medium',
      center: [19.391, 72.8397],
      samples: [{ patientName: 'Test User', predicted_at: new Date().toISOString() }],
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

  useEffect(() => {
    const mockReports: DiseaseReport[] = [
      {
        id: '1',
        location: 'Guwahati Central',
        district: 'Kamrup Metro',
        village: 'Fancy Bazar',
        disease: 'Cholera',
        severity: 'high',
        casesCount: 15,
        reportedBy: 'Dr. Priya Sharma',
        reportedDate: '2024-01-15',
        status: 'active',
        coordinates: [26.1445, 91.7362],
        description: 'Sudden outbreak after water contamination in local well',
        actionTaken: 'Water supply stopped, medical camp setup',
      },
      {
        id: '2',
        location: 'Dibrugarh Town',
        district: 'Dibrugarh',
        village: 'Chowkidinghee',
        disease: 'Typhoid',
        severity: 'medium',
        casesCount: 8,
        reportedBy: 'ASHA Worker - Mamoni Das',
        reportedDate: '2024-01-14',
        status: 'contained',
        coordinates: [27.4728, 94.912],
        description: 'Multiple cases reported in residential area',
        actionTaken: 'House-to-house surveillance initiated',
      },
    ];
    setDiseaseReports(mockReports);
  }, []);

  /* ---------------------- Hotspot loader ---------------------- */

  useEffect(() => {
    loadHotspots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspotDays, hotspotThreshold, hotspotDiseaseFilter]);

  async function loadHotspots() {
    setLoadingHotspots(true);
    try {
      const qs = new URLSearchParams();
      qs.set('days', String(hotspotDays));
      qs.set('threshold', String(hotspotThreshold));
      if (hotspotDiseaseFilter) qs.set('disease', hotspotDiseaseFilter);

      const res = await fetch(`/api/hotspots?${qs.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setHotspots(mockHotspots);
        setLoadingHotspots(false);
        return;
      }

      const payload = await res.json();
      const mapped = (payload.hotspots || []).map((h: any) => ({
        location: h.location,
        disease: h.disease,
        count: h.count,
        severity:
          h.severity ||
          (h.count >= hotspotThreshold * 1.5
            ? 'high'
            : h.count >= hotspotThreshold
            ? 'medium'
            : 'low'),
        samples: h.samples || [],
        center:
          Array.isArray(h.center) && h.center.length === 2
            ? ([Number(h.center[0]), Number(h.center[1])] as [number, number])
            : null,
      })) as Hotspot[];

      if (!mapped || mapped.length === 0 || !mapped.some((m) => m.center)) {
        setHotspots(mockHotspots);
      } else {
        setHotspots(mapped);
      }
    } catch (err) {
      console.error('loadHotspots error', err);
      setHotspots(mockHotspots);
      message.warning('Using mock hotspots (backend unavailable).');
    } finally {
      setLoadingHotspots(false);
    }
  }

  /* ---------------------- District stats ---------------------- */

  async function loadDistrictStats(district: string) {
    if (district === 'all') {
      setDistrictStats(null);
      return;
    }
    setLoadingDistrictStats(true);
    try {
      const res = await fetch(
        `/api/district-disease-stats?district=${encodeURIComponent(district)}`,
      );
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setDistrictStats(data);
    } catch (e) {
      console.error('District stats error:', e);
      setDistrictStats(null);
    } finally {
      setLoadingDistrictStats(false);
    }
  }

  useEffect(() => {
    loadDistrictStats(selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict === 'all') return;
    const id = setInterval(() => {
      loadDistrictStats(selectedDistrict);
    }, 5000);
    return () => clearInterval(id);
  }, [selectedDistrict]);

  /* ---------------------- Prediction Outbreaks loader ---------------------- */

  useEffect(() => {
    loadPredictionOutbreaks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, outbreakDays, hotspotDiseaseFilter]);

  async function loadPredictionOutbreaks() {
    setLoadingPredictionOutbreaks(true);
    try {
      const qs = new URLSearchParams();
      qs.set('days', String(outbreakDays));
      if (selectedDistrict !== 'all') qs.set('district', selectedDistrict);
      if (hotspotDiseaseFilter) qs.set('disease', hotspotDiseaseFilter);

      const res = await fetch(`/api/prediction-outbreaks?${qs.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.warn('Prediction outbreaks endpoint returned error, using empty array.');
        setPredictionOutbreaks([]);
        return;
      }

      const payload = await res.json();
      const outbreaks = (payload.outbreaks || []).map((o: any) => ({
        id: o.id,
        district: o.district || '',
        areaName: o.areaName || o.district || 'Unknown',
        disease: o.disease || 'Unknown',
        totalPredictions: o.totalPredictions || 0,
        latestPredictionDate: o.latestPredictionDate || '',
        earliestPredictionDate: o.earliestPredictionDate || '',
        coordinates: Array.isArray(o.coordinates) && o.coordinates.length === 2
          ? ([Number(o.coordinates[0]), Number(o.coordinates[1])] as [number, number])
          : null,
        color: o.color || 'yellow',
        severity: o.severity || 'medium',
        status: o.status || 'PREDICTED OUTBREAK',
      })) as PredictionOutbreak[];

      setPredictionOutbreaks(outbreaks);
    } catch (err) {
      console.error('loadPredictionOutbreaks error', err);
      setPredictionOutbreaks([]);
      message.warning('Could not load prediction outbreaks.');
    } finally {
      setLoadingPredictionOutbreaks(false);
    }
  }

  /* ---------------------- UI Helpers ---------------------- */

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'low':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return null;
    }
  };

  const getStatusTag = (status: string) => {
    const colors: any = { active: 'red', contained: 'orange', resolved: 'green' };
    return <Tag color={colors[status]}>{String(status).toUpperCase()}</Tag>;
  };

  const colorBySeverity = (s: string) =>
    s === 'high' ? '#ff4d4f' : s === 'medium' ? '#faad14' : '#52c41a';

  // Color for prediction outbreak circles (yellow for 20-24, red for 25+)
  const outbreakCircleColor = (color: string) => {
    if (color === 'red') return '#ff4d4f';
    if (color === 'yellow') return '#faad14';
    return '#52c41a';
  };

  const radiusFromCount = (count: number) =>
    Math.min(3000, 200 * Math.sqrt(Math.max(1, count)));

  // Radius for prediction outbreaks (scale with total predictions)
  // Increased base radius for better visibility when zoomed out
  const outbreakRadiusFromPredictions = (totalPredictions: number) =>
    Math.min(25000, 2000 + 800 * Math.sqrt(Math.max(1, totalPredictions)));

  const mapCenter: [number, number] = useMemo(() => {
    let base: [number, number] = DEFAULT_NE_CENTER;
    const lowerDistrict = selectedDistrict.toLowerCase();
    const candidate = hotspots.find(
      (h) =>
        h.center &&
        h.location &&
        (selectedDistrict === 'all' ||
          h.location.toLowerCase().includes(lowerDistrict)),
    );
    if (candidate && candidate.center) {
      base = candidate.center;
    } else {
      const withCenter = hotspots.find((h) => h.center);
      if (withCenter && withCenter.center) {
        base = withCenter.center;
      }
    }
    return clampToNorthEast(base[0], base[1]);
  }, [hotspots, selectedDistrict]);

  const heatPoints = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    hotspots.forEach((h) => {
      if (h.center && h.center.length === 2) {
        const lat = Number(h.center[0]);
        const lng = Number(h.center[1]);
        if (!isNaN(lat) && !isNaN(lng) && isWithinNorthEast(lat, lng)) {
          const weight = Math.min(1, h.count / Math.max(1, hotspotThreshold * 2));
          pts.push([lat, lng, weight]);
        }
      }
    });
    return pts;
  }, [hotspots, hotspotThreshold]);

  const visibleRiskZones = useMemo(
    () =>
      riskZones.filter(
        (z) => selectedDistrict === 'all' || z.district === selectedDistrict,
      ),
    [selectedDistrict],
  );

  // Filter prediction outbreaks by severity if needed
  const filteredPredictionOutbreaks = useMemo(
    () =>
      predictionOutbreaks.filter((outbreak) => {
        const severityMatch =
          selectedSeverity === 'all' || outbreak.severity === selectedSeverity;
        return severityMatch;
      }),
    [predictionOutbreaks, selectedSeverity],
  );

  const filteredReports = useMemo(
    () =>
      diseaseReports.filter((report) => {
        const districtMatch =
          selectedDistrict === 'all' || report.district === selectedDistrict;
        const severityMatch =
          selectedSeverity === 'all' || report.severity === selectedSeverity;
        return districtMatch && severityMatch;
      }),
    [diseaseReports, selectedDistrict, selectedSeverity],
  );

  const hotspotColumns = [
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Disease', dataIndex: 'disease', key: 'disease' },
    { title: 'Count', dataIndex: 'count', key: 'count' },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string) => <Tag color={colorBySeverity(s)}>{s}</Tag>,
    },
  ];

  const reportColumns = [
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text: string, record: DiseaseReport) => (
        <Space>
          <EnvironmentFilled style={{ color: getSeverityColor(record.severity) }} />
          <div>
            <div className="reports-location">{text}</div>
            <div className="reports-sub">
              {record.village}, {record.district}
            </div>
          </div>
        </Space>
      ),
    },
    { title: 'Disease', dataIndex: 'disease', key: 'disease' },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string) => (
        <Space>
          {getSeverityIcon(s)}
          <span className="capitalize">{s}</span>
        </Space>
      ),
    },
    { title: 'Cases', dataIndex: 'casesCount', key: 'casesCount' },
    { title: 'Date', dataIndex: 'reportedDate', key: 'reportedDate' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => getStatusTag(s),
    },
  ];

  // Prediction Outbreak columns for the "Recent Outbreak Reports" table
  const predictionOutbreakColumns = [
    {
      title: 'Location / Area',
      dataIndex: 'areaName',
      key: 'areaName',
      render: (text: string, record: PredictionOutbreak) => (
        <Space>
          <EnvironmentFilled style={{ color: outbreakCircleColor(record.color) }} />
          <div>
            <div className="reports-location">{text || 'Unknown Area'}</div>
            <div className="reports-sub">{record.district}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Disease', dataIndex: 'disease', key: 'disease' },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string, record: PredictionOutbreak) => (
        <Space>
          {getSeverityIcon(s)}
          <span className="capitalize">{s}</span>
        </Space>
      ),
    },
    {
      title: 'Predictions',
      dataIndex: 'totalPredictions',
      key: 'totalPredictions',
      render: (count: number, record: PredictionOutbreak) => (
        <Tag color={outbreakCircleColor(record.color)}>{count}</Tag>
      ),
    },
    {
      title: 'Latest Date',
      dataIndex: 'latestPredictionDate',
      key: 'latestPredictionDate',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string, record: PredictionOutbreak) => (
        <Tag color={record.color === 'red' ? 'red' : 'orange'}>
          {s || 'PREDICTED OUTBREAK'}
        </Tag>
      ),
    },
  ];

  const summaryStats = {
    total: diseaseReports.length + predictionOutbreaks.length,
    active: diseaseReports.filter((r) => r.status === 'active').length + predictionOutbreaks.length,
    high: diseaseReports.filter((r) => r.severity === 'high').length + 
          predictionOutbreaks.filter((o) => o.severity === 'high').length,
    totalCases: diseaseReports.reduce((sum, r) => sum + r.casesCount, 0) +
                predictionOutbreaks.reduce((sum, o) => sum + o.totalPredictions, 0),
  };

  const isOutbreakInSelectedDistrict =
    !!districtStats?.diseases?.some((d) => d.outbreak);

  /* ---------------------- Submit handler ---------------------- */

  const handleReportSubmit = async (values: any) => {
    try {
      const newReport: DiseaseReport = {
        id: Date.now().toString(),
        location: values.location,
        district: values.district,
        village: values.village,
        disease: values.disease,
        severity: values.severity,
        casesCount: Number(values.casesCount),
        reportedBy: (user as any)?.full_name || 'Unknown',
        reportedDate: values.reportedDate.format('YYYY-MM-DD'),
        status: 'active',
        coordinates: [26.1445, 91.7362],
        description: values.description,
      };
      setDiseaseReports((prev) => [...prev, newReport]);
      setIsReportModalVisible(false);
      form.resetFields();
      message.success('Disease report submitted successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to submit report.');
    }
  };

  /* ---------------------- JSX ---------------------- */

  return (
    <div className="disease-mapping">
      <div className="disease-mapping-header">
        <h2>Disease Outbreak Mapping &amp; Surveillance</h2>
        <p>Real-time district-wise monitoring with hotspots and risk zones</p>
      </div>

      {summaryStats.high > 0 && (
        <Alert
          message="High Severity Alert"
          description={`${summaryStats.high} high-severity outbreak(s) currently active.`}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Summary cards */}
      <Row gutter={[16, 16]} className="summary-cards">
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <div className="summary-number">{summaryStats.total}</div>
            <div className="summary-label">Total Reports</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <div className="summary-number">{summaryStats.active}</div>
            <div className="summary-label">Active Outbreaks</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <div className="summary-number">{summaryStats.high}</div>
            <div className="summary-label">High Severity</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <div className="summary-number">{summaryStats.totalCases}</div>
            <div className="summary-label">Total Cases</div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="controls-card" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <div className="control-label">District</div>
            <Select
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              style={{ width: '100%' }}
            >
              <Option value="all">All Districts</Option>
              <Option value="Kamrup Metro">Kamrup Metro</Option>
              <Option value="Dibrugarh">Dibrugarh</Option>
              <Option value="Cachar">Cachar</Option>
              <Option value="Jorhat">Jorhat</Option>
              <Option value="Sonitpur">Sonitpur</Option>
            </Select>
          </Col>

          <Col xs={24} md={4}>
            <div className="control-label">Severity</div>
            <Select
              value={selectedSeverity}
              onChange={setSelectedSeverity}
              style={{ width: '100%' }}
            >
              <Option value="all">All Severities</Option>
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>
          </Col>

          <Col xs={12} md={4}>
            <div className="control-label">Lookback (days)</div>
            <InputNumber
              min={1}
              max={30}
              value={hotspotDays}
              onChange={(v: number | null) => v != null && setHotspotDays(v)}
              style={{ width: '100%' }}
            />
          </Col>

          <Col xs={12} md={4}>
            <div className="control-label">Hotspot Threshold</div>
            <InputNumber
              min={1}
              max={200}
              value={hotspotThreshold}
              onChange={(v: number | null) => v != null && setHotspotThreshold(v)}
              style={{ width: '100%' }}
            />
          </Col>

          <Col xs={24} md={4}>
            <div className="control-label">Disease (optional)</div>
            <Select
              allowClear
              value={hotspotDiseaseFilter}
              onChange={setHotspotDiseaseFilter}
              placeholder="Any disease"
              style={{ width: '100%' }}
            >
              <Option value="Cholera">Cholera</Option>
              <Option value="Typhoid">Typhoid</Option>
              <Option value="Diarrhea">Diarrhea</Option>
              <Option value="Hepatitis A">Hepatitis A</Option>
            </Select>
          </Col>

          <Col xs={24} md={2}>
            <div className="control-toggle">
              <span>Heatmap</span>
              <Switch checked={showHeatmap} onChange={setShowHeatmap} />
            </div>
            <div className="control-toggle">
              <span>Hotspots</span>
              <Switch checked={showCircles} onChange={setShowCircles} />
            </div>
            <div className="control-toggle">
              <span>Outbreaks</span>
              <Switch checked={showPredictionOutbreaks} onChange={setShowPredictionOutbreaks} />
            </div>
          </Col>

          <Col xs={24} md={4} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setIsReportModalVisible(true)}>
              Report New Outbreak
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Live district summary */}
      {selectedDistrict !== 'all' && (
        <Card className="live-summary-card" size="small">
          <div className="live-summary-header">
            <span className="live-summary-title">
              Live Disease Summary — {selectedDistrict}
            </span>
            {loadingDistrictStats && <Spin size="small" />}
          </div>
          {districtStats ? (
            <div className="live-summary-body">
              <span>Total reports: {districtStats.total_reports}</span>
              <div className="live-summary-tags">
                {districtStats.diseases.map((d, i) => (
                  <Tag
                    key={i}
                    color={d.outbreak ? 'red' : 'blue'}
                    className="live-summary-tag"
                  >
                    {d.name.toUpperCase()} • {d.count} cases
                    {d.outbreak && ' • OUTBREAK'}
                  </Tag>
                ))}
              </div>
            </div>
          ) : (
            <span>No data for this district yet.</span>
          )}
        </Card>
      )}

      {/* MAP (full width) */}
      <Card
        title="Disease Outbreak Zone Map"
        className="map-card"
        style={{ marginTop: 16 }}
      >
        <div className="map-legend-inline">
          <Badge color="#ff0000" text="High Risk / Outbreak (25+ predictions)" />
          <Badge color="#ffa500" text="Medium Risk / Outbreak (20-24 predictions)" />
          <Badge color="#00c853" text="Low/Safe Zones" />
        </div>

        {(loadingHotspots || loadingPredictionOutbreaks) ? (
          <div className="map-loading">
            <Spin tip={loadingPredictionOutbreaks ? "Loading outbreaks..." : "Loading hotspots..."} />
          </div>
        ) : (
          <div className="map-wrapper">
            <MapContainer
              center={mapCenter}
              zoom={7}
              minZoom={6}
              maxZoom={12}
              maxBounds={[
                [NE_BOUNDS.minLat, NE_BOUNDS.minLng],
                [NE_BOUNDS.maxLat, NE_BOUNDS.maxLng],
              ]}
              maxBoundsViscosity={1.0}
              className="leaflet-map"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Risk zones */}
              {visibleRiskZones.map((zone) => {
                const fill = zoneFillColor(zone.severity);
                return (
                  <Circle
                    key={zone.id}
                    center={zone.center}
                    radius={zone.radius}
                    pathOptions={{
                      color: fill,
                      fillColor: fill,
                      fillOpacity: 0.35,
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <strong>{zone.name}</strong>
                        <div>District: {zone.district}</div>
                        <div>Severity: {zone.severity}</div>
                        {zone.summary && <div>{zone.summary}</div>}
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Heatmap */}
              {showHeatmap && heatPoints.length > 0 && (
                <HeatmapLayer points={heatPoints} />
              )}

              {/* Hotspot circles */}
              {showCircles &&
                hotspots.map((h, idx) => {
                  const c = h.center;
                  if (!c) return null;
                  const [lat, lng] = c;
                  if (!isWithinNorthEast(lat, lng)) return null;

                  const inSelectedDistrict =
                    selectedDistrict === 'all' ||
                    (h.location &&
                      h.location
                        .toLowerCase()
                        .includes(selectedDistrict.toLowerCase()));

                  const color =
                    isOutbreakInSelectedDistrict && inSelectedDistrict
                      ? '#ff4d4f'
                      : colorBySeverity(h.severity);

                  return (
                    <Circle
                      key={idx}
                      center={[lat, lng]}
                      radius={radiusFromCount(h.count)}
                      pathOptions={{ color, fillOpacity: 0.18 }}
                    >
                      <Popup>
                        <div className="popup-content">
                          <strong>{h.disease}</strong>
                          <div>{h.location}</div>
                          <div>Cases: {h.count}</div>
                          {h.samples?.slice(0, 5).map((s, i) => (
                            <div key={i} className="popup-sample">
                              {s.patientName || s.prediction_id}{' '}
                              {s.predicted_at &&
                                '— ' + new Date(s.predicted_at).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

              {/* Prediction Outbreak circles (from backend aggregation) */}
              {showPredictionOutbreaks &&
                filteredPredictionOutbreaks.map((outbreak) => {
                  const coords = outbreak.coordinates;
                  if (!coords) return null;
                  const [lat, lng] = coords;
                  if (!isWithinNorthEast(lat, lng)) return null;

                  const circleColor = outbreakCircleColor(outbreak.color);

                  return (
                    <Circle
                      key={outbreak.id}
                      center={[lat, lng]}
                      radius={outbreakRadiusFromPredictions(outbreak.totalPredictions)}
                      pathOptions={{
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.25,
                        weight: 3,
                        dashArray: '5, 10', // Dashed line to distinguish from hotspots
                      }}
                    >
                      <Popup>
                        <div className="popup-content">
                          <strong style={{ color: circleColor }}>
                            🔴 PREDICTED OUTBREAK
                          </strong>
                          <div><strong>Area:</strong> {outbreak.areaName}</div>
                          <div><strong>District:</strong> {outbreak.district}</div>
                          <div><strong>Disease:</strong> {outbreak.disease}</div>
                          <div><strong>Total Predictions:</strong> {outbreak.totalPredictions}</div>
                          <div><strong>Severity:</strong> {outbreak.severity}</div>
                          {outbreak.latestPredictionDate && (
                            <div>
                              <strong>Latest:</strong>{' '}
                              {new Date(outbreak.latestPredictionDate).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
            </MapContainer>
          </div>
        )}
      </Card>

      {/* Hotspot table - full width */}
      <Card
        title="Hotspots (mock / backend)"
        className="hotspot-card"
        style={{ marginTop: 20 }}
      >
        <Table
          columns={hotspotColumns}
          dataSource={hotspots}
          pagination={false}
          rowKey={(r: any) => `${r.location}-${r.disease}`}
        />
      </Card>

      {/* Prediction-based Outbreak Reports table */}
      <Card
        title={
          <Space>
            <span>Recent Outbreak Reports (Prediction-Based)</span>
            {loadingPredictionOutbreaks && <Spin size="small" />}
          </Space>
        }
        className="reports-table-card"
        style={{ marginTop: 20, marginBottom: 16 }}
        extra={
          <Space>
            <span style={{ fontSize: 12, color: '#888' }}>
              Showing areas with ≥20 predictions in last {outbreakDays} days
            </span>
            <InputNumber
              min={7}
              max={90}
              value={outbreakDays}
              onChange={(v: number | null) => v != null && setOutbreakDays(v)}
              style={{ width: 80 }}
              size="small"
            />
            <span style={{ fontSize: 12, color: '#888' }}>days</span>
          </Space>
        }
      >
        {filteredPredictionOutbreaks.length > 0 ? (
          <Table
            columns={predictionOutbreakColumns}
            dataSource={filteredPredictionOutbreaks}
            pagination={{ pageSize: 10 }}
            rowKey={(r: PredictionOutbreak) => r.id}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
            {loadingPredictionOutbreaks
              ? 'Loading prediction outbreaks...'
              : 'No outbreak areas detected meeting the threshold (≥20 predictions).'}
          </div>
        )}
      </Card>

      {/* Legacy manual reports table (optional - keeping for reference) */}
      <Card
        title="Manual Outbreak Reports"
        className="reports-table-card"
        style={{ marginTop: 20, marginBottom: 32 }}
      >
        <Table
          columns={reportColumns}
          dataSource={filteredReports}
          pagination={false}
          rowKey={(r: DiseaseReport) => r.id}
        />
      </Card>

      {/* Report modal */}
      <Modal
        title="Report New Disease Outbreak"
        open={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleReportSubmit}>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: 'Please select district' }]}
              >
                <Select placeholder="Select District">
                  <Option value="Kamrup Metro">Kamrup Metro</Option>
                  <Option value="Dibrugarh">Dibrugarh</Option>
                  <Option value="Cachar">Cachar</Option>
                  <Option value="Jorhat">Jorhat</Option>
                  <Option value="Sonitpur">Sonitpur</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="village"
                label="Village/Area"
                rules={[{ required: true, message: 'Please enter village name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="Specific Location"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="disease"
                label="Disease"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="Cholera">Cholera</Option>
                  <Option value="Typhoid">Typhoid</Option>
                  <Option value="Diarrhea">Diarrhea</Option>
                  <Option value="Hepatitis A">Hepatitis A</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="casesCount"
                label="Number of Cases"
                rules={[{ required: true }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="Severity Level"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportedDate"
                label="Report Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => setIsReportModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ---------------------- Heatmap layer ---------------------- */

function HeatmapLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !points || points.length === 0) return;
    // @ts-ignore
    const heat = (L as any).heatLayer(points, {
      radius: 25,
      blur: 18,
      maxZoom: 11,
    }).addTo(map);
    return () => {
      heat.remove();
    };
  }, [map, points]);
  return null;
}

export default DiseaseMapping;