// src/pages/GovernmentManagement.tsx
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Space,
  Tag,
  Tooltip,
  Modal,
  App,
} from "antd";
import {
  UserAddOutlined,
  TeamOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import "./GovernmentManagement.css";

const { Title, Text } = Typography;
const { Option } = Select;

// API BASE URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

interface AshaFormValues {
  full_name: string;
  district: string;
  location: string;
  phone?: string;
}

interface GovFormValues {
  full_name: string;
  email: string;
  department?: string;
  phone?: string;
}

interface CreatedCredentials {
  full_name: string;
  email: string;
  role: string;
  temp_password: string;
}

// District + Locations
const districts = ["Kamrup Metro", "Dibrugarh", "Cachar", "Jorhat", "Sonitpur"];

const districtLocations: Record<string, string[]> = {
  "Kamrup Metro": ["Guwahati City", "Beltola", "Khanapara"],
  Dibrugarh: ["Dibrugarh Town", "Chabua", "Moran"],
  Cachar: ["Silchar", "Udharbond", "Srikona"],
  Jorhat: ["Jorhat Town", "Teok", "Titabar"],
  Sonitpur: ["Tezpur", "Dhekiajuli", "Balipara"],
};

const GovernmentManagement: React.FC = () => {
  const { message: messageApi } = App.useApp(); // Use App context for message
  const [ashaForm] = Form.useForm<AshaFormValues>();
  const [govForm] = Form.useForm<GovFormValues>();
  const [selectedDistrict, setSelectedDistrict] = useState<string>();
  const [ashaLoading, setAshaLoading] = useState(false);
  const [govLoading, setGovLoading] = useState(false);

  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const { authHeaders } = useAuth();

  // Clipboard helper
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success(`${label} copied`);
    } catch {
      messageApi.error("Failed to copy");
    }
  };

  // ------------------------------
  // Create ASHA Worker
  // ------------------------------
  const handleCreateAsha = async (values: AshaFormValues) => {
    setAshaLoading(true);

    try {
      const headers = authHeaders();
      const res = await fetch(
        `${API_BASE}/api/auth/admin/create-asha-worker`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json", // Add Content-Type
          },
          body: JSON.stringify({
            full_name: values.full_name,
            district: values.district,
            location: values.location,
            phone: values.phone || undefined,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();

      setCredentials({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        temp_password: data.temp_password,
      });

      setShowModal(true);
      ashaForm.resetFields();
      messageApi.success("ASHA worker account created");
    } catch (err: any) {
      console.error("Create ASHA error:", err);
      messageApi.error(err.message || "Error creating ASHA worker");
    } finally {
      setAshaLoading(false);
    }
  };

  // ------------------------------
  // Create Government User
  // ------------------------------
  const handleCreateGovernment = async (values: GovFormValues) => {
    setGovLoading(true);

    try {
      const headers = authHeaders();
      const res = await fetch(
        `${API_BASE}/api/auth/admin/create-government-user`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json", // Add Content-Type
          },
          body: JSON.stringify({
            full_name: values.full_name,
            email: values.email,
            department: values.department || undefined,
            phone: values.phone || undefined,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();

      setCredentials({
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        temp_password: data.temp_password,
      });

      setShowModal(true);
      govForm.resetFields();
      messageApi.success("Government user created");
    } catch (err: any) {
      console.error("Create Government user error:", err);
      messageApi.error(err.message || "Error creating government user");
    } finally {
      setGovLoading(false);
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="gov-page-wrapper">
      <div className="gov-header-pill">
        <SafetyCertificateOutlined />
        <span>Secure Account Provisioning</span>
      </div>

      <Title level={2} className="gov-title">
        Government Account Control Center
      </Title>
      <Text className="gov-subtitle">
        Create ASHA worker and government accounts with auto-generated emails &
        secure temporary passwords.
      </Text>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {/* ASHA Worker */}
        <Col xs={24} lg={12}>
          <Card
            className="gov-card asha-card"
            title={
              <Space>
                <UserAddOutlined />
                <span>Create ASHA Worker</span>
              </Space>
            }
            extra={<Tag color="blue-inverse">Field Deployment</Tag>}
          >
            <Form layout="vertical" form={ashaForm} onFinish={handleCreateAsha}>
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true }]}
              >
                <Input prefix={<TeamOutlined />} placeholder="Enter full name" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="District"
                    name="district"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select District"
                      onChange={(value) => {
                        setSelectedDistrict(value);
                        ashaForm.setFieldsValue({ location: undefined });
                      }}
                    >
                      {districts.map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Location"
                    name="location"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select Location"
                      disabled={!selectedDistrict}
                    >
                      {(districtLocations[selectedDistrict ?? ""] || []).map(
                        (loc) => (
                          <Option key={loc} value={loc}>
                            {loc}
                          </Option>
                        )
                      )}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="phone" label="Phone (optional)">
                <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={ashaLoading}
                block
                icon={<UserAddOutlined />}
                size="large"
              >
                {ashaLoading ? "Creating..." : "Create ASHA Account"}
              </Button>

              <div className="hint-text">
                Auto Email Format: <code>ashaworker@nirogya.gov.in</code>
              </div>
            </Form>
          </Card>
        </Col>

        {/* GOV USER */}
        <Col xs={24} lg={12}>
          <Card
            className="gov-card gov-user-card"
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>Create Government User</span>
              </Space>
            }
            extra={<Tag color="green-inverse">Control Access</Tag>}
          >
            <Form form={govForm} layout="vertical" onFinish={handleCreateGovernment}>
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true }]}
              >
                <Input prefix={<UserAddOutlined />} placeholder="Enter full name" />
              </Form.Item>

              <Form.Item
                label="Official Email"
                name="email"
                rules={[
                  { required: true },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="officer@department.gov.in"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="department" label="Department (optional)">
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Health / Water / etc."
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="phone" label="Phone (optional)">
                    <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                loading={govLoading}
                size="large"
                block
                icon={<SafetyCertificateOutlined />}
              >
                {govLoading ? "Creating..." : "Create Government Account"}
              </Button>

              <div className="hint-text">
                Only Admin can create new government accounts.
              </div>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Modal */}
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        title="Account Created Successfully"
      >
        {credentials && (
          <>
            <div className="credentials-row">
              <Text strong>Name:</Text> <Text>{credentials.full_name}</Text>
            </div>

            <div className="credentials-row">
              <Text strong>Role:</Text>
              <Tag color="blue">{credentials.role}</Tag>
            </div>

            <div className="credentials-row">
              <Text strong>Email:</Text>
              <Space>
                <code>{credentials.email}</code>
                <Tooltip title="Copy email">
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() =>
                      copyToClipboard(credentials.email, "Email")
                    }
                  />
                </Tooltip>
              </Space>
            </div>

            <div className="credentials-row">
              <Text strong>Password:</Text>
              <Space>
                <code>{credentials.temp_password}</code>
                <Tooltip title="Copy password">
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() =>
                      copyToClipboard(
                        credentials.temp_password,
                        "Temporary password"
                      )
                    }
                  />
                </Tooltip>
              </Space>
            </div>

            <div className="credentials-hint">
              Give these credentials to the user securely.  
              They should log in & change password immediately.
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default GovernmentManagement;