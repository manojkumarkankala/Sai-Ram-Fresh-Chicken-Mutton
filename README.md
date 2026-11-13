# Sai Ram Fresh Chicken & Mutton — Online Ordering Website

A complete online ordering platform with a customer storefront and a full admin dashboard.

## What is included

- Customer storefront: homepage, category pages, product pages, cart, checkout, order history, offers, about, contact.
- Checkout saves orders through a database function that re-calculates all prices from the product table — customer-side totals are never trusted.
- WhatsApp click-to-chat everywhere: floating button, per-product buttons, order confirmation message, invoice message, admin messaging panel.
- Admin dashboard at `/admin` (login at `/admin/login`): orders, products, categories, prices, stock, messages, WhatsApp, billing/invoices, offers, customers, banner, gallery, delivery settings, business info, website content, reports, notifications, profile, password.
- Print/PDF invoices for every order, payment tracking (cash/UPI/card), automatic invoice numbering (SR1001, SR1002, ...).

## Admin access

- Login page: `/admin/login`
- The admin account was created during database setup with the email `sairamadmin@gmail.com`. The initial password was set privately through the secure authentication setup process and is never stored in the website code.
- Use "Forgot Password?" on the login page to receive a reset link, or use the Change Password page inside the dashboard.

## Local development (Windows)

1. Install Node.js LTS from https://nodejs.org (accept the default options).
2. Open Command Prompt in the project folder and run:
   ```
   npm install
   npm run dev
   ```
3. Open the local URL shown in the terminal.

## Environment variables

Copy `.env.example` to `.env` and fill in the two public values from your Supabase project (Settings → API):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are public keys (safe for the browser); the service-role key must never be placed in frontend code.

## Database

All tables, security policies and functions live in the SQL migrations under `supabase/migrations/`. They were applied through the Supabase platform, so no manual SQL needs to be run. Highlights:

- Row Level Security on every table; only admins can read orders, customers, invoices, messages and settings.
- `create_order` database function: validates details, re-prices every item from the products table, enforces stock and minimum order, applies delivery rules, decrements stock atomically.
- Public storage bucket `media` for product images, banner and gallery; only admins can upload.

## WhatsApp Business Cloud API (optional, for incoming messages)

Outgoing messages use free click-to-chat links and work out of the box. To also receive incoming customer messages inside the dashboard:

1. Create a Meta developer account at https://developers.facebook.com and add the WhatsApp product.
2. Get the Phone Number ID and a permanent access token.
3. Store them as Supabase Edge Function secrets named `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`.
4. Create a `whatsapp-webhook` edge function that verifies Meta's webhook handshake and writes incoming payloads to the `whatsapp_messages` table.
5. In the Meta dashboard, point the webhook at that function URL and subscribe to the `messages` field.

Incoming messages then appear automatically in Admin → WhatsApp → Message Log.

## Deploying to Vercel

1. Push the project to GitHub.
2. At https://vercel.com, import the repository (it is detected automatically as a Vite project).
3. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Project → Settings → Environment Variables.
4. Deploy. Add your Vercel domain to Supabase → Authentication → URL Configuration if you enable password-reset emails.
