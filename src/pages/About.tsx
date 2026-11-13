import { Phone, MessageCircle, Clock, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { useShop } from '@/lib/store';
import { waLink } from '@/lib/format';

export function About() {
  const { business, homepage } = useShop();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">About {business.business_name}</h1>

      <div className="card mt-6 p-6 leading-relaxed text-stone-600">
        <p>
          {business.business_name} is your trusted neighbourhood meat shop serving fresh chicken, mutton and eggs
          every day. We believe every family deserves fresh, healthy and honestly-priced meat - cut clean, weighed
          right and delivered on time.
        </p>
        <p className="mt-4">{homepage.freshness_info}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5 text-center">
          <ShieldCheck size={28} className="mx-auto text-[color:var(--brand-success)]" />
          <div className="mt-2 font-semibold text-stone-900">Quality First</div>
          <p className="mt-1 text-sm text-stone-500">Only fresh stock - never frozen, never stored.</p>
        </div>
        <div className="card p-5 text-center">
          <Users size={28} className="mx-auto text-[color:var(--brand-primary)]" />
          <div className="mt-2 font-semibold text-stone-900">Family Trusted</div>
          <p className="mt-1 text-sm text-stone-500">Serving families, hotels and functions across the region.</p>
        </div>
        <div className="card p-5 text-center">
          <Sparkles size={28} className="mx-auto text-[color:var(--brand-accent)]" />
          <div className="mt-2 font-semibold text-stone-900">Fresh Daily</div>
          <p className="mt-1 text-sm text-stone-500">Cut fresh on order, every single time.</p>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">{homepage.bulk_orders_title}</h2>
        <p className="mt-2 text-stone-600">{homepage.bulk_orders_desc}</p>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">Shop Details</h2>
        <div className="mt-4 space-y-2 text-sm text-stone-600">
          <div className="flex items-center gap-2"><Clock size={16} /> Open daily {business.opening_hours} - {business.closing_hours}</div>
          {business.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[color:var(--brand-primary)]"><Phone size={16} /> {p}</a>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={waLink(business.whatsapp, `Hello ${business.business_name}! I have a question.`)}
            target="_blank"
            rel="noreferrer"
            className="btn-wa"
          >
            <MessageCircle size={16} /> WhatsApp Us
          </a>
          <a href={`tel:${business.phones[0]?.replace(/\s/g, '')}`} className="btn-primary"><Phone size={16} /> Call Now</a>
        </div>
      </div>
    </div>
  );
}
