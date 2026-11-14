import React from 'react';
import { 
  Plus, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Lock, 
  Sparkles, 
  Film, 
  Layers,
  Gamepad2,
  FileCode,
  Briefcase,
  ShieldCheck,
  Inbox,
  GitBranch,
  Palette
} from 'lucide-react';

import { EditModalMode } from './OwnerEditModal';

interface OwnerAdminBarProps {
  onAddProject: () => void;
  onAddChapter: () => void;
  onEditBio: () => void;
  onOpenSection?: (mode: EditModalMode) => void;
  onOpenSectionManager?: () => void;
  activePortfolioName?: string;
  onOpenPortfolioManager?: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onResetDefaults: () => void;
  onLockMode: () => void;
  onOpenSecurity?: () => void;
  onOpenGitHubSync?: () => void;
  githubConfigured?: boolean;
  lastCommitSha?: string | null;
  hasUnsavedChanges?: boolean;
  syncStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isStaticHost?: boolean;
  onOpenInbox?: () => void;
  unreadMessageCount?: number;
  onOpenBackgroundEditor?: () => void;
}

export const OwnerAdminBar: React.FC<OwnerAdminBarProps> = ({
  onAddProject,
  onAddChapter,
  onEditBio,
  onOpenSection,
  onOpenSectionManager,
  activePortfolioName,
  onOpenPortfolioManager,
  onExportJson,
  onImportJson,
  onResetDefaults,
  onLockMode,
  onOpenSecurity,
  onOpenGitHubSync,
  githubConfigured = false,
  lastCommitSha = null,
  hasUnsavedChanges = false,
  syncStatus = 'idle',
  isStaticHost = false,
  onOpenInbox,
  unreadMessageCount = 0,
  onOpenBackgroundEditor
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/95 via-zinc-950/95 to-amber-950/95 border-b border-amber-500/40 text-white px-3 sm:px-4 fixed top-0 left-0 right-0 z-[100] h-[44px] flex items-center shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl w-full mx-auto flex flex-nowrap items-center justify-between gap-2 text-xs overflow-x-auto scrollbar-none">
        
        {/* Left: Status badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-500 shrink-0"></span>
          <div className="flex items-center whitespace-nowrap">
            <span className="font-heading font-black tracking-wider uppercase text-amber-400 text-[11px] sm:text-xs">
              OWNER EDIT MODE
            </span>
            <span className="text-zinc-400 font-mono text-[10px] ml-2 hidden 2xl:inline">
              {syncStatus === 'saving'
                ? githubConfigured
                  ? 'Committing...'
                  : 'Saving...'
                : syncStatus === 'error'
                ? 'Sync paused'
                : githubConfigured
                ? lastCommitSha
                  ? `GitHub (${lastCommitSha.slice(0, 7)})`
                  : 'GitHub Auto-Push'
                : isStaticHost
                ? 'Setup GITHUB_TOKEN'
                : syncStatus === 'saved'
                ? 'Saved to data.json'
                : hasUnsavedChanges
                ? 'Edits detected'
                : 'Live CMS'}
            </span>
          </div>
        </div>

        {/* Center / Right: Action buttons */}
        <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5 shrink-0">
          
          <button
            onClick={onAddProject}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-[10px] shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Project</span>
          </button>

          <button
            onClick={onAddChapter}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 uppercase tracking-wider text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Film className="w-3 h-3" />
            <span>Chapter</span>
          </button>

          {onOpenSectionManager && (
            <button
              onClick={onOpenSectionManager}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 uppercase tracking-wider text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
              title="Add, remove, reorder, or hide sections on the website"
            >
              <Layers className="w-3 h-3" />
              <span>Sections</span>
            </button>
          )}

          {onOpenBackgroundEditor && (
            <button
              onClick={onOpenBackgroundEditor}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-400 text-cyan-300 hover:text-black border border-cyan-400/50 uppercase tracking-wider text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
              title="Open Background Editor (3D Plexus HEX & RGB Color Studio)"
            >
              <Palette className="w-3 h-3" />
              <span>Background Editor</span>
            </button>
          )}

          {onOpenPortfolioManager && (
            <button
              onClick={onOpenPortfolioManager}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 uppercase tracking-wider text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm max-w-[140px]"
              title={`Portfolios (${activePortfolioName || 'Main'})`}
            >
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="truncate">Portfolios</span>
            </button>
          )}

          {onOpenSection && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onOpenSection(e.target.value as EditModalMode);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              aria-label="Select section to edit"
              className="px-2 py-1 rounded-lg bg-zinc-900 text-amber-300 border border-amber-500/40 text-[10px] font-mono uppercase tracking-wider focus:outline-none cursor-pointer hidden 2xl:block"
            >
              <option value="" disabled>Edit Section...</option>
              <option value="hero">Hero, Title &amp; Stats</option>
              <option value="video_reel">Video Reel &amp; Source</option>
              <option value="flagship">Latest Project &amp; Media</option>
              <option value="about">About &amp; Timeline</option>
              <option value="resume">Resume / CV</option>
              <option value="contact">Contact &amp; Slide Photo</option>
            </select>
          )}

          <button
            onClick={onEditBio}
            title="Global Hero & Portfolio Settings"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 uppercase tracking-wider text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Settings className="w-3 h-3 text-amber-400" />
            <span className="hidden 2xl:inline">Settings</span>
          </button>

          <button
            onClick={onExportJson}
            title="Download or Restore JSON backup file"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer hidden 2xl:flex items-center gap-1 text-[10px]"
          >
            <Download className="w-3 h-3 text-zinc-400" />
          </button>

          <button
            onClick={onImportJson}
            title="Restore or import portfolio JSON"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer hidden 2xl:flex items-center gap-1 text-[10px]"
          >
            <Upload className="w-3 h-3 text-zinc-400" />
          </button>

          <button
            onClick={onResetDefaults}
            title="Reset to original showcase data"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer hidden xl:block"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {onOpenGitHubSync && (
            <button
              onClick={onOpenGitHubSync}
              title="Open GitHub Repository Sync (data.json) — Commit, Push & Pull"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                syncStatus === 'error'
                  ? 'bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-500/60'
                  : githubConfigured
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  syncStatus === 'saving'
                    ? 'bg-amber-400 animate-pulse'
                    : syncStatus === 'error'
                    ? 'bg-red-400'
                    : githubConfigured
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <GitBranch className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">
                {syncStatus === 'saving'
                  ? 'Pushing...'
                  : githubConfigured
                  ? 'GitHub Sync'
                  : 'Commit GitHub'}
              </span>
            </button>
          )}

          {onOpenInbox && (
            <button
              onClick={onOpenInbox}
              title="View received Direct Messages & test email forwarding"
              className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/35 uppercase tracking-wider text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Inbox className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Inbox</span>
              {unreadMessageCount > 0 && (
                <span className="px-1 rounded bg-amber-500 text-black text-[9px] font-mono font-bold leading-tight">
                  {unreadMessageCount}
                </span>
              )}
            </button>
          )}

          {onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              title="Owner Security & Auth Settings"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/35 uppercase tracking-wider text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Auth</span>
            </button>
          )}

          <button
            onClick={onLockMode}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Lock className="w-3 h-3 text-red-400" />
            <span>Lock</span>
          </button>

        </div>

      </div>
    </div>
  );
};
