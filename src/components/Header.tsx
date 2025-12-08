import React from 'react';
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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ThemeProvider';
import './Header.css';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const { i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const languageMenu = {
    items: [
      {
        key: 'en',
        label: 'English',
        onClick: () => changeLanguage('en'),
      },
      {
        key: 'hi',
        label: 'हिंदी',
        onClick: () => changeLanguage('hi'),
      },
    ],
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: 'Profile',
        icon: <UserOutlined />,
        onClick: () => navigate('/profile'),
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
          <span className="app-subtitle">Health Surveillance System</span>
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
              {i18n.language.toUpperCase()}
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