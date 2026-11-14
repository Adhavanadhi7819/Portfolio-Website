import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Gamepad2,
  Edit3,
  UserCheck,
  Compass,
  Mail,
  ArrowUpRight
} from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo, SectionTargetTab } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';
import { PhotoAdjustOverlay, DEFAULT_PHOTO_ALIGN } from './PhotoAdjustOverlay';
import { CareerTimelineChart } from './CareerTimelineChart';

interface AboutSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onContactClick?: () => void;
  onEditAbout?: () => void;
  onWatchReelClick?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
  currentTab?: SectionTargetTab;
  onChangeTab?: (tab: SectionTargetTab) => void;
  showDragHandle?: boolean;
  onDragStartPointer?: (e: React.PointerEvent) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onContactClick,
  onEditAbout,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow,
  currentTab,
  onChangeTab,
  showDragHandle,
  onDragStartPointer
}) => {
  const info = designerInfo || DESIGNER_INFO;
  const photoAlign = info.heroPhotoAlign || DEFAULT_PHOTO_ALIGN;

  const philosophyCards =
    info.aboutPhilosophyCards && info.aboutPhilosophyCards.length > 0
      ? info.aboutPhilosophyCards
      : [
          {
            title: 'Player-First Level Flow',
            description:
              'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.'
          },
          {
            title: 'Kinesthetic Feel & Movement',
            description:
              'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.'
          },
          {
            title: 'Cinematic Atmosphere',
            description:
              'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.'
          }
        ];

  return (
    <section id="about" className="py-8 sm:py-10 relative bg-transparent border-b border-zinc-800/60 scroll-mt-[68px]">
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="about"
          sectionTitle="About & Design Philosophy"
          currentTab={currentTab}
          onChangeTab={onChangeTab}
          showDragHandle={showDragHandle}
          onDragStartPointer={onDragStartPointer}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditAbout}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Profile · Philosophy · Career Trajectory</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
              <InlineEdit
                value={info.aboutHeading || `About ${info.name}`}
                onSave={(val) => onUpdateDesignerInfo?.({ aboutHeading: val })}
                isOwnerMode={isOwnerMode}
                label="About Heading"
              />
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed text-justify [text-justify:inter-word] hyphens-auto">
              <InlineEdit
                value={
                  info.aboutSubheading ||
                  info.tagline ||
                  'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.'
                }
                onSave={(val) => onUpdateDesignerInfo?.({ aboutSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="About Subtitle"
                as="span"
                className="text-zinc-400 text-justify [text-justify:inter-word]"
              />
            </p>
          </div>

          {isOwnerMode && (
            <button
              onClick={onEditAbout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
              title="Edit quotes, bio, and career statements"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Bio &amp; Pillars</span>
            </button>
          )}
        </div>

        {/* Balanced 12-Column Identity + Philosophy Split (Zero Wasted Vertical Space) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (4 cols): Portrait & Quick Studio Summary Card */}
          <div className="lg:col-span-4 bg-zinc-950/65 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="relative aspect-[4/3.8] w-full overflow-hidden bg-zinc-950">
              <img
                src={info.heroPhotoUrl || '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png'}
                alt={`${info.name} - ${info.title}`}
                style={{
                  objectPosition: `${photoAlign.x}% ${photoAlign.y}%`,
                  transform: `scale(${photoAlign.zoom})`
                }}
                className={`w-full h-full transition-all duration-300 ${
                  photoAlign.fit === 'contain' ? 'object-contain' : 'object-cover'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/35 via-transparent to-transparent pointer-events-none" />

              <PhotoAdjustOverlay
                align={photoAlign}
                isOwnerMode={isOwnerMode}
                onChange={(next) => onUpdateDesignerInfo?.({ heroPhotoAlign: next })}
                positionClass="top-3 left-3"
              />

              <MediaUploadOverlay
                currentUrl={info.heroPhotoUrl || '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png'}
                mediaType="image"
                isOwnerMode={isOwnerMode}
                onMediaUploaded={(newUrl) => onUpdateDesignerInfo?.({ heroPhotoUrl: newUrl })}
                label="Upload Portrait"
                position="bottom-right"
              />
            </div>

            <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/50">
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Studio Availability
                </span>
                <InlineEdit
                  value={
                    info.aboutCalloutTitle || 'Looking for a Dedicated Game Designer?'
                  }
                  onSave={(val) => onUpdateDesignerInfo?.({ aboutCalloutTitle: val })}
                  isOwnerMode={isOwnerMode}
                  label="Callout Title"
                  className="font-semibold text-white block mb-1"
                />
                <p className="text-zinc-400 text-justify [text-justify:inter-word] hyphens-auto">
                  <InlineEdit
                    value={
                      info.aboutCalloutText ||
                      'Available for Junior Game Designer, Level Designer, or 3D Artist roles with game studios worldwide.'
                    }
                    onSave={(val) => onUpdateDesignerInfo?.({ aboutCalloutText: val })}
                    isOwnerMode={isOwnerMode}
                    multiline={true}
                    label="Callout Subtitle"
                    as="span"
                    className="text-zinc-400 text-justify [text-justify:inter-word]"
                  />
                </p>
              </div>

              {onContactClick && (
                <button
                  onClick={onContactClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Get In Touch</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column (8 cols): Introduction & Philosophy + 3 Core Design Pillars */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-5">
            {/* Introduction & Philosophy Box */}
            <div className="flex-1 p-6 rounded-2xl bg-zinc-950/65 backdrop-blur-md border border-zinc-800/80 flex flex-col justify-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Introduction &amp; Design Philosophy
                </span>
                {isOwnerMode && (
                  <button
                    onClick={onEditAbout}
                    className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <blockquote className="text-sm sm:text-base text-zinc-200 leading-relaxed text-justify [text-justify:inter-word] hyphens-auto">
                <InlineEdit
                  value={info.aboutIntro || info.introQuote || ''}
                  onSave={(val) =>
                    onUpdateDesignerInfo?.({ aboutIntro: val, introQuote: val })
                  }
                  isOwnerMode={isOwnerMode}
                  multiline={true}
                  label="Intro Philosophy Quote"
                  as="span"
                  className="text-zinc-200 text-justify [text-justify:inter-word]"
                />
              </blockquote>
            </div>

            {/* 3 Core Design Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {philosophyCards.map((pillar, idx) => {
                const icons = [Gamepad2, Compass, Sparkles];
                const Icon = icons[idx % icons.length];
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -3, borderColor: 'rgba(192, 169, 223, 0.45)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="p-5 rounded-2xl bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 space-y-2.5 flex flex-col justify-start"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">{pillar.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed text-justify hyphens-auto">
                      {pillar.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-Width Interactive Career Timeline (Matching Demo Website Structure) */}
        <CareerTimelineChart
          timeline={info.careerTimeline}
          objectiveQuote={info.aboutGoals || info.objectiveQuote}
          isOwnerMode={isOwnerMode}
          onUpdateTimeline={(newTimeline) =>
            onUpdateDesignerInfo?.({ careerTimeline: newTimeline })
          }
          onUpdateObjectiveQuote={(newQuote) =>
            onUpdateDesignerInfo?.({ aboutGoals: newQuote, objectiveQuote: newQuote })
          }
        />
      </div>
    </section>
  );
};
