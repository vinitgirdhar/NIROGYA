// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Timeline, List, Button, Empty, Alert, Badge } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
  FileTextOutlined,
  BookOutlined,
  NotificationOutlined,
  WarningOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import WaterAlertModal from '../components/WaterAlertModal';
import './Dashboard.css';

// Mock data (kept from your original file)
const weeklyData = [
  { day: 'Mon', cases: 12, recovered: 8, active: 4 },
  { day: 'Tue', cases: 19, recovered: 15, active: 4 },
  { day: 'Wed', cases: 8, recovered: 12, active: 0 },
  { day: 'Thu', cases: 15, recovered: 10, active: 5 },
  { day: 'Fri', cases: 22, recovered: 18, active: 4 },
  { day: 'Sat', cases: 18, recovered: 14, active: 4 },
  { day: 'Sun', cases: 25, recovered: 20, active: 5 },
];

const diseaseDistribution = [
  { name: 'Diarrhea', value: 45, color: '#8884d8' },
  { name: 'Cholera', value: 25, color: '#82ca9d' },
  { name: 'Typhoid', value: 20, color: '#ffc658' },
  { name: 'Hepatitis A', value: 10, color: '#ff7c7c' },
];

const waterQualityData = [
  { location: 'Village A', safe: 75, warning: 20, contaminated: 5 },
  { location: 'Village B', safe: 60, warning: 30, contaminated: 10 },
  { location: 'Village C', safe: 80, warning: 15, contaminated: 5 },
  { location: 'Village D', safe: 50, warning: 35, contaminated: 15 },
];

const recentAlerts = [
  {
    key: '1',
    type: 'Outbreak',
    location: 'Village A',
    severity: 'High',
    time: '2 hours ago',
    status: 'Active'
  },
  {
    key: '2',
    type: 'Water Contamination',
    location: 'Village B',
    severity: 'Medium',
    time: '5 hours ago',
    status: 'Investigating'
  },
  {
    key: '3',
    type: 'General Alert',
    location: 'Village C',
    severity: 'Low',
    time: '1 day ago',
    status: 'Resolved'
  }
];

const alertColumns = [
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Location', dataIndex: 'location', key: 'location' },
  { 
    title: 'Severity', 
    dataIndex: 'severity', 
    key: 'severity',
    render: (severity: string) => {
      const color = severity === 'High' ? 'red' : severity === 'Medium' ? 'orange' : 'blue';
      return <Tag color={color}>{severity}</Tag>;
    }
  },
  { title: 'Time', dataIndex: 'time', key: 'time' },
  { 
    title: 'Status', 
    dataIndex: 'status', 
    key: 'status',
    render: (status: string) => {
      const color = status === 'Active' ? 'red' : status === 'Investigating' ? 'orange' : 'green';
      return <Tag color={color}>{status}</Tag>;
    }
  }
];

// --- Small sub-views for role-specific dashboards ---

const AshaView: React.FC = () => {
  // For now we show a compact view using the same mock data.
  // You can replace these with real API calls later.
  const recentWater = waterQualityData.slice(0, 6);
  const recentPreds = diseaseDistribution.slice(0, 4);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>ASHA Dashboard</h1>
        <p className="dashboard-sub">Overview of tests and local alerts</p>
      </div>

      {/* Water Quality Alert Banner */}
      <Card 
        className="alert-banner-card"
        style={{ 
          marginBottom: 16, 
          background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
          border: 'none'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ color: 'white' }}>
              <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <NotificationOutlined /> Water Quality Alert System
              </h3>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
                Send immediate alerts to community members about water quality issues
              </p>
            </div>
          </Col>
          <Col>
            <Button 
              size="large"
              icon={<AlertOutlined />}
              onClick={() => setAlertModalVisible(true)}
              style={{ 
                background: 'white', 
                color: '#ff4d4f', 
                fontWeight: 'bold',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              Send Water Alert
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <Statistic title="Water tests" value={recentWater.length * 5} prefix={<FileTextOutlined />} />
            <div className="stat-sub">Your recent tests</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <Statistic title="Distinct sites" value={recentWater.length} prefix={<CheckCircleOutlined />} />
            <div className="stat-sub">Unique water sources</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <Statistic title="Alerts flagged" value={recentPreds.length} prefix={<ExclamationCircleOutlined />} />
            <div className="stat-sub">Potential issues</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={14}>
          <Card className="chart-card" title="Recent Water Test Summary">
            <Table
              dataSource={recentWater.map((r, i) => ({ key: i, ...r }))}
              columns={[
                { title: 'Location', dataIndex: 'location', key: 'location' },
                { title: 'Safe %', dataIndex: 'safe', key: 'safe' },
                { title: 'Warning %', dataIndex: 'warning', key: 'warning' },
                { title: 'Contaminated %', dataIndex: 'contaminated', key: 'contaminated' }
              ]}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="chart-card" title="Recent Alerts">
            <List
              dataSource={recentAlerts}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={`${item.type} - ${item.location}`}
                    description={`${item.severity} | ${item.time}`}
                  />
                  <div>{item.status}</div>
                </List.Item>
              )}
            />
          </Card>

          <Card className="chart-card" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Quick Actions</h3>
            <Button 
              type="primary" 
              danger
              block 
              style={{ marginBottom: 8 }}
              icon={<AlertOutlined />}
              onClick={() => setAlertModalVisible(true)}
            >
              🚨 Send Water Quality Alert
            </Button>
            <Button type="primary" block style={{ marginBottom: 8 }}>Report Water Quality</Button>
            <Button block style={{ marginBottom: 8 }}>Report Symptoms</Button>
            <Button block>View My Submissions</Button>
          </Card>
        </Col>
      </Row>

      {/* Water Alert Modal */}
      <WaterAlertModal 
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        userLocation={user?.location}
      />
    </div>
  );
};

const CommunityView: React.FC = () => {
  const { outbreakAlerts, outbreakUnreadCount } = useAlerts();

  // Get the most severe outbreak alert for the banner
  const highSeverityOutbreaks = outbreakAlerts.filter(o => o.severity === 'high');
  const mediumSeverityOutbreaks = outbreakAlerts.filter(o => o.severity === 'medium');
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Community Dashboard</h1>
        <p className="dashboard-sub">Simple overview for community users</p>
      </div>

      {/* Outbreak Alert Banner - Show if there are any outbreaks */}
      {outbreakAlerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {highSeverityOutbreaks.length > 0 && (
            <Alert
              message={
                <span style={{ fontWeight: 600 }}>
                  <WarningOutlined /> High Risk Outbreak Alert
                </span>
              }
              description={
                <div>
                  <p style={{ margin: '8px 0' }}>
                    <strong>{highSeverityOutbreaks[0].disease}</strong> outbreak detected in <strong>{highSeverityOutbreaks[0].areaName || highSeverityOutbreaks[0].district}</strong>.
                    {highSeverityOutbreaks[0].totalPredictions} cases reported.
                  </p>
                  {highSeverityOutbreaks.length > 1 && (
                    <Tag color="red">+{highSeverityOutbreaks.length - 1} more high-risk alerts</Tag>
                  )}
                </div>
              }
              type="error"
              showIcon
              icon={<AlertOutlined />}
              banner
              style={{ 
                borderRadius: 8, 
                marginBottom: 8,
                borderLeft: '4px solid #ff4d4f'
              }}
            />
          )}
          
          {mediumSeverityOutbreaks.length > 0 && highSeverityOutbreaks.length === 0 && (
            <Alert
              message={
                <span style={{ fontWeight: 600 }}>
                  <ExclamationCircleOutlined /> Disease Outbreak Warning
                </span>
              }
              description={
                <div>
                  <p style={{ margin: '8px 0' }}>
                    <strong>{mediumSeverityOutbreaks[0].disease}</strong> cases detected in <strong>{mediumSeverityOutbreaks[0].areaName || mediumSeverityOutbreaks[0].district}</strong>.
                    {mediumSeverityOutbreaks[0].totalPredictions} cases reported. Take precautions.
                  </p>
                  {mediumSeverityOutbreaks.length > 1 && (
                    <Tag color="orange">+{mediumSeverityOutbreaks.length - 1} more warnings</Tag>
                  )}
                </div>
              }
              type="warning"
              showIcon
              banner
              style={{ 
                borderRadius: 8, 
                marginBottom: 8,
                borderLeft: '4px solid #faad14'
              }}
            />
          )}
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Alerts
                  {outbreakUnreadCount > 0 && (
                    <Badge 
                      count={outbreakUnreadCount} 
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {outbreakAlerts.length > 0 
                    ? `${outbreakAlerts.length} active outbreak${outbreakAlerts.length > 1 ? 's' : ''}`
                    : 'Active notifications'
                  }
                </p>
              </div>
              <Badge dot={outbreakUnreadCount > 0} offset={[-5, 5]}>
                <BellOutlined style={{ fontSize: 28, color: outbreakUnreadCount > 0 ? '#ff4d4f' : 'var(--primary-color)' }} />
              </Badge>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button type="primary" block danger={outbreakUnreadCount > 0}>
                View Alerts
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Report</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Report issues quickly</p>
              </div>
              <FileTextOutlined style={{ fontSize: 28, color: 'var(--primary-color)' }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Button block style={{ marginBottom: 8 }}>Report Symptoms</Button>
              <Button block>Report Water Quality</Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Education</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Helpful resources</p>
              </div>
              <BookOutlined style={{ fontSize: 28, color: 'var(--primary-color)' }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Button block>Open Education</Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card className="chart-card" title="Community Resources">
            <List
              size="small"
              dataSource={[
                { title: 'How to treat water at home' },
                { title: 'Recognizing dehydration in children' },
                { title: 'When to visit a clinic' }
              ]}
              renderItem={item => <List.Item>{item.title}</List.Item>}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Outbreaks Section */}
      {outbreakAlerts.length > 0 && (
        <Row style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card 
              className="chart-card" 
              title={
                <span>
                  <MedicineBoxOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                  Active Disease Outbreaks in Your Area
                </span>
              }
            >
              <List
                size="small"
                dataSource={outbreakAlerts.slice(0, 5)}
                renderItem={outbreak => (
                  <List.Item
                    style={{
                      background: outbreak.severity === 'high' 
                        ? 'rgba(255, 77, 79, 0.05)' 
                        : outbreak.severity === 'medium' 
                          ? 'rgba(250, 173, 20, 0.05)' 
                          : 'transparent',
                      borderLeft: `4px solid ${
                        outbreak.severity === 'high' ? '#ff4d4f' : 
                        outbreak.severity === 'medium' ? '#faad14' : '#52c41a'
                      }`,
                      paddingLeft: 12,
                      marginBottom: 8,
                      borderRadius: '0 4px 4px 0'
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          <Tag color={outbreak.severity === 'high' ? 'red' : outbreak.severity === 'medium' ? 'orange' : 'green'}>
                            {outbreak.severity.toUpperCase()}
                          </Tag>
                          {outbreak.disease}
                        </span>
                      }
                      description={
                        <span>
                          📍 {outbreak.areaName || outbreak.district} • 
                          🏥 {outbreak.totalPredictions} cases reported
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
              {outbreakAlerts.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Button type="link">View all {outbreakAlerts.length} outbreaks</Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

// --- Original full dashboard (kept mostly unchanged) ---
const FullDashboard: React.FC = () => {
  const { t, translate, currentLanguage } = useLanguage();
  const { isDark } = useTheme();
  const [translatedLabels, setTranslatedLabels] = useState<Record<string, string>>({});

  // Translate dynamic labels using LibreTranslate API
  useEffect(() => {
    const translateLabels = async () => {
      const labels = [
        'Weekly Cases', 'Disease Distribution', 'Water Quality by Location',
        'Recent Alerts', 'Cases', 'Recovered', 'Active', 'Safe', 'Warning', 'Contaminated'
      ];
      const translated: Record<string, string> = {};
      for (const label of labels) {
        translated[label] = await translate(label);
      }
      setTranslatedLabels(translated);
    };
    translateLabels();
  }, [currentLanguage.code, translate]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.totalCases')}
              value={1128}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.activeCases')}
              value={26}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={<ArrowUpOutlined style={{ color: '#f5222d' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.resolvedCases')}
              value={1102}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.casesThisWeek')}
              value={119}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={<ArrowDownOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={16}>
          <Card title={translatedLabels['Weekly Cases'] || 'Weekly Health Trends'} className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#434343' : '#f0f0f0'} 
                />
                <XAxis 
                  dataKey="day" 
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
                <Line type="monotone" dataKey="cases" stroke="#8884d8" strokeWidth={2} name={translatedLabels['Cases'] || 'Cases'} />
                <Line type="monotone" dataKey="recovered" stroke="#82ca9d" strokeWidth={2} name={translatedLabels['Recovered'] || 'Recovered'} />
                <Line type="monotone" dataKey="active" stroke="#ffc658" strokeWidth={2} name={translatedLabels['Active'] || 'Active'} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={translatedLabels['Disease Distribution'] || 'Disease Distribution'} className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    border: `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    color: isDark ? '#f0f0f0' : '#000'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Water Quality and Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={translatedLabels['Water Quality by Location'] || 'Water Quality Overview'} className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="safe" stackId="a" fill="#52c41a" name={translatedLabels['Safe'] || 'Safe'} />
                <Bar dataKey="warning" stackId="a" fill="#faad14" name={translatedLabels['Warning'] || 'Warning'} />
                <Bar dataKey="contaminated" stackId="a" fill="#f5222d" name={translatedLabels['Contaminated'] || 'Contaminated'} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={translatedLabels['Recent Alerts'] || 'Recent Activity'}>
            <Timeline>
              <Timeline.Item color="red">
                <p>Outbreak alert in Village A</p>
                <p className="timeline-time">2 hours ago</p>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <p>Water contamination reported</p>
                <p className="timeline-time">5 hours ago</p>
              </Timeline.Item>
              <Timeline.Item color="green">
                <p>Alert resolved in Village C</p>
                <p className="timeline-time">1 day ago</p>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <p>Weekly health report generated</p>
                <p className="timeline-time">2 days ago</p>
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Recent Alerts Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={translatedLabels['Recent Alerts'] || 'Recent Alerts'}>
            <Table 
              columns={alertColumns} 
              dataSource={recentAlerts} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Hotspots / Water sources / Resources */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Hotspots">
            <div className="hotspot-item">
              <div className="hotspot-header">
                <span className="hotspot-name">Village A</span>
                <Tag color="red">Critical</Tag>
              </div>
              <Progress percent={85} status="exception" />
              <p className="hotspot-details">12 active cases, water contamination detected</p>
            </div>
            <div className="hotspot-item">
              <div className="hotspot-header">
                <span className="hotspot-name">Village B</span>
                <Tag color="orange">High</Tag>
              </div>
              <Progress percent={65} />
              <p className="hotspot-details">8 active cases, monitoring ongoing</p>
            </div>
            <div className="hotspot-item">
              <div className="hotspot-header">
                <span className="hotspot-name">Village C</span>
                <Tag color="blue">Medium</Tag>
              </div>
              <Progress percent={35} />
              <p className="hotspot-details">3 active cases, preventive measures active</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Water Sources Status">
            <div className="water-source-item">
              <div className="source-header">
                <span>Main Well - Village A</span>
                <Tag color="red">Contaminated</Tag>
              </div>
              <p>Last tested: 2 hours ago</p>
            </div>
            <div className="water-source-item">
              <div className="source-header">
                <span>Tube Well - Village B</span>
                <Tag color="orange">Warning</Tag>
              </div>
              <p>Last tested: 5 hours ago</p>
            </div>
            <div className="water-source-item">
              <div className="source-header">
                <span>Hand Pump - Village C</span>
                <Tag color="green">Safe</Tag>
              </div>
              <p>Last tested: 1 day ago</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Resource Allocation">
            <div className="resource-item">
              <span>Medical Teams Deployed</span>
              <span className="resource-count">8/12</span>
            </div>
            <div className="resource-item">
              <span>Water Testing Kits</span>
              <span className="resource-count">15/20</span>
            </div>
            <div className="resource-item">
              <span>Emergency Supplies</span>
              <span className="resource-count">75%</span>
            </div>
            <div className="resource-item">
              <span>Ambulances Available</span>
              <span className="resource-count">6/8</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// --- Main Dashboard component with role switch ---
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // not logged in (fallback)
  if (!user) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <Card>
          <Empty description="Please login to view the dashboard." />
        </Card>
      </div>
    );
  }

  // choose view by role (switch)
  switch (user.role) {
    case 'asha_worker':
      return <AshaView />;
    case 'community_user':
      return <CommunityView />;
    case 'admin':
    case 'government_body':
    default:
      return <FullDashboard />;
  }
};

export default Dashboard;
