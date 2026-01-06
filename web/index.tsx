import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Service worker registration and update checking is handled in index.html
// The useServiceWorker hook in App.tsx will handle update notifications and auto-reload

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
