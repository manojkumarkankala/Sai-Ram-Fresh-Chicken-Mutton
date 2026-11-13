import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { inr } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Product } from '@/lib/types';

const emptyForm = {
  id: '', name: '', description: '', category_id: '', image_url: '',
  price_per_kg: '', price_per_piece: '', unit: 'kg' as 'kg' | 'piece' | 'both',
  stock_qty: '', stock_unit: 'kg' as 'kg' | 'pcs', discount_percent: '0',
  special_offer_text: '', is_available: true, is_best_seller: false, is_today_special: false,
};

export function AdminProducts() {
  const { categories, refreshShop } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('sort_order');
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  const openNew = () => {
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id, name: p.name, description: p.description, category_id: p.category_id ?? '',
      image_url: p.image_url, price_per_kg: p.price_per_kg?.toString() ?? '',
      price_per_piece: p.price_per_piece?.toString() ?? '', unit: p.unit,
      stock_qty: p.stock_qty?.toString() ?? '', stock_unit: p.stock_unit,
      discount_percent: p.discount_percent.toString(), special_offer_text: p.special_offer_text,
      is_available: p.is_available, is_best_seller: p.is_best_seller, is_today_special: p.is_today_special,
    });
    setShowForm(true);
    setError('');
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { contentType: file.type });
    setUploading(false);
    if (upErr) {
      setError('Image upload failed. Try a smaller image.');
      return;
    }
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Product name is required.');
    if (form.unit !== 'piece' && !form.price_per_kg) return setError('Price per kg is required.');
    if (form.unit !== 'kg' && !form.price_per_piece) return setError('Price per piece is required.');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category_id: form.category_id || null,
      image_url: form.image_url,
      price_per_kg: form.unit !== 'piece' && form.price_per_kg ? Number(form.price_per_kg) : null,
      price_per_piece: form.unit !== 'kg' && form.price_per_piece ? Number(form.price_per_piece) : null,
      unit: form.unit,
      stock_qty: form.stock_qty ? Number(form.stock_qty) : null,
      stock_unit: form.stock_unit,
      discount_percent: Number(form.discount_percent) || 0,
      special_offer_text: form.special_offer_text.trim(),
      is_available: form.is_available,
      is_best_seller: form.is_best_seller,
      is_today_special: form.is_today_special,
      updated_at: new Date().toISOString(),
    };

    const { error: saveErr } = form.id
      ? await supabase.from('products').update(payload).eq('id', form.id)
      : await supabase.from('products').insert(payload);
    setSaving(false);
    if (saveErr) return setError('Could not save the product. Try again.');

    setShowForm(false);
    await load();
    await refreshShop();
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await supabase.from('products').delete().eq('id', p.id);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading products..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Manage Products</h1>
          <p className="text-sm text-stone-500">{products.length} products. Changes go live on the website instantly.</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Add Product</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="card mx-auto max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{form.id ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-stone-100"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text">Product Name *</label>
                  <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label-text">Category</label>
                  <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-text">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Product Image</label>
                <div className="flex items-center gap-3">
                  {form.image_url && <img src={form.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-primary py-2 text-xs" disabled={uploading}>
                    <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="text-xs text-stone-500 hover:underline">Remove</button>
                  )}
                </div>
                <input className="input-field mt-2 text-xs" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Or paste an image URL" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-text">Selling Unit</label>
                  <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as typeof form.unit })}>
                    <option value="kg">Per KG</option>
                    <option value="piece">Per Piece</option>
                    <option value="both">Both KG & Piece</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Price per KG (₹)</label>
                  <input type="number" step="0.01" className="input-field" value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} disabled={form.unit === 'piece'} />
                </div>
                <div>
                  <label className="label-text">Price per Piece (₹)</label>
                  <input type="number" step="0.01" className="input-field" value={form.price_per_piece} onChange={(e) => setForm({ ...form, price_per_piece: e.target.value })} disabled={form.unit === 'kg'} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-text">Stock Qty</label>
                  <input type="number" step="0.01" className="input-field" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} placeholder="Leave empty for unlimited" />
                </div>
                <div>
                  <label className="label-text">Stock Unit</label>
                  <select className="input-field" value={form.stock_unit} onChange={(e) => setForm({ ...form, stock_unit: e.target.value as typeof form.stock_unit })}>
                    <option value="kg">KG</option>
                    <option value="pcs">Pieces</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Discount %</label>
                  <input type="number" step="0.01" min="0" max="90" className="input-field" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-text">Special Offer Text</label>
                <input className="input-field" value={form.special_offer_text} onChange={(e) => setForm({ ...form, special_offer_text: e.target.value })} placeholder="e.g. 5% off today" />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Available for ordering
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> Best seller
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_today_special} onChange={(e) => setForm({ ...form, is_today_special: e.target.checked })} /> Today's special
                </label>
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Product'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-stone-300 px-5 text-sm font-semibold text-stone-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState title="No products yet" subtitle="Add your first product to start selling." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
                <th className="p-3">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-50 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                      <div>
                        <div className="font-medium text-stone-900">{p.name}</div>
                        <div className="text-xs text-stone-400">{categories.find((c) => c.id === p.category_id)?.name ?? 'Uncategorized'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{p.price_per_kg != null ? `${inr(Number(p.price_per_kg))}/kg` : `${inr(Number(p.price_per_piece))}/pc`}</td>
                  <td className="p-3">{p.stock_qty != null ? `${p.stock_qty} ${p.stock_unit}` : 'Unlimited'}</td>
                  <td className="p-3">{p.discount_percent > 0 ? `${p.discount_percent}%` : '-'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_available && p.stock_status !== 'out_of_stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.is_available ? (p.stock_status === 'out_of_stock' ? 'Out of Stock' : p.stock_status === 'low_stock' ? 'Low Stock' : 'Available') : 'Unavailable'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(p)} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-[color:var(--brand-danger)]" aria-label="Delete"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
