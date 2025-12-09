import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Typography,
  Badge,
  Statistic,
  Row,
  Col,
  message,
  Tabs,
  Avatar,
  Tooltip,
  Empty
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './ComplainsManagment.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface StoredComplaint {
  id: number;
  name: string;
  role: string;
  contact: string;
  district: string;
  category: string;
  title: string;
  description: string;
  urgency: string;
  status: 'Open' | 'In Review' | 'Resolved';
  createdAt: string;
  source: 'form';
  replies?: Reply[];
}

interface Reply {
  id: number;
  message: string;
  respondedBy: string;
  respondedAt: string;
  role: string;
}

const ComplaintsManagement: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<StoredComplaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<StoredComplaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<StoredComplaint | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load complaints from localStorage
  const loadComplaints = () => {
    const stored = localStorage.getItem('communityComplaints');
    if (stored) {
      const parsed = JSON.parse(stored);
      setComplaints(parsed);
      setFilteredComplaints(parsed);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...complaints];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(c => c.urgency === filterUrgency);
    }
    if (filterDistrict !== 'all') {
      filtered = filtered.filter(c => c.district === filterDistrict);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term)
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, filterStatus, filterUrgency, filterDistrict, searchTerm]);

  // Get unique districts
  const districts = Array.from(new Set(complaints.map(c => c.district)));

  // Statistics
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'Open').length,
    inReview: complaints.filter(c => c.status === 'In Review').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    highUrgency: complaints.filter(c => c.urgency === 'High').length
  };

  // Handle reply submission
  const handleReplySubmit = () => {
    if (!selectedComplaint || !replyText.trim()) {
      message.error('Please enter a reply message');
      return;
    }

    const reply: Reply = {
      id: Date.now(),
      message: replyText,
      respondedBy: user?.name || 'Government Official',
      respondedAt: new Date().toISOString(),
      role: user?.role || 'government_body'
    };

    const updatedComplaints = complaints.map(c => {
      if (c.id === selectedComplaint.id) {
        return {
          ...c,
          status: (newStatus || c.status) as 'Open' | 'In Review' | 'Resolved',
          replies: [...(c.replies || []), reply]
        };
      }
      return c;
    });

    localStorage.setItem('communityComplaints', JSON.stringify(updatedComplaints));
    setComplaints(updatedComplaints);
    setReplyModalVisible(false);
    setReplyText('');
    setNewStatus('');
    setSelectedComplaint(null);
    message.success('Reply sent successfully!');
  };

  // Update status only
  const handleStatusChange = (complaintId: number, status: string) => {
    const updatedComplaints = complaints.map(c => {
      if (c.id === complaintId) {
        return { ...c, status: status as 'Open' | 'In Review' | 'Resolved' };
      }
      return c;
    });
    localStorage.setItem('communityComplaints', JSON.stringify(updatedComplaints));
    setComplaints(updatedComplaints);
    message.success('Status updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'orange';
      case 'In Review': return 'blue';
      case 'Resolved': return 'green';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'red';
      case 'Normal': return 'gold';
      case 'Low': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Complaint',
      key: 'complaint',
      render: (record: StoredComplaint) => (
        <div className="complaint-cell">
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" className="complaint-desc">
            {record.description.slice(0, 80)}{record.description.length > 80 ? '...' : ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'Submitted By',
      key: 'submitter',
      render: (record: StoredComplaint) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.name}</Text>
          </Space>
          <Tag color="purple">{record.role}</Tag>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="cyan">{cat}</Tag>
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      render: (district: string) => (
        <Space>
          <EnvironmentOutlined />
          {district}
        </Space>
      )
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency: string) => (
        <Tag color={getUrgencyColor(urgency)}>{urgency}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: StoredComplaint) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record.id, val)}
          style={{ width: 120 }}
          size="small"
        >
          <Option value="Open">
            <Badge status="warning" text="Open" />
          </Option>
          <Option value="In Review">
            <Badge status="processing" text="In Review" />
          </Option>
          <Option value="Resolved">
            <Badge status="success" text="Resolved" />
          </Option>
        </Select>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <Space>
            <CalendarOutlined />
            {new Date(date).toLocaleDateString()}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: StoredComplaint) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => {
              setSelectedComplaint(record);
              setNewStatus(record.status);
              setReplyModalVisible(true);
            }}
          >
            Reply
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="complaints-management">
      <div className="page-header">
        <div>
          <Title level={2}>Complaints Management</Title>
          <Text type="secondary">
            View and respond to complaints from ASHA workers and community members
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadComplaints}>
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="stats-row">
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card">
            <Statistic title="Total" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card open">
            <Statistic
              title="Open"
              value={stats.open}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card review">
            <Statistic
              title="In Review"
              value={stats.inReview}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card resolved">
            <Statistic
              title="Resolved"
              value={stats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card className="stat-card urgent">
            <Statistic
              title="High Urgency"
              value={stats.highUrgency}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="filter-card">
        <Space wrap size="middle">
          <FilterOutlined />
          <Input.Search
            placeholder="Search complaints..."
            allowClear
            style={{ width: 250 }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            placeholder="Status"
            style={{ width: 140 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="all">All Status</Option>
            <Option value="Open">Open</Option>
            <Option value="In Review">In Review</Option>
            <Option value="Resolved">Resolved</Option>
          </Select>
          <Select
            placeholder="Urgency"
            style={{ width: 140 }}
            value={filterUrgency}
            onChange={setFilterUrgency}
          >
            <Option value="all">All Urgency</Option>
            <Option value="High">High</Option>
            <Option value="Normal">Normal</Option>
            <Option value="Low">Low</Option>
          </Select>
          <Select
            placeholder="District"
            style={{ width: 180 }}
            value={filterDistrict}
            onChange={setFilterDistrict}
          >
            <Option value="all">All Districts</Option>
            {districts.map(d => (
              <Option key={d} value={d}>{d}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Complaints Table */}
      <Card className="complaints-table-card">
        {filteredComplaints.length === 0 ? (
          <Empty
            description="No complaints found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={filteredComplaints}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Reply Modal */}
      <Modal
        title={
          <Space>
            <MessageOutlined />
            Reply to Complaint
          </Space>
        }
        open={replyModalVisible}
        onCancel={() => {
          setReplyModalVisible(false);
          setSelectedComplaint(null);
          setReplyText('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setReplyModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleReplySubmit}
          >
            Send Reply
          </Button>
        ]}
        width={700}
      >
        {selectedComplaint && (
          <div className="reply-modal-content">
            <Card className="complaint-details" size="small">
              <Title level={5}>{selectedComplaint.title}</Title>
              <Paragraph>{selectedComplaint.description}</Paragraph>
              <Space wrap>
                <Tag color="purple">{selectedComplaint.role}</Tag>
                <Tag color="cyan">{selectedComplaint.category}</Tag>
                <Tag color={getUrgencyColor(selectedComplaint.urgency)}>
                  {selectedComplaint.urgency} Urgency
                </Tag>
              </Space>
              <div className="complaint-meta">
                <Text type="secondary">
                  <UserOutlined /> {selectedComplaint.name} • 
                  <EnvironmentOutlined /> {selectedComplaint.district} • 
                  <CalendarOutlined /> {new Date(selectedComplaint.createdAt).toLocaleString()}
                </Text>
              </div>
            </Card>

            {/* Previous Replies */}
            {selectedComplaint.replies && selectedComplaint.replies.length > 0 && (
              <div className="previous-replies">
                <Title level={5}>Previous Replies</Title>
                {selectedComplaint.replies.map(reply => (
                  <Card key={reply.id} size="small" className="reply-card">
                    <Text>{reply.message}</Text>
                    <div className="reply-meta">
                      <Text type="secondary">
                        {reply.respondedBy} • {new Date(reply.respondedAt).toLocaleString()}
                      </Text>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="reply-form">
              <Title level={5}>Your Response</Title>
              <Select
                placeholder="Update Status"
                style={{ width: '100%', marginBottom: 12 }}
                value={newStatus}
                onChange={setNewStatus}
              >
                <Option value="Open">Open</Option>
                <Option value="In Review">In Review</Option>
                <Option value="Resolved">Resolved</Option>
              </Select>
              <TextArea
                rows={4}
                placeholder="Type your response to the complaint..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintsManagement;