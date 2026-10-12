# Push Notifications Setup Guide

This guide explains how to set up push notifications for ElectroBuddy to work even when the website is closed.

## Overview

The notification system now supports:
- **In-app notifications**: Real-time notifications when the app is open
- **Email notifications**: Email alerts for booking updates
- **Push notifications**: Browser notifications that work even when the website is closed

## Required Environment Variables

Add these to your `.env` file and Supabase Edge Function secrets:

### Client-side (`.env`)
```bash
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### Supabase Edge Function Secrets
```bash
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_SUBJECT=mailto:notifications@electroobuddy.com
```

## Generate VAPID Keys

### Option 1: Using Web-push-pem (Recommended)
```bash
# Install web-push-pem
npm install -g web-push-pem

# Generate VAPID keys
web-push-pem
```

### Option 2: Using Node.js
```bash
# Install web-push
npm install web-push

# Generate keys
node -e "const webpush = require('web-push'); console.log(webpush.generateVAPIDKeys());"
```

### Option 3: Online Generator
Use an online VAPID key generator like: https://web-push-codelab.glitch.me/

## Database Setup

Run the migration to create the necessary tables:
```bash
supabase db push
```

This creates:
- `push_subscriptions` table for storing user push subscriptions
- Updates `notification_preferences` table with push notification settings
- Creates helper functions for push notifications

## How It Works

1. **User Permission**: User must grant notification permission in their browser
2. **Service Worker**: Registers a service worker to handle push events
3. **Subscription**: Creates a push subscription and stores it in the database
4. **Trigger**: When a notification is created, it triggers a push notification
5. **Delivery**: Push service delivers notification to user's device

## User Experience

### Enabling Push Notifications
1. User goes to Settings → Notification Preferences
2. Clicks "Enable" under Push Notifications
3. Browser prompts for notification permission
4. System creates push subscription
5. User receives confirmation

### What Users See
- **Permission denied**: "Enable notifications in your browser settings"
- **Permission granted**: "✅ Push notifications enabled"
- **No subscription**: "🔔 Permission granted, setup required"

## Testing Push Notifications

### Manual Testing
1. Enable push notifications in settings
2. Create a test booking or update an existing one
3. Check browser notification center

### Debugging
- Open browser DevTools → Application → Service Workers
- Check console for push-related logs
- Verify VAPID keys are configured correctly

## Browser Support

Push notifications work in:
- Chrome/Chromium (desktop and mobile)
- Firefox (desktop and mobile)
- Edge (desktop and mobile)
- Safari (limited support)

## Security Considerations

- VAPID keys should be kept secret
- Only send notifications to authenticated users
- Validate notification payloads
- Use HTTPS (required for push notifications)

## Troubleshooting

### Common Issues

1. **"VAPID keys not configured"**
   - Check environment variables are set correctly
   - Verify keys are valid VAPID key pairs

2. **"Permission denied"**
   - User must manually enable in browser settings
   - Check if site is in private/incognito mode

3. **"No active subscriptions"**
   - Service worker may not be registered
   - Try refreshing the page and re-enabling

4. **Push notifications not received**
   - Check if browser is open (some browsers require this)
   - Verify service worker is active
   - Check network connectivity

### Debug Steps
1. Check browser console for errors
2. Verify service worker is registered
3. Test notification permission status
4. Check Supabase function logs

## Production Deployment

For production:
1. Use proper VAPID key management
2. Set up monitoring for push notification failures
3. Implement retry logic for failed pushes
4. Consider using a dedicated push service

## Files Modified

- `src/components/NotificationSettings.tsx` - Added push notification UI
- `src/hooks/useNotifications.ts` - Added push notification triggers
- `src/utils/pushNotifications.ts` - Push notification utilities
- `supabase/functions/send-push-notification/index.ts` - Push notification edge function
- `public/sw.js` - Service worker for handling push events
- Database migration for push subscriptions table

## Next Steps

1. Generate and configure VAPID keys
2. Test the notification system thoroughly
3. Set up monitoring and alerting
4. Consider adding notification analytics
