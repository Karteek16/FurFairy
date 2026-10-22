import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, Logo } from './ui';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition ${
    isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
  }`;
}

export function Layout() {
  const { ctx, logout } = useAuth();
  const navigate = useNavigate();

  const isCustomer = ctx?.type === 'CUSTOMER';

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-cream-300 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Discover
            </NavLink>
            <NavLink to="/" className={navLinkClass}>
              Shops
            </NavLink>
            {isCustomer && (
              <NavLink to="/account/pets" className={navLinkClass}>
                My pets &amp; activity
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline">English ▾</span>
            {ctx ? (
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Sign out
              </Button>
            ) : (
              <Link to="/account/login">
                <Button variant="secondary">Account</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-cream-300 py-6 text-center text-xs text-slate-400">
        Pawlane · A little closer to better pet care. · Help &amp; chat · Privacy
      </footer>
    </div>
  );
}
