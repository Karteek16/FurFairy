import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { demoShops } from '../../lib/demo';
import type { Shop } from '../../lib/types';
import { MODULE_CATALOG } from '../admin/AdminVerification';
import {
  Badge,
  Banner,
  Button,
  Card,
  Field,
  Input,
  PageHead,
  Section,
  ShopTile,
  Spinner,
  TabStrip,
  Textarea,
  statusTone,
} from '../../components/ui';

const TABS = ['Brand & branch', 'Modules', 'Policies', 'Languages'];

interface Branding {
  displayName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  logoUrl: string | null;
  images: string[];
}

/**
 * Shop Admin settings landing — the first page a shop admin sees after login.
 * Choose modules/features, upload a public logo and store images, set brand
 * colour, description and public identity.
 * Wires to GET /my-shop, PUT /my-shop/modules, PUT /my-shop/branding.
 */
export function ShopSettings() {
  const [tab, setTab] = useState(TABS[0]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [saved, setSaved] = useState(false);

  const [branding, setBranding] = useState<Branding>({
    displayName: 'Milo & Maple',
    tagline: 'Pet care, thoughtfully.',
    description: 'A neighbourhood home for wagging tails and everyday essentials.',
    primaryColor: '#a05c43',
    logoUrl: null,
    images: [],
  });
  const [modules, setModules] = useState<Record<string, boolean>>({
    BOARDING: true,
    GROOMING: true,
    RETAIL: true,
    SUPPLIES: false,
    VET: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ shop: Shop }>('/my-shop');
        setShop(res.shop);
        applyShop(res.shop);
        setUsingDemo(false);
      } catch {
        const demo = demoShops[0];
        setShop(demo);
        applyShop(demo);
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyShop(s: Shop) {
    setBranding((b) => ({
      ...b,
      displayName: s.name,
      description: s.description ?? b.description,
      primaryColor: s.branding?.primaryColor ?? b.primaryColor,
      logoUrl: s.branding?.logoUrl ?? null,
    }));
    const next: Record<string, boolean> = { BOARDING: false, GROOMING: false, RETAIL: false, SUPPLIES: false, VET: false };
    s.shopModules?.forEach((m) => {
      next[m.module.key] = m.status === 'ENABLED';
    });
    setModules((prev) => ({ ...prev, ...next }));
  }

  function setBrand<K extends keyof Branding>(key: K, value: Branding[K]) {
    setBranding((b) => ({ ...b, [key]: value }));
    setSaved(false);
  }

  async function toggleModule(key: string) {
    const enabled = !modules[key];
    setModules((m) => ({ ...m, [key]: enabled }));
    setSaved(false);
    if (!usingDemo) {
      try {
        await api.put('/my-shop/modules', { moduleKey: key, enabled });
      } catch {
        // revert on failure
        setModules((m) => ({ ...m, [key]: !enabled }));
      }
    }
  }

  async function saveBranding() {
    if (!usingDemo) {
      try {
        await api.put('/my-shop/branding', {
          logoUrl: branding.logoUrl,
          primaryColor: branding.primaryColor,
        });
      } catch {
        /* keep local state in demo */
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setBrand('logoUrl', URL.createObjectURL(file));
  }

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setBrand('images', [...branding.images, ...files.map((f) => URL.createObjectURL(f))]);
  }

  if (loading) return <Spinner label="Loading shop settings…" />;

  return (
    <div>
      <PageHead
        eyebrow={[branding.displayName.toUpperCase(), 'SETTINGS']}
        title="Make the shop feel like you."
        subtitle="Brand identity, store presentation, module selection and the details your customers see."
        action={<Button onClick={saveBranding}>{saved ? 'Saved ✓' : 'Save changes'}</Button>}
      />

      {usingDemo && (
        <div className="mb-5">
          <Banner tone="warning" title="Preview data">
            Changes are local until the shop API is connected. Sign in as the shop owner to persist.
          </Banner>
        </div>
      )}

      <TabStrip tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Brand & branch' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Section title="Shop identity">
              <div className="mb-5 flex items-center gap-4">
                <ShopTile name={branding.displayName} logoUrl={branding.logoUrl} color={branding.primaryColor} size="lg" />
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      {branding.logoUrl ? 'Replace logo' : 'Upload logo'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
                  </label>
                  {branding.logoUrl && (
                    <Button variant="ghost" onClick={() => setBrand('logoUrl', null)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                PNG or SVG. The logo appears on the shop page, bills and receipts. If removed, the
                initials {initials(branding.displayName)} are shown instead.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <Input value={branding.displayName} onChange={(e) => setBrand('displayName', e.target.value)} />
                </Field>
                <Field label="Tagline">
                  <Input value={branding.tagline} onChange={(e) => setBrand('tagline', e.target.value)} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Brand colour" hint="Used for the shop tile and accents.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBrand('primaryColor', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBrand('primaryColor', e.target.value)}
                      className="max-w-[160px]"
                    />
                  </div>
                </Field>
              </div>
            </Section>

            <Section title="Store images" action={
              <label className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700">
                Add images
                <input type="file" accept="image/*" multiple className="hidden" onChange={onImagePick} />
              </label>
            }>
              <p className="mb-4 text-sm text-slate-500">
                Photos shown on your public shop page. The first image is used as the hero.
              </p>
              {branding.images.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 py-10 text-center">
                  <span className="text-sm font-medium text-slate-600">Drop JPG or PNG files here</span>
                  <span className="text-xs text-slate-400">Up to 8 images · keep them bright and in focus</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onImagePick} />
                </label>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {branding.images.map((src, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl border border-cream-300">
                      <img src={src} alt={`Store ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-2 top-2">
                          <Badge tone="green">Hero</Badge>
                        </span>
                      )}
                      <button
                        onClick={() => setBrand('images', branding.images.filter((_, j) => j !== i))}
                        className="absolute right-2 top-2 hidden rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-600 group-hover:block"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Public description">
              <Field label="Shop description" hint="Shown at the top of your public shop page.">
                <Textarea rows={3} value={branding.description} onChange={(e) => setBrand('description', e.target.value)} />
              </Field>
            </Section>
          </div>

          <div className="space-y-5">
            <Section title="Public preview">
              <div className="rounded-xl border border-cream-300 bg-cream-50 p-4">
                <div className="flex items-center gap-3">
                  <ShopTile name={branding.displayName} logoUrl={branding.logoUrl} color={branding.primaryColor} />
                  <div>
                    <p className="font-semibold text-slate-900">{branding.displayName}</p>
                    <p className="text-xs text-slate-500">{branding.tagline}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{branding.description}</p>
                <p className="mt-3 text-xs text-slate-400">furfairy.in/{shop?.slug ?? 'your-shop'}</p>
              </div>
            </Section>

            <Section title="Enabled services">
              <div className="space-y-2">
                {MODULE_CATALOG.filter((m) => modules[m.key]).map((m) => (
                  <div key={m.key} className="flex items-center justify-between rounded-lg border border-cream-300 px-3 py-2">
                    <span className="text-sm text-slate-700">{m.name}</span>
                    <Badge tone="green">Enabled</Badge>
                  </div>
                ))}
                {MODULE_CATALOG.every((m) => !modules[m.key]) && (
                  <p className="text-sm text-slate-400">No modules enabled yet.</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      {tab === 'Modules' && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Choose what your shop offers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enable the services you want customers to see and book. Some modules need platform
            verification before they go live.
          </p>
          <div className="mt-5 space-y-3">
            {MODULE_CATALOG.map((m) => {
              const on = modules[m.key];
              const needsVerify = m.key === 'VET';
              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{m.name}</p>
                      {needsVerify && <Badge tone={statusTone('PENDING_VERIFICATION')}>Needs approval</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {m.key === 'BOARDING' && 'Overnight stays with care packages.'}
                      {m.key === 'GROOMING' && 'In-store and home grooming appointments.'}
                      {m.key === 'RETAIL' && 'Sell food, toys and supplies online and at the counter.'}
                      {m.key === 'SUPPLIES' && 'Essentials catalogue for walk-in customers.'}
                      {m.key === 'VET' && 'Clinical workflows. Requires document verification.'}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleModule(m.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'Policies' && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Policies</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cancellation, refund and care policies shown to customers at booking. Configure branches,
            prices and boarding categories under Boarding.
          </p>
          <div className="mt-4">
            <Field label="Cancellation summary">
              <Textarea rows={3} placeholder="e.g. Free cancellation up to 24 hours before check-in." />
            </Field>
          </div>
        </Card>
      )}

      {tab === 'Languages' && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Public shop languages</h2>
          <p className="mt-1 text-sm text-slate-500">
            English is the original. Add translations; unavailable languages fall back to English with a label.
          </p>
          <div className="mt-4 flex gap-2">
            <Badge tone="green">English · Original</Badge>
            <Badge tone="amber">ಕನ್ನಡ · Draft</Badge>
            <Badge>हिंदी · Not added</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
