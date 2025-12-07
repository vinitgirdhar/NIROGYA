// src/services/offlineDB.ts
// IndexedDB utility for offline symptom report storage

const DB_NAME = 'nirogya_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'symptom_reports';

export interface OfflineSymptomReport {
  id?: number;
  patient: {
    patientName: string | null;
    age: number | null;
    gender: string | null;
    location: string | null;
    contactNumber: string | null;
    symptoms: string[];
    severity: string | null;
    duration: string | null;
    additionalInfo: string | null;
    reportedBy: string;
  };
  meta: {
    submitted_at: string;
    type: string;
  };
  synced: boolean;
  createdAt: string;
  syncAttempts: number;
  lastSyncError?: string;
}

class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create symptom_reports store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for querying
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.dbReady;
  }

  /**
   * Save a symptom report to IndexedDB
   */
  async saveReport(report: Omit<OfflineSymptomReport, 'id' | 'synced' | 'createdAt' | 'syncAttempts'>): Promise<number> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const reportToSave: Omit<OfflineSymptomReport, 'id'> = {
        ...report,
        synced: false,
        createdAt: new Date().toISOString(),
        syncAttempts: 0
      };

      const request = store.add(reportToSave);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error('Failed to save report to IndexedDB'));
      };
    });
  }

  /**
   * Get all pending (unsynced) reports
   */
  async getPendingReports(): Promise<OfflineSymptomReport[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        resolve(request.result as OfflineSymptomReport[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending reports'));
      };
    });
  }

  /**
   * Mark a report as synced
   */
  async markAsSynced(id: number): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const report = getRequest.result as OfflineSymptomReport;
        if (report) {
          report.synced = true;
          const updateRequest = store.put(report);
          
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('Failed to mark report as synced'));
        } else {
          reject(new Error('Report not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get report for syncing'));
      };
    });
  }

  /**
   * Update sync attempt count and error message
   */
  async updateSyncAttempt(id: number, error?: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const report = getRequest.result as OfflineSymptomReport;
        if (report) {
          report.syncAttempts += 1;
          if (error) {
            report.lastSyncError = error;
          }
          const updateRequest = store.put(report);
          
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('Failed to update sync attempt'));
        } else {
          reject(new Error('Report not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get report for updating'));
      };
    });
  }

  /**
   * Delete a synced report (optional cleanup)
   */
  async deleteReport(id: number): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete report'));
    });
  }

  /**
   * Get count of pending reports
   */
  async getPendingCount(): Promise<number> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.count(IDBKeyRange.only(false));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to count pending reports'));
      };
    });
  }

  /**
   * Get all reports (for debugging/display)
   */
  async getAllReports(): Promise<OfflineSymptomReport[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as OfflineSymptomReport[]);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all reports'));
      };
    });
  }

  /**
   * Clear all synced reports (cleanup old data)
   */
  async clearSyncedReports(): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to clear synced reports'));
      };
    });
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
export default offlineDB;
