import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatINR } from '../../lib/types';
import {
  Badge,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Field,
  Input,
  Section,
  ShopTile,
} from '../../components/ui';

type Delivery = 'LOCAL' | 'PICKUP' | 'NATIONWIDE';
type Payment = 'UPI' | 'CARD' | 'COD';

/** Single-seller checkout (Figma 06 "Just a few details, then happy tails."). */
export function Checkout() {
  const { slug } = useParams();
  const [delivery, setDelivery] = useState<Delivery>('LOCAL');
  const [payment, setPayment] = useState<Payment>('UPI');
  const [agreed, setAgreed] = useState(true);
  const [placed, setPlaced] = useState(false);

  const items = [
    { name: 'Meadow Bowl · Adult · 2 kg', meta: 'Chicken & rice · Quantity 1', price: 124000 },
    { name: 'Cotton rope toy · Medium', meta: 'Qty 1', price: 26000 },
  ];
  const itemsTotal = items.reduce((s, i) => s + i.price, 0);
  const localDelivery = delivery === 'LOCAL' ? 6000 : 0;
  const total = itemsTotal + localDelivery;

  if (placed) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mb-3 text-5xl">🐾</div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Order placed.</h1>
        <p className="mt-2 text-slate-500">
          Your demo order with Milo &amp; Maple is confirmed. Status and invoice appear in My pets
          &amp; activity. No real payment was taken.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/account/bookings">
            <Button>View activity</Button>
          </Link>
          <Link to={`/shops/${slug}`}>
            <Button variant="secondary">Back to shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={['Cart', 'Delivery', 'Payment']} />
      <h1 className="font-display text-3xl font-bold text-slate-900">Just a few details, then happy tails.</h1>
      <p className="mt-1 text-sm text-slate-500">Your basket belongs to Milo &amp; Maple, Indiranagar. No split-seller checkout.</p>

      <div className="mt-4">
        <Banner tone="warning" title="Sandbox checkout · No real payment will be taken">
          Payment setup is awaiting shop approval. This is an illustrative order; do not enter real
          payment credentials.
        </Banner>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section title={<span>1. Your basket <Link to={`/shops/${slug}/products`} className="text-sm font-normal text-brand-600">Edit items</Link></span>}>
            <div className="mb-3 flex items-center gap-2">
              <ShopTile name="Milo & Maple" size="sm" color="#a05c43" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Milo &amp; Maple</p>
                <p className="text-xs text-slate-400">Pet care, thoughtfully.</p>
              </div>
            </div>
            <div className="divide-y divide-cream-200">
              {items.map((i) => (
                <div key={i.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{i.name}</p>
                    <p className="text-xs text-slate-400">{i.meta}</p>
                  </div>
                  <p className="text-sm text-slate-700">{formatINR(i.price)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="2. How would you like your order?">
            <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium">
              {([
                ['LOCAL', 'Local delivery · ₹60'],
                ['PICKUP', 'Pickup · Free'],
                ['NATIONWIDE', 'Nationwide · Check postcode'],
              ] as [Delivery, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setDelivery(v)}
                  className={delivery === v ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery address">
                <Input defaultValue="Aditi Rao · Home · 24, 2nd Main, Indiranagar, 560038" />
              </Field>
              <Field label="Contact">
                <Input defaultValue="+91 98••• ••214" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Delivery instructions">
                <Input defaultValue="Call at the gate" />
              </Field>
            </div>
            {delivery === 'LOCAL' && (
              <div className="mt-4">
                <Banner tone="success" title="Eligible for local delivery">
                  Estimated 22–23 Oct. This shop ships selected products nationwide; eligibility and
                  shipping are checked by postcode.
                </Banner>
              </div>
            )}
          </Section>

          <Section title="3. Payment method">
            <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium">
              {([
                ['UPI', 'UPI · Demo'],
                ['CARD', 'Card · Sandbox'],
                ['COD', 'Cash on delivery'],
              ] as [Payment, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setPayment(v)}
                  className={payment === v ? 'text-brand-700 underline underline-offset-4' : 'text-slate-500'}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {payment === 'UPI' && 'UPI demo simulates a verified payment response. Live payments are disabled until configuration and approval are complete.'}
              {payment === 'CARD' && 'Card sandbox does not charge a real card. Live card payments require shop approval.'}
              {payment === 'COD' && 'COD eligible for this local order · Pay ₹1,560 at delivery.'}
            </p>
          </Section>
        </div>

        {/* Order summary rail */}
        <div className="space-y-5">
          <Card>
            <p className="text-sm font-semibold text-slate-900">Order summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <Row label={`Items · ${items.length}`} value={formatINR(itemsTotal)} />
              <Row label="Local delivery" value={localDelivery ? formatINR(localDelivery) : 'Free'} />
              <Row label="Discount" value={formatINR(0)} />
              <Row label="Additional tax" value="None in demo quote" muted />
            </div>
            <div className="mt-3 border-t border-cream-300 pt-3">
              <Row label={<span className="font-semibold">Total</span>} value={<span className="font-display text-xl font-bold">{formatINR(total)}</span>} />
            </div>
            <div className="mt-3">
              <Badge tone="amber">DEMO · {payment} sandbox</Badge>
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              I agree to this seller's delivery and reviewed cancellation/refund terms.
            </label>
            <Button className="mt-4 w-full" disabled={!agreed} onClick={() => setPlaced(true)}>
              Place demo order · {formatINR(total)}
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              Signed in as Aditi Rao. Your payment and invoice status will appear in My pets &amp; activity.
            </p>
          </Card>

          <Section title="Changed your mind?">
            <p className="text-sm text-slate-500">
              After placing an order, you can request cancellation or report a problem. The seller
              reviews each request before any refund.
            </p>
            <Button variant="secondary" className="mt-3">
              Ask the shop
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
