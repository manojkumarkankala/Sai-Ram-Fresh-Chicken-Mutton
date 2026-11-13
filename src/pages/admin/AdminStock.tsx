import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { Spinner } from '@/components/Ui';
import type { Product } from '@/lib/types';

export function AdminStock() {
  const { refreshShop } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('sort_order');
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  const update = async (p: Product, payload: Partial<Product>) => {
    await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', p.id);
    setSaved(p.id);
    setTimeout(() => setSaved(null), 1500);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading stock..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Manage Stock</h1>
        <p className="text-sm text-stone-500">Set available quantity. When stock runs out, the product is automatically hidden from ordering.</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
              <th className="p-3">Product</th>
              <th className="p-3">Stock Qty</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Status</th>
              <th className="p-3">Available for Ordering</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-stone-50 last:border-0">
                <td className="p-3 font-medium text-stone-900">{p.name}</td>
                <td className="p-3">
                  <input
                    type="number" step="0.01" defaultValue={p.stock_qty ?? ''}
                    onBlur={(e) => String(p.stock_qty ?? '') !== e.target.value && update(p, { stock_qty: e.target.value === '' ? null : Number(e.target.value) })}
                    className="input-field w-28 py-1.5"
                    placeholder="Unlimited"
                  />
                </td>
                <td className="p-3">
                  <select
                    defaultValue={p.stock_unit}
                    onChange={(e) => update(p, { stock_unit: e.target.value as 'kg' | 'pcs' })}
                    className="input-field w-24 py-1.5"
                  >
                    <option value="kg">KG</option>
                    <option value="pcs">Pieces</option>
                  </select>
                </td>
                <td className="p-3">
                  <select
                    defaultValue={p.stock_status}
                    onChange={(e) => update(p, { stock_status: e.target.value as Product['stock_status'] })}
                    className="input-field w-36 py-1.5"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  {saved === p.id && <span className="ml-2 text-xs font-semibold text-[color:var(--brand-success)]">saved</span>}
                </td>
                <td className="p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={p.is_available}
                      onChange={(e) => update(p, { is_available: e.target.checked })}
                    />
                    {p.is_available ? 'Orderable' : 'Hidden from customers'}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
