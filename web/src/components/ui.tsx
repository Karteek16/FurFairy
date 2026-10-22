import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
}) {
  const styles: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    link: 'text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline px-0 py-0',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <As className={`rounded-2xl border border-cream-300 bg-white p-6 shadow-[0_1px_2px_rgba(15,60,50,0.04)] ${className}`}>
      {children}
    </As>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${props.className ?? ''}`}
    />
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-brand-100 text-brand-700',
    clay: 'bg-clay-100 text-clay-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.slate}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (['ACTIVE', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CHECKED_OUT', 'ENABLED', 'VERIFIED', 'PAID'].includes(s))
    return 'green';
  if (
    ['COMING_SOON', 'PENDING', 'PENDING_REVIEW', 'PENDING_VERIFICATION', 'IN_PROGRESS', 'CHECKED_IN', 'DRAFT'].includes(s)
  )
    return 'amber';
  if (['DISABLED', 'REJECTED', 'SUSPENDED', 'CANCELLED', 'NO_SHOW'].includes(s)) return 'red';
  return 'slate';
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
      {label}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-8 text-center">
      <p className="font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}

// ─────────────────────────────────────────────────────────────
// Pawlane design primitives
// ─────────────────────────────────────────────────────────────

/** The Pawlane paw logo mark + wordmark. */
export function Logo({
  variant = 'dark',
  className = '',
}: {
  variant?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="6" cy="9" r="2.1" />
          <circle cx="12" cy="6.5" r="2.1" />
          <circle cx="18" cy="9" r="2.1" />
          <path d="M12 11c-3.2 0-5.5 2.2-5.5 4.6C6.5 17.7 8.6 19 12 19s5.5-1.3 5.5-3.4C17.5 13.2 15.2 11 12 11z" />
        </svg>
      </span>
      <span className={`text-lg font-semibold ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>
        pawlane
      </span>
    </span>
  );
}

/** Square tile with a shop's initials, used as a logo fallback. */
export function ShopTile({
  name,
  logoUrl,
  color,
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-9 w-9 text-xs rounded-lg', md: 'h-11 w-11 text-sm rounded-xl', lg: 'h-14 w-14 text-base rounded-2xl' };
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`${sizes[size]} object-cover`} />;
  }
  return (
    <span
      className={`grid shrink-0 place-items-center font-semibold text-white ${sizes[size]}`}
      style={{ backgroundColor: color ?? '#a05c43' }}
    >
      {initials}
    </span>
  );
}

/** Breadcrumb line like "MILO & MAPLE / SETTINGS". */
export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
      {items.join(' / ')}
    </p>
  );
}

/** Large page heading block with eyebrow, title, subtitle and optional action. */
export function PageHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <Breadcrumb items={eyebrow} />}
        <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Inline tab strip rendered as "Overview / Boarding / ..." links. */
export function TabStrip({
  tabs,
  active,
  onSelect,
}: {
  tabs: string[];
  active: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-cream-300 pb-3 text-sm">
      {tabs.map((t, i) => (
        <span key={t} className="flex items-center">
          <button
            onClick={() => onSelect(t)}
            className={`rounded px-1.5 font-medium transition ${
              t === active ? 'text-brand-700 underline underline-offset-[6px] decoration-2' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
          {i < tabs.length - 1 && <span className="px-1 text-slate-300">/</span>}
        </span>
      ))}
    </div>
  );
}

/** Rounded filter pills (e.g. All / Within 8km). */
export function PillTabs({
  options,
  active,
  onSelect,
}: {
  options: { value: string; label: string }[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            active === o.value
              ? 'bg-brand-600 text-white'
              : 'border border-cream-300 bg-white text-slate-600 hover:border-brand-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Metric card used across dashboards. */
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'amber';
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-cream-300 bg-white'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Soft callout banner. */
export function Banner({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'success';
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: 'border-brand-100 bg-brand-50 text-brand-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-brand-100 bg-brand-50 text-brand-800',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
    </div>
  );
}

/** Section container with an optional heading row. */
export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}
