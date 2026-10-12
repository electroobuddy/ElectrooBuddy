import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { nativeApiErrorMessage, nativeConfirmPasswordReset } from '@/lib/apiClient';

const validPassword = (value: string) => value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token')?.trim() || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return toast.error('This reset link is missing its token.');
    if (!validPassword(password)) return toast.error('Password must be at least 12 characters and include uppercase, lowercase, and a number.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await nativeConfirmPasswordReset(token, password);
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(nativeApiErrorMessage(error, 'Unable to reset your password.'));
    } finally { setLoading(false); }
  };

  return <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
    <div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><KeyRound className="h-6 w-6 text-primary"/></div><h1 className="text-2xl font-heading font-bold">Create a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use a strong password you have not used before.</p></div>
    {!token ? <div className="space-y-4 text-center"><p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">This password-reset link is invalid or incomplete.</p><Link to="/forgot-password" className="font-medium text-primary hover:underline">Request a new reset link</Link></div> : <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5" /></label>
      <label className="block text-sm font-medium">Confirm password<input type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5" /></label>
      <p className="text-xs text-muted-foreground">Minimum 12 characters with an uppercase letter, lowercase letter, and number.</p>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Update password</button>
    </form>}
    <div className="mt-6 text-center text-sm"><Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></div>
  </div></div>;
};
export default ResetPassword;
