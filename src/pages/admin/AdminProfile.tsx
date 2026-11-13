import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function AdminProfile() {
  const { resetPassword } = useAuth();
  const [session, setSession] = useState<{ email: string; createdAt: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setSession({ email: user.email ?? '', createdAt: new Date(user.created_at).toLocaleDateString('en-IN') });
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      setFullName(data?.full_name ?? '');
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Admin Profile</h1>
        <p className="text-sm text-stone-500">Your administrator account details.</p>
      </div>

      <div className="card p-5 text-sm">
        <div className="flex justify-between border-b border-stone-100 py-2"><span className="text-stone-500">Email</span><span className="font-medium">{session?.email ?? '...'}</span></div>
        <div className="flex justify-between py-2"><span className="text-stone-500">Member since</span><span className="font-medium">{session?.createdAt ?? '...'}</span></div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <div>
          <label className="label-text">Full Name</label>
          <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}</>}
        </button>
      </form>

      <div className="card p-5">
        <h2 className="font-display font-bold text-stone-900">Password Reset</h2>
        <p className="mt-1 text-sm text-stone-500">Send a password reset link to your email {session?.email}.</p>
        <button
          onClick={async () => {
            if (!session?.email) return;
            const { error } = await resetPassword(session.email);
            if (!error) setResetSent(true);
          }}
          className="btn-primary mt-3 py-2 text-xs"
        >
          {resetSent ? 'Reset link sent - check your email' : 'Send Reset Link'}
        </button>
        <p className="mt-2 text-xs text-stone-400">For a quick change without email, use the Change Password page in the sidebar.</p>
      </div>
    </div>
  );
}
