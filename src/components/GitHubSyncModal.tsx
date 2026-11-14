import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GitBranch,
  GitCommitHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Upload,
  KeyRound,
  Trash2
} from 'lucide-react';
import {
  GitHubSyncStatus,
  savePreviewGitHubToken,
  clearPreviewGitHubToken
} from '../utils/portfolioServerSync';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubStatus: GitHubSyncStatus;
  onRefreshStatus: () => Promise<GitHubSyncStatus>;
  onStatusUpdated?: (status: GitHubSyncStatus) => void;
  commitMessage: string;
  onCommitMessageChange: (msg: string) => void;
  autoPushOnSave: boolean;
  onAutoPushOnSaveChange: (enabled: boolean) => void;
  onSaveAndCommitToGitHub: (customMessage?: string) => Promise<{
    ok: boolean;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  }>;
  onPullLatestFromGitHub: () => Promise<{
    ok: boolean;
    source?: string;
    version?: number;
    error?: string;
  }>;
  onDownloadDataJson?: () => void;
  onImportDataJson?: (jsonText: string) => { ok: boolean; error?: string };
  lastCommitInfo?: { sha: string; url: string; committedAt: string } | null;
  activeVersion?: number;
  lastUpdatedAt?: string;
}

const VERCEL_ENV_VARS = [
  {
    name: 'GITHUB_TOKEN',
    required: true,
    desc: 'Server-only GitHub Personal Access Token with Contents: Read and Write permission (do NOT use VITE_GITHUB_TOKEN).'
  },
  {
    name: 'GITHUB_OWNER',
    required: false,
    desc: 'GitHub username or org owning the repo. Auto-detected from VERCEL_GIT_REPO_OWNER when Vercel System Env Vars are enabled.'
  },
  {
    name: 'GITHUB_REPO',
    required: false,
    desc: 'Repository name containing data.json. Auto-detected from VERCEL_GIT_REPO_SLUG when Vercel System Env Vars are enabled.'
  },
  {
    name: 'ADMIN_PIN',
    required: false,
    desc: 'Secret Admin PIN validated server-side to unlock Owner Edit Mode and authorize GitHub commits (defaults to 906 if unset).'
  },
  {
    name: 'GITHUB_BRANCH',
    required: false,
    desc: 'Target branch to commit data.json updates to. Auto-detected from VERCEL_GIT_COMMIT_REF or defaults to main.'
  }
];

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  githubStatus,
  onRefreshStatus,
  onStatusUpdated,
  commitMessage,
  onCommitMessageChange,
  autoPushOnSave,
  onAutoPushOnSaveChange,
  onSaveAndCommitToGitHub,
  onPullLatestFromGitHub,
  onDownloadDataJson,
  onImportDataJson,
  lastCommitInfo,
  activeVersion,
  lastUpdatedAt
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'setup' | 'json'>('sync');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    commitSha?: string;
    commitUrl?: string;
  } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Preview server token connector (only shown in local/AI Studio preview if GITHUB_TOKEN is missing)
  const [showTokenConnect, setShowTokenConnect] = useState(false);
  const [previewTokenInput, setPreviewTokenInput] = useState('');
  const [previewOwnerInput, setPreviewOwnerInput] = useState('');
  const [previewRepoInput, setPreviewRepoInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);

  // JSON import input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setShowTokenConnect(false);
    setPreviewTokenInput('');
    setIsCheckingStatus(true);
    onRefreshStatus()
      .then((s) => {
        setPreviewOwnerInput(s.owner || 'Adhavanadhi7819');
        setPreviewRepoInput(s.repo || 'Portfolio-Website');
      })
      .finally(() => setIsCheckingStatus(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isVercelRuntime = githubStatus.runtime === 'vercel';
  const repoLabel =
    githubStatus.owner && githubStatus.repo
      ? `${githubStatus.owner}/${githubStatus.repo}`
      : 'Adhavanadhi7819/Portfolio-Website';

  const formattedLastSynced = (() => {
    const iso = lastCommitInfo?.committedAt || lastUpdatedAt;
    if (!iso) return 'Just now';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  })();

  const handleRefresh = async () => {
    setIsCheckingStatus(true);
    setFeedback(null);
    try {
      await onRefreshStatus();
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePushClick = async () => {
    setIsPushing(true);
    setFeedback(null);
    try {
      const result = await onSaveAndCommitToGitHub(commitMessage);
      if (result.ok) {
        setFeedback({
          type: 'success',
          message: `Committed data.json to ${repoLabel} (${githubStatus.branch || 'main'})`,
          commitSha: result.commitSha,
          commitUrl: result.commitUrl
        });
      } else {
        setFeedback({
          type: 'error',
          message:
            result.error ||
            'Could not commit changes to GitHub. Check GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'GitHub commit failed.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullClick = async () => {
    setIsPulling(true);
    setFeedback(null);
    try {
      const result = await onPullLatestFromGitHub();
      if (result.ok) {
        setFeedback({
          type: 'success',
          message: `Pulled latest data.json from ${repoLabel}${result.version ? ` · v${result.version}` : ''}.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Could not pull latest data.json from GitHub.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Pull from GitHub failed.'
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleConnectPreviewToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewTokenInput.trim()) return;
    setIsSavingToken(true);
    setFeedback(null);
    try {
      const res = await savePreviewGitHubToken({
        token: previewTokenInput.trim(),
        owner: previewOwnerInput.trim() || undefined,
        repo: previewRepoInput.trim() || undefined,
        branch: githubStatus.branch || 'main'
      });
      if (res.ok && res.status) {
        onStatusUpdated?.(res.status);
        setShowTokenConnect(false);
        setPreviewTokenInput('');
        setFeedback({
          type: 'success',
          message: `Preview server connected to ${res.status.owner}/${res.status.repo}. Edits here now commit straight to GitHub!`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Could not verify GitHub token.'
        });
      }
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleClearPreviewToken = async () => {
    const next = await clearPreviewGitHubToken();
    onStatusUpdated?.(next);
    setFeedback({
      type: 'success',
      message: 'Disconnected preview GitHub token.'
    });
  };

  const handleCopyEnvName = (name: string) => {
    navigator.clipboard?.writeText(name);
    setCopiedVar(name);
    window.setTimeout(() => setCopiedVar(null), 1600);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportDataJson) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const res = onImportDataJson(text);
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: 'Imported data.json into portfolio.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Invalid portfolio JSON file.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-sync-modal-title"
      className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="github-sync-modal-title"
                className="text-base sm:text-lg font-heading font-black text-white tracking-tight"
              >
                GitHub Repository Sync (<code className="text-amber-400 font-mono text-sm">data.json</code>)
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Direct Contents API commits — zero localStorage dependency
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close GitHub Sync modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Underline Tabs */}
        <div className="px-5 sm:px-6 border-b border-zinc-800/90 bg-zinc-900/30">
          <div role="tablist" aria-label="GitHub CMS views" className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sync'}
              onClick={() => setActiveTab('sync')}
              className={`py-3 text-[11px] sm:text-xs font-mono font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sync'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Commit &amp; Repo Status
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'setup'}
              onClick={() => setActiveTab('setup')}
              className={`py-3 text-[11px] sm:text-xs font-mono font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === 'setup'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Vercel Token Setup Guide
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'json'}
              onClick={() => setActiveTab('json')}
              className={`py-3 text-[11px] sm:text-xs font-mono font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Download / Import <code className="text-[11px]">data.json</code>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'sync' ? (
            <>
              {/* Feedback Banner at top if error or success */}
              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/50 border-red-500/40 text-red-300'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="leading-relaxed">{feedback.message}</p>
                    {feedback.commitSha && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-black/50 border border-emerald-500/30">
                          SHA: {feedback.commitSha.slice(0, 7)}
                        </span>
                        {feedback.commitUrl && (
                          <a
                            href={feedback.commitUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-300 hover:text-white underline"
                          >
                            <span>View Commit on GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Server Connection Status Card */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Server Connection Status
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                        feedback?.type === 'error'
                          ? 'bg-red-950/50 border-red-500/40 text-red-300'
                          : githubStatus.githubConfigured
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {feedback?.type === 'error' ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Commit Error</span>
                        </>
                      ) : githubStatus.githubConfigured ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Connected &amp; Synced</span>
                        </>
                      ) : (
                        <>
                          <CloudDownload className="w-3 h-3" />
                          <span>Pull Ready · Connect Token to Push</span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isCheckingStatus}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Refresh GitHub connection status"
                      aria-label="Refresh connection status"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin text-amber-400' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* 4-cell Repository Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-1">
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Target Repository
                    </span>
                    <span className="block text-zinc-100 font-semibold truncate">{repoLabel}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-1">
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Branch &amp; File Path
                    </span>
                    <span className="block text-zinc-100 font-semibold">
                      {githubStatus.branch || 'main'} · /data.json
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-1">
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Server GITHUB_TOKEN
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          githubStatus.hasToken
                            ? 'text-emerald-400 font-semibold'
                            : 'text-amber-400 font-semibold'
                        }
                      >
                        {githubStatus.hasToken
                          ? githubStatus.tokenSource === 'preview-file'
                            ? 'Connected in Preview Server'
                            : 'Configured in Server Env'
                          : 'Not Set in Preview Env'}
                      </span>
                      {!isVercelRuntime && githubStatus.tokenSource === 'preview-file' && (
                        <button
                          type="button"
                          onClick={handleClearPreviewToken}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Disconnect preview token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-1">
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Last Synced
                    </span>
                    <span className="block text-zinc-200 font-semibold">
                      {formattedLastSynced}
                    </span>
                  </div>
                </div>

                {/* Inline Preview Token Connect Form (only when missing in local/AI Studio preview) */}
                {!githubStatus.hasToken && !isVercelRuntime && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-2.5">
                    {!showTokenConnect ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-zinc-300">
                          Vercel already has <code className="text-amber-300">GITHUB_TOKEN</code>. Connect a token here if you also want to push directly from AI Studio Preview.
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTokenConnect(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 font-mono font-bold uppercase text-[10px] transition-colors cursor-pointer shrink-0"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Connect Preview Token</span>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleConnectPreviewToken} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold uppercase text-amber-400">
                            Server-Side Preview GitHub Token
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTokenConnect(false)}
                            className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={previewOwnerInput}
                            onChange={(e) => setPreviewOwnerInput(e.target.value)}
                            placeholder="Owner (Adhavanadhi7819)"
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                          />
                          <input
                            type="text"
                            value={previewRepoInput}
                            onChange={(e) => setPreviewRepoInput(e.target.value)}
                            placeholder="Repo (Portfolio-Website)"
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={previewTokenInput}
                            onChange={(e) => setPreviewTokenInput(e.target.value)}
                            placeholder="github_pat_... (stored strictly server-side, never in browser)"
                            className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSavingToken}
                            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                          >
                            {isSavingToken ? 'Verifying...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Latest Commit Link */}
                {lastCommitInfo && (
                  <div className="pt-1 flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <GitCommitHorizontal className="w-3.5 h-3.5" />
                      <span>Latest Commit: {lastCommitInfo.sha.slice(0, 7)}</span>
                    </span>
                    {lastCommitInfo.url && (
                      <a
                        href={lastCommitInfo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-[11px] transition-colors"
                      >
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Mandatory Auto-Push Enforcement Card */}
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                      Auto-Commit &amp; Push on Every Save
                    </span>
                    {githubStatus.githubConfigured && (
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Every Owner Mode edit commits &amp; pushes <code className="text-zinc-300">data.json</code>{' '}
                    first. Without a successful GitHub push, changes are rolled back.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={githubStatus.githubConfigured ? true : autoPushOnSave}
                  disabled={githubStatus.githubConfigured}
                  onClick={() => onAutoPushOnSaveChange(!autoPushOnSave)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                    githubStatus.githubConfigured || autoPushOnSave
                      ? 'bg-amber-500 border-amber-400'
                      : 'bg-zinc-800 border-zinc-700'
                  } ${githubStatus.githubConfigured ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                      githubStatus.githubConfigured || autoPushOnSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Customizable Git Commit Message Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="github-commit-message-input"
                    className="block text-xs font-mono text-zinc-300"
                  >
                    GitHub Commit Message
                  </label>
                  {activeVersion ? (
                    <span className="text-[10px] font-mono text-zinc-500">
                      data.json v{activeVersion}
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  id="github-commit-message-input"
                  value={commitMessage}
                  onChange={(e) => onCommitMessageChange(e.target.value)}
                  placeholder="chore(portfolio): update data.json via Owner Mode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePushClick}
                  disabled={isPushing || isPulling}
                  className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CloudUpload className={`w-4 h-4 ${isPushing ? 'animate-pulse' : ''}`} />
                  <span>{isPushing ? 'Committing...' : 'Commit data.json to GitHub'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullClick}
                  disabled={isPulling || isPushing}
                  className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-100 border border-zinc-700 font-bold uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CloudDownload className={`w-4 h-4 text-amber-400 ${isPulling ? 'animate-pulse' : ''}`} />
                  <span>{isPulling ? 'Pulling...' : 'Pull Latest from GitHub'}</span>
                </button>
              </div>
            </>
          ) : activeTab === 'setup' ? (
            /* Vercel Setup Guide Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vercel Environment Variables</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  In Vercel under <strong className="text-white">Settings → Environment Variables</strong>, keep only server-side variables (never <code className="text-red-300">VITE_GITHUB_TOKEN</code>). With <strong className="text-white">System Environment Variables</strong> enabled, owner/repo/branch are auto-detected.
                </p>
              </div>

              <div className="space-y-2.5">
                {VERCEL_ENV_VARS.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono font-bold text-amber-300">
                          {item.name}
                        </code>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            item.required
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.required ? 'Required' : 'Auto / Optional'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyEnvName(item.name)}
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
                        title={`Copy ${item.name}`}
                      >
                        {copiedVar === item.name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Download / Import data.json Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Backup &amp; Restore Central data.json
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Export your full portfolio snapshot (sections, custom videos/photos, projects, resume, and timeline) as <code className="text-zinc-100">data.json</code> or restore from a saved backup file.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {onDownloadDataJson && (
                    <button
                      type="button"
                      onClick={onDownloadDataJson}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download data.json</span>
                    </button>
                  )}

                  {onImportDataJson && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={handleImportFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Import data.json</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
