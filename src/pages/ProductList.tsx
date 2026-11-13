import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop } from '@/lib/store';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/Ui';

const GROUP_KEYWORDS: Record<string, { title: string; keyword: string }> = {
  chicken: { title: 'Chicken', keyword: 'chicken' },
  mutton: { title: 'Mutton', keyword: 'mutton' },
  eggs: { title: 'Eggs', keyword: 'egg' },
};

export function ProductList() {
  const { slug } = useParams<{ slug: string }>();
  const { products, categories } = useShop();

  const group = slug ? GROUP_KEYWORDS[slug] : undefined;

  const filtered = useMemo(() => {
    if (!slug || slug === 'all') return products;
    if (group) {
      const keyword = group.keyword;
      const matchingIds = new Set(
        categories.filter((c) => c.name.toLowerCase().includes(keyword)).map((c) => c.id),
      );
      return products.filter((p) => p.category_id !== null && matchingIds.has(p.category_id));
    }
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return [];
    return products.filter((p) => p.category_id === cat.id);
  }, [slug, group, products, categories]);

  const title = group
    ? group.title
    : slug && slug !== 'all'
      ? categories.find((c) => c.slug === slug)?.name ?? 'Products'
      : 'All Products';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-[color:var(--brand-primary)]">Home</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <h1 className="font-display text-3xl font-bold text-stone-900">{title}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to="/products/all"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !slug || slug === 'all'
              ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white'
              : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
          }`}
        >
          All
        </Link>
        {categories.filter((c) => c.is_active).map((c) => (
          <Link
            key={c.id}
            to={`/products/${c.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              slug === c.slug
                ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-white'
                : 'border-stone-300 text-stone-600 hover:border-[color:var(--brand-primary)]'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No products here yet"
            subtitle="Check back soon or browse all products."
            action={<Link to="/products/all" className="btn-primary">Browse All Products</Link>}
          />
        </div>
      )}
    </div>
  );
}
