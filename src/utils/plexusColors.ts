import { PlexusBackgroundConfig } from '../types/portfolio';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const DEFAULT_PLEXUS_PALETTE_HEXES: string[] = [
  '#00f0ff', // Electric Cyan
  '#2563eb', // Deep Cobalt Blue
  '#c026d3', // Neon Magenta / Purple
  '#10b981', // Emerald Teal
  '#f43f5e', // Warm Coral
  '#f59e0b'  // Amber Accent
];

export const DEFAULT_PLEXUS_BACKGROUND_CONFIG: PlexusBackgroundConfig = {
  enabled: true,
  voidInnerHex: '#080c18',
  voidOuterHex: '#03050a',
  paletteHexes: [...DEFAULT_PLEXUS_PALETTE_HEXES],
  colorCycleEnabled: true,
  cycleSpeed: 1,
  nodeDensity: 1,
  facetOpacity: 0.13,
  cursorRadius: 180,
  cursorMode: 'attract'
};

export interface PlexusPreset {
  id: string;
  name: string;
  description: string;
  config: PlexusBackgroundConfig;
}

export const PLEXUS_BACKGROUND_PRESETS: PlexusPreset[] = [
  {
    id: 'neon-cyber',
    name: 'Cyber Constellation',
    description: 'Electric cyan, cobalt, neon magenta, emerald, coral & amber',
    config: { ...DEFAULT_PLEXUS_BACKGROUND_CONFIG, paletteHexes: [...DEFAULT_PLEXUS_PALETTE_HEXES] }
  },
  {
    id: 'lilac-studio',
    name: 'Lilac Studio Void',
    description: 'Signature Adhavan lilac violet, cobalt, cyan & silver highlights',
    config: {
      ...DEFAULT_PLEXUS_BACKGROUND_CONFIG,
      voidInnerHex: '#0e0a1a',
      voidOuterHex: '#03050a',
      paletteHexes: ['#c0a9df', '#876cae', '#2563eb', '#00f0ff', '#c026d3']
    }
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Biometrics',
    description: 'Deep marine void with glowing emerald, cyan & deep blue facets',
    config: {
      ...DEFAULT_PLEXUS_BACKGROUND_CONFIG,
      voidInnerHex: '#061418',
      voidOuterHex: '#020509',
      paletteHexes: ['#10b981', '#00f0ff', '#0ea5e9', '#2563eb', '#34d399']
    }
  },
  {
    id: 'solar-horizon',
    name: 'Solar Flare Horizon',
    description: 'Coral, amber, crimson & royal violet crystalline mesh',
    config: {
      ...DEFAULT_PLEXUS_BACKGROUND_CONFIG,
      voidInnerHex: '#130816',
      voidOuterHex: '#03050a',
      paletteHexes: ['#f43f5e', '#f59e0b', '#c026d3', '#2563eb', '#fb7185']
    }
  }
];

export function clampChannel(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(255, Math.round(val)));
}

export function normalizeHex(input: string): string | null {
  if (typeof input !== 'string') return null;
  let cleaned = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    cleaned = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }
  return `#${cleaned.toLowerCase()}`;
}

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const raw = normalized.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16)
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clampChannel(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function parseRgbString(input: string): RgbColor | null {
  if (typeof input !== 'string') return null;
  const match = input
    .trim()
    .match(/^(?:rgb\s*\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/i);
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if (r > 255 || g > 255 || b > 255) return null;
  return { r: clampChannel(r), g: clampChannel(g), b: clampChannel(b) };
}

export function formatRgbLabel(hex: string): string {
  const rgb = hexToRgb(hex) || { r: 0, g: 240, b: 255 };
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function lerpRgb(a: RgbColor, b: RgbColor, t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamped),
    g: Math.round(a.g + (b.g - a.g) * clamped),
    b: Math.round(a.b + (b.b - a.b) * clamped)
  };
}

export function rgbaStr(rgb: RgbColor, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a.toFixed(3)})`;
}

export function sampleCycledColor(palette: RgbColor[], phase: number): RgbColor {
  if (palette.length === 0) {
    return { r: 0, g: 240, b: 255 };
  }
  if (palette.length === 1) {
    return palette[0];
  }
  const len = palette.length;
  const wrapped = ((phase % len) + len) % len;
  const idx = Math.floor(wrapped);
  const nextIdx = (idx + 1) % len;
  const frac = wrapped - idx;
  return lerpRgb(palette[idx], palette[nextIdx], frac);
}

export function getResolvedBackgroundConfig(
  cfg?: Partial<PlexusBackgroundConfig> | null
): PlexusBackgroundConfig {
  const base = DEFAULT_PLEXUS_BACKGROUND_CONFIG;
  if (!cfg) {
    return { ...base, paletteHexes: [...base.paletteHexes] };
  }
  const normalizedPalette = Array.isArray(cfg.paletteHexes)
    ? cfg.paletteHexes
        .map((h) => normalizeHex(h))
        .filter((h): h is string => Boolean(h))
    : [];

  return {
    enabled: cfg.enabled !== undefined ? Boolean(cfg.enabled) : base.enabled,
    voidInnerHex: normalizeHex(cfg.voidInnerHex || '') || base.voidInnerHex,
    voidOuterHex: normalizeHex(cfg.voidOuterHex || '') || base.voidOuterHex,
    paletteHexes:
      normalizedPalette.length > 0 ? normalizedPalette : [...base.paletteHexes],
    colorCycleEnabled:
      cfg.colorCycleEnabled !== undefined
        ? Boolean(cfg.colorCycleEnabled)
        : base.colorCycleEnabled,
    cycleSpeed:
      typeof cfg.cycleSpeed === 'number' && Number.isFinite(cfg.cycleSpeed)
        ? Math.max(0.15, Math.min(3, cfg.cycleSpeed))
        : base.cycleSpeed,
    nodeDensity:
      typeof cfg.nodeDensity === 'number' && Number.isFinite(cfg.nodeDensity)
        ? Math.max(0.4, Math.min(1.5, cfg.nodeDensity))
        : base.nodeDensity,
    facetOpacity:
      typeof cfg.facetOpacity === 'number' && Number.isFinite(cfg.facetOpacity)
        ? Math.max(0.04, Math.min(0.28, cfg.facetOpacity))
        : base.facetOpacity,
    cursorRadius:
      typeof cfg.cursorRadius === 'number' && Number.isFinite(cfg.cursorRadius)
        ? Math.max(80, Math.min(320, cfg.cursorRadius))
        : base.cursorRadius,
    cursorMode: cfg.cursorMode === 'repel' ? 'repel' : 'attract'
  };
}
