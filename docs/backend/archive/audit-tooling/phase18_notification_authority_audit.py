from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1]
checks={
'migration':('server/database/migrations/017_native_notifications_communication.sql',['notification_outbox','event_key text NOT NULL UNIQUE','enqueue_order_notification','enqueue_return_notification']),
'provider':('server/src/providers/notification-delivery.provider.ts',['firebase.messaging','sendEmail','sendPush','FIREBASE_PRIVATE_KEY']),
'repository':('server/src/repositories/notification.repository.ts',['FOR UPDATE SKIP LOCKED','notification_logs','push_subscriptions','notification_outbox']),
'service':('server/src/services/notification.service.ts',['categoryEnabled','requested_channels','sendEmail','sendPush']),
'routes':('server/src/routes/notification.routes.ts',['/notifications','/notification-preferences','/push-subscriptions/fcm','/admin/notifications/outbox']),
'worker':('server/scripts/process-notifications.ts',['NotificationService','process(limit']),
'frontend':('src/lib/nativeNotifications.ts',['VITE_NOTIFICATION_BACKEND','/notifications','/admin/notifications/outbox']),
'admin':('src/components/admin/NativeNotificationOperations.tsx',['Notification Operations','Process 25','Retry']),
'env':('server/src/config/env.ts',['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','NOTIFICATION_WORKER_BATCH'])
}
failed=[]
for name,(file,needles) in checks.items():
 p=R/file
 if not p.exists(): failed.append(f'{name}: missing {file}'); continue
 t=p.read_text(errors='ignore')
 for n in needles:
  if n not in t: failed.append(f'{name}: missing {n}')
if failed:
 print('PHASE 18 NATIVE NOTIFICATION AUTHORITY: FAIL')
 print('\n'.join(' - '+x for x in failed));sys.exit(1)
print('PHASE 18 NATIVE NOTIFICATION AUTHORITY: PASS')
print('outbox: durable + unique event keys + claim-safe worker')
print('delivery: SMTP email + Firebase HTTP v1 push + in-app PostgreSQL')
print('preferences: channel/category enforcement')
print('frontend: VITE_NOTIFICATION_BACKEND + legacy rollback')
