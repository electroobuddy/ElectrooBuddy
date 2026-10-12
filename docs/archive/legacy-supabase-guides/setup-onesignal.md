# OneSignal Setup Instructions

## 1. Get OneSignal API Key
1. Go to [OneSignal Dashboard](https://onesignal.com/)
2. Select your app: "Electroo Buddy"
3. Go to Settings → Keys & IDs
4. Copy:
   - App ID: `01fda38a-4a53-4f72-9c10-2d4c9db304f0` (already set)
   - REST API Key (starts with "Nz...")

## 2. Set Supabase Secrets
Run these commands in your terminal:

```bash
# Set OneSignal App ID
supabase secrets set ONESIGNAL_APP_ID=01fda38a-4a53-4f72-9c10-2d4c9db304f0

# Set OneSignal REST API Key (replace with your actual key)
supabase secrets set ONESIGNAL_API_KEY=Nz...

# Deploy the edge function
supabase functions deploy send-onesignal-notification
```

## 3. Update push_subscriptions table
Run this SQL in Supabase SQL Editor:

```sql
-- Add support for OneSignal subscriptions
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'onesignal';

-- Update existing records
UPDATE public.push_subscriptions 
SET subscription_type = 'onesignal' 
WHERE subscription_type IS NULL OR subscription_type = 'fcm';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_type 
ON public.push_subscriptions(subscription_type);
```

## 4. Test the Implementation
1. Go to `/test-onesignal` route
2. Click "Subscribe to Push Notifications"
3. Allow browser notification permission
4. Click "Send Test Notification"
5. Check if you receive the notification

## 5. Remove Firebase FCM (Optional)
Once OneSignal is working, you can remove:
- Firebase config files
- FCM edge function
- Firebase service worker
- Firebase dependencies

## Benefits of OneSignal over FCM:
- ✅ No server key management
- ✅ Better browser support
- ✅ Built-in notification UI
- ✅ Analytics and segmentation
- ✅ Easier setup and maintenance
