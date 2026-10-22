import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { demoAdminShops } from '../../lib/demo';
import type { Shop } from '../../lib/types';
import {
  Badge,
  Banner,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  PageHead,
  PillTabs,
  Section,
  ShopTile,
  Spinner,
  StatCard,
  Textarea,
  statusTone,
} from '../../components/ui';

const MODULE_CATALOG = [
  { key: 'BOARDING', name: 'Boarding' },
  { key: 'GROOMING', name: 'Grooming' },
  { key: 'RETAIL', name: 'Retail & products' },
  { key: 'SUPPLIES', name: 'Supplies' },
  { key: 'VET', name: 'Veterinary' },
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_REVIEW', label: 'Awaiting review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'REJECTED', label: 'Rejected' },
];

interface OnboardForm {
  name: string;
  slug: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword: string;
  gstin: string;
  moduleKeys: string[];
}

const EMPTY_FORM: OnboardForm = {
  name: '',
  slug: '',
  description: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerPassword: '',
  gstin: '',
  moduleKeys: ['BOARDING'],
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Super Admin shop onboarding + verification console.
 * Wires to GET /admin/shops and the approve/reject/suspend endpoints, and lets
 * the platform owner onboard a new shop (e.g. "Yespaws" → furfairy.in/yespaws).
 * Falls back to demo data when the API is unavailable (preview mode).
 */
export function AdminVerification() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ shops: Shop[] }>('/admin/shops');
      setShops(res.shops);
      setUsingDemo(false);
    } catch {
      setShops(demoAdminShops);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: 'approve' | 'reject' | 'suspend', reason?: string) {
    setBusyId(id);
    const nextStatus =
      action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'SUSPENDED';
    try {
      if (!usingDemo) {
        await api.post(`/admin/shops/${id}/${action}`, reason ? { reason } : undefined);
      }
      setShops((ss) => ss.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)));
    } catch {
      // Keep optimistic state in demo mode; surface nothing destructive.
      setShops((ss) => ss.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)));
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(
    () => (filter === 'ALL' ? shops : shops.filter((s) => s.status === filter)),
    [shops, filter],
  );
  const pending = shops.filter((s) => s.status === 'PENDING_REVIEW').length;
  const approved = shops.filter((s) => s.status === 'APPROVED').length;

  return (
    <div>
      <PageHead
        eyebrow={['PLATFORM', 'VERIFICATION']}
        title="Good care begins with trust."
        subtitle="Onboard new shops and review assigned applications and evidence before public activation."
        action={<Button onClick={() => setDrawerOpen(true)}>Onboard a shop</Button>}
      />

      {usingDemo && (
        <div className="mb-5">
          <Banner tone="warning" title="Preview data">
            Showing illustrative shops. Connect the API and sign in as a platform admin to manage
            live applications.
          </Banner>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting review" value={pending} hint="Needs an activation decision" tone={pending ? 'amber' : 'default'} />
        <StatCard label="Live shops" value={approved} hint="Publicly visible on furfairy.in" />
        <StatCard label="Total onboarded" value={shops.length} hint="Across all statuses" />
      </div>

      <div className="mb-4">
        <PillTabs options={STATUS_FILTERS} active={filter} onSelect={setFilter} />
      </div>

      {loading ? (
        <Spinner label="Loading applications…" />
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No shops in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <ShopRow key={s.id} shop={s} busy={busyId === s.id} onAct={act} />
          ))}
        </div>
      )}

      {drawerOpen && (
        <OnboardDrawer
          onClose={() => setDrawerOpen(false)}
          usingDemo={usingDemo}
          onCreated={(shop) => {
            setShops((ss) => [shop, ...ss]);
            setDrawerOpen(false);
            setFilter('ALL');
          }}
        />
      )}
    </div>
  );
}

function ShopRow({
  shop,
  busy,
  onAct,
}: {
  shop: Shop;
  busy: boolean;
  onAct: (id: string, action: 'approve' | 'reject' | 'suspend', reason?: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <ShopTile name={shop.name} logoUrl={shop.branding?.logoUrl} color={shop.branding?.primaryColor} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{shop.name}</p>
              <Badge tone={statusTone(shop.status)}>{shop.status.replace(/_/g, ' ')}</Badge>
              <span className="text-xs text-slate-400">furfairy.in/{shop.slug}</span>
            </div>
            {shop.description && <p className="mt-0.5 text-sm text-slate-500">{shop.description}</p>}
            {shop.ownerEmail && (
              <p className="mt-1 text-xs text-slate-400">
                {shop.ownerName} · {shop.ownerEmail}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shop.shopModules?.map((m) => (
                <Badge key={m.module.key} tone={m.status === 'ENABLED' ? 'green' : 'amber'}>
                  {m.module.name}
                  {m.status !== 'ENABLED' ? ' · verify' : ''}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2">
          {shop.status === 'PENDING_REVIEW' && (
            <>
              <Button disabled={busy} onClick={() => onAct(shop.id, 'approve')}>
                Approve &amp; publish
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => onAct(shop.id, 'reject', 'Evidence incomplete')}
              >
                Reject
              </Button>
            </>
          )}
          {shop.status === 'APPROVED' && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => onAct(shop.id, 'suspend', 'Under review')}
            >
              Suspend
            </Button>
          )}
          {(shop.status === 'SUSPENDED' || shop.status === 'REJECTED') && (
            <Button disabled={busy} onClick={() => onAct(shop.id, 'approve')}>
              Reinstate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function OnboardDrawer({
  onClose,
  onCreated,
  usingDemo,
}: {
  onClose: () => void;
  onCreated: (shop: Shop) => void;
  usingDemo: boolean;
}) {
  const [form, setForm] = useState<OnboardForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const slug = slugTouched ? form.slug : slugify(form.name);

  function set<K extends keyof OnboardForm>(key: K, value: OnboardForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleModule(key: string) {
    setForm((f) => ({
      ...f,
      moduleKeys: f.moduleKeys.includes(key)
        ? f.moduleKeys.filter((k) => k !== key)
        : [...f.moduleKeys, key],
    }));
  }

  async function submit() {
    setError('');
    if (!form.name.trim()) return setError('Shop name is required.');
    if (!form.ownerName.trim() || !form.ownerEmail.trim()) return setError('Owner name and email are required.');
    if (!usingDemo && !form.ownerPassword.trim())
      return setError('Set an initial owner password so the shop admin can sign in.');

    setSaving(true);
    const newShop: Shop = {
      id: `shop_${Date.now()}`,
      name: form.name.trim(),
      slug,
      description: form.description.trim() || undefined,
      status: 'PENDING_REVIEW',
      ownerName: form.ownerName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      shopModules: form.moduleKeys.map((k) => ({
        status: k === 'VET' ? 'PENDING_VERIFICATION' : 'ENABLED',
        module: { key: k, name: MODULE_CATALOG.find((m) => m.key === k)?.name ?? k },
      })),
    };

    try {
      if (!usingDemo) {
        const res = await api.postPublic<{ shop: { id: string; slug: string; status: string } }>(
          '/shops/register',
          {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            ownerName: form.ownerName.trim(),
            ownerEmail: form.ownerEmail.trim(),
            ownerPhone: form.ownerPhone.trim(),
            ownerPassword: form.ownerPassword,
            gstin: form.gstin.trim() || undefined,
            moduleKeys: form.moduleKeys,
          },
        );
        newShop.id = res.shop.id;
        newShop.slug = res.shop.slug;
        newShop.status = res.shop.status;
      }
      onCreated(newShop);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create shop.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-auto bg-cream-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cream-300 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
              Onboard a shop
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900">Bring a new partner on.</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-5 p-6">
          <Section title="Shop identity">
            <div className="space-y-4">
              <Field label="Shop name">
                <Input
                  value={form.name}
                  placeholder="Yespaws"
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field label="Public URL" hint="This becomes the shop's address.">
                <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                  <span className="whitespace-nowrap bg-cream-200 px-3 py-2.5 text-sm text-slate-500">
                    furfairy.in/
                  </span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set('slug', slugify(e.target.value));
                    }}
                    className="w-full px-3 py-2.5 text-sm outline-none"
                    placeholder="yespaws"
                  />
                </div>
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={form.description}
                  placeholder="A neighbourhood home for wagging tails and everyday essentials."
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Modules">
            <p className="mb-3 text-sm text-slate-500">Choose what this shop can offer. The shop admin can refine these later.</p>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_CATALOG.map((m) => {
                const on = form.moduleKeys.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => toggleModule(m.key)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                      on
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-cream-300 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {m.name}
                      <span className={`text-xs ${on ? 'text-brand-600' : 'text-slate-300'}`}>
                        {on ? '✓' : '+'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Shop admin owner">
            <div className="space-y-4">
              <Field label="Owner name">
                <Input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Owner email">
                  <Input
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => set('ownerEmail', e.target.value)}
                  />
                </Field>
                <Field label="Owner phone">
                  <Input value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Initial password" hint="Shared with the shop admin.">
                  <Input
                    type="password"
                    value={form.ownerPassword}
                    onChange={(e) => set('ownerPassword', e.target.value)}
                  />
                </Field>
                <Field label="GSTIN (optional)">
                  <Input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
                </Field>
              </div>
            </div>
          </Section>

          <ErrorText>{error}</ErrorText>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-cream-300 bg-white px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : 'Create shop'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { MODULE_CATALOG };
