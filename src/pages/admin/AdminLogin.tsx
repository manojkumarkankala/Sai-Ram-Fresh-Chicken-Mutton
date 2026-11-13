import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ADMIN_LOGIN_EMAIL, useAuth } from '@/lib/auth';

export function AdminLogin() {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/admin');
  };

  const handleReset = async () => {
    const { error: err } = await resetPassword(ADMIN_LOGIN_EMAIL);
    if (err) setError(err);
    else setResetSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--brand-primary-dark)] px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--brand-primary)] text-[color:var(--brand-accent)]">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Admin Login</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to manage orders, products and settings.</p>

          {resetSent && (
            <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-[color:var(--brand-success)]">
              If that email is registered, a reset link has been sent.
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  className="input-field pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button onClick={handleReset} className="mt-4 w-full text-center text-sm text-[color:var(--brand-primary)] hover:underline">
            Forgot Password?
          </button>
        </div>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-sm text-stone-300 hover:text-white">
          <ArrowLeft size={14} /> Back to website
        </Link>
      </div>
    </div>
  );
}
