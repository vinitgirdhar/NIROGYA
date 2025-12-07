// src/services/syncService.ts
// Background sync service for pending symptom reports

import { offlineDB, OfflineSymptomReport } from './offlineDB';
import { postReport } from '../api/report';

type SyncStatusCallback = (status: {
  syncing: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  error?: string;
}) => void;

class SyncService {
  private isSyncing = false;
  private statusCallbacks: Set<SyncStatusCallback> = new Set();
  private pendingCount = 0;
  private lastSyncTime?: string;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Update initial pending count
    await this.updatePendingCount();

    // Start periodic sync check (every 30 seconds when online)
    this.startPeriodicSync();
  }

  private handleOnline = () => {
    console.log('[SyncService] Network is online. Starting sync...');
    this.syncPendingReports();
  };

  private handleOffline = () => {
    console.log('[SyncService] Network is offline.');
    this.notifyStatusChange();
  };

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback: SyncStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Immediately notify with current status
    callback({
      syncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime
    });
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private notifyStatusChange(error?: string) {
    const status = {
      syncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      error
    };
    this.statusCallbacks.forEach(callback => callback(status));
  }

  private async updatePendingCount() {
    try {
      this.pendingCount = await offlineDB.getPendingCount();
      this.notifyStatusChange();
    } catch (err) {
      console.error('[SyncService] Failed to get pending count:', err);
    }
  }

  /**
   * Start periodic sync check
   */
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Check every 30 seconds
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.pendingCount > 0) {
        this.syncPendingReports();
      }
    }, 30000);
  }

  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Save a report locally and attempt sync if online
   * Returns: { savedLocally: boolean, synced: boolean, error?: string }
   */
  async saveAndSync(reportData: {
    patient: any;
    meta: any;
  }): Promise<{ savedLocally: boolean; synced: boolean; localId: number; error?: string }> {
    let localId = -1;

    try {
      // Always save locally first
      localId = await offlineDB.saveReport(reportData);
      console.log('[SyncService] Report saved locally with ID:', localId);
      await this.updatePendingCount();
    } catch (err) {
      console.error('[SyncService] Failed to save locally:', err);
      return {
        savedLocally: false,
        synced: false,
        localId: -1,
        error: 'Failed to save report locally'
      };
    }

    // If online, attempt immediate sync
    if (navigator.onLine) {
      try {
        await postReport(reportData);
        // Mark as synced
        await offlineDB.markAsSynced(localId);
        await this.updatePendingCount();
        this.lastSyncTime = new Date().toISOString();
        console.log('[SyncService] Report synced immediately');
        return { savedLocally: true, synced: true, localId };
      } catch (err: any) {
        console.warn('[SyncService] Immediate sync failed, will retry later:', err);
        await offlineDB.updateSyncAttempt(localId, err?.message);
        return {
          savedLocally: true,
          synced: false,
          localId,
          error: 'Report saved offline. Will sync when connection is restored.'
        };
      }
    }

    // Offline - report is saved, will sync later
    return {
      savedLocally: true,
      synced: false,
      localId,
      error: 'You are offline. Report saved locally and will auto-sync when internet is back.'
    };
  }

  /**
   * Sync all pending reports to the server
   */
  async syncPendingReports(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[SyncService] Cannot sync - offline');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyStatusChange();

    let success = 0;
    let failed = 0;

    try {
      const pendingReports = await offlineDB.getPendingReports();
      console.log(`[SyncService] Found ${pendingReports.length} pending reports to sync`);

      for (const report of pendingReports) {
        if (!navigator.onLine) {
          console.log('[SyncService] Lost connection during sync');
          break;
        }

        try {
          // Build the payload (only patient and meta)
          const payload = {
            patient: report.patient,
            meta: report.meta
          };

          await postReport(payload);
          await offlineDB.markAsSynced(report.id!);
          success++;
          console.log(`[SyncService] Synced report ID: ${report.id}`);
        } catch (err: any) {
          console.error(`[SyncService] Failed to sync report ID ${report.id}:`, err);
          await offlineDB.updateSyncAttempt(report.id!, err?.message);
          failed++;
        }
      }

      if (success > 0) {
        this.lastSyncTime = new Date().toISOString();
      }
    } catch (err) {
      console.error('[SyncService] Error during sync:', err);
    } finally {
      this.isSyncing = false;
      await this.updatePendingCount();
      this.notifyStatusChange();
    }

    return { success, failed };
  }

  /**
   * Get current pending count
   */
  getPendingCount(): number {
    return this.pendingCount;
  }

  /**
   * Force refresh pending count from DB
   */
  async refreshPendingCount(): Promise<number> {
    await this.updatePendingCount();
    return this.pendingCount;
  }

  /**
   * Clean up synced reports older than specified days
   */
  async cleanupOldSyncedReports(): Promise<void> {
    try {
      await offlineDB.clearSyncedReports();
      console.log('[SyncService] Cleaned up old synced reports');
    } catch (err) {
      console.error('[SyncService] Failed to cleanup old reports:', err);
    }
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
