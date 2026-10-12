import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { nativeApiErrorMessage, nativeResendEmailVerification, nativeVerifyEmail } from '@/lib/apiClient';

type Status = 'idle' | 'verifying' | 'verified' | 'failed';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(params.get('email')?.trim() || '');
  const [resending, setResending] = useState(false);
  const returnTo = params.get('returnTo')?.trim() || '/login';

  useEffect(() => {
    if (!token) return;
    let active = true;
    nativeVerifyEmail(token).then(() => {
      if (!active) return;
      setStatus('verified');
      setMessage('Your email has been verified. You can now sign in.');
    }).catch(error => {
      if (!active) return;
      setStatus('failed');
      setMessage(nativeApiErrorMessage(error, 'This verification link is invalid or expired.'));
    });
    return () => { active = false; };
  }, [token]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResending(true);
    try {
      await nativeResendEmailVerification(email.trim());
      toast.success('If verification is still required, a new email has been sent.');
    } catch (error) {
      toast.error(nativeApiErrorMessage(error, 'Unable to resend the verification email.'));
    } finally { setResending(false); }
  };

  return <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm text-center">
    {status==='verifying' && <><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary"/><h1 className="mt-4 text-2xl font-heading font-bold">Verifying email</h1><p className="mt-2 text-sm text-muted-foreground">Checking your verification link…</p></>}
    {status==='verified' && <><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500"/><h1 className="mt-4 text-2xl font-heading font-bold">Email verified</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><Link to={returnTo} className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Continue</Link></>}
    {(status==='idle'||status==='failed') && <><div>{status==='failed'?<XCircle className="mx-auto h-12 w-12 text-destructive"/>:<MailWarning className="mx-auto h-12 w-12 text-primary"/>}</div><h1 className="mt-4 text-2xl font-heading font-bold">{status==='failed'?'Verification link expired':'Verify your email'}</h1><p className="mt-2 text-sm text-muted-foreground">{message||'Open the verification link sent to your email, or request a new one below.'}</p><form onSubmit={resend} className="mt-6 space-y-3 text-left"><label className="block text-sm font-medium">Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5" placeholder="you@example.com"/></label><button disabled={resending} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 font-semibold hover:bg-muted disabled:opacity-50">{resending&&<Loader2 className="h-4 w-4 animate-spin"/>}Resend verification email</button></form><Link to={returnTo} className="mt-5 inline-block text-sm font-medium text-primary hover:underline">Back</Link></>}
  </div></div>;
};
export default VerifyEmail;
