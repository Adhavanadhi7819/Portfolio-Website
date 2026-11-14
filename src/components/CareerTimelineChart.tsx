import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  CheckCircle2,
  Target,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Images
} from 'lucide-react';
import { TimelineMilestone } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { uploadImageAsset } from '../utils/fileHelpers';

interface CareerTimelineChartProps {
  timeline?: TimelineMilestone[];
  objectiveQuote?: string;
  isOwnerMode?: boolean;
  onUpdateTimeline: (newTimeline: TimelineMilestone[]) => void;
  onUpdateObjectiveQuote?: (newQuote: string) => void;
}

export const DEFAULT_CAREER_TIMELINE: TimelineMilestone[] = [
  {
    id: 'timeline_1',
    phase: 'PHASE 01',
    title: 'Autodesk Maya 3D Hard-Surface Foundations',
    period: '2021 - 2022',
    description:
      'Mastered clean subdivision quad modeling, topology optimization, prop kit creation, and turntable rendering for real-time engines.',
    status: 'completed',
    highlights: ['Sub-D Quad Modeling', 'Prop & Instrument Art', 'Modular Interior Assets', 'UV Mapping'],
    photoUrl: '/showcase/maya-models.jpg',
    photoCaption: 'Hard-surface prop modeling & studio turntable renders in Autodesk Maya'
  },
  {
    id: 'timeline_2',
    phase: 'PHASE 02',
    title: 'Unreal Engine 5 Environments & Lighting Duality',
    period: '2023 - 2024',
    description:
      'Designed atmospheric 3D environments, tuning Post-Process Volumes, screen-space reflections, volumetric fog, and day vs night lighting dualities.',
    status: 'completed',
    highlights: ['Lumen & Nanite Workflows', 'Volumetric Fog', 'Post-Process Color Grading', 'Level Composition'],
    photoUrl: '/showcase/temple-upside.jpg',
    photoCaption: 'Atmospheric temple lighting duality & Lumen scene composition in UE5'
  },
  {
    id: 'timeline_3',
    phase: 'PHASE 03 · ACTIVE',
    title: 'Flagship Pirate RPG & Vehicle Rigging Mechanics',
    period: '2024 - PRESENT',
    description:
      'Developing full third-person character locomotion, sprint/jump arcs, obstacle-aware chase camera, Chaos vehicle physics, and stylized maritime hub layout.',
    status: 'current',
    highlights: ['Locomotion Physics', 'Chaos Vehicle Tuning', 'Flagship Port Hub', 'Blueprint Logic'],
    photoUrl: '/showcase/pirate-village-hero.jpg',
    photoCaption: 'Flagship Stylized Pirate Port RPG hub level blockout & locomotion test'
  },
  {
    id: 'timeline_4',
    phase: 'PHASE 04 · TARGET',
    title: 'Studio Objective: Junior Game & Level Designer',
    period: '2025 & BEYOND',
    description:
      'Seeking an opportunity to apply skills in a professional game studio environment—ready to white-box levels, balance gameplay traversal, and contribute creatively under lead design guidance.',
    status: 'target',
    highlights: ['Level White-Boxing', 'Player Pacing & Guidance', 'Studio Teamwork', 'Fast Creative Learning'],
    photoUrl: '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png',
    photoCaption: 'Studio readiness: combining level layout, mechanics tuning & visual craft'
  }
];

export const CareerTimelineChart: React.FC<CareerTimelineChartProps> = ({
  timeline,
  objectiveQuote,
  isOwnerMode = false,
  onUpdateTimeline,
  onUpdateObjectiveQuote
}) => {
  const currentTimeline =
    timeline && timeline.length > 0 ? timeline : DEFAULT_CAREER_TIMELINE;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const defaultQuote =
    'I am a passionate game design student with hands-on experience in Unreal Engine, seeking an opportunity to apply my skills in a professional environment. I have worked on projects involving level design, gameplay mechanics, and environment creation, and I am eager to learn from industry professionals while contributing creatively to game development.';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % currentTimeline.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + currentTimeline.length) % currentTimeline.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, currentTimeline.length]);

  const handleUpdateMilestone = (
    id: string,
    updates: Partial<TimelineMilestone>
  ) => {
    const updated = currentTimeline.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    onUpdateTimeline(updated);
  };

  const handleUploadMilestonePhoto = async (
    milestoneId: string,
    file: File
  ) => {
    setUploadingId(milestoneId);
    setUploadError(null);
    try {
      const assetUrl = await uploadImageAsset(file, 1200, 900, 0.8);
      handleUpdateMilestone(milestoneId, {
        photoUrl: assetUrl,
        photoCaption:
          currentTimeline.find((m) => m.id === milestoneId)?.photoCaption ||
          file.name.replace(/\.[^.]+$/, '')
      });
    } catch (err) {
      console.error('Failed to upload milestone photo:', err);
      setUploadError(
        err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED'
          ? 'Owner session expired. Re-verify 2FA to upload images.'
          : 'Could not upload image file. Please try another JPG, PNG, or WebP.'
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddMilestone = () => {
    const newMilestone: TimelineMilestone = {
      id: `milestone_${Date.now()}`,
      phase: `PHASE 0${currentTimeline.length + 1}`,
      title: 'New Game Design Objective / Milestone',
      period: 'Upcoming',
      description:
        'Describe the technical focus, level design challenges, or studio objectives for this phase.',
      status: 'target',
      highlights: ['Engine Proficiency', 'Level Design Deliverable'],
      photoUrl: '/showcase/shot-town-01.jpg',
      photoCaption: 'Milestone concept preview'
    };
    onUpdateTimeline([...currentTimeline, newMilestone]);
  };

  const handleDeleteMilestone = (id: string) => {
    if (currentTimeline.length <= 1) return;
    onUpdateTimeline(currentTimeline.filter((m) => m.id !== id));
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentTimeline.length) return;
    const next = [...currentTimeline];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateTimeline(next);
  };

  const activeLightboxMilestone =
    lightboxIndex !== null ? currentTimeline[lightboxIndex] : null;

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      {/* Ambient amber backdrop glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-amber-500">
              CAREER OBJECTIVE &amp; STUDIO FOCUS
            </h3>
            <p className="text-zinc-400 text-[11px] font-mono">
              Interactive Visual Timeline · Objectives · Studio Trajectory
            </p>
          </div>
        </div>

        {isOwnerMode && (
          <button
            onClick={handleAddMilestone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider transition-all shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
            title="Add a new milestone step to the timeline"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {/* Primary Career Objective Quote Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/20 relative group">
        <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold mb-1.5 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          <span>Core Studio Statement:</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic font-sans font-light text-justify [text-justify:inter-word] hyphens-auto">
          <InlineEdit
            value={objectiveQuote || defaultQuote}
            onSave={(val) => onUpdateObjectiveQuote?.(val)}
            isOwnerMode={isOwnerMode}
            multiline={true}
            label="Career Objective Quote"
            as="span"
            className="text-zinc-200 italic text-justify [text-justify:inter-word]"
          />
        </p>
      </div>

      {uploadError && (
        <div className="px-4 py-2.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs font-mono flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="underline ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pictorial Journey Quick-View & Owner Photo Upload Gallery */}
      {(currentTimeline.some((m) => m.photoUrl) || isOwnerMode) && (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5" />
              <span>Timeline Photo Showcase</span>
            </span>
            {currentTimeline.some((m) => m.photoUrl) && (
              <button
                type="button"
                onClick={() => {
                  const firstPhotoIdx = currentTimeline.findIndex((m) => m.photoUrl);
                  if (firstPhotoIdx >= 0) setLightboxIndex(firstPhotoIdx);
                }}
                className="text-[11px] font-mono text-zinc-300 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Open Fullscreen View</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
            {currentTimeline.map((milestone, mIdx) => {
              const isUploadingThis = uploadingId === milestone.id;
              return milestone.photoUrl ? (
                <div
                  key={`thumb-${milestone.id}`}
                  className="group/strip relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800 hover:border-amber-500/70 bg-black shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(mIdx)}
                    className="w-full h-full text-left cursor-pointer block"
                    title="View timeline photo"
                  >
                    <img
                      src={milestone.photoUrl}
                      alt={milestone.photoCaption || milestone.title}
                      className="w-full h-full object-cover object-top group-hover/strip:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <span className="text-[9px] font-mono text-amber-400 uppercase block truncate">
                        {milestone.phase}
                      </span>
                      <span className="text-[10px] font-semibold text-white block truncate">
                        {milestone.title}
                      </span>
                    </div>
                  </button>

                  {isOwnerMode && (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-1.5 right-1.5 px-2 py-1 rounded-md bg-black/80 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors shadow"
                      title={`Upload photo for ${milestone.phase}`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>{isUploadingThis ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingThis}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadMilestonePhoto(milestone.id, file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : isOwnerMode ? (
                <label
                  key={`thumb-empty-${milestone.id}`}
                  className="aspect-[16/10] rounded-lg border border-dashed border-zinc-700 hover:border-amber-500/70 bg-zinc-950 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-amber-400 cursor-pointer p-2 text-center transition-colors"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono font-semibold uppercase">
                    {milestone.phase}
                  </span>
                  <span className="text-[10px] text-zinc-500">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingThis}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadMilestonePhoto(milestone.id, file);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Interactive Visual Timeline Track */}
      <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-amber-500 before:via-amber-400/60 before:to-zinc-800">
        {currentTimeline.map((milestone, idx) => {
          const isCompleted = milestone.status === 'completed';
          const isCurrent = milestone.status === 'current';
          const isUploadingThis = uploadingId === milestone.id;

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              {/* Timeline Node Marker (Centered at track 12px mobile / 16px desktop) */}
              <div
                className={`absolute -left-[24px] sm:-left-[28px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  isCurrent
                    ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/40'
                    : isCompleted
                    ? 'bg-amber-400/90 text-black ring-4 ring-amber-400/20'
                    : 'bg-zinc-900 border-2 border-amber-500/60 text-amber-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-black" />
                ) : (
                  <Target className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>

              {/* Milestone Card with Interactive Objective Photo Split */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-950 border-amber-500/60 shadow-xl shadow-amber-500/5'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Top Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                        isCurrent
                          ? 'bg-amber-500 text-black'
                          : isCompleted
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      <InlineEdit
                        value={milestone.phase}
                        onSave={(val) =>
                          handleUpdateMilestone(milestone.id, { phase: val })
                        }
                        isOwnerMode={isOwnerMode}
                        className="font-mono font-bold"
                      />
                    </span>

                    <span className="text-xs font-mono text-zinc-400">
                      <InlineEdit
                        value={milestone.period}
                        onSave={(val) =>
                          handleUpdateMilestone(milestone.id, { period: val })
                        }
                        isOwnerMode={isOwnerMode}
                        className="text-zinc-400 font-mono"
                      />
                    </span>
                  </div>

                  {/* Owner-Only Photo Upload & Milestone Controls */}
                  {isOwnerMode && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <label
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                        title="Upload objective photo for this timeline milestone"
                      >
                        <Upload className="w-3 h-3" />
                        <span>
                          {isUploadingThis
                            ? 'Uploading...'
                            : milestone.photoUrl
                            ? 'Change Photo'
                            : 'Upload Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingThis}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadMilestonePhoto(milestone.id, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            handleUpdateMilestone(milestone.id, {
                              status: e.target.value as any
                            })
                          }
                          className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-400 uppercase focus:outline-none cursor-pointer"
                        >
                          <option value="completed">Completed</option>
                          <option value="current">Active Focus</option>
                          <option value="target">Target Objective</option>
                        </select>

                        <button
                          onClick={() => handleMoveMilestone(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move milestone up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleMoveMilestone(idx, 'down')}
                          disabled={idx === currentTimeline.length - 1}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move milestone down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        {currentTimeline.length > 1 && (
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Delete this milestone"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {/* Inner 12-Col Grid: Objective Text (7 cols) + Interactive Photo (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Milestone Title, Description & Highlights */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <h4 className="text-base sm:text-lg font-heading font-bold text-white tracking-wide">
                      <InlineEdit
                        value={milestone.title}
                        onSave={(val) =>
                          handleUpdateMilestone(milestone.id, { title: val })
                        }
                        isOwnerMode={isOwnerMode}
                        className="text-white font-bold"
                      />
                    </h4>

                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed text-justify [text-justify:inter-word] hyphens-auto">
                      <InlineEdit
                        value={milestone.description}
                        onSave={(val) =>
                          handleUpdateMilestone(milestone.id, {
                            description: val
                          })
                        }
                        isOwnerMode={isOwnerMode}
                        multiline={true}
                        as="span"
                        className="text-zinc-300 text-justify [text-justify:inter-word]"
                      />
                    </p>

                    {milestone.highlights && milestone.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {milestone.highlights.map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[10px] font-mono border border-zinc-700/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Interactive Objective Photo Frame */}
                  <div className="lg:col-span-5">
                    {milestone.photoUrl ? (
                      <div className="space-y-1.5">
                        <div
                          onClick={() => setLightboxIndex(idx)}
                          className="relative aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800 bg-black group/photo cursor-zoom-in shadow-lg"
                          title="Click to inspect milestone objective photo"
                        >
                          <img
                            src={milestone.photoUrl}
                            alt={milestone.photoCaption || milestone.title}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover/photo:opacity-45 transition-opacity" />

                          {/* Expand Icon Badge */}
                          <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/75 border border-zinc-700 text-amber-400 opacity-90 group-hover/photo:scale-110 transition-transform">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>

                          {/* Bottom Caption inside image */}
                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-200">
                            <span className="truncate">
                              {milestone.photoCaption || milestone.title}
                            </span>
                            <span className="text-amber-400 text-[10px] shrink-0">
                              Inspect
                            </span>
                          </div>
                        </div>

                        {/* Optional Owner Caption Edit & Remove Photo Row */}
                        <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-mono text-zinc-400">
                          <InlineEdit
                            value={
                              milestone.photoCaption ||
                              'Add objective photo caption...'
                            }
                            onSave={(val) =>
                              handleUpdateMilestone(milestone.id, {
                                photoCaption: val
                              })
                            }
                            isOwnerMode={isOwnerMode}
                            label="Photo Caption"
                            className="text-zinc-400 truncate"
                          />
                          {isOwnerMode && (
                            <button
                              onClick={() =>
                                handleUpdateMilestone(milestone.id, {
                                  photoUrl: undefined,
                                  photoCaption: undefined
                                })
                              }
                              className="text-red-400 hover:underline shrink-0 cursor-pointer"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isOwnerMode ? (
                      <label className="aspect-[16/10] w-full rounded-xl border-2 border-dashed border-zinc-800 hover:border-amber-500/60 bg-zinc-900/40 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-amber-400 transition-all cursor-pointer p-4 text-center">
                        <ImageIcon className="w-6 h-6 text-amber-500/80" />
                        <span className="text-xs font-mono font-semibold">
                          + Upload Objective Photo
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          JPG, PNG, or WebP
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadMilestonePhoto(milestone.id, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Fullscreen Objective Photo Lightbox */}
      <AnimatePresence>
        {activeLightboxMilestone && activeLightboxMilestone.photoUrl && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={activeLightboxMilestone.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[10px] font-bold uppercase shrink-0">
                    {activeLightboxMilestone.phase}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 shrink-0">
                    {activeLightboxMilestone.period}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">
                    {activeLightboxMilestone.title}
                  </h4>
                </div>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Close objective photo viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image Display with smooth swap */}
              <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeLightboxMilestone.id}
                    src={activeLightboxMilestone.photoUrl}
                    alt={
                      activeLightboxMilestone.photoCaption ||
                      activeLightboxMilestone.title
                    }
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.24 }}
                    className="w-full max-h-[65vh] object-contain"
                  />
                </AnimatePresence>
              </div>

              {/* Footer with Narrative & Next/Prev Milestone Navigation */}
              <div className="p-5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  {activeLightboxMilestone.photoCaption && (
                    <div className="text-xs font-mono text-amber-400 font-semibold">
                      {activeLightboxMilestone.photoCaption}
                    </div>
                  )}
                  <p className="text-xs text-zinc-300 leading-relaxed text-justify [text-justify:inter-word] hyphens-auto">
                    {activeLightboxMilestone.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null
                          ? 0
                          : (prev - 1 + currentTimeline.length) %
                            currentTimeline.length
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? 0 : (prev + 1) % currentTimeline.length
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
