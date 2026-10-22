import { useState } from 'react';
import { ShopNav } from '../../components/ShopNav';
import { demoPackages } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import type { BoardingPackage } from '../../lib/types';
import { Badge, Button, Card, Field, Input, Select, statusTone } from '../../components/ui';

export function ShopBoarding() {
  const [packages, setPackages] = useState<BoardingPackage[]>(demoPackages);
  const [editing, setEditing] = useState<BoardingPackage | null>(null);

  function save(updated: BoardingPackage) {
    setPackages((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Boarding packages</h1>
      <p className="mb-6 text-slate-500">
        Configure your tiers, inclusions and prices. Gold & Platinum are Phase 2 — they stay "Coming soon".
      </p>
      <ShopNav />

      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((p) => {
          const phase2 = p.tier === 'GOLD' || p.tier === 'PLATINUM';
          return (
            <Card key={p.id}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <Badge tone={statusTone(p.status)}>{p.status.replace('_', ' ')}</Badge>
              </div>
              <p className="mb-2 text-sm text-slate-500">{p.description}</p>
              <p className="mb-3 text-sm text-slate-600">
                {formatINR(p.pricePerNightPaise)} / night · capacity {p.capacity}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setEditing(p)}>
                  Configure
                </Button>
                {phase2 && <span className="text-xs text-amber-600">Cannot activate in Phase 1</span>}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && <EditModal pkg={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function EditModal({
  pkg,
  onClose,
  onSave,
}: {
  pkg: BoardingPackage;
  onClose: () => void;
  onSave: (p: BoardingPackage) => void;
}) {
  const phase2 = pkg.tier === 'GOLD' || pkg.tier === 'PLATINUM';
  const [name, setName] = useState(pkg.name);
  const [price, setPrice] = useState(String(pkg.pricePerNightPaise / 100));
  const [capacity, setCapacity] = useState(String(pkg.capacity));
  const [status, setStatus] = useState(pkg.status);

  const statusOptions = phase2
    ? ['DRAFT', 'COMING_SOON', 'DISABLED']
    : ['DRAFT', 'COMING_SOON', 'ACTIVE', 'TEMPORARILY_UNAVAILABLE', 'DISABLED'];

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Configure {pkg.tier}</h3>
          <div className="space-y-3">
            <Field label="Package name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price / night (₹)">
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field label="Capacity">
                <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </Field>
            </div>
            <Field label="Status" hint={phase2 ? 'Phase 2 tier: cannot be set ACTIVE yet' : undefined}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as BoardingPackage['status'])}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onSave({
                  ...pkg,
                  name,
                  pricePerNightPaise: Math.round(Number(price) * 100),
                  capacity: Number(capacity),
                  status,
                })
              }
            >
              Save
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
