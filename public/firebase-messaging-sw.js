/* eslint-disable no-undef */
/* Firebase Cloud Messaging Service Worker */
/* This file MUST be at the root of the public folder */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase with your config
// Hardcoded values from your .env - must match exactly
firebase.initializeApp({
  apiKey: 'AIzaSyDezipM-tF261v-HZPnixTvvAzKm0jyV34',
  authDomain: 'electroobuddy-561f5.firebaseapp.com',
  projectId: 'electroobuddy-561f5',
  storageBucket: 'electroobuddy-561f5.firebasestorage.app',
  messagingSenderId: '918392975387',
  appId: '1:918392975387:web:334d87da53c626345f88be'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || '🔔 ElectroBuddy';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/favicon_io/android-chrome-192x192.png',
    badge: '/favicon_io/android-chrome-192x192.png',
    data: payload.data || {},
    tag: payload.data?.tag || 'electrobuddy-fcm',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '👁️ View' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Activating...');
  event.waitUntil(self.clients.claim());
});

console.log('[firebase-messaging-sw.js] Service worker loaded');
