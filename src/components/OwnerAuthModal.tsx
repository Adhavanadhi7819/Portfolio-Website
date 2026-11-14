import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  X,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  Mail,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Smartphone,
  Eye,
  EyeOff,
  GitBranch
} from 'lucide-react';
import QRCode from 'qrcode';
import { getTotpSecondsRemaining } from '../utils/totp';
import {
  fetchServerAuthStatus,
  verifyOwnerTotpWithServer,
  verifyAdminPinWithServer,
  requestOwnerRecoveryEmail,
  verifyOwnerRecoveryWithServer,
  fetchRecoveryKeyStatus,
  regenerateRecoveryKey,
  relinkAuthenticatorDevice
} from '../utils/portfolioServerSync';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPasscode?: string;
  onUpdatePasscode?: (newPasscode: string) => void;
  isAlreadyOwner: boolean;
  onLockOwnerMode: () => void;
  onOpenGitHubSync?: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isAlreadyOwner,
  onLockOwnerMode,
  onOpenGitHubSync
}) => {
  const [authMethod, setAuthMethod] = useState<'pin' | 'totp'>('pin');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinValue, setShowPinValue] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // One-time initial pairing (only shown when never paired yet in preview)
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState(true);
  const [canShowFirstTimeSetup, setCanShowFirstTimeSetup] = useState(false);
  const [showSetupQr, setShowSetupQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => getTotpSecondsRemaining());

  // Unauthenticated Recovery Mode state
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'key'>('email');
  const [ownerEmailMasked, setOwnerEmailMasked] = useState('ad***@gmail.com');
  const [hasRecoveryKey, setHasRecoveryKey] = useState(false);
  const [isSendingRecoveryEmail, setIsSendingRecoveryEmail] = useState(false);
  const [recoveryEmailSentNote, setRecoveryEmailSentNote] = useState<string | null>(null);
  const [emailRecoveryCode, setEmailRecoveryCode] = useState('');
  const [backupRecoveryKeyInput, setBackupRecoveryKeyInput] = useState('');

  // Authenticated Security Panel state (Backup Key & Re-Link Device)
  const [generatedBackupKey, setGeneratedBackupKey] = useState<string | null>(null);
  const [copiedBackupKey, setCopiedBackupKey] = useState(false);
  const [isGeneratingBackupKey, setIsGeneratingBackupKey] = useState(false);
  const [relinkQrDataUrl, setRelinkQrDataUrl] = useState<string | null>(null);
  const [isRelinkingDevice, setIsRelinkingDevice] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const [recoveryRelinkBanner, setRecoveryRelinkBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setError('');
    setAdminPinInput('');
    setShowPinValue(false);
    setTotpCode('');
    setShowSetupQr(false);
    setIsRecoveryMode(false);
    setRecoveryEmailSentNote(null);
    setEmailRecoveryCode('');
    setBackupRecoveryKeyInput('');
    setGeneratedBackupKey(null);
    setRelinkQrDataUrl(null);
    setSecurityNotice(null);
    setRecoveryRelinkBanner(null);

    fetchServerAuthStatus()
      .then((status) => {
        if (!active) return;
        setIsPaired(status.isPaired);
        if (status.ownerEmailMasked) setOwnerEmailMasked(status.ownerEmailMasked);
        setHasRecoveryKey(Boolean(status.hasRecoveryKey));
        const shouldShowInitialQr =
          !isAlreadyOwner && !status.isPaired && status.canShowInitialSetupQr && Boolean(status.otpauthUri);
        setCanShowFirstTimeSetup(shouldShowInitialQr);
        setOtpauthUri(!status.isPaired ? status.otpauthUri || null : null);
        setShowSetupQr(shouldShowInitialQr);
      })
      .catch(() => {
        if (!active) return;
        setCanShowFirstTimeSetup(false);
        setOtpauthUri(null);
      });

    if (isAlreadyOwner) {
      fetchRecoveryKeyStatus()
        .then((res) => {
          if (!active) return;
          setHasRecoveryKey(res.hasRecoveryKey);
          if (res.ownerEmailMasked) setOwnerEmailMasked(res.ownerEmailMasked);
        })
        .catch(() => {});
    }

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

  const handleVerifyAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminPinInput.trim();
    if (!trimmed) {
      setError('Enter your Admin PIN.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const result = await verifyAdminPinWithServer(trimmed);
      if (result.ok) {
        setAdminPinInput('');
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Incorrect Admin PIN. Check ADMIN_PIN and try again.');
      }
    } catch {
      setError('Unable to verify Admin PIN right now. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

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
      setError('Invalid or expired 2FA code. Check your Authenticator app and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendRecoveryEmail = async () => {
    setIsSendingRecoveryEmail(true);
    setError('');
    setRecoveryEmailSentNote(null);
    try {
      const res = await requestOwnerRecoveryEmail();
      if (res.ok) {
        if (res.maskedEmail) setOwnerEmailMasked(res.maskedEmail);
        setRecoveryEmailSentNote(
          res.deliveryNote ||
            `6-digit recovery code sent to ${res.maskedEmail || ownerEmailMasked}. Valid for 10 minutes.`
        );
      } else {
        setError(res.error || 'Could not send recovery email right now.');
      }
    } catch {
      setError('Could not contact recovery email service. Try Backup Recovery Key if saved.');
    } finally {
      setIsSendingRecoveryEmail(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    try {
      const payload =
        recoveryMethod === 'email'
          ? { emailCode: emailRecoveryCode.replace(/\D/g, ''), relinkDevice: true }
          : { recoveryKey: backupRecoveryKeyInput.trim().toUpperCase(), relinkDevice: true };

      const result = await verifyOwnerRecoveryWithServer(payload);
      if (result.ok) {
        if (result.otpauthUri) {
          setIsPaired(false);
          setCanShowFirstTimeSetup(true);
          setOtpauthUri(result.otpauthUri);
          setShowSetupQr(true);
          setIsRecoveryMode(false);
          setTotpCode('');
          setRecoveryRelinkBanner(
            'Recovery verified! Scan this QR code in your Authenticator app, then enter the 6-digit code below to finish connecting.'
          );
          return;
        }
        setIsPaired(true);
        setIsRecoveryMode(false);
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Recovery verification failed.');
      }
    } catch {
      setError('Recovery verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateBackupKey = async () => {
    setIsGeneratingBackupKey(true);
    setSecurityNotice(null);
    setError('');
    try {
      const res = await regenerateRecoveryKey();
      setGeneratedBackupKey(res.recoveryKey);
      setHasRecoveryKey(true);
      setCopiedBackupKey(false);
    } catch {
      setError('Could not generate Backup Recovery Key. Re-verify your session and try again.');
    } finally {
      setIsGeneratingBackupKey(false);
    }
  };

  const handleRelinkDevice = async (rotateSecret: boolean) => {
    setIsRelinkingDevice(true);
    setSecurityNotice(null);
    setError('');
    try {
      const res = await relinkAuthenticatorDevice(rotateSecret);
      const qr = await QRCode.toDataURL(res.otpauthUri, {
        width: 210,
        margin: 2,
        color: { dark: '#050507', light: '#ffffff' }
      });
      setRelinkQrDataUrl(qr);
      setSecurityNotice(
        rotateSecret
          ? 'Generated a new secret QR. Scan it on your replacement phone now—old phones are revoked.'
          : 'Scan this QR on your replacement phone to sync your existing Authenticator code.'
      );
    } catch {
      setError('Could not open device pairing. Please ensure your Owner session is active.');
    } finally {
      setIsRelinkingDevice(false);
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
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
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
            {isRecoveryMode ? (
              <>
                2FA <span className="text-amber-500">Recovery Mode</span>
              </>
            ) : (
              <>
                Owner <span className="text-amber-500">Edit Mode</span>
              </>
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isAlreadyOwner
              ? 'Owner Edit Mode is active. Manage GitHub sync, backups, or lock editing below.'
              : isRecoveryMode
              ? 'Recover access if your Authenticator device was lost or replaced.'
              : authMethod === 'pin'
              ? 'Enter your Admin PIN to unlock Owner Edit Mode and commit updates directly to GitHub.'
              : 'Enter the 6-digit verification code from your connected Authenticator app.'}
          </p>
        </div>

        {isAlreadyOwner ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Authenticated as <strong>Adhavan</strong>. Edits save straight to <code className="text-amber-200">data.json</code> &amp; GitHub without localStorage.
              </span>
            </div>

            {onOpenGitHubSync && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGitHubSync();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <GitBranch className="w-4 h-4" />
                <span>Open GitHub Sync &amp; Vercel Setup</span>
              </button>
            )}

            {/* Backup Recovery Key Section (Authenticated Owner Only) */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-200 font-bold">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Backup Recovery Key</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {hasRecoveryKey ? 'Configured' : 'Not set'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Save an offline Backup Recovery Key in case you ever lose your phone. You can also recover anytime via {ownerEmailMasked}.
              </p>

              {generatedBackupKey ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-black border border-amber-500/40 font-mono text-xs text-amber-300 font-bold tracking-wider">
                    <span>{generatedBackupKey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(generatedBackupKey);
                        setCopiedBackupKey(true);
                        setTimeout(() => setCopiedBackupKey(false), 2000);
                      }}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 cursor-pointer"
                      title="Copy recovery key"
                    >
                      {copiedBackupKey ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-amber-400/90">
                    Save this key now — it is shown only once for security.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateBackupKey}
                  disabled={isGeneratingBackupKey}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold uppercase tracking-wider border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingBackupKey ? 'animate-spin' : ''}`} />
                  <span>
                    {hasRecoveryKey ? 'Rotate Backup Recovery Key' : 'Generate Backup Recovery Key'}
                  </span>
                </button>
              )}
            </div>

            {/* Switch / Replace Lost Phone (Authenticated Owner Only) */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-200 font-bold">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Replace Lost / New Phone</span>
              </div>

              {relinkQrDataUrl ? (
                <div className="space-y-2.5 text-center pt-1">
                  {securityNotice && (
                    <p className="text-[11px] text-amber-300 leading-relaxed">{securityNotice}</p>
                  )}
                  <div className="inline-block p-2.5 rounded-xl bg-white shadow-lg">
                    <img
                      src={relinkQrDataUrl}
                      alt="Authenticator Device Transfer QR"
                      className="w-40 h-40 block"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRelinkQrDataUrl(null);
                      setSecurityNotice(null);
                    }}
                    className="block mx-auto text-[11px] font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Hide Device Transfer QR
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isRelinkingDevice}
                    onClick={() => handleRelinkDevice(false)}
                    className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold uppercase tracking-wider border border-zinc-700 transition-colors cursor-pointer"
                  >
                    Add New Phone
                  </button>
                  <button
                    type="button"
                    disabled={isRelinkingDevice}
                    onClick={() => handleRelinkDevice(true)}
                    className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-amber-950/60 text-amber-300 text-[11px] font-semibold uppercase tracking-wider border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    Revoke Old &amp; Reset QR
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

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
        ) : isRecoveryMode ? (
          <form onSubmit={handleVerifyRecovery} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('email');
                  setError('');
                }}
                className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  recoveryMethod === 'email'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryMethod('key');
                  setError('');
                }}
                className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  recoveryMethod === 'key'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Backup Key</span>
              </button>
            </div>

            {recoveryMethod === 'email' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Send a one-time 6-digit recovery code to your owner email ({ownerEmailMasked}).
                  </p>
                  <button
                    type="button"
                    onClick={handleSendRecoveryEmail}
                    disabled={isSendingRecoveryEmail}
                    className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/35 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      {isSendingRecoveryEmail
                        ? 'Sending Recovery Code...'
                        : 'Send Recovery Code to Owner Email'}
                    </span>
                  </button>
                  {recoveryEmailSentNote && (
                    <p className="text-[11px] text-emerald-400 leading-relaxed">
                      {recoveryEmailSentNote}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-email-recovery-input"
                    className="block text-xs font-mono text-zinc-300 uppercase tracking-wider mb-1.5"
                  >
                    6-Digit Email Recovery Code *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    id="owner-email-recovery-input"
                    value={emailRecoveryCode}
                    onChange={(e) => {
                      setEmailRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xl font-mono font-bold tracking-[0.35em] text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="owner-backup-key-input"
                  className="block text-xs font-mono text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Saved Backup Recovery Key *
                </label>
                <input
                  type="text"
                  id="owner-backup-key-input"
                  value={backupRecoveryKeyInput}
                  onChange={(e) => {
                    setBackupRecoveryKeyInput(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ADH-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-base font-mono font-bold tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  autoFocus
                />
                {!hasRecoveryKey && (
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    If you have not generated a Backup Key inside Owner Mode yet, use the Email Code tab above.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={
                isVerifying ||
                (recoveryMethod === 'email'
                  ? emailRecoveryCode.length !== 6
                  : backupRecoveryKeyInput.trim().length < 6)
              }
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Recover & Unlock Owner Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                setError('');
              }}
              className="w-full py-2 text-xs font-mono text-zinc-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Authenticator Code</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Switch between Admin PIN (default) and Authenticator 2FA */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('pin');
                  setError('');
                }}
                className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'pin'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin PIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('totp');
                  setError('');
                }}
                className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'totp'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2FA App</span>
              </button>
            </div>

            {authMethod === 'pin' ? (
              <form onSubmit={handleVerifyAdminPin} className="space-y-4">
                <div>
                  <label
                    htmlFor="owner-admin-pin-input"
                    className="block text-xs font-mono text-zinc-300 uppercase tracking-wider mb-1.5"
                  >
                    Admin PIN / Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPinValue ? 'text' : 'password'}
                      id="owner-admin-pin-input"
                      autoComplete="current-password"
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter Admin PIN"
                      className="w-full px-4 py-3.5 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-lg font-mono font-bold tracking-[0.25em] text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinValue((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                      aria-label={showPinValue ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPinValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    Validated securely on the server against your Vercel <code className="text-zinc-400">ADMIN_PIN</code> environment variable.
                  </p>
                  {error && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !adminPinInput.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying PIN...' : 'Unlock Owner Edit Mode'}</span>
                </button>
              </form>
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
                      Connect Authenticator App
                    </div>
                    {recoveryRelinkBanner && (
                      <p className="text-xs text-emerald-400 leading-relaxed font-medium">
                        {recoveryRelinkBanner}
                      </p>
                    )}
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
                      Once connected, this QR code stays hidden across all devices.
                    </div>
                    {recoveryRelinkBanner && (
                      <button
                        type="button"
                        onClick={() => {
                          onSuccess();
                          onClose();
                        }}
                        className="text-xs font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Already scanned? Enter Owner Mode now
                      </button>
                    )}
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

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setError('');
                    }}
                    className="text-xs font-mono text-zinc-400 hover:text-amber-400 transition-colors underline underline-offset-4 cursor-pointer"
                  >
                    Lost Authenticator access? Recovery Mode
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
