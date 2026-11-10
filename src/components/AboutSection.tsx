import React from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  GraduationCap, 
  Briefcase, 
  Edit3, 
  Target, 
  Eye, 
  Film,
  UserCheck,
  Compass
} from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo } from '../types/portfolio';

interface AboutSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onContactClick?: () => void;
  onEditAbout?: () => void;
  onWatchReelClick?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ 
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onContactClick,
  onEditAbout,
  onWatchReelClick
}) => {
  const info = designerInfo || DESIGNER_INFO;

  const designPillars = [
    {
      title: 'Player-First Level Flow',
      icon: Target,
      desc: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.'
    },
    {
      title: 'Kinesthetic Feel & Movement',
      icon: Gamepad2,
      desc: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.'
    },
    {
      title: 'Cinematic Atmosphere',
      icon: Film,
      desc: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.'
    }
  ];

  return (
    <section id="about" className="py-24 relative bg-[#070709] border-t border-zinc-800/80">
      
      {/* Background radial glow */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Profile & Philosophy</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              {info.aboutHeading ? (
                info.aboutHeading
              ) : (
                <>About <span className="text-amber-500">{info.name}</span></>
              )}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2">
              {info.aboutSubheading || info.tagline || 'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.'}
            </p>
          </div>

          {isOwnerMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEditAbout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                title="Edit quotes, bio, and career statements"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Bio & Quotes</span>
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Quotes & Statements from Showreel Video */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Introduction Quote Card */}
            <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 blur-xl rounded-full"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Introduction & Philosophy</span>
                </div>
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
              
              <blockquote className="text-sm sm:text-base text-zinc-200 leading-relaxed italic">
                &ldquo;{info.aboutIntro || info.introQuote}&rdquo;
              </blockquote>
            </div>

            {/* Career Objective & Focus Card */}
            <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Career Objective & Studio Focus</span>
                </div>
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

              <blockquote className="text-sm sm:text-base text-zinc-200 leading-relaxed italic">
                &ldquo;{info.aboutGoals || info.objectiveQuote}&rdquo;
              </blockquote>
            </div>

            {/* 3 Core Design Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {(info.aboutPhilosophyCards && info.aboutPhilosophyCards.length > 0
                ? info.aboutPhilosophyCards
                : [
                    { title: 'Player-First Level Flow', description: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.' },
                    { title: 'Kinesthetic Feel & Movement', description: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.' },
                    { title: 'Cinematic Atmosphere', description: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.' }
                  ]
              ).map((pillar, idx) => {
                const icons = [Gamepad2, Compass, Sparkles];
                const Icon = icons[idx % icons.length];
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {pillar.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Visual Staging & Studio Outlook */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visual Stills from the Video Reel */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 relative">
              {isOwnerMode && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={onEditAbout}
                    className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Edit Stills & Quotes"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[10px]">Edit Stills</span>
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  In-Engine Reel Stills
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Unreal & Maya</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {(info.aboutReelStills && info.aboutReelStills.length > 0
                  ? info.aboutReelStills
                  : [
                      { title: 'Robot Rig Study', label: 'Unreal & Maya', image: '/showcase/intro-robot.jpg' },
                      { title: 'UE5 Lighting Staging', label: 'Porsche GT3 RS Dual Car Render', image: '/showcase/about-porsche.jpg' }
                    ]
                ).map((still, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[4/3] group">
                    <img
                      src={still.image || '/showcase/intro-robot.jpg'}
                      alt={still.title || 'Reel Still'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/85 text-[10px] font-mono text-zinc-300">
                      {still.title}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-mono">
                &ldquo;Soon Final out of the game will be posted.&rdquo; Core blockouts and player mechanics are actively being refined.
              </div>
            </div>

            {/* Call to action card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 space-y-3">
              <h4 className="text-base font-bold text-white">
                {info.aboutCalloutTitle || 'Looking for a Dedicated Game Designer?'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {info.aboutCalloutText || 'Available for Junior Game Designer, Level Designer, or 3D Environment Artist roles with game studios worldwide.'}
              </p>
              
              <div className="flex items-center gap-3 pt-1">
                {onContactClick && (
                  <button
                    onClick={onContactClick}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    Get In Touch
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
