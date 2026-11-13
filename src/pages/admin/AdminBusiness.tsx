import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import type { BusinessSettings } from '@/lib/types';

export function AdminBusiness() {
  const { business, refreshShop } = useShop();
  const [form, setForm] = useState<BusinessSettings>(business);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(business); }, [business]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('website_settings').upsert({
      key: 'business',
      value: {
        ...form,
        phones: form.phones.filter((p) => p.trim()),
      },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await refreshShop();
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Business Information</h1>
        <p className="text-sm text-stone-500">Shown across the website, invoices and WhatsApp messages.</p>
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <div>
          <label className="label-text">Business Name</label>
          <input className="input-field" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        </div>
        <div>
          <label className="label-text">Tagline</label>
          <input className="input-field" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
        <div>
          <label className="label-text">Address</label>
          <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label-text">Contact Numbers (one per line)</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.phones.join('\n')}
            onChange={(e) => setForm({ ...form, phones: e.target.value.split('\n') })}
          />
        </div>
        <div>
          <label className="label-text">WhatsApp Number (with country code)</label>
          <input className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+919866606603" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Opening Time</label>
            <input className="input-field" value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Closing Time</label>
            <input className="input-field" value={form.closing_hours} onChange={(e) => setForm({ ...form, closing_hours: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-text">Holiday Information</label>
          <input className="input-field" value={form.holiday_info} onChange={(e) => setForm({ ...form, holiday_info: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-text">Facebook URL</label>
            <input className="input-field" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Instagram URL</label>
            <input className="input-field" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
          <div>
            <label className="label-text">YouTube URL</label>
            <input className="input-field" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Business Info'}</>}
        </button>
      </form>
    </div>
  );
}
