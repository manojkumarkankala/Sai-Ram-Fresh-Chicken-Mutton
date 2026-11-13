import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { inr, itemAmount, waLink, ORDER_TYPE_LABELS } from '@/lib/format';
import { buildOrderMessage } from '@/lib/whatsapp';
import { EmptyState } from '@/components/Ui';
import type { CartItem } from '@/lib/types';

interface Confirmed {
  order_number: string;
  total: number;
}

export function Checkout() {
  const { cart, business, delivery, cartSubtotal, cartDiscount, clearCart } = useShop();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: '', phone: '', whatsapp_phone: '', delivery_address: '',
    village: '', landmark: '', preferred_date: '', preferred_time: '',
    order_type: 'home_delivery', instructions: '', payment_method: 'cash' as const,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  const isPickup = form.order_type === 'shop_pickup';
  const deliveryCharge = isPickup || cartSubtotal >= (delivery.free_above || 999999) ? 0 : delivery.charge;
  const total = Math.max(0, Math.round((cartSubtotal - cartDiscount + deliveryCharge) * 100) / 100);

  if (cart.length === 0 && !confirmed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          subtitle="Add products before checking out."
          action={<Link to="/products/all" className="btn-primary">Browse Products</Link>}
        />
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name.trim()) return setError('Please enter your full name.');
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) return setError('Please enter a valid mobile number.');
    if (!isPickup && !form.delivery_address.trim()) return setError('Please enter your delivery address.');

    setSubmitting(true);
    const items = cart.map((c) => ({ product_id: c.productId, quantity: c.quantity, unit: c.unit }));
    const { data, error: rpcError } = await supabase.rpc('create_order', {
      p_order: {
        customer_name: form.customer_name,
        phone: form.phone,
        whatsapp_phone: form.whatsapp_phone || form.phone,
        delivery_address: isPickup ? '' : form.delivery_address,
        village: form.village,
        landmark: form.landmark,
        order_type: form.order_type,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        instructions: form.instructions,
      },
      p_items: items,
    });
    setSubmitting(false);

    if (rpcError || !data) {
      setError(rpcError?.message ?? 'Could not place the order. Please try again.');
      return;
    }
    const result = data as { order_number: string; total: number };
    setConfirmed(result);
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (confirmed) {
    const message = buildOrderMessage(
      confirmed.order_number, form.customer_name, cart, cartSubtotal, cartDiscount, deliveryCharge, confirmed.total,
      isPickup ? 'Shop pickup' : form.delivery_address, form.preferred_time,
    );
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-[color:var(--brand-success)]" />
          <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Order Placed Successfully!</h1>
          <p className="mt-2 text-stone-600">
            Your order ID is <span className="font-bold text-[color:var(--brand-primary)]">{confirmed.order_number}</span>.
            Total: <span className="font-bold">{inr(confirmed.total)}</span>
          </p>
          <p className="mt-2 text-sm text-stone-500">We will confirm your order shortly. Send it to us on WhatsApp to get a faster response.</p>
          <a
            href={waLink(business.whatsapp, message)}
            target="_blank"
            rel="noreferrer"
            className="btn-wa mx-auto mt-6 px-6 py-3 text-base"
          >
            <MessageCircle size={18} /> Send Order on WhatsApp
          </a>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-orders" className="btn-primary">My Orders</Link>
            <button onClick={() => navigate('/')} className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Customer Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Full Name *</label>
                <input className="input-field" value={form.customer_name} onChange={set('customer_name')} placeholder="Your full name" />
              </div>
              <div>
                <label className="label-text">Mobile Number *</label>
                <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="98666 06603" inputMode="tel" />
              </div>
              <div>
                <label className="label-text">WhatsApp Number</label>
                <input className="input-field" value={form.whatsapp_phone} onChange={set('whatsapp_phone')} placeholder="Same as mobile (optional)" inputMode="tel" />
              </div>
              <div>
                <label className="label-text">Order Type *</label>
                <select className="input-field" value={form.order_type} onChange={set('order_type')}>
                  {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {!isPickup && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-stone-900">Delivery Address</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="label-text">Delivery Address *</label>
                  <textarea className="input-field" rows={3} value={form.delivery_address} onChange={set('delivery_address')} placeholder="House no, street, area" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-text">Village / Town</label>
                    <input className="input-field" value={form.village} onChange={set('village')} />
                  </div>
                  <div>
                    <label className="label-text">Landmark</label>
                    <input className="input-field" value={form.landmark} onChange={set('landmark')} placeholder="Near temple, bus stop..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Delivery Time</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Order Date</label>
                <input type="date" className="input-field" value={form.preferred_date} onChange={set('preferred_date')} />
              </div>
              <div>
                <label className="label-text">Preferred Delivery Time</label>
                <input type="time" className="input-field" value={form.preferred_time} onChange={set('preferred_time')} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label-text">Additional Instructions</label>
              <textarea className="input-field" rows={2} value={form.instructions} onChange={set('instructions')} placeholder="Cutting preference, spicy marinade, etc." />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Review Your Order</h2>
            <div className="mt-3 divide-y divide-stone-100">
              {cart.map((item: CartItem) => (
                <div key={`${item.productId}-${item.unit}`} className="flex justify-between gap-2 py-2 text-sm">
                  <span className="text-stone-600">
                    {item.name} <span className="text-stone-400">({item.unit === 'kg' ? `${item.quantity} kg` : `${item.quantity} pcs`})</span>
                  </span>
                  <span className="font-medium">{inr(itemAmount(item.unit, item.quantity, item.pricePerKg, item.pricePerPiece, item.discountPercent))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{inr(cartSubtotal)}</span></div>
              {cartDiscount > 0 && <div className="flex justify-between text-[color:var(--brand-success)]"><span>Discount</span><span>-{inr(cartDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-stone-500">Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : inr(deliveryCharge)}</span></div>
              <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{inr(total)}</span></div>
            </div>

            {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}

            <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full py-3">
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
            <p className="mt-2 text-center text-xs text-stone-400">Pay by cash or UPI on delivery. No advance payment needed.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
