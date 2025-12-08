// src/pages/AdminReports.tsx
/**
 * Admin Reports Page
 * Comprehensive reporting dashboard for system administrators
 * Features: User activity, system health, data analytics, audit logs
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tag,
  Empty,
  Spin,
  message,
  Modal,
  Tabs,
  Tooltip,
  Space,
  Badge,
  Progress,
  Divider,
  Form,
  Drawer,
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  BarChartOutlined,
  UserOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import adminReportsService from '../services/adminReportsService';
import './AdminReports.css';

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface UserReport {
  id: string;
  user_name: string;
  email: string;
  role: string;
  total_logins: number;
  last_login: string | null;
  actions_count: number;
  status: 'active' | 'inactive';
  created_at: string | null;
}

interface SystemHealthReport {
  metric: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  percentage?: number;
  timestamp: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  status: 'success' | 'failed';
}

interface DataReport {
  date: string;
  users_created: number;
  reports_generated: number;
  api_calls: number;
  data_points: number;
}

const AdminReports: React.FC = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  // User Reports
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // System Health
  const [systemHealth, setSystemHealth] = useState<SystemHealthReport[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('');

  // Data Analytics
  const [dataReports, setDataReports] = useState<DataReport[]>([]);

  // Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Summary Statistics
  const [summary, setSummary] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    total_actions: 0,
    total_reports: 0,
    api_health: 100,
    database_health: 100,
    system_uptime: 99.9,
  });

  // Fetch Reports on Mount or Filter Change
  useEffect(() => {
    loadAllReports();
  }, [dateRange, userRoleFilter, auditActionFilter, auditStatusFilter]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      // Load summary statistics
      const summaryData = await adminReportsService.getSummaryStats();
      setSummary(summaryData);

      // Load system health
      const healthData = await adminReportsService.getSystemHealth();
      setSystemHealth(healthData);

      // Load user reports
      const userReportsData = await adminReportsService.getUserReports({
        role: userRoleFilter || undefined,
        limit: 50,
      });
      setUserReports(userReportsData);

      // Load audit logs
      const auditLogsData = await adminReportsService.getAuditLogs({
        action_filter: auditActionFilter || undefined,
        status_filter: auditStatusFilter || undefined,
        limit: 100,
      });
      setAuditLogs(auditLogsData);

      // Load data analytics
      const days = dateRange[0] && dateRange[1] 
        ? dateRange[1].diff(dateRange[0], 'days') 
        : 30;
      
      const analyticsData = await adminReportsService.getDataAnalytics({
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        days: days,
      });
      setDataReports(analyticsData);

      message.success('Reports loaded successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load reports';
      message.error(errorMessage);
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] || '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Exported to CSV successfully');
  };

  // Export to PDF (simplified - would need a PDF library in production)
  const exportToPDF = (filename: string) => {
    message.info('PDF export would be generated using a PDF library');
  };

  // User Reports Table Columns
  const userColumns = [
    {
      title: 'User Name',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string, record: UserReport) => (
        <a onClick={() => {
          setSelectedRecord(record);
          setDrawerVisible(true);
        }}>
          {text}
        </a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors: Record<string, string> = {
          admin: 'red',
          government_body: 'blue',
          asha_worker: 'green',
          community_user: 'purple',
        };
        return <Tag color={colors[role] || 'default'}>{role.replace(/_/g, ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Total Logins',
      dataIndex: 'total_logins',
      key: 'total_logins',
      sorter: (a: UserReport, b: UserReport) => a.total_logins - b.total_logins,
    },
    {
      title: 'Actions Count',
      dataIndex: 'actions_count',
      key: 'actions_count',
      sorter: (a: UserReport, b: UserReport) => a.actions_count - b.actions_count,
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date: string | null) => date ? dayjs(date).fromNow() : 'Never',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  // Audit Logs Table Columns
  const auditColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: AuditLog, b: AuditLog) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    },
    {
      title: 'User',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color="blue">{action.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Space>
          {status === 'success' ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <AlertOutlined style={{ color: '#f5222d' }} />
          )}
          <Tag color={status === 'success' ? 'green' : 'red'}>
            {status.toUpperCase()}
          </Tag>
        </Space>
      ),
    },
  ];

  // Data Analytics Table Columns
  const dataColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: DataReport, b: DataReport) => a.date.localeCompare(b.date),
    },
    {
      title: 'Users Created',
      dataIndex: 'users_created',
      key: 'users_created',
    },
    {
      title: 'Reports Generated',
      dataIndex: 'reports_generated',
      key: 'reports_generated',
    },
    {
      title: 'API Calls',
      dataIndex: 'api_calls',
      key: 'api_calls',
      sorter: (a: DataReport, b: DataReport) => a.api_calls - b.api_calls,
    },
    {
      title: 'Data Points',
      dataIndex: 'data_points',
      key: 'data_points',
    },
  ];

  return (
    <div className="admin-reports-container">
      {/* Page Header */}
      <div className="reports-header">
        <h1>
          <BarChartOutlined /> Admin Reports & Analytics
        </h1>
        <p>Comprehensive system monitoring, user activity analysis, and audit logging</p>
      </div>

      {/* Summary Statistics */}
      <Card className="summary-card">
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="Total Users"
              value={summary.total_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="Active Users"
              value={summary.active_users}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#16a34a' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="Inactive Users"
              value={summary.inactive_users}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#dc2626' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="Total Actions"
              value={summary.total_actions}
              suffix="K"
              precision={1}
              valueStyle={{ color: '#7c3aed' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="Reports Generated"
              value={summary.total_reports}
              prefix={<FileExcelOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Statistic
              title="System Uptime"
              value={summary.system_uptime}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#06b6d4' }}
            />
          </Col>
        </Row>
      </Card>

      {/* System Health */}
      <Card className="system-health-card" title="System Health Status">
        <Row gutter={[16, 16]}>
          {systemHealth.map((item) => (
            <Col xs={12} sm={12} md={6} key={item.metric}>
              <div className="health-item">
                <div className="health-header">
                  <span className="health-metric">{item.metric}</span>
                  <Badge
                    status={
                      item.status === 'healthy' ? 'success' : item.status === 'warning' ? 'warning' : 'error'
                    }
                    text={item.status.toUpperCase()}
                  />
                </div>
                <Progress
                  percent={item.percentage || 0}
                  status={
                    item.status === 'healthy' ? 'success' : item.status === 'warning' ? 'normal' : 'exception'
                  }
                />
                <span className="health-value">{item.value.toFixed(1)}%</span>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tabs for Different Reports */}
      <Tabs
        defaultActiveKey="overview"
        onChange={(key) => setActiveTab(key)}
        className="reports-tabs"
        items={[
          {
            label: '📊 Overview',
            key: 'overview',
            children: (
              <Card>
                <Row gutter={[16, 16]} className="overview-content">
                  <Col span={24}>
                    <h3>Quick Summary</h3>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <p>
                        <strong>Total Users:</strong> {summary.total_users} | <strong>Active:</strong>{' '}
                        {summary.active_users} | <strong>Inactive:</strong> {summary.inactive_users}
                      </p>
                      <p>
                        <strong>System Status:</strong> <Badge status="success" text="All Systems Operational" />
                      </p>
                      <p>
                        <strong>Last Updated:</strong> {dayjs().format('YYYY-MM-DD HH:mm:ss')}
                      </p>
                    </Space>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            label: '👥 User Reports',
            key: 'users',
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Input
                        placeholder="Search by name or email"
                        value={userSearchText}
                        onChange={(e) => setUserSearchText(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Select
                        placeholder="Filter by Role"
                        value={userRoleFilter || undefined}
                        onChange={(value) => setUserRoleFilter(value || '')}
                        allowClear
                        style={{ width: '100%' }}
                      >
                        <Option value="admin">Admin</Option>
                        <Option value="government_body">Government Official</Option>
                        <Option value="asha_worker">ASHA Worker</Option>
                        <Option value="community_user">Community User</Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => exportToCSV(userReports, 'user-reports')}
                      >
                        Export CSV
                      </Button>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={loadAllReports}
                      >
                        Refresh
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    columns={userColumns}
                    dataSource={userReports.map((u) => ({ ...u, key: u.id }))}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1000 }}
                  />
                </Space>
              </Card>
            ),
          },
          {
            label: '📋 Audit Logs',
            key: 'audit',
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                      <Select
                        placeholder="Filter by Action"
                        value={auditActionFilter || undefined}
                        onChange={(value) => setAuditActionFilter(value || '')}
                        allowClear
                        style={{ width: '100%' }}
                      >
                        <Option value="USER_LOGIN">User Login</Option>
                        <Option value="USER_UPDATE">User Update</Option>
                        <Option value="REPORT_GENERATE">Report Generate</Option>
                        <Option value="DATA_EXPORT">Data Export</Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Select
                        placeholder="Filter by Status"
                        value={auditStatusFilter || undefined}
                        onChange={(value) => setAuditStatusFilter(value || '')}
                        allowClear
                        style={{ width: '100%' }}
                      >
                        <Option value="success">Success</Option>
                        <Option value="failed">Failed</Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => exportToCSV(auditLogs, 'audit-logs')}
                      >
                        Export CSV
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    columns={auditColumns}
                    dataSource={auditLogs.map((log) => ({ ...log, key: log.id }))}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1200 }}
                  />
                </Space>
              </Card>
            ),
          },
          {
            label: '📈 Data Analytics',
            key: 'analytics',
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <RangePicker
                        value={dateRange}
                        onChange={(range) => {
                          if (range) {
                            setDateRange([range[0], range[1]]);
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => exportToCSV(dataReports, 'data-analytics')}
                      >
                        Export CSV
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    columns={dataColumns}
                    dataSource={dataReports.map((data) => ({ ...data, key: data.date }))}
                    loading={loading}
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    scroll={{ x: 800 }}
                  />
                </Space>
              </Card>
            ),
          },
        ]}
      />

      {/* Detail Drawer */}
      <Drawer
        title="User Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedRecord && (
          <div className="user-detail-drawer">
            <Form layout="vertical">
              <Form.Item label="User Name">
                <strong>{selectedRecord.user_name}</strong>
              </Form.Item>
              <Form.Item label="Email">
                <strong>{selectedRecord.email}</strong>
              </Form.Item>
              <Form.Item label="Role">
                <Tag color="blue">{selectedRecord.role.replace(/_/g, ' ').toUpperCase()}</Tag>
              </Form.Item>
              <Form.Item label="Total Logins">
                <strong>{selectedRecord.total_logins}</strong>
              </Form.Item>
              <Form.Item label="Actions Count">
                <strong>{selectedRecord.actions_count}</strong>
              </Form.Item>
              <Form.Item label="Last Login">
                <strong>{dayjs(selectedRecord.last_login).format('YYYY-MM-DD HH:mm:ss')}</strong>
              </Form.Item>
              <Form.Item label="Status">
                <Tag color={selectedRecord.status === 'active' ? 'green' : 'red'}>
                  {selectedRecord.status.toUpperCase()}
                </Tag>
              </Form.Item>
              <Form.Item label="Created At">
                <strong>{dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}</strong>
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminReports;
