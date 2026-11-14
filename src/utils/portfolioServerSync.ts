import { PortfolioProfile, PortfolioState } from '../types/portfolio';
import { PUBLISHED_PORTFOLIO_SNAPSHOT } from '../data/publishedPortfolio';

let memoryOwnerToken: string | null = null;
let knownExpressAvailable: boolean | null = null;

export interface ServerAuthStatus {
  isAuthenticated: boolean;
  isPaired: boolean;
  canShowInitialSetupQr: boolean;
  hasRecoveryKey?: boolean;
  ownerEmailMasked?: string;
  otpauthUri?: string;
  githubConfigured?: boolean;
  serverAvailable?: boolean;
}

export interface GitHubSyncStatus {
  githubConfigured: boolean;
  canPullFromGitHub?: boolean;
  hasToken: boolean;
  hasOwner: boolean;
  hasRepo: boolean;
  owner: string;
  repo: string;
  branch: string;
  adminPinConfigured: boolean;
  isAuthenticated: boolean;
  runtime?: 'express' | 'vercel' | 'node';
  tokenSource?: 'env' | 'preview-file' | 'none';
}

export interface ServerPortfolioResponse {
  initialized: boolean;
  version?: number;
  updatedAt?: string;
  activePortfolioId?: string;
  portfolios?: PortfolioProfile[];
  fromStaticSnapshot?: boolean;
  fromGitHub?: boolean;
  sha?: string;
  githubCommit?: {
    commitSha: string;
    commitUrl: string;
    branch: string;
  };
}

export interface GitHubCommitResponse {
  ok: boolean;
  committed?: boolean;
  savedLocally?: boolean;
  githubConfigured?: boolean;
  hasToken?: boolean;
  hasOwner?: boolean;
  hasRepo?: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
  commitSha?: string;
  commitUrl?: string;
  contentSha?: string;
  data?: {
    initialized: boolean;
    version: number;
    updatedAt: string;
    activePortfolioId: string;
    portfolios: PortfolioProfile[];
  };
  error?: string;
}

export interface UploadedAssetResponse {
  ok: boolean;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export function getStoredOwnerToken(): string | null {
  return memoryOwnerToken;
}

export function setStoredOwnerToken(token: string | null): void {
  memoryOwnerToken = token || null;
}

function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredOwnerToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function fetchGitHubSyncStatus(): Promise<GitHubSyncStatus> {
  try {
    const res = await fetch(`/api/update-portfolio?action=status&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: buildAuthHeaders({
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = (await res.json()) as Partial<GitHubSyncStatus>;
      if (json.runtime === 'express') {
        knownExpressAvailable = true;
      } else if (json.runtime === 'vercel') {
        knownExpressAvailable = false;
      }
      return {
        githubConfigured: Boolean(json.githubConfigured),
        canPullFromGitHub: Boolean(json.canPullFromGitHub ?? (json.hasOwner && json.hasRepo)),
        hasToken: Boolean(json.hasToken),
        hasOwner: Boolean(json.hasOwner),
        hasRepo: Boolean(json.hasRepo),
        owner: json.owner || '',
        repo: json.repo || '',
        branch: json.branch || 'main',
        adminPinConfigured: Boolean(json.adminPinConfigured),
        isAuthenticated: Boolean(json.isAuthenticated),
        runtime: json.runtime,
        tokenSource: json.tokenSource || (json.hasToken ? 'env' : 'none')
      };
    }
  } catch {}

  return {
    githubConfigured: false,
    canPullFromGitHub: false,
    hasToken: false,
    hasOwner: false,
    hasRepo: false,
    owner: '',
    repo: '',
    branch: 'main',
    adminPinConfigured: false,
    isAuthenticated: false,
    tokenSource: 'none'
  };
}

export async function savePreviewGitHubToken(payload: {
  token: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): Promise<{ ok: boolean; status?: GitHubSyncStatus; error?: string }> {
  try {
    const res = await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        action: 'set-preview-token',
        token: payload.token,
        owner: payload.owner,
        repo: payload.repo,
        branch: payload.branch
      })
    });
    const json = (await res.json().catch(() => ({}))) as Partial<GitHubSyncStatus> & {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: json.error || `Failed to save preview token (HTTP ${res.status}).`
      };
    }
    return {
      ok: true,
      status: {
        githubConfigured: Boolean(json.githubConfigured),
        canPullFromGitHub: Boolean(json.canPullFromGitHub ?? true),
        hasToken: Boolean(json.hasToken),
        hasOwner: Boolean(json.hasOwner),
        hasRepo: Boolean(json.hasRepo),
        owner: json.owner || '',
        repo: json.repo || '',
        branch: json.branch || 'main',
        adminPinConfigured: Boolean(json.adminPinConfigured),
        isAuthenticated: Boolean(json.isAuthenticated),
        runtime: json.runtime,
        tokenSource: json.tokenSource || 'preview-file'
      }
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error connecting preview GitHub token.'
    };
  }
}

export async function clearPreviewGitHubToken(): Promise<GitHubSyncStatus> {
  try {
    await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'clear-preview-token' })
    });
  } catch {}
  return fetchGitHubSyncStatus();
}

export async function verifyOwnerTwoFactorWithServer(
  pin: string,
  code: string
): Promise<{
  ok: boolean;
  error?: string;
  status?: GitHubSyncStatus;
}> {
  try {
    const res = await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-owner-2fa', pin, code })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: 'Server verification endpoint (/api/update-portfolio) returned a non-JSON response.'
      };
    }
    const data = (await res.json().catch(() => ({}))) as Partial<GitHubSyncStatus> & {
      ok?: boolean;
      token?: string;
      error?: string;
    };
    if (res.ok && data.ok) {
      if (data.token) {
        setStoredOwnerToken(data.token);
      }
      return {
        ok: true,
        status: {
          githubConfigured: Boolean(data.githubConfigured),
          canPullFromGitHub: Boolean(data.canPullFromGitHub ?? (data.hasOwner && data.hasRepo)),
          hasToken: Boolean(data.hasToken),
          hasOwner: Boolean(data.hasOwner),
          hasRepo: Boolean(data.hasRepo),
          owner: data.owner || '',
          repo: data.repo || '',
          branch: data.branch || 'main',
          adminPinConfigured: Boolean(data.adminPinConfigured),
          isAuthenticated: true,
          runtime: data.runtime,
          tokenSource: data.tokenSource || (data.hasToken ? 'env' : 'none')
        }
      };
    }
    return {
      ok: false,
      error: data.error || 'Admin PIN or 6-digit Authenticator verification failed.'
    };
  } catch {
    return {
      ok: false,
      error: 'Unable to reach /api/update-portfolio to verify Admin PIN & Authenticator code.'
    };
  }
}

export async function verifyAdminPinWithServer(
  pin: string,
  code = ''
): Promise<{
  ok: boolean;
  error?: string;
  status?: GitHubSyncStatus;
}> {
  return verifyOwnerTwoFactorWithServer(pin, code);
}

export async function revealSetupQrWithAdminPin(pin: string): Promise<{
  ok: boolean;
  otpauthUri?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal-setup-qr', pin })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: 'Server QR pairing endpoint (/api/update-portfolio) is unavailable.'
      };
    }
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      otpauthUri?: string;
      error?: string;
    };
    if (res.ok && data.ok && data.otpauthUri) {
      return { ok: true, otpauthUri: data.otpauthUri };
    }
    return {
      ok: false,
      error: data.error || 'Enter your valid Admin PIN first to show the Authenticator QR.'
    };
  } catch {
    return {
      ok: false,
      error: 'Unable to reach /api/update-portfolio right now.'
    };
  }
}

export async function pullLatestFromGitHub(forcePull = false): Promise<{
  ok: boolean;
  source?: string;
  sha?: string;
  htmlUrl?: string;
  warning?: string;
  status: GitHubSyncStatus;
  data?: ServerPortfolioResponse;
  error?: string;
}> {
  try {
    const cacheBust = `_t=${Date.now()}`;
    const endpoint = forcePull
      ? `/api/update-portfolio?forcePull=1&${cacheBust}`
      : `/api/update-portfolio?${cacheBust}`;
    const res = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: buildAuthHeaders({
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: await fetchGitHubSyncStatus(),
        error: 'GitHub sync API endpoint is unavailable.'
      };
    }
    const json = (await res.json().catch(() => ({}))) as Partial<GitHubSyncStatus> & {
      ok?: boolean;
      source?: string;
      sha?: string;
      htmlUrl?: string;
      warning?: string;
      error?: string;
      data?: {
        initialized: boolean;
        version: number;
        updatedAt: string;
        activePortfolioId: string;
        portfolios: PortfolioProfile[];
      } | null;
    };

    const status: GitHubSyncStatus = {
      githubConfigured: Boolean(json.githubConfigured),
      canPullFromGitHub: Boolean(json.canPullFromGitHub ?? (json.hasOwner && json.hasRepo)),
      hasToken: Boolean(json.hasToken),
      hasOwner: Boolean(json.hasOwner),
      hasRepo: Boolean(json.hasRepo),
      owner: json.owner || '',
      repo: json.repo || '',
      branch: json.branch || 'main',
      adminPinConfigured: Boolean(json.adminPinConfigured),
      isAuthenticated: Boolean(json.isAuthenticated),
      runtime: json.runtime,
      tokenSource: json.tokenSource || (json.hasToken ? 'env' : 'none')
    };

    if (!res.ok || !json.ok) {
      return {
        ok: false,
        status,
        error: json.error || `Failed to pull latest data.json from GitHub (${res.status}).`
      };
    }

    if (json.data && Array.isArray(json.data.portfolios) && json.data.portfolios.length > 0) {
      return {
        ok: true,
        source: json.source,
        sha: json.sha,
        htmlUrl: json.htmlUrl,
        warning: json.warning,
        status,
        data: {
          initialized: true,
          version: json.data.version,
          updatedAt: json.data.updatedAt,
          activePortfolioId: json.data.activePortfolioId || 'default_portfolio',
          portfolios: json.data.portfolios,
          fromGitHub: json.source === 'github',
          ...(json.sha ? { sha: json.sha } : {})
        }
      };
    }

    return {
      ok: false,
      status,
      warning: json.warning,
      error: json.warning || 'No data.json portfolio payload returned from server.'
    };
  } catch (err) {
    return {
      ok: false,
      status: await fetchGitHubSyncStatus(),
      error: err instanceof Error ? err.message : 'Network error pulling from GitHub.'
    };
  }
}

export async function commitPortfolioToGitHub(payload: {
  activePortfolioId: string;
  portfolios: PortfolioProfile[];
  commitMessage?: string;
}): Promise<GitHubCommitResponse> {
  let res: Response;
  try {
    res = await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        commitMessage: payload.commitMessage,
        data: {
          initialized: true,
          updatedAt: new Date().toISOString(),
          activePortfolioId: payload.activePortfolioId,
          portfolios: payload.portfolios
        }
      })
    });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Could not reach /api/update-portfolio. Make sure your payload size is under 4.5 MB and the server is running.'
    );
  }

  if (res.status === 413) {
    throw new Error(
      'Update payload exceeds Vercel serverless 4.5 MB limit. Use smaller compressed media or an external PDF/video URL.'
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Serverless API /api/update-portfolio returned non-JSON response.');
  }

  const json = (await res.json().catch(() => ({}))) as GitHubCommitResponse;
  if (res.status === 401) {
    throw new Error('OWNER_AUTH_REQUIRED');
  }
  return {
    ...json,
    ok: Boolean(res.ok && json.ok)
  };
}

let memoryRecoveryChallengeToken: string | null = null;

export async function fetchServerAuthStatus(): Promise<ServerAuthStatus> {
  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch(`/api/auth/status?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: buildAuthHeaders({
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache'
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        knownExpressAvailable = true;
        const json = (await res.json()) as ServerAuthStatus;
        return {
          ...json,
          serverAvailable: true
        };
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch {}
  }

  // Vercel serverless deployment path: inspect pairing & auto-QR status via /api/update-portfolio
  try {
    const res = await fetch(`/api/update-portfolio?action=status&_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: buildAuthHeaders({
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache'
      })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = (await res.json()) as Partial<ServerAuthStatus> & Partial<GitHubSyncStatus>;
      return {
        isAuthenticated: Boolean(json.isAuthenticated),
        isPaired: Boolean(json.isPaired),
        canShowInitialSetupQr: Boolean(
          json.canShowInitialSetupQr ?? (!json.isPaired && Boolean(json.otpauthUri))
        ),
        hasRecoveryKey: Boolean(json.hasRecoveryKey),
        ownerEmailMasked: json.ownerEmailMasked,
        otpauthUri: json.otpauthUri,
        githubConfigured: Boolean(json.githubConfigured),
        serverAvailable: false
      };
    }
  } catch {}

  const ghStatus = await fetchGitHubSyncStatus();
  return {
    isAuthenticated: ghStatus.isAuthenticated,
    isPaired: true,
    canShowInitialSetupQr: false,
    githubConfigured: ghStatus.githubConfigured,
    serverAvailable: false
  };
}

export async function verifyOwnerTotpWithServer(
  code: string,
  pin = ''
): Promise<{ ok: boolean; error?: string; localOnly?: boolean }> {
  const result = await verifyOwnerTwoFactorWithServer(pin, code);
  return { ok: result.ok, error: result.error };
}

export async function requestOwnerRecoveryEmail(): Promise<{
  ok: boolean;
  maskedEmail?: string;
  deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
  deliveryNote?: string;
  error?: string;
}> {
  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch('/api/auth/recovery/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          maskedEmail?: string;
          deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
          deliveryNote?: string;
          error?: string;
        };
        if (res.ok && data.ok) {
          knownExpressAvailable = true;
          return {
            ok: true,
            maskedEmail: data.maskedEmail,
            deliveryStatus: data.deliveryStatus,
            deliveryNote: data.deliveryNote
          };
        }
        if (res.status !== 404) {
          return {
            ok: false,
            error: data.error || 'Could not send recovery code right now.'
          };
        }
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch {}
  }

  const fallbackRes = await fetch('/api/update-portfolio', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'recovery-request' })
  });
  const contentType = fallbackRes.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      error: 'Recovery email service is unavailable right now.'
    };
  }
  const data = (await fallbackRes.json().catch(() => ({}))) as {
    ok?: boolean;
    maskedEmail?: string;
    deliveryStatus?: 'sent' | 'activation_pending' | 'stored_only';
    deliveryNote?: string;
    challengeToken?: string;
    error?: string;
  };
  if (!fallbackRes.ok || !data.ok) {
    return {
      ok: false,
      error: data.error || 'Could not send recovery code right now.'
    };
  }
  memoryRecoveryChallengeToken = data.challengeToken || null;
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
  relinkDevice?: boolean;
}): Promise<{ ok: boolean; error?: string; recoveredVia?: string; otpauthUri?: string }> {
  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch('/api/auth/recovery/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          token?: string;
          error?: string;
          recoveredVia?: string;
          otpauthUri?: string;
        };
        if (res.ok && data.ok && data.token) {
          knownExpressAvailable = true;
          setStoredOwnerToken(data.token);
          return {
            ok: true,
            recoveredVia: data.recoveredVia,
            otpauthUri: data.otpauthUri
          };
        }
        if (res.status !== 404) {
          return {
            ok: false,
            error: data.error || 'Recovery verification failed.'
          };
        }
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch {}
  }

  const fallbackRes = await fetch('/api/update-portfolio', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'recovery-verify',
      ...payload,
      ...(memoryRecoveryChallengeToken ? { challengeToken: memoryRecoveryChallengeToken } : {})
    })
  });
  const contentType = fallbackRes.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      error: 'Recovery verification endpoint is unavailable here.'
    };
  }
  const data = (await fallbackRes.json().catch(() => ({}))) as {
    ok?: boolean;
    token?: string;
    error?: string;
    recoveredVia?: string;
    otpauthUri?: string;
  };
  if (fallbackRes.ok && data.ok && data.token) {
    memoryRecoveryChallengeToken = null;
    setStoredOwnerToken(data.token);
    return {
      ok: true,
      recoveredVia: data.recoveredVia,
      otpauthUri: data.otpauthUri
    };
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
  if (knownExpressAvailable !== false) {
    const res = await fetch('/api/auth/relink', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ rotateSecret })
    });
    if (res.ok) {
      return (await res.json()) as { otpauthUri: string; rotated: boolean };
    }
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    if (res.status !== 404) throw new Error('Failed to generate device link QR');
  }

  const fallbackRes = await fetch('/api/update-portfolio', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'relink-qr' })
  });
  if (!fallbackRes.ok) {
    if (fallbackRes.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to generate device link QR');
  }
  return (await fallbackRes.json()) as { otpauthUri: string; rotated: boolean };
}

export async function unpairAuthenticatorDevice(): Promise<{
  ok: boolean;
  isPaired: boolean;
  otpauthUri: string;
}> {
  if (knownExpressAvailable !== false) {
    const res = await fetch('/api/auth/unpair', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' })
    });
    if (res.ok) {
      return (await res.json()) as { ok: boolean; isPaired: boolean; otpauthUri: string };
    }
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    if (res.status !== 404) throw new Error('Failed to disconnect device pairing');
  }

  const fallbackRes = await fetch('/api/update-portfolio', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'unpair-2fa' })
  });
  if (!fallbackRes.ok) {
    if (fallbackRes.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    throw new Error('Failed to disconnect device pairing');
  }
  return (await fallbackRes.json()) as { ok: boolean; isPaired: boolean; otpauthUri: string };
}

export async function logoutOwnerServer(): Promise<void> {
  setStoredOwnerToken(null);
  const requests: Promise<unknown>[] = [
    fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    })
  ];
  if (knownExpressAvailable !== false) {
    requests.push(
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    );
  }
  await Promise.allSettled(requests);
}

export async function fetchServerPortfolio(): Promise<ServerPortfolioResponse> {
  // 1. Check live /api/update-portfolio (reads live data.json straight from GitHub on Vercel when configured)
  try {
    const ghRes = await pullLatestFromGitHub();
    if (ghRes.ok && ghRes.source === 'github' && ghRes.data?.portfolios?.length) {
      return ghRes.data;
    }
  } catch {}

  // 2. Check Express /api/portfolio (Preview server with uploaded asset storage)
  let apiRespondedJson = false;
  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch('/api/portfolio', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include'
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        knownExpressAvailable = true;
        apiRespondedJson = true;
        const data = (await res.json()) as ServerPortfolioResponse;
        if (data?.initialized && Array.isArray(data.portfolios) && data.portfolios.length > 0) {
          return data;
        }
      } else if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch {}
  }

  // 3. Fallback to bundled root data.json snapshot
  if (
    PUBLISHED_PORTFOLIO_SNAPSHOT.initialized &&
    Array.isArray(PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios) &&
    PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios.length > 0
  ) {
    return {
      initialized: true,
      version: PUBLISHED_PORTFOLIO_SNAPSHOT.version,
      updatedAt: PUBLISHED_PORTFOLIO_SNAPSHOT.updatedAt,
      activePortfolioId: PUBLISHED_PORTFOLIO_SNAPSHOT.activePortfolioId || 'default_portfolio',
      portfolios: PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios,
      fromStaticSnapshot: true
    };
  }

  if (apiRespondedJson) {
    return { initialized: false };
  }

  throw new Error('Failed to load portfolio from server or data.json');
}

export async function saveServerPortfolio(payload: {
  activePortfolioId: string;
  portfolios: PortfolioProfile[];
  commitMessage?: string;
}): Promise<ServerPortfolioResponse> {
  // 1. Try Express /api/portfolio first only when Express runtime is active
  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        credentials: 'include',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json().catch(() => ({}))) as ServerPortfolioResponse & {
          error?: string;
        };
        if (res.ok) {
          knownExpressAvailable = true;
          return data;
        }
        if (res.status === 401) {
          throw new Error('OWNER_AUTH_REQUIRED');
        }
        if (res.status !== 404 && res.status !== 405) {
          throw new Error(data.error || `Failed to save portfolio (${res.status})`);
        }
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED') {
        throw err;
      }
    }
  }

  // 2. Deployed Serverless path (Vercel): automatically commit data.json directly to GitHub
  const commitRes = await commitPortfolioToGitHub(payload);
  if (commitRes.ok && commitRes.data) {
    return {
      initialized: true,
      version: commitRes.data.version,
      updatedAt: commitRes.data.updatedAt,
      activePortfolioId: commitRes.data.activePortfolioId,
      portfolios: commitRes.data.portfolios,
      fromGitHub: true,
      ...(commitRes.commitSha
        ? {
            githubCommit: {
              commitSha: commitRes.commitSha,
              commitUrl: commitRes.commitUrl || '',
              branch: commitRes.branch || 'main'
            }
          }
        : {})
    };
  }

  throw new Error(
    commitRes.error || 'Could not commit data.json to GitHub. Check Vercel environment variables.'
  );
}

export async function resetServerPortfolio(defaultState: PortfolioState): Promise<void> {
  const res = await fetch('/api/portfolio/reset', {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ defaultState })
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return;
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error('OWNER_AUTH_REQUIRED');
    if (res.status === 404 || res.status === 405) return;
    throw new Error(`Failed to reset server portfolio (${res.status})`);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadAssetToServer(
  fileOrBlob: Blob,
  filename: string,
  mimeType?: string
): Promise<UploadedAssetResponse> {
  const resolvedMime = mimeType || fileOrBlob.type || 'application/octet-stream';

  if (knownExpressAvailable !== false) {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders({
          'Content-Type': resolvedMime,
          'X-Filename': encodeURIComponent(filename)
        }),
        body: fileOrBlob
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json().catch(() => ({}))) as Partial<UploadedAssetResponse> & {
          error?: string;
        };
        if (res.ok && data.url) {
          knownExpressAvailable = true;
          return data as UploadedAssetResponse;
        }
        if (res.status === 401) {
          throw new Error('OWNER_AUTH_REQUIRED');
        }
        if (res.status !== 404 && res.status !== 405) {
          throw new Error(data.error || `Asset upload failed (${res.status})`);
        }
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === 'OWNER_AUTH_REQUIRED' || err.message.startsWith('Asset upload failed'))
      ) {
        throw err;
      }
    }
  }

  // Vercel Serverless path: commit asset directly to public/uploaded-assets/<fileId> on GitHub
  // so data.json stays compact and /api/assets/<fileId> resolves immediately across reloads.
  const MAX_SERVERLESS_UPLOAD_BYTES = Math.floor(3.1 * 1024 * 1024);
  if (fileOrBlob.size > MAX_SERVERLESS_UPLOAD_BYTES) {
    throw new Error(
      `File (${(fileOrBlob.size / (1024 * 1024)).toFixed(1)} MB) exceeds Vercel serverless upload limit (3.1 MB). Use a smaller compressed file or paste an external video/PDF link.`
    );
  }

  const dataUrl = await blobToDataUrl(fileOrBlob);
  const commaIdx = dataUrl.indexOf(',');
  const base64Content = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : '';

  if (base64Content) {
    const uploadRes = await fetch('/api/update-portfolio', {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        action: 'upload-asset',
        filename,
        mimeType: resolvedMime,
        base64Content
      })
    });

    if (uploadRes.status === 401) {
      throw new Error('OWNER_AUTH_REQUIRED');
    }

    const contentType = uploadRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const uploadedJson = (await uploadRes.json().catch(() => ({}))) as Partial<UploadedAssetResponse> & {
        ok?: boolean;
        error?: string;
      };
      if (uploadRes.ok && uploadedJson.ok && uploadedJson.url) {
        return {
          ok: true,
          url: uploadedJson.url,
          filename: uploadedJson.filename || filename,
          size: uploadedJson.size || fileOrBlob.size,
          mimeType: uploadedJson.mimeType || resolvedMime
        };
      }
      if (uploadRes.status >= 400 && fileOrBlob.size > 350 * 1024) {
        throw new Error(uploadedJson.error || `Asset upload failed (${uploadRes.status})`);
      }
    }
  }

  return {
    ok: true,
    url: dataUrl,
    filename,
    size: fileOrBlob.size,
    mimeType: resolvedMime
  };
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

  if (knownExpressAvailable !== false) {
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
        knownExpressAvailable = true;
        return {
          ok: true,
          id: data.id || '',
          recipientEmail: data.recipientEmail || recipientEmail,
          deliveryStatus: data.deliveryStatus || 'stored_only',
          deliveryNote: data.deliveryNote || ''
        };
      }

      if (isJson && data?.error && (res.status === 400 || res.status === 429)) {
        throw new Error(data.error);
      }
      if (res.status === 404) {
        knownExpressAvailable = false;
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
  }

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
  let hasConnected = false;
  let consecutiveFailures = 0;

  const connect = () => {
    if (closed) return;
    source = new EventSource('/api/portfolio/stream');

    source.addEventListener('connected', (evt) => {
      hasConnected = true;
      consecutiveFailures = 0;
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
      consecutiveFailures += 1;
      if (source) {
        source.close();
        source = null;
      }
      if (!hasConnected && consecutiveFailures >= 2) {
        return;
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
