// Typed fetch wrapper for the FurFairy API.
// In dev, requests go to /api/* and Vite proxies them to the Fastify server.

const BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, error: ApiError) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  // When false, do not attach the stored token (used for public endpoints).
  auth?: boolean;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';

  const useToken = opts.token ?? (opts.auth === false ? null : accessToken);
  if (useToken) headers['authorization'] = `Bearer ${useToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err: ApiError = json?.error ?? { code: 'UNKNOWN', message: `Request failed (${res.status})` };
    throw new ApiRequestError(res.status, err);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => apiRequest<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    apiRequest<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    apiRequest<T>(path, { method: 'PUT', body, token }),
  // Public (no auth) helpers:
  getPublic: <T>(path: string) => apiRequest<T>(path, { auth: false }),
  postPublic: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body, auth: false }),
};
