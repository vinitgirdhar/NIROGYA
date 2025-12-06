// src/pages/Register.tsx
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  message,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

const { Title, Text } = Typography;

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization?: string;
  location?: string;
  phone?: string;
}

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormData) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const success = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        // 🔐 ROLE IS FIXED HERE – user cannot pick it
        role: 'community_user',
        organization: values.organization,
        location: values.location,
        phone: values.phone,
      });

      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Animated Background */}
      <div className="register-background" />
      <div className="register-background-overlay" />

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element element-1">👤</div>
        <div className="floating-element element-2">🏥</div>
        <div className="floating-element element-3">🌐</div>
        <div className="floating-element element-4">💧</div>
        <div className="floating-element element-5">🏘</div>
        <div className="floating-element element-6">🔐</div>
      </div>

      <div className="register-container">
        <Card className="register-card" bordered={false}>
          {/* Back Button */}
          <Link to="/login" className="back-button">
            <ArrowLeftOutlined /> Back to Login
          </Link>

          <div className="register-header">
            {/* Logo with Animation */}
            <div className="logo-container">
              <div className="logo-icon">🌊</div>
              <div className="logo-waves">
                <div className="wave wave-1"></div>
                <div className="wave wave-2"></div>
                <div className="wave wave-3"></div>
              </div>
            </div>

            <Title level={2} className="register-title">
              Join Paani Care
            </Title>
            <Text className="register-subtitle">
              Create your account to start protecting communities
            </Text>
          </div>

          <Form
            form={form}
            name="register"
            size="large"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            className="register-form"
            scrollToFirstError
          >
            <Form.Item
              label="Full Name"
              name="name"
              rules={[
                { required: true, message: 'Please input your full name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="Enter your full name"
                className="register-input"
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="input-icon" />}
                placeholder="Enter your email"
                className="register-input"
              />
            </Form.Item>

            {/* No Role Field here – backend forces community_user */}

            <div className="password-row">
              <Form.Item
                label="Password"
                name="password"
                className="password-item"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters!',
                  },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message:
                      'Password must contain uppercase, lowercase and number!',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Enter password"
                  className="register-input"
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                className="password-item"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('Passwords do not match!'),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Confirm password"
                  className="register-input"
                />
              </Form.Item>
            </div>

            <Form.Item label="Organization (Optional)" name="organization">
              <Input
                prefix={<TeamOutlined className="input-icon" />}
                placeholder="Enter your organization"
                className="register-input"
              />
            </Form.Item>

            <div className="details-row">
              <Form.Item
                label="Location (Optional)"
                name="location"
                className="details-item"
              >
                <Input
                  prefix={<HomeOutlined className="input-icon" />}
                  placeholder="City, State"
                  className="register-input"
                />
              </Form.Item>

              <Form.Item
                label="Phone (Optional)"
                name="phone"
                className="details-item"
              >
                <Input
                  prefix={<PhoneOutlined className="input-icon" />}
                  placeholder="+91-XXXXXXXXXX"
                  className="register-input"
                />
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="register-button"
                block
                size="large"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          {/* Social Registration (can later be disabled or hooked to OAuth) */}
          <div className="social-section">
            <Text className="social-text">Or register with</Text>
            <Space
              direction="horizontal"
              size="middle"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Button className="social-button google" icon="G">
                Google
              </Button>
              <Button className="social-button facebook" icon="f">
                Facebook
              </Button>
              <Button className="social-button github" icon="⚡">
                GitHub
              </Button>
            </Space>
          </div>

          <div className="register-footer">
            <Text className="login-text">
              Already have an account?
              <Link to="/login" className="login-link">
                Sign in here
              </Link>
            </Text>

            <div className="footer-links">
              <Link to="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <span className="separator">•</span>
              <Link to="/terms" className="footer-link">
                Terms of Service
              </Link>
              <span className="separator">•</span>
              <Link to="/help" className="footer-link">
                Help Center
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;