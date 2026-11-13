import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { inr } from '@/lib/format';
import { Spinner } from '@/components/Ui';
import type { Product } from '@/lib/types';

export function AdminPrices() {
  const { refreshShop } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('sort_order');
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  const update = async (p: Product, field: 'price_per_kg' | 'price_per_piece' | 'discount_percent', value: string) => {
    setSavingId(p.id);
    const num = value === '' ? null : Number(value);
    const payload = field === 'discount_percent'
      ? { discount_percent: num ?? 0, updated_at: new Date().toISOString() }
      : { [field]: num, updated_at: new Date().toISOString() };
    await supabase.from('products').update(payload).eq('id', p.id);
    setSavingId(null);
    setSaved(p.id);
    setTimeout(() => setSaved(null), 1500);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading prices..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Manage Prices</h1>
        <p className="text-sm text-stone-500">Change a price and it appears on the customer website immediately. Discounts reduce the effective price automatically.</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
              <th className="p-3">Product</th>
              <th className="p-3">Price / KG</th>
              <th className="p-3">Price / Piece</th>
              <th className="p-3">Discount %</th>
              <th className="p-3">Effective Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const base = p.price_per_kg ?? p.price_per_piece ?? 0;
              const eff = base * (1 - p.discount_percent / 100);
              return (
                <tr key={p.id} className="border-b border-stone-50 last:border-0">
                  <td className="p-3 font-medium text-stone-900">{p.name}</td>
                  <td className="p-3">
                    {p.price_per_kg != null || p.unit !== 'piece' ? (
                      <input
                        type="number" step="0.01" defaultValue={p.price_per_kg ?? ''}
                        onBlur={(e) => String(p.price_per_kg ?? '') !== e.target.value && update(p, 'price_per_kg', e.target.value)}
                        className="input-field w-28 py-1.5"
                      />
                    ) : <span className="text-stone-300">-</span>}
                  </td>
                  <td className="p-3">
                    {p.price_per_piece != null || p.unit !== 'kg' ? (
                      <input
                        type="number" step="0.01" defaultValue={p.price_per_piece ?? ''}
                        onBlur={(e) => String(p.price_per_piece ?? '') !== e.target.value && update(p, 'price_per_piece', e.target.value)}
                        className="input-field w-28 py-1.5"
                      />
                    ) : <span className="text-stone-300">-</span>}
                  </td>
                  <td className="p-3">
                    <input
                      type="number" step="0.5" min="0" max="90" defaultValue={p.discount_percent}
                      onBlur={(e) => Number(p.discount_percent) !== Number(e.target.value) && update(p, 'discount_percent', e.target.value)}
                      className="input-field w-24 py-1.5"
                    />
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-[color:var(--brand-success)]">{inr(Math.round(eff * 100) / 100)}</span>
                    {savingId === p.id && <span className="ml-2 text-xs text-stone-400">saving...</span>}
                    {saved === p.id && <span className="ml-2 text-xs font-semibold text-[color:var(--brand-success)]">saved</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
