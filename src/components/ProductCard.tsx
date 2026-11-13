import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, MessageCircle, ShoppingCart, Star, Check, PackageX } from 'lucide-react';
import type { Product } from '@/lib/types';
import { finalPrice, inr, kgLabel, KG_QUANTITY_OPTIONS, waLink } from '@/lib/format';
import { useShop } from '@/lib/store';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, business } = useShop();
  const available = product.is_available && product.stock_status !== 'out_of_stock';
  const hasKg = product.price_per_kg != null;
  const hasPcs = product.price_per_piece != null;
  const [unit, setUnit] = useState<'kg' | 'pcs'>(hasKg ? 'kg' : 'pcs');
  const [qty, setQty] = useState(hasKg ? 0.5 : 1);
  const [custom, setCustom] = useState(false);
  const [added, setAdded] = useState(false);
  const effPrice = finalPrice(product);

  const pricePerUnit = unit === 'kg' ? product.price_per_kg : product.price_per_piece;
  const amount = pricePerUnit != null ? Math.round(pricePerUnit * qty * (1 - product.discount_percent / 100) * 100) / 100 : 0;

  const handleAdd = () => {
    if (!available) return;
    addToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      unit,
      quantity: qty,
      pricePerKg: product.price_per_kg,
      pricePerPiece: product.price_per_piece,
      discountPercent: product.discount_percent,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const waText = encodeURIComponent(
    `Hello ${business.business_name}! I would like to order:\n${product.name} - ${unit === 'kg' ? kgLabel(qty) : `${qty} PCS`}\nEstimated price: ${inr(amount)}\nPlease confirm availability.`,
  );

  const qtyOptions = hasKg ? KG_QUANTITY_OPTIONS : [1, 2, 3, 6, 12, 30];

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-44 items-center justify-center text-stone-300"><PackageX size={40} /></div>
        )}
        {product.discount_percent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[color:var(--brand-danger)] px-2 py-0.5 text-xs font-bold text-white">
            {product.discount_percent}% OFF
          </span>
        )}
        {product.is_today_special && (
          <span className="absolute right-2 top-2 rounded-full bg-[color:var(--brand-accent)] px-2 py-0.5 text-xs font-bold text-stone-900">
            Today's Special
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-[color:var(--brand-danger)]">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${product.id}`} className="font-display text-sm font-semibold leading-snug text-stone-900 hover:text-[color:var(--brand-primary)]">
            {product.name}
          </Link>
          <div className="text-right">
            <div className="text-sm font-bold text-[color:var(--brand-success)]">{inr(effPrice ?? 0)}<span className="text-xs font-normal text-stone-500">{hasKg ? '/kg' : '/pc'}</span></div>
            {product.discount_percent > 0 && pricePerUnit != null && (
              <div className="text-xs text-stone-400 line-through">{inr(pricePerUnit)}</div>
            )}
          </div>
        </div>
        {product.special_offer_text && (
          <div className="mt-1 text-xs font-medium text-[color:var(--brand-danger)]">{product.special_offer_text}</div>
        )}
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{product.description}</p>

        {available && (
          <div className="mt-3">
            <div className="flex gap-1.5">
              {hasKg && hasPcs && (
                <div className="flex overflow-hidden rounded-md border border-stone-300 text-xs">
                  <button
                    onClick={() => { setUnit('kg'); setQty(0.5); }}
                    className={`px-2 py-1 font-medium ${unit === 'kg' ? 'bg-[color:var(--brand-primary)] text-white' : 'text-stone-600'}`}
                  >
                    KG
                  </button>
                  <button
                    onClick={() => { setUnit('pcs'); setQty(1); }}
                    className={`px-2 py-1 font-medium ${unit === 'pcs' ? 'bg-[color:var(--brand-primary)] text-white' : 'text-stone-600'}`}
                  >
                    PCS
                  </button>
                </div>
              )}
              {(unit === 'kg' ? KG_QUANTITY_OPTIONS : [1, 2, 3, 6, 12, 30]).map((q) => (
                <button
                  key={q}
                  onClick={() => { setQty(q); setCustom(false); }}
                  className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                    !custom && qty === q
                      ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white'
                      : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
                  }`}
                >
                  {unit === 'kg' ? kgLabel(q) : `${q}`}
                </button>
              ))}
              <button
                onClick={() => setCustom(true)}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                  custom
                    ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white'
                    : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
                }`}
              >
                Custom
              </button>
            </div>
            {custom && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={unit === 'kg' ? 0.1 : 1}
                  step={unit === 'kg' ? 0.05 : 1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(unit === 'kg' ? 0.05 : 1, Number(e.target.value) || 0))}
                  className="input-field w-28 py-1.5 text-xs"
                  placeholder={unit === 'kg' ? 'kg' : 'pcs'}
                />
                <span className="text-xs text-stone-500">{unit === 'kg' ? 'kg' : 'pieces'}</span>
              </div>
            )}
          </div>
        )}

        {available && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm font-bold text-stone-900">{inr(amount)}</div>
            <div className="flex gap-2">
              <a
                href={waLink(business.whatsapp, decodeURIComponent(waText))}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1eb855]"
                aria-label="Order on WhatsApp"
              >
                <MessageCircle size={14} />
              </a>
              <button
                onClick={handleAdd}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                  added ? 'bg-[color:var(--brand-success)]' : 'bg-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-dark)]'
                }`}
              >
                {added ? (<><Check size={14} /> Added</>) : (<><ShoppingCart size={14} /> Add</>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
