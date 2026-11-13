import { PortfolioProfile, PortfolioState } from '../types/portfolio';

const OWNER_TOKEN_KEY = 'adhavan_owner_token_v1';

export interface ServerAuthStatus {
  isAuthenticated: boolean;
  isPaired: boolean;
  canShowInitialSetupQr: boolean;
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
  const res = await fetch('/api/auth/status', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
    headers: buildAuthHeaders()
  });
  if (!res.ok) {
    throw new Error(`Auth status request failed (${res.status})`);
  }
  return (await res.json()) as ServerAuthStatus;
}

export async function verifyOwnerTotpWithServer(
  code: string
): Promise<{ ok: boolean; error?: string; otpauthUri?: string }> {
  const res = await fetch('/api/auth/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const data = (await res.json()) as {
    ok?: boolean;
    token?: string;
    error?: string;
    otpauthUri?: string;
  };
  if (res.ok && data.ok && data.token) {
    setStoredOwnerToken(data.token);
    return { ok: true, otpauthUri: data.otpauthUri };
  }
  return {
    ok: false,
    error: data.error || 'Invalid or expired 2FA code. Please try again.'
  };
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
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string;
    recipientEmail?: string;
    deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
    deliveryNote?: string;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Could not send message. Please try again.');
  }
  return {
    ok: true,
    id: data.id || '',
    recipientEmail: data.recipientEmail || payload.recipientEmail || '',
    deliveryStatus: data.deliveryStatus || 'stored_only',
    deliveryNote: data.deliveryNote || ''
  };
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
