import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Phone, MessageCircle, Bell } from 'lucide-react';
import { useShop } from '@/lib/store';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/products/chicken', label: 'Chicken' },
  { to: '/products/mutton', label: 'Mutton' },
  { to: '/products/eggs', label: 'Eggs' },
  { to: '/offers', label: 'Offers' },
  { to: '/contact', label: 'Contact' },
  { to: '/my-orders', label: 'My Orders' },
];

export function Header() {
  const { business, cartCount } = useShop();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cartCount);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (cartCount !== prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="hidden bg-[color:var(--brand-primary)] text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            {business.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:underline">
                <Phone size={12} /> {p}
              </a>
            ))}
          </div>
          <span>Open daily {business.opening_hours} - {business.closing_hours}</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand-primary)] font-display text-lg font-bold text-[color:var(--brand-accent)]">
            SR
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight text-[color:var(--brand-primary)] sm:text-lg">
              {business.business_name}
            </div>
            <div className="text-[11px] text-stone-500">{business.tagline}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-[color:var(--brand-primary)] ${isActive ? 'text-[color:var(--brand-primary)]' : 'text-stone-600'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-lg bg-[color:var(--brand-accent)] px-3.5 py-2 text-sm font-semibold text-stone-900 transition hover:brightness-95"
          >
            <ShoppingCart size={18} className={bump ? 'cart-bounce' : ''} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--brand-danger)] px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-[color:var(--brand-primary)] text-white' : 'text-stone-700 hover:bg-stone-100'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { business } = useShop();
  return (
    <footer className="mt-16 bg-[color:var(--brand-primary-dark)] text-stone-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold text-[color:var(--brand-accent)]">{business.business_name}</div>
          <p className="mt-2 text-sm leading-relaxed text-stone-300">{business.tagline}. Fresh cuts daily, wholesale and retail.</p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Contact</div>
          {business.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block text-sm hover:text-[color:var(--brand-accent)]">
              {p}
            </a>
          ))}
          <div className="mt-2 text-sm text-stone-300">{business.address}</div>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Hours</div>
          <div className="text-sm text-stone-300">Daily: {business.opening_hours} - {business.closing_hours}</div>
          <div className="mt-1 text-sm text-stone-400">{business.holiday_info}</div>
        </div>
        <div>
          <div className="mb-2 font-semibold text-white">Quick Links</div>
          <Link to="/products/all" className="block text-sm hover:text-[color:var(--brand-accent)]">All Products</Link>
          <Link to="/offers" className="block text-sm hover:text-[color:var(--brand-accent)]">Offers</Link>
          <Link to="/my-orders" className="block text-sm hover:text-[color:var(--brand-accent)]">My Orders</Link>
          <Link to="/contact" className="block text-sm hover:text-[color:var(--brand-accent)]">Contact</Link>
          <Link to="/admin/login" className="mt-2 block text-xs text-stone-400 hover:text-[color:var(--brand-accent)]">Admin Login</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-stone-400">
        {business.business_name}. All rights reserved.
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  const { business } = useShop();
  return (
    <a
      href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Sai Ram Fresh Chicken & Mutton! I have a question.')}`}
      target="_blank"
      rel="noreferrer"
      className="animate-wa fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}

export function NotificationsBell() {
  return <Bell size={20} />;
}
