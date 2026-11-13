/// <reference types="node" />
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT) || 3000;

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'portfolio-data');

function resolveWritableDataDir(): string {
  try {
    fs.mkdirSync(path.join(BUNDLED_DATA_DIR, 'assets'), { recursive: true });
    fs.accessSync(BUNDLED_DATA_DIR, fs.constants.W_OK);
    return BUNDLED_DATA_DIR;
  } catch {
    const fallback = path.join(os.tmpdir(), 'adhavan-portfolio-data');
    fs.mkdirSync(path.join(fallback, 'assets'), { recursive: true });
    return fallback;
  }
}

function seedWritableDataDirIfNeeded(targetDir: string): void {
  if (targetDir === BUNDLED_DATA_DIR || !fs.existsSync(BUNDLED_DATA_DIR)) return;
  try {
    const copyIfMissing = (filename: string) => {
      const src = path.join(BUNDLED_DATA_DIR, filename);
      const dest = path.join(targetDir, filename);
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    };
    copyIfMissing('state.json');
    copyIfMissing('auth.json');
    copyIfMissing('messages.json');

    const bundledAssetsDir = path.join(BUNDLED_DATA_DIR, 'assets');
    const targetAssetsDir = path.join(targetDir, 'assets');
    if (fs.existsSync(bundledAssetsDir)) {
      fs.mkdirSync(targetAssetsDir, { recursive: true });
      for (const entry of fs.readdirSync(bundledAssetsDir)) {
        const srcAsset = path.join(bundledAssetsDir, entry);
        const destAsset = path.join(targetAssetsDir, entry);
        if (!fs.existsSync(destAsset) && fs.statSync(srcAsset).isFile()) {
          fs.copyFileSync(srcAsset, destAsset);
        }
      }
    }
  } catch (err) {
    console.error('Failed seeding fallback data dir from bundled portfolio-data:', err);
  }
}

const DATA_DIR = resolveWritableDataDir();
seedWritableDataDirIfNeeded(DATA_DIR);
const ASSETS_DIR = path.join(DATA_DIR, 'assets');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');

const DEFAULT_TOTP_SECRET =
  process.env.OWNER_TOTP_SECRET || 'NBSWY3DPFQQHO33SNRSCC43FMNZGK5A4';
const DEFAULT_CONTACT_EMAIL = 'prabuprabu906@gmail.com';
const OWNER_TOTP_ISSUER = 'ADHAVAN Portfolio';
const OWNER_TOTP_ACCOUNT = 'adhavanprabhu906@gmail.com';
const SESSION_COOKIE_NAME = 'adhavan_owner_token';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AuthStore {
  secret: string;
  paired: boolean;
  signingKey: string;
}

interface StoredPortfolioFile {
  version: number;
  updatedAt: string;
  activePortfolioId: string;
  portfolios: unknown[];
}

interface AssetMeta {
  mimeType: string;
  originalFilename: string;
  size: number;
}

interface ContactMessage {
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

fs.mkdirSync(ASSETS_DIR, { recursive: true });

function writeAtomic(filePath: string, content: string | Buffer): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.tmp.${process.pid}.${crypto.randomBytes(4).toString('hex')}`
  );
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

function loadOrCreateAuthStore(): AuthStore {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) as Partial<AuthStore>;
      if (parsed && typeof parsed.secret === 'string' && typeof parsed.signingKey === 'string') {
        return {
          secret: parsed.secret,
          paired: Boolean(parsed.paired),
          signingKey: parsed.signingKey
        };
      }
    }
  } catch (err) {
    console.error('Failed to read auth store, recreating:', err);
  }

  const deterministicSigningKey =
    process.env.OWNER_SESSION_SECRET ||
    crypto
      .createHash('sha256')
      .update(`${DEFAULT_TOTP_SECRET}:adhavan-owner-session-v1`)
      .digest('hex');

  const initial: AuthStore = {
    secret: DEFAULT_TOTP_SECRET,
    paired: false,
    signingKey: deterministicSigningKey
  };
  writeAtomic(AUTH_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

let authStore: AuthStore = loadOrCreateAuthStore();

function saveAuthStore(next: AuthStore): void {
  authStore = next;
  writeAtomic(AUTH_FILE, JSON.stringify(next, null, 2));
}

// --- RFC 6238 TOTP (HMAC-SHA1) ---
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
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

function generateTotpCode(secret: string, timestampMs = Date.now(), stepOffset = 0): string {
  const key = base32ToBuffer(secret);
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

function verifyTotpCode(secret: string, inputCode: string): boolean {
  const normalized = inputCode.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(normalized)) return false;

  const now = Date.now();
  for (const offset of [0, -1, 1]) {
    const expected = generateTotpCode(secret, now, offset);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) {
      return true;
    }
  }
  return false;
}

function buildOtpAuthUri(secret: string): string {
  const label = `${encodeURIComponent(OWNER_TOTP_ISSUER)}:${encodeURIComponent(OWNER_TOTP_ACCOUNT)}`;
  const cleanSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encodeURIComponent(
    OWNER_TOTP_ISSUER
  )}&algorithm=SHA1&digits=6&period=30`;
}

// --- Signed Session Tokens ---
function createSessionToken(): string {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      role: 'owner',
      iat: now,
      exp: now + SESSION_TTL_MS
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', authStore.signingKey)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  try {
    const expectedSig = crypto
      .createHmac('sha256', authStore.signingKey)
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
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME];
}

function isOwnerAuthenticated(req: Request): boolean {
  return verifySessionToken(extractToken(req));
}

function requireOwnerAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isOwnerAuthenticated(req)) {
    res.status(401).json({
      ok: false,
      error: 'Owner authentication required. Unlock Owner Mode with your 2FA code.'
    });
    return;
  }
  next();
}

function isPreviewRequest(req: Request): boolean {
  const forwardedHost = String(req.headers['x-forwarded-host'] || '');
  const hostHeader = String(req.headers.host || '');
  const host = (forwardedHost || hostHeader || req.hostname || '').toLowerCase();
  return (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('ais-dev-')
  );
}

// --- Media / Asset Storage & Data-URL Dehydration ---
const MIME_TO_EXT: Record<string, string> = {
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

const EXT_TO_MIME: Record<string, string> = {
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

function sanitizeExtension(mimeType: string, originalFilename?: string): string {
  const normalizedMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  if (MIME_TO_EXT[normalizedMime]) {
    return MIME_TO_EXT[normalizedMime];
  }
  if (originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    if (/^\.[a-z0-9]{1,8}$/.test(ext) && ext !== '.json') {
      return ext;
    }
  }
  return '.bin';
}

function saveBufferAsAsset(
  buffer: Buffer,
  mimeType: string,
  originalFilename?: string
): { url: string; fileId: string; size: number; mimeType: string; filename: string } {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
  const ext = sanitizeExtension(mimeType, originalFilename);
  const fileId = `${hash}${ext}`;
  const assetPath = path.join(ASSETS_DIR, fileId);
  const metaPath = path.join(ASSETS_DIR, `${fileId}.json`);
  const cleanMime = (mimeType || EXT_TO_MIME[ext] || 'application/octet-stream')
    .split(';')[0]
    .trim();
  const safeName = (originalFilename || `asset${ext}`).replace(/["\r\n/\\]/g, '_');

  if (!fs.existsSync(assetPath)) {
    writeAtomic(assetPath, buffer);
  }
  if (!fs.existsSync(metaPath)) {
    const meta: AssetMeta = {
      mimeType: cleanMime,
      originalFilename: safeName,
      size: buffer.length
    };
    writeAtomic(metaPath, JSON.stringify(meta));
  }

  return {
    url: `/api/assets/${fileId}`,
    fileId,
    size: buffer.length,
    mimeType: cleanMime,
    filename: safeName
  };
}

function dehydrateDataUrls(value: unknown, keyHint?: string): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('data:')) {
      const match = /^data:([^;,]+)?(?:;[^,]*)?;base64,([A-Za-z0-9+/=\s]+)$/s.exec(value);
      if (match) {
        const mimeType = (match[1] || 'application/octet-stream').trim();
        const base64Body = match[2].replace(/\s+/g, '');
        const buf = Buffer.from(base64Body, 'base64');
        const saved = saveBufferAsAsset(buf, mimeType, keyHint);
        return saved.url;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => dehydrateDataUrls(item, keyHint));
  }

  if (value !== null && typeof value === 'object') {
    const inputObj = value as Record<string, unknown>;
    const outObj: Record<string, unknown> = {};
    const resumeFilenameHint =
      typeof inputObj.resumeFileName === 'string' ? inputObj.resumeFileName : undefined;
    for (const [k, v] of Object.entries(inputObj)) {
      const hint = k === 'resumePdfUrl' ? resumeFilenameHint : undefined;
      outObj[k] = dehydrateDataUrls(v, hint);
    }
    return outObj;
  }

  return value;
}

// --- Portfolio State Store & Live SSE Broadcast ---
function loadPortfolioState(): StoredPortfolioFile | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredPortfolioFile>;
    if (parsed && Array.isArray(parsed.portfolios) && parsed.portfolios.length > 0) {
      return {
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        activePortfolioId: parsed.activePortfolioId || 'default_portfolio',
        portfolios: parsed.portfolios
      };
    }
  } catch (err) {
    console.error('Failed to read portfolio state file:', err);
  }
  return null;
}

const sseClients = new Set<Response>();

function broadcastPortfolioUpdate(version: number, updatedAt: string): void {
  const payload = `event: portfolio-updated\ndata: ${JSON.stringify({ version, updatedAt })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function broadcastInboxUpdate(unreadCount: number): void {
  const payload = `event: message-received\ndata: ${JSON.stringify({ unreadCount })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function loadMessages(): ContactMessage[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    return Array.isArray(parsed) ? (parsed as ContactMessage[]) : [];
  } catch (err) {
    console.error('Failed to read messages file:', err);
    return [];
  }
}

function saveMessages(messages: ContactMessage[]): void {
  writeAtomic(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function resolveRecipientEmail(fallbackEmail?: string): string {
  try {
    const saved = loadPortfolioState();
    if (saved) {
      const profiles = saved.portfolios as Array<{
        id?: string;
        state?: { designerInfo?: { email?: string } };
      }>;
      const active =
        profiles.find((p) => p.id === saved.activePortfolioId) || profiles[0];
      const configured = active?.state?.designerInfo?.email;
      if (typeof configured === 'string' && isValidEmailAddress(configured)) {
        return configured.trim();
      }
    }
  } catch {}
  if (fallbackEmail && isValidEmailAddress(fallbackEmail)) {
    return fallbackEmail.trim();
  }
  return DEFAULT_CONTACT_EMAIL;
}

function getRequestOrigin(req: Request): string {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && /^https?:\/\//i.test(origin)) {
    return origin;
  }
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000').split(',')[0].trim();
  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.APP_URL || 'http://localhost:3000';
}

async function dispatchEmailToOwner(
  msg: {
    name: string;
    senderEmail: string;
    projectType: string;
    message: string;
    recipientEmail: string;
  },
  originUrl: string
): Promise<{ status: 'sent' | 'activation_pending' | 'stored_only'; note: string }> {
  const subject = `Portfolio Inquiry (${msg.projectType}) — from ${msg.name}`;

  // Tier 1: Resend API if configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
          to: [msg.recipientEmail],
          reply_to: msg.senderEmail,
          subject,
          text: `From: ${msg.name} <${msg.senderEmail}>\nProject Focus: ${msg.projectType}\n\n${msg.message}`
        })
      });
      if (resp.ok) {
        return {
          status: 'sent',
          note: `Email delivered to ${msg.recipientEmail}`
        };
      }
    } catch (err) {
      console.error('Resend dispatch error:', err);
    }
  }

  // Tier 2: Zero-config HTTPS FormSubmit JSON Relay
  try {
    const resp = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(msg.recipientEmail)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: originUrl,
          Referer: `${originUrl}/`,
          'User-Agent': 'Mozilla/5.0 (compatible; PortfolioContactRelay/1.0)'
        },
        body: JSON.stringify({
          name: msg.name,
          email: msg.senderEmail,
          _replyto: msg.senderEmail,
          _subject: subject,
          Project_Focus: msg.projectType,
          message: msg.message,
          _template: 'table',
          _captcha: 'false'
        })
      }
    );

    const data = (await resp.json().catch(() => ({}))) as {
      success?: boolean | string;
      message?: string;
    };

    if (resp.ok && (data.success === true || data.success === 'true')) {
      return {
        status: 'sent',
        note: `Email forwarded to ${msg.recipientEmail}`
      };
    }

    const relayMessage = String(data.message || '');
    if (relayMessage.toLowerCase().includes('activat')) {
      return {
        status: 'activation_pending',
        note: `Activation email sent to ${msg.recipientEmail}. Open that email once and click "Activate Form" to receive future messages in your inbox.`
      };
    }

    return {
      status: 'stored_only',
      note: relayMessage || `Saved to Owner Inbox (relay HTTP ${resp.status})`
    };
  } catch (err) {
    console.error('Email relay dispatch error:', err);
    return {
      status: 'stored_only',
      note: 'Saved in Owner Inbox (email relay temporarily unreachable).'
    };
  }
}

const contactRateBuckets = new Map<string, number[]>();

function isContactRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (contactRateBuckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (recent.length >= 12) {
    contactRateBuckets.set(ip, recent);
    return true;
  }
  recent.push(now);
  contactRateBuckets.set(ip, recent);
  return false;
}

setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // --- Auth Endpoints ---
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const authenticated = isOwnerAuthenticated(req);
    const preview = isPreviewRequest(req);
    const showInitialSetupQr = !authStore.paired && preview;

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      isAuthenticated: authenticated,
      isPaired: authStore.paired,
      canShowInitialSetupQr: showInitialSetupQr,
      ...(showInitialSetupQr
        ? { otpauthUri: buildOtpAuthUri(authStore.secret) }
        : {})
    });
  });

  app.post('/api/auth/verify', express.json({ limit: '64kb' }), (req: Request, res: Response) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    if (!verifyTotpCode(authStore.secret, code)) {
      res.status(401).json({
        ok: false,
        error: 'Invalid or expired 2FA code. Check your Authenticator app and try again.'
      });
      return;
    }

    if (!authStore.paired) {
      saveAuthStore({ ...authStore, paired: true });
    }

    const token = createSessionToken();
    const isSecure =
      req.secure || String(req.headers['x-forwarded-proto'] || '').includes('https');

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      maxAge: SESSION_TTL_MS,
      path: '/'
    });

    res.json({
      ok: true,
      token,
      isPaired: true
    });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  // --- Asset Upload & Retrieval Endpoints ---
  app.post(
    '/api/assets',
    requireOwnerAuth,
    express.raw({ type: '*/*', limit: '100mb' }),
    (req: Request, res: Response) => {
      const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (bodyBuffer.length === 0) {
        res.status(400).json({ ok: false, error: 'Empty file upload.' });
        return;
      }

      const rawFilename = String(req.headers['x-filename'] || 'upload.bin');
      let decodedFilename = rawFilename;
      try {
        decodedFilename = decodeURIComponent(rawFilename);
      } catch {
        decodedFilename = rawFilename;
      }
      const mimeType = String(req.headers['content-type'] || 'application/octet-stream');

      const saved = saveBufferAsAsset(bodyBuffer, mimeType, decodedFilename);
      res.status(201).json({
        ok: true,
        url: saved.url,
        filename: saved.filename,
        size: saved.size,
        mimeType: saved.mimeType
      });
    }
  );

  app.get('/api/assets/:fileId', (req: Request, res: Response) => {
    const fileId = String(req.params.fileId || '');
    if (!/^[a-f0-9]{16,64}\.[a-z0-9]{1,8}$/i.test(fileId) || fileId.endsWith('.json')) {
      res.status(404).end();
      return;
    }

    const primaryAssetPath = path.join(ASSETS_DIR, fileId);
    const bundledAssetPath = path.join(BUNDLED_DATA_DIR, 'assets', fileId);
    const assetPath = fs.existsSync(primaryAssetPath)
      ? primaryAssetPath
      : fs.existsSync(bundledAssetPath)
      ? bundledAssetPath
      : null;

    if (!assetPath) {
      res.status(404).end();
      return;
    }

    const primaryMetaPath = path.join(ASSETS_DIR, `${fileId}.json`);
    const bundledMetaPath = path.join(BUNDLED_DATA_DIR, 'assets', `${fileId}.json`);
    const metaPath = fs.existsSync(primaryMetaPath) ? primaryMetaPath : bundledMetaPath;

    const ext = path.extname(fileId).toLowerCase();
    let mimeType = EXT_TO_MIME[ext] || 'application/octet-stream';
    let originalFilename = `asset${ext}`;

    try {
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as Partial<AssetMeta>;
        if (meta.mimeType) mimeType = meta.mimeType;
        if (meta.originalFilename) originalFilename = meta.originalFilename;
      }
    } catch {}

    const asciiFilename = originalFilename.replace(/[^a-zA-Z0-9._ -]/g, '_');
    const encodedFilename = encodeURIComponent(originalFilename);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(assetPath);
  });

  // --- Portfolio Canonical Read / Write / Live SSE Stream ---
  app.get('/api/portfolio', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const saved = loadPortfolioState();
    if (!saved) {
      res.json({ initialized: false });
      return;
    }
    res.json({
      initialized: true,
      version: saved.version,
      updatedAt: saved.updatedAt,
      activePortfolioId: saved.activePortfolioId,
      portfolios: saved.portfolios
    });
  });

  app.get('/api/portfolio/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const current = loadPortfolioState();
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        version: current?.version ?? 0,
        updatedAt: current?.updatedAt ?? null
      })}\n\n`
    );

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  app.put(
    '/api/portfolio',
    requireOwnerAuth,
    express.json({ limit: '50mb' }),
    (req: Request, res: Response) => {
      const body = req.body as {
        activePortfolioId?: unknown;
        portfolios?: unknown;
        portfolioState?: unknown;
      };

      let nextPortfolios: unknown[] | null = null;
      const nextActiveId =
        typeof body?.activePortfolioId === 'string' && body.activePortfolioId.trim()
          ? body.activePortfolioId.trim()
          : 'default_portfolio';

      if (Array.isArray(body?.portfolios) && body.portfolios.length > 0) {
        nextPortfolios = dehydrateDataUrls(body.portfolios) as unknown[];
      } else if (body?.portfolioState && typeof body.portfolioState === 'object') {
        const dehydratedState = dehydrateDataUrls(body.portfolioState);
        nextPortfolios = [
          {
            id: nextActiveId,
            name: 'ADHAVAN — Game Designer | 3D Artist',
            subtitle: 'Unreal Engine gameplay, level layout, and 3D art',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            state: dehydratedState
          }
        ];
      }

      if (!nextPortfolios) {
        res.status(400).json({ ok: false, error: 'Invalid portfolio payload.' });
        return;
      }

      const prev = loadPortfolioState();
      const nextVersion = (prev?.version ?? 0) + 1;
      const updatedAt = new Date().toISOString();

      const record: StoredPortfolioFile = {
        version: nextVersion,
        updatedAt,
        activePortfolioId: nextActiveId,
        portfolios: nextPortfolios
      };

      writeAtomic(STATE_FILE, JSON.stringify(record, null, 2));
      broadcastPortfolioUpdate(nextVersion, updatedAt);

      res.json({
        ok: true,
        initialized: true,
        version: nextVersion,
        updatedAt,
        activePortfolioId: nextActiveId,
        portfolios: nextPortfolios
      });
    }
  );

  app.post(
    '/api/portfolio/reset',
    requireOwnerAuth,
    express.json({ limit: '5mb' }),
    (req: Request, res: Response) => {
      const prev = loadPortfolioState();
      const nextVersion = (prev?.version ?? 0) + 1;
      const updatedAt = new Date().toISOString();
      const defaultState = req.body?.defaultState;

      if (defaultState && typeof defaultState === 'object') {
        const record: StoredPortfolioFile = {
          version: nextVersion,
          updatedAt,
          activePortfolioId: 'default_portfolio',
          portfolios: [
            {
              id: 'default_portfolio',
              name: 'ADHAVAN — Game Designer | 3D Artist',
              subtitle: 'Unreal Engine gameplay, level layout, and 3D art',
              createdAt: updatedAt,
              updatedAt,
              state: defaultState
            }
          ]
        };
        writeAtomic(STATE_FILE, JSON.stringify(record, null, 2));
      } else if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }

      broadcastPortfolioUpdate(nextVersion, updatedAt);
      res.json({ ok: true, version: nextVersion, updatedAt });
    }
  );

  // --- Direct Contact & Owner Inbox Endpoints ---
  app.post('/api/contact', express.json({ limit: '64kb' }), async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isContactRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        error: 'Too many inquiries sent recently. Please try again in a few minutes.'
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const senderEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const projectType =
      typeof req.body?.projectType === 'string' && req.body.projectType.trim()
        ? req.body.projectType.trim().slice(0, 160)
        : 'General Inquiry';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const fallbackRecipient =
      typeof req.body?.recipientEmail === 'string' ? req.body.recipientEmail.trim() : undefined;

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ ok: false, error: 'Please enter a valid name (2–120 characters).' });
      return;
    }
    if (!isValidEmailAddress(senderEmail) || senderEmail.length > 160) {
      res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
      return;
    }
    if (message.length < 5 || message.length > 4000) {
      res.status(400).json({ ok: false, error: 'Please enter a message (at least 5 characters).' });
      return;
    }

    const recipientEmail = resolveRecipientEmail(fallbackRecipient);
    const originUrl = getRequestOrigin(req);
    const dispatchResult = await dispatchEmailToOwner(
      { name, senderEmail, projectType, message, recipientEmail },
      originUrl
    );

    const record: ContactMessage = {
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name,
      senderEmail,
      projectType,
      message,
      recipientEmail,
      createdAt: new Date().toISOString(),
      read: false,
      deliveryStatus: dispatchResult.status,
      deliveryNote: dispatchResult.note
    };

    const messages = [record, ...loadMessages()].slice(0, 500);
    saveMessages(messages);
    const unreadCount = messages.filter((m) => !m.read).length;
    broadcastInboxUpdate(unreadCount);

    res.status(201).json({
      ok: true,
      id: record.id,
      recipientEmail,
      deliveryStatus: record.deliveryStatus,
      deliveryNote: record.deliveryNote
    });
  });

  app.get('/api/contact/messages', requireOwnerAuth, (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const messages = loadMessages();
    const unreadCount = messages.filter((m) => !m.read).length;
    res.json({
      ok: true,
      messages,
      unreadCount,
      recipientEmail: resolveRecipientEmail()
    });
  });

  app.patch(
    '/api/contact/messages/:id',
    requireOwnerAuth,
    express.json({ limit: '16kb' }),
    (req: Request, res: Response) => {
      const id = String(req.params.id || '');
      const read = typeof req.body?.read === 'boolean' ? req.body.read : true;
      const messages = loadMessages().map((m) =>
        id === 'all' || m.id === id ? { ...m, read } : m
      );
      saveMessages(messages);
      const unreadCount = messages.filter((m) => !m.read).length;
      broadcastInboxUpdate(unreadCount);
      res.json({ ok: true, messages, unreadCount });
    }
  );

  app.delete('/api/contact/messages/:id', requireOwnerAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const messages = loadMessages().filter((m) => m.id !== id);
    saveMessages(messages);
    const unreadCount = messages.filter((m) => !m.read).length;
    broadcastInboxUpdate(unreadCount);
    res.json({ ok: true, messages, unreadCount });
  });

  app.post('/api/contact/test-email', requireOwnerAuth, async (req: Request, res: Response) => {
    const recipientEmail = resolveRecipientEmail();
    const originUrl = getRequestOrigin(req);
    const result = await dispatchEmailToOwner(
      {
        name: 'Portfolio Email Verification',
        senderEmail: recipientEmail,
        projectType: 'Email Delivery Test',
        message: `Test inquiry sent from your portfolio at ${originUrl} to verify direct mail delivery to ${recipientEmail}.`,
        recipientEmail
      },
      originUrl
    );
    res.json({
      ok: true,
      recipientEmail,
      deliveryStatus: result.status,
      deliveryNote: result.note
    });
  });

  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: 'API endpoint not found.' });
  });

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('Unhandled API error:', err);
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Internal server error'
      });
      return;
    }
    next(err);
  });

  // --- Frontend Mounting (Vite Dev vs Production Dist) ---
  const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(DIST_INDEX);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(DIST_INDEX);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT} (${isDev ? 'dev' : 'prod'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start portfolio server:', err);
  process.exit(1);
});
