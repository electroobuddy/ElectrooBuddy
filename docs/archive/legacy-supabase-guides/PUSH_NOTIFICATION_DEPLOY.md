# Push Notification Deployment Checklist

## Complete these steps to fix push notifications:

---

## Step 1: Run Database Migrations

Go to **Supabase SQL Editor** and run these migrations in order:

1. `supabase/migrations/20260512_add_firebase_fcm_support.sql`
2. `supabase/migrations/20260512_add_notification_preferences_columns.sql`

---

## Step 2: Deploy Edge Function

```bash
cd supabase
supabase functions deploy send-fcm-notification
```

---

## Step 3: Add Firebase Server Key

In **Supabase Dashboard**:
1. Go to **Edge Functions** → **send-fcm-notification**
2. Click **Secrets**
3. Add: `FIREBASE_SERVER_KEY` = your Firebase server key (from Firebase Console → Project Settings → Cloud Messaging)

---

## Step 4: Environment Variables

Make sure your `.env` file has:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

---

## Step 5: Test

1. Restart dev server: `npm run dev`
2. Login as user
3. Allow notification permission when prompted
4. Check browser console for: `[Firebase] Subscription saved successfully`
5. Create a booking to test notification

---

## If Still Not Working

Check Edge Function logs:
```bash
supabase functions logs send-fcm-notification
```

Common issues:
- **CORS error** → Fixed in latest code
- **Missing columns** → Run migrations
- **No FCM token** → Check Firebase config in .env
- **Server key not set** → Add to Supabase secrets