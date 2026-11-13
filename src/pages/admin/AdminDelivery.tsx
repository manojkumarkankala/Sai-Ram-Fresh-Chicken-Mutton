import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import type { DeliverySettings } from '@/lib/types';

export function AdminDelivery() {
  const { delivery, refreshShop } = useShop();
  const [form, setForm] = useState<DeliverySettings>(delivery);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(delivery); }, [delivery]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('website_settings').upsert({
      key: 'delivery',
      value: {
        charge: Number(form.charge) || 0,
        free_above: Number(form.free_above) || 0,
        min_order: Number(form.min_order) || 0,
      },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await refreshShop();
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Delivery Settings</h1>
        <p className="text-sm text-stone-500">These rules are applied by the database when an order is placed - the customer's browser cannot change them.</p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <div>
          <label className="label-text">Delivery Charge (₹)</label>
          <input type="number" min="0" step="0.01" className="input-field" value={form.charge}
            onChange={(e) => setForm({ ...form, charge: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label-text">Free Delivery Above (₹)</label>
          <input type="number" min="0" step="0.01" className="input-field" value={form.free_above}
            onChange={(e) => setForm({ ...form, free_above: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-stone-400">Set to 0 to always charge delivery. Shop pickup orders are always free.</p>
        </div>
        <div>
          <label className="label-text">Minimum Order Value (₹)</label>
          <input type="number" min="0" step="0.01" className="input-field" value={form.min_order}
            onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-stone-400">Set to 0 for no minimum.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}</>}
        </button>
      </form>
    </div>
  );
}
