import { useState } from 'react';
import { KeyRound, Save, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AdminPassword() {
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    const { error: err } = await changePassword(newPassword);
    setSaving(false);
    if (err) return setError(err);
    setSaved(true);
    setNewPassword('');
    setConfirm('');
  };

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Change Password</h1>
        <p className="text-sm text-stone-500">Use a strong password with at least 8 characters.</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <label className="label-text">New Password</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="password" className="input-field pl-9" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <div>
          <label className="label-text">Confirm New Password</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="password" className="input-field pl-9" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
        {saved && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-[color:var(--brand-success)]">Password updated successfully.</div>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? <><Check size={16} /> Updated</> : <><Save size={16} /> {saving ? 'Updating...' : 'Update Password'}</>}
        </button>
      </form>
    </div>
  );
}
