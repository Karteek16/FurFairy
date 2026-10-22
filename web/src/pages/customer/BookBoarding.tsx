import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { demoPackages, demoPets } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import type { BoardingTier } from '../../lib/types';
import {
  Badge,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Field,
  Input,
  Section,
  Select,
} from '../../components/ui';

/** Customer boarding booking (Figma 03 "A happy stay starts here."). */
export function BookBoarding() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const initialTier = (params.get('tier') as BoardingTier) ?? 'SILVER';
  const [tier, setTier] = useState<BoardingTier>(initialTier);
  const [petId, setPetId] = useState(demoPets[0]?.id);
  const [transport, setTransport] = useState<'IN_STORE' | 'HOME'>('HOME');
  const [agreed, setAgreed] = useState(false);

  const pkg = useMemo(() => demoPackages.find((p) => p.tier === tier) ?? demoPackages[1], [tier]);
  const bookable = demoPackages.filter((p) => p.status === 'ACTIVE');
  const nights = 3;
  const homeFee = transport === 'HOME' ? 40000 : 0; // collection + return in paise
  const stayTotal = pkg.pricePerNightPaise * nights;
  const total = stayTotal + homeFee;
  const deposit = 100000;

  return (
    <div>
      <Breadcrumb items={['Milo & Maple', 'Indiranagar']} />
      <h1 className="font-display text-3xl font-bold text-slate-900">A happy stay starts here.</h1>
      <p className="mt-1 text-sm text-slate-500">
        1 Stay &amp; care &nbsp;—&nbsp; 2 Review &nbsp;—&nbsp; 3 Demo payment
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section title={<span>Who's staying? <Link to="/account/pets" className="text-sm font-normal text-brand-600">Switch pet</Link></span>}>
            <Field label="Pet">
              <Select value={petId} onChange={(e) => setPetId(e.target.value)}>
                {demoPets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.breed} · {p.species.toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Check-in">
                <Input type="date" defaultValue="2026-10-24" />
              </Field>
              <Field label="Check-out">
                <Input type="date" defaultValue="2026-10-27" />
              </Field>
            </div>
            <div className="mt-4">
              <Banner tone="success" title={`Available for ${demoPets[0]?.name} · ${nights} nights`}>
                A resting unit is available for these dates. No overlapping reservation.
              </Banner>
            </div>
          </Section>

          <Section title="Choose their kind of stay">
            <div className="grid gap-4 sm:grid-cols-2">
              {bookable.map((p) => {
                const selected = p.tier === tier;
                return (
                  <button
                    key={p.id}
                    onClick={() => setTier(p.tier)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-brand-500 bg-brand-50' : 'border-cream-300 hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge tone="clay">{p.tier[0] + p.tier.slice(1).toLowerCase()}</Badge>
                      {selected && <Badge tone="green">Selected</Badge>}
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-slate-900">
                      {formatINR(p.pricePerNightPaise)} <span className="text-sm font-normal text-slate-400">/ night</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {[(p.inclusions as Record<string, string>)?.basicCare, (p.inclusions as Record<string, string>)?.meals, (p.inclusions as Record<string, string>)?.walks]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Getting to and from the shop">
            <div className="mb-4 flex gap-2 text-sm font-medium">
              <button
                onClick={() => setTransport('HOME')}
                className={transport === 'HOME' ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
              >
                Home collection &amp; return
              </button>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => setTransport('IN_STORE')}
                className={transport === 'IN_STORE' ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
              >
                I'll drop off &amp; collect
              </button>
            </div>
            {transport === 'HOME' && (
              <div className="space-y-4">
                <Field label="Saved address · eligible">
                  <Input defaultValue="Home · 24, 2nd Main, Indiranagar · 560038" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Collection · 24 Oct">
                    <Input defaultValue="8:30–9:30 am · ₹200" />
                  </Field>
                  <Field label="Return · 27 Oct">
                    <Input defaultValue="11:00 am–12:00 pm · ₹200" />
                  </Field>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Field label="Care instructions">
                <Input defaultValue="Slow feeder for meals. Nervous around loud dryers." />
              </Field>
            </div>
          </Section>
        </div>

        {/* Summary rail */}
        <div className="space-y-5">
          <Card>
            <p className="text-sm font-semibold text-slate-900">Your stay summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <Row label={`${tier[0] + tier.slice(1).toLowerCase()} · ${nights} nights`} value={formatINR(stayTotal)} />
              {transport === 'HOME' && (
                <>
                  <Row label="Home collection" value={formatINR(20000)} />
                  <Row label="Home return" value={formatINR(20000)} />
                </>
              )}
              <Row label="Additional tax" value="None in demo quote" muted />
            </div>
            <div className="mt-3 border-t border-cream-300 pt-3">
              <Row label={<span className="font-semibold">Reservation total</span>} value={<span className="font-display text-xl font-bold">{formatINR(total)}</span>} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Deposit due now" value={formatINR(deposit)} />
              <Row label="Balance at check-in" value={formatINR(total - deposit)} />
            </div>

            <div className="mt-4">
              <Banner tone="info" title="Illustrative eligible reservation">
                This deposit and transport quote is specific to this stay. It is not a
                marketplace-wide policy.
              </Banner>
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              I have reviewed this shop's stay, collection and cancellation policies and consent to
              share {demoPets[0]?.name}'s care records for this booking.
            </label>

            <Link to={`/checkout/${slug}?type=boarding`}>
              <Button className="mt-4 w-full" disabled={!agreed}>
                Continue to review · {formatINR(deposit)}
              </Button>
            </Link>
          </Card>

          <Section title="Questions before the stay?">
            <p className="text-sm text-slate-500">
              The Milo &amp; Maple team can help with routines, collection and what to pack.
            </p>
            <Button variant="secondary" className="mt-3">
              Chat with shop
            </Button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
      <span className={muted ? 'text-slate-400' : 'text-slate-700'}>{value}</span>
    </div>
  );
}
