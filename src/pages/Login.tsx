import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { Mail, Lock, CheckCircle2, ArrowLeft, Eye, EyeOff, Droplets } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

interface FeatureItemProps {
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ text }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
      </div>
      <span className="text-blue-50 font-medium">{text}</span>
    </div>
  );
};

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

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
        volunteer: { email: 'volunteer@paanicare.com', password: 'volunteer123' },
        healthcare_worker: { email: 'healthcare@paanicare.com', password: 'healthcare123' },
        district_health_official: { email: 'district@paanicare.com', password: 'district123' },
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

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    message.info("Google login coming soon!");
  };

  const demoAccounts = [
    { role: 'admin', title: 'System Administrator', description: 'Full system access and management', color: '#ef4444' },
    { role: 'asha_worker', title: 'ASHA Worker', description: 'Community health worker access', color: '#22c55e' },
    { role: 'volunteer', title: 'Community Volunteer', description: 'Volunteer coordination and support', color: '#3b82f6' },
    { role: 'healthcare_worker', title: 'Healthcare Professional', description: 'Medical staff access and tools', color: '#a855f7' },
    { role: 'district_health_official', title: 'District Health Official', description: 'Regional health oversight', color: '#f97316' },
    { role: 'government_body', title: 'Government Official', description: 'Policy and administrative access', color: '#ec4899' },
    { role: 'community_user', title: 'Community User', description: 'Report symptoms and view alerts', color: '#06b6d4' }
  ];

  return (
    <div className="login-page-new min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-slate-800">
      
      {/* LEFT PANEL - BRANDING & INFO */}
      <div className="login-left-panel w-full md:w-1/2 lg:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white mix-blend-overlay blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-400 mix-blend-overlay blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Nirogya</h1>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-center flex-grow py-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Community Health <br /> & Wellness Platform
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-md">
            Join thousands of users monitoring their health and environment in real-time.
          </p>

          <div className="space-y-4">
            <FeatureItem text="Real-time health data monitoring" />
            <FeatureItem text="Community-driven communication" />
            <FeatureItem text="Water quality analysis & tracking" />
            <FeatureItem text="Disease & symptom rapid reporting" />
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          © 2025 Nirogya Platform. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="login-right-panel w-full md:w-1/2 lg:w-7/12 bg-white p-6 md:p-12 lg:p-20 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          
          <button 
            onClick={() => navigate('/')}
            className="login-back-btn flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-8 text-sm font-medium bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">
              Please enter your details to sign in to your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block" htmlFor="email">
                Email Address
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
                Password
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
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.98] transition-all duration-200 cursor-pointer border-none"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login-google-btn w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>

            {/* Demo Accounts Section */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="login-demo-toggle w-full text-center text-sm text-slate-500 hover:text-blue-600 font-medium py-2 transition-colors bg-transparent border-none cursor-pointer"
              >
                {showDemo ? '▲ Hide Demo Accounts' : '▼ Try Demo Accounts'}
              </button>

              {showDemo && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {demoAccounts.map((demo) => (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleDemoLogin(demo.role)}
                      disabled={loading}
                      className="login-demo-card w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-3 transition-colors cursor-pointer border border-slate-200 text-left disabled:opacity-50"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: demo.color }}
                      >
                        {demo.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{demo.title}</p>
                        <p className="text-xs text-slate-500 truncate">{demo.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-sm text-slate-600 mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create one now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
