import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { nativeApiErrorMessage, isNativeApiError } from '@/lib/apiClient';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

type Props = {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void | Promise<void>;
  compact?: boolean;
  skeleton?: ReactNode;
};

export default function ApiState({
  loading = false,
  error,
  empty = false,
  loadingLabel = 'Loading…',
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'There is no data to display.',
  errorTitle = 'Unable to load data',
  errorMessage,
  onRetry,
  compact = false,
  skeleton,
}: Props) {
  const online = useOnlineStatus();
  if (loading) {
    if (skeleton) return <>{skeleton}</>;
    return <div className={`${compact ? 'p-3' : 'p-6'} flex items-center justify-center gap-2 text-sm text-muted-foreground`} role="status"><Loader2 className="h-4 w-4 animate-spin" />{loadingLabel}</div>;
  }
  if (error) {
    const offline = !online || (isNativeApiError(error) && error.code === 'NETWORK_ERROR' && typeof navigator !== 'undefined' && !navigator.onLine);
    return (
      <div className={`rounded-xl border ${offline ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'} ${compact ? 'p-3' : 'p-5'} text-center`} role="alert">
        {offline ? <WifiOff className="mx-auto mb-2 h-5 w-5 text-amber-600" /> : <AlertCircle className="mx-auto mb-2 h-5 w-5 text-red-600" />}
        <p className="font-medium">{offline ? 'You are offline' : errorTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{offline ? 'Reconnect to continue using live data and actions.' : (errorMessage || nativeApiErrorMessage(error))}</p>
        {onRetry && <button type="button" onClick={() => void onRetry()} disabled={!online} className="mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className="h-4 w-4" />Retry</button>}
      </div>
    );
  }
  if (empty) return <div className={`rounded-xl border border-dashed bg-muted/30 ${compact ? 'p-3' : 'p-6'} text-center`}><Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground"/><p className="font-medium">{emptyTitle}</p><p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p></div>;
  return null;
}
