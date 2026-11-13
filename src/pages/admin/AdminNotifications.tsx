import { useEffect, useState } from 'react';
import { Check, Bell, ShoppingBag, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Notification } from '@/lib/types';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    load();
  };

  if (loading) return <Spinner label="Loading notifications..." />;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Notifications</h1>
          <p className="text-sm text-stone-500">New orders and customer messages land here.</p>
        </div>
        <button onClick={markAllRead} className="btn-primary py-2 text-xs"><Check size={14} /> Mark All Read</button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" subtitle="You will be notified when a new order or message arrives." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card flex items-start gap-3 p-4 ${n.is_read ? '' : 'border-l-4 border-l-[color:var(--brand-accent)]'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.type === 'new_order' ? 'bg-blue-50 text-blue-600' : n.type === 'new_message' ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
                {n.type === 'new_order' ? <ShoppingBag size={17} /> : n.type === 'new_message' ? <Mail size={17} /> : <Bell size={17} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-stone-900">{n.title}</div>
                <div className="text-sm text-stone-500">{n.body}</div>
                <div className="mt-1 text-xs text-stone-400">{new Date(n.created_at).toLocaleString('en-IN')}</div>
              </div>
              {!n.is_read && (
                <button onClick={async () => { await supabase.from('notifications').update({ is_read: true }).eq('id', n.id); load(); }} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100" title="Mark read">
                  <Check size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
