import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Service worker is already registered in index.html before PushAlert loads
// This code just sets up update checking if registration exists
if ('serviceWorker' in navigator && (window as any).serviceWorkerRegistration) {
  const registration = (window as any).serviceWorkerRegistration;
  
  // Check for updates periodically (but don't block on it)
  setInterval(() => {
    registration.update().catch(() => {
      // Silently fail - updates are not critical
    });
  }, 60 * 60 * 1000); // Check every hour

  // Skip waiting on update during app launch to avoid blocking
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available, but don't activate immediately
          // Let it activate on next page load
          console.log('New service worker available, will activate on next reload');
        }
      });
    }
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
