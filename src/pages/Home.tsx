import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, ShieldCheck, Clock, Star, IndianRupee, Truck, ArrowRight } from 'lucide-react';
import { useShop } from '@/lib/store';
import { ProductCard } from '@/components/ProductCard';
import { StarRating } from '@/components/Ui';
import { waLink } from '@/lib/format';

export function Home() {
  const { business, homepage, categories, products, offers, banner } = useShop();
  const bestSellers = products.filter((p) => p.is_best_seller && p.is_available).slice(0, 4);
  const specials = products.filter((p) => p.is_today_special && p.is_available).slice(0, 4);

  return (
    <div>
      {banner?.image_url && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <img src={banner.image_url} alt={business.business_name} className="w-full rounded-xl object-cover" />
        </div>
      )}

      <section className="relative overflow-hidden bg-[color:var(--brand-primary)] text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[color:var(--brand-accent)]/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-block rounded-full bg-[color:var(--brand-accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-stone-900">
              Wholesale & Retail
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              {homepage.headline}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-100 sm:text-lg">
              {homepage.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products/chicken" className="btn-accent">Order Chicken <ArrowRight size={16} /></Link>
              <Link to="/products/mutton" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20">
                Order Mutton <ArrowRight size={16} />
              </Link>
              <a
                href={waLink(business.whatsapp, `Hello ${business.business_name}! I would like to place an order.`)}
                target="_blank"
                rel="noreferrer"
                className="btn-wa"
              >
                <MessageCircle size={16} /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-stone-900">Shop by Category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.filter((c) => c.is_active).map((c) => (
            <Link
              key={c.id}
              to={`/products/${c.slug}`}
              className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="overflow-hidden">
                <img src={c.image_url} alt={c.name} className="h-28 w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-3 text-center text-sm font-semibold text-stone-800">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {specials.length > 0 && (
        <section className="bg-[color:var(--brand-accent)]/10 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-stone-900">Today's Special Offers</h2>
              <Link to="/offers" className="text-sm font-semibold text-[color:var(--brand-primary)] hover:underline">View all</Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specials.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-stone-900">Best Sellers</h2>
            <Link to="/products/all" className="text-sm font-semibold text-[color:var(--brand-primary)] hover:underline">View all</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-2xl font-bold text-stone-900">Freshness & Quality</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-stone-600">{homepage.freshness_info}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: homepage.why_us_1_title, desc: homepage.why_us_1_desc },
              { icon: Star, title: homepage.why_us_2_title, desc: homepage.why_us_2_desc },
              { icon: IndianRupee, title: homepage.why_us_3_title, desc: homepage.why_us_3_desc },
              { icon: Clock, title: homepage.why_us_4_title, desc: homepage.why_us_4_desc },
            ].map((w) => (
              <div key={w.title} className="rounded-xl border border-stone-200 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]">
                  <w.icon size={20} />
                </div>
                <div className="mt-3 font-semibold text-stone-900">{w.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl bg-[color:var(--brand-primary)] p-8 text-white sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <Truck size={28} className="text-[color:var(--brand-accent)]" />
              <h2 className="mt-3 font-display text-2xl font-bold">{homepage.bulk_orders_title}</h2>
              <p className="mt-2 leading-relaxed text-stone-100">{homepage.bulk_orders_desc}</p>
            </div>
            <a href={`tel:${business.phones[0]?.replace(/\s/g, '')}`} className="btn-accent shrink-0">
              <Phone size={16} /> Call for a Quote
            </a>
          </div>
        </div>
      </section>

      {homepage.reviews.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="font-display text-2xl font-bold text-stone-900">Customer Reviews</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {homepage.reviews.map((r) => (
                <div key={r.name} className="card p-5">
                  <StarRating rating={r.rating} />
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">"{r.text}"</p>
                  <div className="mt-3 text-sm font-semibold text-stone-800">{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="card p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-stone-900">Order Fresh Today</h2>
          <p className="mt-2 text-stone-600">Call us or message on WhatsApp. Open daily {business.opening_hours} - {business.closing_hours}.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {business.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="btn-primary"><Phone size={16} /> {p}</a>
            ))}
            <a
              href={waLink(business.whatsapp, `Hello ${business.business_name}! I would like to place an order.`)}
              target="_blank"
              rel="noreferrer"
              className="btn-wa"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
