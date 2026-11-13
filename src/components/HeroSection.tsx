import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Download, Edit3, Compass, Mail, Plus, Trash2, X } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';
import { PhotoAdjustOverlay, DEFAULT_PHOTO_ALIGN } from './PhotoAdjustOverlay';

interface HeroSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditHero?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  onPlayReel?: () => void;
  onExploreProjects: () => void;
  onJumpToChapter?: (chapterId: string) => void;
  onOpenResume?: () => void;
  onOpenContact?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const HeroSection: React.FC<HeroSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditHero,
  onUpdateDesignerInfo,
  onExploreProjects,
  onOpenResume,
  onOpenContact,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const defaultStats = [
    { number: '6+', label: 'Unreal Environments & Levels' },
    { number: '3D RPG', label: 'Flagship Game In Progress' },
    { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
    { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
  ];

  const stats = Array.isArray(designerInfo.heroStats)
    ? designerInfo.heroStats.filter(
        (s) => isOwnerMode || Boolean(s.number?.trim() || s.label?.trim())
      )
    : defaultStats;

  const defaultDisciplines = [
    'Game Design',
    'Level Layout',
    'Vehicle Rigging',
    '3D Arts (Maya)'
  ];

  const disciplines = Array.isArray(designerInfo.heroDisciplines)
    ? designerInfo.heroDisciplines.filter((d) => isOwnerMode || Boolean(d?.trim()))
    : defaultDisciplines;

  const [isEditingDisciplines, setIsEditingDisciplines] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState('');

  const portraitUrl =
    designerInfo.heroPhotoUrl ||
    '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png';

  const photoAlign = designerInfo.heroPhotoAlign || DEFAULT_PHOTO_ALIGN;

  const handleAddStat = () => {
    const next = [...stats, { number: 'New', label: 'Add stat description' }];
    onUpdateDesignerInfo?.({ heroStats: next });
  };

  const handleRemoveStat = (removeIdx: number) => {
    const next = stats.filter((_, i) => i !== removeIdx);
    onUpdateDesignerInfo?.({ heroStats: next });
  };

  const handleUpdateDiscipline = (idx: number, val: string) => {
    const next = [...disciplines];
    next[idx] = val;
    onUpdateDesignerInfo?.({ heroDisciplines: next });
  };

  const handleRemoveDiscipline = (removeIdx: number) => {
    const next = disciplines.filter((_, i) => i !== removeIdx);
    onUpdateDesignerInfo?.({ heroDisciplines: next });
  };

  const handleAddDiscipline = () => {
    const trimmed = newDiscipline.trim();
    if (!trimmed) return;
    onUpdateDesignerInfo?.({ heroDisciplines: [...disciplines, trimmed] });
    setNewDiscipline('');
  };

  return (
    <section
      id="hero"
      className="relative pt-20 sm:pt-24 pb-8 sm:pb-10 flex-1 flex flex-col justify-center overflow-hidden bg-[#050507]"
    >
      {/* Subtle atmospheric glow */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      <motion.div
        animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.04, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[420px] bg-amber-500/8 blur-[140px] rounded-full pointer-events-none"
      />

      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="hero"
          sectionTitle="Hero & Introduction"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditHero}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Kicker, Headline, Lead Copy, Actions */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7 space-y-5"
          >
            {/* Clean Unboxed Kicker Line */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
              className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold"
            >
              <InlineEdit
                value={designerInfo.name || 'ADHAVAN'}
                onSave={(val) => onUpdateDesignerInfo?.({ name: val })}
                isOwnerMode={isOwnerMode}
                label="Designer Name"
                className="text-white font-bold"
              />
              <span className="text-zinc-600">—</span>
              <InlineEdit
                value={designerInfo.heroBadge || 'Unreal Engine 5 & Autodesk Maya'}
                onSave={(val) => onUpdateDesignerInfo?.({ heroBadge: val })}
                isOwnerMode={isOwnerMode}
                label="Hero Kicker Subtitle"
                className="text-amber-400"
              />
            </motion.div>

            {/* Primary Display Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-white leading-[1.06]"
            >
              <InlineEdit
                value={designerInfo.title || 'Game Designer | 3D Artist'}
                onSave={(val) => onUpdateDesignerInfo?.({ title: val })}
                isOwnerMode={isOwnerMode}
                label="Role / Hero Headline"
                as="span"
              />
            </motion.h1>

            {/* Lead Narrative Copy */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: EASE_OUT_EXPO }}
              className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed font-normal"
            >
              <InlineEdit
                value={designerInfo.tagline}
                onSave={(val) => onUpdateDesignerInfo?.({ tagline: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Hero Tagline"
                as="p"
              />
            </motion.div>

            {/* Action Buttons Row */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22, ease: EASE_OUT_EXPO }}
              className="pt-2 flex flex-wrap items-center gap-3.5"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={onExploreProjects}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors flex items-center gap-2.5 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-black" />
                <span>Explore Works</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={() => onOpenResume?.()}
                className="px-5 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-xl text-sm transition-colors flex items-center gap-2 font-mono cursor-pointer"
                title="Open Resume & Download"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{designerInfo.resumePdfUrl ? 'Download Resume' : 'View Resume'}</span>
              </motion.button>

              {onOpenContact && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={onOpenContact}
                  className="px-5 py-3 bg-zinc-950 hover:bg-zinc-900 text-amber-300 border border-amber-500/35 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Get In Touch</span>
                </motion.button>
              )}

              {isOwnerMode && (
                <button
                  onClick={onEditHero}
                  className="px-3.5 py-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Hero</span>
                </button>
              )}
            </motion.div>

            {/* Clean Typographic Specializations Quick-Links (Editable Add / Edit / Remove in Owner Mode) */}
            {(disciplines.length > 0 || isOwnerMode) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.28, ease: EASE_OUT_EXPO }}
                className="pt-4 border-t border-zinc-800/80 space-y-2.5 text-xs font-mono"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-zinc-500 uppercase tracking-wider">Focus Disciplines:</span>

                  {disciplines.map((item, idx, arr) => (
                    <React.Fragment key={`${idx}-${item}`}>
                      <span className="inline-flex items-center gap-1.5 group/disc">
                        {isOwnerMode ? (
                          <>
                            <span className="text-zinc-200 inline-flex items-center gap-1">
                              <InlineEdit
                                value={item}
                                onSave={(val) => handleUpdateDiscipline(idx, val)}
                                isOwnerMode={isOwnerMode}
                                label="Discipline Name"
                                as="span"
                              />
                              <ArrowUpRight className="w-3 h-3 opacity-60 text-amber-400" />
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDiscipline(idx)}
                              className="p-0.5 rounded bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
                              title={`Remove ${item}`}
                              aria-label={`Remove ${item}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={onExploreProjects}
                            className="text-zinc-300 hover:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{item}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-60" />
                          </button>
                        )}
                      </span>
                      {idx < arr.length - 1 && <span className="text-zinc-700">/</span>}
                    </React.Fragment>
                  ))}

                  {isOwnerMode && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDisciplines((v) => !v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>{isEditingDisciplines ? 'Done' : 'Add'}</span>
                    </button>
                  )}
                </div>

                {isOwnerMode && isEditingDisciplines && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 max-w-md">
                    <input
                      type="text"
                      value={newDiscipline}
                      onChange={(e) => setNewDiscipline(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDiscipline();
                        }
                      }}
                      placeholder="Add discipline (e.g. Blueprints)..."
                      className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddDiscipline}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Add Discipline
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Right Column: Clean Portrait Card (Photo Only — No Video Player Overlay) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <div className="relative group max-w-sm sm:max-w-md lg:max-w-none mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500/20 via-zinc-800/10 to-amber-500/25 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />

              <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                {/* Clean Unobstructed Portrait Photo Frame */}
                <div className="relative aspect-[4/4] sm:aspect-[4/4.1] w-full overflow-hidden bg-zinc-950">
                  <div className="w-full h-full group-hover:scale-[1.03] transition-transform duration-700 ease-out">
                    <img
                      src={portraitUrl}
                      alt={`${designerInfo.name} — ${designerInfo.title}`}
                      style={{
                        objectPosition: `${photoAlign.x}% ${photoAlign.y}%`,
                        transform: `scale(${photoAlign.zoom})`
                      }}
                      className={`w-full h-full transition-all duration-300 ${
                        photoAlign.fit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/30 via-transparent to-transparent pointer-events-none" />

                  {/* Owner Photo Alignment & Zoom Editor */}
                  <PhotoAdjustOverlay
                    align={photoAlign}
                    isOwnerMode={isOwnerMode}
                    onChange={(next) => onUpdateDesignerInfo?.({ heroPhotoAlign: next })}
                    positionClass="top-3 left-3"
                  />

                  {/* Owner Direct Photo Upload */}
                  <MediaUploadOverlay
                    currentUrl={portraitUrl}
                    mediaType="image"
                    isOwnerMode={isOwnerMode}
                    onMediaUploaded={(newUrl) => onUpdateDesignerInfo?.({ heroPhotoUrl: newUrl })}
                    label="Upload Hero Photo"
                    position="top-right"
                  />
                </div>

                {/* Clean Card Footer: Subtle Availability Watermark + Direct Inquiry */}
                <div className="px-4 sm:px-5 py-3.5 bg-zinc-950/95 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-mono">
                  <span className="text-[11px] text-zinc-400/55 tracking-wide truncate select-none min-w-0">
                    {designerInfo.status || 'Open to Game Studio Roles & Freelance Design'}
                  </span>
                  <button
                    onClick={() => (onOpenContact ? onOpenContact() : onExploreProjects())}
                    className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium cursor-pointer shrink-0"
                  >
                    <span>Direct Inquiry</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width Auto-Aligning Benchmark KPI Row (Scales Cleanly for Any Item Count) */}
        {(stats.length > 0 || isOwnerMode) && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34, ease: EASE_OUT_EXPO }}
            className="mt-7 sm:mt-8 pt-6 border-t border-zinc-800/80 relative"
          >
            {isOwnerMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono text-zinc-500">
                  Auto-aligns row width cleanly as stats are added or removed
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleAddStat}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    title="Add a new stat block"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Stat</span>
                  </button>
                  <button
                    type="button"
                    onClick={onEditHero}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    title="Edit all stat counters"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Stats</span>
                  </button>
                </div>
              </div>
            )}

            {stats.length > 0 ? (
              <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] text-zinc-400 font-mono text-xs">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className={`relative group/stat px-5 py-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/40 transition-colors flex flex-col justify-center min-w-0 ${
                      isOwnerMode ? 'pr-10' : ''
                    }`}
                  >
                    {isOwnerMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStat(idx)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-md bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
                        title="Remove this stat"
                        aria-label={`Remove stat ${stat.number || idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div
                      className={`text-xl sm:text-2xl font-bold font-heading tabular-nums truncate ${
                        idx % 2 === 1 ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      <InlineEdit
                        value={stat.number}
                        onSave={(val) => {
                          const next = [...stats];
                          next[idx] = { ...next[idx], number: val };
                          onUpdateDesignerInfo?.({ heroStats: next });
                        }}
                        isOwnerMode={isOwnerMode}
                        label="Stat Value"
                        as="span"
                      />
                    </div>
                    <div className="text-zinc-400 mt-0.5 leading-snug">
                      <InlineEdit
                        value={stat.label}
                        onSave={(val) => {
                          const next = [...stats];
                          next[idx] = { ...next[idx], label: val };
                          onUpdateDesignerInfo?.({ heroStats: next });
                        }}
                        isOwnerMode={isOwnerMode}
                        label="Stat Label"
                        as="span"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              isOwnerMode && (
                <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs font-mono text-zinc-500">
                  All stat items removed. Click <strong className="text-amber-400">+ Add Stat</strong> above to add one anytime.
                </div>
              )
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};
