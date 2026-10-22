import { Link } from 'react-router-dom';
import { ShopNav } from '../../components/ShopNav';
import { Card } from '../../components/ui';
import { demoReservations, demoAppointments, demoInventory } from '../../lib/demo';
import { formatINR } from '../../lib/types';

function Stat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link to={to}>
      <Card className="transition hover:border-brand-300 hover:shadow-md">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </Card>
    </Link>
  );
}

export function ShopDashboard() {
  const pendingRes = demoReservations.filter((r) => r.status === 'PENDING').length;
  const todayAppts = demoAppointments.length;
  const lowStock = demoInventory.filter((i) => i.lowStock).length;
  const revenue = demoReservations.reduce((s, r) => s + r.totalPaise, 0);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Happy Tails — Dashboard</h1>
      <p className="mb-6 text-slate-500">Welcome back. Here's what's happening at your shop.</p>
      <ShopNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending reservations" value={String(pendingRes)} to="/shop/reservations" />
        <Stat label="Upcoming appointments" value={String(todayAppts)} to="/shop/appointments" />
        <Stat label="Low-stock items" value={String(lowStock)} to="/shop/catalog" />
        <Stat label="Boarding revenue (demo)" value={formatINR(revenue)} to="/shop/reservations" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-slate-800">Recent reservations</h3>
          <ul className="space-y-2 text-sm">
            {demoReservations.map((r) => (
              <li key={r.id} className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
                <span>
                  {r.pet?.name} · {r.package?.tier}
                </span>
                <span className="text-slate-400">{r.status}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold text-slate-800">Today's grooming</h3>
          <ul className="space-y-2 text-sm">
            {demoAppointments.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
                <span>
                  {a.pet?.name} · {a.service?.name}
                </span>
                <span className="text-slate-400">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
