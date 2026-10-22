import { useState } from 'react';
import { ShopNav } from '../../components/ShopNav';
import { demoReservations } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import type { Reservation } from '../../lib/types';
import { Badge, Button, Card, statusTone } from '../../components/ui';

const NEXT: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'CHECKED_IN',
  CHECKED_IN: 'CHECKED_OUT',
  CHECKED_OUT: null,
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ShopReservations() {
  const [rows, setRows] = useState<Reservation[]>(demoReservations);

  function advance(id: string) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = NEXT[r.status];
        return next ? { ...r, status: next } : r;
      }),
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Boarding reservations</h1>
      <p className="mb-6 text-slate-500">Confirm bookings and manage check-in / check-out.</p>
      <ShopNav />

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2">Ref</th>
              <th className="pb-2">Pet / Owner</th>
              <th className="pb-2">Package</th>
              <th className="pb-2">Dates</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 text-slate-500">{r.reference}</td>
                <td className="py-3">
                  <span className="font-medium text-slate-700">{r.pet?.name}</span>
                  <span className="block text-xs text-slate-400">{r.customer?.fullName}</span>
                </td>
                <td className="py-3">{r.package?.tier}</td>
                <td className="py-3 text-slate-500">
                  {fmt(r.checkIn)} → {fmt(r.checkOut)}
                </td>
                <td className="py-3 font-medium">{formatINR(r.totalPaise)}</td>
                <td className="py-3">
                  <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge>
                </td>
                <td className="py-3 text-right">
                  {NEXT[r.status] ? (
                    <Button variant="secondary" onClick={() => advance(r.id)}>
                      → {NEXT[r.status]!.replace('_', ' ')}
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
