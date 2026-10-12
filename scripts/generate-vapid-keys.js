import webpush from 'web-push';

console.log('Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('='.repeat(80));
console.log('VAPID KEYS GENERATED SUCCESSFULLY');
console.log('='.repeat(80));
console.log('\nAdd these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@electroobuddy.com`);
console.log('\n' + '='.repeat(80));
console.log('IMPORTANT: Keep your VAPID_PRIVATE_KEY secure and never commit it to Git!');
console.log('='.repeat(80));
