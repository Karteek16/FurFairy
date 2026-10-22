import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken } from './api';
import { getPreviewSession } from './previewAuth';
import type { AuthContext as AuthCtxData, LoginResult } from './types';

const TOKEN_KEY = 'furfairy.token';

interface AuthState {
  token: string | null;
  ctx: AuthCtxData | null;
  loading: boolean;
  loginEmployeeOrAdmin: (identifier: string, password: string, shopSlug?: string) => Promise<AuthCtxData>;
  setCustomerToken: (token: string) => Promise<AuthCtxData>;
  logout: () => void;
  has: (perm: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [ctx, setCtx] = useState<AuthCtxData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe(tok: string): Promise<AuthCtxData | null> {
    setAccessToken(tok);
    try {
      const res = await api.get<{ auth: AuthCtxData }>('/auth/me');
      return res.auth;
    } catch {
      return null;
    }
  }

  // On mount, resolve any stored token into an auth context.
  useEffect(() => {
    let active = true;
    (async () => {
      // Preview mode: a synthetic session short-circuits the API entirely.
      const preview = getPreviewSession();
      if (preview) {
        setCtx(preview);
        setLoading(false);
        return;
      }
      if (!token) {
        setLoading(false);
        return;
      }
      const me = await loadMe(token);
      if (!active) return;
      if (me) {
        setCtx(me);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAccessToken(null);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(tok: string, me: AuthCtxData) {
    localStorage.setItem(TOKEN_KEY, tok);
    setAccessToken(tok);
    setToken(tok);
    setCtx(me);
  }

  async function loginEmployeeOrAdmin(identifier: string, password: string, shopSlug?: string) {
    const result = await api.postPublic<LoginResult>('/auth/login', { identifier, password, shopSlug });
    const me = await loadMe(result.accessToken);
    if (!me) throw new Error('Failed to resolve session');
    persist(result.accessToken, me);
    return me;
  }

  async function setCustomerToken(tok: string) {
    const me = await loadMe(tok);
    if (!me) throw new Error('Failed to resolve session');
    persist(tok, me);
    return me;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('furfairy.preview.session');
    setAccessToken(null);
    setToken(null);
    setCtx(null);
  }

  const value = useMemo<AuthState>(
    () => ({
      token,
      ctx,
      loading,
      loginEmployeeOrAdmin,
      setCustomerToken,
      logout,
      has: (perm: string) => !!ctx?.permissions?.includes(perm),
    }),
    [token, ctx, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
