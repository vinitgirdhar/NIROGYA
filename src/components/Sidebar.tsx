// src/components/Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Space, Badge, Tooltip } from 'antd';
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
  FileTextOutlined,
  MedicineBoxOutlined,
  FileProtectOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useTheme } from './ThemeProvider';
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
  const { t, translate, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const [translatedLabels, setTranslatedLabels] = useState<Record<string, string>>({});

  // Translate dynamic labels that don't have static translations
  useEffect(() => {
    const translateLabels = async () => {
      const labels = [
        'Disease Mapping', 'ASHA Communication', 'Report Water Quality',
        'Report Symptoms', 'Self Report Symptoms', 'Government Reports'
      ];
      const translated: Record<string, string> = {};
      for (const label of labels) {
        translated[label] = await translate(label);
      }
      setTranslatedLabels(translated);
    };
    translateLabels();
  }, [currentLanguage.code, translate]);

  const [settings, setSettings] = useState<SidebarSettings>(() => {
    const saved = localStorage.getItem('sidebarSettings');
    return saved ? JSON.parse(saved) : {
      // CHANGE 'light' TO 'blue' HERE
      theme: 'blue', 
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

  // Sync sidebar theme with global dark mode
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      theme: isDark ? 'dark' : 'blue'
    }));
  }, [isDark]);

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
  { key: '/', icon: <DashboardOutlined />, label: t('nav.home'), badge: 0 },
  { key: '/health', icon: <HeartOutlined />, label: t('nav.healthData'), badge: 0 },
  { key: '/water-quality', icon: <ExperimentOutlined />, label: t('nav.waterQuality'), badge: 0 },
  { key: '/disease-mapping', icon: <EnvironmentOutlined />, label: translatedLabels['Disease Mapping'] || 'Disease Mapping', badge: 0 },
  { key: '/asha-communication', icon: <MessageOutlined />, label: translatedLabels['ASHA Communication'] || 'ASHA Communication', badge: 0 },
  { key: '/ai-prediction', icon: <RobotOutlined />, label: translatedLabels['Report Water Quality'] || 'Report Water Quality', badge: 0 },
  { key: '/alerts', icon: <AlertOutlined />, label: t('nav.alerts'), badge: 0 },
  { key: '/report-symptoms', icon: <MedicineBoxOutlined />, label: translatedLabels['Report Symptoms'] || 'Report Symptoms', badge: 0 },
  { key: '/community', icon: <TeamOutlined />, label: t('nav.community'), badge: 0 },
  { key: '/education', icon: <BookOutlined />, label: t('nav.education'), badge: 0 },
  { key: '/reports', icon: <FileTextOutlined />, label: t('nav.reports'), badge: 0 },
  { key: '/goverment-reports', icon: <FileTextOutlined />, label: translatedLabels['Government Reports'] || 'Government Reports', badge: 0 },
  { key: '/self-report', icon: <MedicineBoxOutlined />, label: translatedLabels['Self Report Symptoms'] || 'Self Report Symptoms', badge: 0 },
  { key: '/manage-users', icon: <UserOutlined />, label: 'Manage Users', badge: 0 },
  { key: '/complaint-form', icon: <FileProtectOutlined />, label: 'Submit Complaint', badge: 0 },
  { key: '/complaints-management', icon: <FileProtectOutlined />, label: 'Complaints Management', badge: 0 },
  { key: '/accounts', icon: <SolutionOutlined />, label: 'Accounts', badge: 0 },
  { key: '/rainfall-alert', icon: <ThunderboltOutlined />, label: 'Rainfall Alerts', badge: 0 },
];


  // ---------------------------
  // Role-based allowed keys
  // ---------------------------
  const allowedKeysForRole = (role?: string): string[] => {
    const all = baseMenuItems.map(i => i.key);
    if (!role) return ['/','/community'];

    switch (role) {
      case 'admin':
        return all.filter(k => !['/government/manage-users', '/government/manage-accounts', '/self-report', '/community', '/complaints-management', '/complaint-form'].includes(k)).concat(['/accounts']);
      case 'asha_worker':
        // ASHA: dashboard, asha communication, report water, report symptoms, alerts, education, complaint form, rainfall alerts
        return ['/', '/asha-communication', '/ai-prediction', '/report-symptoms', '/alerts', '/education', '/complaint-form', '/rainfall-alert'];
      case 'community_user':
        return ['/', '/alerts', '/education', '/self-report', '/goverment-reports', '/complaint-form', '/rainfall-alert'];
      case 'healthcare_worker':
        return ['/', '/health', '/disease-mapping', '/alerts'];
      case 'district_health_official':
        return ['/', '/disease-mapping', '/health', '/alerts', '/reports'];
      case 'government_body':
        return all.filter(k => !['/asha-communication', '/ai-prediction', '/report-symptoms', '/self-report', '/community', '/complaint-form', '/reports'].includes(k)).concat(['/manage-users', '/complaints-management', '/accounts']);
      case 'volunteer':
        return ['/', '/community', '/report-symptoms', '/alerts', '/education'];
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
              <div className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.1em', fontWeight: 700, fontSize: 22 }}>
                <img src="/images/nirogya_logo.png" alt="Nirogya Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                <span style={{ paddingLeft: 0.1, paddingRight: 0.1, letterSpacing: '0.01em', fontFamily: 'inherit', fontWeight: 700 }}>Nirogya</span>
              </div>
            ) : (
              <img src="/images/nirogya_logo.png" alt="Nirogya Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            )}
          </div>
          {!collapsed && (
            <div className="header-actions">
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
              <Avatar size="large" icon={<UserOutlined />} src={user.avatar} className="user-avatar" />
              <div className="user-info" style={{ textAlign: 'center', width: '100%' }}>
                <Text strong className="user-name">{user.name}</Text>
                <Text type="secondary" className="user-role">{user.role}</Text>
              </div>
            </div>
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


    </>
  );
};

export default Sidebar;