/// <reference types="node" />
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const ADMIN_SESSION_COOKIE = 'adhavan_admin_session';
const TOTP_PAIRED_COOKIE = 'adhavan_totp_paired';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PAIRED_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

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
  tokenSource?: 'env' | 'preview-file' | 'none';
}

const DEFAULT_GITHUB_OWNER = 'Adhavanadhi7819';
const DEFAULT_GITHUB_REPO = 'Portfolio-Website';

interface LocalPreviewGitHubConfig {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}

function resolvePreviewGitHubConfigPath(): string {
  return path.resolve(process.cwd(), 'portfolio-data', '.github-token.json');
}

function readLocalPreviewGitHubConfig(): LocalPreviewGitHubConfig | null {
  try {
    const filePath = resolvePreviewGitHubConfigPath();
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalPreviewGitHubConfig;
    if (raw && typeof raw === 'object') return raw;
  } catch {}
  return null;
}

function writeLocalPreviewGitHubConfig(cfg: LocalPreviewGitHubConfig | null): boolean {
  try {
    const filePath = resolvePreviewGitHubConfigPath();
    if (!cfg) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return true;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600, encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

function readServerEnv(): {
  token: string;
  tokenSource: 'env' | 'preview-file' | 'none';
  owner: string;
  repo: string;
  branch: string;
  adminPin: string;
} {
  const envToken = (process.env.GITHUB_TOKEN || '').trim();
  const previewCfg = !envToken ? readLocalPreviewGitHubConfig() : null;
  const previewToken = (previewCfg?.token || '').trim();
  const token = envToken || previewToken;
  const tokenSource: 'env' | 'preview-file' | 'none' = envToken
    ? 'env'
    : previewToken
    ? 'preview-file'
    : 'none';

  return {
    token,
    tokenSource,
    owner: (
      process.env.GITHUB_OWNER ||
      process.env.VERCEL_GIT_REPO_OWNER ||
      previewCfg?.owner ||
      DEFAULT_GITHUB_OWNER
    ).trim(),
    repo: (
      process.env.GITHUB_REPO ||
      process.env.VERCEL_GIT_REPO_SLUG ||
      previewCfg?.repo ||
      DEFAULT_GITHUB_REPO
    ).trim(),
    branch:
      (
        process.env.GITHUB_BRANCH ||
        process.env.VERCEL_GIT_COMMIT_REF ||
        previewCfg?.branch ||
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
    adminPinConfigured: Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim()),
    tokenSource: env.tokenSource
  };
}

export interface CanonicalDataBundle {
  initialized: boolean;
  version: number;
  updatedAt: string;
  activePortfolioId: string;
  portfolios: unknown[];
}

export const OWNER_TOTP_DEFAULT_SECRET = 'NBSWY3DPFQQHO33SNRSCC43FMNZGK5A4';
export const OWNER_TOTP_ISSUER = 'ADHAVAN Portfolio';
export const OWNER_TOTP_ACCOUNT = 'adhavanprabhu906@gmail.com';

const TOTP_BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function resolveOwnerTotpSecret(overrideSecret?: string): string {
  const candidate =
    (typeof overrideSecret === 'string' && overrideSecret.trim()) ||
    (process.env.OWNER_TOTP_SECRET || '').trim() ||
    OWNER_TOTP_DEFAULT_SECRET;
  return candidate.toUpperCase().replace(/[^A-Z2-7]/g, '');
}

function totpBase32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = TOTP_BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function generateServerTotpCode(
  secret: string,
  timestampMs = Date.now(),
  stepOffset = 0
): string {
  const key = totpBase32ToBuffer(secret);
  const counter = Math.floor(timestampMs / 1000 / 30) + stepOffset;
  const counterBuf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, '0');
}

export function verifyServerTotpCode(
  secret: string,
  inputCode: string,
  timestampMs = Date.now()
): boolean {
  const normalized = (inputCode || '').replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(normalized)) return false;

  for (const offset of [0, -1, 1, -2, 2]) {
    const expected = generateServerTotpCode(secret, timestampMs, offset);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) {
      return true;
    }
  }
  return false;
}

export function buildServerOtpAuthUri(secret: string): string {
  const label = `${encodeURIComponent(OWNER_TOTP_ISSUER)}:${encodeURIComponent(OWNER_TOTP_ACCOUNT)}`;
  const cleanSecret = resolveOwnerTotpSecret(secret);
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encodeURIComponent(
    OWNER_TOTP_ISSUER
  )}&algorithm=SHA1&digits=6&period=30`;
}

export interface HandleUpdateOptions {
  isTrustedOwner?: boolean;
  runtime?: 'express' | 'vercel' | 'node';
  onLocalCommitted?: (bundle: CanonicalDataBundle) => void;
  totpSecret?: string;
  isPaired?: boolean;
  onTwoFactorVerified?: () => void;
  onResetPairingRequested?: () => void;
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
      method: 'pin+totp',
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

function setCookieHeader(res: ServerResponse, nextCookie: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, nextCookie]);
  } else if (typeof existing === 'string') {
    res.setHeader('Set-Cookie', [existing, nextCookie]);
  } else {
    res.setHeader('Set-Cookie', nextCookie);
  }
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
  setCookieHeader(res, parts.join('; '));
}

function clearSessionCookie(res: ServerResponse): void {
  setCookieHeader(res, `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function createTotpPairedToken(): string {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      paired: true,
      iat: now,
      exp: now + PAIRED_TTL_MS
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`paired:${payload}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyTotpPairedToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(`paired:${payloadB64}`)
      .digest();
    const actualSig = Buffer.from(sigB64, 'base64url');
    if (expectedSig.length !== actualSig.length) return false;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      paired?: boolean;
      exp?: number;
    };
    return payload.paired === true && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function setTotpPairedCookie(req: NodeReq, res: ServerResponse): void {
  const secure = isRequestHttps(req);
  const maxAgeSec = Math.floor(PAIRED_TTL_MS / 1000);
  const token = createTotpPairedToken();
  const parts = [
    `${TOTP_PAIRED_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    secure ? 'SameSite=None' : 'SameSite=Lax',
    ...(secure ? ['Secure'] : [])
  ];
  setCookieHeader(res, parts.join('; '));
}

function clearTotpPairedCookie(res: ServerResponse): void {
  setCookieHeader(res, `${TOTP_PAIRED_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function readLocalAuthStoreMeta(): {
  paired: boolean;
  secret?: string;
  recoveryKeyHash?: string;
} {
  try {
    const authPath = path.resolve(process.cwd(), 'portfolio-data', 'auth.json');
    if (!fs.existsSync(authPath)) return { paired: false };
    const raw = JSON.parse(fs.readFileSync(authPath, 'utf8')) as {
      paired?: boolean;
      secret?: string;
      recoveryKeyHash?: string;
    };
    return {
      paired: Boolean(raw?.paired),
      ...(typeof raw?.secret === 'string' ? { secret: raw.secret } : {}),
      ...(typeof raw?.recoveryKeyHash === 'string' ? { recoveryKeyHash: raw.recoveryKeyHash } : {})
    };
  } catch {
    return { paired: false };
  }
}

function maskOwnerEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function createRecoveryChallengeToken(codeHash: string, expMs: number): string {
  const payload = Buffer.from(JSON.stringify({ codeHash, exp: expMs })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`recovery:${payload}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyRecoveryChallengeToken(token: string | undefined, emailCode: string): boolean {
  if (!token || !emailCode) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(`recovery:${payloadB64}`)
      .digest();
    const actualSig = Buffer.from(sigB64, 'base64url');
    if (expectedSig.length !== actualSig.length) return false;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      codeHash?: string;
      exp?: number;
    };
    if (!payload.codeHash || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return false;
    }
    const candidateHash = crypto.createHash('sha256').update(emailCode).digest('hex');
    return timingSafeStringEqual(candidateHash, payload.codeHash);
  } catch {
    return false;
  }
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

function buildGitHubNoCacheHeaders(token?: string): Record<string, string> {
  return {
    ...buildGitHubHeaders(token),
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache'
  };
}

const ASSET_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf',
  'application/octet-stream': '.bin'
};

const ASSET_EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream'
};

function resolveAssetExtension(mimeType: string, originalFilename?: string): string {
  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  if (ASSET_MIME_TO_EXT[cleanMime]) return ASSET_MIME_TO_EXT[cleanMime];
  if (originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    if (/^\.[a-z0-9]{1,8}$/.test(ext) && ext !== '.json') return ext;
  }
  return '.bin';
}

function writeLocalAssetIfWritable(fileId: string, buffer: Buffer): void {
  const dirs = [
    path.resolve(process.cwd(), 'portfolio-data', 'assets'),
    path.resolve(process.cwd(), 'public', 'uploaded-assets')
  ];
  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      const target = path.join(dir, fileId);
      if (!fs.existsSync(target)) {
        fs.writeFileSync(target, buffer);
      }
    } catch {}
  }
}

function readLocalAssetIfPresent(fileId: string): Buffer | null {
  const candidates = [
    path.resolve(process.cwd(), 'portfolio-data', 'assets', fileId),
    path.resolve(process.cwd(), 'public', 'uploaded-assets', fileId)
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return fs.readFileSync(p);
      }
    } catch {}
  }
  return null;
}

export async function commitGitHubAssetFile(params: {
  fileId: string;
  buffer: Buffer;
  commitMessage?: string;
}): Promise<{ uploaded: boolean; path: string }> {
  const { token, owner, repo, branch } = readServerEnv();
  const repoPath = `public/uploaded-assets/${params.fileId}`;
  if (!token || !owner || !repo) {
    throw new Error('GitHub sync is not configured (missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO).');
  }

  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/${repoPath}`;

  // Content-addressed by sha256 prefix: if already on branch, skip redundant commit
  const checkRes = await fetch(`${contentsUrl}?ref=${encodeURIComponent(branch)}&_t=${Date.now()}`, {
    method: 'GET',
    headers: buildGitHubNoCacheHeaders(token),
    cache: 'no-store'
  });
  if (checkRes.ok) {
    return { uploaded: false, path: repoPath };
  }

  const putRes = await fetch(contentsUrl, {
    method: 'PUT',
    headers: {
      ...buildGitHubHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: params.commitMessage || `chore(assets): upload ${params.fileId}`,
      content: params.buffer.toString('base64'),
      branch
    })
  });

  if (!putRes.ok && putRes.status !== 422) {
    const errPayload = (await putRes.json().catch(() => ({}))) as { message?: string };
    throw new Error(errPayload.message || `Failed to upload asset to GitHub (HTTP ${putRes.status})`);
  }

  return { uploaded: true, path: repoPath };
}

export function extractReferencedAssetIds(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const match = /^\/(?:api\/assets|uploaded-assets)\/([a-f0-9]{16,64}\.[a-z0-9]{1,8})$/i.exec(
      value.trim()
    );
    if (match) out.add(match[1]);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractReferencedAssetIds(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      extractReferencedAssetIds(v, out);
    }
  }
  return out;
}

export async function ensureGitHubAssetsSynced(value: unknown): Promise<void> {
  const { token, owner, repo } = readServerEnv();
  if (!token || !owner || !repo) return;
  const assetIds = extractReferencedAssetIds(value);
  for (const fileId of assetIds) {
    const localBuf = readLocalAssetIfPresent(fileId);
    if (!localBuf) continue;
    await commitGitHubAssetFile({ fileId, buffer: localBuf }).catch((err) => {
      console.warn(`Skipped uploading asset ${fileId} to GitHub:`, err);
    });
  }
}

async function fetchGitHubAssetBuffer(fileId: string): Promise<Buffer | null> {
  const local = readLocalAssetIfPresent(fileId);
  if (local) return local;

  const { token, owner, repo, branch } = readServerEnv();
  if (!owner || !repo) return null;

  const repoPath = `public/uploaded-assets/${fileId}`;
  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/${repoPath}?ref=${encodeURIComponent(branch)}&_t=${Date.now()}`;

  try {
    const res = await fetch(contentsUrl, {
      method: 'GET',
      headers: buildGitHubNoCacheHeaders(token),
      cache: 'no-store'
    });
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as { sha?: string; content?: string };
      if (typeof json.content === 'string' && json.content.trim()) {
        return Buffer.from(json.content.replace(/\n/g, ''), 'base64');
      }
      if (json.sha) {
        const blobUrl = `https://api.github.com/repos/${encodeURIComponent(
          owner
        )}/${encodeURIComponent(repo)}/git/blobs/${encodeURIComponent(json.sha)}?_t=${Date.now()}`;
        const blobRes = await fetch(blobUrl, {
          method: 'GET',
          headers: buildGitHubNoCacheHeaders(token),
          cache: 'no-store'
        });
        if (blobRes.ok) {
          const blobJson = (await blobRes.json().catch(() => ({}))) as { content?: string };
          if (blobJson.content) {
            return Buffer.from(blobJson.content.replace(/\n/g, ''), 'base64');
          }
        }
      }
    }
  } catch {}

  try {
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${repoPath}?_t=${Date.now()}`;
    const rawRes = await fetch(rawUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache, no-store' },
      cache: 'no-store'
    });
    if (rawRes.ok) {
      return Buffer.from(await rawRes.arrayBuffer());
    }
  } catch {}

  return null;
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

  const cacheBust = Date.now();
  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/data.json?ref=${encodeURIComponent(branch)}&_t=${cacheBust}`;

  const res = await fetch(contentsUrl, {
    method: 'GET',
    headers: buildGitHubNoCacheHeaders(token),
    cache: 'no-store'
  });

  if (res.status === 404) {
    return { exists: false };
  }

  // If unauthenticated GitHub API hits rate limit (403/429), read directly from raw.githubusercontent.com
  if ((res.status === 403 || res.status === 429) && !token) {
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/data.json?_t=${cacheBust}`;
    const rawRes = await fetch(rawUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' },
      cache: 'no-store'
    });
    if (rawRes.status === 404) {
      return { exists: false };
    }
    if (rawRes.ok) {
      const rawText = await rawRes.text();
      const rawObj = JSON.parse(rawText) as Partial<CanonicalDataBundle>;
      if (rawObj && Array.isArray(rawObj.portfolios) && rawObj.portfolios.length > 0) {
        return {
          exists: true,
          htmlUrl: `https://github.com/${owner}/${repo}/blob/${branch}/data.json`,
          data: {
            initialized: true,
            version: typeof rawObj.version === 'number' ? rawObj.version : 1,
            updatedAt: rawObj.updatedAt || new Date().toISOString(),
            activePortfolioId: rawObj.activePortfolioId || 'default_portfolio',
            portfolios: rawObj.portfolios
          }
        };
      }
    }
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
    )}/git/blobs/${encodeURIComponent(json.sha)}?_t=${cacheBust}`;
    const blobRes = await fetch(blobUrl, {
      method: 'GET',
      headers: buildGitHubNoCacheHeaders(token),
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
    if (action === 'asset') {
      const fileId = getQueryParam(req, 'file');
      if (!/^[a-f0-9]{16,64}\.[a-z0-9]{1,8}$/i.test(fileId) || fileId.endsWith('.json')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const assetBuffer = await fetchGitHubAssetBuffer(fileId);
      if (!assetBuffer) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const ext = path.extname(fileId).toLowerCase();
      const mimeType = ASSET_EXT_TO_MIME[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileId}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(assetBuffer);
      return;
    }

    if (action === 'status') {
      const cookies = parseCookies(req.headers.cookie);
      const hasPairedCookie = verifyTotpPairedToken(cookies[TOTP_PAIRED_COOKIE]);
      const authMeta = readLocalAuthStoreMeta();
      const effectivePaired =
        typeof options.isPaired === 'boolean'
          ? options.isPaired
          : Boolean(hasPairedCookie || authMeta.paired);
      const canShowInitialSetupQr = !effectivePaired;
      const activeSecret = resolveOwnerTotpSecret(options.totpSecret || authMeta.secret);
      sendJson(res, 200, {
        ok: true,
        runtime: runtimeMode,
        ...status,
        isPaired: effectivePaired,
        canShowInitialSetupQr,
        hasRecoveryKey: Boolean(authMeta.recoveryKeyHash || process.env.OWNER_RECOVERY_KEY),
        ownerEmailMasked: maskOwnerEmail(OWNER_TOTP_ACCOUNT),
        isAuthenticated,
        ...(canShowInitialSetupQr ? { otpauthUri: buildServerOtpAuthUri(activeSecret) } : {})
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

  const activeTotpSecret = resolveOwnerTotpSecret(
    options.totpSecret || readLocalAuthStoreMeta().secret
  );

  if (action === 'reveal-setup-qr') {
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!verifyAdminPinValue(pin)) {
      sendJson(res, 401, {
        ok: false,
        ...status,
        error: 'Enter your valid Admin PIN first to display the Authenticator connect QR.'
      });
      return;
    }
    options.onResetPairingRequested?.();
    sendJson(res, 200, {
      ok: true,
      runtime: runtimeMode,
      isPaired: false,
      otpauthUri: buildServerOtpAuthUri(activeTotpSecret)
    });
    return;
  }

  if (action === 'verify-pin' || action === 'verify-owner-2fa') {
    const pin = typeof body.pin === 'string' ? body.pin : '';
    const code =
      typeof body.code === 'string'
        ? body.code
        : typeof body.totpCode === 'string'
        ? body.totpCode
        : '';

    if (!verifyAdminPinValue(pin)) {
      sendJson(res, 401, {
        ok: false,
        ...status,
        error: 'Incorrect Admin PIN. Check ADMIN_PIN and try again.'
      });
      return;
    }

    const cleanedCode = code.replace(/\D/g, '');
    if (cleanedCode.length !== 6 || !verifyServerTotpCode(activeTotpSecret, cleanedCode)) {
      sendJson(res, 401, {
        ok: false,
        ...status,
        error:
          cleanedCode.length !== 6
            ? 'Enter the 6-digit code from your Authenticator app in addition to Admin PIN.'
            : 'Invalid or expired 6-digit Authenticator code. Check your app and try again.'
      });
      return;
    }

    options.onTwoFactorVerified?.();
    const token = createAdminSessionToken();
    setSessionCookie(req, res, token);
    setTotpPairedCookie(req, res);
    sendJson(res, 200, {
      ok: true,
      token,
      runtime: runtimeMode,
      ...status,
      isPaired: true,
      isAuthenticated: true
    });
    return;
  }

  if (action === 'recovery-request') {
    const recoveryCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(recoveryCode).digest('hex');
    const challengeToken = createRecoveryChallengeToken(codeHash, Date.now() + 10 * 60 * 1000);
    const originUrl = `https://${String(req.headers['x-forwarded-host'] || req.headers.host || 'hey-adhavan.vercel.app')}`;

    let deliveryStatus: 'sent' | 'activation_pending' | 'stored_only' = 'stored_only';
    let deliveryNote = `Recovery code requested for ${maskOwnerEmail(OWNER_TOTP_ACCOUNT)}.`;

    try {
      const relayRes = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(OWNER_TOTP_ACCOUNT)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: originUrl,
            Origin: originUrl
          },
          body: JSON.stringify({
            name: 'Portfolio 2FA Recovery',
            email: OWNER_TOTP_ACCOUNT,
            _replyto: OWNER_TOTP_ACCOUNT,
            _subject: 'Owner Mode Recovery Code',
            message: `Your one-time Owner Mode recovery code is: ${recoveryCode}\n\nThis code expires in 10 minutes.`,
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
        deliveryStatus = 'sent';
        deliveryNote = `6-digit recovery code sent to ${maskOwnerEmail(OWNER_TOTP_ACCOUNT)}.`;
      } else if (String(relayData.message || '').toLowerCase().includes('activat')) {
        deliveryStatus = 'activation_pending';
        deliveryNote = `Activation email sent to ${maskOwnerEmail(OWNER_TOTP_ACCOUNT)}. Activate FormSubmit in your inbox once to receive recovery emails.`;
      }
    } catch {}

    sendJson(res, 200, {
      ok: true,
      maskedEmail: maskOwnerEmail(OWNER_TOTP_ACCOUNT),
      deliveryStatus,
      deliveryNote,
      challengeToken
    });
    return;
  }

  if (action === 'recovery-verify') {
    const emailCode =
      typeof body.emailCode === 'string' ? body.emailCode.replace(/\s+/g, '').trim() : '';
    const recoveryKey =
      typeof body.recoveryKey === 'string' ? body.recoveryKey.trim().toUpperCase() : '';
    const challengeToken = typeof body.challengeToken === 'string' ? body.challengeToken : '';
    const relinkDevice = Boolean(body.relinkDevice);

    let recoveredVia: 'email' | 'recovery_key' | null = null;

    if (emailCode) {
      if (!verifyRecoveryChallengeToken(challengeToken, emailCode)) {
        sendJson(res, 401, {
          ok: false,
          error: 'Invalid or expired email recovery code. Request a fresh code and try again.'
        });
        return;
      }
      recoveredVia = 'email';
    } else if (recoveryKey) {
      const authMeta = readLocalAuthStoreMeta();
      const expectedHashHex =
        authMeta.recoveryKeyHash ||
        (process.env.OWNER_RECOVERY_KEY
          ? crypto
              .createHash('sha256')
              .update(process.env.OWNER_RECOVERY_KEY.trim().toUpperCase())
              .digest('hex')
          : '');
      if (!expectedHashHex) {
        sendJson(res, 400, {
          ok: false,
          error: 'No backup recovery key configured. Use Email Code instead.'
        });
        return;
      }
      const providedHashHex = crypto.createHash('sha256').update(recoveryKey).digest('hex');
      if (!timingSafeStringEqual(providedHashHex, expectedHashHex)) {
        sendJson(res, 401, { ok: false, error: 'Invalid Backup Recovery Key.' });
        return;
      }
      recoveredVia = 'recovery_key';
    } else {
      sendJson(res, 400, {
        ok: false,
        error: 'Enter a 6-digit email recovery code or Backup Recovery Key.'
      });
      return;
    }

    const token = createAdminSessionToken();
    setSessionCookie(req, res, token);
    if (relinkDevice) {
      clearTotpPairedCookie(res);
      options.onResetPairingRequested?.();
      sendJson(res, 200, {
        ok: true,
        token,
        isPaired: false,
        recoveredVia,
        otpauthUri: buildServerOtpAuthUri(activeTotpSecret)
      });
      return;
    }

    setTotpPairedCookie(req, res);
    sendJson(res, 200, {
      ok: true,
      token,
      isPaired: true,
      recoveredVia
    });
    return;
  }

  if (action === 'logout') {
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true, isAuthenticated: false });
    return;
  }

  // Authorize admin-only write / preview token configuration actions
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

  if (action === 'set-preview-token') {
    if (runtimeMode === 'vercel') {
      sendJson(res, 400, {
        ok: false,
        ...status,
        error: 'Vercel uses GITHUB_TOKEN from Vercel Environment Variables.'
      });
      return;
    }
    const incomingToken = typeof body.token === 'string' ? body.token.trim() : '';
    const incomingOwner =
      (typeof body.owner === 'string' && body.owner.trim()) || status.owner || DEFAULT_GITHUB_OWNER;
    const incomingRepo =
      (typeof body.repo === 'string' && body.repo.trim()) || status.repo || DEFAULT_GITHUB_REPO;
    const incomingBranch =
      (typeof body.branch === 'string' && body.branch.trim()) || status.branch || 'main';

    if (!incomingToken) {
      sendJson(res, 400, { ok: false, error: 'Please paste a valid GitHub Personal Access Token.' });
      return;
    }

    try {
      const verifyRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(incomingOwner)}/${encodeURIComponent(
          incomingRepo
        )}`,
        {
          method: 'GET',
          headers: buildGitHubHeaders(incomingToken),
          cache: 'no-store'
        }
      );
      const repoJson = (await verifyRes.json().catch(() => ({}))) as {
        message?: string;
        permissions?: { push?: boolean };
      };
      if (!verifyRes.ok) {
        sendJson(res, 400, {
          ok: false,
          error: repoJson.message || `GitHub rejected token (HTTP ${verifyRes.status}).`
        });
        return;
      }
      if (repoJson.permissions && repoJson.permissions.push === false) {
        sendJson(res, 403, {
          ok: false,
          error: 'Token only has read access. Enable Contents: Read and write permission.'
        });
        return;
      }

      const saved = writeLocalPreviewGitHubConfig({
        token: incomingToken,
        owner: incomingOwner,
        repo: incomingRepo,
        branch: incomingBranch
      });
      if (!saved) {
        sendJson(res, 500, { ok: false, error: 'Failed to store server-side preview token.' });
        return;
      }

      const nextStatus = getGitHubConfigStatus();
      sendJson(res, 200, {
        ok: true,
        runtime: runtimeMode,
        ...nextStatus,
        isAuthenticated: true
      });
      return;
    } catch (err) {
      sendJson(res, 502, {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to verify GitHub token.'
      });
      return;
    }
  }

  if (action === 'relink-qr') {
    sendJson(res, 200, {
      ok: true,
      rotated: false,
      otpauthUri: buildServerOtpAuthUri(activeTotpSecret)
    });
    return;
  }

  if (action === 'unpair-2fa') {
    clearTotpPairedCookie(res);
    options.onResetPairingRequested?.();
    sendJson(res, 200, {
      ok: true,
      isPaired: false,
      otpauthUri: buildServerOtpAuthUri(activeTotpSecret)
    });
    return;
  }

  if (action === 'upload-asset') {
    const base64Content = typeof body.base64Content === 'string' ? body.base64Content.trim() : '';
    const filename = typeof body.filename === 'string' ? body.filename.trim() : 'upload.bin';
    const mimeType =
      typeof body.mimeType === 'string' && body.mimeType.trim()
        ? body.mimeType.trim()
        : 'application/octet-stream';

    if (!base64Content) {
      sendJson(res, 400, { ok: false, error: 'Missing asset content.' });
      return;
    }

    const buffer = Buffer.from(base64Content.replace(/\s+/g, ''), 'base64');
    if (buffer.length === 0) {
      sendJson(res, 400, { ok: false, error: 'Empty asset file.' });
      return;
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
    const ext = resolveAssetExtension(mimeType, filename);
    const fileId = `${hash}${ext}`;

    writeLocalAssetIfWritable(fileId, buffer);

    if (status.githubConfigured) {
      try {
        await commitGitHubAssetFile({
          fileId,
          buffer,
          commitMessage: `chore(assets): add ${filename || fileId} via Owner Mode`
        });
      } catch (err) {
        sendJson(res, 502, {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to commit uploaded asset to GitHub.'
        });
        return;
      }
    }

    sendJson(res, 201, {
      ok: true,
      url: `/api/assets/${fileId}`,
      staticUrl: `/uploaded-assets/${fileId}`,
      filename: filename || fileId,
      size: buffer.length,
      mimeType
    });
    return;
  }

  if (action === 'clear-preview-token') {
    writeLocalPreviewGitHubConfig(null);
    const nextStatus = getGitHubConfigStatus();
    sendJson(res, 200, {
      ok: true,
      runtime: runtimeMode,
      ...nextStatus,
      isAuthenticated: true
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

  if (!status.githubConfigured) {
    const wroteLocal = writeLocalDataJsonIfWritable(nextBundle);
    if (wroteLocal) {
      options.onLocalCommitted?.(nextBundle);
    }
    sendJson(res, 400, {
      ok: false,
      committed: false,
      savedLocally: wroteLocal,
      ...status,
      data: nextBundle,
      error:
        'GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO is not configured on the server. Add them in Vercel Environment Variables (or connect a Preview Token) to commit & push edits directly to GitHub.'
    });
    return;
  }

  try {
    await ensureGitHubAssetsSynced(nextBundle);
    const commitResult = await commitGitHubDataJson({
      bundle: nextBundle,
      commitMessage
    });
    const wroteLocal = writeLocalDataJsonIfWritable(nextBundle);
    if (wroteLocal) {
      options.onLocalCommitted?.(nextBundle);
    }
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
      savedLocally: false,
      runtime: runtimeMode,
      ...status,
      error:
        err instanceof Error ? err.message : 'Failed to commit data.json update to GitHub. Save was not applied.'
    });
  }
}

export default async function handler(req: NodeReq, res: ServerResponse): Promise<void> {
  return handleUpdatePortfolioRequest(req, res);
}
