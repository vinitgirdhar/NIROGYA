import React from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Avatar,
  Timeline,
  Button,
  Statistic,
} from "antd";
import {
  HeartOutlined,
  SafetyOutlined,
  GlobalOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { useTheme } from "../components/ThemeProvider";
import "./About.css";

const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
  const { isDark } = useTheme();

  const teamMembers = [
    {
      name: "Maxwell Mathew",
      role: "Team Member",  
      avatar: "MM",
      description: "",
      linkedin: "https://www.linkedin.com/in/maxwell-mathew-97961b2b7/",
    },
    {
      name: "Ashwin Koonissery",
      role: "Team Member",
      avatar: "AK",
      description: "",
      linkedin:
        "https://www.linkedin.com/in/ashwin-vincent-koonissery-a2662a2b7/",
    },
    {
      name: "Shinie Dabre",
      role: "Team Member",
      avatar: "SD",
      description: "",
      linkedin: "https://www.linkedin.com/in/shinie-dabre-b919a9279/",
    },
    {
      name: "Siona Dalmet",
      role: "Team Member",
      avatar: "SD",
      description: "",
      linkedin: "https://www.linkedin.com/in/siona-dalmet/",
    },
    {
      name: "Aaditya Parab",
      role: "Team Member",
      avatar: "AP",
      description: "",
      linkedin: "https://www.linkedin.com/in/aaditya-parab-5486212b7/",
    },
  ];

  const milestones = [
    {
      year: "2023",
      title: "Project Inception",
      description:
        "Nirogya was conceptualized to address water-borne disease surveillance gaps in rural India",
    },
    {
      year: "2024",
      title: "Pilot Program Launch",
      description:
        "Successfully deployed pilot program in 5 districts across Assam, reaching 50,000+ people",
    },
    {
      year: "2024",
      title: "AI Integration",
      description:
        "Integrated machine learning models for predictive disease outbreak analysis",
    },
    {
      year: "2025",
      title: "National Expansion",
      description:
        "Expanding to 15 states with government partnership and WHO recognition",
    },
  ];

  const stats = [
    { title: "Communities Served", value: 150, suffix: "+" },
    { title: "Health Workers Connected", value: 2500, suffix: "+" },
    { title: "Disease Outbreaks Prevented", value: 45, suffix: "+" },
    { title: "Lives Impacted", value: 500000, suffix: "+" },
  ];

  return (
    <div className={`about-page ${isDark ? "dark" : ""}`}>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <Title level={1} className="hero-title">
            About Nirogya
          </Title>
          <Paragraph className="hero-subtitle">
            Empowering communities through intelligent health surveillance and
            water quality monitoring
          </Paragraph>
          <div className="hero-stats">
            <Row gutter={[24, 24]}>
              {stats.map((stat, index) => (
                <Col xs={12} sm={6} key={index}>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    suffix={stat.suffix}
                    className="hero-stat-item"
                  />
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2}>Our Mission</Title>
              <Paragraph className="mission-text">
                Nirogya is dedicated to revolutionizing public health
                surveillance in rural and underserved communities. We combine
                cutting-edge technology with grassroots healthcare to create an
                early warning system for water-borne diseases.
              </Paragraph>
              <Paragraph className="mission-text">
                Our platform empowers ASHA workers, healthcare professionals,
                and community members with real-time data, predictive analytics,
                and seamless communication tools to prevent disease outbreaks
                before they spread.
              </Paragraph>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="values-card">
                <Title level={3}>Our Values</Title>
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  <div className="value-item">
                    <HeartOutlined className="value-icon" />
                    <div>
                      <Text strong>Compassion</Text>
                      <Paragraph>
                        Every life matters. We're committed to protecting the
                        most vulnerable.
                      </Paragraph>
                    </div>
                  </div>
                  <div className="value-item">
                    <SafetyOutlined className="value-icon" />
                    <div>
                      <Text strong>Prevention</Text>
                      <Paragraph>
                        Proactive prevention is better than reactive treatment.
                      </Paragraph>
                    </div>
                  </div>
                  <div className="value-item">
                    <GlobalOutlined className="value-icon" />
                    <div>
                      <Text strong>Accessibility</Text>
                      <Paragraph>
                        Technology should reach every corner, regardless of
                        infrastructure.
                      </Paragraph>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Journey Section */}
      <section className="about-journey">
        <div className="container">
          <Title level={2} className="section-title">
            Our Journey
          </Title>
          <Row justify="center">
            <Col xs={24} lg={16}>
              <Timeline mode="alternate" className="journey-timeline">
                {milestones.map((milestone, index) => (
                  <Timeline.Item key={index} className="timeline-item">
                    <Card>
                      <Title level={4}>{milestone.year}</Title>
                      <Title level={5}>{milestone.title}</Title>
                      <Paragraph>{milestone.description}</Paragraph>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Col>
          </Row>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="container">
          <Title level={2} className="section-title">
            Meet Our Team
          </Title>
          <Paragraph className="team-intro">
            Our diverse team of healthcare professionals, technologists, and
            community advocates work together to make Nirogya a reality.
          </Paragraph>

          <Row gutter={[24, 24]}>
            {teamMembers.map((member, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="team-card" hoverable>
                  <div className="team-avatar">
                    <Avatar size={80} className="member-avatar">
                      {member.avatar}
                    </Avatar>
                  </div>
                  <Title level={4} className="member-name">
                    {member.name}
                  </Title>
                  <Text className="member-role">{member.role}</Text>
                  <Paragraph className="member-description">
                    {member.description}
                  </Paragraph>
                  <div className="member-social">
                    {member.linkedin ? (
                      <Button
                        type="text"
                        icon={<LinkedinOutlined />}
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ) : null}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Impact Section */}
      <section className="about-impact">
        <div className="container">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2}>Our Impact</Title>
              <Paragraph>
                Since our launch, Nirogya has made significant strides in
                improving public health outcomes across rural India. Our
                platform has successfully:
              </Paragraph>
              <ul className="impact-list">
                <li>
                  Prevented 45+ potential disease outbreaks through early
                  detection
                </li>
                <li>
                  Connected over 2,500 healthcare workers in a unified network
                </li>
                <li>
                  Provided clean water access guidance to 150+ communities
                </li>
                <li>
                  Trained 500+ ASHA workers on digital health surveillance
                </li>
                <li>Achieved 95% accuracy in water quality predictions</li>
              </ul>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="impact-card">
                <Title level={3}>Recognition</Title>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div className="recognition-item">
                    <Text strong>WHO Digital Health Award 2024</Text>
                    <Paragraph>
                      Recognized for innovation in community health surveillance
                    </Paragraph>
                  </div>
                  <div className="recognition-item">
                    <Text strong>Ministry of Health Partnership</Text>
                    <Paragraph>
                      Official collaboration with Government of India's health
                      ministry
                    </Paragraph>
                  </div>
                  <div className="recognition-item">
                    <Text strong>UNICEF Innovation Grant</Text>
                    <Paragraph>
                      Recipient of innovation grant for child health protection
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta">
        <div className="container">
          <Card className="cta-card">
            <Title level={2}>Join Our Mission</Title>
            <Paragraph>
              Help us build a healthier future for communities across India.
              Whether you're a healthcare worker, technologist, or community
              advocate, there's a place for you in the Nirogya family.
            </Paragraph>
            <Space size="large">
              <Button type="primary" size="large" href="/contact">
                Get Involved
              </Button>
              <Button size="large" href="/register">
                Join Platform
              </Button>
            </Space>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;
