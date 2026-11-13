// RFC 6238 TOTP (Time-based One-Time Password) helper using Web Crypto HMAC-SHA1
// Compatible with Google Authenticator, Authy, Microsoft Authenticator, and Apple Passwords

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Owner's fixed Base32 TOTP secret (never rendered on public/unauthenticated login UI).
// Can be overridden at build time via VITE_OWNER_TOTP_SECRET.
export const OWNER_TOTP_SECRET: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_OWNER_TOTP_SECRET) ||
  'NBSWY3DPFQQHO33SNRSCC43FMNZGK5A4';

export const OWNER_TOTP_ISSUER = 'ADHAVAN Portfolio';
export const OWNER_TOTP_ACCOUNT = 'adhavanprabhu906@gmail.com';

export function base32ToBytes(base32: string): Uint8Array {
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

  return new Uint8Array(output);
}

export function generateRandomBase32Secret(byteLength = 20): string {
  const random = new Uint8Array(byteLength);
  crypto.getRandomValues(random);
  let bits = 0;
  let value = 0;
  let result = '';

  for (let i = 0; i < random.length; i++) {
    value = (value << 8) | random[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

export function buildOtpAuthUri(
  secret: string,
  account: string = OWNER_TOTP_ACCOUNT,
  issuer: string = OWNER_TOTP_ISSUER
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const cleanSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=6&period=30`;
}

export async function generateTotpCode(
  secret: string,
  timestampMs: number = Date.now(),
  stepOffset = 0
): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const counter = Math.floor(timestampMs / 1000 / 30) + stepOffset;

  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1_000_000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifies a 6-digit TOTP authenticator code with ±1 window tolerance (90s clock-skew safety).
 */
export async function verifyTotpCode(
  secret: string,
  inputCode: string,
  timestampMs: number = Date.now()
): Promise<boolean> {
  const normalized = inputCode.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(normalized)) return false;

  for (const offset of [0, -1, 1]) {
    const candidate = await generateTotpCode(secret, timestampMs, offset);
    if (candidate === normalized) {
      return true;
    }
  }
  return false;
}

export function getTotpSecondsRemaining(timestampMs: number = Date.now()): number {
  return 30 - (Math.floor(timestampMs / 1000) % 30);
}
