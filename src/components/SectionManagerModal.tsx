import React, { useState } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Layers, 
  Check, 
  Sparkles, 
  RotateCcw,
  LayoutGrid,
  FileText,
  Award
} from 'lucide-react';
import { PortfolioSectionConfig } from '../types/portfolio';
import { DEFAULT_PORTFOLIO_SECTIONS } from '../data/portfolioData';

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: PortfolioSectionConfig[];
  onToggleVisibility: (sectionId: string, enabled: boolean) => void;
  onReorder: (sectionId: string, direction: 'up' | 'down') => void;
  onAddSection: (newSection: PortfolioSectionConfig) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<PortfolioSectionConfig>) => void;
  onResetSections: () => void;
}

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({
  isOpen,
  onClose,
  sections,
  onToggleVisibility,
  onReorder,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  onResetSections
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');
  const [newTitle, setNewTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newPreset, setNewPreset] = useState<'grid' | 'media' | 'text'>('grid');

  if (!isOpen) return null;

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const handleCreateNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Custom Showcase';
    const label = newLabel.trim() || title.slice(0, 12);
    const id = `custom_${Date.now()}`;

    let customData: PortfolioSectionConfig['customData'];

    if (newPreset === 'grid') {
      customData = {
        badge: 'MECHANICS & LEVEL FLOW',
        heading: title,
        subheading: 'Technical breakdowns and design decisions from our Unreal Engine project.',
        cards: [
          {
            id: 'c1',
            title: 'Dynamic Obstacle Clearance',
            description: 'Tuned capsule collider traces for fluid ledge climbing and stair vaulting.',
            tag: 'Physics'
          },
          {
            id: 'c2',
            title: 'Landmark Sightlines',
            description: 'Composed beacon towers and natural lighting vistas to guide players effortlessly.',
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
        subheading: 'Behind-the-scenes Unreal Engine lighting studies and viewport captures.',
        bodyText: 'Documenting the iterative journey from grey-box geometry to lit cinematic atmosphere in Unreal Engine 5.',
        imageUrl: '/showcase/shot-market-03.jpg',
        cards: []
      };
    } else {
      customData = {
        badge: 'STUDIO CALLOUT',
        heading: title,
        subheading: 'Additional portfolio notes and design documentation.',
        bodyText: 'Custom write-up detailing gameplay systems, engine benchmarks, or personal game design philosophy.',
        cards: []
      };
    }

    const newSection: PortfolioSectionConfig = {
      id,
      title,
      label,
      enabled: true,
      order: sortedSections.length,
      isCustom: true,
      customData
    };

    onAddSection(newSection);
    setNewTitle('');
    setNewLabel('');
    setActiveTab('manage');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
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
                Manage Portfolio Sections
              </h3>
              <p className="text-xs text-zinc-400">
                Add, remove, reorder, or hide sections to tailor your exact portfolio presentation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close section manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-zinc-800/80 bg-zinc-900/30">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Active Sections ({sortedSections.filter(s => s.enabled).length}/{sortedSections.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
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
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2">
                <span>SECTION & NAV LABEL</span>
                <span>CONTROLS & VISIBILITY</span>
              </div>

              {sortedSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    sec.enabled
                      ? 'bg-zinc-900/50 border-zinc-800 hover:border-amber-500/40'
                      : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                  }`}
                >
                  {/* Left: Info & Reorder */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => onReorder(sec.id, 'up')}
                        disabled={idx === 0}
                        className={`p-1 rounded hover:bg-zinc-800 ${
                          idx === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-amber-400 cursor-pointer'
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorder(sec.id, 'down')}
                        disabled={idx === sortedSections.length - 1}
                        className={`p-1 rounded hover:bg-zinc-800 ${
                          idx === sortedSections.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-amber-400 cursor-pointer'
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">
                          {sec.title}
                        </span>
                        {sec.isCustom ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                            Core
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span className="font-mono text-zinc-500">Nav Label:</span>
                        <input
                          type="text"
                          value={sec.label}
                          onChange={(e) => onUpdateSection(sec.id, { label: e.target.value })}
                          className="bg-zinc-800/80 text-zinc-200 px-2 py-0.5 rounded border border-zinc-700 text-xs w-28 focus:border-amber-400 focus:outline-none"
                          placeholder="Nav link"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    
                    {/* Toggle Visibility */}
                    <button
                      onClick={() => onToggleVisibility(sec.id, !sec.enabled)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
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

                    {/* Delete Custom Section */}
                    {sec.isCustom ? (
                      <button
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
                        onClick={() => onToggleVisibility(sec.id, false)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
                        title="Hide core section"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    )}

                  </div>

                </div>
              ))}

              {/* Reset to Default Sections */}
              <div className="pt-4 flex items-center justify-between border-t border-zinc-800 text-xs">
                <span className="text-zinc-500 font-mono">
                  Need the original 8 portfolio sections back?
                </span>
                <button
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
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                Choose a template and title for your new section. Once created, you can edit every line, card, and image right on the page!
              </div>

              {/* Section Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-zinc-400">
                  Select Section Layout Preset:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPreset('grid')}
                    className={`p-4 rounded-xl border text-left space-y-2 cursor-pointer transition-all ${
                      newPreset === 'grid'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <strong className="block text-sm font-semibold">Feature Cards Grid</strong>
                    <p className="text-xs text-zinc-400">
                      Great for level design breakdowns, game mechanics, tools, or deep-dives.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPreset('media')}
                    className={`p-4 rounded-xl border text-left space-y-2 cursor-pointer transition-all ${
                      newPreset === 'media'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <strong className="block text-sm font-semibold">Media & Production Story</strong>
                    <p className="text-xs text-zinc-400">
                      Perfect for development journals, devlogs, lighting studies, and screenshots.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPreset('text')}
                    className={`p-4 rounded-xl border text-left space-y-2 cursor-pointer transition-all ${
                      newPreset === 'text'
                        ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <strong className="block text-sm font-semibold">Custom Text & Banner</strong>
                    <p className="text-xs text-zinc-400">
                      Ideal for studio statements, press coverage, or freeform announcements.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title & Nav Label */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-zinc-300">
                    Section Full Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Level Design Mechanics & Flow"
                    required
                    className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none"
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
                    placeholder="e.g. Mechanics"
                    required
                    className="w-full bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none"
                  />
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
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create & Insert Section</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-end shrink-0">
          <button
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
