import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize sync service at app startup so it runs throughout the entire app lifecycle
// This ensures pending offline reports are synced when the user comes back online
import { syncService } from './services/syncService';

// Check for pending reports on startup and sync if online
syncService.refreshPendingCount().then((count) => {
  if (count > 0 && navigator.onLine) {
    console.log(`[App] Found ${count} pending reports on startup, syncing...`);
    syncService.syncPendingReports();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
