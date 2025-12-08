// src/hooks/useOfflineSync.ts
// Custom hook for offline sync status

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';

interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  error?: string;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<OfflineSyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0
  });

  useEffect(() => {
    // Ensure sync service is initialized
    syncService.ensureInitialized();
    
    // Subscribe to sync service status changes
    const unsubscribe = syncService.subscribe((syncStatus) => {
      setStatus(prev => ({
        ...prev,
        isSyncing: syncStatus.syncing,
        pendingCount: syncStatus.pendingCount,
        lastSyncTime: syncStatus.lastSyncTime,
        error: syncStatus.error
      }));
    });

    // Listen for online/offline changes
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming online
      syncService.syncPendingReports();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const manualSync = useCallback(async () => {
    return syncService.syncPendingReports();
  }, []);

  const saveAndSync = useCallback(async (reportData: { patient: any; meta: any }) => {
    return syncService.saveAndSync(reportData);
  }, []);

  return {
    ...status,
    manualSync,
    saveAndSync
  };
}

export default useOfflineSync;
