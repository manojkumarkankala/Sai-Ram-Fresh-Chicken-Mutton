import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { openWhatsApp, waLink } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import { Mail, Check, Reply, Trash2 } from 'lucide-react';
import type { CustomerMessage } from '@/lib/types';

export function AdminMessages() {
  const { business } = useShop();
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const load = async () => {
    const { data } = await supabase.from('customer_messages').select('*').order('created_at', { ascending: false });
    setMessages((data ?? []) as CustomerMessage[]);
    setLoading(false);
  };

  const markRead = async (m: CustomerMessage) => {
    await supabase.from('customer_messages').update({ is_read: true }).eq('id', m.id);
    load();
  };

  const markReplied = async (m: CustomerMessage) => {
    await supabase.from('customer_messages').update({ is_read: true, is_replied: true }).eq('id', m.id);
    load();
  };

  const remove = async (m: CustomerMessage) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    await supabase.from('customer_messages').delete().eq('id', m.id);
    load();
  };

  if (loading) return <Spinner label="Loading messages..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Customer Messages</h1>
        <p className="text-sm text-stone-500">{messages.filter((m) => !m.is_read).length} unread of {messages.length} total.</p>
      </div>

      {messages.length === 0 ? (
        <EmptyState title="No messages yet" subtitle="Messages from the contact form will appear here." />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`card p-4 ${!m.is_read ? 'border-l-4 border-l-[color:var(--brand-accent)]' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{m.name}</span>
                    {!m.is_read && <span className="rounded-full bg-[color:var(--brand-accent)] px-2 py-0.5 text-[10px] font-bold text-stone-900">NEW</span>}
                    {m.is_replied && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">REPLIED</span>}
                  </div>
                  <div className="text-xs text-stone-400">
                    {m.phone && <span>{m.phone}</span>}
                    {m.email && <span>{m.phone ? ' | ' : ''}{m.email}</span>}
                    <span>{(m.phone || m.email) ? ' | ' : ''}{new Date(m.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {m.phone && (
                    <a
                      href={waLink(m.phone.startsWith('+') ? m.phone : `+91${m.phone.replace(/\D/g, '').slice(-10)}`, `Hello ${m.name}! Thank you for contacting ${business.business_name}.`)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => markReplied(m)}
                      className="btn-wa py-1.5 text-xs"
                    >
                      Reply on WhatsApp
                    </a>
                  )}
                  {!m.is_read && (
                    <button onClick={() => markRead(m)} className="rounded-lg border border-stone-300 p-2 text-stone-500 hover:bg-stone-50" title="Mark as read"><Check size={14} /></button>
                  )}
                  {m.phone && (
                    <button onClick={() => markReplied(m)} className="rounded-lg border border-stone-300 p-2 text-stone-500 hover:bg-stone-50" title="Mark as replied"><Reply size={14} /></button>
                  )}
                  <button onClick={() => remove(m)} className="rounded-lg border border-stone-300 p-2 text-stone-500 hover:bg-red-50 hover:text-[color:var(--brand-danger)]" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              {m.subject && <div className="mt-2 text-sm font-semibold text-stone-700">{m.subject}</div>}
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
