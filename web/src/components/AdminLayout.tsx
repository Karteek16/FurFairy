import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from './ui';
import { useAuth } from '../lib/auth';

const nav = [
  { to: '/admin', label: 'Verification', end: true },
  { to: '/admin/modules', label: 'Modules & integrations' },
  { to: '/admin/commercial', label: 'Commercial' },
  { to: '/admin/support', label: 'Support & audit' },
];

function itemClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-700 text-white' : 'text-brand-100/80 hover:bg-brand-700/60 hover:text-white'
  }`;
}

/**
 * Platform admin (Super Admin) shell — dark forest-green sidebar, restricted
 * control-centre look from Figma screen 29.
 */
export function AdminLayout() {
  const { ctx, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="flex w-64 shrink-0 flex-col bg-brand-800 px-4 py-5">
        <Logo variant="light" className="px-2" />

        <div className="mt-8 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-200/70">
            Platform admin
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Trust &amp; operations</p>
          <p className="text-xs text-brand-200/60">Assigned access only</p>
        </div>

        <nav className="mt-6 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={itemClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 px-2 pt-6 text-xs text-brand-200/60">
          <p>Every privileged action is audited.</p>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-brand-100 underline-offset-2 hover:text-white hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-cream-300 bg-white px-8 py-3">
          <p className="text-sm text-slate-500">Pawlane control centre · Restricted access</p>
          <p className="text-sm font-medium text-slate-600">
            {ctx ? `AS · ${ctx.userId.slice(0, 6)}` : 'Platform admin'}
          </p>
        </header>
        <main className="flex-1 overflow-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
