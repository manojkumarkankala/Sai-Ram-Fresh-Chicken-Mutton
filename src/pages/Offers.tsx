import { MessageCircle } from 'lucide-react';
import { useShop } from '@/lib/store';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/Ui';
import { waLink } from '@/lib/format';

export function Offers() {
  const { offers, products, business } = useShop();
  const now = new Date().toISOString().slice(0, 10);
  const activeOffers = offers.filter((o) => o.is_active && (!o.valid_to || o.valid_to >= now));
  const discountedProducts = products.filter((p) => p.discount_percent > 0 && p.is_available);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">Special Offers</h1>
      <p className="mt-1 text-stone-600">Save more on fresh chicken, mutton and eggs.</p>

      {activeOffers.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {activeOffers.map((o) => (
            <div key={o.id} className="card flex items-center gap-4 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-accent)]/20 font-display text-lg font-bold text-[color:var(--brand-primary)]">
                {o.discount_percent > 0 ? `${o.discount_percent}%` : <MessageCircle size={24} />}
              </div>
              <div>
                <div className="font-display font-bold text-stone-900">{o.title}</div>
                <p className="mt-1 text-sm text-stone-500">{o.description}</p>
                {o.valid_to && <div className="mt-1 text-xs font-medium text-[color:var(--brand-danger)]">Valid till {new Date(o.valid_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-2xl font-bold text-stone-900">Discounted Products</h2>
      {discountedProducts.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {discountedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState title="No discounts right now" subtitle="Check back soon, or message us on WhatsApp for today's rates." />
        </div>
      )}

      <div className="card mt-10 p-6 text-center">
        <p className="text-stone-600">Want a custom bulk rate for a function or hotel?</p>
        <a
          href={waLink(business.whatsapp, `Hello ${business.business_name}! I need a bulk order quote.`)}
          target="_blank"
          rel="noreferrer"
          className="btn-wa mx-auto mt-4"
        >
          <MessageCircle size={16} /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
