import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, IndianRupee, Boxes, ShoppingBag, Mail, MessageCircle,
  Receipt, Percent, Users, Image, Images, Truck, Building2, FileText, BarChart3,
  UserCircle, KeyRound, LogOut, Bell, Menu, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/lib/types';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Manage Products' },
  { to: '/admin/categories', icon: Tags, label: 'Product Categories' },
  { to: '/admin/prices', icon: IndianRupee, label: 'Manage Prices' },
  { to: '/admin/stock', icon: Boxes, label: 'Manage Stock' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Customer Orders' },
  { to: '/admin/messages', icon: Mail, label: 'Customer Messages' },
  { to: '/admin/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/admin/billing', icon: Receipt, label: 'Billing & Invoices' },
  { to: '/admin/offers', icon: Percent, label: 'Discounts & Offers' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/banner', icon: Image, label: 'Website Banner' },
  { to: '/admin/gallery', icon: Images, label: 'Gallery & Images' },
  { to: '/admin/delivery', icon: Truck, label: 'Delivery Settings' },
  { to: '/admin/business', icon: Building2, label: 'Business Information' },
  { to: '/admin/content', icon: FileText, label: 'Website Content' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/profile', icon: UserCircle, label: 'Admin Profile' },
  { to: '/admin/password', icon: KeyRound, label: 'Change Password' },
];

export function AdminLayout() {
  const { isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading || !isAdmin) return;
    fetchUnread();
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loading, isAdmin]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnread(count ?? 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-[color:var(--brand-primary)]" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-stone-100">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[color:var(--brand-primary-dark)] text-stone-200 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="font-display text-lg font-bold text-[color:var(--brand-accent)]">SR Admin</div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="space-y-0.5 overflow-y-auto pb-6 pr-2" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${
                  isActive ? 'bg-[color:var(--brand-accent)] font-semibold text-stone-900' : 'text-stone-300 hover:bg-white/10'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut size={17} /> Logout
          </button>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 lg:hidden" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <span className="font-display font-semibold text-stone-800">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/admin/notifications" className="relative rounded-lg p-2 text-stone-600 hover:bg-stone-100" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--brand-danger)] px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
            <button onClick={handleLogout} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 sm:flex">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
