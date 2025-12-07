// src/pages/WaterQualityPrediction.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Input, Select, Slider, Statistic, Timeline, Tag, message, Tooltip } from 'antd';
import { ExperimentOutlined, RobotOutlined, WarningOutlined, CheckCircleOutlined, SyncOutlined, CopyOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import './ReportWaterQuality.css';

// --- Local API helper: Sends data to FastAPI backend ---
async function postReport(payload: any) {
  try {
    const response = await fetch("http://localhost:8000/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`POST /report failed → ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error in postReport:", error);
    throw error;
  }
}

// Chart.js registration
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface WaterQualityData {
  id: string;
  location: string;
  district: string;
  timestamp: string;
  ph: number;
  turbidity: number;
  tds: number;
  chlorine: number;
  fluoride: number;
  nitrate: number;
  coliform: number;
  temperature: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  predictedDiseases?: string[];
  confidence?: number;
  report_id?: string;
  _id?: string; // optional DB id
}

const { Option } = Select;

const WaterQualityPrediction: React.FC = () => {
  const [waterData, setWaterData] = useState<WaterQualityData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [form] = Form.useForm();

  // Helpers: truncate id for UI and copy to clipboard
  const truncateId = (id?: string) => {
    if (!id) return '-';
    if (id.length <= 18) return id;
    return `${id.slice(0, 8)}…${id.slice(-8)}`;
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) {
      message.warning('No ID to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success('Report ID copied to clipboard');
    } catch (err) {
      // fallback for older browsers
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      message.success('Report ID copied (fallback)');
    }
  };

  // Load saved water reports from backend on mount; fall back to demo data
  useEffect(() => {
    const mockData: WaterQualityData[] = [
      {
        id: '1',
        location: 'Brahmaputra River - Guwahati',
        district: 'Kamrup Metro',
        timestamp: '2024-01-16T10:00:00Z',
        ph: 6.8,
        turbidity: 15.2,
        tds: 180,
        chlorine: 0.3,
        fluoride: 0.8,
        nitrate: 12.5,
        coliform: 45,
        temperature: 24.5,
        riskLevel: 'medium',
        predictedDiseases: ['Cholera', 'Diarrhea'],
        confidence: 85
      },
      {
        id: '2',
        location: 'Dibrugarh Water Treatment Plant',
        district: 'Dibrugarh',
        timestamp: '2024-01-16T11:00:00Z',
        ph: 7.2,
        turbidity: 2.1,
        tds: 120,
        chlorine: 0.5,
        fluoride: 0.6,
        nitrate: 8.2,
        coliform: 5,
        temperature: 23.8,
        riskLevel: 'low',
        predictedDiseases: [],
        confidence: 92
      },
      {
        id: '3',
        location: 'Silchar Municipal Supply',
        district: 'Cachar',
        timestamp: '2024-01-16T12:00:00Z',
        ph: 6.2,
        turbidity: 25.8,
        tds: 280,
        chlorine: 0.1,
        fluoride: 1.2,
        nitrate: 22.5,
        coliform: 120,
        temperature: 26.2,
        riskLevel: 'high',
        predictedDiseases: ['Cholera', 'Typhoid', 'Hepatitis A'],
        confidence: 78
      }
    ];

    async function loadSaved() {
      try {
        const res = await fetch("http://localhost:8000/water_reports?limit=50");
        if (!res.ok) throw new Error("Failed to fetch water reports");
        const docs = await res.json();

        const fromDb = docs.map((d: any): WaterQualityData => ({
          id: d.report_id || d._id || `${Date.now()}`,
          _id: d._id || undefined,
          report_id: d.meta?.report_id || d.report_id || undefined,
          location: d.location || d.water?.location || "Unknown",
          district: d.district || d.water?.district || "Unknown",
          timestamp: (d.meta?.submitted_at || d.timestamp || new Date().toISOString()),
          ph: Number(d.ph ?? d.water?.ph ?? 0),
          turbidity: Number(d.turbidity ?? d.water?.turbidity ?? 0),
          tds: Number(d.tds ?? d.water?.tds ?? 0),
          chlorine: Number(d.chlorine ?? d.water?.chlorine ?? 0),
          fluoride: Number(d.fluoride ?? d.water?.fluoride ?? 0),
          nitrate: Number(d.nitrate ?? d.water?.nitrate ?? 0),
          coliform: Number(d.coliform ?? d.water?.coliform ?? 0),
          temperature: Number(d.temperature ?? d.water?.temperature ?? 0),
          riskLevel: undefined,
          predictedDiseases: d.predictedDiseases || [],
          confidence: d.confidence || undefined
        }));

        setWaterData([...fromDb, ...mockData]);
      } catch (err) {
        console.warn("Could not load saved water reports — using mock data", err);
        setWaterData(mockData);
      }
    }

    loadSaved();
  }, []);

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#ff7a45';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  // small chart data using riskLevel if available
  const chartData = {
    labels: waterData.slice(0, 10).reverse().map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Risk Score (approx)',
        data: waterData.slice(0, 10).reverse().map(d => {
          const score = d.riskLevel === 'critical' ? 90 :
            d.riskLevel === 'high' ? 70 :
            d.riskLevel === 'medium' ? 40 : 20;
          return score;
        }),
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // handleAnalyze: just save the water data to backend (no client-side rule-based ML)
  const handleAnalyze = async (values: any) => {
    setIsAnalyzing(true);
    try {
      const waterQualityData: Partial<WaterQualityData> = {
        location: values.location,
        district: values.district,
        ph: Number(values.ph),
        turbidity: Number(values.turbidity),
        tds: Number(values.tds),
        chlorine: Number(values.chlorine),
        fluoride: Number(values.fluoride),
        nitrate: Number(values.nitrate),
        coliform: Number(values.coliform),
        temperature: Number(values.temperature)
      };

      const reportId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `rid-${Date.now()}`;

      const payload = {
        water: {
          ...waterQualityData,
          primary_water_source: values.primaryWaterSource || null,
          water_treatment: values.waterTreatment || [],
          unusual_flags: values.unusual || [],
          report_id: reportId
        },
        meta: {
          submitted_at: new Date().toISOString(),
          source: 'web_ui',
          report_id: reportId
        }
      };

      const res = await postReport(payload);
      console.debug('postReport response:', res);

      // Add the new item to UI list. Backend might not return DB id; we rely on report_id for linking.
      const newData: WaterQualityData = {
        id: `${Date.now()}`,
        location: String(values.location),
        district: String(values.district),
        timestamp: new Date().toISOString(),
        ph: Number(values.ph),
        turbidity: Number(values.turbidity),
        tds: Number(values.tds),
        chlorine: Number(values.chlorine),
        fluoride: Number(values.fluoride),
        nitrate: Number(values.nitrate),
        coliform: Number(values.coliform),
        temperature: Number(values.temperature),
        report_id: reportId,
        // _id left undefined because backend currently doesn't return it
        _id: (res && (res.water_id || res._id)) ? (res.water_id || res._id) : undefined
      };

      setWaterData(prev => [newData, ...prev]);
      message.success('Water data saved to database successfully.');
      form.resetFields();
    } catch (err: any) {
      console.error('Failed to save water report:', err);
      message.error('Failed to save water data to database.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="water-quality-prediction">
      <div className="prediction-header">
        <h2><RobotOutlined /> Water Quality Reporting</h2>
        <p>Submit water quality parameters — saved to the database for later analysis / ML training.</p>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card className="stat-card">
            <Statistic
              title="Locations Monitored"
              value={waterData.length}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card className="stat-card">
            <Statistic
              title="High Risk Areas (demo)"
              value={waterData.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Last Report ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Tooltip title={waterData[0]?.report_id || '-'}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {truncateId(waterData[0]?.report_id)}
                </div>
              </Tooltip>
              <Tooltip title="Copy full ID">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(waterData[0]?.report_id)}
                  aria-label="Copy last report id"
                />
              </Tooltip>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card className="stat-card">
            <Statistic
              title="Reports Stored"
              value={waterData.length}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Input Form */}
        <Col xs={24} lg={12}>
          <Card title="Report Water Quality" className="analysis-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAnalyze}
            >
              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true, message: 'Please enter location' }]}
                  >
                    <Input placeholder="Enter water source location" />
                  </Form.Item>
                </Col>
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
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    name="ph"
                    label="pH Level"
                    rules={[{ required: true, message: 'Please enter pH level' }]}
                  >
                    <Slider
                      min={0}
                      max={14}
                      step={0.1}
                      marks={{ 0: '0', 7: '7 (Neutral)', 14: '14' }}
                      tooltip={{ formatter: (value) => `pH ${value}` }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="turbidity"
                    label="Turbidity (NTU)"
                    rules={[{ required: true, message: 'Please enter turbidity' }]}
                  >
                    <Input type="number" placeholder="Turbidity value" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    name="tds"
                    label="TDS (mg/L)"
                    rules={[{ required: true, message: 'Please enter TDS' }]}
                  >
                    <Input type="number" placeholder="Total Dissolved Solids" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="chlorine"
                    label="Chlorine (mg/L)"
                    rules={[{ required: true, message: 'Please enter chlorine level' }]}
                  >
                    <Input type="number" step="0.1" placeholder="Chlorine level" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    name="fluoride"
                    label="Fluoride (mg/L)"
                    rules={[{ required: true, message: 'Please enter fluoride level' }]}
                  >
                    <Input type="number" step="0.1" placeholder="Fluoride level" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="nitrate"
                    label="Nitrate (mg/L)"
                    rules={[{ required: true, message: 'Please enter nitrate level' }]}
                  >
                    <Input type="number" placeholder="Nitrate level" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    name="coliform"
                    label="Coliform (CFU/100ml)"
                    rules={[{ required: true, message: 'Please enter coliform count' }]}
                  >
                    <Input type="number" placeholder="Coliform bacteria count" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="temperature"
                    label="Temperature (°C)"
                    rules={[{ required: true, message: 'Please enter temperature' }]}
                  >
                    <Input type="number" step="0.1" placeholder="Water temperature" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item name="primaryWaterSource" label="Primary Water Source">
                    <Select placeholder="Select source (optional)">
                      <Option value="Municipal tap water">Municipal tap water</Option>
                      <Option value="Well water">Well water</Option>
                      <Option value="Tube well">Tube well</Option>
                      <Option value="River water">River water</Option>
                      <Option value="Pond water">Pond water</Option>
                      <Option value="Bottled water">Bottled water</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="waterTreatment" label="Water Treatment (optional)">
                    <Select mode="tags" placeholder="e.g. Chlorination, Filtration (optional)"/>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isAnalyzing}
                  icon={<RobotOutlined />}
                  block
                  size="large"
                >
                  {isAnalyzing ? 'Saving...' : 'Save Water Data'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Right column: history */}
        <Col xs={24} lg={12}>
          <Card title="Recent Reports / History" className="results-card">
            <div style={{ marginBottom: 12 }}>
              <p>Recent water reports appear below</p>
            </div>

            <Timeline
              items={waterData.slice(0, 10).map(data => ({
                color: getRiskColor(data.riskLevel),
                children: (
                  <div className="timeline-item" key={data.id}>
                    <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="location" style={{ fontWeight: 600 }}>{data.location}</span>
                      </div>
                      <Tag color={getRiskColor(data.riskLevel)}>{data.riskLevel ? data.riskLevel.toUpperCase() : 'UNCLASSIFIED'}</Tag>
                    </div>
                    <div className="timeline-content" style={{ marginTop: 8 }}>
                      <p style={{ margin: 0 }}>District: {data.district}</p>
                      <p style={{ margin: '6px 0' }}>pH: {data.ph}, Turbidity: {data.turbidity}, Coliform: {data.coliform}</p>
                      <p className="timestamp" style={{ color: '#666', fontSize: 12 }}>{new Date(data.timestamp).toLocaleString()}</p>
                      {data.report_id && <p style={{ marginTop: 6 }}>Report ID: <code>{data.report_id}</code></p>}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Risk Trend (demo)" className="chart-card">
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const },
                  title: { display: true, text: 'Water Data Trend (demo)' }
                },
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Summary" className="chart-card">
            <p>Use this page to save clean water-parameter records. ML models can later be trained using these records.</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WaterQualityPrediction;
