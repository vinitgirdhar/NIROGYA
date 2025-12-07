// src/pages/Register.tsx
import React, { useState } from 'react';
import { message } from 'antd';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Shield,
  Users,
  Heart,
  Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

interface FeatureItemProps {
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ text }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <div style={{ marginTop: '0.15rem', flexShrink: 0, width: '1.1rem', height: '1.1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem', color: '#bfdbfe' }} />
      </div>
      <span style={{ color: '#eff6ff', fontWeight: 500, fontSize: '0.9rem' }}>{text}</span>
    </div>
  );
};

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization?: string;
  location?: string;
  phone?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    location: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      message.error('Please enter your name');
      return;
    }
    
    if (formData.name.trim().length < 2) {
      message.error('Name must be at least 2 characters');
      return;
    }
    
    if (!formData.email || !formData.email.trim()) {
      message.error('Please enter your email');
      return;
    }
    
    if (!formData.password) {
      message.error('Please enter a password');
      return;
    }
    
    if (formData.password.length < 6) {
      message.error('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.confirmPassword) {
      message.error('Please confirm your password');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting registration with data:", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: '[HIDDEN]',
        confirmPassword: '[HIDDEN]',
        role: 'community_user',
        organization: formData.organization?.trim() || '',
        location: formData.location?.trim() || '',
        phone: formData.phone?.trim() || '',
      });
      
      const success = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'community_user',
        organization: formData.organization?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      });

      if (success) {
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        message.error('Registration failed. Please check the form and try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
      
      {/* LEFT PANEL - BRANDING & INFO */}
      <div 
        style={{ 
          width: '42%', 
          background: 'linear-gradient(to bottom right, #2563eb, #4338ca)', 
          color: 'white', 
          padding: '2rem 2.5rem 2rem 4rem',
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative', 
          overflow: 'hidden',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', opacity: 0.1, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-6rem', left: '-6rem', width: '24rem', height: '24rem', borderRadius: '50%', backgroundColor: 'white', filter: 'blur(64px)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20rem', height: '20rem', borderRadius: '50%', backgroundColor: '#60a5fa', filter: 'blur(64px)' }}></div>
        </div>

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="/images/nirogya_logo.png" 
              alt="Nirogya Logo" 
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Nirogya</h1>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 0.75rem 0' }}>
            Join Our Health <br /> Community Today
          </h2>
          <p style={{ color: '#bfdbfe', marginBottom: '1.5rem', fontSize: '1rem', maxWidth: '24rem', margin: '0 0 1.5rem 0' }}>
            Create your account and start contributing to community health monitoring.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FeatureItem text="Report health issues in your area" />
            <FeatureItem text="Get real-time health alerts" />
            <FeatureItem text="Connect with healthcare workers" />
            <FeatureItem text="Access water quality data" />
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users style={{ width: '1.25rem', height: '1.25rem', color: '#93c5fd' }} />
              <span style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>10K+ Users</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield style={{ width: '1.25rem', height: '1.25rem', color: '#93c5fd' }} />
              <span style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>Secure</span>
            </div>
          </div>
        </div>

        {/* Copyright - Fixed at bottom */}
        <div style={{ position: 'relative', zIndex: 10, fontSize: '0.8rem', color: '#93c5fd', flexShrink: 0, marginTop: 'auto', paddingTop: '1rem' }}>
          © 2025 Nirogya Platform. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - REGISTER FORM */}
      <div 
        style={{ 
          width: '58%', 
          backgroundColor: 'white', 
          padding: '2.5rem 4rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          overflowY: 'auto'
        }}
      >
        <div style={{ maxWidth: '26rem', width: '100%', margin: '0 auto' }}>
          
          <button 
            onClick={() => navigate('/login')}
            style={{ display: 'flex', alignItems: 'center', color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Back to Login
          </button>

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>Create Account</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
              Fill in your details to get started with Nirogya.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                  <User style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                  <Mail style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Password Row */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Password */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                Organization <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                  <Building2 style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <input
                  type="text"
                  name="organization"
                  placeholder="Your organization name"
                  value={formData.organization}
                  onChange={handleChange}
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Location & Phone Row */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Location */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Location <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                    <MapPin style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <input
                    type="text"
                    name="location"
                    placeholder="City, State"
                    value={formData.location}
                    onChange={handleChange}
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Phone <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Phone style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91-XXXXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: loading ? '#93c5fd' : '#2563eb', 
                color: 'white', 
                fontWeight: 700, 
                padding: '0.875rem 1.5rem', 
                borderRadius: '0.5rem', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontSize: '1rem',
                marginTop: '1.25rem',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#475569', marginTop: '1.5rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;