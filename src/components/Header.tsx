import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, Space, Avatar } from 'antd';
import { 
  DashboardOutlined, 
  GlobalOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';
import { useLanguage, languages } from '../contexts/LanguageContext';
import './Header.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentLanguage, setLanguage, t, translate } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [translatedLabels, setTranslatedLabels] = useState<Record<string, string>>({});

  // Translate dynamic labels
  useEffect(() => {
    const translateLabels = async () => {
      const labels = ['Profile', 'Settings', 'Logout', 'Health Surveillance System'];
      const translated: Record<string, string> = {};
      for (const label of labels) {
        translated[label] = await translate(label);
      }
      setTranslatedLabels(translated);
    };
    translateLabels();
  }, [currentLanguage.code, translate]);

  const changeLanguage = (langCode: string) => {
    const lang = languages.find(l => l.code === langCode);
    if (lang) setLanguage(lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const languageMenu = {
    items: languages.map(lang => ({
      key: lang.code,
      label: `${lang.flag} ${lang.nativeName}`,
      onClick: () => changeLanguage(lang.code),
    })),
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: translatedLabels['Profile'] || 'Profile',
        icon: <UserOutlined />,
        onClick: () => navigate('/profile'),
      },
      {
        key: 'settings',
        label: translatedLabels['Settings'] || 'Settings',
        icon: <SettingOutlined />,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        label: translatedLabels['Logout'] || 'Logout',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <AntHeader className="app-header">
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <DashboardOutlined /> : <DashboardOutlined />}
          onClick={onToggleCollapse}
          className="sidebar-trigger"
        />
        <div className="app-title">
          <span className="app-name">Nirogya</span>
          <span className="app-subtitle">{translatedLabels['Health Surveillance System'] || 'Health Surveillance System'}</span>
        </div>
      </div>
      
      <div className="header-right">
        <Space size="middle">
          <Button 
            type="text" 
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            className="theme-toggle"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          />
          
          <Dropdown menu={languageMenu} placement="bottomRight">
            <Button type="text" icon={<GlobalOutlined />}>
              {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
            </Button>
          </Dropdown>
          
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" className="user-menu-trigger">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="username">{user?.name || 'User'}</span>
              </Space>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;