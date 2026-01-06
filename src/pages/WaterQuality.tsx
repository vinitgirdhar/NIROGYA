// WaterQuality.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  message,
  Switch
} from 'antd';
import {
  PlusOutlined,
  SyncOutlined,
  ExperimentOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ThemeProvider';
import type { ColumnsType } from 'antd/es/table';
import './WaterQuality.css';

const { Option } = Select;
const { TextArea } = Input;

type WaterQualityData = {
  id: string;
  sourceId: string;
  sourceName: string;
  location: { lat: number; lng: number; address: string };
  parameters: {
    turbidity: number;
    pH: number;
    bacterialCount: number;
    chlorine: number;
    temperature: number;
    tds?: number;
    fluoride?: number;
    nitrate?: number;
    coliform?: number;
  };
  status: 'safe' | 'warning' | 'contaminated';
  timestamp: Date | string;
  testedBy: string;
};

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Rule-based water quality status
 */
const computeStatus = (vals: { pH: number; turbidity: number; bacterialCount: number; chlorine?: number }) => {
  const { pH, turbidity, bacterialCount, chlorine } = vals;

  const phVal = typeof pH === 'number' ? pH : NaN;
  const turbVal = typeof turbidity === 'number' ? turbidity : NaN;
  const bacVal = typeof bacterialCount === 'number' ? bacterialCount : NaN;

  // Critical contaminated rules
  if (!Number.isNaN(bacVal) && bacVal > 100) return 'contaminated';
  if (!Number.isNaN(turbVal) && turbVal > 5) return 'contaminated';
  if (!Number.isNaN(phVal) && (phVal < 6.0 || phVal > 9.0)) return 'contaminated';

  // Warning rules
  if (!Number.isNaN(bacVal) && bacVal > 50) return 'warning';
  if (!Number.isNaN(turbVal) && turbVal > 3) return 'warning';
  if (!Number.isNaN(phVal) && (phVal < 6.5 || phVal > 8.5)) return 'warning';
  if (typeof chlorine === 'number' && chlorine < 0.1) return 'warning';

  return 'safe';
};

/**
 * buildTrendFromReports: convert backend water_reports to hourly averaged trend
 */
function buildTrendFromReports(reports: any[]) {
  const rows = (reports || []).map((r: any) => {
    const tsRaw = r.meta?.received_at ?? r.created_at ?? r.timestamp ?? r.meta?.submitted_at;
    const ts = tsRaw ? new Date(tsRaw) : new Date();
    const pH = Number(r.pH ?? r.ph ?? r.parameters?.pH ?? 0);
    const turbidity = Number(r.turbidity ?? r.parameters?.turbidity ?? 0);
    const bacterial = Number(r.coliform ?? r.parameters?.bacterialCount ?? r.bacterialCount ?? 0);
    return { ts, pH: isFinite(pH) ? pH : 0, turbidity: isFinite(turbidity) ? turbidity : 0, bacterial: isFinite(bacterial) ? bacterial : 0 };
  });

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = rows.filter(r => r.ts >= since && r.ts <= now);

  if (recent.length === 0) return [];

  const buckets: Record<string, { pHSum: number; turbSum: number; bacSum: number; count: number; hourDate: Date }> = {};

  recent.forEach(r => {
    const d = r.ts;
    const hourDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0);
    const hourKey = hourDate.toISOString();
    if (!buckets[hourKey]) buckets[hourKey] = { pHSum: 0, turbSum: 0, bacSum: 0, count: 0, hourDate: new Date(hourDate) };
    buckets[hourKey].pHSum += r.pH;
    buckets[hourKey].turbSum += r.turbidity;
    buckets[hourKey].bacSum += r.bacterial;
    buckets[hourKey].count += 1;
  });

  const sorted = Object.values(buckets).sort((a, b) => a.hourDate.getTime() - b.hourDate.getTime());

  const trend = sorted.map(b => ({
    time: b.hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pH: +(b.pHSum / b.count).toFixed(2),
    turbidity: +(b.turbSum / b.count).toFixed(2),
    bacterial: Math.round(b.bacSum / b.count)
  }));

  return trend;
}

const WaterQuality: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sources, setSources] = useState<WaterQualityData[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartTrend, setChartTrend] = useState<Array<{ time: string; pH: number; turbidity: number; bacterial: number }>>([]);
  const autoRefreshRef = useRef<number | null>(null);

  const fetchWaterReports = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/water_reports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped: WaterQualityData[] = (data || []).map((w: any, idx: number) => {
        const pH = Number(w.pH ?? w.ph ?? 0);
        const turbidity = Number(w.turbidity ?? 0);
        const bacterialCount = Number(w.coliform ?? w.bacterialCount ?? 0);
        const status = computeStatus({ pH, turbidity, bacterialCount, chlorine: Number(w.chlorine ?? 0) });

        return {
          id: String(w._id ?? idx),
          sourceId: w.report_id ?? String(w._id ?? `WS${idx}`),
          sourceName: String(w.primary_water_source ?? `Source ${idx + 1}`),
          location: { lat: 0, lng: 0, address: String(w.location ?? w.village ?? 'Unknown') },
          parameters: {
            turbidity,
            pH,
            bacterialCount,
            chlorine: Number(w.chlorine ?? 0),
            temperature: Number(w.temperature ?? 0),
            tds: Number(w.tds ?? 0),
            fluoride: Number(w.fluoride ?? 0),
            nitrate: Number(w.nitrate ?? 0),
            coliform: Number(w.coliform ?? 0)
          },
          status,
          timestamp: w.meta?.received_at ?? w.created_at ?? new Date().toISOString(),
          testedBy: w.testedBy ?? 'Unknown'
        };
      });

      setSources(mapped);

      // build chart trend from raw backend docs
      const trend = buildTrendFromReports(data || []);
      setChartTrend(trend);
    } catch (err) {
      console.error('fetchWaterReports error', err);
      message.error('Failed to fetch water reports from backend');
    }
  }, []);

  useEffect(() => {
    fetchWaterReports();

    if (autoRefresh) {
      autoRefreshRef.current = window.setInterval(() => {
        fetchWaterReports();
      }, 6000);
    } else if (autoRefreshRef.current) {
      window.clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }

    return () => {
      if (autoRefreshRef.current) {
        window.clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [autoRefresh, fetchWaterReports]);

  // hoisted function declaration so columns can use it safely anywhere
  function viewDetails(source: WaterQualityData) {
    Modal.info({
      title: `Water Quality Details - ${source.sourceName}`,
      content: (
        <div className="water-details">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic title="pH Level" value={source.parameters.pH} precision={1} />
            </Col>
            <Col span={12}>
              <Statistic title="Turbidity" value={source.parameters.turbidity} suffix="NTU" precision={1} />
            </Col>
            <Col span={12}>
              <Statistic title="Bacterial Count" value={source.parameters.bacterialCount} suffix="CFU/ml" />
            </Col>
            <Col span={12}>
              <Statistic title="Chlorine" value={source.parameters.chlorine} suffix="mg/L" precision={1} />
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <p><strong>Location:</strong> {source.location.address}</p>
            <p><strong>Tested By:</strong> {source.testedBy}</p>
            <p><strong>Test Date:</strong> {new Date(source.timestamp).toLocaleString()}</p>
            <p><strong>Status:</strong> <Tag color={source.status === 'safe' ? 'green' : source.status === 'warning' ? 'orange' : 'red'}>{source.status.toUpperCase()}</Tag></p>
          </div>
        </div>
      ),
      width: 600,
    });
  }

  const columns: ColumnsType<WaterQualityData> = [
    {
      title: 'Source Name',
      dataIndex: 'sourceName',
      key: 'sourceName',
      render: (name: string, record: WaterQualityData) => (
        <div>
          <div className="source-name">{name}</div>
          <div className="source-id">ID: {record.sourceId}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: any) => location.address,
    },
    {
      title: 'pH Level',
      dataIndex: 'parameters',
      key: 'pH',
      render: (params: any) => (
        <span className={params.pH >= 6.5 && params.pH <= 8.5 ? 'param-safe' : 'param-danger'}>
          {params.pH}
        </span>
      ),
    },
    {
      title: 'Turbidity (NTU)',
      dataIndex: 'parameters',
      key: 'turbidity',
      render: (params: any) => (
        <span className={params.turbidity <= 3 ? 'param-safe' : params.turbidity <= 5 ? 'param-warning' : 'param-danger'}>
          {params.turbidity}
        </span>
      ),
    },
    {
      title: 'Bacterial Count',
      dataIndex: 'parameters',
      key: 'bacterialCount',
      render: (params: any) => (
        <span className={params.bacterialCount <= 50 ? 'param-safe' : params.bacterialCount <= 100 ? 'param-warning' : 'param-danger'}>
          {params.bacterialCount} CFU/ml
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'safe' ? 'green' : status === 'warning' ? 'orange' : 'red'}
          icon={
            status === 'safe' ? <CheckCircleOutlined /> :
            status === 'warning' ? <ExclamationCircleOutlined /> : <AlertOutlined />
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Tested',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: any) => {
        const d = new Date(date);
        return (
          <div>
            <div>{d.toLocaleDateString()}</div>
            <div className="test-time">{d.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            onClick={() => viewDetails(record)}
          >
            Details
          </Button>
        </Space>
      ),
    },
  ];

  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      location: values.location,
      pH: values.pH,
      turbidity: values.turbidity,
      tds: values.tds ?? 0,
      chlorine: values.chlorine,
      fluoride: values.fluoride ?? 0,
      nitrate: values.nitrate ?? 0,
      coliform: values.bacterialCount,
      temperature: values.temperature,
      primary_water_source: values.sourceType || 'Manual Test',
      district: values.district || ''
    };
    try {
      const res = await fetch(`${BACKEND_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success('Water test result added and sent to backend');
      setIsModalVisible(false);
      form.resetFields();
      fetchWaterReports();
    } catch (err) {
      console.error(err);
      message.error('Failed to send test result to backend');
    }
  };

  const refreshData = async () => {
    message.loading('Refreshing water quality data...', 1);
    await fetchWaterReports();
    message.success('Data refreshed successfully');
  };

  const safeCount = sources.filter(s => s.status === 'safe').length;
  const warningCount = sources.filter(s => s.status === 'warning').length;
  const contaminatedCount = sources.filter(s => s.status === 'contaminated').length;

  return (
    <div className="water-quality">
      <div className="page-header">
        <div>
          <h1>{t('water.testResults')}</h1>
          <p>Monitor water quality across all sources in real-time</p>
        </div>
        <Space>
          <div className="auto-refresh">
            <span>Auto Refresh:</span>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              size="small"
            />
          </div>
          <Button
            icon={<SyncOutlined />}
            onClick={refreshData}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showModal}
            size="large"
          >
            {t('water.addTest')}
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Safe Sources"
              value={safeCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={sources.length ? Math.round((safeCount / sources.length) * 100) : 0}
              strokeColor="#52c41a"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Warning Sources"
              value={warningCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress
              percent={sources.length ? Math.round((warningCount / sources.length) * 100) : 0}
              strokeColor="#faad14"
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Contaminated Sources"
              value={contaminatedCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
            <Progress
              percent={sources.length ? Math.round((contaminatedCount / sources.length) * 100) : 0}
              strokeColor="#f5222d"
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Water Quality Trends Chart */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Water Quality Trends (24 Hours)" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartTrend.length ? chartTrend : [
                { time: '00:00', pH: 7.2, turbidity: 2.1, bacterial: 20 },
                { time: '04:00', pH: 7.1, turbidity: 2.5, bacterial: 25 },
                { time: '08:00', pH: 6.9, turbidity: 3.2, bacterial: 35 },
                { time: '12:00', pH: 6.8, turbidity: 4.1, bacterial: 45 },
                { time: '16:00', pH: 6.5, turbidity: 5.8, bacterial: 65 },
                { time: '20:00', pH: 6.2, turbidity: 7.2, bacterial: 85 },
              ]}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#434343' : '#f0f0f0'}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: isDark ? '#f0f0f0' : '#666' }}
                  axisLine={{ stroke: isDark ? '#434343' : '#d9d9d9' }}
                />
                <YAxis
                  tick={{ fill: isDark ? '#f0f0f0' : '#666' }}
                  axisLine={{ stroke: isDark ? '#434343' : '#d9d9d9' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    border: `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    color: isDark ? '#f0f0f0' : '#000'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="pH" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="turbidity" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="bacterial" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Water Sources Table */}
      <Card title="Water Sources">
        <Table
          columns={columns}
          dataSource={sources}
          rowKey="id"
          pagination={{
            total: sources.length,
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add Test Result Modal */}
      <Modal
        title={t('water.addTest')}
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('water.sourceName')}
                name="sourceName"
                rules={[{ required: true, message: 'Please enter source name' }]}
              >
                <Input placeholder="e.g., Main Well - Village A" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Village/Area address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label={t('water.pH')}
                name="pH"
                rules={[{ required: true, message: 'Please enter pH level' }]}
              >
                <InputNumber
                  placeholder="6.5 - 8.5"
                  style={{ width: '100%' }}
                  min={0}
                  max={14}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label={t('water.turbidity')}
                name="turbidity"
                rules={[{ required: true, message: 'Please enter turbidity' }]}
              >
                <InputNumber
                  placeholder="NTU"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label={t('water.bacterial')}
                name="bacterialCount"
                rules={[{ required: true, message: 'Please enter bacterial count' }]}
              >
                <InputNumber
                  placeholder="CFU/ml"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label={t('water.chlorine')}
                name="chlorine"
                rules={[{ required: true, message: 'Please enter chlorine level' }]}
              >
                <InputNumber
                  placeholder="mg/L"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label={t('water.temperature')}
                name="temperature"
                rules={[{ required: true, message: 'Please enter temperature' }]}
              >
                <InputNumber
                  placeholder="°C"
                  style={{ width: '100%' }}
                  min={0}
                  max={50}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Test Method"
                name="sourceType"
              >
                <Select placeholder="Select test method">
                  <Option value="Manual Test">Manual Test Kit</Option>
                  <Option value="IoT Sensor">IoT Sensor</Option>
                  <Option value="Laboratory">Laboratory Analysis</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Tested By"
            name="testedBy"
          >
            <Input placeholder="Name of person/device conducting test" />
          </Form.Item>

          <Form.Item
            label="District"
            name="district"
          >
            <Input placeholder="District name (used for model matching)" />
          </Form.Item>

          <Form.Item
            label="Additional Notes"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="Any additional observations or notes"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Test Result
              </Button>
              <Button onClick={() => { setIsModalVisible(false); form.resetFields(); }}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WaterQuality;