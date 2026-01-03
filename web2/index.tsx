import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker for PWA (non-blocking, deferred)
// Don't wait for service worker to register before rendering app
if ('serviceWorker' in navigator) {
  // Use requestIdleCallback if available, otherwise defer with setTimeout
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
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
      })
      .catch((error) => {
        // Silently fail - service worker is not critical for app functionality
        console.warn('Service Worker registration failed:', error);
      });
  };

  // Defer service worker registration to avoid blocking initial render
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(registerSW, { timeout: 5000 });
  } else {
    // Fallback: register after a short delay
    setTimeout(registerSW, 100);
  }
}

// Performance metrics tracking
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  // Track First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('[Performance] FCP:', Math.round(entry.startTime), 'ms');
        }
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
  } catch (e) {
    // PerformanceObserver not supported
  }

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Performance] LCP:', Math.round(lastEntry.startTime), 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // PerformanceObserver not supported
  }

  // Track Time to Interactive (TTI) - approximate using load event
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const tti = perfData.domInteractive - perfData.navigationStart;
    console.log('[Performance] TTI (approx):', tti, 'ms');
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);