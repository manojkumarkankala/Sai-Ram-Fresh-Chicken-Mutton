import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Banner, BusinessSettings, Category, DeliverySettings, FooterSettings, HomepageSettings, Offer, Product, ThemeSettings } from './types';
import type { CartItem } from './types';

export interface ShopState {
  business: BusinessSettings;
  delivery: DeliverySettings;
  homepage: HomepageSettings;
  footer: FooterSettings;
  theme: ThemeSettings;
  categories: Category[];
  products: Product[];
  offers: Offer[];
  banner: Banner | null;
  loading: boolean;
}

interface ShopContextValue extends ShopState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, unit: 'kg' | 'pcs') => void;
  updateCartQuantity: (productId: string, unit: 'kg' | 'pcs', quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  refreshShop: () => Promise<void>;
}

const DEFAULT_BUSINESS: BusinessSettings = {
  business_name: 'Sai Ram Fresh Chicken & Mutton',
  tagline: 'Fresh & Healthy Meat, Every Day',
  address: 'Main Market Road',
  phones: ['98666 06603', '99495 17545', '90148 47315'],
  whatsapp: '+919866606603',
  opening_hours: '6:00 AM',
  closing_hours: '9:00 PM',
  holiday_info: '',
  facebook: '',
  instagram: '',
  youtube: '',
};

const DEFAULT_HOMEPAGE: HomepageSettings = {
  headline: 'Welcome to Sai Ram Fresh Chicken & Mutton',
  description: 'Fresh and healthy chicken and mutton available for wholesale and retail orders.',
  freshness_info: '',
  why_us_1_title: '', why_us_1_desc: '',
  why_us_2_title: '', why_us_2_desc: '',
  why_us_3_title: '', why_us_3_desc: '',
  why_us_4_title: '', why_us_4_desc: '',
  bulk_orders_title: '', bulk_orders_desc: '',
  reviews: [],
};

const DEFAULT_FOOTER: FooterSettings = {
  about: 'Your trusted neighbourhood meat shop for fresh chicken, mutton and eggs.',
  note: 'Fresh cuts daily. Order online or on WhatsApp.',
};

const ShopContext = createContext<ShopContextValue | null>(null);

const CART_KEY = 'sairam_cart_v1';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShopState>({
    business: DEFAULT_BUSINESS,
    delivery: { charge: 30, free_above: 999, min_order: 0 },
    homepage: DEFAULT_HOMEPAGE,
    footer: DEFAULT_FOOTER,
    theme: { primary: '#0f4c81', primary_dark: '#0a3560', accent: '#f5b301', success: '#1a7a3d', danger: '#c62828' },
    categories: [],
    products: [],
    offers: [],
    banner: null,
    loading: true,
  });
  const [cart, setCart] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const refreshShop = async () => {
    const [settingsRes, categoriesRes, productsRes, offersRes, bannersRes] = await Promise.all([
      supabase.from('website_settings').select('key, value'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('banners').select('*').eq('is_active', true).order('sort_order'),
    ]);

    const settings: Record<string, unknown> = {};
    if (!settingsRes.error && settingsRes.data) {
      for (const row of settingsRes.data) settings[row.key] = row.value;
    }

    setState((prev) => ({
      ...prev,
      business: { ...DEFAULT_BUSINESS, ...((settings.business as Partial<BusinessSettings>) ?? {}) },
      delivery: (settings.delivery as DeliverySettings) ?? prev.delivery,
      homepage: { ...DEFAULT_HOMEPAGE, ...((settings.homepage as Partial<HomepageSettings>) ?? {}) },
      footer: { ...DEFAULT_FOOTER, ...((settings.footer as Partial<FooterSettings>) ?? {}) },
      theme: (settings.theme as ThemeSettings) ?? prev.theme,
      categories: categoriesRes.data ?? [],
      products: productsRes.data ?? [],
      offers: offersRes.data ?? [],
      banner: bannersRes.data?.find((b) => b.type === 'banner') ?? null,
      loading: false,
    }));
  };

  useEffect(() => {
    refreshShop();
  }, []);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === item.productId && c.unit === item.unit);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string, unit: 'kg' | 'pcs') => {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.unit === unit)));
  };

  const updateCartQuantity = (productId: string, unit: 'kg' | 'pcs', quantity: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId && c.unit === unit ? { ...c, quantity } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const { cartCount, cartSubtotal, cartDiscount } = useMemo(() => {
    let count = 0;
    let sub = 0;
    let disc = 0;
    for (const item of cart) {
      count += item.unit === 'kg' ? item.quantity : 0;
      const base = item.unit === 'kg'
        ? (item.pricePerKg ?? 0) * item.quantity
        : (item.pricePerPiece ?? 0) * item.quantity;
      sub += base;
      disc += base * (item.discountPercent / 100);
    }
    return {
      cartCount: cart.reduce((n, c) => (c.unit === 'kg' ? n : n + c.quantity), 0) + count,
      cartSubtotal: Math.round(sub * 100) / 100,
      cartDiscount: Math.round(disc * 100) / 100,
    };
  }, [cart]);

  return (
    <ShopContext.Provider
      value={{
        ...state,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        refreshShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
