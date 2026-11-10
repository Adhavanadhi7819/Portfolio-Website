import React from 'react';
import { Play, Sparkles, ChevronDown, Compass, Box, Flame, ArrowUpRight, Edit3 } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';

interface HeroSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditHero?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  onPlayReel: () => void;
  onExploreProjects: () => void;
  onJumpToChapter: (chapterId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditHero,
  onUpdateDesignerInfo,
  onPlayReel,
  onExploreProjects,
  onJumpToChapter,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  return (
    <section id="hero" className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 min-h-[calc(100vh-140px)] flex flex-col justify-center overflow-hidden">
      {/* Background radial gradient & ambient glow */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      ></div>

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Bio & Title */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Title Styled faithfully to the user's video title card */}
            <div className="space-y-1">
              <span className="block text-amber-500 font-serif italic text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Game
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter uppercase text-white leading-none">
                DESIGNER
              </h1>
              <div className="pt-2 flex items-center gap-3">
                <InlineEdit
                  value={designerInfo.name}
                  onSave={(val) => onUpdateDesignerInfo?.({ name: val })}
                  isOwnerMode={isOwnerMode}
                  label="Designer Name"
                  className="text-xl sm:text-2xl font-mono tracking-widest text-zinc-300 font-semibold uppercase"
                >
                  <span className="text-xl sm:text-2xl font-mono tracking-widest text-zinc-300 font-semibold uppercase">
                    {designerInfo.name.toUpperCase()}
                  </span>
                </InlineEdit>
                <span className="h-0.5 w-12 bg-amber-500/60 inline-block"></span>
                <InlineEdit
                  value={designerInfo.title}
                  onSave={(val) => onUpdateDesignerInfo?.({ title: val })}
                  isOwnerMode={isOwnerMode}
                  label="Role / Title"
                  className="text-xs tracking-wider uppercase text-amber-400/90 font-mono"
                />
              </div>
            </div>

            {/* Description / Tagline */}
            <div className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
              <InlineEdit
                value={designerInfo.tagline}
                onSave={(val) => onUpdateDesignerInfo?.({ tagline: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Hero Tagline"
                as="p"
              />
            </div>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onPlayReel}
                className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
                <span>Play Showcase Reel</span>
                <span className="text-xs bg-black/20 text-black px-2 py-0.5 rounded font-mono font-medium">4:52</span>
              </button>

              <button
                onClick={onExploreProjects}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-500 font-semibold uppercase tracking-wider text-sm transition-all cursor-pointer backdrop-blur-md"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore Projects</span>
              </button>

              {/* Owner Edit Button */}
              {isOwnerMode && (
                <button
                  onClick={onEditHero}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                  title="Edit Hero Title, Tagline & Info"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Hero & Bio</span>
                </button>
              )}
            </div>

            {/* Quick jump highlights */}
            <div className="pt-4 border-t border-zinc-800/80">
              <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-3 font-mono">
                Featured Showreel Segments:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🏴‍☠️ Pirate Village RPG', id: 'flagship-rpg' },
                  { label: '🏎️ AE86 Speedrun Drift', id: 'ae86-speedrun' },
                  { label: '⛽ Gas Station Night Scene', id: 'gas-station' },
                  { label: '🏛️ Temple Duality', id: 'temple-upside' },
                  { label: '🎸 Maya 3D Assets', id: 'maya-3d' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onJumpToChapter(item.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900/70 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Asset Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              
              {/* Outer Glow Halo */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/40 via-orange-500/20 to-amber-600/40 blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>

              {/* Card Container */}
              <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden shadow-2xl">
                
                {/* Header bar of visual card */}
                <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-2 text-zinc-300 font-semibold tracking-wide">ADHAVAN // SHOWCASE</span>
                  </div>
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">PORTFOLIO</span>
                </div>

                {/* Primary Photo from user's video intro */}
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={designerInfo.heroPhotoUrl || '/showcase/hero-adhavan.jpg'}
                    alt="Adhavan Game Designer Title Shot"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={onPlayReel}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors group/play"
                    aria-label="Play Reel"
                  >
                    <div className="w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 group-hover/play:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-black text-black ml-1" />
                    </div>
                  </button>

                  {/* Direct In-place Media Upload for Owner */}
                  <MediaUploadOverlay
                    currentUrl={designerInfo.heroPhotoUrl || '/showcase/hero-adhavan.jpg'}
                    mediaType="image"
                    isOwnerMode={isOwnerMode}
                    onMediaUploaded={(newUrl) => onUpdateDesignerInfo?.({ heroPhotoUrl: newUrl })}
                    label="Upload Hero Photo"
                    position="top-right"
                  />

                  {/* Bottom caption overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                        Featured Reel
                      </span>
                      <p className="text-white font-bold text-sm">
                        Unreal Engine Gameplay & Environment Showcase
                      </p>
                    </div>
                    <span className="text-xs bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-zinc-300 font-mono border border-zinc-700">
                      04:52
                    </span>
                  </div>
                </div>

                {/* Engine Stacks in card footer */}
                <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="block text-xs font-mono text-zinc-400 uppercase">Engine</span>
                    <InlineEdit
                      value={designerInfo.heroEngineTags?.engine || 'Unreal 5'}
                      onSave={(val) => onUpdateDesignerInfo?.({
                        heroEngineTags: {
                          engine: val,
                          maya: designerInfo.heroEngineTags?.maya || 'Maya',
                          focus: designerInfo.heroEngineTags?.focus || 'Mechanics'
                        }
                      })}
                      isOwnerMode={isOwnerMode}
                      label="Engine"
                      className="text-sm text-white font-semibold block"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="block text-xs font-mono text-zinc-400 uppercase">3D Modeling</span>
                    <InlineEdit
                      value={designerInfo.heroEngineTags?.maya || 'Maya'}
                      onSave={(val) => onUpdateDesignerInfo?.({
                        heroEngineTags: {
                          engine: designerInfo.heroEngineTags?.engine || 'Unreal 5',
                          maya: val,
                          focus: designerInfo.heroEngineTags?.focus || 'Mechanics'
                        }
                      })}
                      isOwnerMode={isOwnerMode}
                      label="3D Modeling Software"
                      className="text-sm text-amber-400 font-semibold block"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="block text-xs font-mono text-zinc-400 uppercase">Focus</span>
                    <InlineEdit
                      value={designerInfo.heroEngineTags?.focus || 'Mechanics'}
                      onSave={(val) => onUpdateDesignerInfo?.({
                        heroEngineTags: {
                          engine: designerInfo.heroEngineTags?.engine || 'Unreal 5',
                          maya: designerInfo.heroEngineTags?.maya || 'Maya',
                          focus: val
                        }
                      })}
                      isOwnerMode={isOwnerMode}
                      label="Design Focus"
                      className="text-sm text-white font-semibold block"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Floating Stat Counters Bar */}
        <div className="mt-8 pt-5 border-t border-zinc-800/80 relative">
          {isOwnerMode && (
            <div className="absolute -top-3 right-0">
              <button
                onClick={onEditHero}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Edit Stat Counters"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Stats</span>
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {(designerInfo.heroStats && designerInfo.heroStats.length > 0
              ? designerInfo.heroStats
              : [
                  { number: '6+', label: 'Unreal Environments & Levels' },
                  { number: '3D RPG', label: 'Flagship Game In Progress' },
                  { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
                  { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
                ]
            ).map((stat, idx) => (
              <div key={idx} className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                <InlineEdit
                  value={stat.number}
                  onSave={(val) => {
                    const currentStats = designerInfo.heroStats || [
                      { number: '6+', label: 'Unreal Environments & Levels' },
                      { number: '3D RPG', label: 'Flagship Game In Progress' },
                      { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
                      { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
                    ];
                    const next = [...currentStats];
                    next[idx] = { ...next[idx], number: val };
                    onUpdateDesignerInfo?.({ heroStats: next });
                  }}
                  isOwnerMode={isOwnerMode}
                  label="Stat Number"
                  className={`text-3xl font-heading font-black block ${idx % 2 === 0 ? 'text-amber-400' : 'text-white'}`}
                />
                <InlineEdit
                  value={stat.label}
                  onSave={(val) => {
                    const currentStats = designerInfo.heroStats || [
                      { number: '6+', label: 'Unreal Environments & Levels' },
                      { number: '3D RPG', label: 'Flagship Game In Progress' },
                      { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
                      { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
                    ];
                    const next = [...currentStats];
                    next[idx] = { ...next[idx], label: val };
                    onUpdateDesignerInfo?.({ heroStats: next });
                  }}
                  isOwnerMode={isOwnerMode}
                  label="Stat Label"
                  className="text-xs text-zinc-400 font-mono uppercase tracking-wider block mt-1"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
