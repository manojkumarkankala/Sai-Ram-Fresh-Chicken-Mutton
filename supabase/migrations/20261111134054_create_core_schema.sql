/*
# Sai Ram Fresh Chicken & Mutton - core schema

1. New Tables
- `profiles` (admin/user profiles: id = auth.users.id, email, role: 'admin' | 'customer')
- `categories` (product categories: slug, name, image, sort order, active flag)
- `products` (name, description, image, category, price_per_kg, price_per_piece,
  unit, stock_qty, stock_unit, stock_status, discount_percent, special_offer_text,
  flags for best-seller / today's-special / availability)
- `customers` (shop customers keyed by phone: name, whatsapp, address, totals)
- `orders` (order header: order_number, customer details, delivery details, totals, status, payment)
- `order_items` (line items with product snapshot, quantity, rate, amount)
- `customer_messages` (contact-form messages with read/replied flags)
- `invoices` (digital invoice per order: totals, payment status)
- `payments` (recorded payments per order: method, amount, status)
- `offers` (special offers/discounts with validity dates)
- `website_settings` (key/value JSON business configuration: business info, homepage content, delivery, theme)
- `banners` (banner + gallery images, active flag, sort order)
- `notifications` (admin dashboard notifications: new orders, new messages)
- `whatsapp_messages` (WhatsApp log: direction, phone, order ref, message body)

2. Functions & Triggers
- `is_admin()` security definer helper used by all admin RLS policies.
- `handle_new_auth_user()` trigger: creates a `profiles` row for every new auth user.
- `create_order(p_order jsonb, p_items jsonb)` security definer RPC used by the public
  checkout: validates customer input, re-prices every line from database prices,
  checks availability and stock, applies product discounts, computes the delivery
  charge from admin settings, upserts the customer, creates the order + items +
  invoice, decrements stock and returns the confirmed order as JSON.
  The client's own totals are never trusted.
- `get_my_orders(p_phone text)` security definer RPC: returns a customer's orders
  (with items) looked up by phone number, for the "My Orders" page.
- `notify_new_order()` / `notify_new_message()` triggers: insert rows into
  `notifications` when a new order or contact message arrives.

3. Security
- RLS enabled on every table.
- Public catalog read (products, categories, offers, banners, settings) for anon +
  authenticated; all writes to catalog tables restricted to admins via is_admin().
- Orders, order_items, invoices, payments, customers, whatsapp_messages and
  notifications are admin-only through RLS; customers go through the create_order
  / get_my_orders RPCs, never direct table access.
- customer_messages: anon may INSERT a contact message; only admins may read,
  update or delete.
- Explicit GRANTs limited to the verbs each role needs.
- One public storage bucket `media` (product images, banners, gallery) readable by
  everyone, writable only by admins.

4. Notes
- Prices and stock live on `products` (admin edits these columns directly).
- Delivery configuration is stored in `website_settings` under the `delivery` key.
- Invoice numbers reuse the order number sequence (SR1001, SR1002, ...).
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  price_per_kg numeric(10,2),
  price_per_piece numeric(10,2),
  unit text NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','piece','both')),
  stock_qty numeric(10,2),
  stock_unit text NOT NULL DEFAULT 'kg' CHECK (stock_unit IN ('kg','pcs')),
  stock_status text NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock')),
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  special_offer_text text DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_today_special boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  whatsapp text DEFAULT '',
  address text DEFAULT '',
  village text DEFAULT '',
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('SR' || nextval('order_number_seq')::text),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp_phone text DEFAULT '',
  delivery_address text DEFAULT '',
  village text DEFAULT '',
  landmark text DEFAULT '',
  order_type text NOT NULL DEFAULT 'home_delivery' CHECK (order_type IN ('home_delivery','shop_pickup','wholesale','marriage_function')),
  preferred_date date,
  preferred_time text DEFAULT '',
  instructions text DEFAULT '',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','upi','card','other')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  image_url text DEFAULT '',
  quantity_label text NOT NULL,
  quantity_grams numeric(12,2),
  quantity_pieces numeric(12,2),
  rate numeric(12,2) NOT NULL DEFAULT 0,
  rate_label text DEFAULT '',
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  subject text DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_replied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','upi','card','other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
  notes text DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  valid_from date,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS website_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'banner' CHECK (type IN ('banner','gallery')),
  title text DEFAULT '',
  image_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('new_order','new_message','info')),
  title text NOT NULL,
  body text DEFAULT '',
  ref_id text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming','outgoing')),
  phone text NOT NULL,
  customer_name text DEFAULT '',
  order_number text DEFAULT '',
  message text NOT NULL,
  wa_message_id text DEFAULT '',
  delivery_status text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON customer_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- is_admin helper
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- auto-create profile rows for new auth users
CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role) VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- profiles: users read/update their own row; role changes only via DB admin
GRANT SELECT, UPDATE (full_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- public catalog read
GRANT SELECT ON categories, products, offers, website_settings, banners TO anon, authenticated;

DROP POLICY IF EXISTS "catalog_public_read_categories" ON categories;
CREATE POLICY "catalog_public_read_categories" ON categories FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "catalog_public_read_products" ON products;
CREATE POLICY "catalog_public_read_products" ON products FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "catalog_public_read_offers" ON offers;
CREATE POLICY "catalog_public_read_offers" ON offers FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_public_read" ON website_settings;
CREATE POLICY "settings_public_read" ON website_settings FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "banners_public_read" ON banners;
CREATE POLICY "banners_public_read" ON banners FOR SELECT
TO anon, authenticated USING (true);

-- admin catalog management
GRANT SELECT, INSERT, UPDATE, DELETE ON categories, products, offers, website_settings, banners TO authenticated;

DROP POLICY IF EXISTS "admin_write_categories" ON categories;
CREATE POLICY "admin_write_categories" ON categories
TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_write_products" ON products;
CREATE POLICY "admin_write_products" ON products
TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_write_offers" ON offers;
CREATE POLICY "admin_write_offers" ON offers
TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_write_settings" ON website_settings;
CREATE POLICY "admin_write_settings" ON website_settings
TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_write_banners" ON banners;
CREATE POLICY "admin_write_banners" ON banners
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- orders & related: admin only (customers use create_order / get_my_orders RPCs)
GRANT SELECT, UPDATE, DELETE ON orders, order_items, invoices, payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers, notifications, whatsapp_messages TO authenticated;

DROP POLICY IF EXISTS "admin_orders_select" ON orders;
CREATE POLICY "admin_orders_select" ON orders FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admin_orders_update" ON orders;
CREATE POLICY "admin_orders_update" ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_orders_delete" ON orders;
CREATE POLICY "admin_orders_delete" ON orders FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_order_items_select" ON order_items;
CREATE POLICY "admin_order_items_select" ON order_items FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admin_order_items_update" ON order_items;
CREATE POLICY "admin_order_items_update" ON order_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_order_items_delete" ON order_items;
CREATE POLICY "admin_order_items_delete" ON order_items FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_invoices_select" ON invoices;
CREATE POLICY "admin_invoices_select" ON invoices FOR SELECT TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "admin_invoices_update" ON invoices;
CREATE POLICY "admin_invoices_update" ON invoices FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_payments" ON payments;
CREATE POLICY "admin_payments" ON payments TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_customers" ON customers;
CREATE POLICY "admin_customers" ON customers TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_notifications" ON notifications;
CREATE POLICY "admin_notifications" ON notifications TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_whatsapp" ON whatsapp_messages;
CREATE POLICY "admin_whatsapp" ON whatsapp_messages TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- contact messages: anyone can send, admin manages
GRANT INSERT (name, phone, email, subject, message) ON customer_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON customer_messages TO authenticated;

DROP POLICY IF EXISTS "anyone_can_send_message" ON customer_messages;
CREATE POLICY "anyone_can_send_message" ON customer_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_messages" ON customer_messages;
CREATE POLICY "admin_manage_messages" ON customer_messages
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- notifications triggers
CREATE OR REPLACE FUNCTION notify_new_order() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (type, title, body, ref_id)
  VALUES ('new_order', 'New order ' || NEW.order_number,
          NEW.customer_name || ' placed an order of Rs ' || NEW.total_amount, NEW.id::text);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_notify_trigger ON orders;
CREATE TRIGGER orders_notify_trigger AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

CREATE OR REPLACE FUNCTION notify_new_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (type, title, body, ref_id)
  VALUES ('new_message', 'New message from ' || NEW.name, coalesce(NEW.subject, NEW.name), NEW.id::text);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS messages_notify_trigger ON customer_messages;
CREATE TRIGGER messages_notify_trigger AFTER INSERT ON customer_messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- trusted order creation: re-prices from DB, checks stock, decrements inventory
CREATE OR REPLACE FUNCTION create_order(p_order jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text; v_phone text; v_whatsapp text; v_address text; v_village text; v_landmark text;
  v_order_type text; v_pref_date date; v_pref_time text; v_instructions text;
  v_subtotal numeric(12,2) := 0; v_disc_total numeric(12,2) := 0;
  v_delivery numeric(12,2) := 0; v_tax numeric(12,2) := 0; v_total numeric(12,2) := 0;
  v_order_id uuid; v_order_number text; v_customer_id uuid;
  v_item jsonb; v_prod products%ROWTYPE;
  v_qty numeric; v_unit text; v_rate numeric; v_gross numeric; v_amount numeric;
  v_grams numeric; v_pieces numeric; v_label text; v_rate_label text;
  v_need numeric; v_delivery_cfg jsonb; v_min_order numeric;
BEGIN
  v_name := trim(coalesce(p_order->>'customer_name',''));
  v_phone := trim(coalesce(p_order->>'phone',''));
  v_whatsapp := trim(coalesce(p_order->>'whatsapp_phone',''));
  v_address := trim(coalesce(p_order->>'delivery_address',''));
  v_village := trim(coalesce(p_order->>'village',''));
  v_landmark := trim(coalesce(p_order->>'landmark',''));
  v_order_type := coalesce(p_order->>'order_type','home_delivery');
  v_pref_date := NULLIF(p_order->>'preferred_date','')::date;
  v_pref_time := trim(coalesce(p_order->>'preferred_time',''));
  v_instructions := trim(coalesce(p_order->>'instructions',''));

  IF v_name = '' OR char_length(v_name) > 120 THEN RAISE EXCEPTION 'Please enter your full name.'; END IF;
  IF v_phone !~ '^[0-9+\-\s]{10,15}$' THEN RAISE EXCEPTION 'Please enter a valid mobile number.'; END IF;
  IF v_order_type NOT IN ('home_delivery','shop_pickup','wholesale','marriage_function') THEN RAISE EXCEPTION 'Invalid order type.'; END IF;
  IF v_order_type = 'home_delivery' AND v_address = '' THEN RAISE EXCEPTION 'Please enter your delivery address.'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Your cart is empty.';
  END IF;

  v_delivery_cfg := COALESCE((SELECT value FROM website_settings WHERE key = 'delivery'), '{"charge":30,"free_above":999,"min_order":0}'::jsonb);
  v_min_order := COALESCE((v_delivery_cfg->>'min_order')::numeric, 0);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::numeric;
    v_unit := lower(coalesce(v_item->>'unit','kg'));
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 1000 THEN RAISE EXCEPTION 'Invalid quantity.'; END IF;

    SELECT * INTO v_prod FROM products WHERE id = (v_item->>'product_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'A product in your cart is no longer available.'; END IF;
    IF NOT v_prod.is_available OR v_prod.stock_status = 'out_of_stock' THEN
      RAISE EXCEPTION '% is currently unavailable.', v_prod.name;
    END IF;

    IF v_unit IN ('kg') THEN
      v_rate := v_prod.price_per_kg; v_grams := v_qty * 1000; v_pieces := NULL;
      v_label := (CASE WHEN v_qty = 0.25 THEN '250 G' WHEN v_qty = 0.5 THEN '500 G' WHEN v_qty = 0.75 THEN '750 G' ELSE (v_qty::text || ' KG') END);
      v_rate_label := 'Rs ' || v_rate || '/KG';
      v_gross := round(v_rate * v_qty, 2);
    ELSIF v_unit IN ('g','grams') THEN
      v_rate := v_prod.price_per_kg; v_grams := v_qty; v_pieces := NULL;
      v_label := v_qty::text || ' G';
      v_rate_label := 'Rs ' || v_rate || '/KG';
      v_gross := round(v_rate * v_qty / 1000, 2);
    ELSIF v_unit IN ('pcs','piece') THEN
      v_rate := v_prod.price_per_piece;
      IF v_rate IS NULL THEN RAISE EXCEPTION '% cannot be ordered by pieces.', v_prod.name; END IF;
      v_grams := NULL; v_pieces := v_qty;
      v_label := v_qty::text || ' PCS';
      v_rate_label := 'Rs ' || v_rate || '/PC';
      v_gross := round(v_rate * v_qty, 2);
    ELSE
      RAISE EXCEPTION 'Invalid unit.';
    END IF;

    IF v_prod.stock_qty IS NOT NULL THEN
      v_need := CASE
        WHEN v_prod.stock_unit = 'kg' THEN COALESCE(v_grams,0) / 1000.0
        ELSE COALESCE(v_pieces,0) END;
      IF v_need > v_prod.stock_qty THEN
        RAISE EXCEPTION 'Only % % of % left in stock.', v_prod.stock_qty, v_prod.stock_unit, v_prod.name;
      END IF;
    END IF;

    v_amount := v_gross;
    IF v_prod.discount_percent > 0 THEN
      v_amount := round(v_amount * (1 - v_prod.discount_percent / 100.0), 2);
    END IF;

    v_subtotal := v_subtotal + v_gross;
    v_disc_total := v_disc_total + (v_gross - v_amount);
  END LOOP;

  IF v_min_order > 0 AND v_subtotal < v_min_order THEN
    RAISE EXCEPTION 'Minimum order value is Rs %.', v_min_order;
  END IF;

  IF v_order_type = 'shop_pickup' THEN
    v_delivery := 0;
  ELSE
    v_delivery := COALESCE((v_delivery_cfg->>'charge')::numeric, 0);
    IF (v_delivery_cfg->>'free_above')::numeric > 0 AND v_subtotal >= (v_delivery_cfg->>'free_above')::numeric THEN
      v_delivery := 0;
    END IF;
  END IF;

  v_total := round(v_subtotal - v_disc_total + v_delivery, 2);

  -- upsert customer by phone
  INSERT INTO customers (name, phone, whatsapp, address, village, total_orders, total_spent)
  VALUES (v_name, v_phone, v_whatsapp, v_address, v_village, 1, v_total)
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    whatsapp = COALESCE(NULLIF(EXCLUDED.whatsapp,''), customers.whatsapp),
    address = COALESCE(NULLIF(EXCLUDED.address,''), customers.address),
    village = COALESCE(NULLIF(EXCLUDED.village,''), customers.village),
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + v_total,
    updated_at = now()
  RETURNING id INTO v_customer_id;

  INSERT INTO orders (customer_id, customer_name, phone, whatsapp_phone, delivery_address, village, landmark,
    order_type, preferred_date, preferred_time, instructions, subtotal, discount_amount, delivery_charge, total_amount)
  VALUES (v_customer_id, v_name, v_phone, v_whatsapp, v_address, v_village, v_landmark,
    v_order_type, v_pref_date, v_pref_time, v_instructions, v_subtotal, v_disc_total, v_delivery, v_total)
  RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::numeric;
    v_unit := lower(coalesce(v_item->>'unit','kg'));
    SELECT * INTO v_prod FROM products WHERE id = (v_item->>'product_id')::uuid;

    IF v_unit IN ('kg') THEN
      v_rate := v_prod.price_per_kg;
      v_label := (CASE WHEN v_qty = 0.25 THEN '250 G' WHEN v_qty = 0.5 THEN '500 G' WHEN v_qty = 0.75 THEN '750 G' ELSE (v_qty::text || ' KG') END);
      v_rate_label := 'Rs ' || v_rate || '/KG';
      v_gross := round(v_rate * v_qty, 2);
      v_grams := v_qty * 1000; v_pieces := NULL;
    ELSIF v_unit IN ('g','grams') THEN
      v_rate := v_prod.price_per_kg;
      v_label := v_qty::text || ' G';
      v_rate_label := 'Rs ' || v_rate || '/KG';
      v_gross := round(v_rate * v_qty / 1000, 2);
      v_grams := v_qty; v_pieces := NULL;
    ELSE
      v_rate := v_prod.price_per_piece;
      v_label := v_qty::text || ' PCS';
      v_rate_label := 'Rs ' || v_rate || '/PC';
      v_gross := round(v_rate * v_qty, 2);
      v_grams := NULL; v_pieces := v_qty;
    END IF;
    v_amount := v_gross;
    IF v_prod.discount_percent > 0 THEN
      v_amount := round(v_gross * (1 - v_prod.discount_percent / 100.0), 2);
    END IF;

    INSERT INTO order_items (order_id, product_id, product_name, image_url, quantity_label, quantity_grams,
      quantity_pieces, rate, rate_label, discount_percent, amount)
    VALUES (v_order_id, v_prod.id, v_prod.name, v_prod.image_url, v_label, v_grams, v_pieces, v_rate, v_rate_label,
      v_prod.discount_percent, v_amount);

    IF v_prod.stock_qty IS NOT NULL THEN
      UPDATE products SET
        stock_qty = stock_qty - (CASE WHEN stock_unit = 'kg' THEN COALESCE(v_grams,0)/1000.0 ELSE COALESCE(v_pieces,0) END),
        stock_status = CASE WHEN stock_qty - (CASE WHEN stock_unit = 'kg' THEN COALESCE(v_grams,0)/1000.0 ELSE COALESCE(v_pieces,0) END) <= 0 THEN 'out_of_stock'
                            WHEN stock_qty - (CASE WHEN stock_unit = 'kg' THEN COALESCE(v_grams,0)/1000.0 ELSE COALESCE(v_pieces,0) END) <= 5 THEN 'low_stock'
                            ELSE 'in_stock' END,
        updated_at = now()
      WHERE id = v_prod.id;
    END IF;
  END LOOP;

  INSERT INTO invoices (invoice_number, order_id, subtotal, discount_amount, delivery_charge, grand_total, payment_status)
  VALUES (v_order_number, v_order_id, v_subtotal, v_disc_total, v_delivery, v_total, 'pending');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_disc_total,
    'delivery_charge', v_delivery,
    'total', v_total,
    'customer_name', v_name,
    'phone', v_phone
  );
END $$;

REVOKE EXECUTE ON FUNCTION create_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order(jsonb, jsonb) TO anon, authenticated;

-- customer order history lookup by phone
CREATE OR REPLACE FUNCTION get_my_orders(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF p_phone IS NULL OR trim(p_phone) = '' THEN RETURN '[]'::jsonb; END IF;
  SELECT coalesce(jsonb_agg(t.row_data), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'status', o.status,
      'total_amount', o.total_amount, 'payment_status', o.payment_status,
      'payment_method', o.payment_method, 'created_at', o.created_at,
      'items', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'product_name', oi.product_name, 'quantity_label', oi.quantity_label,
          'rate_label', oi.rate_label, 'amount', oi.amount)), '[]'::jsonb)
        FROM order_items oi WHERE oi.order_id = o.id)
    ) AS row_data
    FROM orders o WHERE o.phone = trim(p_phone)
    ORDER BY o.created_at DESC LIMIT 50
  ) t;
  RETURN v_result;
END $$;

REVOKE EXECUTE ON FUNCTION get_my_orders(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_orders(text) TO anon, authenticated;

-- storage: one public 'media' bucket with folders per use
INSERT INTO storage.buckets (id, name, public) VALUES ('media','media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_admin_write" ON storage.objects;
CREATE POLICY "media_admin_write" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'media' AND is_admin());

DROP POLICY IF EXISTS "media_admin_update" ON storage.objects;
CREATE POLICY "media_admin_update" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'media' AND is_admin());

DROP POLICY IF EXISTS "media_admin_delete" ON storage.objects;
CREATE POLICY "media_admin_delete" ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'media' AND is_admin());
