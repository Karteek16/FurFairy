import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { demoPets } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import {
  Banner,
  Breadcrumb,
  Button,
  Card,
  Field,
  Input,
  Section,
  Select,
} from '../../components/ui';

const SLOTS = ['9:00 am', '11:00 am', '2:30 pm', '4:00 · Full'];
const ADDONS = [
  { key: 'nail', label: 'Nail trim · ₹150', note: 'Adds 15 minutes · Owner authorised', price: 15000 },
  { key: 'deshed', label: 'De-shedding · ₹350', note: 'Adds 20 minutes · Not selected', price: 35000 },
];

/** Customer grooming booking (Figma 04 "A fresh start for Milo."). */
export function BookGrooming() {
  const { slug } = useParams();
  const [location, setLocation] = useState<'HOME' | 'STORE'>('HOME');
  const [slot, setSlot] = useState('11:00 am');
  const [addons, setAddons] = useState<Record<string, boolean>>({ nail: true, deshed: false });
  const [agreed, setAgreed] = useState(false);

  const base = 90000; // bath & brush · large
  const addonTotal = ADDONS.reduce((sum, a) => (addons[a.key] ? sum + a.price : sum), 0);
  const homeFee = location === 'HOME' ? 20000 : 0;
  const total = base + addonTotal + homeFee;
  const deposit = 30000;

  return (
    <div>
      <Breadcrumb items={['Milo & Maple', 'Indiranagar']} />
      <h1 className="font-display text-3xl font-bold text-slate-900">A fresh start for Milo.</h1>
      <p className="mt-1 text-sm text-slate-500">Choose the service, place and time that work for you.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section title="Your pet & appointment">
            <Field label="Pet">
              <Select>
                {demoPets.map((p) => (
                  <option key={p.id}>{p.name} · {p.breed} · {p.species.toLowerCase()}</option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 flex gap-2 text-sm font-medium">
              <button
                onClick={() => setLocation('HOME')}
                className={location === 'HOME' ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
              >
                At home
              </button>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => setLocation('STORE')}
                className={location === 'STORE' ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
              >
                In-store
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Service">
                <Select>
                  <option>Bath &amp; brush · 75 minutes</option>
                  <option>Full groom · 120 minutes</option>
                </Select>
              </Field>
              <Field label="Pet size">
                <Select>
                  <option>Large · 20–30 kg</option>
                  <option>Medium · 10–20 kg</option>
                  <option>Small · under 10 kg</option>
                </Select>
              </Field>
            </div>
            {location === 'HOME' && (
              <div className="mt-4">
                <Banner tone="success" title="Home service available · 560038">
                  Your saved Indiranagar address is eligible. A ₹200 travel fee is included in this quote.
                </Banner>
              </div>
            )}
          </Section>

          <Section title="Make it their kind of pamper">
            <div className="grid gap-3 sm:grid-cols-2">
              {ADDONS.map((a) => {
                const on = addons[a.key];
                return (
                  <button
                    key={a.key}
                    onClick={() => setAddons((s) => ({ ...s, [a.key]: !s[a.key] }))}
                    className={`rounded-xl border p-3 text-left transition ${
                      on ? 'border-brand-500 bg-brand-50' : 'border-cream-300 hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{a.label}</span>
                      <span className={on ? 'text-brand-600' : 'text-slate-300'}>{on ? '✓' : '+'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{a.note}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Groomer">
                <Select>
                  <option>Kavya Nair · Home-service trained</option>
                  <option>Any eligible groomer</option>
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" defaultValue="2026-10-23" />
              </Field>
            </div>

            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Time</p>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => {
                const full = s.includes('Full');
                const active = s === slot;
                return (
                  <button
                    key={s}
                    disabled={full}
                    onClick={() => setSlot(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      full
                        ? 'cursor-not-allowed bg-cream-200 text-slate-400'
                        : active
                          ? 'bg-brand-600 text-white'
                          : 'border border-cream-300 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    {s} {active && !full ? '✓' : ''}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              A 30-minute travel buffer is protected on Kavya's calendar.
            </p>
          </Section>

          <Section title="A note for their groomer">
            <Field label="Recorded pet instructions">
              <Input defaultValue="Nervous around loud dryers. Use a quiet setting and breaks." />
            </Field>
            <p className="mt-2 text-xs text-slate-400">
              For medical concerns, please speak with your veterinarian before booking.
            </p>
          </Section>
        </div>

        {/* Summary rail */}
        <div className="space-y-5">
          <Card>
            <p className="text-sm font-semibold text-slate-900">Your appointment</p>
            <div className="mt-3 aspect-[16/9] rounded-xl bg-[linear-gradient(135deg,#d3e7dd,#a7cfbb)]" />
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Bath & brush · Large" value={formatINR(base)} />
              {addons.nail && <Row label="Nail trim" value={formatINR(15000)} />}
              {addons.deshed && <Row label="De-shedding" value={formatINR(35000)} />}
              {location === 'HOME' && <Row label="Home travel fee" value={formatINR(homeFee)} />}
              <Row label="Additional tax" value="None in demo quote" muted />
            </div>
            <div className="mt-3 border-t border-cream-300 pt-3">
              <Row label={<span className="font-semibold">Total</span>} value={<span className="font-display text-xl font-bold">{formatINR(total)}</span>} />
            </div>
            <div className="mt-2 space-y-2 text-sm">
              <Row label="Deposit due now" value={formatINR(deposit)} />
              <Row label="Balance after service" value={formatINR(total - deposit)} />
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              I agree to this shop's grooming and home-service terms. I understand cancellation and
              refund requests are reviewed.
            </label>
            <Link to={`/checkout/${slug}?type=grooming`}>
              <Button className="mt-4 w-full" disabled={!agreed}>
                Review appointment · {formatINR(deposit)}
              </Button>
            </Link>
            <p className="mt-2 text-center text-xs text-slate-400">Illustrative shop quote · Signed in as Aditi Rao</p>
          </Card>
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
