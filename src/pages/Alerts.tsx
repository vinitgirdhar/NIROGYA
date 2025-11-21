import React, { useMemo, useState } from 'react';
import './Alerts.css';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'active' | 'monitoring' | 'resolved';

type Alert = {
  id: number;
  title: string;
  priority: Priority;
  location: string;
  time: string;
  description: string;
  affected: string;
  status: Status;
};

const sampleAlerts: Alert[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
    title: 'Vaccination Drive Scheduled',
    priority: 'low',
    location: 'Community Center, Zone B',
    time: '2 days ago',
    description:
      'Targeted vaccination drive for waterborne disease prevention. Mobile unit scheduled from 09:00–15:00.',
    affected: 'Voluntary',
    status: 'resolved',
  },
  {
    id: 4,
    title: 'Routine Backup Completed',
    priority: 'medium',
    location: 'Central Database',
    time: '3 hours ago',
    description: 'Daily data backup completed successfully; no action required.',
    affected: 'N/A',
    status: 'resolved',
  },
];

const stats = [
  { label: 'Active Alerts', value: '4', note: 'requiring attention', key: 'active' },
  { label: 'Open Investigations', value: '2', note: 'in progress', key: 'investigations' },
  { label: 'Resolved Today', value: '6', note: 'closed cases', key: 'resolved' },
  { label: 'System Health', value: '99%', note: 'uptime', key: 'health' },
];

const FILTERS = ['all', 'critical', 'high', 'medium', 'low', 'active', 'monitoring', 'resolved'] as const;

const Alerts: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return sampleAlerts;
    return sampleAlerts.filter((a) => a.priority === activeFilter || a.status === activeFilter);
  }, [activeFilter]);

  return (
    <div className="alerts-page">
      <header className="alerts-hero">
        <div className="container hero-inner">
          <div className="brand">Nirogya</div>
          <div className="hero-title-block">
            <h1 className="hero-title">Health Alerts & Incident Management</h1>
            <p className="hero-subtitle">
              Centralised view for community health incidents — water safety, outbreak clusters, and operational notifications.
            </p>
          </div>
        </div>
      </header>

      <main className="container page-body">
        <section className="alerts-stats-section" aria-label="Alert summary statistics">
          <div className="alerts-stats-grid">
            {stats.map((s) => (
              <div key={s.key} className="alert-stat-card">
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="filter-section" aria-label="Alert filters">
          <div className="filter-card">
            <div className="filter-title">Filters</div>
            <div className="filter-group" role="tablist" aria-label="Alert filter list">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`filter-button ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                  aria-pressed={activeFilter === f}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="alerts-list-section" aria-label="Alerts list">
          <h2 className="section-title">Incidents & Alerts</h2>
          <p className="section-subtitle">Sorted by most recent — click any item for full details or actions.</p>

          <div className="alerts-list" role="list">
            {filtered.map((a) => (
              <article
                key={a.id}
                role="listitem"
                className={`alert-card ${a.priority} ${a.status === 'resolved' ? 'resolved' : ''}`}
                tabIndex={0}
                aria-labelledby={`alert-title-${a.id}`}
              >
                <div className="alert-header">
                  <div className="alert-title-section">
                    <h3 id={`alert-title-${a.id}`} className="alert-title">{a.title}</h3>
                    <div className="alert-meta-top">
                      <span className="meta-text">{a.location}</span>
                      <span className="meta-sep">•</span>
                      <span className="meta-text">{a.time}</span>
                    </div>
                  </div>

                  <div className={`priority-chip ${a.priority}`}>{a.priority.toUpperCase()}</div>
                </div>

                <p className="alert-description">{a.description}</p>

                <div className="alert-footer">
                  <div className="meta-item"><strong>Affected:</strong>&nbsp;{a.affected}</div>
                  <div className="meta-item"><strong>Status:</strong>&nbsp;<span className="status-text">{a.status}</span></div>

                  {/* Action buttons placeholder (wire to real actions later) */}
                  <div className="actions">
                    <button className="btn-outline">View</button>
                    <button className="btn-primary">Acknowledge</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Alerts;
