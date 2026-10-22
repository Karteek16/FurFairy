import { useState } from 'react';
import {
  Badge,
  Banner,
  Button,
  Field,
  Input,
  PageHead,
  Section,
  Select,
  StatCard,
  statusTone,
} from '../../components/ui';

interface StockRow {
  product: string;
  sku: string;
  batch: string;
  available: string;
  expiry: string;
  state: 'Available' | 'Low stock' | 'Expiry review';
}

const STOCK: StockRow[] = [
  { product: 'Meadow Bowl · Adult 2 kg', sku: 'MB-A2', batch: 'B2608', available: '18 packs', expiry: 'Aug 2027', state: 'Available' },
  { product: 'Meadow Bowl · Puppy 1 kg', sku: 'MB-P1', batch: 'B2609', available: '8 packs', expiry: 'Sep 2027', state: 'Low stock' },
  { product: 'Cotton rope · Medium', sku: 'CT-RM', batch: 'R2610', available: '12 units', expiry: 'Not applicable', state: 'Available' },
  { product: 'Paw wipes · 80 count', sku: 'PW-80', batch: 'W2511', available: '6 packs', expiry: '10 Nov 2026', state: 'Expiry review' },
  { product: 'Cat litter · 5 L', sku: 'CL-5', batch: 'L2610', available: '4 bags', expiry: 'Not applicable', state: 'Low stock' },
];

const IMPORT_ISSUES = [
  { row: 12, issue: 'Duplicate SKU MB-A2', action: 'Choose update or unique SKU' },
  { row: 28, issue: 'Invalid expiry format', action: 'Use DD MMM YYYY' },
  { row: 39, issue: 'Missing opening-stock reason', action: 'Add source / receipt reference' },
];

/** Shop inventory & purchasing (Figma 21 "The shelf, the batch, the whole picture."). */
export function ShopInventory() {
  const [search, setSearch] = useState('');

  const rows = STOCK.filter((r) => r.product.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHead
        eyebrow={['MILO & MAPLE', 'INVENTORY']}
        title="The shelf, the batch, the whole picture."
        subtitle="Branch-level stock with supplier receipts, expiry tracking and reasoned adjustments."
        action={<Button>Receive supplier stock</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <Field label="Search / scan barcode">
          <Input value={search} placeholder="Search name, SKU or scan barcode" onChange={(e) => setSearch(e.target.value)} />
        </Field>
        <Field label="Category">
          <Select>
            <option>All products</option>
            <option>Food</option>
            <option>Toys</option>
            <option>Care</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button variant="secondary" className="h-[46px]">Import CSV</Button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Low stock" value="3 variants" hint="At or below reorder level" tone="amber" />
        <StatCard label="Expiry review" value="1 batch" hint="Nearing expiry window" tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Section title={<span>Indiranagar stock <span className="text-sm font-normal text-slate-400">· Products &amp; variants</span></span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-semibold">Product / variant</th>
                    <th className="pb-2 font-semibold">SKU / batch</th>
                    <th className="pb-2 font-semibold">Available</th>
                    <th className="pb-2 font-semibold">Expiry</th>
                    <th className="pb-2 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.sku} className="border-b border-cream-200 last:border-0">
                      <td className="py-2.5 font-medium text-slate-800">{r.product}</td>
                      <td className="py-2.5 text-slate-500">{r.sku} / {r.batch}</td>
                      <td className="py-2.5 text-slate-700">{r.available}</td>
                      <td className="py-2.5 text-slate-500">{r.expiry}</td>
                      <td className="py-2.5">
                        <Badge tone={r.state === 'Available' ? 'green' : 'amber'}>{r.state}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title={<span>Import validation <span className="text-sm font-normal text-slate-400">· stock-oct.csv</span></span>}>
            <div className="mb-3 flex gap-2">
              <Badge tone="green">42 successful rows</Badge>
              <Badge tone="red">3 invalid rows · Not imported</Badge>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-semibold">Row</th>
                  <th className="pb-2 font-semibold">Issue</th>
                  <th className="pb-2 font-semibold">Action needed</th>
                </tr>
              </thead>
              <tbody>
                {IMPORT_ISSUES.map((i) => (
                  <tr key={i.row} className="border-b border-cream-200 last:border-0">
                    <td className="py-2.5 text-slate-500">{i.row}</td>
                    <td className="py-2.5 text-red-600">{i.issue}</td>
                    <td className="py-2.5 text-slate-600">{i.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="secondary" className="mt-4">Download error rows</Button>
          </Section>
        </div>

        {/* Right rail: receive + adjust */}
        <div className="space-y-5">
          <Section title="Receive a supplier batch">
            <div className="space-y-3">
              <Field label="Supplier">
                <Select>
                  <option>Green Basket Distributors</option>
                  <option>Paws Supply Co.</option>
                </Select>
              </Field>
              <Field label="Receipt reference">
                <Input defaultValue="GRN-089 · Supplier bill attached" />
              </Field>
              <Field label="Variant / branch">
                <Select>
                  <option>Meadow Bowl · Puppy 1 kg · Indiranagar</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity">
                  <Input defaultValue="24 packs" />
                </Field>
                <Field label="Batch">
                  <Input defaultValue="B2610" />
                </Field>
              </div>
              <Field label="Expiry date">
                <Input type="date" defaultValue="2027-10-15" />
              </Field>
              <Button className="w-full">Review receipt before posting</Button>
            </div>
          </Section>

          <Section title="Adjust stock with a reason">
            <div className="space-y-3">
              <Field label="Variant">
                <Select>
                  <option>Paw wipes · W2511</option>
                </Select>
              </Field>
              <Field label="Change / reason">
                <Select>
                  <option>−1 · Damaged seal · Photo attached</option>
                  <option>−1 · Expired · Disposed</option>
                </Select>
              </Field>
              <Banner tone="warning" title="No unexplained changes">
                Posting records the reason, evidence, employee and before/after quantity. Owner review
                required for restricted adjustments.
              </Banner>
              <Button variant="secondary" className="w-full">Submit for review</Button>
            </div>
          </Section>

          <div className="rounded-xl border border-cream-300 bg-white p-4 text-xs text-slate-400">
            <Badge tone={statusTone('PENDING')}>Illustrative data</Badge>
            <p className="mt-2">Role &amp; branch permissions enforced.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
