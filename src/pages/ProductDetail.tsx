import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingCart, Check, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { useShop } from '@/lib/store';
import { finalPrice, inr, kgLabel, KG_QUANTITY_OPTIONS, waLink } from '@/lib/format';
import { EmptyState } from '@/components/Ui';
import { ProductCard } from '@/components/ProductCard';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart, business } = useShop();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);

  const hasKg = product?.price_per_kg != null;
  const [unit, setUnit] = useState<'kg' | 'pcs'>(hasKg ? 'kg' : 'pcs');
  const [qty, setQty] = useState(hasKg ? 0.5 : 1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Product not found"
          subtitle="It may have been removed or renamed."
          action={<Link to="/products/all" className="btn-primary">Browse All Products</Link>}
        />
      </div>
    );
  }

  const available = product.is_available && product.stock_status !== 'out_of_stock';
  const effPrice = finalPrice(product);
  const pricePerUnit = unit === 'kg' ? product.price_per_kg : product.price_per_piece;
  const amount = pricePerUnit != null ? Math.round(pricePerUnit * qty * (1 - product.discount_percent / 100) * 100) / 100 : 0;
  const related = products.filter((p) => p.category_id === product.category_id && p.id !== product.id && p.is_available).slice(0, 4);

  const waText = encodeURIComponent(
    `Hello ${business.business_name}! I would like to order:\n${product.name} - ${unit === 'kg' ? kgLabel(qty) : `${qty} PCS`} - ${inr(amount)}\nPlease confirm availability.`,
  );

  const handleAdd = (goToCart: boolean) => {
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
    if (goToCart) {
      navigate('/cart');
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-stone-500 hover:text-[color:var(--brand-primary)]">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-stone-100">
          {product.image_url && <img src={product.image_url} alt={product.name} className="h-80 w-full object-cover sm:h-[420px]" />}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {product.is_today_special && (
              <span className="rounded-full bg-[color:var(--brand-accent)] px-3 py-1 text-xs font-bold text-stone-900">Today's Special</span>
            )}
            {product.is_best_seller && (
              <span className="rounded-full bg-[color:var(--brand-success)]/10 px-3 py-1 text-xs font-bold text-[color:var(--brand-success)]">Best Seller</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-stone-900">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-[color:var(--brand-success)]">{inr(effPrice ?? 0)}<span className="text-sm font-normal text-stone-500">{hasKg ? '/kg' : '/pc'}</span></span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-lg text-stone-400 line-through">{inr(hasKg ? product.price_per_kg! : product.price_per_piece!)}</span>
                <span className="rounded bg-[color:var(--brand-danger)] px-2 py-0.5 text-xs font-bold text-white">{product.discount_percent}% OFF</span>
              </>
            )}
          </div>
          {product.special_offer_text && (
            <div className="mt-2 text-sm font-medium text-[color:var(--brand-danger)]">{product.special_offer_text}</div>
          )}
          <p className="mt-4 leading-relaxed text-stone-600">{product.description}</p>

          {available ? (
            <div className="mt-6">
              <div className="label-text">Select quantity</div>
              <div className="flex flex-wrap gap-2">
                {hasKg && product.price_per_piece != null && (
                  <div className="flex overflow-hidden rounded-lg border border-stone-300 text-sm">
                    <button onClick={() => { setUnit('kg'); setQty(0.5); }} className={`px-3 py-1.5 font-medium ${unit === 'kg' ? 'bg-[color:var(--brand-primary)] text-white' : 'text-stone-600'}`}>Per KG</button>
                    <button onClick={() => { setUnit('pcs'); setQty(1); }} className={`px-3 py-1.5 font-medium ${unit === 'pcs' ? 'bg-[color:var(--brand-primary)] text-white' : 'text-stone-600'}`}>Per Piece</button>
                  </div>
                )}
                {(unit === 'kg' ? KG_QUANTITY_OPTIONS : [1, 2, 3, 6, 12, 30]).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQty(q)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      qty === q ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white' : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
                    }`}
                  >
                    {unit === 'kg' ? kgLabel(q) : `${q} pcs`}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={unit === 'kg' ? 0.1 : 1}
                  step={unit === 'kg' ? 0.05 : 1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(unit === 'kg' ? 0.05 : 1, Number(e.target.value) || 0))}
                  className="input-field w-28"
                />
                <span className="text-sm text-stone-500">{unit === 'kg' ? 'kg' : 'pieces'} (custom)</span>
              </div>
              <div className="mt-4 text-xl font-bold text-stone-900">Total: {inr(amount)}</div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => handleAdd(false)} className="btn-primary">
                  {added ? <><Check size={16} /> Added to Cart</> : <><ShoppingCart size={16} /> Add to Cart</>}
                </button>
                <button onClick={() => handleAdd(true)} className="btn-accent"><ShoppingCart size={16} /> Buy Now</button>
                <a href={waLink(business.whatsapp, decodeURIComponent(waText))} target="_blank" rel="noreferrer" className="btn-wa">
                  <MessageCircle size={16} /> Order on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-[color:var(--brand-danger)]">
              This product is currently out of stock. Please check back soon or message us on WhatsApp.
            </div>
          )}

          <div className="mt-8 grid gap-3 text-sm text-stone-600">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[color:var(--brand-success)]" /> Cut fresh on order, hygienically cleaned</div>
            <div className="flex items-center gap-2"><Truck size={16} className="text-[color:var(--brand-primary)]" /> Home delivery and shop pickup available</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-stone-900">You may also like</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
