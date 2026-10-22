import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { Spinner } from './ui';
import type { UserType } from '../lib/types';

export function Protected({ allow, children }: { allow: UserType[]; children: ReactNode }) {
  const { ctx, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!ctx) {
    // Route to the appropriate login based on required audience.
    const to = allow.includes('CUSTOMER') ? '/account/login' : '/login';
    return <Navigate to={to} replace />;
  }
  if (!allow.includes(ctx.type)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        You are signed in as <b>{ctx.type}</b>, which cannot access this area.
      </div>
    );
  }
  return <>{children}</>;
}
