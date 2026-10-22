// Preview-mode sign-in. Lets you explore the UI without the backend by writing
// a synthetic session into the same storage the real AuthProvider reads.
//
// When we switch to real integration, the login pages will call the API instead
// and this helper is no longer used.
import { useCallback } from 'react';
import type { AuthContext, UserType } from './types';

const SESSION_KEY = 'furfairy.preview.session';

export function getPreviewSession(): AuthContext | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthContext;
  } catch {
    return null;
  }
}

function buildContext(type: UserType): AuthContext {
  if (type === 'PLATFORM_ADMIN') {
    return { userId: 'preview_admin', type, permissions: [] };
  }
  if (type === 'CUSTOMER') {
    return { userId: 'preview_customer', type, customerId: 'preview_customer', permissions: [] };
  }
  // Employee (shop owner) with full permissions for preview.
  return {
    userId: 'preview_owner',
    type: 'EMPLOYEE',
    employeeId: 'preview_owner',
    shopId: 'shop_happy',
    branchId: null,
    roleKey: 'SHOP_OWNER',
    permissions: ['*'],
  };
}

export function usePreviewAuth() {
  // Sets the synthetic session and navigates by full load to the target path,
  // so AuthProvider reads it fresh on mount.
  const signInAs = useCallback((type: UserType, redirectTo?: string) => {
    const ctx = buildContext(type);
    localStorage.setItem(SESSION_KEY, JSON.stringify(ctx));
    const target = redirectTo ?? (type === 'PLATFORM_ADMIN' ? '/admin' : type === 'CUSTOMER' ? '/account/pets' : '/shop');
    window.location.assign(target);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    window.location.assign('/');
  }, []);

  return { signInAs, signOut };
}
