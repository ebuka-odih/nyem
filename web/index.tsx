import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './hooks/api/queryClient';
import { WebSocketProvider } from './contexts/WebSocketContext';
import App from './App';

// Service worker registration and update checking is handled in index.html
// The useServiceWorker hook in App.tsx will handle update notifications and auto-reload

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WebSocketProvider>
            <App />
          </WebSocketProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
