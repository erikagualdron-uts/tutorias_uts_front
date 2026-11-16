import { loadRefreshToken, saveRefreshToken } from '@/store/secureSession';
import { useSession } from '@/store/session';
import { ApiError, type ErrorCode } from './errors';
import type { AuthTokens } from './types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/v1`;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Public endpoints (login, register…) send no token and never trigger a refresh.
  auth?: boolean;
}

async function send(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions,
) {
  const token = useSession.getState().accessToken;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK');
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.ok)
    return (response.status === 204 ? undefined : await response.json()) as T;
  const payload = (await response.json().catch(() => ({}))) as {
    code?: ErrorCode;
    details?: Record<string, unknown>;
  };
  throw new ApiError(
    response.status,
    payload.code ?? 'UNKNOWN',
    payload.details,
  );
}

// Only one refresh runs at a time; concurrent 401s wait for the same one.
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) return false;
  try {
    const tokens = await parse<AuthTokens>(
      await send('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      }),
    );
    await saveRefreshToken(tokens.refreshToken);
    useSession.setState({
      accessToken: tokens.accessToken,
      user: tokens.user,
      status: 'signedIn',
    });
    return true;
  } catch (error) {
    // A network failure must not close the session; the refresh token is still good.
    if (error instanceof ApiError && error.code !== 'NETWORK')
      await useSession.getState().signOut(error.code);
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await send(path, options);
  const retryable = response.status === 401 && options.auth !== false;
  if (!retryable) return parse<T>(response);

  const payload = (await response
    .clone()
    .json()
    .catch(() => ({}))) as { code?: ErrorCode };
  // Only an expired access token is worth a refresh; a revoked or disabled session is final.
  if (payload.code !== 'TOKEN_INVALID' || !(await refreshSession())) {
    if (payload.code && payload.code !== 'TOKEN_INVALID')
      await useSession.getState().signOut(payload.code);
    return parse<T>(response);
  }
  return parse<T>(await send(path, options));
}
