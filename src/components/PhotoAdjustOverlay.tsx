import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { DesignerInfo } from '../types/portfolio';

export type PhotoAlignValue = NonNullable<DesignerInfo['heroPhotoAlign']>;

export const DEFAULT_PHOTO_ALIGN: PhotoAlignValue = {
  x: 50,
  y: 50,
  zoom: 1,
  fit: 'cover'
};

interface PhotoAdjustOverlayProps {
  align?: PhotoAlignValue;
  isOwnerMode?: boolean;
  onChange: (next: PhotoAlignValue) => void;
  positionClass?: string;
}

export const PhotoAdjustOverlay: React.FC<PhotoAdjustOverlayProps> = ({
  align,
  isOwnerMode = false,
  onChange,
  positionClass = 'top-3 left-3'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOwnerMode) return null;

  const current: PhotoAlignValue = {
    x: align?.x ?? DEFAULT_PHOTO_ALIGN.x,
    y: align?.y ?? DEFAULT_PHOTO_ALIGN.y,
    zoom: align?.zoom ?? DEFAULT_PHOTO_ALIGN.zoom,
    fit: align?.fit ?? DEFAULT_PHOTO_ALIGN.fit
  };

  return (
    <div
      className={`absolute ${positionClass} z-30`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md transition-all shadow-lg cursor-pointer"
        title="Adjust photo alignment, framing & zoom"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Align Photo</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-64 p-3.5 rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-amber-500/50 shadow-2xl space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
              Photo Framing
            </span>
            <button
              type="button"
              onClick={() => onChange(DEFAULT_PHOTO_ALIGN)}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Reset to center"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Center Reset</span>
            </button>
          </div>

          {/* Fit Mode Toggle */}
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => onChange({ ...current, fit: 'cover' })}
              className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                current.fit === 'cover'
                  ? 'bg-amber-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fill (Cover)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...current, fit: 'contain', zoom: 1 })}
              className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                current.fit === 'contain'
                  ? 'bg-amber-500 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Full Photo
            </button>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Center', x: 50, y: 50 },
              { label: 'Top', x: 50, y: 15 },
              { label: 'Left', x: 20, y: 50 },
              { label: 'Right', x: 80, y: 50 }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange({ ...current, x: preset.x, y: preset.y })}
                className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-amber-400 cursor-pointer transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* X Position Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Horizontal (X)</span>
              <span className="text-amber-400">{current.x}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={current.x}
              onChange={(e) => onChange({ ...current, x: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Y Position Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Vertical (Y)</span>
              <span className="text-amber-400">{current.y}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={current.y}
              onChange={(e) => onChange({ ...current, y: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Zoom Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>Scale / Zoom</span>
              <span className="text-amber-400">{current.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={1.8}
              step={0.05}
              value={current.zoom}
              onChange={(e) => onChange({ ...current, zoom: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Done</span>
          </button>
        </div>
      )}
    </div>
  );
};
