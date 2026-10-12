import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  requireOnline?: boolean;
  children: ReactNode;
};

export default function MutationButton({ pending = false, pendingLabel = 'Saving…', requireOnline = true, disabled, children, ...props }: Props) {
  const online = useOnlineStatus();
  const blocked = Boolean(disabled || pending || (requireOnline && !online));
  return <button {...props} disabled={blocked} aria-busy={pending || undefined} title={!online && requireOnline ? 'Reconnect to continue' : props.title}>{pending ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{pendingLabel}</span> : children}</button>;
}
