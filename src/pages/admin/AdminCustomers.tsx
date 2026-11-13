import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { inr } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/Ui';
import { waLink } from '@/lib/format';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  village: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('customers').select('*').order('total_spent', { ascending: false });
      setCustomers((data ?? []) as CustomerRow[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner label="Loading customers..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Customers</h1>
        <p className="text-sm text-stone-500">{customers.length} customers, ranked by total value.</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" subtitle="Customers are added automatically with their first order." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Village / Town</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3 text-right">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-stone-50 last:border-0">
                  <td className="p-3 font-medium text-stone-900">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.village || '-'}</td>
                  <td className="p-3">{c.total_orders}</td>
                  <td className="p-3 font-bold">{inr(Number(c.total_spent))}</td>
                  <td className="p-3 text-right">
                    {c.whatsapp || c.phone ? (
                      <a href={waLink(c.whatsapp || c.phone, `Hello ${c.name}!`)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#1eb855] hover:underline">
                        Chat
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
