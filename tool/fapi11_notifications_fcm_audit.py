from pathlib import Path
root=Path(__file__).resolve().parents[1]
checks=[]
def has(path, text): return text in (root/path).read_text(errors='ignore')
def add(name, ok): checks.append((name,ok))
add('real preference schema', has(Path('src/components/NotificationSettings.tsx'),'order_updates') and not has(Path('src/components/NotificationSettings.tsx'),'email_booking_created'))
add('FCM token ownership', has(Path('src/utils/firebaseNotifications.ts'),'electroobuddy_fcm_owner'))
add('logout cleans owned token', has(Path('src/hooks/useAuth.tsx'),'releaseOwnedPushSubscription'))
add('notification hook stale guard', has(Path('src/hooks/useNotifications.ts'),'requestSeq'))
add('notification hook exposes errors', has(Path('src/hooks/useNotifications.ts'),'setError'))
add('typed panel grouping', has(Path('src/components/NotificationPanel.tsx'),'NativeNotification[]'))
add('typed admin outbox', has(Path('src/components/admin/NativeNotificationOperations.tsx'),'NotificationOutboxItem[]'))
add('admin outbox actual attempt field', has(Path('src/components/admin/NativeNotificationOperations.tsx'),'attempt_count'))
add('admin outbox retry by id', has(Path('src/components/admin/NativeNotificationOperations.tsx'),'nativeNotifications.retry(id)'))
add('native process contract claimed', has(Path('src/lib/nativeNotifications.ts'),'claimed:number;processed:number'))

for layout in ['src/pages/user/UserLayout.tsx','src/pages/admin/AdminLayout.tsx','src/pages/technician/TechnicianLayout.tsx']:
    add(f'no unsolicited push prompt: {layout}', has(Path(layout), "getNotificationPermission() !== 'granted'"))
add('legacy edge-function notification comments removed', 'edge function' not in (root/Path('src/utils/notificationUtils.ts')).read_text(errors='ignore').lower())

failed=[n for n,o in checks if not o]
for n,o in checks: print(('PASS' if o else 'FAIL'),n)
print(f'FAPI-11: {len(checks)-len(failed)}/{len(checks)} PASS')
raise SystemExit(1 if failed else 0)
