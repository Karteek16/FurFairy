import { NavLink } from 'react-router-dom';

const items = [
  { to: '/shop', label: 'Overview', end: true },
  { to: '/shop/boarding', label: 'Boarding' },
  { to: '/shop/reservations', label: 'Reservations' },
  { to: '/shop/appointments', label: 'Appointments' },
  { to: '/shop/catalog', label: 'Catalog & Inventory' },
  { to: '/shop/employees', label: 'Employees' },
];

export function ShopNav() {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 pb-3">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          {it.label}
        </NavLink>
      ))}
    </div>
  );
}
