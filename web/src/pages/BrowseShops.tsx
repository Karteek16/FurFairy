import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { demoShops } from '../lib/demo';
import type { Shop } from '../lib/types';
import { Badge, Banner, Button, Card, Input, PillTabs, ShopTile, Spinner } from '../components/ui';

const CATEGORIES = [
  { icon: '🏠', title: 'Boarding', hint: 'A home away from home' },
  { icon: '✂️', title: 'Grooming', hint: 'Fresh looks, happy tails' },
  { icon: '🛍️', title: 'Food & supplies', hint: 'Everyday essentials' },
  { icon: '🚗', title: 'Home services', hint: 'Care that comes to you' },
];

const FILTERS = [
  { value: 'all', label: 'All services' },
  { value: 'near', label: 'Within 8 km' },
  { value: 'rated', label: '4★ & above' },
  { value: 'home', label: 'Home service' },
];

/** Customer marketplace discovery (Figma 01 "Their happy place, just around the corner"). */
export function BrowseShops() {
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    let active = true;
    setShops(null);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api
      .getPublic<{ shops: Shop[] }>(`/shops${q}`)
      .then((r) => {
        if (!active) return;
        setShops(r.shops.length ? r.shops : demoShops);
        setUsingDemo(r.shops.length === 0);
      })
      .catch(() => {
        if (!active) return;
        setShops(demoShops);
        setUsingDemo(true);
      });
    return () => {
      active = false;
    };
  }, [search]);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[260px_1fr_auto]">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Your neighbourhood
          </p>
          <Input defaultValue="Indiranagar, Bengaluru" />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Find your pet's next favourite
          </p>
          <Input
            placeholder="Search shops, grooming, food and more"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button className="h-[46px] w-full sm:w-auto">Search</Button>
        </div>
      </div>

      {/* Hero */}
      <div className="mb-8 grid items-center gap-6 overflow-hidden rounded-3xl border border-cream-300 bg-brand-50 p-8 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            Local care, big love
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-slate-900">
            Their happy place,
            <br />
            just around the corner.
          </h1>
          <p className="mt-3 max-w-md text-slate-600">
            Discover independent pet shops, thoughtful grooming and a stay that feels like home.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button>Explore nearby shops</Button>
            <Button variant="secondary">How Pawlane works</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Browse freely. Sign in only to save, chat or book.</p>
        </div>
        <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#d3e7dd,#a7cfbb)]" />
      </div>

      {/* Category tiles */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-lg">{c.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.title}</p>
              <p className="text-xs text-slate-400">{c.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listing */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Good neighbours. Great pet care.</h2>
          <p className="text-sm text-slate-500">
            {shops?.length ?? '—'} eligible shops near Indiranagar · Available services vary by branch
          </p>
        </div>
      </div>
      <div className="mb-5">
        <PillTabs options={FILTERS} active={filter} onSelect={setFilter} />
      </div>

      {usingDemo && (
        <div className="mb-5">
          <Banner tone="info">Showing sample shops. Approved shops appear here once the API is connected.</Banner>
        </div>
      )}

      {!shops ? (
        <Spinner label="Finding shops near you…" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Banner tone="info" title="Need a little help finding care?">
          Ask the Pawlane guide about shops, services or booking steps. Medical questions are directed
          to a veterinarian — never diagnosed here.
        </Banner>
      </div>
    </div>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link to={`/shops/${shop.slug}`}>
      <Card className="h-full overflow-hidden p-0 transition hover:border-brand-300 hover:shadow-md">
        <div className="aspect-[16/10] bg-[linear-gradient(135deg,#eed7c9,#dcae95)]" />
        <div className="p-5">
          <div className="mb-2 flex items-center gap-3">
            <ShopTile name={shop.name} logoUrl={shop.branding?.logoUrl} color={shop.branding?.primaryColor} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{shop.name}</p>
              <p className="text-xs text-slate-400">Indiranagar · 1.6 km</p>
            </div>
          </div>
          <div className="mb-2 flex items-center gap-2 text-sm">
            <Badge tone="green">★ 4.9</Badge>
            <span className="text-slate-400">(128)</span>
          </div>
          <p className="mb-3 text-sm text-slate-500">
            {shop.shopModules?.map((m) => m.module.name).join(' · ') || 'Pet care'}
          </p>
          <p className="text-sm font-medium text-slate-700">Boarding from ₹850 / night</p>
          <p className="mt-3 text-sm font-medium text-brand-600">Explore shop →</p>
        </div>
      </Card>
    </Link>
  );
}
