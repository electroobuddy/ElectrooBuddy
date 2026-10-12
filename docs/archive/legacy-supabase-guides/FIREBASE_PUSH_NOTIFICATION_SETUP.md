# Firebase Push Notification Setup Guide

## Overview

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications that work **even when the website is closed**.

### Benefits over VAPID/Supabase:
- ✅ **Completely Free** - No Supabase tier limitations
- ✅ **Works Offline** - Notifications delivered even when browser is closed
- ✅ **More Reliable** - Google's global infrastructure
- ✅ **Better Delivery Rates** - Optimized push routing

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing
3. Follow the setup wizard (disable Google Analytics if not needed)
4. Once created, go to Project Settings

---

## Step 2: Add Web App

1. In Firebase Console, click the **</>** icon (Web)
2. Register app (e.g., "ElectroBuddy Web")
3. Copy the config values:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123..."
   }
   ```

---

## Step 3: Get FCM Keys

1. Go to **Project Settings** → **Cloud Messaging**
2. Copy **Web Push certificate** (Public key) → This is `VITE_FIREBASE_VAPID_KEY`
3. Copy **Server key** (Legacy token) → This is `FIREBASE_SERVER_KEY`

---

## Step 4: Update Environment Variables

Add to your `.env` file:

```env
# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# VAPID Key (for browser subscription)
VITE_FIREBASE_VAPID_KEY=Bk3XwX... (from Web Push certificate)

# Server Key (for edge function - backend sending)
FIREBASE_SERVER_KEY=your-server-key (from Server key)
```

---

## Step 5: Run Database Migration

Run this SQL in Supabase SQL Editor:
- File: `supabase/migrations/20260512_add_firebase_fcm_support.sql`

This adds:
- `fcm_token` column to `push_subscriptions` table
- `subscription_type` column to distinguish between VAPID and FCM

---

## Step 6: Deploy Edge Function

Deploy the new FCM edge function:
```bash
cd supabase
supabase functions deploy send-fcm-notification
```

Ensure the function has access to `FIREBASE_SERVER_KEY` environment variable.

---

## Step 7: Test the Setup

1. Start the development server: `npm run dev`
2. Login as a user
3. When prompted, allow notification permissions
4. Check browser console for: `[Firebase] Subscription saved successfully`
5. Test by creating a booking - you should receive push notifications even with the browser closed

---

## How It Works

### 1. Subscription (Frontend)
```
User → Browser → Firebase SDK → FCM Token → Save to Database
```

### 2. Sending Notification (Backend)
```
Trigger (e.g., Booking Status Change)
    ↓
Edge Function (send-fcm-notification)
    ↓
Get FCM tokens from database
    ↓
Send via FCM HTTP API
    ↓
Firebase → Browser → User receives notification
```

---

## Troubleshooting

### Notifications not working?

1. **Check browser support**: Open Chrome DevTools → Application → Push
2. **Verify Firebase config**: Check browser console for Firebase initialization
3. **Check permission**: Ensure Notification permission is "granted"
4. **Verify server key**: Make sure `FIREBASE_SERVER_KEY` is set in Supabase edge function secrets

### Check Edge Function Logs

```bash
supabase functions logs send-fcm-notification
```

### Test FCM API manually

You can test with curl:
```bash
curl -X POST "https://fcm.googleapis.com/fcm/send" \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Hello from Firebase!"
    }
  }'
```

---

## Files Modified

1. **New Files**:
   - `src/integrations/firebase/config.ts` - Firebase initialization
   - `src/utils/firebaseNotifications.ts` - Firebase notification utilities
   - `supabase/functions/send-fcm-notification/index.ts` - Edge function for sending FCM
   - `supabase/migrations/20260512_add_firebase_fcm_support.sql` - Database migration

2. **Updated Files**:
   - `src/components/PushNotificationPrompt.tsx` - Use Firebase
   - `src/components/NotificationSettings.tsx` - Use Firebase
   - `supabase/functions/notify-booking-status/index.ts` - Call FCM function
   - `package.json` - Added Firebase dependency

---

## Cost

**Firebase Cloud Messaging is FREE** for unlimited notifications (up to 500k/month which is more than enough for most apps).

No credit card required!