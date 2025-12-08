import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { Mail, Lock, CheckCircle2, ArrowLeft, Eye, EyeOff, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

interface FeatureItemProps {
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ text }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
      <div style={{ marginTop: '0.15rem', flexShrink: 0, width: '1.1rem', height: '1.1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem', color: '#bfdbfe' }} />
      </div>
      <span style={{ color: '#eff6ff', fontWeight: 500, fontSize: '0.925rem' }}>{text}</span>
    </div>
  );
};

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage, translateBulk } = useLanguage();

  const from = location.state?.from?.pathname || '/dashboard';

  // Translation effect
  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setTranslatedContent({});
        return;
      }
      
      const textsToTranslate = [
        'Sign in to your account',
        'Welcome back! Enter your credentials to continue',
        'Email address',
        'Password',
        'Remember me',
        'Forgot password?',
        'Sign In',
        'Signing in...',
        'Don\'t have an account?',
        'Create account',
        'Or continue with',
        'Demo Accounts',
        'Try the platform without creating an account',
        'Community Health & Wellness Platform',
        'Join thousands of users monitoring their health and environment in real-time.',
        'Real-time health data monitoring',
        'Community-driven communication',
        'Water quality analysis & tracking',
        'Disease & symptom rapid reporting',
        'Login successful!',
        'Login failed! Check credentials.',
        'System Administrator',
        'Full system access and management',
        'ASHA Worker',
        'Community health worker access',
        'Government Official',
        'Policy and administrative access',
        'Community User',
        'Report symptoms and view alerts',
        'Back to Home'
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

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  const roleToRoute = (role?: string) => {
    return '/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Login attempt with:', email);
      const ok = await login(email, password);
      console.log('Login result:', ok);
      if (!ok) {
        message.error('Login failed! Check credentials.');
        return;
      }

      const stored = localStorage.getItem('paanicare-user');
      console.log('Stored user:', stored);
      const clientUser = stored ? JSON.parse(stored) : null;
      const role = clientUser?.role || 'community_user';

      const dest = from && from !== '/login' ? from : '/dashboard';
      console.log('Navigating to:', dest);
      message.success('Login successful!');
      navigate(dest, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    try {
      const demoCredentials: Record<string, { email: string; password: string }> = {
        admin: { email: 'admin@paanicare.com', password: 'admin123' },
        asha_worker: { email: 'asha@paanicare.com', password: 'asha123' },
        government_body: { email: 'government@paanicare.com', password: 'government123' },
        community_user: { email: 'user@paanicare.com', password: 'user123' }
      };

      const credentials = demoCredentials[role];
      if (!credentials) {
        message.error('Invalid demo role');
        return;
      }

      setEmail(credentials.email);
      setPassword(credentials.password);

      const ok = await login(credentials.email, credentials.password);
      if (!ok) {
        message.error('Demo login failed.');
        return;
      }

      const target = roleToRoute(role);
      message.success(`Logged in as ${role.replace(/_/g, ' ')}`);
      navigate(target, { replace: true });
    } catch (error) {
      message.error('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToDemo = (index: number) => {
    const newIndex = Math.max(0, Math.min(index, demoAccounts.length - 1));
    setSelectedDemoIndex(newIndex);
  };

  const demoAccounts = [
    { role: 'admin', title: translatedContent['System Administrator'] || 'System Administrator', description: translatedContent['Full system access and management'] || 'Full system access and management', color: '#ef4444' },
    { role: 'asha_worker', title: translatedContent['ASHA Worker'] || 'ASHA Worker', description: translatedContent['Community health worker access'] || 'Community health worker access', color: '#22c55e' },
    { role: 'government_body', title: translatedContent['Government Official'] || 'Government Official', description: translatedContent['Policy and administrative access'] || 'Policy and administrative access', color: '#ec4899' },
    { role: 'community_user', title: translatedContent['Community User'] || 'Community User', description: translatedContent['Report symptoms and view alerts'] || 'Report symptoms and view alerts', color: '#06b6d4' }
  ];

  return (
    <div className="login-page-new" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
      
      {/* LEFT PANEL - BRANDING & INFO */}
      <div 
        className="login-left-panel" 
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
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, marginBottom: '2rem', paddingLeft: 0 }}>
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
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, paddingLeft: 0 }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 0.75rem 0' }}>
            {translatedContent['Community Health & Wellness Platform'] || 'Community Health'} <br /> {translatedContent['Community Health & Wellness Platform'] ? '' : '& Wellness Platform'}
          </h2>
          <p style={{ color: '#bfdbfe', marginBottom: '1.5rem', fontSize: '1rem', maxWidth: '24rem', margin: '0 0 1.5rem 0' }}>
            {translatedContent['Join thousands of users monitoring their health and environment in real-time.'] || 'Join thousands of users monitoring their health and environment in real-time.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FeatureItem text={translatedContent['Real-time health data monitoring'] || 'Real-time health data monitoring'} />
            <FeatureItem text={translatedContent['Community-driven communication'] || 'Community-driven communication'} />
            <FeatureItem text={translatedContent['Water quality analysis & tracking'] || 'Water quality analysis & tracking'} />
            <FeatureItem text={translatedContent['Disease & symptom rapid reporting'] || 'Disease & symptom rapid reporting'} />
          </div>
        </div>

        {/* Copyright - Fixed at bottom */}
        <div style={{ position: 'relative', zIndex: 10, fontSize: '0.8rem', color: '#93c5fd', flexShrink: 0, marginTop: 'auto', paddingTop: '1rem', paddingLeft: 0 }}>
          © 2025 Nirogya Platform. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div 
        className="login-right-panel" 
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
        <div style={{ maxWidth: '24rem', width: '100%', margin: '0 auto' }}>
          
          <button 
            onClick={() => navigate('/')}
            className="login-back-btn"
            style={{ display: 'flex', alignItems: 'center', color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {translatedContent['Back to Home'] || 'Back to Home'}
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{translatedContent['Sign in to your account'] || 'Welcome Back'}</h2>
            <p className="text-slate-500">
              {translatedContent['Welcome back! Enter your credentials to continue'] || 'Please enter your details to sign in to your account.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
                {translatedContent['Email address'] || 'Email Address'}
              </label>
              <div className="relative group">
                <div className="login-input-icon absolute left-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="login-input-field w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
                {translatedContent['Password'] || 'Password'}
              </label>
              <div className="relative group">
                <div className="login-input-icon absolute left-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="login-input-field w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle absolute right-0 top-0 h-full w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="login-checkbox w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                  <svg
                    className="absolute left-0 w-5 h-5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{translatedContent['Remember me'] || 'Remember me'}</span>
              </label>
              
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                {translatedContent['Forgot password?'] || 'Forgot password?'}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.98] transition-all duration-200 cursor-pointer border-none"
            >
              {loading ? (translatedContent['Signing in...'] || 'Signing In...') : (translatedContent['Sign In'] || 'Sign In')}
            </button>

            {/* Demo Account Carousel Section */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Users style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{translatedContent['Demo Accounts'] || 'Try Demo Account'}</span>
              </div>
              
              {/* Carousel Container */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0'
              }}>
                {/* Up Arrow */}
                <button
                  type="button"
                  onClick={() => scrollToDemo(selectedDemoIndex - 1)}
                  disabled={selectedDemoIndex === 0 || loading}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    backgroundColor: selectedDemoIndex === 0 ? '#f1f5f9' : '#e2e8f0',
                    border: 'none',
                    cursor: selectedDemoIndex === 0 ? 'not-allowed' : 'pointer',
                    color: selectedDemoIndex === 0 ? '#cbd5e1' : '#475569',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <ChevronUp style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>

                {/* Carousel Window */}
                <div 
                  ref={carouselRef}
                  style={{ 
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    height: '4.5rem'
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translateY(-${selectedDemoIndex * 4.5}rem)`
                  }}>
                    {demoAccounts.map((demo, index) => (
                      <div
                        key={demo.role}
                        onClick={() => !loading && setSelectedDemoIndex(index)}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          height: '4.5rem',
                          boxSizing: 'border-box',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          backgroundColor: index === selectedDemoIndex ? 'white' : 'transparent',
                          borderRadius: '0.5rem',
                          border: index === selectedDemoIndex ? '2px solid #2563eb' : '2px solid transparent',
                          transition: 'all 0.2s ease',
                          opacity: index === selectedDemoIndex ? 1 : 0.5
                        }}
                      >
                        <div style={{ 
                          width: '2.5rem', 
                          height: '2.5rem', 
                          borderRadius: '50%', 
                          backgroundColor: demo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0,
                          boxShadow: index === selectedDemoIndex ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}>
                          {demo.title.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>{demo.title}</p>
                          <p style={{ 
                            margin: '0.125rem 0 0 0', 
                            fontSize: '0.75rem', 
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>{demo.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Down Arrow */}
                <button
                  type="button"
                  onClick={() => scrollToDemo(selectedDemoIndex + 1)}
                  disabled={selectedDemoIndex === demoAccounts.length - 1 || loading}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    backgroundColor: selectedDemoIndex === demoAccounts.length - 1 ? '#f1f5f9' : '#e2e8f0',
                    border: 'none',
                    cursor: selectedDemoIndex === demoAccounts.length - 1 ? 'not-allowed' : 'pointer',
                    color: selectedDemoIndex === demoAccounts.length - 1 ? '#cbd5e1' : '#475569',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <ChevronDown style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              {/* Demo Login Button */}
              <button
                type="button"
                onClick={() => handleDemoLogin(demoAccounts[selectedDemoIndex].role)}
                disabled={loading}
                style={{ 
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: demoAccounts[selectedDemoIndex].color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? (translatedContent['Signing in...'] || 'Signing In...') : `Login as ${demoAccounts[selectedDemoIndex].title}`}
              </button>

              {/* Dots Indicator */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.375rem', 
                marginTop: '0.75rem' 
              }}>
                {demoAccounts.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDemoIndex(index)}
                    style={{ 
                      width: index === selectedDemoIndex ? '1.25rem' : '0.375rem',
                      height: '0.375rem',
                      borderRadius: '0.25rem',
                      backgroundColor: index === selectedDemoIndex ? '#2563eb' : '#cbd5e1',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-slate-600 mt-8">
              {translatedContent["Don't have an account?"] || "Don't have an account?"}{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                {translatedContent['Create account'] || 'Create one now'}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
