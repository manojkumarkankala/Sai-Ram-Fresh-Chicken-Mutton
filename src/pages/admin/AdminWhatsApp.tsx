import { useEffect, useState } from 'react';
import { MessageCircle, Send, Inbox, Settings2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { inr, waLink, openWhatsApp, STATUS_LABELS } from '@/lib/format';
import { buildOrderMessageFromOrder, buildInvoiceMessage } from '@/lib/whatsapp';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Order, WhatsAppMessage } from '@/lib/types';

export function AdminWhatsApp() {
  const { business } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'send' | 'inbox' | 'setup'>('send');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [ordersRes, messagesRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100),
      supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setOrders((ordersRes.data ?? []) as Order[]);
    setMessages((messagesRes.data ?? []) as WhatsAppMessage[]);
    setLoading(false);
  };

  const sendAndLog = async (order: Order, message: string) => {
    openWhatsApp(order.whatsapp_phone || order.phone, message);
    await supabase.from('whatsapp_messages').insert({
      direction: 'outgoing',
      phone: order.whatsapp_phone || order.phone,
      customer_name: order.customer_name,
      order_number: order.order_number,
      message,
    });
    load();
  };

  if (loading) return <Spinner label="Loading WhatsApp panel..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">WhatsApp Communication</h1>
        <p className="text-sm text-stone-500">Business number: {business.whatsapp}. Send confirmations, invoices and delivery updates.</p>
      </div>

      <div className="flex gap-2">
        {([['send', 'Send to Customer', Send], ['inbox', 'Message Log', Inbox], ['setup', 'Cloud API Setup', Settings2]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
              tab === key ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white' : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="space-y-3">
          {orders.length === 0 && <EmptyState title="No orders yet" subtitle="Once customers place orders, you can message them here." />}
          {orders.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <span className="font-display font-bold text-[color:var(--brand-primary)]">{o.order_number}</span>
                <span className="ml-2 text-sm text-stone-700">{o.customer_name}</span>
                <span className="ml-2 text-xs text-stone-400">{o.whatsapp_phone || o.phone}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABELS[o.status] ? 'bg-stone-100 text-stone-600' : ''}`}>{STATUS_LABELS[o.status]}</span>
                <span className="ml-2 text-sm font-bold">{inr(Number(o.total_amount))}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => sendAndLog(o, buildOrderMessageFromOrder(o, business))} className="btn-wa py-1.5 text-xs">
                  <MessageCircle size={14} /> Confirm Order
                </button>
                <button onClick={() => sendAndLog(o, buildInvoiceMessage(o, business))} className="rounded-lg border border-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#1eb855] hover:bg-green-50">
                  Send Invoice
                </button>
                <button
                  onClick={() => sendAndLog(o, `Hello ${o.customer_name}! Your order ${o.order_number} is on the way. Please keep ${inr(Number(o.total_amount))} ready. Thank you!`)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Delivery Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'inbox' && (
        <div className="space-y-3">
          {messages.length === 0 && <EmptyState title="No logged messages" subtitle="Outgoing WhatsApp messages are logged here. Incoming messages appear once the Cloud API webhook is connected." />}
          {messages.map((m) => (
            <div key={m.id} className={`card p-4 ${m.direction === 'incoming' ? 'border-l-4 border-l-[#25D366]' : 'border-l-4 border-l-[color:var(--brand-primary)]'}`}>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>{m.direction === 'incoming' ? 'Incoming' : 'Outgoing'} | {m.customer_name || m.phone} {m.order_number && `| ${m.order_number}`}</span>
                <span>{new Date(m.created_at).toLocaleString('en-IN')}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{m.message}</p>
              <a href={waLink(m.phone, '')} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1eb855] hover:underline">
                Open chat <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === 'setup' && (
        <div className="card max-w-3xl p-6">
          <h2 className="font-display text-lg font-bold">WhatsApp Business Cloud API Setup</h2>
          <p className="mt-2 text-sm text-stone-600">
            Click-to-chat links (used across this website) let customers and admins send WhatsApp messages free of charge.
            To also <b>receive incoming messages into this dashboard automatically</b>, connect the official WhatsApp Business Cloud API:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-stone-600">
            <li>Create a business account at <b>business.facebook.com</b> and add the WhatsApp product in the Meta Developer dashboard.</li>
            <li>Copy the <b>Phone Number ID</b> and generate a permanent <b>Access Token</b>.</li>
            <li>Add them as Supabase Edge Function secrets named <b>WHATSAPP_TOKEN</b> and <b>WHATSAPP_PHONE_ID</b> (never in website code).</li>
            <li>Point the Meta webhook URL to your <b>whatsapp-webhook</b> edge function and enable the <b>messages</b> subscription field.</li>
            <li>Incoming messages are then stored in the database and appear in the Message Log above; replies are sent through the official API.</li>
          </ol>
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Until the Cloud API is connected, customer communication runs through click-to-chat links, which work on any phone with WhatsApp installed.
          </div>
        </div>
      )}
    </div>
  );
}
