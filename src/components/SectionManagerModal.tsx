import React, { useState, useRef } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import {
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Layers,
  RotateCcw,
  LayoutGrid,
  FileText,
  Award,
  GripVertical,
  Film,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { PortfolioSectionConfig, SectionTargetTab } from '../types/portfolio';
import { getSectionTargetTab } from '../utils/portfolioLogic';
import { uploadImageAsset, uploadVideoAsset } from '../utils/fileHelpers';

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: PortfolioSectionConfig[];
  initialTab?: 'manage' | 'add';
  insertTargetName?: string;
  onToggleVisibility: (sectionId: string, enabled: boolean) => void;
  onReorder: (sectionId: string, direction: 'up' | 'down') => void;
  onDragReorder?: (orderedIds: string[]) => void;
  onMoveToTab?: (sectionId: string, targetTab: SectionTargetTab) => void;
  onAddSection: (newSection: PortfolioSectionConfig) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<PortfolioSectionConfig>) => void;
  onResetSections: () => void;
}

const TAB_OPTIONS: Array<{ value: SectionTargetTab; label: string }> = [
  { value: 'hero', label: 'Home Tab' },
  { value: 'projects', label: 'Work Tab' },
  { value: 'about', label: 'About Tab' },
  { value: 'resume', label: 'Resume Tab' },
  { value: 'contact', label: 'Contact Tab' },
  { value: 'own', label: 'Own Navbar Tab' }
];

function resolveNormalizedTab(sec: PortfolioSectionConfig): SectionTargetTab {
  if (sec.targetTab) return sec.targetTab;
  const resolved = getSectionTargetTab(sec);
  if (
    resolved === 'hero' ||
    resolved === 'projects' ||
    resolved === 'about' ||
    resolved === 'resume' ||
    resolved === 'contact'
  ) {
    return resolved;
  }
  return 'own';
}

interface DraggableSectionRowProps {
  sec: PortfolioSectionConfig;
  idx: number;
  total: number;
  onReorder: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveToTab?: (sectionId: string, targetTab: SectionTargetTab) => void;
  onUpdateSection: (sectionId: string, updates: Partial<PortfolioSectionConfig>) => void;
  onToggleVisibility: (sectionId: string, enabled: boolean) => void;
  onRemoveSection: (sectionId: string) => void;
}

const DraggableSectionRow: React.FC<DraggableSectionRowProps> = ({
  sec,
  idx,
  total,
  onReorder,
  onMoveToTab,
  onUpdateSection,
  onToggleVisibility,
  onRemoveSection
}) => {
  const dragControls = useDragControls();
  const currentTabValue = resolveNormalizedTab(sec);

  return (
    <Reorder.Item
      value={sec.id}
      dragListener={false}
      dragControls={dragControls}
      layout
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      whileDrag={{
        scale: 1.015,
        boxShadow: '0 16px 36px -10px rgba(192,169,223,0.35)',
        zIndex: 20
      }}
      className={`p-3.5 rounded-xl border flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 select-none ${
        sec.enabled
          ? 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
          : 'bg-zinc-950/60 border-zinc-900 opacity-65'
      }`}
    >
      {/* Left: Drag handle, up/down, title, label */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="p-1.5 rounded-lg bg-zinc-950 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 border border-zinc-800 cursor-grab active:cursor-grabbing touch-none transition-colors shrink-0"
          title="Drag & drop to reorder section"
          aria-label={`Drag ${sec.title} to reorder`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onReorder(sec.id, 'up')}
            disabled={idx === 0}
            className={`p-0.5 rounded hover:bg-zinc-800 ${
              idx === 0
                ? 'text-zinc-700 cursor-not-allowed'
                : 'text-zinc-400 hover:text-amber-400 cursor-pointer'
            }`}
            title="Move Up"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onReorder(sec.id, 'down')}
            disabled={idx === total - 1}
            className={`p-0.5 rounded hover:bg-zinc-800 ${
              idx === total - 1
                ? 'text-zinc-700 cursor-not-allowed'
                : 'text-zinc-400 hover:text-amber-400 cursor-pointer'
            }`}
            title="Move Down"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm truncate">{sec.title}</span>
            {sec.isCustom ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                Custom
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                Core
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-zinc-500">Label:</span>
              <input
                type="text"
                value={sec.label}
                onChange={(e) => onUpdateSection(sec.id, { label: e.target.value })}
                className="bg-zinc-800/80 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700 text-[11px] w-24 focus:border-amber-400 focus:outline-none"
                placeholder="Nav link"
              />
            </div>

            {onMoveToTab && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-zinc-500">Tab:</span>
                <select
                  value={currentTabValue}
                  onChange={(e) => onMoveToTab(sec.id, e.target.value as SectionTargetTab)}
                  aria-label={`Place ${sec.title} in tab`}
                  className="bg-zinc-800/80 text-amber-300 px-2 py-0.5 rounded border border-zinc-700 text-[11px] font-mono focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {TAB_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Visibility & Delete */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onToggleVisibility(sec.id, !sec.enabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
            sec.enabled
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
          }`}
          title={sec.enabled ? 'Click to hide this section' : 'Click to show this section'}
        >
          {sec.enabled ? (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hidden</span>
            </>
          )}
        </button>

        {sec.isCustom ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Permanently delete custom section "${sec.title}"?`)) {
                onRemoveSection(sec.id);
              }
            }}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-800/80 transition-colors cursor-pointer"
            title="Delete custom section permanently"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleVisibility(sec.id, false)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
            title="Hide core section"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Reorder.Item>
  );
};

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({
  isOpen,
  onClose,
  sections,
  initialTab = 'manage',
  insertTargetName,
  onToggleVisibility,
  onReorder,
  onDragReorder,
  onMoveToTab,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onResetSections
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>(initialTab);
  const [filterTab, setFilterTab] = useState<'all' | SectionTargetTab>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newTargetTab, setNewTargetTab] = useState<SectionTargetTab>('projects');
  const [newPreset, setNewPreset] = useState<'gallery' | 'grid' | 'media' | 'text'>('gallery');
  const [initialPhotoUrl, setInitialPhotoUrl] = useState('');
  const [initialVideoUrl, setInitialVideoUrl] = useState('');
  const [isUploadingInitial, setIsUploadingInitial] = useState(false);

  const photoUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const filteredSections =
    filterTab === 'all'
      ? sortedSections
      : sortedSections.filter((s) => resolveNormalizedTab(s) === filterTab);

  const handleUploadInitialMedia = async (
    file: File | undefined,
    kind: 'image' | 'video'
  ) => {
    if (!file) return;
    setIsUploadingInitial(true);
    try {
      const url =
        kind === 'image' ? await uploadImageAsset(file) : await uploadVideoAsset(file);
      if (kind === 'image') setInitialPhotoUrl(url);
      else setInitialVideoUrl(url);
    } finally {
      setIsUploadingInitial(false);
    }
  };

  const handleCreateNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Custom Showcase';
    const label = newLabel.trim() || title.slice(0, 14);
    const id = `custom_${Date.now()}`;

    const mediaItems = [] as NonNullable<
      NonNullable<PortfolioSectionConfig['customData']>['mediaItems']
    >;
    if (initialVideoUrl.trim()) {
      mediaItems.push({
        id: `vid_${Date.now()}`,
        type: 'video',
        url: initialVideoUrl.trim(),
        title: `${title} Video`,
        caption: 'Featured gameplay / process clip'
      });
    }
    if (initialPhotoUrl.trim()) {
      mediaItems.push({
        id: `img_${Date.now() + 1}`,
        type: 'image',
        url: initialPhotoUrl.trim(),
        title: `${title} Visual`,
        caption: 'High-resolution viewport still'
      });
    }

    let customData: PortfolioSectionConfig['customData'];

    if (newPreset === 'gallery') {
      customData = {
        badge: 'VIDEO & PHOTO GALLERY',
        heading: title,
        subheading: 'Curated gameplay captures, cinematic videos, and high-resolution level art.',
        bodyText:
          'Drag, reorder, or upload photos and videos anytime in Owner Mode.',
        mediaItems:
          mediaItems.length > 0
            ? mediaItems
            : [
                {
                  id: `img_default_${Date.now()}`,
                  type: 'image',
                  url: '/showcase/shot-market-03.jpg',
                  title: 'Environment Lighting Pass',
                  caption: 'Realtime Unreal Engine viewport capture'
                }
              ],
        cards: []
      };
    } else if (newPreset === 'grid') {
      customData = {
        badge: 'MECHANICS & LEVEL FLOW',
        heading: title,
        subheading: 'Technical breakdowns and design decisions from our Unreal Engine project.',
        mediaItems,
        cards: [
          {
            id: 'c1',
            title: 'Dynamic Obstacle Clearance',
            description:
              'Tuned capsule collider traces for fluid ledge climbing and stair vaulting.',
            tag: 'Physics'
          },
          {
            id: 'c2',
            title: 'Landmark Sightlines',
            description:
              'Composed beacon towers and natural lighting vistas to guide players effortlessly.',
            tag: 'Level Flow'
          },
          {
            id: 'c3',
            title: 'Camera Lag & Damping',
            description: 'Custom spring arm rotation smoothing during sprint accelerations.',
            tag: 'Sequencer'
          }
        ]
      };
    } else if (newPreset === 'media') {
      customData = {
        badge: 'PRODUCTION DIARY',
        heading: title,
        subheading:
          'Behind-the-scenes Unreal Engine lighting studies, videos, and viewport captures.',
        bodyText:
          'Documenting the iterative journey from grey-box geometry to lit cinematic atmosphere in Unreal Engine 5.',
        imageUrl: initialPhotoUrl.trim() || '/showcase/shot-market-03.jpg',
        videoUrl: initialVideoUrl.trim() || undefined,
        mediaItems,
        cards: []
      };
    } else {
      customData = {
        badge: 'STUDIO CALLOUT',
        heading: title,
        subheading: 'Additional portfolio notes and design documentation.',
        bodyText:
          'Custom write-up detailing gameplay systems, engine benchmarks, or personal game design philosophy.',
        mediaItems,
        cards: []
      };
    }

    const newSection: PortfolioSectionConfig = {
      id,
      title,
      label,
      enabled: true,
      order: sortedSections.length,
      targetTab: newTargetTab,
      isCustom: true,
      customData
    };

    onAddSection(newSection);
    setNewTitle('');
    setNewLabel('');
    setInitialPhotoUrl('');
    setInitialVideoUrl('');
    setActiveTab('manage');
  };

  const handleReorderIds = (newOrderedIds: string[]) => {
    if (onDragReorder) {
      onDragReorder(newOrderedIds);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-black text-white uppercase tracking-tight">
                Manage &amp; Drag Sections
              </h3>
              <p className="text-xs text-zinc-400">
                Drag handles to reorder and auto-align sections, or move any section between tabs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close section manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-zinc-800/80 bg-zinc-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manage'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Arrange Sections ({sortedSections.filter((s) => s.enabled).length}/
            {sortedSections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Section</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'manage' ? (
            <div className="space-y-3">
              {/* Tab Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'hero', label: 'Home' },
                    { value: 'projects', label: 'Work' },
                    { value: 'about', label: 'About' },
                    { value: 'resume', label: 'Resume' },
                    { value: 'contact', label: 'Contact' },
                    { value: 'own', label: 'Own Tab' }
                  ].map((pill) => (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => setFilterTab(pill.value as 'all' | SectionTargetTab)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase transition-colors cursor-pointer ${
                        filterTab === pill.value
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  Drag ⋮⋮ grip to reorder
                </span>
              </div>

              <Reorder.Group
                axis="y"
                values={filteredSections.map((s) => s.id)}
                onReorder={handleReorderIds}
                className="space-y-2.5"
              >
                {filteredSections.map((sec, idx) => (
                  <DraggableSectionRow
                    key={sec.id}
                    sec={sec}
                    idx={idx}
                    total={filteredSections.length}
                    onReorder={onReorder}
                    onMoveToTab={onMoveToTab}
                    onUpdateSection={onUpdateSection}
                    onToggleVisibility={onToggleVisibility}
                    onRemoveSection={onRemoveSection}
                  />
                ))}
              </Reorder.Group>

              {filteredSections.length === 0 && (
                <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs font-mono text-zinc-500">
                  No sections assigned to this tab yet. Move a section here using the Tab dropdown or create a new section.
                </div>
              )}

              {/* Reset to Default Sections */}
              <div className="pt-4 flex items-center justify-between border-t border-zinc-800 text-xs">
                <span className="text-zinc-500 font-mono">
                  Restore original default sections &amp; tab alignment?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all sections back to original defaults?')) {
                      onResetSections();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Reset Default Sections</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNewSection} className="space-y-5">
              {insertTargetName ? (
                <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 font-mono text-[11px] block uppercase">
                      Target Insertion Position:
                    </span>
                    <span>
                      Directly below <strong>{insertTargetName}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-black/60 text-amber-400 border border-amber-500/30">
                    On-Point Insert
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  Add a section with photos, videos, cards, or text. Place it in any existing tab or give it its own Navbar tab — and drag to reorder anytime.
                </div>
              )}

              {/* Section Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-zinc-400">
                  Select Section Content Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPreset('gallery')}
                    className={`p-3.5 rounded-xl border text-left space-y-1.5 cursor-pointer transition-all ${
                      newPreset === 'gallery'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <Film className="w-4 h-4" />
                      <span>Video &amp; Photo Showcase</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Add unlimited videos (MP4/YouTube/Vimeo) and photos with captions.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPreset('grid')}
                    className={`p-3.5 rounded-xl border text-left space-y-1.5 cursor-pointer transition-all ${
                      newPreset === 'grid'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <LayoutGrid className="w-4 h-4" />
                      <span>Feature Cards Grid</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Breakdown cards + optional videos and images.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPreset('media')}
                    className={`p-3.5 rounded-xl border text-left space-y-1.5 cursor-pointer transition-all ${
                      newPreset === 'media'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <FileText className="w-4 h-4" />
                      <span>Media &amp; Story Spotlight</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Hero banner media paired with devlog notes.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPreset('text')}
                    className={`p-3.5 rounded-xl border text-left space-y-1.5 cursor-pointer transition-all ${
                      newPreset === 'text'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                      <Award className="w-4 h-4" />
                      <span>Text &amp; Callout Banner</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Studio statement, awards, or custom write-up.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title, Nav Label & Target Tab */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-zinc-300">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Level Art Breakdowns"
                    required
                    className="w-full bg-zinc-900 text-white rounded-xl px-3.5 py-2.5 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-zinc-300">
                    Navbar Tab Label *
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Breakdowns"
                    required
                    className="w-full bg-zinc-900 text-white rounded-xl px-3.5 py-2.5 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-zinc-300">
                    Place in Tab *
                  </label>
                  <select
                    value={newTargetTab}
                    onChange={(e) => setNewTargetTab(e.target.value as SectionTargetTab)}
                    className="w-full bg-zinc-900 text-amber-300 rounded-xl px-3.5 py-2.5 text-sm font-mono border border-zinc-700 focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {TAB_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Initial Photo / Video */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <span className="block text-xs font-mono uppercase text-zinc-400">
                  Optional Starter Photo &amp; Video (or add more inside the section later)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Photo URL or Upload</span>
                      <button
                        type="button"
                        onClick={() => photoUploadRef.current?.click()}
                        disabled={isUploadingInitial}
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                    <input
                      ref={photoUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleUploadInitialMedia(e.target.files?.[0], 'image')
                      }
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={initialPhotoUrl}
                      onChange={(e) => setInitialPhotoUrl(e.target.value)}
                      placeholder="/showcase/... or https://..."
                      className="w-full bg-zinc-950 text-white rounded-lg px-3 py-2 text-xs font-mono border border-zinc-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Video URL or Upload (MP4/YouTube)</span>
                      <button
                        type="button"
                        onClick={() => videoUploadRef.current?.click()}
                        disabled={isUploadingInitial}
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Video</span>
                      </button>
                    </div>
                    <input
                      ref={videoUploadRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) =>
                        handleUploadInitialMedia(e.target.files?.[0], 'video')
                      }
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={initialVideoUrl}
                      onChange={(e) => setInitialVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/... or /assets/..."
                      className="w-full bg-zinc-950 text-white rounded-lg px-3 py-2 text-xs font-mono border border-zinc-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingInitial}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isUploadingInitial ? 'Uploading...' : 'Create & Insert Section'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
