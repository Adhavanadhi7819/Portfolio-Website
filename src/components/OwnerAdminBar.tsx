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
  Briefcase
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
  hasUnsavedChanges?: boolean;
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
  hasUnsavedChanges = false
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/95 via-zinc-950/95 to-amber-950/95 border-b border-amber-500/40 text-white px-4 fixed top-0 left-0 right-0 z-[100] h-[44px] flex items-center shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Status badge */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          <div>
            <span className="font-heading font-black tracking-wider uppercase text-amber-400 text-xs sm:text-sm">
              OWNER EDIT MODE
            </span>
            <span className="text-zinc-400 font-mono text-[10px] ml-2 hidden md:inline">
              {hasUnsavedChanges
                ? 'Edits detected · Prompt to save on close'
                : 'Make edits, then click Lock when done'}
            </span>
          </div>
        </div>

        {/* Center / Right: Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={onAddProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-[11px] shadow-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          <button
            onClick={onAddChapter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 uppercase tracking-wider text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span>New Chapter</span>
          </button>

          {onOpenSectionManager && (
            <button
              onClick={onOpenSectionManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 uppercase tracking-wider text-[11px] font-bold transition-all cursor-pointer shadow-sm"
              title="Add, remove, reorder, or hide sections on the website"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sections (Add/Remove)</span>
            </button>
          )}

          {onOpenPortfolioManager && (
            <button
              onClick={onOpenPortfolioManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 uppercase tracking-wider text-[11px] font-bold transition-all cursor-pointer shadow-sm"
              title="Create new portfolios or switch between different portfolios"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Portfolios ({activePortfolioName || 'Main'})</span>
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
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-amber-300 border border-amber-500/40 text-[11px] font-mono uppercase tracking-wider focus:outline-none cursor-pointer hidden md:block"
            >
              <option value="" disabled>Edit Section...</option>
              <option value="hero">👤 Hero, Title & Stats</option>
              <option value="video_reel">🎞️ Video Reel & Source</option>
              <option value="flagship">🏴‍☠️ Latest Project & Media</option>
              <option value="about">📖 About & Timeline</option>
              <option value="resume">📄 Resume / CV</option>
              <option value="contact">✉️ Contact & Slide Photo</option>
            </select>
          )}

          <button
            onClick={onEditBio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 uppercase tracking-wider text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Settings</span>
          </button>

          <button
            onClick={onExportJson}
            title="Download JSON backup file"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Backup</span>
          </button>

          <button
            onClick={onImportJson}
            title="Restore or import portfolio JSON"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-[11px]"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Restore</span>
          </button>

          <button
            onClick={onResetDefaults}
            title="Reset to original showcase data"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer hidden lg:block"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLockMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ml-1"
          >
            <Lock className="w-3 h-3 text-red-400" />
            <span>Lock</span>
          </button>

        </div>

      </div>
    </div>
  );
};
