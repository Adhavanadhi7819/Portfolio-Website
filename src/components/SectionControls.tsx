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
  const handleRemove = () => {
    if (isCustom && onDelete) {
      onDelete();
    } else if (onHide) {
      onHide();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 relative z-30">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-zinc-950/95 border border-amber-500/40 text-xs font-mono shadow-xl backdrop-blur-md">
        
        {/* Left: Section Identity */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse shadow-sm shadow-amber-500/50"></span>
          <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Section:</span>
          </span>
          <strong className="text-amber-400 font-semibold uppercase">{sectionTitle}</strong>
          {isCustom && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              Custom Section
            </span>
          )}
        </div>

        {/* Right: On-point Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Reorder Up / Down */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`p-1.5 rounded transition-colors ${
                canMoveUp ? 'text-zinc-200 hover:text-amber-400 hover:bg-zinc-800 cursor-pointer' : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Move Section Up"
              aria-label="Move Section Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`p-1.5 rounded transition-colors ${
                canMoveDown ? 'text-zinc-200 hover:text-amber-400 hover:bg-zinc-800 cursor-pointer' : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Move Section Down"
              aria-label="Move Section Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Section Content */}
          {onEditSettings && (
            <button
              onClick={onEditSettings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-amber-500/50 transition-all cursor-pointer"
              title="Edit Section Content / Settings"
            >
              <Settings className="w-3 h-3 text-amber-400" />
              <span>Edit</span>
            </button>
          )}

          {/* On-Point Add Section Below */}
          {onAddSectionBelow && (
            <button
              onClick={onAddSectionBelow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer shadow-sm hover:scale-105"
              title={`Add a new section directly below ${sectionTitle}`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Section Below</span>
            </button>
          )}

          {/* On-Point Remove Section */}
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/60 hover:border-red-500 transition-all cursor-pointer text-[11px] font-bold uppercase tracking-wider"
            title={`Remove the "${sectionTitle}" section from your portfolio`}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Remove Section</span>
          </button>

        </div>

      </div>
    </div>
  );
};
