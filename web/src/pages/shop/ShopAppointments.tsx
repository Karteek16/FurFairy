import { useState } from 'react';
import { ShopNav } from '../../components/ShopNav';
import { demoAppointments } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import type { Appointment } from '../../lib/types';
import { Badge, Button, Card, statusTone } from '../../components/ui';

const NEXT: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: null,
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ShopAppointments() {
  const [rows, setRows] = useState<Appointment[]>(demoAppointments);

  function advance(id: string) {
    setRows((rs) =>
      rs.map((a) => {
        if (a.id !== id) return a;
        const next = NEXT[a.status];
        return next ? { ...a, status: next } : a;
      }),
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Grooming appointments</h1>
      <p className="mb-6 text-slate-500">View the schedule and update appointment status.</p>
      <ShopNav />

      <div className="space-y-3">
        {rows.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {a.pet?.name} · {a.service?.name}
                </p>
                <p className="text-sm text-slate-500">
                  {fmt(a.startsAt)} · {a.location.replace('_', ' ')} · {a.customer?.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {a.staff ? `Assigned: ${a.staff.fullName}` : 'Unassigned'} · Ref {a.reference}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Badge tone={statusTone(a.status)}>{a.status.replace('_', ' ')}</Badge>
                  <p className="mt-1 text-sm font-medium text-slate-700">{formatINR(a.pricePaise)}</p>
                </div>
                {NEXT[a.status] && (
                  <Button variant="secondary" onClick={() => advance(a.id)}>
                    → {NEXT[a.status]!.replace('_', ' ')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
