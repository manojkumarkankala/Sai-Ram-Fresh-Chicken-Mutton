export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  image_url: string;
  price_per_kg: number | null;
  price_per_piece: number | null;
  unit: 'kg' | 'piece' | 'both';
  stock_qty: number | null;
  stock_unit: 'kg' | 'pcs';
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  discount_percent: number;
  special_offer_text: string;
  is_available: boolean;
  is_best_seller: boolean;
  is_today_special: boolean;
  sort_order: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  image_url: string;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
}

export interface Banner {
  id: string;
  type: 'banner' | 'gallery';
  title: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface OrderItem {
  id?: string;
  product_name: string;
  image_url: string;
  quantity_label: string;
  rate_label: string;
  amount: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  whatsapp_phone: string;
  delivery_address: string;
  village: string;
  landmark: string;
  order_type: string;
  preferred_date: string | null;
  preferred_time: string;
  instructions: string;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  order_items?: OrderItem[];
}

export type OrderStatus =
  | 'new' | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other';

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  unit: 'kg' | 'pcs';
  quantity: number;
  pricePerKg: number | null;
  pricePerPiece: number | null;
  discountPercent: number;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  address: string;
  phones: string[];
  whatsapp: string;
  opening_hours: string;
  closing_hours: string;
  holiday_info: string;
  facebook: string;
  instagram: string;
  youtube: string;
}

export interface DeliverySettings {
  charge: number;
  free_above: number;
  min_order: number;
}

export interface HomepageSettings {
  headline: string;
  description: string;
  freshness_info: string;
  why_us_1_title: string;
  why_us_1_desc: string;
  why_us_2_title: string;
  why_us_2_desc: string;
  why_us_3_title: string;
  why_us_3_desc: string;
  why_us_4_title: string;
  why_us_4_desc: string;
  bulk_orders_title: string;
  bulk_orders_desc: string;
  reviews: { name: string; text: string; rating: number }[];
}

export interface ThemeSettings {
  primary: string;
  primary_dark: string;
  accent: string;
  success: string;
  danger: string;
}

export interface FooterSettings {
  about: string;
  note: string;
}

export interface Notification {
  id: string;
  type: 'new_order' | 'new_message' | 'info';
  title: string;
  body: string;
  ref_id: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  phone: string;
  customer_name: string;
  order_number: string;
  message: string;
  created_at: string;
}
