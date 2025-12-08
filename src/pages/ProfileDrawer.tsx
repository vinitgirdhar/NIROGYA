import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Avatar,
  Button,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Upload,
  Modal,
  Tabs,
  Statistic,
  Badge,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
  CameraOutlined,
  LockOutlined,
  BellOutlined,
  HistoryOutlined,
  TeamOutlined,
  HeartOutlined,
  AlertOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SaveOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import './ProfileDrawer.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        bloodGroup: user.bloodGroup,
        occupation: user.occupation,
      });
      setAvatarUrl(user.avatar || '');
    }
  }, [user, form]);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      console.log('Updated profile:', values);
      message.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      message.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      console.log('Password change:', values);
      message.success('Password changed successfully!');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng =
        file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      return false;
    },
    onChange: (info) => {
      const file = info.file.originFileObj || info.file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setAvatarUrl(imageUrl);
        message.success('Profile picture updated!');
      };
      reader.readAsDataURL(file as Blob);
    },
    customRequest: ({ onSuccess }) => {
      setTimeout(() => {
        if (onSuccess) onSuccess('ok');
      }, 0);
    },
  };

  const uploadButton = (
    <div className="avatar-upload-button">
      <CameraOutlined />
    </div>
  );

  const userStats = {
    reportsSubmitted: 12,
    alertsReceived: 8,
    communityHelped: 45,
    activeAlerts: 3,
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <Avatar size={40} icon={<UserOutlined />} src={avatarUrl} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {user?.name || 'User Profile'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {user?.role?.replace('_', ' ').toUpperCase() ||
                  'COMMUNITY USER'}
              </div>
            </div>
          </Space>
        }
        placement="right"
        width={720}
        onClose={onClose}
        open={open}
        closeIcon={<CloseOutlined />}
        className="profile-drawer"
      >
        {/* Profile Header */}
        <div className="drawer-profile-header">
          <Badge
            count={
              <Upload {...uploadProps}>
                {uploadButton}
              </Upload>
            }
            offset={[-10, 90]}
          >
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={avatarUrl}
              className="drawer-avatar"
            />
          </Badge>

          <Space
            className="drawer-actions"
            size="middle"
            style={{ marginTop: 16 }}
          >
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
            <Button
              icon={<LockOutlined />}
              onClick={() => setIsPasswordModalVisible(true)}
            >
              Change Password
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={[12, 12]} style={{ marginTop: 24, marginBottom: 24 }}>
          <Col span={12}>
            <Card className="drawer-stat-card">
              <Statistic
                title="Reports"
                value={userStats.reportsSubmitted}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="drawer-stat-card">
              <Statistic
                title="Alerts"
                value={userStats.alertsReceived}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="drawer-stat-card">
              <Statistic
                title="Helped"
                value={userStats.communityHelped}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="drawer-stat-card">
              <Statistic
                title="Active"
                value={userStats.activeAlerts}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Tabbed Content */}
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Profile Details
              </span>
            }
            key="1"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              disabled={!editMode}
              requiredMark={false}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Full Name"
                    name="name"
                    rules={[
                      { required: true, message: 'Please enter your name' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Enter your full name"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="Enter your email"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Phone Number" name="phone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Enter your phone number"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Blood Group" name="bloodGroup">
                    <Select
                      placeholder="Select your blood group"
                      suffixIcon={<MedicineBoxOutlined />}
                      allowClear
                    >
                      <Select.Option value="A+">A+</Select.Option>
                      <Select.Option value="A-">A-</Select.Option>
                      <Select.Option value="B+">B+</Select.Option>
                      <Select.Option value="B-">B-</Select.Option>
                      <Select.Option value="AB+">AB+</Select.Option>
                      <Select.Option value="AB-">AB-</Select.Option>
                      <Select.Option value="O+">O+</Select.Option>
                      <Select.Option value="O-">O-</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Occupation" name="occupation">
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="Enter your occupation"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Address" name="address">
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Enter your address"
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Bio" name="bio">
                    <Input.TextArea
                      placeholder="Tell us about yourself"
                      rows={4}
                      showCount
                      maxLength={200}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {editMode && (
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    block
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              )}
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Activity
              </span>
            }
            key="2"
          >
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Paragraph type="secondary">No recent activity</Paragraph>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BellOutlined />
                Notifications
              </span>
            }
            key="3"
          >
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Paragraph type="secondary">No new notifications</Paragraph>
            </div>
          </TabPane>
        </Tabs>
      </Drawer>

      {/* Change Password Modal */}
      <Modal
        title={
          <span>
            <LockOutlined /> Change Password
          </span>
        }
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          requiredMark={false}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: 'Please enter your current password' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProfileDrawer;
