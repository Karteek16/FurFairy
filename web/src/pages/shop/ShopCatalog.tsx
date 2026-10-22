import { ShopNav } from '../../components/ShopNav';
import { demoProducts, demoInventory } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import { Badge, Card } from '../../components/ui';

export function ShopCatalog() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Catalog & Inventory</h1>
      <p className="mb-6 text-slate-500">Products, variants, prices and stock levels.</p>
      <ShopNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">Products</h2>
          <div className="space-y-3">
            {demoProducts.map((p) => (
              <Card key={p.id}>
                <p className="font-semibold text-slate-800">{p.name}</p>
                <p className="mb-3 text-sm text-slate-500">{p.description}</p>
                <div className="space-y-1.5">
                  {p.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {v.sku} · {v.packSize}
                      </span>
                      <span className="font-medium text-slate-800">{formatINR(v.pricePaise)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">Inventory (Main Branch)</h2>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">On hand</th>
                  <th className="pb-2 text-right">Reserved</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoInventory.map((i) => (
                  <tr key={i.variantSku} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 text-slate-600">{i.variantSku}</td>
                    <td className="py-3 text-right font-medium">{i.quantity}</td>
                    <td className="py-3 text-right text-slate-500">{i.reserved}</td>
                    <td className="py-3 text-right">
                      {i.lowStock ? <Badge tone="amber">Low stock</Badge> : <Badge tone="green">OK</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      </div>
    </div>
  );
}
