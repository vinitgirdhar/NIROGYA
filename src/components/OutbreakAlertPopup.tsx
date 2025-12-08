// src/components/OutbreakAlertPopup.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, Tag, Typography, Space, Divider, Progress } from 'antd';
import { 
  AlertOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { OutbreakAlert } from '../contexts/AlertContext';
import './OutbreakAlertPopup.css';

const { Title, Text, Paragraph } = Typography;

interface OutbreakAlertPopupProps {
  outbreak: OutbreakAlert | null;
  visible: boolean;
  onClose: () => void;
  onAcknowledge?: (alertId: string) => void;
}

const severityConfig = {
  low: { color: '#52c41a', bg: '#f6ffed', icon: '📋', label: 'Low Risk' },
  medium: { color: '#faad14', bg: '#fffbe6', icon: '⚠️', label: 'Medium Risk' },
  high: { color: '#ff4d4f', bg: '#fff1f0', icon: '🚨', label: 'High Risk - Outbreak Detected' }
};

// Disease-specific prevention tips
const diseasePreventionTips: Record<string, string[]> = {
  'cholera': [
    'Drink only boiled or treated water',
    'Wash hands frequently with soap',
    'Avoid raw or undercooked seafood',
    'Ensure food is properly cooked and stored'
  ],
  'typhoid': [
    'Drink only safe, treated water',
    'Avoid street food and raw vegetables',
    'Wash hands before eating',
    'Get vaccinated if not already'
  ],
  'malaria': [
    'Use mosquito nets while sleeping',
    'Apply mosquito repellent',
    'Wear long-sleeved clothing',
    'Eliminate stagnant water near your home'
  ],
  'dengue': [
    'Use mosquito repellent and nets',
    'Wear protective clothing',
    'Remove standing water from containers',
    'Keep windows and doors screened'
  ],
  'diarrhea': [
    'Drink only boiled or purified water',
    'Wash hands with soap frequently',
    'Avoid raw or unwashed foods',
    'Use oral rehydration solution if affected'
  ],
  'default': [
    'Practice good hand hygiene',
    'Drink only safe, clean water',
    'Seek medical attention if symptoms develop',
    'Follow local health authority guidelines'
  ]
};

const OutbreakAlertPopup: React.FC<OutbreakAlertPopupProps> = ({
  outbreak,
  visible,
  onClose,
  onAcknowledge
}) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (visible && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, countdown]);

  useEffect(() => {
    if (visible) {
      setCountdown(30);
      // Play alert sound for high severity outbreaks
      if (outbreak?.severity === 'high') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOPg');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
  }, [visible, outbreak]);

  if (!outbreak) return null;

  const config = severityConfig[outbreak.severity] || severityConfig.medium;
  const timeAgo = outbreak.latestPredictionDate ? getTimeAgo(new Date(outbreak.latestPredictionDate)) : 'Recently';
  
  // Get disease-specific prevention tips
  const diseaseLower = (outbreak.disease || '').toLowerCase();
  const preventionTips = diseasePreventionTips[diseaseLower] || diseasePreventionTips.default;

  // Calculate severity percentage for progress bar
  const severityPercent = outbreak.severity === 'high' ? 90 : outbreak.severity === 'medium' ? 60 : 30;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      className={`outbreak-alert-popup severity-${outbreak.severity}`}
      closable={true}
      maskClosable={false}
    >
      {/* Pulsing Header */}
      <div className="outbreak-popup-header" style={{ background: config.bg }}>
        <div className="outbreak-icon-wrapper" style={{ background: config.color }}>
          <span style={{ fontSize: 32 }}>{config.icon}</span>
        </div>
        <div className="outbreak-header-content">
          <Tag color={config.color} style={{ marginBottom: 8 }}>
            {config.label}
          </Tag>
          <Title level={4} style={{ margin: 0, color: config.color }}>
            {outbreak.disease} Outbreak Alert
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {outbreak.status}
          </Text>
        </div>
      </div>

      {/* Alert Body */}
      <div className="outbreak-popup-body">
        {/* Location */}
        <div className="outbreak-meta-row">
          <EnvironmentOutlined style={{ color: config.color }} />
          <Text strong>Location:</Text>
          <Text>{outbreak.areaName || outbreak.district}</Text>
        </div>

        {/* District */}
        {outbreak.district && outbreak.areaName !== outbreak.district && (
          <div className="outbreak-meta-row">
            <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
            <Text strong>District:</Text>
            <Text>{outbreak.district}</Text>
          </div>
        )}

        {/* Time */}
        <div className="outbreak-meta-row">
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text strong>Detected:</Text>
          <Text>{timeAgo}</Text>
        </div>

        {/* Cases */}
        <div className="outbreak-meta-row">
          <MedicineBoxOutlined style={{ color: config.color }} />
          <Text strong>Reported Cases:</Text>
          <Text style={{ color: config.color, fontWeight: 600 }}>{outbreak.totalPredictions}</Text>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Severity Indicator */}
        <div className="outbreak-severity-section">
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <WarningOutlined style={{ color: config.color }} /> Severity Level:
          </Text>
          <Progress 
            percent={severityPercent} 
            strokeColor={config.color}
            showInfo={false}
            size="small"
          />
          <div className="severity-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Description */}
        <div className="outbreak-description-section">
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <AlertOutlined /> Alert Message:
          </Text>
          <div className="outbreak-message-box" style={{ borderLeftColor: config.color }}>
            <Paragraph style={{ margin: 0 }}>
              A {outbreak.severity} severity {outbreak.disease.toLowerCase()} outbreak has been detected in {outbreak.areaName || outbreak.district}. 
              {outbreak.totalPredictions} cases have been reported in the last 30 days.
              Please take necessary precautions and seek medical attention if you experience symptoms.
            </Paragraph>
          </div>
        </div>

        {/* Prevention Tips */}
        <div className="prevention-instructions">
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            <SafetyOutlined style={{ color: '#52c41a' }} /> Prevention Tips for {outbreak.disease}:
          </Text>
          <ul>
            {preventionTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <Text type="secondary">
            🏥 If you feel unwell, contact your nearest health center or call the health helpline.
          </Text>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="outbreak-popup-footer">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Auto-dismiss in {countdown}s
          </Text>
          <Space>
            <Button onClick={onClose}>
              Dismiss
            </Button>
            <Button 
              type="primary" 
              onClick={() => {
                onAcknowledge?.(outbreak.id);
                onClose();
              }}
              style={{ background: config.color, borderColor: config.color }}
            >
              I Understand
            </Button>
          </Space>
        </Space>
      </div>
    </Modal>
  );
};

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default OutbreakAlertPopup;
