import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, MapPin, Send, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './ComplainForm.css';

interface ComplaintFormData {
  name: string;
  role: 'ASHA Worker' | 'Community User';
  contact: string;
  district: string;
  category: string;
  title: string;
  description: string;
  urgency: 'Low' | 'Normal' | 'High';
}

const districts = [
  'East Khasi Hills',
  'West Khasi Hills',
  'Jaintia Hills',
  'West Garo Hills',
  'East Garo Hills',
  'South Garo Hills',
  'Ri Bhoi',
  'South West Khasi Hills',
  'South West Garo Hills',
  'North Garo Hills',
  'Eastern West Khasi Hills'
];

const categories = [
  'Healthcare Service Issue',
  'Medicine Stock Out',
  'Maternal/Child Health',
  'Water & Sanitation',
  'Emergency Response',
  'Other'
];

interface Reply {
  id: number;
  message: string;
  respondedBy: string;
  respondedAt: string;
  role: string;
}

interface StoredComplaint {
  id: number;
  name: string;
  role: string;
  contact: string;
  district: string;
  category: string;
  title: string;
  description: string;
  urgency: string;
  status: 'Open' | 'In Review' | 'Resolved';
  createdAt: string;
  source: 'form';
  replies?: Reply[];
}

const ComplaintForm: React.FC = () => {
  const { user } = useAuth();

  // Map auth role to complaint form role
  const getUserRole = (): 'ASHA Worker' | 'Community User' => {
    if (user?.role === 'asha_worker') return 'ASHA Worker';
    return 'Community User';
  };

  const [form, setForm] = useState<ComplaintFormData>({
    name: user?.name || '',
    role: getUserRole(),
    contact: user?.phone || user?.email || '',
    district: user?.district || 'East Khasi Hills',
    category: 'Healthcare Service Issue',
    title: '',
    description: '',
    urgency: 'Normal'
  });
  const [recent, setRecent] = useState<StoredComplaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<StoredComplaint[]>([]);

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        role: getUserRole(),
        contact: user.phone || user.email || prev.contact,
        district: user.district || prev.district
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load complaints and filter by user's role
  useEffect(() => {
    const stored = localStorage.getItem('communityComplaints');
    if (stored) {
      const all: StoredComplaint[] = JSON.parse(stored);
      setAllComplaints(all);
      const userRoleType = getUserRole();
      const filtered = all.filter(c => c.role === userRoleType);
      setRecent(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.title || !form.description) {
      alert('Please fill all required fields.');
      return;
    }

    const payload: StoredComplaint = {
      id: Date.now(),
      ...form,
      status: 'Open',
      createdAt: new Date().toISOString(),
      source: 'form'
    };

    const updatedAll = [payload, ...allComplaints].slice(0, 100);
    localStorage.setItem('communityComplaints', JSON.stringify(updatedAll));
    setAllComplaints(updatedAll);

    const userRoleType = getUserRole();
    const filtered = updatedAll.filter(c => c.role === userRoleType);
    setRecent(filtered);

    setForm({
      name: user?.name || '',
      role: getUserRole(),
      contact: user?.phone || user?.email || '',
      district: user?.district || form.district,
      category: form.category,
      title: '',
      description: '',
      urgency: 'Normal'
    });

    alert('Complaint submitted successfully! Government officials will review and respond.');
  };

  return (
    <div className="complaint-page">
      <div className="complaint-hero">
        <div>
          <p className="eyebrow">Raise a concern</p>
          <h1>Submit a Complaint</h1>
          <p className="lede">
            ASHA workers and community members can submit issues directly to the district admin. Your submission will be
            tracked on the admin community page.
          </p>
        </div>
        <div className="hero-icon">
          <AlertTriangle size={44} />
        </div>
      </div>

      <div className="complaint-grid">
        <form className="complaint-card" onSubmit={handleSubmit}>
          <div className="section-title">Complaint Details</div>

          <div className="field-grid">
            <label>
              <span>Name *</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </label>
            <label>
              <span>Role</span>
              <input
                value={form.role}
                disabled
                className="disabled-field"
                title="Role is automatically detected from your account"
              />
            </label>
          </div>

          <div className="field-grid">
            <label>
              <span>Contact (phone/email) *</span>
              <div className="input-with-icon">
                <Phone size={16} />
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>
            </label>
            <label>
              <span>District *</span>
              <div className="input-with-icon">
                <MapPin size={16} />
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                >
                  {districts.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="field-grid">
            <label>
              <span>Category *</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Urgency *</span>
              <select
                value={form.urgency}
                onChange={(e) =>
                  setForm({ ...form, urgency: e.target.value as ComplaintFormData['urgency'] })
                }
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>

          <label>
            <span>Title *</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short summary of the issue"
            />
          </label>

          <label>
            <span>Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Explain the problem, location, and any key details"
              rows={5}
            />
          </label>

          <button type="submit" className="primary-btn">
            <Send size={18} />
            Submit Complaint
          </button>
        </form>

        <div className="complaint-card recent-card">
          <div className="section-title">Your {getUserRole()} Complaints</div>
          {recent.length === 0 && <p className="muted">No complaints submitted yet.</p>}
          <div className="recent-list">
            {recent.slice(0, 5).map(item => (
              <div key={item.id} className="recent-item">
                <div className="recent-top">
                  <div>
                    <p className="recent-title">{item.title}</p>
                    <p className="recent-meta">
                      {item.category} • {item.district}
                    </p>
                  </div>
                  <div className="pills-group">
                    <span className={`pill ${item.urgency.toLowerCase()}`}>
                      {item.urgency}
                    </span>
                    <span
                      className={`pill status-${item.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {item.status === 'Resolved' && <CheckCircle size={12} />}
                      {item.status === 'In Review' && <Clock size={12} />}
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="recent-desc">
                  {item.description.slice(0, 120)}
                  {item.description.length > 120 ? '…' : ''}
                </p>

                {item.replies && item.replies.length > 0 && (
                  <div className="replies-section">
                    <p className="replies-title">
                      <MessageCircle size={14} /> Government Response
                    </p>
                    {item.replies.map(reply => (
                      <div key={reply.id} className="reply-item">
                        <p className="reply-message">{reply.message}</p>
                        <p className="reply-meta">
                          — {reply.respondedBy} •{' '}
                          {new Date(reply.respondedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="recent-footer">
                  <span className="pill light">{item.role}</span>
                  <span className="recent-meta">
                    Submitted {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="note">
            Complaints are reviewed by government officials. Check back for responses.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;
