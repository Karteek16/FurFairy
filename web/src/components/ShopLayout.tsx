import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo, ShopTile } from './ui';
import { useAuth } from '../lib/auth';

const nav = [
  { to: '/shop', label: 'Overview', end: true },
  { to: '/shop/boarding', label: 'Boarding' },
  { to: '/shop/care', label: 'Care tasks' },
  { to: '/shop/grooming', label: 'Grooming' },
  { to: '/shop/inventory', label: 'Inventory' },
  { to: '/shop/pos', label: 'Point of sale' },
  { to: '/shop/orders', label: 'Orders' },
  { to: '/shop/finance', label: 'Finance' },
  { to: '/shop/employees', label: 'Employees' },
  { to: '/shop/settings', label: 'Settings' },
];

function itemClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-cream-200'
  }`;
}

/**
 * Shop workspace shell — light sidebar with the shop identity, used by every
 * shop-admin / staff page (Figma screens 13–25).
 */
export function ShopLayout() {
  const { ctx, logout } = useAuth();
  const navigate = useNavigate();

  const shopName = 'Milo & Maple';
  const branch = 'Indiranagar';

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-cream-300 bg-white px-4 py-5">
        <Logo className="px-2" />

        <div className="mt-6 flex items-center gap-2 px-2">
          <ShopTile name={shopName} size="sm" color="#a05c43" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{shopName}</p>
            <p className="truncate text-xs text-slate-500">
              {branch} · {ctx?.roleKey === 'SHOP_OWNER' ? 'Owner' : ctx?.roleKey ?? 'Staff'}
            </p>
          </div>
        </div>

        <nav className="mt-6 space-y-0.5">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={itemClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 px-2 pt-6 text-xs text-slate-400">
          <p>Verified branch · 3 enabled modules</p>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-cream-300 bg-white px-8 py-3">
          <p className="text-sm text-slate-600">
            {branch} branch · Bengaluru · IST
          </p>
          <p className="text-sm text-slate-500">English · AR</p>
        </header>
        <main className="flex-1 overflow-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
