/// <reference types="node" />
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const ADMIN_SESSION_COOKIE = 'adhavan_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface GitHubConfigStatus {
  githubConfigured: boolean;
  canPullFromGitHub: boolean;
  hasToken: boolean;
  hasOwner: boolean;
  hasRepo: boolean;
  owner: string;
  repo: string;
  branch: string;
  adminPinConfigured: boolean;
}

const DEFAULT_GITHUB_OWNER = 'Adhavanadhi7819';
const DEFAULT_GITHUB_REPO = 'Portfolio-Website';

function readServerEnv(): {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  adminPin: string;
} {
  return {
    token: (process.env.GITHUB_TOKEN || '').trim(),
    owner: (
      process.env.GITHUB_OWNER ||
      process.env.VERCEL_GIT_REPO_OWNER ||
      DEFAULT_GITHUB_OWNER
    ).trim(),
    repo: (
      process.env.GITHUB_REPO ||
      process.env.VERCEL_GIT_REPO_SLUG ||
      DEFAULT_GITHUB_REPO
    ).trim(),
    branch:
      (
        process.env.GITHUB_BRANCH ||
        process.env.VERCEL_GIT_COMMIT_REF ||
        'main'
      ).trim() || 'main',
    adminPin: (process.env.ADMIN_PIN || '906').trim() || '906'
  };
}

export function getGitHubConfigStatus(): GitHubConfigStatus {
  const env = readServerEnv();
  return {
    githubConfigured: Boolean(env.token && env.owner && env.repo),
    canPullFromGitHub: Boolean(env.owner && env.repo),
    hasToken: Boolean(env.token),
    hasOwner: Boolean(env.owner),
    hasRepo: Boolean(env.repo),
    owner: env.owner,
    repo: env.repo,
    branch: env.branch,
    adminPinConfigured: Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim())
  };
}

export interface CanonicalDataBundle {
  initialized: boolean;
  version: number;
  updatedAt: string;
  activePortfolioId: string;
  portfolios: unknown[];
}

export interface HandleUpdateOptions {
  isTrustedOwner?: boolean;
  runtime?: 'express' | 'vercel' | 'node';
  onLocalCommitted?: (bundle: CanonicalDataBundle) => void;
}

type NodeReq = IncomingMessage & {
  body?: unknown;
  query?: Record<string, unknown>;
  protocol?: string;
  secure?: boolean;
};

function getSigningSecret(): string {
  const env = readServerEnv();
  const raw =
    process.env.OWNER_SESSION_SECRET ||
    `${env.adminPin}:${env.owner}:${env.repo}:adhavan-github-cms-v1`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminPinValue(candidatePin: string): boolean {
  const { adminPin } = readServerEnv();
  const normalizedCandidate = (candidatePin || '').trim();
  if (!normalizedCandidate || !adminPin) return false;
  return timingSafeStringEqual(normalizedCandidate, adminPin);
}

export function createAdminSessionToken(): string {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      role: 'owner',
      method: 'pin',
      iat: now,
      exp: now + SESSION_TTL_MS
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(payloadB64)
      .digest();
    const actualSig = Buffer.from(sigB64, 'base64url');
    if (expectedSig.length !== actualSig.length) return false;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return payload.role === 'owner' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      try {
        result[k] = decodeURIComponent(v);
      } catch {
        result[k] = v;
      }
    }
  }
  return result;
}

function extractAdminTokenFromReq(req: NodeReq): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[ADMIN_SESSION_COOKIE];
}

function isRequestHttps(req: NodeReq): boolean {
  if (req.secure) return true;
  const fwdProto = String(req.headers['x-forwarded-proto'] || '');
  return fwdProto.toLowerCase().includes('https');
}

function setSessionCookie(req: NodeReq, res: ServerResponse, token: string): void {
  const secure = isRequestHttps(req);
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    secure ? 'SameSite=None' : 'SameSite=Lax',
    ...(secure ? ['Secure'] : [])
  ];
  const existing = res.getHeader('Set-Cookie');
  const nextCookie = parts.join('; ');
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, nextCookie]);
  } else if (typeof existing === 'string') {
    res.setHeader('Set-Cookie', [existing, nextCookie]);
  } else {
    res.setHeader('Set-Cookie', nextCookie);
  }
}

function clearSessionCookie(res: ServerResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  );
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(JSON.stringify(body));
}

async function readRequestJsonBody(req: NodeReq): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function resolveDataJsonPath(): string {
  return path.resolve(process.cwd(), 'data.json');
}

function readLocalDataJson(): CanonicalDataBundle | null {
  try {
    const filePath = resolveDataJsonPath();
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<CanonicalDataBundle>;
    if (parsed && Array.isArray(parsed.portfolios) && parsed.portfolios.length > 0) {
      return {
        initialized: true,
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        activePortfolioId: parsed.activePortfolioId || 'default_portfolio',
        portfolios: parsed.portfolios
      };
    }
  } catch (err) {
    console.warn('Could not read local data.json:', err);
  }
  return null;
}

function writeLocalDataJsonIfWritable(bundle: CanonicalDataBundle): boolean {
  try {
    const filePath = resolveDataJsonPath();
    fs.accessSync(path.dirname(filePath), fs.constants.W_OK);
    const tmp = path.join(
      path.dirname(filePath),
      `.data.json.tmp.${process.pid}.${crypto.randomBytes(4).toString('hex')}`
    );
    fs.writeFileSync(tmp, JSON.stringify(bundle, null, 2) + '\n', 'utf8');
    fs.renameSync(tmp, filePath);
    return true;
  } catch {
    return false;
  }
}

export function normalizeIncomingBundle(
  rawPayload: unknown,
  fallbackVersion = 0
): CanonicalDataBundle | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  const obj = rawPayload as Record<string, unknown>;
  const now = new Date().toISOString();

  // Case 1: Full bundle with portfolios[]
  if (Array.isArray(obj.portfolios) && obj.portfolios.length > 0) {
    const incomingVer = typeof obj.version === 'number' ? obj.version : fallbackVersion;
    const nextVersion = Math.max(incomingVer, fallbackVersion + 1);
    return {
      initialized: true,
      version: nextVersion,
      updatedAt: now,
      activePortfolioId:
        typeof obj.activePortfolioId === 'string' && obj.activePortfolioId.trim()
          ? obj.activePortfolioId.trim()
          : 'default_portfolio',
      portfolios: obj.portfolios
    };
  }

  // Case 2: Wrapped portfolioState object
  if (obj.portfolioState && typeof obj.portfolioState === 'object') {
    const activeId =
      typeof obj.activePortfolioId === 'string' && obj.activePortfolioId.trim()
        ? obj.activePortfolioId.trim()
        : 'default_portfolio';
    return {
      initialized: true,
      version: fallbackVersion + 1,
      updatedAt: now,
      activePortfolioId: activeId,
      portfolios: [
        {
          id: activeId,
          name: 'ADHAVAN — Game Designer | 3D Artist',
          subtitle: 'Unreal Engine gameplay, level layout, and 3D art',
          createdAt: now,
          updatedAt: now,
          state: obj.portfolioState
        }
      ]
    };
  }

  // Case 3: Direct PortfolioState object (contains designerInfo / projects)
  if (obj.designerInfo && Array.isArray(obj.projects)) {
    return {
      initialized: true,
      version: fallbackVersion + 1,
      updatedAt: now,
      activePortfolioId: 'default_portfolio',
      portfolios: [
        {
          id: 'default_portfolio',
          name: 'ADHAVAN — Game Designer | 3D Artist',
          subtitle: 'Unreal Engine gameplay, level layout, and 3D art',
          createdAt: now,
          updatedAt: now,
          state: obj
        }
      ]
    };
  }

  return null;
}

function buildGitHubHeaders(token?: string): Record<string, string> {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Adhavan-Portfolio-CMS/1.0'
  };
}

export function isRemoteNewerThanLocal(
  remote: CanonicalDataBundle,
  local: CanonicalDataBundle | null
): boolean {
  if (!local) return true;
  if (remote.version > local.version) return true;
  if (remote.version < local.version) return false;
  const remoteTime = Date.parse(remote.updatedAt || '');
  const localTime = Date.parse(local.updatedAt || '');
  if (!Number.isNaN(remoteTime) && !Number.isNaN(localTime)) {
    return remoteTime > localTime;
  }
  return false;
}

export async function fetchGitHubDataJson(): Promise<{
  exists: boolean;
  sha?: string;
  htmlUrl?: string;
  data?: CanonicalDataBundle;
}> {
  const { token, owner, repo, branch } = readServerEnv();
  if (!owner || !repo) {
    throw new Error('GitHub repository is not configured (missing GITHUB_OWNER or GITHUB_REPO).');
  }

  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/data.json?ref=${encodeURIComponent(branch)}`;

  const res = await fetch(contentsUrl, {
    method: 'GET',
    headers: buildGitHubHeaders(token),
    cache: 'no-store'
  });

  if (res.status === 404) {
    return { exists: false };
  }

  const json = (await res.json().catch(() => ({}))) as {
    sha?: string;
    content?: string;
    html_url?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message || `GitHub API returned HTTP ${res.status}`);
  }

  let rawContent = '';
  if (typeof json.content === 'string' && json.content.trim()) {
    rawContent = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf8');
  } else if (json.sha) {
    // Files larger than 1 MB omit inline content in /contents API; fetch via Git Blobs API
    const blobUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/git/blobs/${encodeURIComponent(json.sha)}`;
    const blobRes = await fetch(blobUrl, {
      method: 'GET',
      headers: buildGitHubHeaders(token),
      cache: 'no-store'
    });
    const blobJson = (await blobRes.json().catch(() => ({}))) as {
      content?: string;
      message?: string;
    };
    if (!blobRes.ok || !blobJson.content) {
      throw new Error(blobJson.message || 'Failed to read large data.json blob from GitHub.');
    }
    rawContent = Buffer.from(blobJson.content.replace(/\n/g, ''), 'base64').toString('utf8');
  }

  let parsed: CanonicalDataBundle | undefined;
  if (rawContent.trim()) {
    const rawObj = JSON.parse(rawContent) as Partial<CanonicalDataBundle>;
    if (rawObj && Array.isArray(rawObj.portfolios) && rawObj.portfolios.length > 0) {
      parsed = {
        initialized: true,
        version: typeof rawObj.version === 'number' ? rawObj.version : 1,
        updatedAt: rawObj.updatedAt || new Date().toISOString(),
        activePortfolioId: rawObj.activePortfolioId || 'default_portfolio',
        portfolios: rawObj.portfolios
      };
    }
  }

  return {
    exists: true,
    sha: json.sha,
    htmlUrl: json.html_url,
    data: parsed
  };
}

export async function commitGitHubDataJson(params: {
  bundle: CanonicalDataBundle;
  commitMessage?: string;
}): Promise<{
  commitSha: string;
  commitUrl: string;
  contentSha?: string;
  branch: string;
  repoFullName: string;
}> {
  const { token, owner, repo, branch } = readServerEnv();
  if (!token || !owner || !repo) {
    throw new Error('GitHub sync is not configured (missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO).');
  }

  const message =
    (params.commitMessage || '').trim() ||
    `chore(portfolio): update data.json (${new Date().toISOString()})`;

  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/data.json`;

  const jsonContent = JSON.stringify(params.bundle, null, 2) + '\n';
  const encodedContent = Buffer.from(jsonContent, 'utf8').toString('base64');

  const attemptPut = async (sha?: string) => {
    const res = await fetch(contentsUrl, {
      method: 'PUT',
      headers: {
        ...buildGitHubHeaders(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch,
        ...(sha ? { sha } : {})
      })
    });
    const payload = (await res.json().catch(() => ({}))) as {
      message?: string;
      commit?: { sha?: string; html_url?: string };
      content?: { sha?: string };
    };
    return { res, payload };
  };

  const currentRemote = await fetchGitHubDataJson();
  let { res, payload } = await attemptPut(currentRemote.sha);

  // Automatic 1-shot retry on SHA mismatch (409/422)
  if ((res.status === 409 || res.status === 422) && payload.message?.toLowerCase().includes('sha')) {
    const refreshed = await fetchGitHubDataJson();
    ({ res, payload } = await attemptPut(refreshed.sha));
  }

  if (!res.ok) {
    throw new Error(payload.message || `GitHub commit failed with HTTP ${res.status}`);
  }

  return {
    commitSha: payload.commit?.sha || '',
    commitUrl:
      payload.commit?.html_url ||
      `https://github.com/${owner}/${repo}/commit/${payload.commit?.sha || branch}`,
    contentSha: payload.content?.sha,
    branch,
    repoFullName: `${owner}/${repo}`
  };
}

function getQueryParam(req: NodeReq, key: string): string {
  if (req.query && req.query[key] !== undefined) {
    const val = req.query[key];
    if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : '';
    return typeof val === 'string' ? val : '';
  }
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    return url.searchParams.get(key) || '';
  } catch {
    return '';
  }
}

export async function handleUpdatePortfolioRequest(
  req: NodeReq,
  res: ServerResponse,
  options: HandleUpdateOptions = {}
): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  const status = getGitHubConfigStatus();
  const isCookieOrBearerValid = verifyAdminSessionToken(extractAdminTokenFromReq(req));
  const isAuthenticated = Boolean(options.isTrustedOwner || isCookieOrBearerValid);

  const runtimeMode = options.runtime || (process.env.VERCEL ? 'vercel' : 'node');

  if (method === 'GET') {
    const action = getQueryParam(req, 'action');
    if (action === 'status') {
      sendJson(res, 200, {
        ok: true,
        runtime: runtimeMode,
        ...status,
        isAuthenticated
      });
      return;
    }

    const forcePull = getQueryParam(req, 'forcePull') === '1';
    const local = readLocalDataJson();

    if (status.githubConfigured || status.canPullFromGitHub) {
      try {
        const remote = await fetchGitHubDataJson();
        if (remote.exists && remote.data) {
          const isVercel = runtimeMode === 'vercel';
          const remoteIsNewer = isRemoteNewerThanLocal(remote.data, local);

          // On Vercel, GitHub data.json is always canonical.
          // In AI Studio / Express, pull GitHub into local files when forcePull=1 OR when GitHub is newer than local.
          if (isVercel || forcePull || remoteIsNewer) {
            if (!isVercel && (forcePull || remoteIsNewer)) {
              const synced = writeLocalDataJsonIfWritable(remote.data);
              if (synced) {
                options.onLocalCommitted?.(remote.data);
              }
            }
            sendJson(res, 200, {
              ok: true,
              source: 'github',
              runtime: runtimeMode,
              ...status,
              isAuthenticated,
              sha: remote.sha,
              htmlUrl: remote.htmlUrl,
              data: remote.data
            });
            return;
          }
        }
      } catch (err) {
        if (local && !forcePull) {
          sendJson(res, 200, {
            ok: true,
            source: 'local',
            runtime: runtimeMode,
            ...status,
            isAuthenticated,
            warning: err instanceof Error ? err.message : 'GitHub fetch failed',
            data: local
          });
          return;
        }
        if (forcePull || !local) {
          sendJson(res, 502, {
            ok: false,
            runtime: runtimeMode,
            ...status,
            isAuthenticated,
            error: err instanceof Error ? err.message : 'Failed to pull data.json from GitHub.'
          });
          return;
        }
      }
    }

    if (local) {
      sendJson(res, 200, {
        ok: true,
        source: 'local',
        runtime: runtimeMode,
        ...status,
        isAuthenticated,
        data: local
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      source: 'uninitialized',
      ...status,
      isAuthenticated,
      data: null
    });
    return;
  }

  if (method !== 'POST' && method !== 'PUT') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readRequestJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON request body.' });
    return;
  }

  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'verify-pin') {
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!verifyAdminPinValue(pin)) {
      sendJson(res, 401, {
        ok: false,
        ...status,
        error: 'Incorrect Admin PIN. Check ADMIN_PIN and try again.'
      });
      return;
    }
    const token = createAdminSessionToken();
    setSessionCookie(req, res, token);
    sendJson(res, 200, {
      ok: true,
      token,
      runtime: runtimeMode,
      ...status,
      isAuthenticated: true
    });
    return;
  }

  if (action === 'logout') {
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true, isAuthenticated: false });
    return;
  }

  // Authorize update/commit request
  const headerPin = typeof req.headers['x-admin-pin'] === 'string' ? req.headers['x-admin-pin'] : '';
  const bodyPin = typeof body.pin === 'string' ? body.pin : '';
  const hasValidPinOverride =
    (headerPin && verifyAdminPinValue(headerPin)) || (bodyPin && verifyAdminPinValue(bodyPin));

  if (!isAuthenticated && !hasValidPinOverride) {
    sendJson(res, 401, {
      ok: false,
      ...status,
      error: 'Admin authorization required. Unlock Owner Edit Mode with your Admin PIN.'
    });
    return;
  }

  const rawData = body.data !== undefined ? body.data : body;
  const localExisting = readLocalDataJson();
  let baselineVersion = localExisting?.version ?? 0;

  if (status.githubConfigured) {
    try {
      const remoteExisting = await fetchGitHubDataJson();
      if (remoteExisting.data?.version && remoteExisting.data.version > baselineVersion) {
        baselineVersion = remoteExisting.data.version;
      }
    } catch {
      // Proceed using local baseline version; commitGitHubDataJson fetches SHA separately
    }
  }

  const nextBundle = normalizeIncomingBundle(rawData, baselineVersion);
  if (!nextBundle) {
    sendJson(res, 400, {
      ok: false,
      error: 'Invalid portfolio data payload. Expected portfolios array or portfolioState.'
    });
    return;
  }

  const commitMessage =
    typeof body.commitMessage === 'string' && body.commitMessage.trim()
      ? body.commitMessage.trim().slice(0, 240)
      : `chore(portfolio): update data.json (v${nextBundle.version})`;

  const wroteLocal = writeLocalDataJsonIfWritable(nextBundle);
  if (wroteLocal) {
    options.onLocalCommitted?.(nextBundle);
  }

  if (!status.githubConfigured) {
    sendJson(res, 400, {
      ok: false,
      committed: false,
      savedLocally: wroteLocal,
      ...status,
      data: nextBundle,
      error:
        'GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO is not configured on the server. Add them in Vercel Environment Variables to push edits directly to GitHub.'
    });
    return;
  }

  try {
    const commitResult = await commitGitHubDataJson({
      bundle: nextBundle,
      commitMessage
    });
    sendJson(res, 200, {
      ok: true,
      committed: true,
      savedLocally: wroteLocal,
      runtime: runtimeMode,
      ...status,
      commitSha: commitResult.commitSha,
      commitUrl: commitResult.commitUrl,
      contentSha: commitResult.contentSha,
      data: nextBundle
    });
  } catch (err) {
    sendJson(res, 502, {
      ok: false,
      committed: false,
      savedLocally: wroteLocal,
      ...status,
      error:
        err instanceof Error ? err.message : 'Failed to commit data.json update to GitHub.'
    });
  }
}

export default async function handler(req: NodeReq, res: ServerResponse): Promise<void> {
  return handleUpdatePortfolioRequest(req, res);
}
