import React, { useState } from 'react';
import { Lock, Unlock, X, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { verifyOwnerPasscode } from '../utils/portfolioLogic';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPasscode: string;
  onUpdatePasscode: (newPasscode: string) => void;
  isAlreadyOwner: boolean;
  onLockOwnerMode: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPasscode,
  onUpdatePasscode,
  isAlreadyOwner,
  onLockOwnerMode
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPasscode(passcode, currentPasscode)) {
      setError('');
      setPasscode('');
      onSuccess();
      onClose();
    } else {
      setError('Incorrect owner passcode. Please check and try again.');
    }
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim() || newPasscode.trim().length < 3) {
      setError('New passcode must be at least 3 characters.');
      return;
    }
    onUpdatePasscode(newPasscode.trim());
    setChangeSuccess(true);
    setError('');
    setTimeout(() => {
      setChangeSuccess(false);
      setShowChangePasscode(false);
      setNewPasscode('');
    }, 2000);
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg shadow-amber-500/10">
            {isAlreadyOwner ? <Unlock className="w-7 h-7 text-amber-400" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 id="owner-auth-title" className="text-2xl font-heading font-black text-white uppercase tracking-tight">
            Owner <span className="text-amber-500">Access</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {isAlreadyOwner 
              ? 'Owner Mode is currently active. You can edit content across the portfolio or lock it back for visitors.'
              : 'Enter your owner passcode to unlock full editing and management rights.'}
          </p>
        </div>

        {isAlreadyOwner ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400" />
              <span>You are currently authenticated as <strong>Adhavan (Portfolio Owner)</strong>. All edit buttons are visible.</span>
            </div>

            {showChangePasscode ? (
              <form onSubmit={handleChangePasscode} className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-mono text-zinc-300 uppercase tracking-wider">
                  Set New Passcode
                </label>
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new owner passcode"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {changeSuccess && (
                  <p className="text-xs text-amber-400">Passcode updated successfully!</p>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase"
                  >
                    Save New Passcode
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePasscode(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasscode(true)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider border border-zinc-800 transition-colors"
                >
                  Change Owner Passcode
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLockOwnerMode();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Lock & Exit Owner Mode
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="owner-passcode-input" className="block text-xs font-mono text-zinc-300 uppercase tracking-wider mb-1.5">
                Owner Passcode *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="owner-passcode-input"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter owner passcode"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {error && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Hint for initial setup */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed font-mono">
              <span className="text-amber-400 font-bold block mb-0.5">DEFAULT OWNER PASSCODE:</span>
              Use <strong className="text-white">906</strong> to unlock. You can customize this passcode anytime.
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Unlock Owner Mode
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
