import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { Typography, Collapse, Table, Space, Divider } from 'antd';
import emergencyContacts from '../data/emergencyContacts';
import './EmergencyContacts.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const EmergencyContacts: React.FC = () => {
  // Convert phone-like substrings in a text into clickable tel: links
  const linkifyPhones = (text: string) => {
    if (!text) return null;
    const phoneRegex = /(\+?\d[\d\-\s()]{4,}\d)/g;
    const parts: Array<string | React.ReactElement> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = phoneRegex.exec(text)) !== null) {
      const idx = match.index;
      const matched = match[0];
      if (idx > lastIndex) {
        parts.push(text.substring(lastIndex, idx));
      }
      const href = 'tel:' + matched.replace(/[^\d+]/g, '');
      parts.push(<a key={idx} href={href}><Text code>{matched}</Text></a>);
      lastIndex = idx + matched.length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>);
  };
  return (
    <PublicLayout>
      <div className="emergency-contacts-page">
        <Title level={2}>Emergency Contacts — North Eastern States</Title>
        <Text type="secondary">Statewise and districtwise emergency contact numbers for health, water, and disaster response.</Text>
        <Divider />

        <Collapse accordion>
          {Object.entries(emergencyContacts).map(([state, data]) => (
            <Panel header={state} key={state}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="state-quick-numbers">
                  <Text strong>Statewide Emergency Numbers:</Text>
                  <div className="state-numbers">
                    {Object.entries((data as any).statewide || {}).map(([k, v]) => (
                      <div key={k} className="state-number-item"><Text>{k}:</Text> <span style={{marginLeft:8}}>{linkifyPhones(v as string)}</span></div>
                    ))}
                  </div>
                </div>

                {(data as any).districts ? (
                  <Table
                    dataSource={(data as any).districts.map((d: any, idx: number) => ({ key: idx, ...d }))}
                    pagination={false}
                    rowKey="district"
                    columns={[
                        { title: 'District', dataIndex: 'district', key: 'district', width: '30%' },
                        { title: 'Emergency Numbers (Health / Water / Disease)', dataIndex: 'contacts', key: 'contacts', render: (text: string) => <div>{linkifyPhones(text)}</div> }
                    ]}
                  />
                ) : (
                  <Text>{(data as any).note}</Text>
                )}
              </Space>
            </Panel>
          ))}
        </Collapse>
      </div>
    </PublicLayout>
  );
};

export default EmergencyContacts;