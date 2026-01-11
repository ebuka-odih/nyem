import React from 'react';

/**
 * ServiceWorkerUpdate component - Now silent and handles updates in the background.
 * The UI has been removed as per requirements for a non-disruptive experience.
 */
export const ServiceWorkerUpdate: React.FC = () => {
  // Return null because updates are now handled automatically in the background
  // via visibility changes and automatic skipWaiting.
  return null;
};
