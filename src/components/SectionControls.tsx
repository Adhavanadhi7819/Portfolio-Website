import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  EyeOff, 
  Trash2, 
  Settings, 
  Plus, 
  Layers 
} from 'lucide-react';

interface SectionControlsProps {
  sectionId: string;
  sectionTitle: string;
  isCustom?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  onEditSettings?: () => void;
  onAddSectionBelow?: () => void;
}

export const SectionControls: React.FC<SectionControlsProps> = ({
  sectionId,
  sectionTitle,
  isCustom = false,
  canMoveUp = true,
  canMoveDown = true,
  onMoveUp,
  onMoveDown,
  onHide,
  onDelete,
  onEditSettings,
  onAddSectionBelow
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 relative z-30">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-amber-500/40 text-xs font-mono shadow-xl backdrop-blur-md">
        
        {/* Left: Section Identity */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
          <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Section:</span>
          </span>
          <strong className="text-amber-300 font-semibold uppercase">{sectionTitle}</strong>
          {isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Custom
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Reorder Buttons */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                canMoveUp ? 'text-zinc-200 hover:text-amber-400 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Move Section Up"
              aria-label="Move Section Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                canMoveDown ? 'text-zinc-200 hover:text-amber-400 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Move Section Down"
              aria-label="Move Section Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Section Settings */}
          {onEditSettings && (
            <button
              onClick={onEditSettings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-amber-500/50 transition-all cursor-pointer"
              title="Edit Section Content / Settings"
            >
              <Settings className="w-3 h-3 text-amber-400" />
              <span>Edit</span>
            </button>
          )}

          {/* Add Section Below */}
          {onAddSectionBelow && (
            <button
              onClick={onAddSectionBelow}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 transition-all cursor-pointer font-bold"
              title="Add a new section right below this one"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Section</span>
            </button>
          )}

          {/* Hide or Delete Section */}
          {isCustom ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 hover:border-red-600 transition-all cursor-pointer"
              title="Delete this custom section permanently"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          ) : (
            <button
              onClick={onHide}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-300 border border-zinc-800 hover:border-red-800 transition-all cursor-pointer"
              title="Hide this section (can be restored anytime in Manage Sections)"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide Section</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
