/* eslint-disable no-restricted-globals */

const BASE_URL = self.location.origin;

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
// Note: Firebase FCM uses firebase-messaging-sw.js, this handles VAPID/Web Push
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received', event);
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
  }
  
  // Check if this is an FCM message (has special FCM format)
  if (data.from === 'firebase' || data.notification) {
    console.log('[Service Worker] FCM message detected, delegating to Firebase SW');
    // Let Firebase service worker handle FCM messages
    return;
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon_io/android-chrome-192x192.png',
    badge: data.badge || '/favicon_io/android-chrome-192x192.png',
    image: data.image || null,
    data: {
      url: data.url || '/dashboard/bookings',
      notificationId: data.notificationId,
      type: data.type,
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'view', title: '👁️ View Details' },
      { action: 'close', title: '✕ Dismiss' }
    ],
    tag: data.tag || 'electrobuddy-default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    silent: false,
    timestamp: Date.now(),
    dir: 'auto',
    lang: 'en'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 ElectroBuddy', options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    console.log('[Service Worker] User dismissed notification');
    return;
  }

  const urlToOpen = event.notification.data?.url || BASE_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        console.log('[Service Worker] Found', windowClients.length, 'open windows');
        
        // Check if there's already a window open with the target URL
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            console.log('[Service Worker] Focusing existing window');
            return client.focus();
          }
        }
        
        // No matching window open, open a new one
        if (clients.openWindow) {
          console.log('[Service Worker] Opening new window:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(err => {
        console.error('[Service Worker] Error handling notification click:', err);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed by user');
});

// Push subscription change event
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  
  // Notify clients about the subscription change
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PUSH_SUBSCRIPTION_CHANGED',
          message: 'Push subscription needs to be refreshed'
        });
      });
    })
  );
});

// Message event - handle messages from client
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source.postMessage({
      type: 'VERSION',
      version: '1.0.0'
    });
  }
});

// Fetch event - basic caching strategy (optional)
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
});

console.log('[Service Worker] Service Worker loaded');
