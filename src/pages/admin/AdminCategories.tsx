import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Category } from '@/lib/types';

const emptyForm = { id: '', slug: '', name: '', description: '', image_url: '', sort_order: '0', is_active: true };

export function AdminCategories() {
  const { refreshShop } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Category name is required.');
    const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSaving(true);
    const payload = {
      slug, name: form.name.trim(), description: form.description.trim(),
      image_url: form.image_url, sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    const { error: saveErr } = form.id
      ? await supabase.from('categories').update(payload).eq('id', form.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (saveErr) return setError('Could not save. The category name must be unique.');
    setShowForm(false);
    await load();
    await refreshShop();
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"? Products in it will become uncategorized.`)) return;
    await supabase.from('categories').delete().eq('id', c.id);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading categories..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Product Categories</h1>
          <p className="text-sm text-stone-500">Categories power the website menu and shop filters.</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="card mx-auto max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{form.id ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-stone-100"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="mt-4 space-y-4">
              <div>
                <label className="label-text">Name *</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Description</label>
                <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Image URL</label>
                <input className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Sort Order</label>
                  <input type="number" className="input-field" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active on website
                </label>
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-stone-300 px-5 text-sm font-semibold text-stone-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <EmptyState title="No categories" subtitle="Add categories like Chicken, Mutton and Eggs." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-4">
              {c.image_url && <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-stone-900">{c.name}</div>
                <div className="truncate text-xs text-stone-400">/{c.slug}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>{c.is_active ? 'Active' : 'Hidden'}</span>
              <button onClick={() => { setForm({ id: c.id, slug: c.slug, name: c.name, description: c.description, image_url: c.image_url, sort_order: String(c.sort_order), is_active: c.is_active }); setShowForm(true); }} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil size={15} /></button>
              <button onClick={() => remove(c)} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-[color:var(--brand-danger)]"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
