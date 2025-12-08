import React, { useMemo, useState, useEffect } from 'react';
import { Spin, Empty, Badge, Button, message } from 'antd';
import { ReloadOutlined, BellOutlined } from '@ant-design/icons';
import { useAlerts } from '../contexts/AlertContext';
import { useLanguage } from '../contexts/LanguageContext';
import AlertNotificationPopup from '../components/AlertNotificationPopup';
import './Alerts.css';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'active' | 'monitoring' | 'resolved' | 'sending' | 'sent' | 'pending';

type Alert = {
  id: string;
  title: string;
  priority: Priority;
  location: string;
  time: string;
  description: string;
  affected: string;
  status: Status;
  created_by?: string;
  created_by_role?: string;
  severity?: string;
  region?: string;
  created_at?: string;
};

// Keep sample alerts as fallback
const sampleAlerts: Alert[] = [
  {
    id: '1',
    title: 'Contaminated Water Source - Village A',
    priority: 'critical',
    location: 'Village A, Block 3',
    time: '10 minutes ago',
    description:
      'Field reports indicate possible contamination in the community well. Advisories issued; immediate testing and isolation of water source recommended.',
    affected: 'Approx. 1,200 residents',
    status: 'active',
  },
  {
    id: '2',
    title: 'Cluster of Gastroenteritis Cases',
    priority: 'high',
    location: 'Primary School, Ward 5',
    time: '1 hour ago',
    description:
      'Increase in gastrointestinal complaints recorded at local clinic. Contact tracing and sample collection underway.',
    affected: '~32 students',
    status: 'monitoring',
  },
  {
    id: '3',
    title: 'Vaccination Drive Scheduled',
    priority: 'low',
    location: 'Community Center, Zone B',
    time: '2 days ago',
    description:
      'Targeted vaccination drive for waterborne disease prevention. Mobile unit scheduled from 09:00–15:00.',
    affected: 'Voluntary',
    status: 'resolved',
  },
];

const FILTERS = ['all', 'critical', 'high', 'medium', 'low', 'active', 'sent', 'pending'] as const;

// Helper function
function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

const Alerts: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({});
  
  const { alerts: backendAlerts, unreadCount, fetchAlerts, acknowledgeAlert, isLoading } = useAlerts();
  const { currentLanguage, translateBulk } = useLanguage();

  // Translation effect
  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setTranslatedContent({});
        return;
      }
      
      const textsToTranslate = [
        'Health Alerts & Incident Management',
        'Real-time water quality alerts and community health notifications from ASHA workers and health officials.',
        'Refresh',
        'Active Alerts',
        'requiring attention',
        'Unread',
        'new alerts',
        'Critical',
        'high priority',
        'Total Alerts',
        'all time',
        'Filters',
        'All',
        'Active',
        'Sent',
        'Pending',
        'High',
        'Medium',
        'Low',
        'Alert acknowledged',
        'No alerts found',
        'View Details',
        'Acknowledge'
      ];
      
      const results = await translateBulk(textsToTranslate);
      const translated: Record<string, string> = {};
      results.forEach((value, key) => {
        translated[key] = value;
      });
      setTranslatedContent(translated);
    };
    
    translateContent();
  }, [currentLanguage.code, translateBulk]);

  // Convert backend alerts to display format
  const displayAlerts: Alert[] = useMemo(() => {
    if (backendAlerts.length === 0) return sampleAlerts;
    
    return backendAlerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      priority: (alert.severity as Priority) || 'medium',
      location: alert.region || 'Unknown',
      time: alert.created_at ? getTimeAgo(alert.created_at) : 'Unknown',
      description: alert.description,
      affected: `Users in ${alert.region}`,
      status: (alert.status as Status) || 'active',
      created_by: alert.created_by,
      created_by_role: alert.created_by_role,
      severity: alert.severity,
      region: alert.region,
      created_at: alert.created_at
    }));
  }, [backendAlerts]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return displayAlerts;
    return displayAlerts.filter((a) => a.priority === activeFilter || a.status === activeFilter);
  }, [activeFilter, displayAlerts]);

  const stats = useMemo(() => [
    { label: translatedContent['Active Alerts'] || 'Active Alerts', value: String(displayAlerts.filter(a => a.status !== 'resolved').length), note: translatedContent['requiring attention'] || 'requiring attention', key: 'active' },
    { label: translatedContent['Unread'] || 'Unread', value: String(unreadCount), note: translatedContent['new alerts'] || 'new alerts', key: 'unread' },
    { label: translatedContent['Critical'] || 'Critical', value: String(displayAlerts.filter(a => a.priority === 'critical').length), note: translatedContent['high priority'] || 'high priority', key: 'critical' },
    { label: translatedContent['Total Alerts'] || 'Total Alerts', value: String(displayAlerts.length), note: translatedContent['all time'] || 'all time', key: 'total' },
  ], [displayAlerts, unreadCount, translatedContent]);

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      region: alert.location,
      severity: alert.priority,
      created_by: alert.created_by || 'Health Official',
      created_by_role: alert.created_by_role || 'asha_worker',
      created_at: alert.created_at || new Date().toISOString(),
      status: alert.status
    });
    setShowAlertPopup(true);
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
    message.success(translatedContent['Alert acknowledged'] || 'Alert acknowledged');
  };

  return (
    <div className="alerts-page">
      <header className="alerts-hero">
        <div className="container hero-inner">
          <div className="brand">
            <Badge count={unreadCount} offset={[10, 0]}>
              <BellOutlined style={{ fontSize: 20, color: 'white' }} />
            </Badge>
            &nbsp; Nirogya
          </div>
          <div className="hero-title-block">
            <h1 className="hero-title">{translatedContent['Health Alerts & Incident Management'] || 'Health Alerts & Incident Management'}</h1>
            <p className="hero-subtitle">
              {translatedContent['Real-time water quality alerts and community health notifications from ASHA workers and health officials.'] || 'Real-time water quality alerts and community health notifications from ASHA workers and health officials.'}
            </p>
          </div>
          <Button 
            icon={<ReloadOutlined spin={isLoading} />} 
            onClick={() => fetchAlerts()}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
          >
            {translatedContent['Refresh'] || 'Refresh'}
          </Button>
        </div>
      </header>

      <main className="container page-body">
        <section className="alerts-stats-section" aria-label="Alert summary statistics">
          <div className="alerts-stats-grid">
            {stats.map((s) => (
              <div key={s.key} className={`alert-stat-card ${s.key === 'unread' && unreadCount > 0 ? 'highlight' : ''}`}>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="filter-section" aria-label="Alert filters">
          <div className="filter-card">
            <div className="filter-title">{translatedContent['Filters'] || 'Filters'}</div>
            <div className="filter-group" role="tablist" aria-label="Alert filter list">
              {FILTERS.map((f) => {
                const filterLabels: Record<string, string> = {
                  'all': translatedContent['All'] || 'All',
                  'critical': translatedContent['Critical'] || 'Critical',
                  'high': translatedContent['High'] || 'High',
                  'medium': translatedContent['Medium'] || 'Medium',
                  'low': translatedContent['Low'] || 'Low',
                  'active': translatedContent['Active'] || 'Active',
                  'sent': translatedContent['Sent'] || 'Sent',
                  'pending': translatedContent['Pending'] || 'Pending'
                };
                return (
                  <button
                    key={f}
                    className={`filter-button ${activeFilter === f ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                    aria-pressed={activeFilter === f}
                  >
                    {filterLabels[f] || f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="alerts-list-section" aria-label="Alerts list">
          <h2 className="section-title">
            Water Quality Alerts & Incidents
            {isLoading && <Spin size="small" style={{ marginLeft: 12 }} />}
          </h2>
          <p className="section-subtitle">
            Real-time alerts from ASHA workers and health officials. Click any alert for full details.
          </p>

          {filtered.length === 0 ? (
            <Empty description="No alerts found" />
          ) : (
            <div className="alerts-list" role="list">
              {filtered.map((a) => (
                <article
                  key={a.id}
                  role="listitem"
                  className={`alert-card ${a.priority} ${a.status === 'resolved' ? 'resolved' : ''}`}
                  tabIndex={0}
                  aria-labelledby={`alert-title-${a.id}`}
                  onClick={() => handleViewAlert(a)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="alert-header">
                    <div className="alert-title-section">
                      <h3 id={`alert-title-${a.id}`} className="alert-title">{a.title}</h3>
                      <div className="alert-meta-top">
                        <span className="meta-text">{a.location}</span>
                        <span className="meta-sep">•</span>
                        <span className="meta-text">{a.time}</span>
                        {a.created_by && (
                          <>
                            <span className="meta-sep">•</span>
                            <span className="meta-text">by {a.created_by}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`priority-chip ${a.priority}`}>{a.priority.toUpperCase()}</div>
                  </div>

                  <p className="alert-description">{a.description}</p>

                  <div className="alert-footer">
                    <div className="meta-item"><strong>Affected:</strong>&nbsp;{a.affected}</div>
                    <div className="meta-item"><strong>Status:</strong>&nbsp;<span className="status-text">{a.status}</span></div>

                    <div className="actions">
                      <button className="btn-outline" onClick={(e) => { e.stopPropagation(); handleViewAlert(a); }}>View</button>
                      <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleAcknowledge(a.id); }}>Acknowledge</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Alert Detail Popup */}
      <AlertNotificationPopup
        alert={selectedAlert}
        visible={showAlertPopup}
        onClose={() => setShowAlertPopup(false)}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
};

export default Alerts;
