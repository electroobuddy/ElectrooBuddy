import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-[70] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <WifiOff className="h-4 w-4" />
      You are offline. Saved page data remains visible, but API actions will resume when your connection returns.
    </div>
  );
}
