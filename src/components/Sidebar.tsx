// src/components/Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Space, Badge, Tooltip, Switch, Slider, ColorPicker, Drawer, Divider } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  ExperimentOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HeartOutlined,
  AlertOutlined,
  RobotOutlined,
  StarOutlined,
  PushpinOutlined,
  ThunderboltOutlined,
  BookOutlined,
  CloudOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import './Sidebar.css';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

interface SidebarSettings {
  theme: 'light' | 'dark' | 'blue' | 'purple' | 'green';
  accentColor: string;
  fontSize: number;
  showIcons: boolean;
  showBadges: boolean;
  pinnedItems: string[];
  favoriteItems: string[];
  compactMode: boolean;
  animationLevel: number;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const [settings, setSettings] = useState<SidebarSettings>(() => {
    const saved = localStorage.getItem('sidebarSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      accentColor: '#1890ff',
      fontSize: 14,
      showIcons: true,
      showBadges: true,
      pinnedItems: ['/', '/dashboard'],
      favoriteItems: [],
      compactMode: false,
      animationLevel: 2
    };
  });

  useEffect(() => {
    localStorage.setItem('sidebarSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (key: keyof SidebarSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePin = (itemKey: string) => {
    setSettings(prev => (prev.pinnedItems.includes(itemKey)
      ? { ...prev, pinnedItems: prev.pinnedItems.filter(k => k !== itemKey) }
      : { ...prev, pinnedItems: [...prev.pinnedItems, itemKey] }
    ));
  };

  const toggleFavorite = (itemKey: string) => {
    setSettings(prev => (prev.favoriteItems.includes(itemKey)
      ? { ...prev, favoriteItems: prev.favoriteItems.filter(k => k !== itemKey) }
      : { ...prev, favoriteItems: [...prev.favoriteItems, itemKey] }
    ));
  };

  // Scroll fade handling
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const hasScrollTop = scrollTop > 10;
      const hasScrollBottom = scrollTop < scrollHeight - clientHeight - 10;
      const element = scrollContainerRef.current;

      if (hasScrollTop) element.classList.add('has-scroll-top'); else element.classList.remove('has-scroll-top');
      if (hasScrollBottom) element.classList.add('has-scroll-bottom'); else element.classList.remove('has-scroll-bottom');
    }
  };

  useEffect(() => {
    const checkScrollState = () => setTimeout(handleScroll, 100);
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [collapsed, settings]);

  // ---------------------------
  // Base menu items (modify labels or badges as needed)
  // ---------------------------
  const baseMenuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('nav.dashboard'), badge: 3 },
    { key: '/health', icon: <HeartOutlined />, label: t('nav.healthData'), badge: 0 },
    { key: '/water-quality', icon: <ExperimentOutlined />, label: t('nav.waterQuality'), badge: 2 },
    { key: '/disease-mapping', icon: <EnvironmentOutlined />, label: 'Disease Mapping', badge: 1 },
    { key: '/asha-communication', icon: <MessageOutlined />, label: 'ASHA Communication', badge: 5 },
    { key: '/ai-prediction', icon: <RobotOutlined />, label: 'Report Water Quality', badge: 0 },
    { key: '/alerts', icon: <AlertOutlined />, label: t('nav.alerts'), badge: 8 },
    { key: '/rainfall-alert', icon: <CloudOutlined />, label: 'Rainfall Alert', badge: 0 },
    { key: '/report-symptoms', icon: <MedicineBoxOutlined />, label: 'Report Symptoms', badge: 0 },
    { key: '/community', icon: <TeamOutlined />, label: t('nav.community'), badge: 0 },
    { key: '/education', icon: <BookOutlined />, label: t('nav.education'), badge: 0 },
    { key: '/reports', icon: <FileTextOutlined />, label: t('nav.reports'), badge: 0 },
    { key: '/goverment-reports', icon: <FileTextOutlined />, label: 'Goverment Reports', badge: 0 },
    { key: '/asha-worker', icon: <UserAddOutlined />, label: 'Apply for ASHA Worker', badge: 0 },
  ];

  // ---------------------------
  // Role-based allowed keys
  // ---------------------------
  const allowedKeysForRole = (role?: string): string[] => {
    const all = baseMenuItems.map(i => i.key);
    if (!role) return ['/','/community'];

    switch (role) {
      case 'admin':
        return all;
      case 'asha_worker':
        // ASHA: dashboard, asha communication, report water, report symptoms, alerts, rainfall alert, education, community
        return ['/', '/asha-communication', '/ai-prediction', '/report-symptoms', '/alerts', '/rainfall-alert', '/education', '/community'];
      case 'community_user':
        return ['/community', '/alerts', '/rainfall-alert', '/education', '/goverment-reports', '/asha-worker'];
      case 'healthcare_worker':
        return ['/', '/health', '/disease-mapping', '/alerts', '/rainfall-alert'];
      case 'district_health_official':
        return ['/', '/disease-mapping', '/health', '/alerts', '/rainfall-alert', '/reports'];
      case 'government_body':
        // everything except ASHA-specific items
        return all.filter(k => !['/asha-communication', '/ai-prediction', '/report-symptoms'].includes(k));
      case 'volunteer':
        return ['/', '/community', '/report-symptoms', '/alerts', '/rainfall-alert', '/education', '/goverment-reports', '/asha-worker'];
      default:
        
        return ['/'];
    }
  };

  // ---------------------------
  // Sort (pinned/favorites) then filter by role
  // ---------------------------
  const sortedMenuItems = [...baseMenuItems].sort((a, b) => {
    const aPinned = settings.pinnedItems.includes(a.key);
    const bPinned = settings.pinnedItems.includes(b.key);
    const aFavorite = settings.favoriteItems.includes(a.key);
    const bFavorite = settings.favoriteItems.includes(b.key);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (aFavorite && !bFavorite) return -1;
    if (!aFavorite && bFavorite) return 1;
    return 0;
  });

  const userRole = user?.role || 'community_user';
  const allowedKeys = allowedKeysForRole(userRole);
  const filteredMenuItems = sortedMenuItems.filter(item => allowedKeys.includes(item.key));

  const menuItems: MenuProps['items'] = filteredMenuItems.map(item => ({
    key: item.key,
    icon: settings.showIcons ? (
      <Space size={4}>
        {item.icon}
        {settings.pinnedItems.includes(item.key) && <PushpinOutlined style={{ fontSize: '10px' }} />}
        {settings.favoriteItems.includes(item.key) && <StarOutlined style={{ fontSize: '10px' }} />}
      </Space>
    ) : null,
    label: (
      <Space className="menu-item-content" style={{ width: '100%', justifyContent: 'space-between' }}>
        <span style={{ fontSize: settings.fontSize }}>{item.label}</span>
        <Space size={4}>
          {settings.showBadges && item.badge > 0 && (<Badge count={item.badge} size="small" />)}
          <div className="menu-item-actions">
            <Button
              type="text"
              size="small"
              icon={<StarOutlined />}
              className={`action-btn ${settings.favoriteItems.includes(item.key) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(item.key); }}
            />
            <Button
              type="text"
              size="small"
              icon={<PushpinOutlined />}
              className={`action-btn ${settings.pinnedItems.includes(item.key) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); togglePin(item.key); }}
            />
          </div>
        </Space>
      </Space>
    ),
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const sidebarStyle = {
    '--accent-color': settings.accentColor,
    '--font-size': `${settings.fontSize}px`,
    '--animation-duration': `${0.5 - (settings.animationLevel * 0.1)}s`,
  } as React.CSSProperties;

  return (
    <>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`app-sidebar ${settings.theme} ${settings.compactMode ? 'compact' : ''}`}
        style={sidebarStyle}
        width={280}
        collapsedWidth={80}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', display: 'flex', alignItems: 'center', minHeight: 48 }}>
            {!collapsed ? (
              <div className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '0.05px', letterSpacing: '0.1em', fontWeight: 700, fontSize: 22 }}>
                <span className="logo-icon" style={{ marginRight: 2 }}>💧</span>
                <span style={{ paddingLeft: 0.1, paddingRight: 0.1, letterSpacing: '0.01em', fontFamily: 'inherit', fontWeight: 700 }}>Nirogya</span>
              </div>
            ) : (
              <span className="logo-icon-collapsed">💧</span>
            )}
          </div>
          {!collapsed && (
            <div className="header-actions">
              <Tooltip title="Customize Sidebar">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setShowCustomization(true)}
                  className="customize-btn"
                />
              </Tooltip>
              <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => onCollapse(!collapsed)}
                  className="collapse-btn"
                />
              </Tooltip>
            </div>
          )}
        </div>

        {/* User Profile */}
        {!collapsed && user && (
          <div className="user-profile">
            <Avatar size="large" icon={<UserOutlined />} src={user.avatar} className="user-avatar" />
            <div className="user-info">
              <Text strong className="user-name">{user.name}</Text>
              <Text type="secondary" className="user-role">{user.role}</Text>
            </div>
            <Tooltip title="Logout">
              <Button type="text" icon={<LogoutOutlined />} onClick={logout} className="logout-btn" />
            </Tooltip>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="sidebar-scrollable-content" ref={scrollContainerRef} onScroll={handleScroll}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="sidebar-menu"
            inlineIndent={settings.compactMode ? 16 : 24}
          />

          {!collapsed && (
            <div className="quick-actions">
              <Tooltip title="Emergency Alert">
                <Button type="primary" danger icon={<ThunderboltOutlined />} className="emergency-btn" block>
                  Emergency
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </Sider>

      {/* Customization Drawer */}
      <Drawer
        title="Customize Sidebar"
        placement="right"
        onClose={() => setShowCustomization(false)}
        open={showCustomization}
        width={400}
        className="customization-drawer"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Theme</Text>
            <div className="theme-options">
              {['light', 'dark', 'blue', 'purple', 'green'].map(theme => (
                <Button key={theme} className={`theme-btn ${settings.theme === theme ? 'active' : ''}`} onClick={() => updateSettings('theme', theme)}>
                  {theme}
                </Button>
              ))}
            </div>
          </div>

          <Divider />

          <div>
            <Text strong>Accent Color</Text>
            <ColorPicker value={settings.accentColor} onChange={(color) => updateSettings('accentColor', color.toHexString())} showText />
          </div>

          <Divider />

          <div>
            <Text strong>Font Size: {settings.fontSize}px</Text>
            <Slider min={12} max={18} value={settings.fontSize} onChange={(value) => updateSettings('fontSize', value)} />
          </div>

          <Divider />

          <div>
            <Text strong>Display Options</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
              <div className="setting-row">
                <Text>Show Icons</Text>
                <Switch checked={settings.showIcons} onChange={(checked) => updateSettings('showIcons', checked)} />
              </div>
              <div className="setting-row">
                <Text>Show Badges</Text>
                <Switch checked={settings.showBadges} onChange={(checked) => updateSettings('showBadges', checked)} />
              </div>
              <div className="setting-row">
                <Text>Compact Mode</Text>
                <Switch checked={settings.compactMode} onChange={(checked) => updateSettings('compactMode', checked)} />
              </div>
            </Space>
          </div>

          <Divider />

          <div>
            <Text strong>Animation Level: {settings.animationLevel}</Text>
            <Slider min={0} max={3} value={settings.animationLevel} onChange={(value) => updateSettings('animationLevel', value)} marks={{0: 'None',1:'Low',2:'Medium',3:'High'}} />
          </div>

          <Divider />

          <Button type="default" block onClick={() => {
            const defaultSettings = {
              theme: 'light' as const,
              accentColor: '#1890ff',
              fontSize: 14,
              showIcons: true,
              showBadges: true,
              pinnedItems: ['/', '/dashboard'],
              favoriteItems: [],
              compactMode: false,
              animationLevel: 2
            };
            setSettings(defaultSettings);
          }}>
            Reset to Default
          </Button>
        </Space>
      </Drawer>
    </>
  );
};

export default Sidebar;
