import { demoReservations, demoAppointments } from '../../lib/demo';
import { formatINR } from '../../lib/types';
import { Badge, Card, statusTone } from '../../components/ui';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function CustomerBookings() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">My Bookings</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-700">Boarding stays</h2>
        <div className="space-y-3">
          {demoReservations.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {r.pet?.name} · {r.package?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {r.transportType.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Ref {r.reference}</p>
                </div>
                <div className="text-right">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  <p className="mt-2 font-semibold text-slate-800">{formatINR(r.totalPaise)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-700">Grooming appointments</h2>
        <div className="space-y-3">
          {demoAppointments.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {a.pet?.name} · {a.service?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {fmtDateTime(a.startsAt)} · {a.location.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Ref {a.reference}</p>
                </div>
                <div className="text-right">
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                  <p className="mt-2 font-semibold text-slate-800">{formatINR(a.pricePaise)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
