import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Sparkles, Filter, Search, Plus } from 'lucide-react';
import { ProjectItem, ProjectCategory, DesignerInfo, SectionTargetTab } from '../types/portfolio';
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
  onSaveProject?: (project: ProjectItem) => void;
  onDeleteProject?: (id: string) => void;
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

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  projects,
  designerInfo,
  isOwnerMode = false,
  onOpenModal,
  onPlayInReel,
  onAddProject,
  onEditProject,
  onSaveProject,
  onDeleteProject,
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
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { label: string; value: ProjectCategory }[] = [
    { label: 'All Works', value: 'all' },
    { label: 'Game Design', value: 'game-design' },
    { label: '3D Arts', value: '3d-arts' }
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
    <section id="projects" className="py-8 sm:py-10 border-b border-zinc-800/80 relative bg-[#070709] scroll-mt-[68px]">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="projects"
          sectionTitle="Projects Gallery"
          currentTab={currentTab}
          onChangeTab={onChangeTab}
          showDragHandle={showDragHandle}
          onDragStartPointer={onDragStartPointer}
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div className="flex-1 min-w-0 max-w-2xl">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Portfolio · Case Studies</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
              <InlineEdit
                value={designerInfo?.projectsHeading || 'Curated Works'}
                onSave={(val) => onUpdateDesignerInfo?.({ projectsHeading: val })}
                isOwnerMode={isOwnerMode}
                className="text-white font-bold"
              />
            </h2>
            <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed text-justify">
              <InlineEdit
                value={designerInfo?.projectsSubheading || 'Explorations spanning Unreal Engine level layout, dynamic vehicle rigging, lighting duality concepts, and Autodesk Maya models.'}
                onSave={(val) => onUpdateDesignerInfo?.({ projectsSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                className="text-zinc-400 text-justify"
              />
            </p>
          </div>

          {/* Right actions: Search + Owner Add Project */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isOwnerMode && (
              <button
                onClick={onAddProject}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                title="Create a new portfolio project"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Project</span>
              </button>
            )}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by tag, engine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Segmented Filter Tabs Bar matching demo layout */}
        <div className="flex flex-wrap items-center gap-1.5 mb-8 p-1.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl w-fit max-w-full overflow-x-auto scrollbar-none" role="tablist">
          {categories.map((cat) => {
            const count = filterProjects(projects, cat.value).length;
            const isSelected = activeCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isSelected
                    ? 'text-black font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="project-tab-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-amber-500 rounded-xl shadow-sm"
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
                <span
                  className={`relative z-10 text-[10px] font-mono ${
                    isSelected ? 'text-black/75 font-bold' : 'text-zinc-500'
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 items-stretch"
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
                  className="h-full"
                >
                  <ProjectCard
                    project={project}
                    isOwnerMode={isOwnerMode}
                    onOpenModal={onOpenModal}
                    onPlayInReel={onPlayInReel}
                    onEdit={onEditProject}
                    onSaveProject={onSaveProject}
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
