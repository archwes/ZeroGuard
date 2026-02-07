/// <reference types="vite/client" />
/**
 * Centralized API fetch wrapper.
 *
 * - Automatically attaches the JWT `Authorization` header when a token exists.
 * - Intercepts **401 Unauthorized** responses (expired / revoked / server-restarted)
 *   and triggers a full session teardown (logout + MEK clear + redirect to /login).
 * - All API calls across the app should use `apiFetch` instead of raw `fetch`.
 */

import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';

const API_URL = import.meta.env.VITE_API_URL || '';

let isHandlingExpiry = false; // prevent duplicate toasts / logouts

function handleSessionExpired() {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  useAuth.getState().logout();
  useVault.getState().clearMEK();

  toast.error('Sessão expirada. Faça login novamente.', { id: 'session-expired' });

  // Small delay so Zustand state propagates before the redirect
  setTimeout(() => {
    isHandlingExpiry = false;
    // React Router is declarative; setting isAuthenticated=false already
    // causes <Navigate to="/login" />. But if the user is on a page that
    // doesn't re-render (edge case), we force a hard redirect.
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, 100);
}

/**
 * Wrapper around `fetch` that handles auth headers and session expiry.
 *
 * @param path  — API path (e.g. `/vault/items`). Prepended with `API_URL`.
 * @param init  — Standard `RequestInit` options.
 * @returns The `Response` object (caller should still check `res.ok`).
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = useAuth.getState().token;

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    // Network error (server down / unreachable). If we had a token,
    // the session is effectively dead — force logout so the user
    // doesn't sit on a blank dashboard.
    if (token) {
      handleSessionExpired();
    }
    throw new Error('Servidor indisponível');
  }

  if (res.status === 401) {
    handleSessionExpired();
    throw new Error('Sessão expirada');
  }

  return res;
}
