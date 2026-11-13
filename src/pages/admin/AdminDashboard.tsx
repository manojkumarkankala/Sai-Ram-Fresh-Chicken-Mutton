import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, IndianRupee, Users, Clock, CheckCircle2, XCircle,
  CalendarDays, TrendingUp, Bell, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { inr, STATUS_LABELS, STATUS_COLORS } from '@/lib/format';
import type { Notification, Order } from '@/lib/types';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalCustomers: number;
  totalSales: number;
  monthSales: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [ordersRes, customersRes, notifRes] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total_amount, status, payment_status, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const orders = (ordersRes.data ?? []) as Order[];
    const paid = orders.filter((o) => o.status !== 'cancelled');
    const s: Stats = {
      totalOrders: orders.length,
      todayOrders: orders.filter((o) => new Date(o.created_at) >= startOfToday).length,
      pending: orders.filter((o) => ['new', 'pending'].includes(o.status)).length,
      confirmed: orders.filter((o) => ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalCustomers: customersRes.count ?? 0,
      totalSales: paid.reduce((sum, o) => sum + Number(o.total_amount), 0),
      monthSales: paid.filter((o) => new Date(o.created_at) >= startOfMonth).reduce((sum, o) => sum + Number(o.total_amount), 0),
    };
    setStats(s);
    setRecent(orders.slice(0, 8));
    setNotifications((notifRes.data ?? []) as Notification[]);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-[color:var(--brand-primary)]" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-700' },
    { label: "Today's Orders", value: stats.todayOrders, icon: CalendarDays, color: 'bg-cyan-50 text-cyan-700' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-700' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'bg-red-50 text-red-700' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: 'Total Sales', value: inr(stats.totalSales), icon: IndianRupee, color: 'bg-[color:var(--brand-accent)]/20 text-stone-800' },
    { label: 'Monthly Sales', value: inr(stats.monthSales), icon: TrendingUp, color: 'bg-teal-50 text-teal-700' },
  ];

  const maxDay = recent.length ? Math.max(...recent.map((o) => Number(o.total_amount)), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Business overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-9">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon size={17} />
            </div>
            <div className="mt-2 text-xl font-bold text-stone-900">{c.value}</div>
            <div className="text-xs text-stone-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-stone-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-[color:var(--brand-primary)] hover:underline">View all</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
                  <th className="pb-2 pr-4">Order</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-stone-50 last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-[color:var(--brand-primary)]">{o.order_number}</td>
                    <td className="py-2.5 pr-4">{o.customer_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                    </td>
                    <td className="py-2.5 text-right font-medium">{inr(Number(o.total_amount))}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-stone-400">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-stone-900">Notifications</h2>
            <Link to="/admin/notifications" className="text-sm font-semibold text-[color:var(--brand-primary)] hover:underline">All</Link>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.slice(0, 6).map((n) => (
              <div key={n.id} className={`flex gap-3 rounded-lg p-3 ${n.is_read ? 'bg-stone-50' : 'bg-[color:var(--brand-accent)]/10'}`}>
                <Bell size={16} className={n.is_read ? 'text-stone-400' : 'text-[color:var(--brand-accent)]'} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-stone-800">{n.title}</div>
                  <div className="truncate text-xs text-stone-500">{n.body}</div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div className="py-6 text-center text-sm text-stone-400">No notifications yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
