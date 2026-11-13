import React, { useState, useEffect } from 'react';
import {
  X,
  Inbox,
  Mail,
  Trash2,
  CheckCheck,
  Copy,
  Check,
  Send,
  Loader2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import {
  ContactMessageRecord,
  fetchOwnerMessages,
  markOwnerMessageRead,
  deleteOwnerMessage,
  sendTestOwnerEmail
} from '../utils/portfolioServerSync';

interface OwnerInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export const OwnerInboxModal: React.FC<OwnerInboxModalProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange
}) => {
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [recipientEmail, setRecipientEmail] = useState<string>('prabuprabu906@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOwnerMessages();
      setMessages(data.messages || []);
      setRecipientEmail(data.recipientEmail || 'prabuprabu906@gmail.com');
      onUnreadCountChange(data.unreadCount || 0);
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED'
          ? 'Please unlock Owner Mode with your 2FA code to view your inbox.'
          : 'Could not load inbox messages.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadMessages();
    setTestNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      const data = await markOwnerMessageRead(id, true);
      setMessages(data.messages);
      onUnreadCountChange(data.unreadCount);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const data = await deleteOwnerMessage(id);
      setMessages(data.messages);
      onUnreadCountChange(data.unreadCount);
    } catch {}
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestNotice(null);
    try {
      const res = await sendTestOwnerEmail();
      setTestNotice(res.deliveryNote || `Test email sent to ${res.recipientEmail}`);
    } catch (err) {
      setTestNotice(err instanceof Error ? err.message : 'Test email failed.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unreadCount = messages.filter((m) => !m.read).length;
  const hasActivationPending = messages.some((m) => m.deliveryStatus === 'activation_pending');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-inbox-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[86vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="owner-inbox-title"
                className="text-lg font-heading font-black text-white uppercase tracking-tight flex items-center gap-2"
              >
                <span>Direct Messages Inbox</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold">
                    {unreadCount} NEW
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-zinc-400 truncate">
                Forwarding to: <span className="text-amber-400">{recipientEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title={`Send a verification test email to ${recipientEmail}`}
            >
              {isSendingTest ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Test Email</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => handleMarkRead('all')}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close inbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notices */}
        {(testNotice || hasActivationPending) && (
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {testNotice && <p className="font-mono">{testNotice}</p>}
              {hasActivationPending && !testNotice && (
                <p className="font-mono">
                  First-time email relay activation pending: open{' '}
                  <strong>{recipientEmail}</strong> (check Inbox/Spam) and click the one-time
                  &ldquo;Activate Form&rdquo; link from FormSubmit so all future inquiries forward
                  directly to Gmail.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs font-mono text-zinc-400">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <span>Loading messages...</span>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-950/40 border border-red-800/50 text-xs font-mono text-red-300 text-center">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-200">No inquiries received yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Messages submitted via your Contact form are saved permanently here and forwarded to{' '}
                <strong className="text-zinc-300">{recipientEmail}</strong>. Click{' '}
                <strong>Test Email</strong> above to verify Gmail delivery right now.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 sm:p-5 rounded-xl border transition-colors space-y-3 ${
                  msg.read
                    ? 'bg-zinc-900/40 border-zinc-800/80'
                    : 'bg-zinc-900/90 border-amber-500/45 shadow-lg'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{msg.name}</span>
                      {!msg.read && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-bold uppercase">
                          Unread
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 text-[10px] font-mono">
                        {msg.projectType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <span>{msg.senderEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(msg.id, msg.senderEmail)}
                        className="text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Copy sender email"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[11px] font-mono text-zinc-500 block">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-mono inline-block px-2 py-0.5 rounded ${
                        msg.deliveryStatus === 'sent'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : msg.deliveryStatus === 'activation_pending'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {msg.deliveryStatus === 'sent'
                        ? 'Forwarded to Mail'
                        : msg.deliveryStatus === 'activation_pending'
                        ? 'Activate Link Sent to Gmail'
                        : 'Saved in Inbox'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800/70">
                  {msg.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={`mailto:${msg.senderEmail}?subject=${encodeURIComponent(
                      `Re: ${msg.projectType} — Adhavan Portfolio`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply by Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {!msg.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(msg.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono cursor-pointer transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/70 text-zinc-400 hover:text-red-400 border border-zinc-800 cursor-pointer transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
