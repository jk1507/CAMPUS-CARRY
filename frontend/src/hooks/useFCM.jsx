import { useEffect, useState, useCallback, useRef } from 'react';
import { initializeFCM, setupForegroundMessageHandler } from '../services/fcm.js';
import useAuthStore from '../store/authStore.js';

/**
 * useFCM — Firebase Cloud Messaging hook
 *
 * Usage:
 *   const { isReady, notifications, requestPermission, lastNotification } = useFCM({
 *     onNotification: (notif) => toast(notif.title + ' ' + notif.body),
 *   });
 *
 * The hook:
 *   - Requests notification permission on mount (if logged in)
 *   - Registers FCM token with backend
 *   - Listens for foreground push messages
 *   - Exposes notification state and helper methods
 */
export default function useFCM({ onNotification, onTokenRefresh } = {}) {
  const { token: authToken, user } = useAuthStore();
  const [isReady, setIsReady]      = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [lastNotification, setLastNotification] = useState(null);
  const [error, setError]          = useState(null);
  const notifiedRef = useRef(false); // Toast for each new foreground notification

  // Request permission and initialize FCM
  const requestPermission = useCallback(async () => {
    setIsReady(false);
    setError(null);

    try {
      const result = await initializeFCM(
        authToken,
        (notif) => {
          // Foreground message received
          setLastNotification(notif);
          onNotification?.(notif);

          // Avoid repeated toasts for same notification
          if (!notifiedRef.current) {
            notifiedRef.current = true;
            setTimeout(() => { notifiedRef.current = false; }, 5000);
          }
        },
        onTokenRefresh
      );
      setIsReady(true);
    } catch (err) {
      setError(err.message || 'Failed to initialize FCM');
      setIsReady(false);
    }
  }, [authToken, onNotification, onTokenRefresh]);

  // Initialize on auth token change (user logs in)
  useEffect(() => {
    if (!authToken) {
      setIsReady(false);
      setPermissionStatus('default');
      return;
    }

    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // Initialize FCM
    requestPermission();
  }, [authToken, requestPermission]);

  // Subscribe to campus topic when user campus changes
  useEffect(() => {
    if (!user?.campus) return;

    let cancelled = false;

    const subscribe = async () => {
      try {
        const { subscribeToCampusTopic } = await import('../services/fcm.js');
        if (!cancelled) await subscribeToCampusTopic(user.campus);
      } catch (err) {
        console.error('Failed to subscribe to campus topic:', err);
      }
    };

    subscribe();

    return () => { cancelled = true; };
  }, [user?.campus]);

  return {
    isReady,
    permissionStatus,
    lastNotification,
    error,
    requestPermission,
    resetLastNotification: () => setLastNotification(null),
  };
}
