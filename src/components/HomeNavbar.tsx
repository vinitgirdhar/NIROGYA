import React, { useState } from 'react';
import { Layout, Button, Dropdown, Space, Avatar } from 'antd';
import { 
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  CloseOutlined,
  GlobalOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';
import { useLanguage, languages } from '../contexts/LanguageContext';
import './HomeNavbar.css';

const { Header } = Layout;

const HomeNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Group languages by region for better organization
  const languageGroups = [
    {
      label: 'Primary Languages',
      options: languages.filter(lang => ['en', 'hi'].includes(lang.code))
    },
    {
      label: 'Northeast Indian Languages',
      options: languages.filter(lang => 
        ['as', 'bn', 'bpy', 'mni', 'kha', 'grt', 'lus', 'nag', 'sck', 'bo', 'ne', 'dz'].includes(lang.code)
      )
    },
    {
      label: 'Other Indian Languages',
      options: languages.filter(lang => 
        ['te', 'ta', 'kn', 'ml', 'gu', 'mr', 'pa', 'or', 'ur'].includes(lang.code)
      )
    },
    {
      label: 'International Languages',
      options: languages.filter(lang => 
        ['zh', 'my', 'th', 'vi'].includes(lang.code)
      )
    }
  ];

  const languageMenu = {
    items: languageGroups.flatMap(group => [
      {
        type: 'group' as const,
        label: group.label,
        children: group.options.map(lang => ({
          key: lang.code,
          label: (
            <div className="language-option">
              <span className="language-flag">{lang.flag}</span>
              <div className="language-names">
                <span className="language-name">{lang.name}</span>
                <span className="language-native">{lang.nativeName}</span>
              </div>
              <span className="language-region">{lang.region}</span>
            </div>
          ),
          onClick: () => setLanguage(lang),
        }))
      }
    ])
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
          <div className="brand-icon">
            <div className="water-drop"></div>
          </div>
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
            {/* Language Selector */}
            <Dropdown menu={languageMenu} placement="bottomRight" trigger={['click']}>
              <Button type="text" className="language-selector">
                <Space size="small">
                  <GlobalOutlined />
                  <span className="current-lang-flag">{currentLanguage.flag}</span>
                  <span className="current-lang-name">{currentLanguage.name}</span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
            
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
            {/* Mobile Language Selector */}
            <div className="mobile-language-selector">
              <Button 
                type="text"
                block
                className="mobile-language-toggle"
                icon={<GlobalOutlined />}
              >
                <Space>
                  <span>{currentLanguage.flag}</span>
                  <span>{t('language.select')}</span>
                </Space>
              </Button>
              <div className="mobile-language-grid">
                {languages.slice(0, 8).map((lang) => (
                  <Button
                    key={lang.code}
                    type="text"
                    size="small"
                    className={`mobile-lang-option ${currentLanguage.code === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <div className="mobile-lang-content">
                      <span className="lang-flag">{lang.flag}</span>
                      <span className="lang-name">{lang.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
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