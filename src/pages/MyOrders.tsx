import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { inr, STATUS_LABELS, STATUS_COLORS } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Order, OrderItem } from '@/lib/types';

type MyOrder = Omit<Order, 'order_items'> & { items: OrderItem[] };

export function MyOrders() {
  const [phone, setPhone] = useState(localStorage.getItem('sairam_my_phone') ?? '');
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_orders', { p_phone: phone.trim() });
    setLoading(false);
    setSearched(true);
    if (!error && data) {
      setOrders(data as MyOrder[]);
      localStorage.setItem('sairam_my_phone', phone.trim());
    } else {
      setOrders([]);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">My Orders</h1>
      <p className="mt-1 text-sm text-stone-500">Enter your mobile number to see your order history.</p>

      <form onSubmit={lookup} className="card mt-6 flex gap-3 p-4">
        <input
          className="input-field flex-1"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Your mobile number"
          inputMode="tel"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? 'Searching...' : 'Find Orders'}
        </button>
      </form>

      {loading && <Spinner label="Finding your orders..." />}

      {!loading && searched && orders && orders.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No orders found" subtitle="We could not find any orders for this number. Double-check it or place your first order." />
        </div>
      )}

      {!loading && orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-display font-bold text-[color:var(--brand-primary)]">{o.order_number}</span>
                  <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <div className="text-sm text-stone-500">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="mt-3 divide-y divide-stone-100 text-sm">
                {(o.items ?? []).map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5">
                    <span className="text-stone-600">{item.product_name} ({item.quantity_label})</span>
                    <span className="font-medium">{inr(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="text-xs text-stone-500">Payment: {o.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                <span className="font-bold text-stone-900">Total: {inr(o.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
