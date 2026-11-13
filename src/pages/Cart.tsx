import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useShop } from '@/lib/store';
import { inr, kgLabel, itemAmount } from '@/lib/format';
import { QuantityStepper, EmptyState } from '@/components/Ui';

export function Cart() {
  const { cart, updateCartQuantity, removeFromCart, cartSubtotal, cartDiscount, delivery, products } = useShop();
  const deliveryCharge = cartSubtotal >= (delivery.free_above || 999999) ? 0 : delivery.charge;
  const total = Math.max(0, Math.round((cartSubtotal - cartDiscount + deliveryCharge) * 100) / 100);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          subtitle="Add fresh chicken, mutton or eggs to get started."
          action={<Link to="/products/all" className="btn-primary"><ShoppingBag size={16} /> Browse Products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">Shopping Cart</h1>
      <p className="mt-1 text-sm text-stone-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const unavailable = product ? (!product.is_available || product.stock_status === 'out_of_stock') : true;
            return (
              <div key={`${item.productId}-${item.unit}`} className="card flex gap-4 p-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                )}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-stone-900">{item.name}</div>
                      <div className="text-xs text-stone-500">
                        {inr(item.unit === 'kg' ? item.pricePerKg ?? 0 : item.pricePerPiece ?? 0)}/{item.unit === 'kg' ? 'kg' : 'pc'}
                        {item.discountPercent > 0 && <span className="ml-1 font-semibold text-[color:var(--brand-danger)]">-{item.discountPercent}%</span>}
                      </div>
                      {unavailable && <div className="mt-1 text-xs font-semibold text-[color:var(--brand-danger)]">Currently unavailable - remove to checkout</div>}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.unit)}
                      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-[color:var(--brand-danger)]"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(v) => updateCartQuantity(item.productId, item.unit, v)}
                      step={item.unit === 'kg' ? 0.25 : 1}
                      min={item.unit === 'kg' ? 0.25 : 1}
                    />
                    <div className="text-sm font-bold text-stone-900">
                      {inr(itemAmount(item.unit, item.quantity, item.pricePerKg, item.pricePerPiece, item.discountPercent))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span className="font-medium">{inr(cartSubtotal)}</span></div>
              {cartDiscount > 0 && (
                <div className="flex justify-between"><span className="text-stone-500">Product discounts</span><span className="font-medium text-[color:var(--brand-success)]">-{inr(cartDiscount)}</span></div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery</span>
                <span className="font-medium">{deliveryCharge === 0 ? <span className="text-[color:var(--brand-success)]">FREE</span> : inr(deliveryCharge)}</span>
              </div>
              {cartSubtotal < (delivery.free_above || 999999) && (
                <div className="rounded-lg bg-[color:var(--brand-accent)]/10 px-3 py-2 text-xs text-stone-600">
                  Add {inr((delivery.free_above || 999999) - cartSubtotal)} more for free delivery.
                </div>
              )}
              <div className="border-t border-stone-200 pt-2">
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>{inr(total)}</span></div>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary mt-5 w-full">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products/all" className="mt-2 block w-full rounded-lg border border-stone-300 px-5 py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
