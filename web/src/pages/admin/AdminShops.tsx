import { useState } from 'react';
import { demoAdminShops } from '../../lib/demo';
import type { Shop } from '../../lib/types';
import { Badge, Button, Card, statusTone } from '../../components/ui';

export function AdminShops() {
  const [shops, setShops] = useState<Shop[]>(demoAdminShops);
  const [filter, setFilter] = useState<string>('ALL');

  function setStatus(id: string, status: string) {
    setShops((ss) => ss.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  const filtered = filter === 'ALL' ? shops : shops.filter((s) => s.status === filter);
  const pendingCount = shops.filter((s) => s.status === 'PENDING_REVIEW').length;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Platform Admin — Shops</h1>
      <p className="mb-6 text-slate-500">
        Review applications and manage shop status. {pendingCount} awaiting review.
      </p>

      <div className="mb-4 flex gap-2">
        {['ALL', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <Badge tone={statusTone(s.status)}>{s.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-slate-500">{s.description}</p>
                {s.ownerEmail && (
                  <p className="mt-1 text-xs text-slate-400">
                    {s.ownerName} · {s.ownerEmail}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.shopModules?.map((m) => (
                    <Badge key={m.module.key} tone={m.status === 'ENABLED' ? 'blue' : 'amber'}>
                      {m.module.name}
                      {m.status !== 'ENABLED' ? ' (verify)' : ''}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {s.status === 'PENDING_REVIEW' && (
                  <>
                    <Button onClick={() => setStatus(s.id, 'APPROVED')}>Approve</Button>
                    <Button variant="danger" onClick={() => setStatus(s.id, 'REJECTED')}>
                      Reject
                    </Button>
                  </>
                )}
                {s.status === 'APPROVED' && (
                  <Button variant="danger" onClick={() => setStatus(s.id, 'SUSPENDED')}>
                    Suspend
                  </Button>
                )}
                {s.status === 'SUSPENDED' && (
                  <Button onClick={() => setStatus(s.id, 'APPROVED')}>Reinstate</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
