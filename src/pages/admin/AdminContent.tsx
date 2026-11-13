import { useEffect, useState } from 'react';
import { Save, Check, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import type { FooterSettings, HomepageSettings, ThemeSettings } from '@/lib/types';

export function AdminContent() {
  const { homepage, footer, theme, refreshShop } = useShop();
  const [home, setHome] = useState<HomepageSettings>(homepage);
  const [foot, setFoot] = useState<FooterSettings>(footer);
  const [themeForm, setThemeForm] = useState<ThemeSettings>(theme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setHome(homepage); setFoot(footer); setThemeForm(theme); }, [homepage, footer, theme]);

  const setH = (key: keyof HomepageSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setHome((h) => ({ ...h, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const reviews = home.reviews.filter((r) => r.name.trim() && r.text.trim());
    await supabase.from('website_settings').upsert([
      { key: 'homepage', value: { ...home, reviews }, updated_at: new Date().toISOString() },
      { key: 'footer', value: foot, updated_at: new Date().toISOString() },
      { key: 'theme', value: themeForm, updated_at: new Date().toISOString() },
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await refreshShop();
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Website Content</h1>
        <p className="text-sm text-stone-500">Edit homepage text, customer reviews, footer and theme colors.</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Hero Section</h2>
          <div>
            <label className="label-text">Headline</label>
            <input className="input-field" value={home.headline} onChange={setH('headline')} />
          </div>
          <div>
            <label className="label-text">Description</label>
            <textarea className="input-field" rows={2} value={home.description} onChange={setH('description')} />
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Freshness & Quality</h2>
          <textarea className="input-field" rows={3} value={home.freshness_info} onChange={setH('freshness_info')} />
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Why Choose Us (4 points)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="rounded-lg border border-stone-200 p-3">
                <label className="label-text">Point {n} Title</label>
                <input className="input-field" value={home[`why_us_${n}_title` as keyof HomepageSettings] as string} onChange={setH(`why_us_${n}_title` as keyof HomepageSettings)} />
                <label className="label-text mt-2">Point {n} Text</label>
                <textarea className="input-field" rows={2} value={home[`why_us_${n}_desc` as keyof HomepageSettings] as string} onChange={setH(`why_us_${n}_desc` as keyof HomepageSettings)} />
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Wholesale & Functions</h2>
          <div>
            <label className="label-text">Section Title</label>
            <input className="input-field" value={home.bulk_orders_title} onChange={setH('bulk_orders_title')} />
          </div>
          <div>
            <label className="label-text">Section Text</label>
            <textarea className="input-field" rows={2} value={home.bulk_orders_desc} onChange={setH('bulk_orders_desc')} />
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-stone-900">Customer Reviews</h2>
            <button type="button" onClick={() => setHome({ ...home, reviews: [...home.reviews, { name: '', text: '', rating: 5 }] })} className="btn-primary py-1.5 text-xs">
              <Plus size={14} /> Add Review
            </button>
          </div>
          {home.reviews.map((r, i) => (
            <div key={i} className="flex flex-wrap items-start gap-2 rounded-lg border border-stone-200 p-3">
              <div className="flex-1 space-y-2">
                <input className="input-field" placeholder="Customer name" value={r.name}
                  onChange={(e) => setHome({ ...home, reviews: home.reviews.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                <textarea className="input-field" rows={2} placeholder="Review text" value={r.text}
                  onChange={(e) => setHome({ ...home, reviews: home.reviews.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <select
                  className="input-field w-20 py-1.5 text-xs"
                  value={r.rating}
                  onChange={(e) => setHome({ ...home, reviews: home.reviews.map((x, j) => j === i ? { ...x, rating: Number(e.target.value) } : x) })}
                >
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star</option>)}
                </select>
                <button type="button" onClick={() => setHome({ ...home, reviews: home.reviews.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-[color:var(--brand-danger)]">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Footer</h2>
          <div>
            <label className="label-text">About Text</label>
            <textarea className="input-field" rows={2} value={foot.about} onChange={(e) => setFoot({ ...foot, about: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Footer Note</label>
            <input className="input-field" value={foot.note} onChange={(e) => setFoot({ ...foot, note: e.target.value })} />
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-display font-bold text-stone-900">Theme Colors</h2>
          <div className="grid gap-4 sm:grid-cols-5">
            {(['primary', 'primary_dark', 'accent', 'success', 'danger'] as const).map((key) => (
              <div key={key}>
                <label className="label-text capitalize">{key.replace('_', ' ')}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeForm[key]} onChange={(e) => setThemeForm({ ...themeForm, [key]: e.target.value })} className="h-9 w-9 cursor-pointer rounded border border-stone-300" />
                  <span className="text-xs text-stone-500">{themeForm[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save All Content'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
