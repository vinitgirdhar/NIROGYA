// src/pages/ManageUsers.tsx
/**
 * Manage Users Page for Government Officials
 * Displays all registered user accounts across every role with management capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  Drawer,
  Empty,
  Spin,
  message,
  Pagination,
} from 'antd';
import {
  DeleteOutlined,
  LockOutlined,
  EyeOutlined,
  ReloadOutlined,
  UnlockOutlined,
  SearchOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import userManagementService, { User, UserActivityLog } from '../services/userManagementService';
import './ManageUsers.css';

const { Option } = Select;

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    action: () => void;
    danger?: boolean;
  }>({ visible: false, title: '', description: '', action: () => {} });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check authorization
  useEffect(() => {
    if (currentUser && !['government_body', 'admin'].includes(currentUser.role)) {
      message.error('You do not have permission to access this page');
    }
  }, [currentUser]);

  // Close dropdown on click outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

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
      title: 'User Profile',
      key: 'profile',
      width: 280,
      render: (_: unknown, record: TableUser) => (
        <div className="user-profile">
          <div className={`user-avatar ${record.role}`}>
            {getInitials(record.full_name)}
          </div>
          <div className="user-info">
            <span className="user-name">{record.full_name}</span>
            <span className="user-email">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 180,
      render: (role: string) => (
        <div className="role-badge">
          {getRoleIcon(role)}
          {formatRole(role)}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <div className={`status-pill status-${status}`}>
          <span className="status-dot"></span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      ),
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: 'Last Active',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (text: string) => (text ? formatDate(text) : 'Never'),
      sorter: (a: TableUser, b: TableUser) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: TableUser) => (
        <div className="actions-dropdown-container" ref={openDropdownId === record.id ? dropdownRef : null}>
          <button
            className="kebab-menu-btn"
            onClick={() => setOpenDropdownId(openDropdownId === record.id ? null : record.id)}
            aria-label="Actions menu"
            aria-expanded={openDropdownId === record.id}
            aria-haspopup="true"
          >
            <MoreOutlined />
          </button>
          
          {openDropdownId === record.id && (
            <div className="actions-dropdown" role="menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  handleViewDetails(record);
                  setOpenDropdownId(null);
                }}
                role="menuitem"
                tabIndex={0}
              >
                <EyeOutlined />
                <span>View Details</span>
              </button>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  handleViewDetails(record);
                  setOpenDropdownId(null);
                }}
                role="menuitem"
                tabIndex={0}
              >
                <EditOutlined />
                <span>Edit User</span>
              </button>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  handleViewActivity(record);
                  setOpenDropdownId(null);
                }}
                role="menuitem"
                tabIndex={0}
              >
                <ClockCircleOutlined />
                <span>View Activity</span>
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  setOpenDropdownId(null);
                  setConfirmModal({
                    visible: true,
                    title: `${record.status === 'active' ? 'Deactivate' : 'Activate'} User`,
                    description: `Are you sure you want to ${record.status === 'active' ? 'deactivate' : 'activate'} this user?`,
                    action: () => handleToggleStatus(record),
                  });
                }}
                role="menuitem"
                tabIndex={0}
              >
                {record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                <span>{record.status === 'active' ? 'Deactivate' : 'Activate'}</span>
              </button>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  setOpenDropdownId(null);
                  setConfirmModal({
                    visible: true,
                    title: 'Reset Password',
                    description: 'Generate a new temporary password for this user?',
                    action: () => handleResetPassword(record),
                  });
                }}
                role="menuitem"
                tabIndex={0}
              >
                <LockOutlined />
                <span>Reset Password</span>
              </button>
              
              {record.role !== 'admin' && (
                <>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item danger"
                    onClick={() => {
                      setOpenDropdownId(null);
                      setConfirmModal({
                        visible: true,
                        title: 'Delete User',
                        description: 'Are you sure you want to delete this user? This action cannot be undone.',
                        action: () => handleDeleteUser(record),
                        danger: true,
                      });
                    }}
                    role="menuitem"
                    tabIndex={0}
                  >
                    <DeleteOutlined />
                    <span>Delete User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      government_body: 'Government Official',
      asha_worker: 'ASHA Worker',
      community_user: 'Community User',
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      admin: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      government_body: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      ),
      asha_worker: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      ),
      community_user: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    };
    return icons[role] || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="manage-users-container">
      {/* Header Card */}
      <div className="header-card">
        <div className="header-title">
          <h1>Manage Users</h1>
          <p>View, edit, and manage all user accounts across the system</p>
        </div>

        {/* Stats Row */}
        {counts && (
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{counts.total_count.toLocaleString()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Admins</div>
              <div className="stat-value">{counts.admin_count}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Government Officials</div>
              <div className="stat-value">{counts.government_count}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">ASHA Workers</div>
              <div className="stat-value">{counts.asha_count}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Community Users</div>
              <div className="stat-value">{counts.community_count.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="search-input-wrapper">
          <SearchOutlined className="search-icon" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPagination({ ...pagination, current: 1 });
            }}
            allowClear
          />
        </div>

        <Select
          placeholder="All Roles"
          value={roleFilter || undefined}
          onChange={(value) => {
            setRoleFilter(value || '');
            setPagination({ ...pagination, current: 1 });
          }}
          allowClear
        >
          <Option value="admin">Admin</Option>
          <Option value="government_body">Government Official</Option>
          <Option value="asha_worker">ASHA Worker</Option>
          <Option value="community_user">Community User</Option>
        </Select>

        <Select
          placeholder="Status: Any"
          value={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value || '');
            setPagination({ ...pagination, current: 1 });
          }}
          allowClear
        >
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
          <Option value="deleted">Deleted</Option>
        </Select>

        <Input
          placeholder="Filter by District"
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setPagination({ ...pagination, current: 1 });
          }}
          allowClear
        />

        <button
          className="reset-btn"
          onClick={() => {
            setSearchText('');
            setRoleFilter('');
            setStatusFilter('');
            setDistrictFilter('');
            setPagination({ ...pagination, current: 1 });
          }}
        >
          <ReloadOutlined />
          Reset
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <Spin spinning={loading} className="loading-state">
          {users.length === 0 && !loading ? (
            <div className="empty-state">
              <Empty description="No users found" />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={users}
                loading={false}
                scroll={{ x: 1200 }}
                pagination={false}
              />

              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} users
                </div>
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
                  size="small"
                />
              </div>
            </>
          )}
        </Spin>
      </div>

      {/* Edit User Drawer */}
      <Drawer
        title={
          <div>
            <div>Edit User Details</div>
            <div className="drawer-subtitle">Update account information</div>
          </div>
        }
        placement="right"
        onClose={() => setEditDrawerVisible(false)}
        open={editDrawerVisible}
        width={420}
        className="user-drawer"
        footer={
          <div className="drawer-footer">
            <button className="cancel-btn" onClick={() => setEditDrawerVisible(false)}>
              Cancel
            </button>
            <button className="save-btn" onClick={() => editForm.submit()}>
              Save Changes
            </button>
          </div>
        }
      >
        {selectedUser && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateUser}
          >
            <Form.Item label="User ID">
              <Input value={selectedUser.id} disabled />
            </Form.Item>

            <Form.Item label="Role">
              <Input value={formatRole(selectedUser.role)} disabled />
            </Form.Item>

            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[{ required: true, message: 'Please enter full name' }]}
            >
              <Input placeholder="e.g. John Doe" />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input placeholder="john@company.com" />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input placeholder="+91 XXXXX XXXXX" />
            </Form.Item>

            <Form.Item label="Organization" name="organization">
              <Input placeholder="Organization name" />
            </Form.Item>

            <Form.Item label="Location" name="location">
              <Input placeholder="City, State" />
            </Form.Item>

            <Form.Item label="District" name="district">
              <Input placeholder="District name" />
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* Activity Logs Drawer */}
      <Drawer
        title={
          <div>
            <div>User Activity Logs</div>
            <div className="drawer-subtitle">Recent account activity</div>
          </div>
        }
        placement="right"
        onClose={() => setActivityDrawerVisible(false)}
        open={activityDrawerVisible}
        width={480}
        className="user-drawer"
      >
        {selectedUser && (
          <Spin spinning={activityLoading}>
            {activityLogs.length === 0 ? (
              <Empty description="No activity logs" />
            ) : (
              <div className="activity-timeline">
                <div className="timeline-header">Recent Activity</div>
                {activityLogs.map((log, index) => (
                  <div key={index} className="timeline-item">
                    <span className="timeline-dot"></span>
                    <div className="timeline-content">
                      <p>{log.action}</p>
                      <div className="timeline-date">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <pre className="timeline-changes">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
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
        className="password-modal"
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
          <div className="password-warning">
            <span>⚠️</span>
            <span>User must change this password on first login. This password expires in 24 hours.</span>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title={confirmModal.title}
        open={confirmModal.visible}
        onOk={() => {
          confirmModal.action();
          setConfirmModal({ ...confirmModal, visible: false });
        }}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        okText="Yes"
        cancelText="No"
        okButtonProps={{ danger: confirmModal.danger }}
        className="confirm-modal"
      >
        <p>{confirmModal.description}</p>
      </Modal>
    </div>
  );
};

export default ManageUsers;
