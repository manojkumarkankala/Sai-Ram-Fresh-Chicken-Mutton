import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { inr, PAYMENT_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Order } from '@/lib/types';

export function AdminBilling() {
  const { business } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, orders(*, order_items(*))')
      .order('created_at', { ascending: false })
      .limit(500);
    const rows = (data ?? []).map((inv: { orders: Order }) => inv.orders).filter(Boolean) as Order[];
    setOrders(rows);
    setLoading(false);
  };

  const setPayment = async (o: Order, payment_status: string) => {
    await supabase.from('orders').update({ payment_status }).eq('id', o.id);
    await supabase.from('invoices').update({ payment_status }).eq('invoice_number', o.order_number);
    if (payment_status === 'paid') {
      await supabase.from('payments').insert({
        order_id: o.id, amount: Number(o.total_amount), method: o.payment_method, status: 'paid', paid_at: new Date().toISOString(),
      });
    }
    load();
  };

  const printInvoice = (order: Order) => {
    const items = order.order_items ?? [];
    const rows = items.map((oi) =>
      `<tr><td>${oi.product_name}</td><td>${oi.quantity_label}</td><td>${oi.rate_label}</td><td style="text-align:right">${inr(Number(oi.amount))}</td></tr>`,
    ).join('');
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${order.order_number}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#222}h1{color:#0f4c81;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}th{background:#f5b301;color:#222}
      .total{margin-top:16px;font-size:16px}.grand{font-size:20px;font-weight:bold;color:#0f4c81}</style></head><body>
      <h1>${business.business_name}</h1>
      <div>${business.phones.join(' | ')}</div><div>${business.address}</div><hr/>
      <p><b>Invoice Number:</b> ${order.order_number}<br/><b>Date:</b> ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
      <p><b>Customer:</b> ${order.customer_name}<br/><b>Mobile:</b> ${order.phone}<br/><b>Address:</b> ${order.delivery_address || 'Shop pickup'}</p>
      <table><thead><tr><th>Product</th><th>Quantity</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="total">Subtotal: ${inr(Number(order.subtotal))}<br/>Discount: ${inr(Number(order.discount_amount))}<br/>Delivery: ${inr(Number(order.delivery_charge))}</div>
      <div class="grand">GRAND TOTAL: ${inr(Number(order.total_amount))}</div>
      <p><b>Payment Status:</b> ${order.payment_status === 'paid' ? 'Paid' : 'Pending'}</p>
      <p>Thank you for ordering with ${business.business_name}!</p></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) return <Spinner label="Loading invoices..." />;

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.payment_status === filter);
  const totalPaid = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
  const totalPending = orders.filter((o) => o.payment_status === 'pending').reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Billing & Invoices</h1>
        <p className="text-sm text-stone-500">Every order gets a digital invoice automatically. Print, mark paid, and track payments.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="text-xs text-stone-500">Total Collected</div><div className="text-xl font-bold text-[color:var(--brand-success)]">{inr(totalPaid)}</div></div>
        <div className="card p-4"><div className="text-xs text-stone-500">Pending Collection</div><div className="text-xl font-bold text-[color:var(--brand-danger)]">{inr(totalPending)}</div></div>
        <div className="card p-4"><div className="text-xs text-stone-500">Invoices</div><div className="text-xl font-bold text-stone-900">{orders.length}</div></div>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${filter === f ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white' : 'border-stone-300 text-stone-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No invoices" subtitle="Invoices are generated automatically when customers place orders." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
                <th className="p-3">Invoice</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-stone-50 last:border-0">
                  <td className="p-3 font-semibold text-[color:var(--brand-primary)]">{o.order_number}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3 text-stone-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-bold">{inr(Number(o.total_amount))}</td>
                  <td className="p-3">
                    <select
                      defaultValue={o.payment_method}
                      onChange={async (e) => { await supabase.from('orders').update({ payment_method: e.target.value }).eq('id', o.id); load(); }}
                      className="input-field w-24 py-1 text-xs"
                    >
                      {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      defaultValue={o.payment_status}
                      onChange={(e) => setPayment(o, e.target.value)}
                      className={`input-field w-32 py-1 text-xs font-semibold ${o.payment_status === 'paid' ? 'text-[color:var(--brand-success)]' : 'text-[color:var(--brand-danger)]'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => printInvoice(o)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">
                      Print / PDF
                    </button>
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
