import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Download,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  Edit3,
  Video,
  Check,
  Trash2,
  FileCode2,
  Plus,
  X
} from 'lucide-react';
import { ProjectItem, DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { uploadVideoAsset } from '../utils/fileHelpers';

interface FlagshipGameFeatureProps {
  flagshipProject?: ProjectItem;
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditFlagship?: (project: ProjectItem) => void;
  onEditFlagshipDetails?: () => void;
  onPlayWalkthrough?: (timestamp: number) => void;
  onOpenProjectModal?: (projectId: string) => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

const DEFAULT_SPEC_ROWS = [
  { label: 'Engine', value: 'Unreal Engine 5' },
  { label: 'Genre', value: 'To Be Updated' },
  { label: 'Platform', value: 'Windows PC Build' },
  { label: 'Status', value: 'Playable Build In Progress' }
];

export const FlagshipGameFeature: React.FC<FlagshipGameFeatureProps> = ({
  designerInfo,
  isOwnerMode = false,
  onEditFlagshipDetails,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const hasBuildVideo = Boolean(designerInfo?.flagshipVideoUrl?.trim());
  const [gameUrlDraft, setGameUrlDraft] = useState(designerInfo?.flagshipGameUrl || '');
  const [gameLabelDraft, setGameLabelDraft] = useState(
    designerInfo?.flagshipGameLabel || 'Download Playable Build'
  );
  const [videoUrlDraft, setVideoUrlDraft] = useState(designerInfo?.flagshipVideoUrl || '');
  const [linkSavedToast, setLinkSavedToast] = useState(false);

  useEffect(() => {
    setGameUrlDraft(designerInfo?.flagshipGameUrl || '');
    setGameLabelDraft(designerInfo?.flagshipGameLabel || 'Download Playable Build');
    setVideoUrlDraft(designerInfo?.flagshipVideoUrl || '');
  }, [
    designerInfo?.flagshipGameUrl,
    designerInfo?.flagshipGameLabel,
    designerInfo?.flagshipVideoUrl
  ]);

  const specRows =
    designerInfo?.flagshipSpecRows && designerInfo.flagshipSpecRows.length > 0
      ? designerInfo.flagshipSpecRows
      : DEFAULT_SPEC_ROWS;

  const gameDownloadUrl = designerInfo?.flagshipGameUrl?.trim();
  const gameDownloadLabel =
    designerInfo?.flagshipGameLabel?.trim() || 'Download Playable Build';

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDesignerInfo?.({
      flagshipGameUrl: gameUrlDraft.trim(),
      flagshipGameLabel: gameLabelDraft.trim() || 'Download Playable Build',
      flagshipVideoUrl: videoUrlDraft.trim()
    });
    setLinkSavedToast(true);
    setTimeout(() => setLinkSavedToast(false), 2500);
  };

  const handleBuildVideoUpload = async (file: File) => {
    try {
      const videoUrl = await uploadVideoAsset(file);
      setVideoUrlDraft(videoUrl);
      onUpdateDesignerInfo?.({ flagshipVideoUrl: videoUrl });
      setLinkSavedToast(true);
      setTimeout(() => setLinkSavedToast(false), 2500);
    } catch (err) {
      console.error('Gameplay video upload failed:', err);
    }
  };

  const handleUpdateSpecRow = (idx: number, field: 'label' | 'value', val: string) => {
    const next = [...specRows];
    next[idx] = { ...next[idx], [field]: val };
    onUpdateDesignerInfo?.({ flagshipSpecRows: next });
  };

  const handleAddSpecRow = () => {
    onUpdateDesignerInfo?.({
      flagshipSpecRows: [...specRows, { label: 'Spec', value: 'Add details...' }]
    });
  };

  const handleRemoveSpecRow = (idx: number) => {
    if (specRows.length <= 1) return;
    onUpdateDesignerInfo?.({
      flagshipSpecRows: specRows.filter((_, i) => i !== idx)
    });
  };

  return (
    <section
      id="flagship"
      className="pt-20 sm:pt-24 pb-12 sm:pb-14 relative overflow-hidden bg-gradient-to-b from-[#09090d] via-[#0b0a10] to-[#050507]"
    >
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="flagship"
          sectionTitle="Latest Project Showcase"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditFlagshipDetails}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      {/* Subtle monochromatic lilac backdrop glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[440px] h-[440px] bg-amber-500/6 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Featured Playable Build</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight">
              <InlineEdit
                value={designerInfo?.flagshipHeading || 'MY LATEST PROJECT'}
                onSave={(val) => onUpdateDesignerInfo?.({ flagshipHeading: val })}
                isOwnerMode={isOwnerMode}
                label="Latest Project Heading"
              />
            </h2>
            <div className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              <InlineEdit
                value={
                  designerInfo?.flagshipQuote ||
                  'Recorded gameplay footage, playable build download, and game specifications.'
                }
                onSave={(val) => onUpdateDesignerInfo?.({ flagshipQuote: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Latest Project Subtitle"
                as="p"
              />
            </div>
          </div>

          {isOwnerMode && onEditFlagshipDetails && (
            <button
              onClick={onEditFlagshipDetails}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 self-start md:self-auto"
              title="Open full Latest Project editor"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Project Details</span>
            </button>
          )}
        </div>

        {/* Owner-Only Gameplay Video Upload & Playable Build Link Controls */}
        {isOwnerMode && (
          <div className="mb-7 p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/40 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <LinkIcon className="w-4 h-4" />
                <span>Owner Upload · Recorded Gameplay Video &amp; Playable Build Link</span>
              </div>
              {linkSavedToast && (
                <span className="text-xs font-mono text-amber-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved &amp; published</span>
                </span>
              )}
            </div>

            <form
              onSubmit={handleSaveLinks}
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end"
            >
              <div className="lg:col-span-5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Playable Build Link (itch.io, Drive, Mega, Direct ZIP)
                </label>
                <input
                  type="url"
                  value={gameUrlDraft}
                  onChange={(e) => setGameUrlDraft(e.target.value)}
                  placeholder="https://your-playable-build-link.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={gameLabelDraft}
                  onChange={(e) => setGameLabelDraft(e.target.value)}
                  placeholder="Download Playable Build"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="lg:col-span-4 flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shrink-0"
                >
                  Save Link
                </button>

                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{hasBuildVideo ? 'Replace Video' : 'Upload Video'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBuildVideoUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>

                {hasBuildVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrlDraft('');
                      onUpdateDesignerInfo?.({ flagshipVideoUrl: '' });
                    }}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/70 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer shrink-0"
                    title="Remove uploaded gameplay video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Main Two-Column Clean Layout: Recorded Gameplay Video (Left) + Game Specifications & Playable Build Button (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Left Column (7 cols): Recorded Gameplay Video Player / Upload Slot */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col">
              {hasBuildVideo ? (
                <>
                  <div className="relative flex-1 bg-black flex items-center justify-center">
                    <video
                      src={designerInfo?.flagshipVideoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full max-h-[480px] object-contain bg-black"
                    />
                  </div>
                  <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800/90 flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Video className="w-3.5 h-3.5 text-amber-400" />
                      <span>Recorded Gameplay Capture</span>
                    </span>
                    {isOwnerMode && (
                      <label className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Replace Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBuildVideoUpload(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </>
              ) : isOwnerMode ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleBuildVideoUpload(file);
                  }}
                  className="flex-1 p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-amber-500/35 hover:border-amber-400 m-3 rounded-xl bg-zinc-900/30 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
                    <Video className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-lg font-heading font-bold text-white">
                      Upload Recorded Gameplay Video
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Drag &amp; drop or choose your recorded gameplay build video (MP4, WebM, MOV)
                      to showcase directly here.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20">
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>Choose Gameplay Video</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBuildVideoUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex-1 p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                    Recorded Gameplay Video Coming Soon
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
                    In-engine gameplay footage for this build is being prepared and will appear here
                    shortly.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column (5 cols): Editable Game Specifications + Download Playable Build Button */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="flex-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-2xl">
              <div className="space-y-5">
                {/* Title */}
                <div className="border-b border-zinc-800 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>Specifications</span>
                    </span>
                    {isOwnerMode && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        Click text below to edit
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-heading font-black text-white tracking-tight">
                    <InlineEdit
                      value={designerInfo?.flagshipGameTitle || 'Game Specifications'}
                      onSave={(val) => onUpdateDesignerInfo?.({ flagshipGameTitle: val })}
                      isOwnerMode={isOwnerMode}
                      label="Game Title / Specs Heading"
                    />
                  </h3>
                </div>

                {/* Free-Form Editable Specification Notes Space */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    About The Game &amp; Build Notes
                  </span>
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    <InlineEdit
                      value={
                        designerInfo?.flagshipGameSpecs ||
                        'Add your game overview, core gameplay mechanics, controls, and build notes here.'
                      }
                      onSave={(val) => onUpdateDesignerInfo?.({ flagshipGameSpecs: val })}
                      isOwnerMode={isOwnerMode}
                      multiline={true}
                      label="Game Specifications Overview"
                      as="p"
                    />
                  </div>
                </div>

                {/* Structured Key-Value Specs List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Technical Specifications
                    </span>
                    {isOwnerMode && (
                      <button
                        type="button"
                        onClick={handleAddSpecRow}
                        className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Row</span>
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-zinc-800/80 rounded-xl bg-zinc-900/40 border border-zinc-800/80 px-3.5">
                    {specRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <span className="text-zinc-400 shrink-0">
                          <InlineEdit
                            value={row.label}
                            onSave={(val) => handleUpdateSpecRow(idx, 'label', val)}
                            isOwnerMode={isOwnerMode}
                            label="Spec Label"
                          />
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-100 font-semibold text-right truncate">
                            <InlineEdit
                              value={row.value}
                              onSave={(val) => handleUpdateSpecRow(idx, 'value', val)}
                              isOwnerMode={isOwnerMode}
                              label="Spec Value"
                            />
                          </span>
                          {isOwnerMode && specRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecRow(idx)}
                              className="text-zinc-500 hover:text-red-400 cursor-pointer shrink-0"
                              title="Remove spec row"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Playable Build Action Button */}
              <div className="pt-2 space-y-2">
                {gameDownloadUrl ? (
                  <motion.a
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    href={gameDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{gameDownloadLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Download className="w-4 h-4 text-amber-400/60" />
                      <span>{gameDownloadLabel}</span>
                    </button>
                    <p className="text-[11px] font-mono text-zinc-500 text-center">
                      {isOwnerMode
                        ? 'Paste your playable build URL in the Owner Upload bar above to activate this button.'
                        : 'Playable build download link will be added shortly.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
