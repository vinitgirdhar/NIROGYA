import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Dropdown, Space, Avatar } from 'antd';
import { 
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  CloseOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '../contexts/LanguageContext';
import './HomeNavbar.css';

const { Header } = Layout;

const HomeNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const translateRef = useRef<HTMLDivElement>(null);
  const mobileTranslateRef = useRef<HTMLDivElement>(null);

  // Initialize Google Translate
  useEffect(() => {
    // Add Google Translate script if not already loaded
    const addGoogleTranslateScript = () => {
      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Define the callback function
    (window as any).googleTranslateElementInit = () => {
      if (translateRef.current && !(window as any).googleTranslateInitialized) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,ne,ta,te,mr,gu,kn,ml,pa,as,or',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_navbar'
        );
        (window as any).googleTranslateInitialized = true;
      }
    };

    addGoogleTranslateScript();

    // If script already loaded, initialize
    if ((window as any).google && (window as any).google.translate) {
      (window as any).googleTranslateElementInit();
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: 'Profile',
        icon: <UserOutlined />,
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  const navItems = [
    { key: 'home', label: t('nav.home'), path: '/' },
    { key: 'map', label: t('nav.map'), path: '/map' },
    { key: 'gallery', label: t('nav.gallery'), path: '/gallery' },
    { key: 'news', label: t('nav.news'), path: '/news' },
    { key: 'about', label: t('nav.about'), path: '/about' },
    { key: 'contact', label: t('nav.contact'), path: '/contact' },
    { key: 'emergency', label: 'Emergency Service', path: '/emergency-contacts' },
  ];

  const handleNavClick = (path: string) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <Header className={`home-navbar ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img 
            src="/images/nirogya_logo.png" 
            alt="Nirogya Logo" 
            className="brand-logo-img"
            style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="brand-text">
            <span className="brand-name">Nirogya</span>
            <span className="brand-tagline">Health Surveillance</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="navbar-nav desktop-nav">
          {navItems.map((item) => (
            <Button
              key={item.key}
              type="text"
              className={`nav-link ${isActiveRoute(item.path) ? 'nav-link-active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions desktop-actions">
          <Space size="middle">
            {/* Google Translate Widget */}
            <div className="google-translate-container" ref={translateRef}>
              <GlobalOutlined className="translate-icon" />
              <div id="google_translate_navbar"></div>
            </div>
            
            <Button 
              type="text" 
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? t('theme.light') : t('theme.dark')}
            />
            
            {isAuthenticated ? (
              <>
                <Button 
                  type="text"
                  onClick={() => navigate('/dashboard')}
                  className="dashboard-btn"
                >
                  {t('nav.dashboard')}
                </Button>
                <Dropdown menu={userMenu} placement="bottomRight">
                  <Button type="text" className="user-menu-trigger">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <span className="username">{user?.name?.split(' ')[0] || 'User'}</span>
                    </Space>
                  </Button>
                </Dropdown>
              </>
            ) : (
              <Space>
                <Button 
                  type="text"
                  onClick={() => navigate('/login')}
                  className="login-btn"
                >
                  {t('action.login')}
                </Button>
                <Button 
                  type="primary"
                  onClick={() => navigate('/register')}
                  className="register-btn"
                >
                  {t('action.register')}
                </Button>
              </Space>
            )}
          </Space>
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          type="text"
          icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-toggle"
        />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-nav">
            {navItems.map((item) => (
              <Button
                key={item.key}
                type="text"
                block
                className={`mobile-nav-link ${isActiveRoute(item.path) ? 'mobile-nav-link-active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          
          <div className="mobile-actions">
            {/* Mobile Language Note */}
            <div className="mobile-language-note">
              <GlobalOutlined />
              <span>Use the language selector in the navbar above to translate</span>
            </div>
            
            <Button 
              type="text" 
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              block
              className="mobile-theme-toggle"
            >
              {isDark ? t('theme.light') : t('theme.dark')}
            </Button>
            
            {isAuthenticated ? (
              <>
                <Button 
                  type="text"
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  block
                  className="mobile-dashboard-btn"
                >
                  {t('nav.dashboard')}
                </Button>
                <Button 
                  type="text"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  block
                  className="mobile-logout-btn"
                >
                  {t('action.logout')} ({user?.name?.split(' ')[0]})
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="text"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  block
                  className="mobile-login-btn"
                >
                  {t('action.login')}
                </Button>
                <Button 
                  type="primary"
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  block
                  className="mobile-register-btn"
                >
                  {t('action.register')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Header>
  );
};

export default HomeNavbar;