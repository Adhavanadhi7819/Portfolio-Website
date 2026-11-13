/// <reference types="node" />
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'portfolio-data');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');

const DEFAULT_TOTP_SECRET =
  process.env.OWNER_TOTP_SECRET || 'NBSWY3DPFQQHO33SNRSCC43FMNZGK5A4';
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

  const initial: AuthStore = {
    secret: DEFAULT_TOTP_SECRET,
    paired: false,
    signingKey: crypto.randomBytes(32).toString('hex')
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
      ...(authenticated || showInitialSetupQr
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
      isPaired: true,
      otpauthUri: buildOtpAuthUri(authStore.secret)
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

    const assetPath = path.join(ASSETS_DIR, fileId);
    if (!fs.existsSync(assetPath)) {
      res.status(404).end();
      return;
    }

    const metaPath = path.join(ASSETS_DIR, `${fileId}.json`);
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

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${originalFilename}"`);
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
