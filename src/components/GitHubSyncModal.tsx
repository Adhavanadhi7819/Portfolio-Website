import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { GitHubSyncStatus } from '../utils/portfolioServerSync';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubStatus: GitHubSyncStatus;
  onRefreshStatus: () => Promise<GitHubSyncStatus>;
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
  lastCommitInfo?: { sha: string; url: string; committedAt: string } | null;
  activeVersion?: number;
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
  commitMessage,
  onCommitMessageChange,
  autoPushOnSave,
  onAutoPushOnSaveChange,
  onSaveAndCommitToGitHub,
  onPullLatestFromGitHub,
  lastCommitInfo,
  activeVersion
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'setup'>('sync');
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

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setIsCheckingStatus(true);
    onRefreshStatus().finally(() => setIsCheckingStatus(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

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
          message: `Committed data.json to ${githubStatus.owner}/${githubStatus.repo} (${githubStatus.branch || 'main'})`,
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
          message: `Pulled latest data.json (${result.source === 'github' ? 'GitHub repository' : 'local repository'}${result.version ? ` · v${result.version}` : ''}).`
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

  const handleCopyEnvName = (name: string) => {
    navigator.clipboard?.writeText(name);
    setCopiedVar(name);
    window.setTimeout(() => setCopiedVar(null), 1600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-sync-modal-title"
      className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
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
                className="text-lg font-heading font-black text-white uppercase tracking-tight"
              >
                GitHub <span className="text-amber-500">CMS Sync</span>
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Permanently commits data.json to GitHub without localStorage or external DBs
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

        {/* Sub-navigation Tabs */}
        <div className="px-6 pt-4">
          <div role="tablist" aria-label="GitHub CMS views" className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sync'}
              onClick={() => setActiveTab('sync')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <GitCommitHorizontal className="w-3.5 h-3.5" />
              <span>Sync &amp; Commit</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'setup'}
              onClick={() => setActiveTab('setup')}
              className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vercel Setup Guide</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'sync' ? (
            <>
              {/* Connection Status Indicator Card */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        githubStatus.githubConfigured
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
                      {githubStatus.githubConfigured
                        ? 'GITHUB_TOKEN Connected'
                        : 'Server Token Not Configured'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isCheckingStatus}
                    className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Re-check server GitHub connection status"
                    aria-label="Refresh connection status"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin text-amber-400' : ''}`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">TOKEN</span>
                    <span
                      className={githubStatus.hasToken ? 'text-emerald-400 font-bold' : 'text-red-400'}
                    >
                      {githubStatus.hasToken ? 'SET' : 'MISSING'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">OWNER</span>
                    <span
                      className={githubStatus.hasOwner ? 'text-emerald-400 font-bold' : 'text-red-400'}
                    >
                      {githubStatus.hasOwner ? githubStatus.owner : 'MISSING'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">REPO</span>
                    <span
                      className={githubStatus.hasRepo ? 'text-emerald-400 font-bold' : 'text-red-400'}
                    >
                      {githubStatus.hasRepo ? githubStatus.repo : 'MISSING'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">BRANCH</span>
                    <span className="text-zinc-200 font-bold">{githubStatus.branch || 'main'}</span>
                  </div>
                </div>

                {!githubStatus.githubConfigured && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Add <code className="text-amber-300">GITHUB_TOKEN</code>,{' '}
                    <code className="text-amber-300">GITHUB_OWNER</code>, and{' '}
                    <code className="text-amber-300">GITHUB_REPO</code> in Vercel Environment Variables
                    so edits commit straight to <code className="text-zinc-200">data.json</code>. See the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('setup')}
                      className="text-amber-400 underline cursor-pointer"
                    >
                      Vercel Setup Guide
                    </button>{' '}
                    tab.
                  </p>
                )}
              </div>

              {/* Auto-Push on Save Toggle */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                      Auto-Push to GitHub on Save
                    </span>
                    {githubStatus.githubConfigured && (
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Every Owner Mode save commits &amp; pushes <code className="text-zinc-300">data.json</code>{' '}
                    to GitHub first. Without a successful push, the save is rolled back.
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
                  } ${githubStatus.githubConfigured ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
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
                    className="block text-xs font-mono text-zinc-300 uppercase tracking-wider"
                  >
                    Git Commit Message
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
                  placeholder="chore(portfolio): update data.json from Owner Mode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePushClick}
                  disabled={isPushing || isPulling}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CloudUpload className={`w-4 h-4 ${isPushing ? 'animate-pulse' : ''}`} />
                  <span>{isPushing ? 'Committing...' : 'Save & Commit to GitHub'}</span>
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

              {/* Feedback Banner */}
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

              {/* Last Commit Footer Info */}
              {lastCommitInfo && !feedback && (
                <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                  <span>
                    Last pushed commit:{' '}
                    <strong className="text-zinc-200">{lastCommitInfo.sha.slice(0, 7)}</strong>
                  </span>
                  {lastCommitInfo.url && (
                    <a
                      href={lastCommitInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Vercel Setup Guide Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vercel Environment Variables</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Add these environment variables in your Vercel Project Dashboard under{' '}
                  <strong className="text-white">Settings → Environment Variables</strong>, then
                  redeploy once. Tokens stay strictly server-side inside{' '}
                  <code className="text-amber-300">/api/update-portfolio</code> and are never sent to
                  browsers.
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
                          {item.required ? 'Required' : 'Optional'}
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

              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="font-mono font-bold text-zinc-200 uppercase">How Auto-Sync Works</div>
                <p>
                  1. Unlock Owner Edit Mode on your deployed site using your{' '}
                  <code className="text-zinc-200">ADMIN_PIN</code>.
                </p>
                <p>
                  2. Make edits anywhere and click Save — <code className="text-zinc-200">/api/update-portfolio</code>{' '}
                  automatically commits the updated <code className="text-zinc-200">data.json</code> to your{' '}
                  <code className="text-zinc-200">{githubStatus.branch || 'main'}</code> branch.
                </p>
                <p>
                  3. Visitors immediately receive the live updated <code className="text-zinc-200">data.json</code>{' '}
                  straight from GitHub even before Vercel finishes rebuilding.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
