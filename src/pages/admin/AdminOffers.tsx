import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Offer } from '@/lib/types';

const emptyForm = { id: '', title: '', description: '', discount_percent: '0', valid_to: '', is_active: true };

export function AdminOffers() {
  const { refreshShop } = useShop();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setOffers((data ?? []) as Offer[]);
    setLoading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Offer title is required.');
    setSaving(true);
    const payload = {
      title: form.title.trim(), description: form.description.trim(),
      discount_percent: Number(form.discount_percent) || 0,
      valid_to: form.valid_to || null, is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    const { error: saveErr } = form.id
      ? await supabase.from('offers').update(payload).eq('id', form.id)
      : await supabase.from('offers').insert(payload);
    setSaving(false);
    if (saveErr) return setError('Could not save the offer.');
    setShowForm(false);
    await load();
    await refreshShop();
  };

  const remove = async (o: Offer) => {
    if (!window.confirm(`Delete offer "${o.title}"?`)) return;
    await supabase.from('offers').delete().eq('id', o.id);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading offers..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Discounts & Offers</h1>
          <p className="text-sm text-stone-500">Offers shown on the website Offers page. Product-level discounts are set in Manage Prices.</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Offer</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="card mx-auto max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{form.id ? 'Edit Offer' : 'Add Offer'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-stone-100"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="mt-4 space-y-4">
              <div>
                <label className="label-text">Title *</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Discount %</label>
                  <input type="number" min="0" max="90" className="input-field" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Valid Till</label>
                  <input type="date" className="input-field" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
              </label>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-stone-300 px-5 text-sm font-semibold text-stone-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <EmptyState title="No offers" subtitle="Create offers to show them on the website." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {offers.map((o) => (
            <div key={o.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-accent)]/20 font-display font-bold text-[color:var(--brand-primary)]">
                {o.discount_percent > 0 ? `${o.discount_percent}%` : '-'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-stone-900">{o.title}</div>
                <div className="truncate text-xs text-stone-500">{o.description}</div>
                <div className="text-xs text-stone-400">{o.valid_to ? `Valid till ${new Date(o.valid_to).toLocaleDateString('en-IN')}` : 'No end date'}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>{o.is_active ? 'Active' : 'Off'}</span>
              <button onClick={() => { setForm({ id: o.id, title: o.title, description: o.description, discount_percent: String(o.discount_percent), valid_to: o.valid_to ?? '', is_active: o.is_active }); setShowForm(true); }} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil size={15} /></button>
              <button onClick={() => remove(o)} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-[color:var(--brand-danger)]"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
