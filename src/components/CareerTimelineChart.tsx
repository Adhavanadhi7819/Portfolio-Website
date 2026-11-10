import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Target, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Flag,
  Gamepad2,
  Compass,
  Cpu,
  Layers
} from 'lucide-react';
import { TimelineMilestone } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';

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
    description: 'Mastered clean subdivision quad modeling, topology optimization, prop kit creation, and turntable rendering for real-time engines.',
    status: 'completed',
    highlights: ['Sub-D Quad Modeling', 'Prop & Instrument Art', 'Modular Interior Assets', 'UV Mapping']
  },
  {
    id: 'timeline_2',
    phase: 'PHASE 02',
    title: 'Unreal Engine 5 Environments & Lighting Duality',
    period: '2023 - 2024',
    description: 'Designed atmospheric 3D environments, tuning Post-Process Volumes, screen-space reflections, volumetric fog, and day vs night lighting dualities.',
    status: 'completed',
    highlights: ['Lumen & Nanite Workflows', 'Volumetric Fog', 'Post-Process Color Grading', 'Level Composition']
  },
  {
    id: 'timeline_3',
    phase: 'PHASE 03 // ACTIVE',
    title: 'Flagship Pirate RPG & Vehicle Rigging Mechanics',
    period: '2024 - PRESENT',
    description: 'Developing full third-person character locomotion, sprint/jump arcs, obstacle-aware chase camera, Chaos vehicle physics, and stylized maritime hub layout.',
    status: 'current',
    highlights: ['Locomotion Physics', 'Chaos Vehicle Tuning', 'Flagship Port Hub', 'Blueprint Logic']
  },
  {
    id: 'timeline_4',
    phase: 'PHASE 04 // TARGET',
    title: 'Studio Objective: Junior Game & Level Designer',
    period: '2025 & BEYOND',
    description: 'Seeking an opportunity to apply skills in a professional game studio environment—ready to white-box levels, balance gameplay traversal, and contribute creatively under lead design guidance.',
    status: 'target',
    highlights: ['Level White-Boxing', 'Player Pacing & Guidance', 'Studio Teamwork', 'Fast Creative Learning']
  }
];

export const CareerTimelineChart: React.FC<CareerTimelineChartProps> = ({
  timeline,
  objectiveQuote,
  isOwnerMode = false,
  onUpdateTimeline,
  onUpdateObjectiveQuote
}) => {
  const currentTimeline = timeline && timeline.length > 0 ? timeline : DEFAULT_CAREER_TIMELINE;

  const defaultQuote = "I am a passionate game design student with hands-on experience in Unreal Engine, seeking an opportunity to apply my skills in a professional environment. I have worked on projects involving level design, gameplay mechanics, and environment creation, and I am eager to learn from industry professionals while contributing creatively to game development.";

  const handleUpdateMilestone = (id: string, updates: Partial<TimelineMilestone>) => {
    const updated = currentTimeline.map((m) => (m.id === id ? { ...m, ...updates } : m));
    onUpdateTimeline(updated);
  };

  const handleAddMilestone = () => {
    const newMilestone: TimelineMilestone = {
      id: `milestone_${Date.now()}`,
      phase: `PHASE 0${currentTimeline.length + 1}`,
      title: 'New Game Design Objective / Milestone',
      period: 'Upcoming',
      description: 'Describe the technical focus, level design challenges, or studio objectives for this phase.',
      status: 'target',
      highlights: ['Engine Proficiency', 'Level Design Deliverable']
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

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
      {/* Subtle ambient amber backdrop glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header bar with icon matching user slide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
              <span>CAREER OBJECTIVE & STUDIO FOCUS</span>
            </h3>
            <p className="text-zinc-400 text-[11px] font-mono">
              Timeline Roadmap • Game Design Deliverables • Studio Trajectory
            </p>
          </div>
        </div>

        {isOwnerMode && (
          <button
            onClick={handleAddMilestone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider transition-all shadow-md cursor-pointer shrink-0"
            title="Add a new milestone step to the timeline"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {/* Primary Career Objective Quote Banner (from user slide) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-amber-500/20 relative group">
        <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          <span>Core Studio Statement:</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic font-sans font-light">
          <InlineEdit
            value={objectiveQuote || defaultQuote}
            onSave={(val) => onUpdateObjectiveQuote?.(val)}
            isOwnerMode={isOwnerMode}
            multiline={true}
            label="Career Objective Quote"
            className="text-zinc-200 italic"
          />
        </p>
      </div>

      {/* Interactive Timeline Chart Track */}
      <div className="relative pl-6 sm:pl-8 space-y-4 sm:space-y-5 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-amber-500 before:via-amber-400/60 before:to-zinc-800">
        {currentTimeline.map((milestone, idx) => {
          const isCompleted = milestone.status === 'completed';
          const isCurrent = milestone.status === 'current';
          const isTarget = milestone.status === 'target';

          return (
            <div key={milestone.id} className="relative group">
              {/* Timeline Node Marker */}
              <div 
                className={`absolute -left-[30px] sm:-left-[35px] top-1 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  isCurrent 
                    ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/50' 
                    : isCompleted
                    ? 'bg-emerald-500 text-black ring-4 ring-emerald-500/20'
                    : 'bg-zinc-900 border-2 border-amber-500/60 text-amber-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                ) : (
                  <Target className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>

              {/* Milestone Card */}
              <div 
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-950 border-amber-500/60 shadow-xl shadow-amber-500/5'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Milestone Top Row: Phase + Period + Status + Owner Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        isCurrent 
                          ? 'bg-amber-500 text-black' 
                          : isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      <InlineEdit
                        value={milestone.phase}
                        onSave={(val) => handleUpdateMilestone(milestone.id, { phase: val })}
                        isOwnerMode={isOwnerMode}
                        className="font-mono font-bold"
                      />
                    </span>

                    <span className="text-xs font-mono text-zinc-400">
                      <InlineEdit
                        value={milestone.period}
                        onSave={(val) => handleUpdateMilestone(milestone.id, { period: val })}
                        isOwnerMode={isOwnerMode}
                        className="text-zinc-400 font-mono"
                      />
                    </span>
                  </div>

                  {/* Status switcher / Owner actions */}
                  <div className="flex items-center gap-1.5">
                    {isOwnerMode && (
                      <>
                        <select
                          value={milestone.status}
                          onChange={(e) => handleUpdateMilestone(milestone.id, { status: e.target.value as any })}
                          className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-400 uppercase focus:outline-none cursor-pointer"
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
                      </>
                    )}
                  </div>
                </div>

                {/* Milestone Title */}
                <h4 className="text-base sm:text-lg font-heading font-black text-white tracking-wide">
                  <InlineEdit
                    value={milestone.title}
                    onSave={(val) => handleUpdateMilestone(milestone.id, { title: val })}
                    isOwnerMode={isOwnerMode}
                    className="text-white font-black"
                  />
                </h4>

                {/* Milestone Description */}
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2">
                  <InlineEdit
                    value={milestone.description}
                    onSave={(val) => handleUpdateMilestone(milestone.id, { description: val })}
                    isOwnerMode={isOwnerMode}
                    multiline={true}
                    className="text-zinc-300"
                  />
                </p>

                {/* Highlights tags */}
                {milestone.highlights && milestone.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3 border-t border-zinc-800/50">
                    {milestone.highlights.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 text-[10px] font-mono border border-zinc-700/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
