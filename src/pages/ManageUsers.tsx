// src/pages/ManageUsers.tsx
/**
 * Manage Users Page for Government Officials
 * Displays all registered user accounts across every role with management capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Row,
  Col,
  Drawer,
  Tabs,
  Statistic,
  Empty,
  Spin,
  message,
  Popconfirm,
  DatePicker,
  Pagination,
  InputNumber,
  Segmented,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UnlockOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import userManagementService, { User, UserActivityLog } from '../services/userManagementService';
import './ManageUsers.css';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface TableUser extends User {
  key: string;
}

interface UserCount {
  total_count: number;
  admin_count: number;
  government_count: number;
  asha_count: number;
  community_count: number;
}

const ManageUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // State management
  const [users, setUsers] = useState<TableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<UserCount | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState(-1);
  
  // Modals & Drawers
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [activityDrawerVisible, setActivityDrawerVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  // Check authorization
  useEffect(() => {
    if (currentUser && currentUser.role !== 'government_body') {
      message.error('You do not have permission to access this page');
    }
  }, [currentUser]);

  // Load users and counts on component mount or filter change
  useEffect(() => {
    fetchUsers();
    fetchUserCounts();
  }, [roleFilter, statusFilter, districtFilter, searchText, sortBy, sortOrder, pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    console.log('DEBUG: fetchUsers called');
    setLoading(true);
    try {
      console.log('DEBUG: Calling API with filters', {roleFilter, statusFilter, districtFilter, searchText});
      const users = await userManagementService.getAllUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        district: districtFilter || undefined,
        search: searchText || undefined,
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        sortBy,
        sortOrder,
      });
      
      const tableUsers = users.map((u) => ({ ...u, key: u.id }));
      // DEBUG: Alert if users are empty
      if (tableUsers.length === 0) {
         console.log('DEBUG: Users list is empty from API');
         // message.warning('Debug: API returned 0 users');
      } else {
         console.log(`DEBUG: API returned ${tableUsers.length} users`);
         // message.success(`Debug: Loaded ${tableUsers.length} users`);
      }
      setUsers(tableUsers);
    } catch (error: any) {
      console.error('Fetch error:', error);
      message.error(error.response?.data?.detail || 'Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const counts = await userManagementService.getUserCounts();
      console.log('DEBUG: counts', counts);
      setCounts(counts);
      setPagination((prev) => ({ ...prev, total: counts.total_count }));
      
      // DEBUG: Show warning if counts exist but users don't
      if (counts.total_count > 0 && users.length === 0 && !loading) {
          // This might trigger too early, but useful for debug
          console.warn('DEBUG: Counts > 0 but users list is empty');
      }
    } catch (error: any) {
      console.error('Failed to fetch user counts:', error);
    }
  };

  const fetchActivityLogs = async (userId: string) => {
    setActivityLoading(true);
    try {
      const logs = await userManagementService.getUserActivityLogs(userId, 0, 100);
      setActivityLogs(logs);
    } catch (error: any) {
      message.error('Failed to fetch activity logs');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleViewDetails = async (userRecord: User) => {
    setSelectedUser(userRecord);
    setEditDrawerVisible(true);
    editForm.setFieldsValue({
      full_name: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone,
      organization: userRecord.organization,
      location: userRecord.location,
      district: userRecord.district,
    });
  };

  const handleViewActivity = async (userRecord: User) => {
    setSelectedUser(userRecord);
    setActivityDrawerVisible(true);
    await fetchActivityLogs(userRecord.id);
  };

  const handleUpdateUser = async (values: any) => {
    if (!selectedUser) return;
    
    try {
      await userManagementService.updateUser(selectedUser.id, values);
      message.success('User updated successfully');
      setEditDrawerVisible(false);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleResetPassword = async (userRecord: User) => {
    try {
      setSelectedUser(userRecord);
      const result = await userManagementService.resetUserPassword(userRecord.id);
      setTempPassword(result.temp_password);
      setResetPasswordModal(true);
      message.success('Password reset successfully');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (userRecord: User) => {
    const newStatus = userRecord.status === 'active' ? 'inactive' : 'active';
    
    try {
      await userManagementService.toggleUserStatus(userRecord.id, newStatus);
      message.success(`User ${newStatus} successfully`);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userRecord: User) => {
    try {
      await userManagementService.deleteUser(userRecord.id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a: TableUser, b: TableUser) => a.full_name.localeCompare(b.full_name),
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text: string) => <a href={`mailto:${text}`}>{text}</a>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || '-',
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => (text ? new Date(text).toLocaleDateString() : '-'),
      sorter: (a: TableUser, b: TableUser) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: unknown, record: TableUser) => (
        <Space size="small" wrap>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              type="primary"
              ghost
              size="small"
            />
          </Tooltip>

          <Tooltip title="View Activity">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleViewActivity(record)}
              type="primary"
              ghost
              size="small"
            />
          </Tooltip>

          <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Popconfirm
              title={`${record.status === 'active' ? 'Deactivate' : 'Activate'} User`}
              description={`Are you sure you want to ${record.status === 'active' ? 'deactivate' : 'activate'} this user?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.status === 'active'}
                ghost
                size="small"
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip title="Reset Password">
            <Popconfirm
              title="Reset Password"
              description="Generate a new temporary password for this user?"
              onConfirm={() => handleResetPassword(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<LockOutlined />}
                type="primary"
                danger
                ghost
                size="small"
              />
            </Popconfirm>
          </Tooltip>

          {record.role !== 'admin' && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                onConfirm={() => handleDeleteUser(record)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  ghost
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="manage-users-container">
      {/* Header */}
      <Card className="manage-users-header">
        <Row gutter={16}>
          <Col span={24}>
            <h1 style={{ marginBottom: 16 }}>👥 Manage Users</h1>
            <p style={{ color: '#666' }}>
              View, edit, and manage all user accounts across the system
            </p>
          </Col>
        </Row>

        {/* Statistics */}
        {counts && (
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic title="Total Users" value={counts.total_count} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Admins" value={counts.admin_count} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Government Officials" value={counts.government_count} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="ASHA Workers" value={counts.asha_count} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Community Users" value={counts.community_count} />
            </Col>
          </Row>
        )}
      </Card>

      {/* Filters */}
      <Card className="manage-users-filters">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search by name or email"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by Role"
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value);
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="admin">Admin</Option>
              <Option value="government_body">Government Official</Option>
              <Option value="asha_worker">ASHA Worker</Option>
              <Option value="community_user">Community User</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="deleted">Deleted</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Filter by District"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('');
                setRoleFilter('');
                setStatusFilter('');
                setDistrictFilter('');
                setPagination({ ...pagination, current: 1 });
              }}
              block
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card className="manage-users-table">
        <Spin spinning={loading}>
          {users.length === 0 ? (
            <Empty description="No users found" />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                scroll={{ x: 1500 }}
                pagination={false}
                className="users-table"
              />
              
              <Row justify="end" style={{ marginTop: 16 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page) =>
                    setPagination({ ...pagination, current: page })
                  }
                  onShowSizeChange={(current, size) =>
                    setPagination({ ...pagination, current: 1, pageSize: size })
                  }
                  showSizeChanger
                  showTotal={(total) => `Total ${total} users`}
                />
              </Row>
            </>
          )}
        </Spin>
      </Card>

      {/* Edit User Drawer */}
      <Drawer
        title="Edit User Details"
        placement="right"
        onClose={() => setEditDrawerVisible(false)}
        open={editDrawerVisible}
        width={500}
      >
        {selectedUser && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateUser}
          >
            <Form.Item label="User ID" className="user-id-field">
              <Input value={selectedUser.id} disabled />
            </Form.Item>

            <Form.Item label="Role" className="role-field">
              <Input
                value={selectedUser.role.replace(/_/g, ' ').toUpperCase()}
                disabled
              />
            </Form.Item>

            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[{ required: true, message: 'Please enter full name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input />
            </Form.Item>

            <Form.Item label="Organization" name="organization">
              <Input />
            </Form.Item>

            <Form.Item label="Location" name="location">
              <Input />
            </Form.Item>

            <Form.Item label="District" name="district">
              <Input />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* Activity Logs Drawer */}
      <Drawer
        title="User Activity Logs"
        placement="right"
        onClose={() => setActivityDrawerVisible(false)}
        open={activityDrawerVisible}
        width={600}
      >
        {selectedUser && (
          <Spin spinning={activityLoading}>
            {activityLogs.length === 0 ? (
              <Empty description="No activity logs" />
            ) : (
              <div className="activity-logs">
                {activityLogs.map((log, index) => (
                  <Card key={index} className="activity-log-item" size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={24}>
                        <strong>{log.action}</strong>
                        <div style={{ color: '#999', fontSize: '12px' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </Col>
                    </Row>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={24}>
                          <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </Col>
                      </Row>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Spin>
        )}
      </Drawer>

      {/* Reset Password Modal */}
      <Modal
        title="Password Reset"
        open={resetPasswordModal}
        onOk={() => setResetPasswordModal(false)}
        onCancel={() => setResetPasswordModal(false)}
        footer={[
          <Button key="copy" type="primary" onClick={() => copyToClipboard(tempPassword)}>
            Copy Password
          </Button>,
          <Button key="close" onClick={() => setResetPasswordModal(false)}>
            Close
          </Button>,
        ]}
      >
        <div>
          <p>Temporary password for user:</p>
          <Input
            value={tempPassword}
            readOnly
            addonAfter={
              <Button
                type="text"
                onClick={() => copyToClipboard(tempPassword)}
                size="small"
              >
                Copy
              </Button>
            }
          />
          <p style={{ marginTop: 16, color: '#ff7875' }}>
            ⚠️ User must change this password on first login. This password expires in 24 hours.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsers;
