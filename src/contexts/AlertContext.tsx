// src/contexts/AlertContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notification } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import AlertNotificationPopup from '../components/AlertNotificationPopup';
import OutbreakAlertPopup from '../components/OutbreakAlertPopup';
import { useAuth } from './AuthContext';

interface WaterAlert {
  id: string;
  region: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_by: string;
  created_by_role?: string;
  created_at: string;
  status: string;
  emails_sent?: number;
}

// Outbreak alert interface matching backend response
export interface OutbreakAlert {
  id: string;
  district: string;
  areaName: string;
  disease: string;
  totalPredictions: number;
  latestPredictionDate: string;
  coordinates: [number, number] | null;
  color: 'red' | 'yellow' | 'green';
  severity: 'high' | 'medium' | 'low';
  status: string;
  source?: string;
}

interface AlertContextType {
  alerts: WaterAlert[];
  unreadCount: number;
  latestAlert: WaterAlert | null;
  fetchAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  isLoading: boolean;
  // Outbreak alerts
  outbreakAlerts: OutbreakAlert[];
  outbreakUnreadCount: number;
  latestOutbreakAlert: OutbreakAlert | null;
  fetchOutbreakAlerts: () => Promise<void>;
  acknowledgeOutbreakAlert: (alertId: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const POLL_INTERVAL = 30000; // Check for new alerts every 30 seconds
const OUTBREAK_POLL_INTERVAL = 60000; // Check for outbreaks every 60 seconds

// Helper function to check if user's location matches an outbreak area
const isUserInOutbreakZone = (
  userLocation: string | undefined,
  userDistrict: string | undefined,
  outbreak: OutbreakAlert
): boolean => {
  const loc = (userLocation || '').toLowerCase().trim();
  const dist = (userDistrict || '').toLowerCase().trim();
  const outbreakDist = (outbreak.district || '').toLowerCase().trim();
  const outbreakArea = (outbreak.areaName || '').toLowerCase().trim();
  
  // Check for various matches
  if (loc && outbreakDist && loc.includes(outbreakDist)) return true;
  if (loc && outbreakArea && loc.includes(outbreakArea)) return true;
  if (dist && outbreakDist && (dist.includes(outbreakDist) || outbreakDist.includes(dist))) return true;
  if (loc && outbreakArea && outbreakArea.includes(loc)) return true;
  if (dist && outbreakArea && outbreakArea.includes(dist)) return true;
  
  return false;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WaterAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAlert, setLatestAlert] = useState<WaterAlert | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nirogya-acknowledged-alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem('nirogya-last-alert-check');
      return saved ? new Date(saved) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago
    } catch {
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  });

  // Outbreak alerts state
  const [outbreakAlerts, setOutbreakAlerts] = useState<OutbreakAlert[]>([]);
  const [outbreakUnreadCount, setOutbreakUnreadCount] = useState(0);
  const [latestOutbreakAlert, setLatestOutbreakAlert] = useState<OutbreakAlert | null>(null);
  const [showOutbreakPopup, setShowOutbreakPopup] = useState(false);
  const [acknowledgedOutbreakAlerts, setAcknowledgedOutbreakAlerts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nirogya-acknowledged-outbreak-alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [lastOutbreakCheckTime, setLastOutbreakCheckTime] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem('nirogya-last-outbreak-check');
      return saved ? new Date(saved) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    } catch {
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  });

  const fetchAlerts = useCallback(async () => {
    const token = localStorage.getItem('nirogya-token') || localStorage.getItem('paanicare-token');
    
    // Don't fetch if no token or no user logged in
    if (!token || !user) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/alerts/list?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired or invalid, don't throw error, just return silently
        console.log('Alert fetch: unauthorized, skipping');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data: WaterAlert[] = await response.json();
      setAlerts(data);

      // Check for new alerts since last check
      const newAlerts = data.filter(alert => {
        const alertTime = new Date(alert.created_at);
        return alertTime > lastCheckedTime && !acknowledgedAlerts.has(alert.id);
      });

      // Update unread count
      const unread = data.filter(a => !acknowledgedAlerts.has(a.id)).length;
      setUnreadCount(unread);

      // Show popup for the newest unacknowledged high/critical alert
      if (newAlerts.length > 0) {
        const highPriorityAlert = newAlerts.find(
          a => (a.severity === 'high' || a.severity === 'critical') && !acknowledgedAlerts.has(a.id)
        );
        
        if (highPriorityAlert) {
          setLatestAlert(highPriorityAlert);
          setShowPopup(true);
        } else {
          // Show notification for lower priority alerts
          const newestAlert = newAlerts[0];
          notification.info({
            message: '📢 New Alert',
            description: `${newestAlert.title} - ${newestAlert.region}`,
            icon: <AlertOutlined style={{ color: '#1890ff' }} />,
            duration: 5,
            placement: 'topRight'
          });
        }
      }

      // Update last checked time
      const now = new Date();
      setLastCheckedTime(now);
      localStorage.setItem('nirogya-last-alert-check', now.toISOString());

    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastCheckedTime, acknowledgedAlerts]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      localStorage.setItem('nirogya-acknowledged-alerts', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Fetch outbreak alerts from prediction-outbreaks API
  const fetchOutbreakAlerts = useCallback(async () => {
    const token = localStorage.getItem('nirogya-token') || localStorage.getItem('paanicare-token');
    
    // Don't fetch if no token or no user logged in
    if (!token || !user) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/prediction-outbreaks?days=30&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired or invalid, don't throw error
        console.log('Outbreak fetch: unauthorized, skipping');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch outbreak alerts');
      }

      const data = await response.json();
      const allOutbreaks: OutbreakAlert[] = data.outbreaks || [];
      
      // Filter outbreaks that match user's location (for community users)
      const userLocation = user?.location;
      const userDistrict = user?.district;
      
      // For community users, filter to their location; for others, show all
      const relevantOutbreaks = user?.role === 'community_user' 
        ? allOutbreaks.filter(outbreak => isUserInOutbreakZone(userLocation, userDistrict, outbreak))
        : allOutbreaks;
      
      setOutbreakAlerts(relevantOutbreaks);

      // Check for new/unacknowledged outbreaks
      const unacknowledgedOutbreaks = relevantOutbreaks.filter(
        o => !acknowledgedOutbreakAlerts.has(o.id)
      );
      
      setOutbreakUnreadCount(unacknowledgedOutbreaks.length);

      // Show popup for high severity unacknowledged outbreaks (for community users)
      if (user?.role === 'community_user' && unacknowledgedOutbreaks.length > 0) {
        const highSeverityOutbreak = unacknowledgedOutbreaks.find(
          o => o.severity === 'high' && !acknowledgedOutbreakAlerts.has(o.id)
        );
        
        if (highSeverityOutbreak) {
          setLatestOutbreakAlert(highSeverityOutbreak);
          setShowOutbreakPopup(true);
        } else {
          // Show notification for medium severity outbreaks
          const mediumOutbreak = unacknowledgedOutbreaks.find(
            o => o.severity === 'medium' && !acknowledgedOutbreakAlerts.has(o.id)
          );
          if (mediumOutbreak) {
            setLatestOutbreakAlert(mediumOutbreak);
            setShowOutbreakPopup(true);
          }
        }
      }

      // Update last checked time
      const now = new Date();
      setLastOutbreakCheckTime(now);
      localStorage.setItem('nirogya-last-outbreak-check', now.toISOString());

    } catch (error) {
      console.error('Error fetching outbreak alerts:', error);
    }
  }, [user, acknowledgedOutbreakAlerts]);

  const acknowledgeOutbreakAlert = useCallback((alertId: string) => {
    setAcknowledgedOutbreakAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      localStorage.setItem('nirogya-acknowledged-outbreak-alerts', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setOutbreakUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Initial fetch - only when user is logged in
  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchOutbreakAlerts();
    }
  }, [user]);

  // Poll for new alerts - only when user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlerts, user]);

  // Poll for new outbreak alerts - only when user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchOutbreakAlerts, OUTBREAK_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOutbreakAlerts, user]);

  // Listen for visibility changes to fetch when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchAlerts();
        fetchOutbreakAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAlerts, fetchOutbreakAlerts, user]);

  return (
    <AlertContext.Provider 
      value={{ 
        alerts, 
        unreadCount, 
        latestAlert, 
        fetchAlerts, 
        acknowledgeAlert,
        isLoading,
        // Outbreak alerts
        outbreakAlerts,
        outbreakUnreadCount,
        latestOutbreakAlert,
        fetchOutbreakAlerts,
        acknowledgeOutbreakAlert
      }}
    >
      {children}
      
      {/* Global Water Alert Popup */}
      <AlertNotificationPopup
        alert={latestAlert}
        visible={showPopup}
        onClose={() => setShowPopup(false)}
        onAcknowledge={acknowledgeAlert}
      />

      {/* Global Outbreak Alert Popup */}
      <OutbreakAlertPopup
        outbreak={latestOutbreakAlert}
        visible={showOutbreakPopup}
        onClose={() => setShowOutbreakPopup(false)}
        onAcknowledge={acknowledgeOutbreakAlert}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext;
