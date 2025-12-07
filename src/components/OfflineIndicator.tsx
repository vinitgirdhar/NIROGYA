// src/components/OfflineIndicator.tsx
// Visual indicator for online/offline status and pending syncs

import React from 'react';
import { Badge, Tag, Tooltip, Space, Button, Spin } from 'antd';
import {
  WifiOutlined,
  CloudSyncOutlined,
  CloudOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useOfflineSync } from '../hooks/useOfflineSync';
import './OfflineIndicator.css';

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
  compact?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  showSyncButton = false,
  compact = false 
}) => {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, manualSync } = useOfflineSync();

  const handleManualSync = async () => {
    if (isOnline && pendingCount > 0) {
      await manualSync();
    }
  };

  const formatLastSync = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  if (compact) {
    return (
      <div className="offline-indicator compact">
        <Tooltip title={isOnline ? 'Online' : 'Offline - Reports will sync when connected'}>
          <Tag 
            color={isOnline ? 'green' : 'orange'} 
            icon={isOnline ? <WifiOutlined /> : <WarningOutlined />}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Tag>
        </Tooltip>
        {pendingCount > 0 && (
          <Tooltip title={`${pendingCount} report(s) pending sync`}>
            <Badge count={pendingCount} size="small">
              <Tag color="blue" icon={isSyncing ? <SyncOutlined spin /> : <CloudOutlined />}>
                {isSyncing ? 'Syncing...' : 'Pending'}
              </Tag>
            </Badge>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <Space size="middle" align="center">
        {/* Connection Status */}
        <div className="connection-status">
          {isOnline ? (
            <Tag color="green" icon={<WifiOutlined />}>
              Connected
            </Tag>
          ) : (
            <Tag color="orange" icon={<WarningOutlined />}>
              Offline Mode
            </Tag>
          )}
        </div>

        {/* Sync Status */}
        {pendingCount > 0 && (
          <div className="sync-status">
            <Badge count={pendingCount} overflowCount={99}>
              <Tag 
                color="blue" 
                icon={isSyncing ? <SyncOutlined spin /> : <CloudSyncOutlined />}
              >
                {isSyncing ? 'Syncing...' : `${pendingCount} Pending`}
              </Tag>
            </Badge>
          </div>
        )}

        {/* Manual Sync Button */}
        {showSyncButton && isOnline && pendingCount > 0 && !isSyncing && (
          <Button 
            type="link" 
            size="small" 
            icon={<SyncOutlined />}
            onClick={handleManualSync}
          >
            Sync Now
          </Button>
        )}

        {/* Last Sync Time */}
        {lastSyncTime && (
          <Tooltip title={`Last synced: ${formatLastSync(lastSyncTime)}`}>
            <span className="last-sync-time">
              <CloudSyncOutlined /> {formatLastSync(lastSyncTime)}
            </span>
          </Tooltip>
        )}
      </Space>

      {/* Offline Message */}
      {!isOnline && (
        <div className="offline-message">
          <WarningOutlined /> You're offline. Reports will auto-sync when connected.
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
