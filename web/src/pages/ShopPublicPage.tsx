import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { demoShops, demoPackages } from '../lib/demo';
import { formatINR } from '../lib/types';
import type { BoardingPackage, Shop } from '../lib/types';
import {
  Badge,
  Banner,
  Breadcrumb,
  Button,
  EmptyState,
  Section,
  ShopTile,
  Spinner,
  TabStrip,
  statusTone,
} from '../components/ui';

/**
 * Customer-facing shop page at /shops/:slug (Figma 02 "Small moments.
 * Extraordinary care."). Reflects the branding, modules, packages and products
 * the shop admin configured. Reads GET /shops/:slug with demo fallback.
 */
export function ShopPublicPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [tab, setTab] = useState('Overview');

  useEffect(() => {
    let active = true;
    setShop(undefined);
    api
      .getPublic<{ shop: Shop }>(`/shops/${slug}`)
      .then((r) => active && setShop(r.shop))
      .catch(() => {
        if (!active) return;
        setShop(demoShops.find((s) => s.slug === slug) ?? demoShops[0] ?? null);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (shop === undefined) return <Spinner label="Loading shop…" />;
  if (shop === null) return <EmptyState title="Shop not found" hint="This shop may be unavailable." />;

  const hasBoarding = shop.shopModules?.some((m) => m.module.key === 'BOARDING');
  const hasGrooming = shop.shopModules?.some((m) => m.module.key === 'GROOMING');
  const hasRetail = shop.shopModules?.some((m) => ['RETAIL', 'SUPPLIES'].includes(m.module.key));
  const packages = shop.boardingPackages?.length ? shop.boardingPackages : demoPackages;
  const color = shop.branding?.primaryColor ?? '#a05c43';

  const tabs = ['Overview', hasBoarding && 'Boarding', hasGrooming && 'Grooming', hasRetail && 'Products', 'Reviews']
    .filter(Boolean) as string[];

  return (
    <div>
      <Breadcrumb items={['Discover', 'Bengaluru', 'Indiranagar', shop.name]} />

      {/* Hero */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <ShopTile name={shop.name} logoUrl={shop.branding?.logoUrl} color={color} size="lg" />
            <div>
              <p className="font-semibold text-slate-900">{shop.name}</p>
              <p className="text-sm text-slate-500">Pet care, thoughtfully.</p>
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-slate-900">
            Small moments. Extraordinary care.
          </h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {shop.description ??
              'An independent neighbourhood home for wagging tails, fresh trims and everyday essentials.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="green">Verified seller</Badge>
            <span className="font-medium text-slate-700">★ 4.9</span>
            <span className="text-slate-400">128 reviews · 1.8 km away</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            12, 100 Feet Road, Indiranagar, Bengaluru 560038
          </p>
          <p className="text-sm text-brand-600">Open today · 9:00 am–8:00 pm · Directions ↗</p>
          <div className="mt-4 flex gap-3">
            <Button>Chat with shop</Button>
            <Button variant="secondary">♡ Favourite</Button>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#dcae95,#c58463)]" />
      </div>

      <TabStrip tabs={tabs} active={tab} onSelect={setTab} />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {hasGrooming && (
            <Section title="Grooming, their way">
              <div className="mb-3 aspect-[16/7] rounded-xl bg-[linear-gradient(135deg,#d3e7dd,#a7cfbb)]" />
              <p className="text-sm text-slate-500">
                In-store or at your home. Baths, trims and thoughtful finishing touches.
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">Services from ₹900</p>
              <Link to={`/book/${shop.slug}/grooming`}>
                <Button className="mt-3">Book grooming</Button>
              </Link>
            </Section>
          )}

          {hasRetail && (
            <Section title="Their everyday favourites">
              <div className="mb-3 aspect-[16/7] rounded-xl bg-[linear-gradient(135deg,#eed7c9,#dcae95)]" />
              <p className="text-sm text-slate-500">
                Food, play and care essentials. Buy directly from this shop.
              </p>
              <p className="mt-2 text-sm text-slate-500">Local delivery &amp; pickup · Available</p>
              <Link to={`/shops/${shop.slug}/products`}>
                <Button className="mt-3" variant="secondary">
                  Shop products
                </Button>
              </Link>
            </Section>
          )}

          {hasBoarding && (
            <Section title="Stay a little. Feel at home.">
              <p className="mb-4 text-sm text-slate-500">Shop-defined inclusions</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {packages
                  .filter((p) => p.status === 'ACTIVE' || p.status === 'COMING_SOON')
                  .map((p) => (
                    <PackageCard key={p.id} pkg={p} slug={shop.slug} />
                  ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <Section title="A little more to know">
            <p className="text-sm text-slate-500">
              Dogs &amp; cats welcome in separate spaces. Home collection and return in selected
              Bengaluru postcodes.
            </p>
            <div className="mt-3 text-sm">
              <p className="text-slate-400">Languages</p>
              <p className="font-medium text-slate-700">English · ಕನ್ನಡ</p>
            </div>
            <div className="mt-3">
              <Banner tone="info" title="Shop content in English">
                Kannada translation is in progress. Original text is shown as a fallback.
              </Banner>
            </div>
          </Section>

          <Section title="Loved by local pet parents">
            <p className="font-display text-3xl font-bold text-slate-900">4.9 / 5</p>
            <p className="mt-2 text-sm text-slate-600">
              "Milo settled in so quickly. The team listened to all his little routines."
            </p>
            <p className="mt-1 text-xs text-slate-400">Aditi R. · Verified boarding visit</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function PackageCard({ pkg, slug }: { pkg: BoardingPackage; slug: string }) {
  const bookable = pkg.status === 'ACTIVE';
  const inc = (pkg.inclusions ?? {}) as Record<string, string>;
  const summary = [inc.basicCare, inc.meals, inc.walks, inc.grooming].filter(Boolean).join(' · ');
  return (
    <div className="rounded-2xl border border-cream-300 p-4">
      <div className="mb-2 flex items-center justify-between">
        <Badge tone="clay">{pkg.tier[0] + pkg.tier.slice(1).toLowerCase()}</Badge>
        {!bookable && <Badge tone={statusTone(pkg.status)}>{pkg.status.replace(/_/g, ' ')}</Badge>}
      </div>
      <p className="font-display text-2xl font-bold text-slate-900">
        {formatINR(pkg.pricePerNightPaise)} <span className="text-sm font-normal text-slate-400">/ night</span>
      </p>
      <p className="mt-2 text-sm text-slate-500">{summary || pkg.description}</p>
      {bookable ? (
        <Link to={`/book/${slug}/boarding?tier=${pkg.tier}`}>
          <Button className="mt-3">Choose {pkg.tier[0] + pkg.tier.slice(1).toLowerCase()}</Button>
        </Link>
      ) : (
        <Button variant="secondary" className="mt-3" disabled>
          Coming soon
        </Button>
      )}
    </div>
  );
}
