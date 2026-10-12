import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BellRing, Clock3, LockKeyhole, Play, RefreshCw, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getNativeOpsStatus } from '@/lib/nativeAdminOperations';
import { processFulfillmentNow } from '@/lib/nativeShipping';
import { nativeNotifications } from '@/lib/nativeNotifications';
import type { OpsStatusSnapshot, OpsWorkerRun } from '@/lib/apiContracts';
import { NativeApiError } from '@/lib/apiClient';
import ApiState from '@/components/ApiState';
import MutationButton from '@/components/MutationButton';

const EMPTY: OpsStatusSnapshot = { workers: [], failures24h: [], activeLeases: [], staleWorkers: [] };
const expectedWorkers = [
  'checkout-expiry',
  'payment-reconciliation',
  'refund-reconciliation',
  'shipment-sync',
  'fulfillment-queue',
  'notification-delivery',
  'subscription-reconciliation',
];

function fmt(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function workerTone(status?: string) {
  if (status === 'succeeded') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
  if (status === 'failed') return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300';
  if (status === 'running') return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
  return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
}

export default function AdminOperations() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canView = permissions.includes('admin:security');
  const canOperate = permissions.includes('admin:write');
  const [data, setData] = useState<OpsStatusSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!canView) {
      setLoading(false);
      setError('Your admin account does not have the admin:security permission required to view operations health.');
      return;
    }
    try {
      if (!quiet) setLoading(true);
      setError('');
      setData(await getNativeOpsStatus());
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof NativeApiError ? err.message : err instanceof Error ? err.message : 'Unable to load operations status.';
      setError(message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
    if (!canView) return;
    const id = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(id);
  }, [canView, load]);

  const byName = useMemo(() => new Map(data.workers.map((w) => [w.worker_name, w])), [data.workers]);
  const workers = useMemo(() => expectedWorkers.map((name) => byName.get(name) ?? ({ worker_name: name, status: 'never-run', started_at: '' } as OpsWorkerRun)), [byName]);
  const failedNow = workers.filter((w) => w.status === 'failed').length;
  const stale = new Set(data.staleWorkers);
  const healthy = workers.filter((w) => w.status === 'succeeded' && !stale.has(w.worker_name)).length;

  const runAction = async (key: string, action: () => Promise<unknown>, success: string) => {
    if (!canOperate) {
      toast.error('admin:write permission is required for manual processing.');
      return;
    }
    try {
      setBusy(key);
      await action();
      toast.success(success);
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6"/>Operations Health</h1>
          <p className="text-muted-foreground mt-1">Worker runs, failures, leases and stale-job visibility from the native operations ledger.</p>
          {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Last refreshed {lastUpdated.toLocaleTimeString()}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <MutationButton className="btn-secondary" onClick={() => void load()} pending={loading} pendingLabel="Refreshing…"><RefreshCw className="w-4 h-4 inline mr-2"/>Refresh</MutationButton>
          {canOperate && <>
            <MutationButton className="btn-secondary" pending={busy === 'notifications'} pendingLabel="Processing…" disabled={!!busy && busy !== 'notifications'} onClick={() => runAction('notifications', () => nativeNotifications.process(25), 'Notification outbox processed')}><BellRing className="w-4 h-4 inline mr-2"/>Process notifications</MutationButton>
            <MutationButton className="btn-primary" pending={busy === 'fulfillment'} pendingLabel="Processing…" disabled={!!busy && busy !== 'fulfillment'} onClick={() => runAction('fulfillment', processFulfillmentNow, 'Fulfillment worker completed')}><Play className="w-4 h-4 inline mr-2"/>Process fulfillment</MutationButton>
          </>}
        </div>
      </div>

      {error && <ApiState error={new Error(error)} errorTitle="Operations status unavailable" onRetry={canView ? () => load() : undefined} />}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['Healthy workers', `${healthy}/${expectedWorkers.length}`, ServerCog],
          ['Failures (24h)', data.failures24h.length, AlertTriangle],
          ['Stale workers', data.staleWorkers.length, Clock3],
          ['Active leases', data.activeLeases.length, LockKeyhole],
        ].map(([label, value, Icon]) => <div key={String(label)} className="border rounded-xl p-4 bg-card"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{String(value)}</p></div><Icon className="w-5 h-5 text-muted-foreground"/></div></div>)}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-lg">Scheduled workers</h2>{failedNow > 0 && <span className="text-sm text-red-600">{failedNow} latest run{failedNow === 1 ? '' : 's'} failed</span>}</div>
        <div className="overflow-x-auto border rounded-xl bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3 text-left">Worker</th><th className="p-3 text-left">Latest status</th><th className="p-3 text-left">Started</th><th className="p-3 text-left">Duration</th><th className="p-3 text-left">Processed</th><th className="p-3 text-left">Last error</th></tr></thead>
            <tbody>{workers.map((w) => <tr key={w.worker_name} className="border-t"><td className="p-3 font-medium"><div>{w.worker_name}</div>{stale.has(w.worker_name) && <div className="text-xs text-amber-600 mt-1">Stale</div>}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${workerTone(w.status)}`}>{w.status}</span></td><td className="p-3 whitespace-nowrap">{fmt(w.started_at)}</td><td className="p-3">{typeof w.duration_ms === 'number' ? `${Math.round(w.duration_ms / 1000)}s` : '—'}</td><td className="p-3">{w.processed_count ?? '—'}</td><td className="p-3 max-w-xs truncate" title={w.error_message ?? ''}>{w.error_message || '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-3"><h2 className="font-semibold text-lg">Failures in the last 24 hours</h2><div className="border rounded-xl bg-card divide-y">{data.failures24h.length ? data.failures24h.map((f, index) => <div key={`${f.worker_name}-${f.started_at}-${index}`} className="p-4"><div className="flex justify-between gap-3"><span className="font-medium">{f.worker_name}</span><span className="text-xs text-muted-foreground whitespace-nowrap">{fmt(f.started_at)}</span></div><p className="text-sm text-red-600 mt-1 break-words">{f.error_message || 'No error detail recorded'}</p></div>) : <div className="p-6 text-center text-muted-foreground">No worker failures recorded in the last 24 hours.</div>}</div></section>
        <section className="space-y-3"><h2 className="font-semibold text-lg">Active worker leases</h2><div className="border rounded-xl bg-card divide-y">{data.activeLeases.length ? data.activeLeases.map((lease) => <div key={lease.worker_name} className="p-4"><div className="flex justify-between gap-3"><span className="font-medium">{lease.worker_name}</span><span className="text-xs text-muted-foreground">until {fmt(lease.lease_until)}</span></div><p className="text-xs font-mono text-muted-foreground mt-1 break-all">{lease.lease_owner}</p></div>) : <div className="p-6 text-center text-muted-foreground">No active leases. Workers are idle.</div>}</div></section>
      </div>

      {!canOperate && canView && <div className="border rounded-xl p-4 bg-muted/30 text-sm text-muted-foreground">This account can view operations health but does not have <code>admin:write</code>, so manual processing controls are hidden.</div>}
    </div>
  );
}
