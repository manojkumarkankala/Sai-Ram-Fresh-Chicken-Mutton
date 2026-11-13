import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { inr, STATUS_LABELS, STATUS_COLORS, ORDER_TYPE_LABELS, PAYMENT_LABELS } from '@/lib/format';
import { Spinner } from '@/components/Ui';
import type { Order } from '@/lib/types';

export function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2000);
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner label="Loading reports..." />;

  const paid = orders.filter((o) => o.status !== 'cancelled');

  // last 14 days sales
  const days: { label: string; total: number; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter((o) => o.created_at.slice(0, 10) === key);
    days.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      total: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      count: dayOrders.length,
    });
  }
  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  // by order type
  const byType = Object.keys(ORDER_TYPE_LABELS).map((t) => ({
    label: ORDER_TYPE_LABELS[t],
    count: orders.filter((o) => o.order_type === t).length,
  }));
  const maxType = Math.max(...byType.map((t) => t.count), 1);

  // top status distribution
  const statusCounts = Object.keys(STATUS_LABELS).map((s) => ({
    label: STATUS_LABELS[s as keyof typeof STATUS_LABELS],
    color: STATUS_COLORS[s as keyof typeof STATUS_COLORS],
    count: orders.filter((o) => o.status === s).length,
  }));

  const paymentBreakdown = Object.keys(PAYMENT_LABELS).map((m) => ({
    label: PAYMENT_LABELS[m as keyof typeof PAYMENT_LABELS],
    amount: paid.filter((o) => o.payment_method === m).reduce((s, o) => s + Number(o.total_amount), 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Reports</h1>
        <p className="text-sm text-stone-500">Sales for the last 14 days and order breakdowns.</p>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-stone-900">Daily Sales (last 14 days)</h2>
        <div className="mt-4 flex h-48 items-end gap-2">
          {days.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full text-center text-[10px] font-semibold text-stone-600">{d.total > 0 ? inr(d.total) : ''}</div>
              <div
                className="w-full rounded-t bg-[color:var(--brand-primary)] transition-all"
                style={{ height: `${Math.max((d.total / maxTotal) * 100, 2)}%` }}
                title={`${d.label}: ${inr(d.total)} (${d.count} orders)`}
              />
              <div className="w-full truncate text-center text-[9px] text-stone-400">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display font-bold text-stone-900">Orders by Type</h2>
          <div className="mt-4 space-y-3">
            {byType.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-sm"><span>{t.label}</span><span className="font-semibold">{t.count}</span></div>
                <div className="mt-1 h-2 rounded-full bg-stone-100">
                  <div className="h-2 rounded-full bg-[color:var(--brand-accent)]" style={{ width: `${(t.count / maxType) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold text-stone-900">Order Status</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusCounts.map((s) => (
              <div key={s.label} className="rounded-lg border border-stone-100 p-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>
                <div className="mt-1 text-lg font-bold">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-stone-900">Collections by Payment Method</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {paymentBreakdown.map((m) => (
            <div key={m.label} className="rounded-lg border border-stone-100 p-4 text-center">
              <div className="text-xs text-stone-500">{m.label}</div>
              <div className="text-lg font-bold text-[color:var(--brand-success)]">{inr(m.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
