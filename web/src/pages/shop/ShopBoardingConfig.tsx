import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { demoPackages } from '../../lib/demo';
import type { BoardingPackage, BoardingTier } from '../../lib/types';
import { formatINR } from '../../lib/types';
import {
  Badge,
  Banner,
  Button,
  Card,
  Field,
  Input,
  PageHead,
  Section,
  Spinner,
  TabStrip,
  Textarea,
  statusTone,
} from '../../components/ui';

const TABS = ['Packages', 'Branches'];

const TIER_ORDER: BoardingTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

interface Inclusions {
  meals?: string;
  walks?: string;
  basicCare?: string;
  grooming?: string;
  addOns?: string;
}

interface Branch {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  hours: string;
}

const DEMO_BRANCHES: Branch[] = [
  {
    id: 'br1',
    name: 'Indiranagar',
    addressLine1: '12, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 80 4420 0000',
    hours: '9:00 am – 8:00 pm',
  },
];

/**
 * Shop Admin boarding configuration (Figma 17 "Care packages, on your terms")
 * and branch/address/contact management. Prices and inclusions are set per shop
 * and become the customer-facing config.
 * Wires to GET/PUT /my-shop/boarding/packages and GET/POST /my-shop/branches.
 */
export function ShopBoardingConfig() {
  const [tab, setTab] = useState(TABS[0]);
  const [packages, setPackages] = useState<BoardingPackage[]>([]);
  const [branches, setBranches] = useState<Branch[]>(DEMO_BRANCHES);
  const [activeTier, setActiveTier] = useState<BoardingTier>('SILVER');
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ packages: BoardingPackage[] }>('/my-shop/boarding/packages');
        setPackages(res.packages.length ? res.packages : demoPackages);
        setUsingDemo(res.packages.length === 0);
      } catch {
        setPackages(demoPackages);
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = packages.find((p) => p.tier === activeTier);

  function updateCurrent(patch: Partial<BoardingPackage>) {
    setPackages((ps) => ps.map((p) => (p.tier === activeTier ? { ...p, ...patch } : p)));
    setSaved(false);
  }

  function updateInclusion(key: keyof Inclusions, value: string) {
    setPackages((ps) =>
      ps.map((p) =>
        p.tier === activeTier ? { ...p, inclusions: { ...(p.inclusions ?? {}), [key]: value } } : p,
      ),
    );
    setSaved(false);
  }

  async function save() {
    if (!usingDemo && current) {
      try {
        await api.put('/my-shop/boarding/packages', {
          tier: current.tier,
          name: current.name,
          status: current.status,
          pricePerNightPaise: current.pricePerNightPaise,
          capacity: current.capacity,
          description: current.description,
          inclusions: current.inclusions,
        });
      } catch {
        /* keep local */
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <Spinner label="Loading boarding setup…" />;

  return (
    <div>
      <PageHead
        eyebrow={['MILO & MAPLE', 'BOARDING']}
        title="Care packages, on your terms."
        subtitle="Inclusions and prices are set by this shop and branch — never universal package promises."
        action={<Button onClick={save}>{saved ? 'Saved ✓' : 'Save package'}</Button>}
      />

      {usingDemo && (
        <div className="mb-5">
          <Banner tone="warning" title="Preview data">
            Illustrative packages. Connect the shop API to persist pricing and inclusions.
          </Banner>
        </div>
      )}

      <TabStrip tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Packages' && (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Tier rail */}
          <div className="space-y-3">
            {TIER_ORDER.map((tier) => {
              const pkg = packages.find((p) => p.tier === tier);
              const active = tier === activeTier;
              const comingSoon = pkg?.status === 'COMING_SOON' || !pkg;
              return (
                <button
                  key={tier}
                  onClick={() => pkg && setActiveTier(tier)}
                  disabled={!pkg}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active ? 'border-brand-500 bg-brand-50' : 'border-cream-300 bg-white hover:border-brand-300'
                  } ${!pkg ? 'opacity-60' : ''}`}
                >
                  <p className="font-semibold capitalize text-slate-900">{tier.toLowerCase()}</p>
                  {pkg && !comingSoon ? (
                    <>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatINR(pkg.pricePerNightPaise)} / night
                      </p>
                      <div className="mt-2">
                        <Badge tone="green">Active · {pkg.capacity} units</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2">
                      <Badge tone="amber">Coming soon</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor */}
          {current ? (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold capitalize text-slate-900">
                  {current.tier.toLowerCase()} · Indiranagar
                </h2>
                <Badge tone={statusTone(current.status)}>{current.status.replace(/_/g, ' ')}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nightly rate (INR)">
                  <Input
                    type="number"
                    value={Math.round(current.pricePerNightPaise / 100)}
                    onChange={(e) => updateCurrent({ pricePerNightPaise: Number(e.target.value) * 100 })}
                  />
                </Field>
                <Field label="Capacity">
                  <Input
                    type="number"
                    value={current.capacity}
                    onChange={(e) => updateCurrent({ capacity: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Public description">
                  <Textarea
                    rows={2}
                    value={current.description ?? ''}
                    onChange={(e) => updateCurrent({ description: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Food / meals">
                  <Input
                    value={(current.inclusions as Inclusions)?.meals ?? ''}
                    placeholder="2 shop meals daily"
                    onChange={(e) => updateInclusion('meals', e.target.value)}
                  />
                </Field>
                <Field label="Walks">
                  <Input
                    value={(current.inclusions as Inclusions)?.walks ?? ''}
                    placeholder="3 garden walks daily"
                    onChange={(e) => updateInclusion('walks', e.target.value)}
                  />
                </Field>
                <Field label="Basic care">
                  <Input
                    value={(current.inclusions as Inclusions)?.basicCare ?? ''}
                    placeholder="Resting unit, fresh water, daily update"
                    onChange={(e) => updateInclusion('basicCare', e.target.value)}
                  />
                </Field>
                <Field label="Grooming inclusion">
                  <Input
                    value={(current.inclusions as Inclusions)?.grooming ?? ''}
                    placeholder="Departure brush-out"
                    onChange={(e) => updateInclusion('grooming', e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Optional add-ons">
                  <Input
                    value={(current.inclusions as Inclusions)?.addOns ?? ''}
                    placeholder="Home collection ₹200 · Home return ₹200"
                    onChange={(e) => updateInclusion('addOns', e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Banner tone="success" title="Shop-defined, pet-appropriate care">
                  Confirm food availability and recorded owner instructions at check-in. No camera or
                  nutrition service is included by default.
                </Banner>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-slate-500">Select a package to configure.</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'Branches' && (
        <BranchManager branches={branches} setBranches={setBranches} usingDemo={usingDemo} />
      )}
    </div>
  );
}

function BranchManager({
  branches,
  setBranches,
  usingDemo,
}: {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  usingDemo: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Branch>({
    id: '',
    name: '',
    addressLine1: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    phone: '',
    hours: '9:00 am – 8:00 pm',
  });

  function set<K extends keyof Branch>(key: K, value: Branch[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function add() {
    const branch = { ...form, id: `br_${Date.now()}` };
    if (!usingDemo) {
      try {
        await api.post('/my-shop/branches', {
          name: branch.name,
          addressLine1: branch.addressLine1,
          city: branch.city,
          state: branch.state,
          pincode: branch.pincode,
          phone: branch.phone,
        });
      } catch {
        /* keep local */
      }
    }
    setBranches((bs) => [...bs, branch]);
    setAdding(false);
    setForm({ id: '', name: '', addressLine1: '', city: 'Bengaluru', state: 'Karnataka', pincode: '', phone: '', hours: '9:00 am – 8:00 pm' });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {branches.map((b) => (
          <Card key={b.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{b.name}</p>
                <p className="mt-0.5 text-sm text-slate-600">{b.addressLine1}</p>
                <p className="text-sm text-slate-500">
                  {b.city}, {b.state} · {b.pincode}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {b.hours} · {b.phone}
                </p>
              </div>
              <Badge tone="green">Verified · public</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div>
        {adding ? (
          <Section title="Add a branch">
            <div className="space-y-3">
              <Field label="Branch name">
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Address">
                <Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
                </Field>
                <Field label="Pincode">
                  <Input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
                </Field>
              </div>
              <Field label="Contact phone">
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Opening hours">
                <Input value={form.hours} onChange={(e) => set('hours', e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Button onClick={add} disabled={!form.name || !form.addressLine1}>
                  Add branch
                </Button>
                <Button variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Branches">
            <p className="mb-4 text-sm text-slate-500">
              Each branch has its own address, hours and contact shown to customers.
            </p>
            <Button onClick={() => setAdding(true)}>Add a branch</Button>
          </Section>
        )}
      </div>
    </div>
  );
}
