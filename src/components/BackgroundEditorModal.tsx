import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Palette,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { PlexusBackgroundConfig } from '../types/portfolio';
import {
  DEFAULT_PLEXUS_BACKGROUND_CONFIG,
  PLEXUS_BACKGROUND_PRESETS,
  clampChannel,
  formatRgbLabel,
  getResolvedBackgroundConfig,
  hexToRgb,
  normalizeHex,
  parseRgbString,
  rgbToHex
} from '../utils/plexusColors';

interface BackgroundEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: Partial<PlexusBackgroundConfig> | null;
  onLiveChange: (next: PlexusBackgroundConfig) => void;
  onSaveAndCommit: (next: PlexusBackgroundConfig) => void;
}

interface ColorHexRgbRowProps {
  label: string;
  hint?: string;
  hex: string;
  onChangeHex: (nextHex: string) => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

const ColorHexRgbRow: React.FC<ColorHexRgbRowProps> = ({
  label,
  hint,
  hex,
  onChangeHex,
  onRemove,
  canRemove = false
}) => {
  const safeHex = normalizeHex(hex) || '#00f0ff';
  const rgb = hexToRgb(safeHex) || { r: 0, g: 240, b: 255 };

  const [hexDraft, setHexDraft] = useState(safeHex.toUpperCase());
  const [rgbStringDraft, setRgbStringDraft] = useState(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
  const [copiedType, setCopiedType] = useState<'hex' | 'rgb' | null>(null);

  useEffect(() => {
    setHexDraft(safeHex.toUpperCase());
    setRgbStringDraft(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }, [safeHex, rgb.r, rgb.g, rgb.b]);

  const handleHexTyping = (raw: string) => {
    setHexDraft(raw.toUpperCase());
    const valid = normalizeHex(raw);
    if (valid) {
      onChangeHex(valid);
    }
  };

  const handleChannelChange = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    const nextRgb = {
      ...rgb,
      [channel]: clampChannel(num)
    };
    onChangeHex(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const handleRgbTextTyping = (raw: string) => {
    setRgbStringDraft(raw);
    const parsed = parseRgbString(raw);
    if (parsed) {
      onChangeHex(rgbToHex(parsed.r, parsed.g, parsed.b));
    }
  };

  const copyValue = async (value: string, type: 'hex' | 'rgb') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1400);
    } catch {}
  };

  return (
    <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/90 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <label className="relative cursor-pointer shrink-0" title={`Pick ${label} color`}>
            <span
              className="block w-8 h-8 rounded-lg border border-white/20 shadow-inner"
              style={{ backgroundColor: safeHex }}
            />
            <input
              type="color"
              value={safeHex}
              onChange={(e) => onChangeHex(e.target.value)}
              className="sr-only"
              aria-label={`${label} color picker`}
            />
          </label>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{label}</div>
            {hint && <div className="text-[10px] font-mono text-zinc-400 truncate">{hint}</div>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => copyValue(safeHex.toUpperCase(), 'hex')}
            className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy HEX code"
          >
            {copiedType === 'hex' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400" />
            )}
            <span>HEX</span>
          </button>
          <button
            type="button"
            onClick={() => copyValue(formatRgbLabel(safeHex), 'rgb')}
            className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy RGB code"
          >
            {copiedType === 'rgb' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400" />
            )}
            <span>RGB</span>
          </button>
          {canRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded bg-zinc-950 hover:bg-red-950/70 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
              title="Remove color swatch"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Synchronized HEX + R / G / B Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-4">
          <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
            HEX Code
          </label>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => handleHexTyping(e.target.value)}
            onBlur={() => setHexDraft(safeHex.toUpperCase())}
            placeholder="#00F0FF"
            maxLength={7}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs font-mono text-amber-300 focus:outline-none uppercase"
          />
        </div>

        <div className="sm:col-span-4 grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[9px] font-mono uppercase text-zinc-500 mb-1 text-center">
              R
            </label>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.r}
              onChange={(e) => handleChannelChange('r', e.target.value)}
              className="w-full px-1.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs font-mono text-white text-center focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono uppercase text-zinc-500 mb-1 text-center">
              G
            </label>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.g}
              onChange={(e) => handleChannelChange('g', e.target.value)}
              className="w-full px-1.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs font-mono text-white text-center focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono uppercase text-zinc-500 mb-1 text-center">
              B
            </label>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.b}
              onChange={(e) => handleChannelChange('b', e.target.value)}
              className="w-full px-1.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs font-mono text-white text-center focus:outline-none"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
            RGB Code
          </label>
          <input
            type="text"
            value={rgbStringDraft}
            onChange={(e) => handleRgbTextTyping(e.target.value)}
            onBlur={() => setRgbStringDraft(`${rgb.r}, ${rgb.g}, ${rgb.b}`)}
            placeholder="0, 240, 255"
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs font-mono text-zinc-200 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export const BackgroundEditorModal: React.FC<BackgroundEditorModalProps> = ({
  isOpen,
  onClose,
  config,
  onLiveChange,
  onSaveAndCommit
}) => {
  const [initialSnapshot, setInitialSnapshot] = useState<PlexusBackgroundConfig>(
    getResolvedBackgroundConfig(config)
  );
  const [draft, setDraft] = useState<PlexusBackgroundConfig>(
    getResolvedBackgroundConfig(config)
  );

  useEffect(() => {
    if (isOpen) {
      const resolved = getResolvedBackgroundConfig(config);
      setInitialSnapshot(resolved);
      setDraft(resolved);
    }
    // Only reset snapshot when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const applyDraft = (next: PlexusBackgroundConfig) => {
    setDraft(next);
    onLiveChange(next);
  };

  const handleCancel = () => {
    onLiveChange(initialSnapshot);
    onClose();
  };

  const handleSave = () => {
    onSaveAndCommit(draft);
    onClose();
  };

  const handleAddSwatch = () => {
    if (draft.paletteHexes.length >= 8) return;
    const fallbackColors = ['#00f0ff', '#2563eb', '#c026d3', '#10b981', '#f43f5e', '#f59e0b'];
    const nextColor = fallbackColors[draft.paletteHexes.length % fallbackColors.length];
    applyDraft({
      ...draft,
      paletteHexes: [...draft.paletteHexes, nextColor]
    });
  };

  const handleUpdateSwatch = (idx: number, nextHex: string) => {
    const updated = draft.paletteHexes.map((item, i) => (i === idx ? nextHex : item));
    applyDraft({ ...draft, paletteHexes: updated });
  };

  const handleRemoveSwatch = (idx: number) => {
    if (draft.paletteHexes.length <= 1) return;
    applyDraft({
      ...draft,
      paletteHexes: draft.paletteHexes.filter((_, i) => i !== idx)
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="background-editor-title"
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950/92 border border-amber-500/40 shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="background-editor-title"
                    className="text-base sm:text-lg font-heading font-black text-white uppercase tracking-tight truncate"
                  >
                    Background Editor
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400 truncate">
                    Live 3D Plexus Constellation · Synchronized HEX &amp; RGB color controls
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                aria-label="Close Background Editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Live Spectrum Ribbon & Master Toggle */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Spectrum Preview</span>
                  </div>
                  <div
                    className="h-3 w-full rounded-full border border-white/10 shadow-inner"
                    style={{
                      background: `linear-gradient(90deg, ${draft.voidOuterHex}, ${draft.paletteHexes.join(
                        ', '
                      )}, ${draft.voidInnerHex})`
                    }}
                  />
                </div>

                <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => applyDraft({ ...draft, enabled: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {draft.enabled ? '3D Plexus Active' : 'Plexus Paused'}
                  </span>
                </label>
              </div>

              {/* Quick Theme Presets */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                  Quick Constellation Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PLEXUS_BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        applyDraft({
                          ...draft,
                          voidInnerHex: preset.config.voidInnerHex,
                          voidOuterHex: preset.config.voidOuterHex,
                          paletteHexes: [...preset.config.paletteHexes]
                        })
                      }
                      className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{preset.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{preset.description}</div>
                      </div>
                      <div className="flex items-center -space-x-1 shrink-0">
                        {preset.config.paletteHexes.slice(0, 4).map((hex, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-zinc-950"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Void Canvas Gradient Colors (HEX + RGB) */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                  Deep Space Void Gradient (HEX &amp; RGB)
                </span>
                <div className="space-y-2.5">
                  <ColorHexRgbRow
                    label="Void Radial Center"
                    hint="Default: #080C18 · rgb(8, 12, 24)"
                    hex={draft.voidInnerHex}
                    onChangeHex={(hex) => applyDraft({ ...draft, voidInnerHex: hex })}
                  />
                  <ColorHexRgbRow
                    label="Void Deep Vignette Edge"
                    hint="Default: #03050A · rgb(3, 5, 10)"
                    hex={draft.voidOuterHex}
                    onChangeHex={(hex) => applyDraft({ ...draft, voidOuterHex: hex })}
                  />
                </div>
              </div>

              {/* Dynamic Cycling Mesh Palette (HEX + RGB) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Plexus Node, Line &amp; Shard Palette ({draft.paletteHexes.length}/8)
                  </span>
                  {draft.paletteHexes.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAddSwatch}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Color</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {draft.paletteHexes.map((hex, idx) => (
                    <ColorHexRgbRow
                      key={`palette-${idx}`}
                      label={`Constellation Color #${idx + 1}`}
                      hint={`${hex.toUpperCase()} · ${formatRgbLabel(hex)}`}
                      hex={hex}
                      onChangeHex={(nextHex) => handleUpdateSwatch(idx, nextHex)}
                      canRemove={draft.paletteHexes.length > 1}
                      onRemove={() => handleRemoveSwatch(idx)}
                    />
                  ))}
                </div>
              </div>

              {/* Motion, Polygonal Facets & Cursor Behavior */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                  Geometry, Cycling &amp; Cursor Physics
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <span className="font-mono text-zinc-200">Smooth Color Cycling</span>
                    <input
                      type="checkbox"
                      checked={draft.colorCycleEnabled}
                      onChange={(e) =>
                        applyDraft({ ...draft, colorCycleEnabled: e.target.checked })
                      }
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="font-mono text-zinc-200">Cursor Field</span>
                    <div className="flex items-center gap-1">
                      {(['attract', 'repel'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => applyDraft({ ...draft, cursorMode: mode })}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase cursor-pointer transition-colors ${
                            draft.cursorMode === mode
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] text-zinc-300">
                      <span>Cycle Speed</span>
                      <span className="text-amber-400">{draft.cycleSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2.5}
                      step={0.05}
                      value={draft.cycleSpeed}
                      onChange={(e) =>
                        applyDraft({ ...draft, cycleSpeed: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] text-zinc-300">
                      <span>Triangle Facet Opacity</span>
                      <span className="text-amber-400">{draft.facetOpacity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.22}
                      step={0.01}
                      value={draft.facetOpacity}
                      onChange={(e) =>
                        applyDraft({ ...draft, facetOpacity: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] text-zinc-300">
                      <span>Node Density</span>
                      <span className="text-amber-400">{Math.round(draft.nodeDensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.4}
                      step={0.05}
                      value={draft.nodeDensity}
                      onChange={(e) =>
                        applyDraft({ ...draft, nodeDensity: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] text-zinc-300">
                      <span>Cursor Link Radius</span>
                      <span className="text-amber-400">{Math.round(draft.cursorRadius)}px</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={280}
                      step={10}
                      value={draft.cursorRadius}
                      onChange={(e) =>
                        applyDraft({ ...draft, cursorRadius: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="px-6 py-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  applyDraft({
                    ...DEFAULT_PLEXUS_BACKGROUND_CONFIG,
                    paletteHexes: [...DEFAULT_PLEXUS_BACKGROUND_CONFIG.paletteHexes]
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Neon Default</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Save Background</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
