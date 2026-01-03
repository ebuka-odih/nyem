/**
 * Google Authentication Utility
 * Handles Google OAuth sign-in using Google Identity Services
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

/**
 * Initialize Google Sign-In and trigger the sign-in flow
 * @param clientId Google OAuth client ID
 * @param onSuccess Callback when sign-in succeeds
 * @param onError Callback when sign-in fails
 */
export const triggerGoogleSignIn = (
  clientId: string,
  onSuccess: (credential: string) => void,
  onError: (error: Error) => void
): void => {
  // Wait for Google Identity Services to load
  const checkGoogleLoaded = () => {
    if (typeof window !== 'undefined' && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            onSuccess(response.credential);
          },
        });

        // Trigger the sign-in popup
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If popup is blocked, try alternative method
            // For now, we'll just show an error
            onError(new Error('Google sign-in popup was blocked. Please allow popups and try again.'));
          }
        });
      } catch (error: any) {
        onError(error instanceof Error ? error : new Error('Failed to initialize Google sign-in'));
      }
    } else {
      // Retry after a short delay
      setTimeout(checkGoogleLoaded, 100);
    }
  };

  checkGoogleLoaded();
};

/**
 * Get Google OAuth client ID from environment or use default
 */
export const getGoogleClientId = (): string => {
  // Get from environment variable (Vite requires VITE_ prefix)
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envClientId && envClientId.trim() !== '') {
    return envClientId.trim();
  }
  
  // Fallback to default (for backward compatibility)
  return '799510192998-ieg4vffmi0f6t0pge5unm80m1oq2t68p.apps.googleusercontent.com';
};













