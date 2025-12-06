// src/pages/ReportWaterQuality.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Slider,
  Statistic,
  Tag,
  Timeline,
  Tooltip,
  message,
} from "antd";

import {
  RobotOutlined,
  ExperimentOutlined,
  WarningOutlined,
  SyncOutlined,
  CopyOutlined,
} from "@ant-design/icons";

import "./ReportWaterQuality.css";

const { Option } = Select;

// ---------------------------------------------------
// DISTRICT → LOCATION MAPPING
// ---------------------------------------------------
const districtLocations: Record<string, string[]> = {
  "Kamrup Metro": ["Guwahati City", "Beltola", "Khanapara"],
  Dibrugarh: ["Dibrugarh Town", "Chabua", "Moran"],
  Cachar: ["Silchar", "Udharbond", "Srikona"],
  Jorhat: ["Jorhat Town", "Teok", "Titabar"],
  Sonitpur: ["Tezpur", "Dhekiajuli", "Balipara"],
};

// ---------------------------------------------------
// DATA TYPE
// ---------------------------------------------------
interface WaterQualityData {
  id?: string;
  _id?: string;
  report_id?: string;

  location: string;
  district: string;
  timestamp: string;

  ph: number;
  turbidity: number;
  tds: number;
  chlorine: number;
  fluoride: number;
  nitrate: number;
  coliform: number;
  temperature: number;

  primaryWaterSource?: string;
  waterTreatment?: string[];

  riskLevel?: "low" | "medium" | "high" | "critical";
}

// ---------------------------------------------------
// RISK LEVEL LOGIC
// ---------------------------------------------------
function deriveRiskLevel(d: Partial<WaterQualityData>): WaterQualityData["riskLevel"] {
  const c = d.coliform ?? 0;
  const t = d.turbidity ?? 0;

  if (c > 100 || t > 80) return "critical";
  if (c > 50 || t > 40) return "high";
  if (c > 20 || t > 20) return "medium";
  return "low";
}

function getRiskColor(risk?: string) {
  switch (risk) {
    case "critical":
      return "#ff4d4f";
    case "high":
      return "#ff7a45";
    case "medium":
      return "#faad14";
    case "low":
      return "#52c41a";
    default:
      return "#999";
  }
}

// ---------------------------------------------------
// SHORTEN ID FOR UI
// ---------------------------------------------------
function shortReportId(id?: string) {
  if (!id) return "-";
  if (id.length <= 18) return id;
  return `${id.slice(0, 10)}...${id.slice(-6)}`;
}

// ---------------------------------------------------
// API CALL
// ---------------------------------------------------
async function postReport(payload: any) {
  const res = await fetch("http://localhost:8000/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

// ---------------------------------------------------
// COMPONENT
// ---------------------------------------------------
const ReportWaterQuality: React.FC = () => {
  const [waterData, setWaterData] = useState<WaterQualityData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();

  // ---------------------------------------------------
  // FETCH EXISTING REPORTS
  // ---------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8000/water_reports?limit=200");
        const docs = await res.json();

        const mapped: WaterQualityData[] = docs.map((d: any) => ({
          id: d._id || d.report_id,
          _id: d._id,
          report_id: d.report_id,
          location: d.location,
          district: d.district,
          timestamp: d.created_at || new Date().toISOString(),
          ph: Number(d.ph),
          turbidity: Number(d.turbidity),
          tds: Number(d.tds),
          chlorine: Number(d.chlorine),
          fluoride: Number(d.fluoride),
          nitrate: Number(d.nitrate),
          coliform: Number(d.coliform),
          temperature: Number(d.temperature),
          riskLevel: deriveRiskLevel(d),
        }));

        setWaterData(
          mapped.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          )
        );
      } catch (err) {
        console.warn("Failed loading DB water reports", err);
      }
    }

    load();
  }, []);

  // ---------------------------------------------------
  // SAVE NEW REPORT
  // ---------------------------------------------------
  const handleSubmit = async (values: any) => {
    setIsSaving(true);

    try {
      const reportId = crypto.randomUUID();

      const payload = {
        water: {
          ...values,
          report_id: reportId,
          primary_water_source: values.primaryWaterSource,
          water_treatment: values.waterTreatment ?? [],
        },
        meta: {
          submitted_at: new Date().toISOString(),
          report_id: reportId,
        },
      };

      await postReport(payload);

      const newRecord: WaterQualityData = {
        id: reportId,
        report_id: reportId,
        location: values.location,
        district: values.district,
        timestamp: new Date().toISOString(),
        ph: Number(values.ph),
        turbidity: Number(values.turbidity),
        tds: Number(values.tds),
        chlorine: Number(values.chlorine),
        fluoride: Number(values.fluoride),
        nitrate: Number(values.nitrate),
        coliform: Number(values.coliform),
        temperature: Number(values.temperature),
        riskLevel: deriveRiskLevel(values),
      };

      setWaterData((prev) => [newRecord, ...prev]);

      message.success("Report saved successfully");
      form.resetFields();
    } catch {
      message.error("Failed to save report");
    }

    setIsSaving(false);
  };

  // ---------------------------------------------------
  // COPY REPORT ID
  // ---------------------------------------------------
  const copyID = (id?: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    message.success("Copied!");
  };

  // ---------------------------------------------------
  // VIEW
  // ---------------------------------------------------
  return (
    <div className="water-quality-wrapper">
      <h2 className="page-title">
        <RobotOutlined /> Water Quality Reporting
      </h2>

      <Row gutter={[16, 16]}>
        {/* STATS SECTION */}
        <Col span={24}>
          <Row gutter={16}>
            {/* Locations */}
            <Col xs={24} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Locations Monitored"
                  prefix={<ExperimentOutlined />}
                  value={waterData.length}
                />
              </Card>
            </Col>

            {/* High risk */}
            <Col xs={24} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="High Risk Areas"
                  prefix={<WarningOutlined />}
                  value={
                    waterData.filter(
                      (r) =>
                        r.riskLevel === "critical" ||
                        r.riskLevel === "high"
                    ).length
                  }
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>

            {/* Last Report ID */}
            <Col xs={24} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Last Report ID"
                  prefix={<CopyOutlined />}
                  value={shortReportId(waterData[0]?.report_id)}
                />
              </Card>
            </Col>

            {/* Total Reports */}
            <Col xs={24} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title="Total Reports"
                  prefix={<SyncOutlined />}
                  value={waterData.length}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* FORM SECTION */}
        <Col xs={24} lg={12}>
          <Card title="Submit Water Quality Report">
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
              <Row gutter={16}>
                {/* DISTRICT */}
                <Col span={12}>
                  <Form.Item
                    name="district"
                    label="District"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select District"
                      onChange={(value) => {
                        setSelectedDistrict(value);
                        form.setFieldsValue({ location: undefined });
                      }}
                    >
                      {Object.keys(districtLocations).map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* LOCATION */}
                <Col span={12}>
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select Location">
                      {(districtLocations[selectedDistrict ?? ""] ?? []).map(
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

              {/* INPUT ROWS */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ph" label="pH" rules={[{ required: true }]}>
                    <Slider min={0} max={14} step={0.1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="turbidity"
                    label="Turbidity"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="tds" label="TDS" rules={[{ required: true }]}>
                    <Input type="number" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="chlorine"
                    label="Chlorine"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fluoride"
                    label="Fluoride"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="nitrate"
                    label="Nitrate"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="coliform"
                    label="Coliform"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="temperature"
                    label="Temperature"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Primary Water Source + Water Treatment */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="primaryWaterSource"
                    label="Primary Water Source"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select Source">
                      <Option value="Municipal tap water">Municipal tap water</Option>
                      <Option value="Well water">Well water</Option>
                      <Option value="River water">River water</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="waterTreatment"
                    label="Water Treatment"
                    rules={[{ required: false }]}
                  >
                    <Select mode="multiple" placeholder="Select Treatment Methods">
                      <Option value="Filtration">Filtration</Option>
                      <Option value="Chlorination">Chlorination</Option>
                      <Option value="UV Purification">UV Purification</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSaving}
                  icon={<RobotOutlined />}
                  block
                >
                  Save Report
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* HISTORY SECTION */}
        <Col xs={24} lg={12}>
          <Card
            title="Recent Reports (Latest 5)"
            extra={<span style={{ color: "#888" }}>Scroll for more</span>}
          >
            <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 8 }}>
              <Timeline>
                {waterData.slice(0, 5).map((r) => (
                  <Timeline.Item
                    color={getRiskColor(r.riskLevel)}
                    key={r.id}
                  >
                    <div className="report-entry">
                      <div className="report-header">
                        <strong>{r.location}</strong> — {r.district}

                        {/* BEAUTIFUL PILL TAG */}
                        <Tag
                          style={{
                            borderRadius: "12px",
                            padding: "2px 10px",
                            fontWeight: 600,
                            fontSize: "12px",
                            border: "none",
                            color: "#fff",
                            background: getRiskColor(r.riskLevel),
                          }}
                        >
                          {r.riskLevel?.toUpperCase()}
                        </Tag>
                      </div>

                      <div className="report-info">
                        pH {r.ph}, Turbidity {r.turbidity}, Coliform{" "}
                        {r.coliform}
                      </div>

                      <div className="report-time">
                        {new Date(r.timestamp).toLocaleString()}
                      </div>

                      {r.report_id && (
                        <Tooltip title="Copy Report ID">
                          <div
                            className="report-id"
                            onClick={() => copyID(r.report_id)}
                          >
                            Report ID: <code>{shortReportId(r.report_id)}</code>
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportWaterQuality;