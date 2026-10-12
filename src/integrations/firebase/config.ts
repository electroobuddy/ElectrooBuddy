import { logger } from "@/lib/logger";
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let messaging: Messaging | null = null;
let app: FirebaseApp | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

export function initFirebase(): boolean {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    logger.warn('[Firebase] Configuration missing - check .env file');
    logger.warn('[Firebase] VITE_FIREBASE_API_KEY:', firebaseConfig.apiKey ? 'set' : 'MISSING');
    logger.warn('[Firebase] VITE_FIREBASE_PROJECT_ID:', firebaseConfig.projectId ? 'set' : 'MISSING');
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    logger.warn('[Firebase] Push notifications not supported in this browser');
    return false;
  }

  if (!('Notification' in window)) {
    logger.warn('[Firebase] Notifications API not available');
    return false;
  }

  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
    }
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return true;
  } catch (error) {
    logger.error('[Firebase] Initialization failed:', error);
    return false;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  if (!messaging) {
    initFirebase();
  }
  return messaging;
}

export async function requestFirebasePermission(userId: string): Promise<string | null> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      logger.error('[Firebase] Messaging not initialized');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.warn('[Firebase] Permission denied:', permission);
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.error('[Firebase] VAPID key not configured');
      return null;
    }

    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration }).catch((err) => {
      logger.error('[Firebase] getToken failed:', err);
      return null;
    });
    return token;
  } catch (error) {
    logger.error('[Firebase] Failed to get token:', error);
    return null;
  }
}

export function onFirebaseMessage(callback: (payload: any) => void): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    logger.warn('[Firebase] Cannot listen - messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export { messaging };