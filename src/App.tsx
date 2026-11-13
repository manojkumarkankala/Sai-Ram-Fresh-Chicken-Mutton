import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShopProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { Header, Footer, WhatsAppFloat } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { ProductList } from '@/pages/ProductList';
import { ProductDetail } from '@/pages/ProductDetail';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { MyOrders } from '@/pages/MyOrders';
import { Contact } from '@/pages/Contact';
import { About } from '@/pages/About';
import { Offers } from '@/pages/Offers';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminPrices } from '@/pages/admin/AdminPrices';
import { AdminStock } from '@/pages/admin/AdminStock';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminMessages } from '@/pages/admin/AdminMessages';
import { AdminWhatsApp } from '@/pages/admin/AdminWhatsApp';
import { AdminBilling } from '@/pages/admin/AdminBilling';
import { AdminOffers } from '@/pages/admin/AdminOffers';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminBanner } from '@/pages/admin/AdminBanner';
import { AdminDelivery } from '@/pages/admin/AdminDelivery';
import { AdminBusiness } from '@/pages/admin/AdminBusiness';
import { AdminContent } from '@/pages/admin/AdminContent';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminNotifications } from '@/pages/admin/AdminNotifications';
import { AdminProfile } from '@/pages/admin/AdminProfile';
import { AdminPassword } from '@/pages/admin/AdminPassword';

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Navigate to="/products/all" replace />} />
          <Route path="/products/:slug" element={<ProductList />} />
          <Route path="/chicken" element={<Navigate to="/products/chicken" replace />} />
          <Route path="/mutton" element={<Navigate to="/products/mutton" replace />} />
          <Route path="/eggs" element={<Navigate to="/products/eggs" replace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="prices" element={<AdminPrices />} />
              <Route path="stock" element={<AdminStock />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="whatsapp" element={<AdminWhatsApp />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="banner" element={<AdminBanner />} />
              <Route path="gallery" element={<AdminBanner gallery />} />
              <Route path="delivery" element={<AdminDelivery />} />
              <Route path="business" element={<AdminBusiness />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="password" element={<AdminPassword />} />
            </Route>
            <Route path="*" element={<SiteLayout />} />
          </Routes>
        </AuthProvider>
      </ShopProvider>
    </BrowserRouter>
  );
}
