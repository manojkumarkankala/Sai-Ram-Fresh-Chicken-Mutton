import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { waLink } from '@/lib/format';

export function Contact() {
  const { business } = useShop();
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.message.trim()) {
      setError('Please enter your name and message.');
      return;
    }
    setSending(true);
    const { error: insertError } = await supabase.from('customer_messages').insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSending(false);
    if (insertError) {
      setError('Could not send your message. Please try again or contact us on WhatsApp.');
      return;
    }
    setSent(true);
    setForm({ name: '', phone: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-stone-900">Contact Us</h1>
      <p className="mt-1 text-stone-600">We are happy to help. Call, WhatsApp or send us a message.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Call Us</h2>
            <div className="mt-3 space-y-2">
              {business.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 transition hover:border-[color:var(--brand-primary)]">
                  <Phone size={18} className="text-[color:var(--brand-primary)]" />
                  <span className="font-medium">{p}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">WhatsApp</h2>
            <a
              href={waLink(business.whatsapp, `Hello ${business.business_name}! I have a question.`)}
              target="_blank"
              rel="noreferrer"
              className="btn-wa mt-3 w-full"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-stone-900">Visit Us</h2>
            <div className="mt-3 space-y-3 text-sm text-stone-600">
              <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[color:var(--brand-primary)]" /> {business.address}</div>
              <div className="flex items-center gap-3"><Clock size={18} className="shrink-0 text-[color:var(--brand-primary)]" /> Daily {business.opening_hours} - {business.closing_hours}</div>
              {business.holiday_info && <div className="text-stone-500">{business.holiday_info}</div>}
            </div>
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="font-display text-lg font-bold text-stone-900">Send a Message</h2>
          {sent && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-[color:var(--brand-success)]">
              Message sent! We will get back to you soon.
            </div>
          )}
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="label-text">Name *</label>
              <input className="input-field" value={form.name} onChange={set('name')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Phone Number</label>
                <input className="input-field" value={form.phone} onChange={set('phone')} inputMode="tel" />
              </div>
              <div>
                <label className="label-text">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={set('email')} />
              </div>
            </div>
            <div>
              <label className="label-text">Subject</label>
              <input className="input-field" value={form.subject} onChange={set('subject')} />
            </div>
            <div>
              <label className="label-text">Message *</label>
              <textarea className="input-field" rows={5} value={form.message} onChange={set('message')} />
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
            <button type="submit" disabled={sending} className="btn-primary w-full">
              <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
