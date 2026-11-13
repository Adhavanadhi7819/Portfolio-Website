import { PortfolioProfile, PortfolioState } from '../types/portfolio';
import { OWNER_TOTP_SECRET, verifyTotpCode } from './totp';

const OWNER_TOKEN_KEY = 'adhavan_owner_token_v1';

export interface ServerAuthStatus {
  isAuthenticated: boolean;
  isPaired: boolean;
  canShowInitialSetupQr: boolean;
  hasRecoveryKey?: boolean;
  ownerEmailMasked?: string;
  otpauthUri?: string;
}

export interface ServerPortfolioResponse {
  initialized: boolean;
  version?: number;
  updatedAt?: string;
  activePortfolioId?: string;
  portfolios?: PortfolioProfile[];
}

export interface UploadedAssetResponse {
  ok: boolean;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export function getStoredOwnerToken(): string | null {
  try {
    return localStorage.getItem(OWNER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredOwnerToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(OWNER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(OWNER_TOKEN_KEY);
    }
  } catch {}
}

function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredOwnerToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function fetchServerAuthStatus(): Promise<ServerAuthStatus> {
  try {
    const res = await fetch('/api/auth/status', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: buildAuthHeaders()
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        isAuthenticated: false,
        isPaired: true,
        canShowInitialSetupQr: false
      };
    }
    return (await res.json()) as ServerAuthStatus;
  } catch {
    return {
      isAuthenticated: false,
      isPaired: true,
      canShowInitialSetupQr: false
    };
  }
}

export async function verifyOwnerTotpWithServer(
  code: string
): Promise<{ ok: boolean; error?: string; localOnly?: boolean }> {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 6000) : null;
    let res: Response;
    try {
      res = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        ...(controller ? { signal: controller.signal } : {})
      });
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        token?: string;
        error?: string;
      } | null;

      if (res.ok && data?.ok && data?.token) {
        setStoredOwnerToken(data.token);
        return { ok: true };
      }

      if (data && !res.ok) {
        return {
          ok: false,
          error: data.error || 'Invalid or expired 2FA code. Check your Authenticator app and try again.'
        };
      }
    }
  } catch {
    // Fall through to local WebCrypto TOTP verification if backend /api/auth/verify is unreachable or static
  }

  // Fallback for static/offline deployments where /api/* returns non-JSON 404 or is unreachable
  const matchedLocally = await verifyTotpCode(OWNER_TOTP_SECRET, code);
  if (matchedLocally) {
    return { ok: true, localOnly: true };
  }

  return {
    ok: false,
    error: 'Invalid or expired 2FA code. Check your Authenticator app and try again.'
  };
}

export async function requestOwnerRecoveryEmail(): Promise<{
  ok: boolean;
  maskedEmail?: string;
  deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
  deliveryNote?: string;
  error?: string;
}> {
  const res = await fetch('/api/auth/recovery/request', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      error: 'Recovery email service is unavailable on static hosting.'
    };
  }
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    maskedEmail?: string;
    deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
    deliveryNote?: string;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    return {
      ok: false,
      error: data.error || 'Could not send recovery code right now.'
    };
  }
  return {
    ok: true,
    maskedEmail: data.maskedEmail,
    deliveryStatus: data.deliveryStatus,
    deliveryNote: data.deliveryNote
  };
}

export async function verifyOwnerRecoveryWithServer(payload: {
  emailCode?: string;
  recoveryKey?: string;
}): Promise<{ ok: boolean; error?: string; recoveredVia?: string }> {
  const res = await fetch('/api/auth/recovery/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      error: 'Recovery verification endpoint is unavailable here.'
    };
  }
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    token?: string;
    error?: string;
    recoveredVia?: string;
  };
  if (res.ok && data.ok && data.token) {
    setStoredOwnerToken(data.token);
    return { ok: true, recoveredVia: data.recoveredVia };
  }
  return {
    ok: false,
    error: data.error || 'Recovery verification failed.'
  };
}

export async function fetchRecoveryKeyStatus(): Promise<{
  hasRecoveryKey: boolean;
  ownerEmailMasked: string;
}> {
  const res = await fetch('/api/auth/recovery-key/status', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers: buildAuthHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to load recovery status');
  }
  return (await res.json()) as { hasRecoveryKey: boolean; ownerEmailMasked: string };
}

export async function regenerateRecoveryKey(): Promise<{ recoveryKey: string }> {
  const res = await fetch('/api/auth/recovery-key/regenerate', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to generate recovery key');
  }
  return (await res.json()) as { recoveryKey: string };
}

export async function relinkAuthenticatorDevice(
  rotateSecret = false
): Promise<{ otpauthUri: string; rotated: boolean }> {
  const res = await fetch('/api/auth/relink', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ rotateSecret })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to generate device link QR');
  }
  return (await res.json()) as { otpauthUri: string; rotated: boolean };
}

export async function logoutOwnerServer(): Promise<void> {
  setStoredOwnerToken(null);
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch {}
}

export async function fetchServerPortfolio(): Promise<ServerPortfolioResponse> {
  const res = await fetch('/api/portfolio', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch portfolio (${res.status})`);
  }
  return (await res.json()) as ServerPortfolioResponse;
}

export async function saveServerPortfolio(payload: {
  activePortfolioId: string;
  portfolios: PortfolioProfile[];
}): Promise<ServerPortfolioResponse> {
  const res = await fetch('/api/portfolio', {
    method: 'PUT',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  const data = (await res.json().catch(() => ({}))) as ServerPortfolioResponse & {
    error?: string;
  };
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('OWNER_AUTH_REQUIRED');
    }
    throw new Error(data.error || `Failed to save portfolio (${res.status})`);
  }
  return data;
}

export async function resetServerPortfolio(defaultState: PortfolioState): Promise<void> {
  const res = await fetch('/api/portfolio/reset', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ defaultState })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error(`Failed to reset server portfolio (${res.status})`);
  }
}

export async function uploadAssetToServer(
  fileOrBlob: Blob,
  filename: string,
  mimeType?: string
): Promise<UploadedAssetResponse> {
  const res = await fetch('/api/assets', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({
      'Content-Type': mimeType || fileOrBlob.type || 'application/octet-stream',
      'X-Filename': encodeURIComponent(filename)
    }),
    body: fileOrBlob
  });

  const data = (await res.json().catch(() => ({}))) as Partial<UploadedAssetResponse> & {
    error?: string;
  };
  if (!res.ok || !data.url) {
    if (res.status === 401) {
      throw new Error('OWNER_AUTH_REQUIRED');
    }
    throw new Error(data.error || `Asset upload failed (${res.status})`);
  }

  return data as UploadedAssetResponse;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  senderEmail: string;
  projectType: string;
  message: string;
  recipientEmail: string;
  createdAt: string;
  read: boolean;
  deliveryStatus: 'sent' | 'activation_pending' | 'stored_only';
  deliveryNote: string;
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  projectType: string;
  message: string;
  recipientEmail?: string;
}): Promise<{
  ok: boolean;
  id: string;
  recipientEmail: string;
  deliveryStatus: 'sent' | 'activation_pending' | 'stored_only';
  deliveryNote: string;
}> {
  const recipientEmail = (payload.recipientEmail || 'prabuprabu906@gmail.com').trim();

  // 1. Primary path: Express backend (persists to Owner Inbox + dispatches email server-side)
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, recipientEmail })
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson
      ? ((await res.json().catch(() => null)) as {
          ok?: boolean;
          id?: string;
          recipientEmail?: string;
          deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
          deliveryNote?: string;
          error?: string;
        } | null)
      : null;

    if (res.ok && data?.ok) {
      return {
        ok: true,
        id: data.id || '',
        recipientEmail: data.recipientEmail || recipientEmail,
        deliveryStatus: data.deliveryStatus || 'stored_only',
        deliveryNote: data.deliveryNote || ''
      };
    }

    // Surface explicit validation / rate-limit errors directly from server
    if (isJson && data?.error && (res.status === 400 || res.status === 429)) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (
      err instanceof Error &&
      !err.message.includes('Failed to fetch') &&
      !err.message.includes('NetworkError') &&
      !err.message.includes('Load failed') &&
      err.name !== 'TypeError'
    ) {
      throw err;
    }
  }

  // 2. Fallback path: Direct HTTPS FormSubmit relay from browser if /api/contact returned HTML/404 or network error
  const relayRes = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        _replyto: payload.email,
        _subject: `Portfolio Inquiry (${payload.projectType}) — from ${payload.name}`,
        Project_Focus: payload.projectType,
        message: payload.message,
        _template: 'table',
        _captcha: 'false'
      })
    }
  );

  const relayData = (await relayRes.json().catch(() => ({}))) as {
    success?: boolean | string;
    message?: string;
  };

  if (relayRes.ok && (relayData.success === true || relayData.success === 'true')) {
    return {
      ok: true,
      id: `direct_${Date.now()}`,
      recipientEmail,
      deliveryStatus: 'sent',
      deliveryNote: `Email forwarded to ${recipientEmail}`
    };
  }

  if (String(relayData.message || '').toLowerCase().includes('activat')) {
    return {
      ok: true,
      id: `direct_${Date.now()}`,
      recipientEmail,
      deliveryStatus: 'activation_pending',
      deliveryNote: `One-time activation email sent to ${recipientEmail}. Click "Activate Form" in your inbox to enable future messages.`
    };
  }

  throw new Error(
    relayData.message ||
      'Unable to deliver message right now. Please try again or email directly.'
  );
}

export async function fetchOwnerMessages(): Promise<{
  messages: ContactMessageRecord[];
  unreadCount: number;
  recipientEmail: string;
}> {
  const res = await fetch('/api/contact/messages', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers: buildAuthHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error(`Failed to fetch messages (${res.status})`);
  }
  const data = (await res.json()) as {
    messages: ContactMessageRecord[];
    unreadCount: number;
    recipientEmail: string;
  };
  return data;
}

export async function markOwnerMessageRead(
  id: string,
  read = true
): Promise<{ messages: ContactMessageRecord[]; unreadCount: number }> {
  const res = await fetch(`/api/contact/messages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ read })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to update message status');
  }
  return (await res.json()) as { messages: ContactMessageRecord[]; unreadCount: number };
}

export async function deleteOwnerMessage(
  id: string
): Promise<{ messages: ContactMessageRecord[]; unreadCount: number }> {
  const res = await fetch(`/api/contact/messages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildAuthHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to delete message');
  }
  return (await res.json()) as { messages: ContactMessageRecord[]; unreadCount: number };
}

export async function sendTestOwnerEmail(): Promise<{
  recipientEmail: string;
  deliveryStatus: 'sent' | 'activation_pending' | 'stored_only';
  deliveryNote: string;
}> {
  const res = await fetch('/api/contact/test-email', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to trigger test email');
  }
  return (await res.json()) as {
    recipientEmail: string;
    deliveryStatus: 'sent' | 'activation_pending' | 'stored_only';
    deliveryNote: string;
  };
}

export function subscribeToPortfolioUpdates(
  onUpdate: (info: { version: number; updatedAt: string | null }) => void,
  onMessageReceived?: (info: { unreadCount: number }) => void
): () => void {
  if (typeof EventSource === 'undefined') {
    return () => {};
  }

  let closed = false;
  let source: EventSource | null = null;
  let reconnectTimer: number | null = null;

  const connect = () => {
    if (closed) return;
    source = new EventSource('/api/portfolio/stream');

    source.addEventListener('connected', (evt) => {
      try {
        const parsed = JSON.parse((evt as MessageEvent).data) as {
          version?: number;
          updatedAt?: string | null;
        };
        if (typeof parsed.version === 'number' && parsed.version > 0) {
          onUpdate({ version: parsed.version, updatedAt: parsed.updatedAt ?? null });
        }
      } catch {}
    });

    source.addEventListener('portfolio-updated', (evt) => {
      try {
        const parsed = JSON.parse((evt as MessageEvent).data) as {
          version?: number;
          updatedAt?: string | null;
        };
        if (typeof parsed.version === 'number') {
          onUpdate({ version: parsed.version, updatedAt: parsed.updatedAt ?? null });
        }
      } catch {}
    });

    source.addEventListener('message-received', (evt) => {
      try {
        const parsed = JSON.parse((evt as MessageEvent).data) as { unreadCount?: number };
        if (typeof parsed.unreadCount === 'number') {
          onMessageReceived?.({ unreadCount: parsed.unreadCount });
        }
      } catch {}
    });

    source.onerror = () => {
      if (source) {
        source.close();
        source = null;
      }
      if (!closed && reconnectTimer === null) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 4000);
      }
    };
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
    }
    if (source) {
      source.close();
    }
  };
}
