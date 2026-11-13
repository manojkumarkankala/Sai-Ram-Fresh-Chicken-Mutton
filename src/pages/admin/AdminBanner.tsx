import { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/lib/store';
import { Spinner, EmptyState } from '@/components/Ui';
import type { Banner } from '@/lib/types';

export function AdminBanner({ gallery = false }: { gallery?: boolean }) {
  const { refreshShop } = useShop();
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const type = gallery ? 'gallery' : 'banner';

  useEffect(() => { load(); }, [gallery]);

  const load = async () => {
    const { data } = await supabase.from('banners').select('*').eq('type', type).order('sort_order');
    setItems((data ?? []) as Banner[]);
    setLoading(false);
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { contentType: file.type });
    setUploading(false);
    if (upErr) return setError('Upload failed. Please try a smaller image.');
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    if (!gallery) {
      // Replace the single active banner
      await supabase.from('banners').delete().eq('type', 'banner');
    }
    await supabase.from('banners').insert({ type, title: gallery ? '' : 'Hero Banner', image_url: data.publicUrl, is_active: true, sort_order: Date.now() });
    await load();
    await refreshShop();
  };

  const remove = async (b: Banner) => {
    if (!window.confirm('Remove this image?')) return;
    await supabase.from('banners').delete().eq('id', b.id);
    await load();
    await refreshShop();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    await load();
    await refreshShop();
  };

  if (loading) return <Spinner label="Loading images..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">{gallery ? 'Gallery & Images' : 'Website Banner'}</h1>
        <p className="text-sm text-stone-500">
          {gallery ? 'Gallery images shown on the website.' : 'Upload your shop banner. It appears at the top of the homepage. Recommended: wide banner image.'}
        </p>
      </div>

      <div className="card p-5">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
          <Upload size={16} /> {uploading ? 'Uploading...' : gallery ? 'Upload Gallery Image' : 'Upload Banner'}
        </button>
        {error && <div className="mt-2 text-sm text-[color:var(--brand-danger)]">{error}</div>}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={gallery ? 'No gallery images' : 'No banner uploaded'}
          subtitle={gallery ? 'Upload images to build your gallery.' : 'Upload your shop banner to show it on the homepage.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              <img src={b.image_url} alt={b.title} className="h-40 w-full object-cover" />
              <div className="flex items-center justify-between p-3">
                <label className="flex items-center gap-1.5 text-xs text-stone-600">
                  <input type="checkbox" checked={b.is_active} onChange={() => toggleActive(b)} />
                  <Star size={12} className={b.is_active ? 'fill-[color:var(--brand-accent)] text-[color:var(--brand-accent)]' : ''} /> Active
                </label>
                <button onClick={() => remove(b)} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-[color:var(--brand-danger)]"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
