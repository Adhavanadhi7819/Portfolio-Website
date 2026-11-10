import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Sparkles, Filter, Search, Plus } from 'lucide-react';
import { ProjectItem, ProjectCategory, DesignerInfo } from '../types/portfolio';
import { filterProjects } from '../utils/portfolioLogic';
import { ProjectCard } from './ProjectCard';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';

interface ProjectGalleryProps {
  projects: ProjectItem[];
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onOpenModal: (project: ProjectItem) => void;
  onPlayInReel: (timestamp: number) => void;
  onAddProject?: () => void;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (id: string) => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  projects,
  designerInfo,
  isOwnerMode = false,
  onOpenModal,
  onPlayInReel,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { label: string; value: ProjectCategory }[] = [
    { label: 'All Projects', value: 'all' },
    { label: '🏴‍☠️ Flagship Game', value: 'flagship-game' },
    { label: '⛽ Level Design & Post-Process', value: 'level-design' },
    { label: '🏛️ Environment Art', value: 'environment' },
    { label: '🏎️ Vehicle Rigging', value: 'vehicle-rigging' },
    { label: '🎸 Maya 3D Models', value: 'maya-3d' }
  ];

  const filteredByCategory = filterProjects(projects, activeCategory);

  const filteredProjects = filteredByCategory.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.techStack.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <section id="projects" className="py-10 sm:py-12 relative bg-[#070709]">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="projects"
          sectionTitle="Projects Gallery"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onAddProject}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-5 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Interactive Portfolio Index</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={designerInfo?.projectsHeading || 'Curated Works'}
                onSave={(val) => onUpdateDesignerInfo?.({ projectsHeading: val })}
                isOwnerMode={isOwnerMode}
                className="text-white font-black"
              />
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              <InlineEdit
                value={designerInfo?.projectsSubheading || 'Explorations spanning Unreal Engine level layout, dynamic vehicle rigging, lighting duality concepts, and Autodesk Maya models.'}
                onSave={(val) => onUpdateDesignerInfo?.({ projectsSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                className="text-zinc-400"
              />
            </p>
          </div>

          {/* Right actions: Search + Owner Add Project */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isOwnerMode && (
              <button
                onClick={onAddProject}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer"
                title="Create a new portfolio project"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Project</span>
              </button>
            )}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tech, car, level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs with interactive smooth gliding animations */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none" role="tablist">
          {categories.map((cat) => {
            const count = cat.value === 'all' 
              ? projects.length 
              : projects.filter(p => p.category === cat.value).length;
            const isSelected = activeCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 flex items-center gap-2 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isSelected
                    ? 'text-black font-bold border-amber-500 shadow-lg shadow-amber-500/25'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="project-tab-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-xl -z-10"
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
                <span
                  className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/20 text-black font-mono font-bold' : 'bg-zinc-800 text-zinc-400 font-mono'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Projects Grid with smooth transition */}
        {filteredProjects.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProjectCard
                    project={project}
                    isOwnerMode={isOwnerMode}
                    onOpenModal={onOpenModal}
                    onPlayInReel={onPlayInReel}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8">
            <p className="text-zinc-400 text-sm">No projects matched your search criteria.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-amber-400 underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
