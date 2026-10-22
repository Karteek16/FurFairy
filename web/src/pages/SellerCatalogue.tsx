import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatINR } from '../lib/types';
import {
  Badge,
  Banner,
  Breadcrumb,
  Button,
  Card,
  Input,
  PillTabs,
  ShopTile,
} from '../components/ui';

interface CatProduct {
  id: string;
  name: string;
  meta: string;
  pricePaise: number;
  altPrice?: string;
  stock: string;
  category: string;
}

const PRODUCTS: CatProduct[] = [
  { id: 'mb-adult', name: 'Meadow Bowl · Adult', meta: 'Chicken & rice · 2 kg', pricePaise: 124000, altPrice: '1 kg · ₹690', stock: '18 in stock', category: 'dog' },
  { id: 'mb-puppy', name: 'Meadow Bowl · Puppy', meta: 'Chicken & oats · 1 kg', pricePaise: 69000, stock: '8 in stock', category: 'dog' },
  { id: 'rope', name: 'Cotton rope toy', meta: 'Three-knot · Medium', pricePaise: 26000, stock: '12 available', category: 'toys' },
  { id: 'wipes', name: 'Paw wipes', meta: '80 count · gentle', pricePaise: 32000, stock: '6 packs', category: 'care' },
];

const CATEGORIES = [
  { value: 'dog', label: 'Dog food' },
  { value: 'cat', label: 'Cat food' },
  { value: 'toys', label: 'Toys' },
  { value: 'care', label: 'Care' },
];

/** Seller catalogue & product (Figma 05 "Good things for everyday tails."). */
export function SellerCatalogue() {
  const { slug } = useParams();
  const [category, setCategory] = useState('dog');
  const [selected, setSelected] = useState<CatProduct>(PRODUCTS[0]);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<string[]>(['mb-adult', 'rope']);

  const shown = PRODUCTS.filter((p) => p.category === category || category === 'dog');
  const cartTotal = cart.reduce((s, id) => s + (PRODUCTS.find((p) => p.id === id)?.pricePaise ?? 0), 0);

  function addToCart(id: string) {
    setCart((c) => (c.includes(id) ? c : [...c, id]));
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <ShopTile name="Milo & Maple" size="md" color="#a05c43" />
            <div>
              <p className="font-semibold text-slate-900">Milo &amp; Maple</p>
              <p className="text-xs text-slate-400">Pet care, thoughtfully.</p>
            </div>
          </div>
          <Breadcrumb items={['Indiranagar', 'Shopping from one seller']} />
          <h1 className="font-display text-3xl font-bold text-slate-900">Good things for everyday tails.</h1>
          <p className="mt-1 text-sm text-slate-500">
            Food, play and care essentials, selected by your neighbourhood shop.
          </p>
        </div>
        <Link to={`/checkout/${slug}`}>
          <Button variant="secondary">
            🛒 Cart · {cart.length} items · {formatINR(cartTotal)}
          </Button>
        </Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Search food, toys and supplies" />
        <div />
        <Button variant="secondary" className="h-[46px]">In stock only ✓</Button>
      </div>

      <div className="mb-5">
        <PillTabs options={CATEGORIES} active={category} onSelect={setCategory} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,420px)]">
        {/* Product grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {shown.map((p) => (
            <Card key={p.id} className="p-0">
              <button className="block w-full text-left" onClick={() => setSelected(p)}>
                <div className="aspect-[4/3] rounded-t-2xl bg-[linear-gradient(135deg,#eed7c9,#dcae95)]" />
                <div className="p-4">
                  <p className="font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.meta}</p>
                  <p className="mt-2 font-display text-lg font-bold text-slate-900">{formatINR(p.pricePaise)}</p>
                  <div className="mt-2">
                    {selected.id === p.id ? (
                      <Badge tone="green">Selected · {p.stock}</Badge>
                    ) : (
                      <Badge>{p.stock}</Badge>
                    )}
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>

        {/* Detail rail */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">{selected.name}</p>
              <Badge tone="green">In stock</Badge>
            </div>
            <div className="aspect-[16/10] rounded-xl bg-[linear-gradient(135deg,#eed7c9,#dcae95)]" />
            <p className="mt-3 text-sm text-slate-500">{selected.meta}</p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-900">{formatINR(selected.pricePaise)}</p>
            {selected.altPrice && <p className="text-xs text-slate-400">Also: {selected.altPrice}</p>}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-slate-500">Quantity</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-7 w-7 rounded border border-cream-300 text-slate-500">−</button>
                <span className="w-5 text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="h-7 w-7 rounded border border-cream-300 text-slate-500">+</button>
              </div>
            </div>

            <Button className="mt-4 w-full" onClick={() => addToCart(selected.id)}>
              {cart.includes(selected.id) ? 'In cart ✓' : `Add to cart · ${formatINR(selected.pricePaise * qty)}`}
            </Button>
            <p className="mt-2 text-xs text-slate-400">Pickup today · Local delivery to 560038</p>

            <div className="mt-4 space-y-1 border-t border-cream-200 pt-3 text-sm text-slate-500">
              <p>Everyday dry food for adult dogs. Resealable pack with chicken and rice.</p>
              <p>Pack &amp; storage · Cool, dry place</p>
              <p>Seller stock · {selected.stock} · Indiranagar</p>
            </div>
          </Card>

          <Banner tone="info" title="A single-shop basket">
            Items here are sold and fulfilled by Milo &amp; Maple. Shopping with another seller starts
            a separate cart.
          </Banner>
        </div>
      </div>
    </div>
  );
}
