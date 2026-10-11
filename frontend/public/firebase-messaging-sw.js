// Firebase Cloud Messaging Service Worker
// This file must be served at the root of your domain for FCM to work
// Place it in frontend/public/ and Vite will serve it at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase (use compat libraries for service worker)
firebase.initializeApp({
  apiKey:            "{{API_KEY}}",
  authDomain:        "{{AUTH_DOMAIN}}",
  projectId:         "{{PROJECT_ID}}",
  storageBucket:     "{{STORAGE_BUCKET}}",
  messagingSenderId: "{{MESSAGING_SENDER_ID}}",
  appId:             "{{APP_ID}}",
});

const messaging = firebase.messaging();

// Handle background messages (when app is closed or not focused)
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'CampusCarry';
  const notificationBody  = payload.notification?.body  || '';
  const data              = payload.data || {};

  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'campuscarry-notification',
    requireInteraction: true,
    data: {
      url: data.url || '/app',
      type: data.type || 'general',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click (when app is in background)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle foreground messages (when app is open)
messaging.onMessage((payload) => {
  console.log('Foreground message received:', payload);
  // The React app will handle this via the FCM hook — this is just for logging
  return;
});
