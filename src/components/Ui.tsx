import { Minus, Plus, Star, StarHalf } from 'lucide-react';

export function QuantityStepper({
  value,
  onChange,
  step = 1,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-100"
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>
      <span className="w-12 text-center text-sm font-semibold">{value}</span>
      <button
        onClick={() => onChange(Math.round((value + step) * 100) / 100)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 transition hover:bg-stone-100"
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} size={14} className="fill-[color:var(--brand-accent)] text-[color:var(--brand-accent)]" />);
    } else if (rating >= i - 0.5) {
      stars.push(<StarHalf key={i} size={14} className="fill-[color:var(--brand-accent)] text-[color:var(--brand-accent)]" />);
    } else {
      stars.push(<Star key={i} size={14} className="text-stone-300" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-[color:var(--brand-primary)]" />
      <span className="ml-3 text-sm text-stone-500">{label}</span>
    </div>
  );
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
      <div className="font-display text-lg font-semibold text-stone-700">{title}</div>
      {subtitle && <div className="mt-1 max-w-sm text-sm text-stone-500">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
