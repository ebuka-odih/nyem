import React, { useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '../hooks/useServiceWorker';

export const ServiceWorkerUpdate: React.FC = () => {
  const { isUpdateReady, activateUpdate } = useServiceWorker();
  const [showBanner, setShowBanner] = React.useState(false);

  useEffect(() => {
    if (isUpdateReady) {
      setShowBanner(true);
    }
  }, [isUpdateReady]);

  if (!showBanner || !isUpdateReady) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-3 flex-1">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <div className="flex-1">
          <p className="font-semibold text-sm">New version available</p>
          <p className="text-xs opacity-90">Click Update to refresh the app.</p>
        </div>
      </div>
      <button
        onClick={activateUpdate}
        className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
      >
        Update Now
      </button>
      <button
        onClick={() => setShowBanner(false)}
        className="ml-2 p-1 hover:bg-blue-700 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};


