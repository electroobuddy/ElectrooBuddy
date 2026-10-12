import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { nativeApiErrorMessage, nativeRequestPasswordReset } from '@/lib/apiClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await nativeRequestPasswordReset(email.trim());
      setSubmitted(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error) {
      toast.error(nativeApiErrorMessage(error, 'Unable to request a password reset.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary"><Zap className="h-6 w-6 text-primary-foreground" /></div>
          <h1 className="text-2xl font-heading font-bold">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter the email linked to your Electroobuddy account.</p>
        </div>
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">For security, we show the same message whether or not the email is registered. Check your inbox and spam folder for the reset link.</div>
            <button onClick={() => setSubmitted(false)} className="text-sm font-medium text-primary hover:underline">Use another email</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">Email address
              <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3" placeholder="you@example.com" /></div>
            </label>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin"/>}Send reset link</button>
          </form>
        )}
        <div className="mt-6 text-center text-sm"><Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></div>
      </div>
    </div>
  );
};
export default ForgotPassword;
