import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, X, QrCode, ShieldAlert, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { getTotpSecondsRemaining } from '../utils/totp';
import {
  fetchServerAuthStatus,
  verifyOwnerTotpWithServer
} from '../utils/portfolioServerSync';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPasscode?: string;
  onUpdatePasscode?: (newPasscode: string) => void;
  isAlreadyOwner: boolean;
  onLockOwnerMode: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAlreadyOwner,
  onLockOwnerMode
}) => {
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState(true);
  const [canShowFirstTimeSetup, setCanShowFirstTimeSetup] = useState(false);
  const [showSetupQr, setShowSetupQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => getTotpSecondsRemaining());

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setError('');
    setTotpCode('');
    setShowSetupQr(false);

    fetchServerAuthStatus()
      .then((status) => {
        if (!active) return;
        setIsPaired(status.isPaired);
        setCanShowFirstTimeSetup(!isAlreadyOwner && !status.isPaired && status.canShowInitialSetupQr);
        setOtpauthUri(!status.isPaired ? status.otpauthUri || null : null);
      })
      .catch(() => {
        if (!active) return;
        setCanShowFirstTimeSetup(false);
        setOtpauthUri(null);
      });

    const tick = setInterval(() => {
      setSecondsLeft(getTotpSecondsRemaining());
    }, 1000);
    return () => {
      active = false;
      clearInterval(tick);
    };
  }, [isOpen, isAlreadyOwner]);

  useEffect(() => {
    if (!isOpen || isPaired || !otpauthUri || !showSetupQr) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(otpauthUri, {
      width: 220,
      margin: 2,
      color: {
        dark: '#050507',
        light: '#ffffff'
      }
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Failed to render 2FA QR code:', err));
  }, [isOpen, isPaired, otpauthUri, showSetupQr]);

  if (!isOpen) return null;

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = totpCode.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError('Enter the 6-digit code from your Authenticator app.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const result = await verifyOwnerTotpWithServer(cleaned);
      if (result.ok) {
        setIsPaired(true);
        setOtpauthUri(null);
        setQrDataUrl('');
        setCanShowFirstTimeSetup(false);
        setShowSetupQr(false);
        setTotpCode('');
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Invalid or expired 2FA code. Check your Authenticator app and try again.');
      }
    } catch {
      setError('Verification failed. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg shadow-amber-500/10">
            {isAlreadyOwner ? (
              <Unlock className="w-7 h-7 text-amber-400" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <h2
            id="owner-auth-title"
            className="text-2xl font-heading font-black text-white uppercase tracking-tight"
          >
            Owner <span className="text-amber-500">2FA Access</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isAlreadyOwner
              ? '2FA Authenticator security is active for Owner Mode. All edits automatically sync to the live website.'
              : 'Protected by Time-Based 2FA. Enter the 6-digit verification code from your Authenticator app.'}
          </p>
        </div>

        {isAlreadyOwner ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Authenticated as <strong>Adhavan</strong> with 2FA Authenticator protection linked.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onLockOwnerMode();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock &amp; Exit Owner Mode</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            {!isPaired && canShowFirstTimeSetup && !showSetupQr && otpauthUri && (
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-300 font-mono">
                  First time on this app? Scan the setup QR once.
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupQr(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pair QR</span>
                </button>
              </div>
            )}

            {!isPaired && canShowFirstTimeSetup && showSetupQr && qrDataUrl && (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/40 space-y-3 text-center">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  One-Time Authenticator Pairing
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Scan this QR code once in <strong>Google Authenticator</strong>,{' '}
                  <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong>, then enter the
                  6-digit code below to activate.
                </p>
                <div className="inline-block p-2.5 rounded-xl bg-white shadow-lg">
                  <img
                    src={qrDataUrl}
                    alt="Scan 2FA QR Code"
                    className="w-44 h-44 block"
                  />
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  After verification, this QR code stays hidden permanently.
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="owner-totp-input"
                  className="block text-xs font-mono text-zinc-300 uppercase tracking-wider"
                >
                  6-Digit Authenticator Code *
                </label>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                  Refreshes in {secondsLeft}s
                </span>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                id="owner-totp-input"
                value={totpCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTotpCode(digits);
                  setError('');
                }}
                placeholder="000000"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-2xl font-mono font-bold tracking-[0.4em] text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />

              {error && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || totpCode.length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Verify & Unlock Owner Mode'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
