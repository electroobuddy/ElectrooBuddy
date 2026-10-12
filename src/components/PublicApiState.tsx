import ApiState from '@/components/ApiState';
// Retry rendering and nativeApiErrorMessage normalization are centralized in ApiState.

type PublicApiStateProps = {
  error?: unknown;
  empty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void | Promise<void>;
  compact?: boolean;
};

export default function PublicApiState({ error, empty = false, emptyMessage = 'Nothing is available yet.', errorMessage, onRetry, compact = false }: PublicApiStateProps) {
  return <ApiState error={error} empty={empty} emptyMessage={emptyMessage} errorMessage={errorMessage} onRetry={onRetry} compact={compact} />;
}
