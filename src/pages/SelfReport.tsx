import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Modal,
  message,
} from "antd";
import {
  AlertOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { postReport } from "../api/report";
import "./SelfReport.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const symptomsList = [
  "Diarrhea",
  "Vomiting",
  "Nausea",
  "Fever",
  "Abdominal Pain",
  "Dehydration",
  "Jaundice",
  "Fatigue",
  "Headache",
  "Blood in stool",
];

const SelfReport: React.FC = () => {
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Build lightweight citizen payload
  const buildPayload = (values: any) => {
    const patient = {
      patientName: values.patientName || "Self-reported",
      age: values.age ? Number(values.age) : null,
      gender: values.gender || null,
      location: values.location,
      contactNumber: values.contactNumber || null,
      symptoms: values.symptoms || [],
      severity: values.severity,
      duration: values.duration || null,
      additionalInfo: values.additionalInfo || null,
      reportedBy: "self",
    };

    const meta = {
      type: "symptom_report",
      source: "self",
      submitted_at: new Date().toISOString(),
    };

    return { patient, meta };
  };

  const showCriticalModal = () => {
    Modal.warning({
      title: "Severe Symptoms Detected",
      content: (
        <div>
          <p>
            Based on your report, you may need urgent medical attention. A local
            health worker may contact you.
          </p>
          <ul>
            <li>Emergency Helpline: 108</li>
            <li>Health Helpline: 104</li>
          </ul>
        </div>
      ),
      okText: "I Understand",
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = buildPayload(values);

      console.log("Self-report payload:", payload);

      await postReport(payload);

      message.success("Report submitted successfully!");

      if (values.severity === "severe" || values.severity === "critical") {
        showCriticalModal();
      }

      setSubmitted(true);
      form.resetFields();
    } catch (err: any) {
      console.error(err);
      message.error("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="self-report">
        <Card className="success-card">
          <div className="success-content">
            <CheckCircleOutlined className="success-icon" />
            <Title level={3}>Thank You for Your Report</Title>
            <Text>
              Your report has been recorded. This helps us monitor diseases in
              your community.
            </Text>
            <Button type="primary" onClick={() => setSubmitted(false)}>
              Submit Another Report
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="self-report">
      <div className="page-header">
        <Title level={2}>
          <MedicineBoxOutlined /> Self Symptom Report
        </Title>
        <Text>Help us detect early outbreaks by reporting your symptoms.</Text>
      </div>

      <Row justify="center">
        <Col xs={24} md={18} lg={14}>
          <Card className="report-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              {/* Hidden fixed source */}
              <Form.Item name="source" initialValue="self" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="location"
                label="Your Area / Village"
                rules={[{ required: true, message: "Please enter your location" }]}
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Example: Ward 2, Rangia Village"
                />
              </Form.Item>

              <Form.Item
                name="contactNumber"
                label="Contact Number (optional)"
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="+91-XXXXXXXXXX"
                />
              </Form.Item>

              <Form.Item
                name="symptoms"
                label="Symptoms You Are Experiencing"
                rules={[{ required: true, message: "Please select symptoms" }]}
              >
                <Select mode="multiple" placeholder="Select symptoms">
                  {symptomsList.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="severity"
                label="Severity"
                rules={[{ required: true, message: "Select severity level" }]}
              >
                <Select>
                  <Option value="mild">● Mild</Option>
                  <Option value="moderate">● Moderate</Option>
                  <Option value="severe" style={{ color: "#fa8c16" }}>
                    ● Severe
                  </Option>
                  <Option value="critical" style={{ color: "#ff4d4f" }}>
                    ● Critical
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item name="additionalInfo" label="Additional Notes">
                <TextArea
                  rows={4}
                  placeholder="Describe anything important (e.g., water quality, others also sick)"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    <AlertOutlined /> Submit
                  </Button>
                  <Button onClick={() => form.resetFields()}>Reset</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SelfReport;