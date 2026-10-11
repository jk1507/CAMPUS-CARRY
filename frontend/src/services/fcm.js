import { getSocket } from '../socket/socket.js';

// Firebase App (compat version for service worker compatibility)
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import 'firebase/compat/auth';

// ─── Firebase Configuration ──────────────────────────────────────────────
// Replace these with your Firebase project's values from
// https://console.firebase.google.com/project/_/settings/general
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'YOUR_API_KEY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'YOUR_PROJECT.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'YOUR_PROJECT_ID',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || 'YOUR_APP_ID',
};

// ─── Firebase Initialization ─────────────────────────────────────────────
let app = null;
let messaging = null;

function getFirebaseApp() {
  if (!app) {
    app = firebase.initializeApp(firebaseConfig);
  }
  return app;
}

function getMessaging() {
  if (!messaging) {
    const fbApp = getFirebaseApp();
    // @ts-expect-error — firebase compat types
    messaging = fbApp.messaging();
  }
  return messaging;
}

// ─── Request Permission & Get Token ──────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return null;
  }

  try {
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    // Get FCM token
    // @ts-expect-error — firebase compat types
    const token = await messaging.getToken({
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
    });

    if (!token) {
      console.warn('Failed to get FCM token');
      return null;
    }

    console.log('FCM Token:', token);
    return token;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return null;
  }
}

// ─── Register Token with Backend ─────────────────────────────────────────
export async function registerFcmToken(token) {
  try {
    const res = await fetch('/api/fcm/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ fcm_token: token }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to register FCM token');
    }

    return true;
  } catch (err) {
    console.error('Error registering FCM token:', err);
    return false;
  }
}

// ─── Helper: Get Auth Token from Store ───────────────────────────────────
function getAuthToken() {
  // Access Zustand store directly
  // @ts-expect-error — dynamic import of store
  const authStore = window.__CC_AUTH_STORE__ || null;
  if (authStore) return authStore.token;

  // Fallback: try to get from localStorage
  try {
    const stored = localStorage.getItem('cc-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch {}

  return null;
}

// ─── Handle Foreground Messages ──────────────────────────────────────────
export function setupForegroundMessageHandler(callback) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const messaging = getMessaging();
    // @ts-expect-error — firebase compat types
    messaging.onMessage((payload) => {
      console.log('Foreground FCM message:', payload);

      const notification = payload.notification;
      const data = payload.data;

      if (notification) {
        callback?.({
          title: notification.title,
          body: notification.body,
          data: data || {},
          fromBackground: false,
        });
      }
    });
  } catch (err) {
    console.error('Error setting up foreground message handler:', err);
  }
}

// ─── Handle Token Refresh ────────────────────────────────────────────────
export function setupTokenRefreshHandler(callback) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const messaging = getMessaging();
    // @ts-expect-error — firebase compat types
    messaging.onTokenRefresh((newToken) => {
      console.log('FCM token refreshed:', newToken);
      callback?.(newToken);
    });
  } catch (err) {
    console.error('Error setting up token refresh handler:', err);
  }
}

// ─── Subscribe to Campus Topic ───────────────────────────────────────────
export async function subscribeToCampusTopic(campusName) {
  try {
    const messaging = getMessaging();
    // Topic name must be uppercase and match: /^[a-zA-Z0-9-_]+$/
    const topic = `campus_${campusName.replace(/[^a-zA-Z0-9-_]/g, '_').toUpperCase()}`;
    // @ts-expect-error — firebase compat types
    await messaging.subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
    return true;
  } catch (err) {
    console.error('Error subscribing to campus topic:', err);
    return false;
  }
}

// ─── Initialize FCM (call once on app load for logged-in users) ─────────
export async function initializeFCM(authToken, onNotification, onTokenRefresh) {
  // Check if we're logged in
  if (!authToken) {
    console.log('Not logged in — skipping FCM initialization');
    return;
  }

  try {
    const token = await requestNotificationPermission();
    if (!token) return;

    // Register token with backend
    const registered = await registerFcmToken(token);

    if (registered) {
      console.log('FCM token registered successfully');
    }

    // Setup message handlers
    setupForegroundMessageHandler(onNotification);
    setupTokenRefreshHandler(onTokenRefresh);

    console.log('FCM initialized successfully');
  } catch (err) {
    console.error('Error initializing FCM:', err);
  }
}

// ─── Get Current Token (for debugging / re-registration) ─────────────────
export async function getCurrentFcmToken() {
  try {
    const messaging = getMessaging();
    // @ts-expect-error — firebase compat types
    return await messaging.getToken({
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
    });
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

// ─── Log Notification Permission Status ──────────────────────────────────
export function getNotificationPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'default';
}
