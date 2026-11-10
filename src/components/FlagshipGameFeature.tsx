import React, { useState } from 'react';
import { 
  Play, 
  Gamepad2, 
  Sparkles, 
  MapPin, 
  Layers, 
  Activity, 
  Compass, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { ProjectItem, DesignerInfo } from '../types/portfolio';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';

interface FlagshipGameFeatureProps {
  flagshipProject?: ProjectItem;
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditFlagship?: (project: ProjectItem) => void;
  onEditFlagshipDetails?: () => void;
  onPlayWalkthrough: (timestamp: number) => void;
  onOpenProjectModal: (projectId: string) => void;
}

export const FlagshipGameFeature: React.FC<FlagshipGameFeatureProps> = ({
  flagshipProject: customFlagship,
  designerInfo,
  isOwnerMode = false,
  onEditFlagship,
  onEditFlagshipDetails,
  onPlayWalkthrough,
  onOpenProjectModal
}) => {
  const flagshipProject = customFlagship || PORTFOLIO_PROJECTS.find(p => p.isFlagship) || PORTFOLIO_PROJECTS[0];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const customScreenshots = designerInfo?.flagshipScreenshots && designerInfo.flagshipScreenshots.length > 0
    ? designerInfo.flagshipScreenshots
    : [
        { title: 'Vibrant Town Square Hub', subtitle: 'Overhead third-person perspective showing stone pavers, market canopies, and level pathing.', image: '/showcase/shot-town-01.jpg' },
        { title: 'Harbor Docks & Pier Walkway', subtitle: 'Waterfront boardwalk featuring moored boats, fish racks, barrel clusters, and ocean sightlines.', image: '/showcase/shot-dock-02.jpg' },
        { title: 'Marketplace Stalls & Castle Overlook', subtitle: 'Lush village green surrounded by multi-tier timber houses, windmill landmarks, and hilltop citadel walls.', image: '/showcase/shot-market-03.jpg' },
        { title: 'Canopy Alley & Stone Staircases', subtitle: 'Narrow cobblestone street navigation testing vertical elevation, market canopies, and ambient lighting.', image: '/showcase/shot-tavern-04.jpg' }
      ];

  const images = customScreenshots.map(s => s.image);

  const featureCards = designerInfo?.flagshipFeatureCards && designerInfo.flagshipFeatureCards.length > 0
    ? designerInfo.flagshipFeatureCards
    : [
        {
          title: 'Fluid Player Locomotion',
          description: 'Custom third-person character movement with sprint acceleration, directional jump arc, and smooth slope alignment across stairs and docks.'
        },
        {
          title: 'Handcrafted Port Village Level',
          description: 'Designed with natural sightlines, landmark orientation (windmill & watchtower), multi-tier bridges, and vibrant marketplace stalls.'
        },
        {
          title: 'Pirate UI & Choice Systems',
          description: 'Thematic pirate skull & crossbones interface with interactive prompt dialogs, character customization cards, and player feedback.'
        },
        {
          title: 'Environmental Dressing',
          description: 'Lush pumpkin patches, burning blacksmith braziers, hay wagons, barrels, and wooden pier structures bringing the maritime world to life.'
        }
      ];

  return (
    <section id="flagship" className="py-24 relative overflow-hidden bg-gradient-to-b from-[#09090c] via-[#0d0d12] to-[#070709]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Kicker */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Featured In-Development Game</span>
          </span>
          <span className="text-zinc-500 text-xs font-mono">• In Active Production</span>
        </div>

        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-end">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight">
              {designerInfo?.flagshipHeading ? (
                designerInfo.flagshipHeading
              ) : (
                <>MY LATEST <span className="text-amber-500">PROJECT</span></>
              )}
            </h2>
            <p className="text-zinc-300 text-base sm:text-lg mt-3 max-w-3xl leading-relaxed">
              {designerInfo?.flagshipQuote || '“Focuses on a fully packed game, which is in progress. These are the screenshots and video of the level from the game.”'}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
            {isOwnerMode && (
              <button
                onClick={onEditFlagshipDetails || (() => onEditFlagship?.(flagshipProject))}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                title="Edit Flagship Game project details, screenshots, and feature cards"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Flagship & Shots</span>
              </button>
            )}
            <button
              onClick={() => onPlayWalkthrough(171)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase text-xs tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black text-black" />
              <span>Watch In-Engine Gameplay</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Interactive Media Viewer with Screenshots */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Stage Image */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group aspect-[16/10]">
              <img
                src={images[activeImageIndex] || '/showcase/shot-town-01.jpg'}
                alt={customScreenshots[activeImageIndex]?.title || 'Pirate RPG Level'}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

              {/* Top Watermark Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md border border-zinc-700/80 text-xs font-mono text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Unreal Engine 5 Playtest Capture</span>
              </div>

              {/* Jump to video gameplay overlay button */}
              <button
                onClick={() => onPlayWalkthrough(171)}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 transition-transform cursor-pointer"
                aria-label="Play gameplay video"
              >
                <Play className="w-7 h-7 fill-black text-black ml-0.5" />
              </button>

              {/* Bottom Caption */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                    Shot {activeImageIndex + 1} of {images.length}
                  </span>
                  <h3 className="text-white font-bold text-base sm:text-lg">
                    {customScreenshots[activeImageIndex]?.title}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md hidden sm:block">
                    {customScreenshots[activeImageIndex]?.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => onPlayWalkthrough(171)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-xs text-amber-400 font-mono transition-colors"
                >
                  Seek 02:51
                </button>
              </div>
            </div>

            {/* Thumbnail Selector Strip */}
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20'
                      : 'border-zinc-800 opacity-70 hover:opacity-100 hover:border-zinc-600'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-zinc-300">
                    0{idx + 1}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Right: Technical Features Breakdown */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-5">
              
              <div className="border-b border-zinc-800 pb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  Architectural & Mechanics Breakdown
                </span>
                <h3 className="text-2xl font-heading font-black text-white uppercase mt-1">
                  Stylized Pirate Port RPG
                </h3>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-4">
                {featureCards.map((card, idx) => {
                  const icons = [<Activity key="1" className="w-4 h-4" />, <Layers key="2" className="w-4 h-4" />, <Compass key="3" className="w-4 h-4" />, <MapPin key="4" className="w-4 h-4" />];
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                        {icons[idx % icons.length]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{card.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-300">
                <span className="text-amber-400 font-bold block mb-1">Production Roadmap Notice</span>
                {designerInfo?.flagshipRoadmapQuote || '“Soon Final out of the game will be posted.” Core level blockout and movement mechanics complete; currently tuning quest triggers and sound design.'}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => onOpenProjectModal(flagshipProject.id)}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs uppercase tracking-wider text-center transition-colors border border-zinc-700"
                >
                  View Full Specs & Gallery
                </button>
                <button
                  onClick={() => onPlayWalkthrough(171)}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play Walkthrough</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
