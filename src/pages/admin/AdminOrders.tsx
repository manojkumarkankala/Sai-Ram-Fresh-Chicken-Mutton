import { useEffect, useState } from 'react';
import { MessageCircle, Printer, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { buildInvoiceMessage, buildOrderMessageFromOrder } from '@/lib/whatsapp';
import { inr, ORDER_TYPE_LABELS, PAYMENT_LABELS, STATUS_LABELS, STATUS_COLORS, waLink, openWhatsApp } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Order, OrderStatus, PaymentMethod } from '@/lib/types';

const STATUSES: OrderStatus[] = ['new', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export function AdminOrders() {
  const { business } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const items = order.order_items?.map((oi, i) => `${i + 1}. ${oi.product_name} - ${oi.quantity_label}`).join('\n') ?? '';
      const msg = `Hello ${order.customer_name}!\n\nYour order ${order.order_number} from ${business.business_name} is now: ${STATUS_LABELS[status]}.\n\nItems:\n${items}\n\nTotal: ${inr(Number(order.total_amount))}\n\nThank you for ordering with us!`;
      await supabase.from('whatsapp_messages').insert({
        direction: 'outgoing', phone: order.whatsapp_phone || order.phone,
        customer_name: order.customer_name, order_number: order.order_number, message: msg,
      });
      if (status === 'out_for_delivery' || status === 'ready' || status === 'cancelled') {
        openWhatsApp(order.whatsapp_phone || order.phone, msg);
      }
    }
    load();
  };

  const updatePayment = async (orderId: string, payment_status: string, payment_method: PaymentMethod) => {
    await supabase.from('orders').update({ payment_status, payment_method }).eq('id', orderId);
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

  if (loading) return <Spinner label="Loading orders..." />;

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Customer Orders</h1>
        <p className="text-sm text-stone-500">{orders.length} total orders. New orders appear here instantly.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === s ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white' : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders" subtitle="Orders placed by customers will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-stone-50">
                <div className="flex items-center gap-3">
                  <ChevronDown size={16} className={`text-stone-400 transition ${expanded === order.id ? 'rotate-180' : ''}`} />
                  <div>
                    <span className="font-display font-bold text-[color:var(--brand-primary)]">{order.order_number}</span>
                    <span className="ml-2 text-sm text-stone-600">{order.customer_name}</span>
                    <span className="ml-2 text-xs text-stone-400">{new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                  <span className="font-bold text-stone-900">{inr(Number(order.total_amount))}</span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-stone-100 bg-stone-50 p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-1 text-sm text-stone-600">
                      <div><span className="font-semibold">Phone:</span> {order.phone}</div>
                      <div><span className="font-semibold">WhatsApp:</span> {order.whatsapp_phone || order.phone}</div>
                      <div><span className="font-semibold">Order Type:</span> {ORDER_TYPE_LABELS[order.order_type]}</div>
                      <div><span className="font-semibold">Address:</span> {order.delivery_address || 'Shop pickup'} {order.village && `, ${order.village}`} {order.landmark && `(${order.landmark})`}</div>
                      <div><span className="font-semibold">Preferred:</span> {order.preferred_date ?? 'ASAP'} {order.preferred_time}</div>
                      {order.instructions && <div><span className="font-semibold">Instructions:</span> {order.instructions}</div>}
                    </div>
                    <div className="rounded-lg bg-white p-3 text-sm">
                      {(order.order_items ?? []).map((oi) => (
                        <div key={oi.id} className="flex justify-between py-1">
                          <span>{oi.product_name} <span className="text-stone-400">({oi.quantity_label} @ {oi.rate_label})</span></span>
                          <span className="font-medium">{inr(Number(oi.amount))}</span>
                        </div>
                      ))}
                      <div className="mt-2 border-t border-stone-200 pt-2 text-right font-bold">Total: {inr(Number(order.total_amount))}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      className="input-field w-44 py-1.5 text-xs"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <select
                      value={order.payment_method}
                      onChange={(e) => updatePayment(order.id, order.payment_status, e.target.value as PaymentMethod)}
                      className="input-field w-28 py-1.5 text-xs"
                    >
                      {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select
                      value={order.payment_status}
                      onChange={(e) => updatePayment(order.id, e.target.value, order.payment_method)}
                      className="input-field w-28 py-1.5 text-xs"
                    >
                      <option value="pending">Payment Pending</option>
                      <option value="paid">Payment Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <a
                      href={waLink(order.whatsapp_phone || order.phone, buildOrderMessageFromOrder(order, business))}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-wa py-1.5 text-xs"
                    >
                      <MessageCircle size={14} /> WhatsApp Customer
                    </a>
                    <button onClick={() => printInvoice(order)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white">
                      <Printer size={14} className="mr-1 inline" /> Print / PDF Invoice
                    </button>
                    <button
                      onClick={async () => {
                        openWhatsApp(order.whatsapp_phone || order.phone, buildInvoiceMessage(order, business));
                        await supabase.from('whatsapp_messages').insert({
                          direction: 'outgoing', phone: order.whatsapp_phone || order.phone,
                          customer_name: order.customer_name, order_number: order.order_number,
                          message: buildInvoiceMessage(order, business),
                        });
                      }}
                      className="rounded-lg border border-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#1eb855] hover:bg-green-50"
                    >
                      Send Bill on WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
