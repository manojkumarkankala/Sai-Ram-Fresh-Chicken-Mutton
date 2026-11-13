/*
# Seed categories, products, settings, banners and offers

1. Data
- 10 categories (chicken, mutton, eggs, etc.) with Pexels stock photos.
- 10 products with prices per kg / per piece, stock, descriptions and images.
- `website_settings`: business (name/phones/whatsapp/address/hours/social),
  delivery (charge 30, free above 999), homepage texts, theme colors,
  payment_options, whatsapp (business number + click-to-chat mode).
- One active hero banner row (image_url empty -> frontend renders a styled hero;
  admin can replace it with an uploaded banner).
- 2 sample offers.

2. Security
- No policy changes; rows respect the RLS created in the core migration.
*/

INSERT INTO categories (slug, name, description, image_url, sort_order) VALUES
('country-chicken','Country Chicken (Natu Kodi)','Free-range country chicken, full of flavour','https://images.pexels.com/photos/36713607/pexels-photo-36713607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',1),
('broiler-chicken','Broiler Chicken','Tender, juicy broiler chicken cut fresh daily','https://images.pexels.com/photos/13524831/pexels-photo-13524831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',2),
('chicken-curry-cut','Chicken Curry Cut','Curry cut pieces with bone, perfect for curries','https://images.pexels.com/photos/31647676/pexels-photo-31647676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',3),
('whole-chicken','Whole Chicken','Whole cleaned chicken, ready to cook','https://images.pexels.com/photos/35886032/pexels-photo-35886032.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',4),
('boneless-chicken','Boneless Chicken','Skinless boneless chicken for fries and biryani','https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',5),
('chicken-breast','Chicken Breast','Fresh chicken breast fillets, high protein','https://images.pexels.com/photos/6281497/pexels-photo-6281497.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',6),
('fresh-mutton','Fresh Mutton','Farm-fresh mutton, tender and tasty','https://images.pexels.com/photos/6281507/pexels-photo-6281507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',7),
('mutton-curry-cut','Mutton Curry Cut','Mutton curry cut pieces with bone','https://images.pexels.com/photos/9609846/pexels-photo-9609846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',8),
('mutton-boneless','Mutton Boneless','Premium boneless mutton cubes','https://images.pexels.com/photos/8738011/pexels-photo-8738011.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',9),
('eggs','Eggs','Fresh country and poultry eggs','https://images.pexels.com/photos/38341850/pexels-photo-38341850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',10);

INSERT INTO products (category_id, name, description, image_url, price_per_kg, price_per_piece, unit, stock_qty, stock_unit, stock_status, discount_percent, special_offer_text, is_available, is_best_seller, is_today_special, sort_order) VALUES
((SELECT id FROM categories WHERE slug='country-chicken'),'Country Chicken (Natu Kodi)','Authentic free-range country chicken. Firm texture and rich traditional taste, cut fresh on order.','https://images.pexels.com/photos/36713607/pexels-photo-36713607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',560.00,NULL,'kg',40,'kg','in_stock',0,'',true,true,false,1),
((SELECT id FROM categories WHERE slug='broiler-chicken'),'Broiler Chicken','Tender and juicy broiler chicken, cleaned and cut fresh every morning.','https://images.pexels.com/photos/13524831/pexels-photo-13524831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',240.00,NULL,'kg',60,'kg','in_stock',0,'',true,true,false,2),
((SELECT id FROM categories WHERE slug='chicken-curry-cut'),'Chicken Curry Cut','Medium curry cut pieces with bone. Ideal for curries, fry and biryani.','https://images.pexels.com/photos/31647676/pexels-photo-31647676.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',250.00,NULL,'kg',50,'kg','in_stock',5,'5% off today',true,true,true,3),
((SELECT id FROM categories WHERE slug='whole-chicken'),'Whole Chicken','Whole cleaned chicken without skin, ready to cook for family meals and functions.','https://images.pexels.com/photos/35886032/pexels-photo-35886032.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',230.00,NULL,'kg',30,'kg','in_stock',0,'',true,false,false,4),
((SELECT id FROM categories WHERE slug='boneless-chicken'),'Boneless Chicken','Boneless skinless chicken cubes. Perfect for 65, fries and biryani.','https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',320.00,NULL,'kg',35,'kg','in_stock',0,'',true,false,false,5),
((SELECT id FROM categories WHERE slug='chicken-breast'),'Chicken Breast','Fresh chicken breast fillets. High protein, low fat, skinless.','https://images.pexels.com/photos/6281497/pexels-photo-6281497.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',340.00,NULL,'kg',25,'kg','in_stock',0,'',true,false,false,6),
((SELECT id FROM categories WHERE slug='fresh-mutton'),'Fresh Mutton','Farm-fresh tender mutton, hygienically processed and cut on order.','https://images.pexels.com/photos/6281507/pexels-photo-6281507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',800.00,NULL,'kg',20,'kg','in_stock',0,'',true,true,false,7),
((SELECT id FROM categories WHERE slug='mutton-curry-cut'),'Mutton Curry Cut','Mutton curry cut pieces with bone. Rich flavour for curries and gravies.','https://images.pexels.com/photos/9609846/pexels-photo-9609846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',820.00,NULL,'kg',18,'kg','in_stock',3,'3% off',true,false,true,8),
((SELECT id FROM categories WHERE slug='mutton-boneless'),'Mutton Boneless','Premium boneless mutton cubes for biryani, fry and kebabs.','https://images.pexels.com/photos/8738011/pexels-photo-8738011.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',900.00,NULL,'kg',12,'kg','in_stock',0,'',true,false,false,9),
((SELECT id FROM categories WHERE slug='eggs'),'Country Eggs (12 PCS)','Fresh country eggs, pack of 12 pieces. Rich yolk, farm fresh.','https://images.pexels.com/photos/38341850/pexels-photo-38341850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',NULL,90.00,'piece',100,'pcs','in_stock',0,'',true,true,false,10);

INSERT INTO website_settings (key, value) VALUES
('business', '{"business_name":"Sai Ram Fresh Chicken & Mutton","tagline":"Fresh & Healthy Meat, Every Day","address":"Sai Ram Fresh Chicken & Mutton, Main Market Road, Near Bus Stand","phones":["98666 06603","99495 17545","90148 47315"],"whatsapp":"+919866606603","opening_hours":"6:00 AM","closing_hours":"9:00 PM","holiday_info":"Open all days. Special holiday timings will be announced here.","facebook":"","instagram":"","youtube":""}'),
('delivery', '{"charge":30,"free_above":999,"min_order":0}'),
('homepage', '{"headline":"Welcome to Sai Ram Fresh Chicken & Mutton","description":"Fresh and healthy chicken and mutton available for wholesale and retail orders. Quality products for your family and special occasions.","freshness_info":"We cut and clean every order fresh on the spot. No cold storage meat, no frozen stock. What you get is the same quality we serve our own family.","why_us_1_title":"Farm Fresh Daily","why_us_1_desc":"Chicken and mutton arrive fresh every morning from trusted local farms.","why_us_2_title":"Hygienic Cutting","why_us_2_desc":"Cleaned and cut in a hygienic space using purified water and sanitized tools.","why_us_3_title":"Honest Pricing","why_us_3_desc":"Clear per-kilo pricing with no hidden charges. Pay on delivery by cash or UPI.","why_us_4_title":"On-Time Delivery","why_us_4_desc":"Home delivery within hours across nearby villages and town, right on schedule.","bulk_orders_title":"Wholesale & Marriage Function Orders","bulk_orders_desc":"Bulk quantities for hotels, hostels, functions and marriage events at special wholesale rates. Call us for a custom quote.","reviews":[{"name":"Manoj Kumar","text":"Best country chicken in the area. Fresh cut and honest weight.","rating":5},{"name":"Sailaja R.","text":"Ordered mutton for a family function. Delivered on time, quality was excellent.","rating":5},{"name":"Ravi Teja","text":"Very convenient. I order on WhatsApp and it reaches home within an hour.","rating":4}]}'),
('theme', '{"primary":"#0f4c81","primary_dark":"#0a3560","accent":"#f5b301","success":"#1a7a3d","danger":"#c62828"}'),
('payment_options', '{"methods":["cash","upi","card","other"],"instructions":"Pay by cash or UPI on delivery. Card accepted at the shop."}'),
('whatsapp', '{"mode":"click_to_chat","business_number":"+919866606603","additional_numbers":["+919949517545","+919014847315"],"cloud_api_configured":false,"note":"Cloud API credentials are stored as Supabase Edge Function secrets, never in frontend code."}'),
('footer', '{"about":"Your trusted neighbourhood meat shop for fresh chicken, mutton and eggs. Wholesale and retail.","note":"Fresh cuts daily. Order online or on WhatsApp."}');

INSERT INTO banners (type, title, image_url, is_active, sort_order) VALUES
('banner','Hero Banner','', true, 1);

INSERT INTO offers (title, description, discount_percent, is_active) VALUES
('Chicken Curry Cut 5% Off','Today''s special on fresh chicken curry cut pieces. Limited stock.',5,true),
('M Curry Cut 3% Off','Fresh mutton curry cut at 3% off. Order early to grab the best pieces.',3,true);
