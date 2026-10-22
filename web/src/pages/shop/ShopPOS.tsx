import { useState } from 'react';
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
  Select,
  ShopTile,
} from '../../components/ui';

interface CatalogItem {
  name: string;
  meta: string;
  pricePaise: number;
}

const CATALOG: CatalogItem[] = [
  { name: 'Meadow Bowl · 2 kg', meta: '18 packs in branch', pricePaise: 124000 },
  { name: 'Cotton rope · Medium', meta: '12 units in branch', pricePaise: 26000 },
  { name: 'Paw wipes · 80 count', meta: '6 packs · expiry check', pricePaise: 32000 },
];

interface LineItem extends CatalogItem {
  qty: number;
}

/** Cashier point of sale (Figma 22 "A quick bill. A thoughtful goodbye."). */
export function ShopPOS() {
  const [bill, setBill] = useState<LineItem[]>([
    { ...CATALOG[0], qty: 1 },
    { ...CATALOG[1], qty: 1 },
  ]);
  const [cashReceived, setCashReceived] = useState(2000);

  function addItem(item: CatalogItem) {
    setBill((b) => {
      const existing = b.find((l) => l.name === item.name);
      if (existing) return b.map((l) => (l.name === item.name ? { ...l, qty: l.qty + 1 } : l));
      return [...b, { ...item, qty: 1 }];
    });
  }

  function setQty(name: string, delta: number) {
    setBill((b) =>
      b.flatMap((l) => {
        if (l.name !== name) return [l];
        const qty = l.qty + delta;
        return qty <= 0 ? [] : [{ ...l, qty }];
      }),
    );
  }

  const subtotal = bill.reduce((s, l) => s + l.pricePaise * l.qty, 0);
  const total = subtotal; // tax not configured
  const change = Math.max(0, cashReceived * 100 - total);

  return (
    <div>
      <PageHead
        eyebrow={['MILO & MAPLE', 'POINT OF SALE']}
        title="A quick bill. A thoughtful goodbye."
        subtitle="Indiranagar counter · Imran Ali · Cashier permissions · Demo session"
      />

      <div className="mb-5">
        <Banner tone="warning" title="Tax settings are not configured">
          No universal GST rate is assumed. Live tax invoices require owner-approved configuration;
          this is a demo bill only.
        </Banner>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Field label="Search or barcode scan">
            <Input placeholder="Scan barcode or search product / SKU" />
          </Field>

          {/* Quick-add tiles */}
          <div className="grid gap-3 sm:grid-cols-3">
            {CATALOG.map((c) => (
              <div key={c.name} className="rounded-xl border border-cream-300 bg-white p-4">
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="mt-2 font-display text-xl font-bold text-slate-900">{formatINR(c.pricePaise)}</p>
                <p className="text-xs text-slate-400">{c.meta}</p>
                <Button variant="secondary" className="mt-3 w-full" onClick={() => addItem(c)}>
                  Add +
                </Button>
              </div>
            ))}
          </div>

          {/* Current bill */}
          <Section title={<span>Current bill <span className="text-sm font-normal text-slate-400">· BILL-1048</span></span>}>
            <Field label="Customer">
              <Input placeholder="Walk-in · or find customer by phone" />
            </Field>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 text-center font-semibold">Qty</th>
                  <th className="pb-2 text-right font-semibold">Rate</th>
                  <th className="pb-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.map((l) => (
                  <tr key={l.name} className="border-b border-cream-200 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">{l.name}</td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setQty(l.name, -1)} className="h-6 w-6 rounded border border-cream-300 text-slate-500">−</button>
                        <span className="w-5 text-center">{l.qty}</span>
                        <button onClick={() => setQty(l.name, +1)} className="h-6 w-6 rounded border border-cream-300 text-slate-500">+</button>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-slate-500">{formatINR(l.pricePaise)}</td>
                    <td className="py-2.5 text-right text-slate-700">{formatINR(l.pricePaise * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Discount">
                <Select>
                  <option>₹0 · Authorised discount only</option>
                </Select>
              </Field>
              <Field label="Tax">
                <Select>
                  <option>Not configured</option>
                </Select>
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Restricted discounts require owner approval. Stock is deducted only when the bill is posted.
            </p>
          </Section>

          <Section title="Take payment">
            <div className="mb-4 text-sm font-medium">
              <span className="text-brand-700 underline underline-offset-4">Cash</span>
              <span className="px-2 text-slate-300">/</span>
              <span className="text-slate-500">Verified digital payment</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cash received">
                <Input type="number" value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value))} />
              </Field>
              <Field label="Change due">
                <Input value={formatINR(change)} readOnly />
              </Field>
            </div>
            <p className="mt-3 text-sm text-slate-700">Total payable <span className="font-display text-lg font-bold">{formatINR(total)}</span></p>
            <Button className="mt-3">Record demo cash &amp; issue receipt</Button>
            <p className="mt-2 text-xs text-slate-400">
              Digital payments need a verified system response. Screenshots alone are not payment confirmation.
            </p>
          </Section>
        </div>

        {/* Receipt rail */}
        <div className="space-y-5">
          <Card>
            <p className="text-sm font-semibold text-slate-900">Receipt preview</p>
            <div className="mt-3 flex items-center gap-2">
              <ShopTile name="Milo & Maple" size="sm" color="#a05c43" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Milo &amp; Maple</p>
                <p className="text-xs text-slate-400">Pet care, thoughtfully.</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Indiranagar, Bengaluru · BILL-1048</p>
            <div className="mt-3 space-y-1 border-t border-cream-200 pt-3 text-sm">
              {bill.map((l) => (
                <div key={l.name} className="flex justify-between">
                  <span className="text-slate-600">{l.name} × {l.qty}</span>
                  <span className="text-slate-700">{formatINR(l.pricePaise * l.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-cream-200 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>{formatINR(0)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-amber-700">Not configured</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Total payable</span><span className="font-display text-lg">{formatINR(total)}</span></div>
            </div>
          </Card>

          <Section title="Counter status">
            <div className="space-y-2 text-sm">
              <Badge tone="amber">Demo · Not a tax invoice</Badge>
              <p className="text-slate-500">Payment · Awaiting tender</p>
              <p className="text-slate-500">Stock source · Indiranagar</p>
            </div>
            <Button variant="secondary" className="mt-3 w-full">Print / send after payment</Button>
            <p className="mt-2 text-xs text-slate-400">
              Cashier can bill and receipt; refunds, tax settings and staff access remain owner-only.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
