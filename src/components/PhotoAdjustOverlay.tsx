import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { PhotoAlignConfig } from '../types/portfolio';

export type PhotoAlignValue = PhotoAlignConfig;

export const DEFAULT_PHOTO_ALIGN: PhotoAlignValue = {
  x: 50,
  y: 50,
  zoom: 1,
  fit: 'cover'
};

export function getPhotoAlignImgProps(align?: PhotoAlignConfig): {
  fitClass: string;
  style: React.CSSProperties;
} {
  const x = align?.x ?? DEFAULT_PHOTO_ALIGN.x;
  const y = align?.y ?? DEFAULT_PHOTO_ALIGN.y;
  const zoom = align?.zoom ?? DEFAULT_PHOTO_ALIGN.zoom;
  const fit = align?.fit ?? DEFAULT_PHOTO_ALIGN.fit;
  return {
    fitClass: fit === 'contain' ? 'object-contain' : 'object-cover',
    style: {
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${zoom})`,
      transformOrigin: `${x}% ${y}%`
    }
  };
}

interface PhotoAdjustOverlayProps {
  align?: PhotoAlignValue;
  isOwnerMode?: boolean;
  onChange: (next: PhotoAlignValue) => void;
  positionClass?: string;
  compact?: boolean;
  staticPosition?: boolean;
}

export const PhotoAdjustOverlay: React.FC<PhotoAdjustOverlayProps> = ({
  align,
  isOwnerMode = false,
  onChange,
  positionClass = 'top-3 left-3',
  compact = false,
  staticPosition = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const current: PhotoAlignValue = {
    x: align?.x ?? DEFAULT_PHOTO_ALIGN.x,
    y: align?.y ?? DEFAULT_PHOTO_ALIGN.y,
    zoom: align?.zoom ?? DEFAULT_PHOTO_ALIGN.zoom,
    fit: align?.fit ?? DEFAULT_PHOTO_ALIGN.fit
  };

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const panelWidth = 256;
      const panelHeight = 320;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - panelWidth - 12);
      }
      let top = rect.bottom + 8;
      if (top + panelHeight > window.innerHeight - 12 && rect.top - panelHeight - 8 > 12) {
        top = rect.top - panelHeight - 8;
      }
      setCoords({ top, left });
    };

    updatePosition();

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOwnerMode) return null;

  return (
    <div
      className={`${staticPosition ? 'relative' : `absolute ${positionClass}`} z-30`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`flex items-center gap-1 rounded-lg bg-black/85 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/45 font-mono font-bold uppercase tracking-wider backdrop-blur-md transition-all shadow-lg cursor-pointer ${
          compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px] gap-1.5'
        }`}
        title="Adjust photo alignment, framing & zoom"
      >
        <SlidersHorizontal className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{compact ? 'Align' : 'Align Photo'}</span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[180] w-64 p-3.5 rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-amber-500/50 shadow-2xl space-y-3 text-xs font-mono"
          >
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
          </div>,
          document.body
        )}
    </div>
  );
};

interface PhotoAlignInlineControlProps {
  imageUrl?: string;
  align?: PhotoAlignConfig;
  onChange: (next: PhotoAlignConfig) => void;
  label?: string;
  aspectClass?: string;
}

export const PhotoAlignInlineControl: React.FC<PhotoAlignInlineControlProps> = ({
  imageUrl,
  align,
  onChange,
  label = 'Photo Alignment & Framing',
  aspectClass = 'aspect-video'
}) => {
  const current: PhotoAlignValue = {
    x: align?.x ?? DEFAULT_PHOTO_ALIGN.x,
    y: align?.y ?? DEFAULT_PHOTO_ALIGN.y,
    zoom: align?.zoom ?? DEFAULT_PHOTO_ALIGN.zoom,
    fit: align?.fit ?? DEFAULT_PHOTO_ALIGN.fit
  };
  const { fitClass, style } = getPhotoAlignImgProps(current);

  return (
    <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5 text-[11px] font-mono">
      <div className="flex items-center justify-between gap-2">
        <span className="uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{label}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PHOTO_ALIGN)}
          className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {imageUrl && (
          <div className={`sm:col-span-4 ${aspectClass} rounded-lg overflow-hidden border border-zinc-800 bg-black`}>
            <img
              src={imageUrl}
              alt="Alignment preview"
              style={style}
              className={`w-full h-full ${fitClass}`}
            />
          </div>
        )}

        <div className={`${imageUrl ? 'sm:col-span-8' : 'sm:col-span-12'} space-y-2`}>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...current, fit: 'cover' })}
              className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer border transition-colors ${
                current.fit === 'cover'
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              Fill (Cover)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...current, fit: 'contain', zoom: 1 })}
              className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer border transition-colors ${
                current.fit === 'contain'
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              Full Photo (Fit)
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[
              { name: 'Center', x: 50, y: 50 },
              { name: 'Top', x: 50, y: 15 },
              { name: 'Left', x: 20, y: 50 },
              { name: 'Right', x: 80, y: 50 }
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onChange({ ...current, x: p.x, y: p.y })}
                className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 hover:text-amber-400 cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>X</span>
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
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>Y</span>
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
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>Zoom</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

