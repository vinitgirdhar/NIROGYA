// src/pages/SymptomReporting.tsx
import React, { useState } from 'react';
import { Card, Form, Select, Input, Button, Row, Col, Typography, Space, message, Modal } from 'antd';
import { 
  MedicineBoxOutlined, 
  UserOutlined,
  EnvironmentOutlined,
  AlertOutlined,
  PhoneOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './SymptomReporting.css';
import { postReport } from '../api/report';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface SymptomReport {
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration: string;
  waterSource: string;
  additionalInfo: string;
  contactNumber: string;
  reportedBy: string;
  urgentHelp: boolean;
}

const waterborneSymptoms = [
  'Diarrhea',
  'Vomiting',
  'Nausea',
  'Abdominal cramps',
  'Fever',
  'Dehydration',
  'Fatigue',
  'Headache',
  'Muscle aches',
  'Loss of appetite',
  'Blood in stool',
  'Skin rash',
  'Eye irritation',
  'Jaundice'
];

const waterSources = [
  'Municipal tap water',
  'Well water',
  'Tube well',
  'River water',
  'Pond water',
  'Rainwater collection',
  'Bottled water',
  'Other'
];

const SymptomReporting: React.FC = () => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // build the nested payload expected by the backend
  const buildPatientPayload = (values: any) => {
    const patient = {
      patientName: values.patientName || null,
      age: values.age !== undefined && values.age !== '' ? Number(values.age) : null,
      gender: values.gender || null,
      location: values.location || null,
      contactNumber: values.contactNumber || null,
      symptoms: Array.isArray(values.symptoms) ? values.symptoms : (values.symptoms ? [values.symptoms] : []),
      severity: values.severity || null,
      duration: values.duration || null,
      additionalInfo: values.additionalInfo || null,
      reportedBy: user?.name || values.reportedBy || 'Anonymous'
    };

    const meta = {
      submitted_at: new Date().toISOString(),
      type: "symptom_report",
      // you can add more meta fields here, e.g. reporter_id, device, etc.
    };

    return { patient, meta };
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      // create structured payload and send to backend
      const { patient, meta } = buildPatientPayload(values);
      const payload = { patient, meta };

      console.debug("Submitting symptom payload:", payload);

      const res = await postReport(payload); // postReport posts to http://localhost:8000/report

      console.debug("Backend response:", res);

      // show success and possible emergency modal
      const reportData: SymptomReport = {
        ...values,
        reportedBy: patient.reportedBy,
        urgentHelp: values.severity === 'critical' || values.severity === 'severe'
      };

      message.success('Symptom report submitted successfully!');

      if (reportData.urgentHelp) {
        showEmergencyModal();
      }

      setSubmitted(true);
      form.resetFields();

    } catch (error: any) {
      console.error('Failed to submit report:', error);
      message.error(error?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showEmergencyModal = () => {
    Modal.info({
      title: 'Emergency Contacts Notified',
      content: (
        <div>
          <p>Due to the severity of symptoms reported, emergency contacts have been notified:</p>
          <ul>
            <li>District Health Officer: +91-9876543210</li>
            <li>Local ASHA Worker: +91-9876543211</li>
            <li>Emergency Helpline: 108</li>
          </ul>
          <p>Medical assistance will be arranged shortly.</p>
        </div>
      ),
      okText: 'Understood',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return '#52c41a';
      case 'moderate': return '#faad14';
      case 'severe': return '#fa8c16';
      case 'critical': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  if (submitted) {
    return (
      <div className="symptom-reporting">
        <Card className="success-card">
          <div className="success-content">
            <CheckCircleOutlined className="success-icon" />
            <Title level={3}>Report Submitted Successfully!</Title>
            <Text>Your symptom report has been submitted and relevant authorities have been notified.</Text>
            <div className="next-steps">
              <Title level={4}>Next Steps:</Title>
              <ul>
                <li>A healthcare worker will contact you within 2 hours</li>
                <li>Ensure the patient stays hydrated</li>
                <li>Monitor symptoms and report any worsening</li>
                <li>Follow hygiene protocols to prevent spread</li>
              </ul>
            </div>
            <Button type="primary" onClick={() => setSubmitted(false)}>
              Submit Another Report
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="symptom-reporting">
      <div className="page-header">
        <Title level={2}>
          <MedicineBoxOutlined /> Symptom Reporting
        </Title>
        <Text>Report waterborne disease symptoms for immediate medical attention</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Patient Information" className="reporting-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                reportedBy: user?.name,
                gender: 'male',
                severity: 'mild'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="patientName"
                    label="Patient Name"
                    rules={[{ required: true, message: 'Please enter patient name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Enter patient name" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="age"
                    label="Age"
                    rules={[{ required: true, message: 'Please enter age' }]}
                  >
                    <Input type="number" placeholder="Age" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="location"
                    label="Location/Village"
                    rules={[{ required: true, message: 'Please enter location' }]}
                  >
                    <Input prefix={<EnvironmentOutlined />} placeholder="Village/Location" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contactNumber"
                    label="Contact Number"
                    rules={[{ required: true, message: 'Please enter contact number' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+91-XXXXXXXXXX" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="symptoms"
                label="Symptoms (Select all that apply)"
                rules={[{ required: true, message: 'Please select at least one symptom' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select symptoms"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {waterborneSymptoms.map(symptom => (
                    <Option key={symptom} value={symptom}>
                      {symptom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="severity"
                    label="Severity Level"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="mild">
                        <span style={{ color: getSeverityColor('mild') }}>● Mild</span>
                      </Option>
                      <Option value="moderate">
                        <span style={{ color: getSeverityColor('moderate') }}>● Moderate</span>
                      </Option>
                      <Option value="severe">
                        <span style={{ color: getSeverityColor('severe') }}>● Severe</span>
                      </Option>
                      <Option value="critical">
                        <span style={{ color: getSeverityColor('critical') }}>● Critical</span>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="duration"
                    label="Duration of Symptoms"
                    rules={[{ required: true, message: 'Please specify duration' }]}
                  >
                    <Select placeholder="How long have symptoms persisted?">
                      <Option value="less_than_24h">Less than 24 hours</Option>
                      <Option value="1_2_days">1-2 days</Option>
                      <Option value="3_5_days">3-5 days</Option>
                      <Option value="more_than_week">More than a week</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="waterSource"
                label="Primary Water Source"
                rules={[{ required: true, message: 'Please select water source' }]}
              >
                <Select placeholder="Select primary water source">
                  {waterSources.map(source => (
                    <Option key={source} value={source}>
                      {source}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="additionalInfo"
                label="Additional Information"
              >
                <TextArea
                  rows={4}
                  placeholder="Any additional details about symptoms, recent travel, or other relevant information..."
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} size="large">
                    <AlertOutlined /> Submit Report
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    Reset Form
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Emergency Guidelines" className="guidelines-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="guideline-section">
                <Title level={5}>🚨 Immediate Action Required If:</Title>
                <ul>
                  <li>Severe dehydration</li>
                  <li>Blood in vomit or stool</li>
                  <li>High fever (&gt;101°F)</li>
                  <li>Signs of shock</li>
                  <li>Difficulty breathing</li>
                </ul>
              </div>

              <div className="guideline-section">
                <Title level={5}>💧 First Aid Measures:</Title>
                <ul>
                  <li>Ensure patient stays hydrated</li>
                  <li>Give ORS solution if available</li>
                  <li>Avoid solid foods temporarily</li>
                  <li>Maintain hygiene protocols</li>
                </ul>
              </div>

              <div className="guideline-section">
                <Title level={5}>📞 Emergency Contacts:</Title>
                <ul>
                  <li>Emergency: 108</li>
                  <li>Health Helpline: 104</li>
                  <li>Local ASHA Worker: Contact via app</li>
                </ul>
              </div>
            </Space>
          </Card>

          <Card title="Prevention Tips" className="prevention-card">
            <ul>
              <li>Boil water before drinking</li>
              <li>Use water purification tablets</li>
              <li>Wash hands frequently</li>
              <li>Avoid contaminated food</li>
              <li>Report water source issues immediately</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SymptomReporting;