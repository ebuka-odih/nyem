import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { getCurrentLocation, updateLocationOnBackend } from '../utils/location';

interface LocationPermissionModalProps {
  onAllow: () => void;
  onSkip: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onAllow, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getStoredToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      // Update user location on server
      await updateLocationOnBackend(location.latitude, location.longitude, token);

      // Refresh user data to get updated location
      // The backend will automatically update area coordinates if area_id is set

      // Success - close modal
      onAllow();
    } catch (err: any) {
      console.error('Failed to update location:', err);
      setError(err.message || 'Failed to save your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSkip();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <MapPin size={32} className="text-indigo-600" strokeWidth={2.5} />
            </div>
            <button
              onClick={onSkip}
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
            Enable Location Access
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            We'll show you listings closer to you first! This helps you discover items nearby and see distances between you and sellers.
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleAllow}
              disabled={loading}
              className="w-full bg-[#830e4c] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  <span>Allow Location Access</span>
                </>
              )}
            </button>
            <button
              onClick={onSkip}
              disabled={loading}
              className="w-full py-3 text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

