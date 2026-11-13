import type { OrderStatus, PaymentMethod } from './types';

export function inr(n: number): string {
  return '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New Order',
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-teal-100 text-teal-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ORDER_TYPE_LABELS: Record<string, string> = {
  home_delivery: 'Home Delivery',
  shop_pickup: 'Shop Pickup',
  wholesale: 'Wholesale Order',
  marriage_function: 'Marriage Function Order',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  other: 'Other',
};

export const KG_QUANTITY_OPTIONS = [0.25, 0.5, 0.75, 1, 2, 5];

export function kgLabel(q: number): string {
  if (q === 0.25) return '250 g';
  if (q === 0.5) return '500 g';
  if (q === 0.75) return '750 g';
  return `${q} kg`;
}

export function itemUnitPrice(unit: 'kg' | 'pcs', pricePerKg: number | null, pricePerPiece: number | null): number {
  return unit === 'kg' ? (pricePerKg ?? 0) : (pricePerPiece ?? 0);
}

export function itemAmount(unit: 'kg' | 'pcs', quantity: number, pricePerKg: number | null, pricePerPiece: number | null, discountPercent: number): number {
  const base = unit === 'kg' ? (pricePerKg ?? 0) * quantity : (pricePerPiece ?? 0) * quantity;
  return Math.round(base * (1 - discountPercent / 100) * 100) / 100;
}

export function finalPrice(product: { price_per_kg: number | null; price_per_piece: number | null; discount_percent: number }): number | null {
  const base = product.price_per_kg ?? product.price_per_piece;
  if (base == null) return null;
  return Math.round(base * (1 - product.discount_percent / 100) * 100) / 100;
}

export function productPriceLabel(product: { price_per_kg: number | null; price_per_piece: number | null; discount_percent: number }): string {
  if (product.price_per_kg != null) {
    const eff = finalPrice(product) ?? product.price_per_kg;
    return `${inr(eff)}/kg`;
  }
  if (product.price_per_piece != null) {
    const eff = finalPrice(product) ?? product.price_per_piece;
    return `${inr(eff)}/pc`;
  }
  return 'Price on request';
}

export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  window.open(waLink(phone, message), '_blank');
}
