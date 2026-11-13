import React from 'react';
import { 
  Sliders, 
  Gamepad2, 
  Cpu, 
  Layers, 
  Box, 
  Flame, 
  Sparkles, 
  Edit3, 
  ArrowRight,
  ShieldCheck,
  Compass,
  Car,
  Gauge
} from 'lucide-react';
import { DesignerInfo } from '../types/portfolio';
import { DESIGNER_INFO } from '../data/portfolioData';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';

interface ProficiencySectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditSkills?: () => void;
  onContactClick?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

export const ProficiencySection: React.FC<ProficiencySectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditSkills,
  onContactClick,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const info = designerInfo || DESIGNER_INFO;
  const skills = info.skills || [];
  const tools = info.tools || [];

  const disciplineCards = [
    {
      title: 'Level Design & Flow',
      icon: Compass,
      desc: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.',
      highlights: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density']
    },
    {
      title: 'Vehicle Rigging & Physics',
      icon: Car,
      desc: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.',
      highlights: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks']
    },
    {
      title: 'Autodesk Maya 3D',
      icon: Box,
      desc: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.',
      highlights: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables']
    },
    {
      title: 'Unreal Engine 5 & Blueprints',
      icon: Gamepad2,
      desc: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.',
      highlights: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer']
    }
  ];

  return (
    <section id="proficiency" className="py-12 relative bg-[#09090c] border-b border-zinc-800/80">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="proficiency"
          sectionTitle="Proficiency & Toolbelt"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditSkills}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      {/* Background glow accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Skills & Competencies</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={info.proficiencyHeading || 'TECHNICAL PROFICIENCY'}
                onSave={(val) => onUpdateDesignerInfo?.({ proficiencyHeading: val })}
                isOwnerMode={isOwnerMode}
                label="Proficiency Heading"
              />
            </h2>
            <div className="text-zinc-400 text-sm sm:text-base mt-2">
              <InlineEdit
                value={info.proficiencySubheading || 'Unreal Engine 5 level blockouts, responsive player mechanics, Chaos vehicle physics, and Autodesk Maya 3D hard-surface art.'}
                onSave={(val) => onUpdateDesignerInfo?.({ proficiencySubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Proficiency Subtitle"
                as="p"
              />
            </div>
          </div>

          {isOwnerMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEditSkills}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                title="Edit proficiency percentages and toolbelt"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Skills & Tools</span>
              </button>
            </div>
          )}
        </div>

        {/* Top Grid: Core Skill Meters + Software Toolbelt */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6 sm:mb-8">
          
          {/* Left Column: Skill Percentage Gauges */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                  Core Engine & Technical Mastery
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">Production Calibrated</span>
            </div>

            <div className="space-y-4">
              {skills.map((skill, idx) => (
                <div key={idx} className="space-y-2 group">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                      {skill.name || skill.skill}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{skill.pct}%</span>
                  </div>
                  
                  <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/80 p-0.5">
                    <div
                      style={{ width: `${skill.pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 rounded-full transition-all duration-700"
                    />
                  </div>
                  
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    {skill.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Software Toolbelt & Engine Stack */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
                    Software & Toolbelt
                  </h3>
                </div>
                {isOwnerMode && (
                  <button
                    onClick={onEditSkills}
                    className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Tools</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Daily tools and pipeline utilities utilized across level creation, hard-surface asset modeling, and sequence playback.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-zinc-950/80 text-zinc-200 text-xs font-mono border border-zinc-800 hover:border-amber-500/50 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{tool}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Studio Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 flex flex-col justify-between gap-4 relative">
              {isOwnerMode && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={onEditSkills}
                    className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Edit Studio Callout Text"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[10px]">Edit</span>
                  </button>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Studio Ready Mindset</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  <InlineEdit
                    value={info.proficiencyCalloutTitle || 'Seeking Junior Game Designer Roles'}
                    onSave={(val) => onUpdateDesignerInfo?.({ proficiencyCalloutTitle: val })}
                    isOwnerMode={isOwnerMode}
                    label="Callout Title"
                  />
                </h4>
                <div className="text-xs text-zinc-400">
                  <InlineEdit
                    value={info.proficiencyCalloutText || 'Ready to assist lead level designers, white-box test environments, and construct interactive blueprint mechanics.'}
                    onSave={(val) => onUpdateDesignerInfo?.({ proficiencyCalloutText: val })}
                    isOwnerMode={isOwnerMode}
                    multiline={true}
                    label="Callout Subtitle"
                    as="p"
                  />
                </div>
              </div>

              {onContactClick && (
                <button
                  onClick={onContactClick}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Connect With Adhavan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* 4 Specialized Discipline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(info.proficiencyCompetencyCards && info.proficiencyCompetencyCards.length > 0
            ? info.proficiencyCompetencyCards
            : [
                {
                  title: 'Level Design & Flow',
                  description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.',
                  tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density']
                },
                {
                  title: 'Vehicle Rigging & Physics',
                  description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.',
                  tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks']
                },
                {
                  title: 'Autodesk Maya 3D',
                  description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.',
                  tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables']
                },
                {
                  title: 'Unreal Engine 5 & Blueprints',
                  description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.',
                  tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer']
                }
              ]
          ).map((card, idx) => {
            const icons = [Layers, Gauge, Box, Cpu];
            const Icon = icons[idx % icons.length];
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/40 transition-all group space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
                  {card.tags.map((h, hIdx) => (
                    <span 
                      key={hIdx} 
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
