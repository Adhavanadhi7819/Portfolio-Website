import React from 'react';
import { Play, ArrowUpRight, Sparkles, Layers, Box, Edit3, Trash2 } from 'lucide-react';
import { ProjectItem } from '../types/portfolio';
import { formatVideoTime } from '../utils/portfolioLogic';

interface ProjectCardProps {
  project: ProjectItem;
  isOwnerMode?: boolean;
  onOpenModal: (project: ProjectItem) => void;
  onPlayInReel?: (timestamp: number) => void;
  onEdit?: (project: ProjectItem) => void;
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isOwnerMode = false,
  onOpenModal,
  onPlayInReel,
  onEdit,
  onDelete
}) => {
  return (
    <div className="group rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between">
      
      {/* Top Image & Overlays */}
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-black">
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30"></div>

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono text-amber-400 border border-amber-500/30 uppercase font-semibold">
              {project.categoryLabel}
            </span>

            <div className="flex items-center gap-1.5">
              {isOwnerMode && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(project);
                    }}
                    className="p-1.5 rounded-md bg-amber-500 text-black hover:bg-amber-400 font-bold transition-all shadow-md cursor-pointer"
                    title={`Edit ${project.title}`}
                    aria-label={`Edit ${project.title}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete project "${project.title}"?`)) {
                        onDelete?.(project.id);
                      }
                    }}
                    className="p-1.5 rounded-md bg-red-600/90 text-white hover:bg-red-500 font-bold transition-all shadow-md cursor-pointer"
                    title={`Delete ${project.title}`}
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {project.videoTimestamp !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayInReel?.(project.videoTimestamp!);
                  }}
                  className="px-2.5 py-1 rounded-md bg-black/75 hover:bg-amber-500 hover:text-black backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-zinc-700/80 hover:border-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Jump to this project in the showreel"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{formatVideoTime(project.videoTimestamp)}</span>
                </button>
              )}
            </div>
          </div>

          {project.isFlagship && (
            <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider shadow">
              FLAGSHIP GAME
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <h3 className="text-lg font-heading font-bold text-white group-hover:text-amber-400 transition-colors">
            {project.title}
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
            {project.summary}
          </p>

          {/* Tech stack pill tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.techStack.slice(0, 3).map((tech, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono border border-zinc-700/60"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/40 text-zinc-500 font-mono">
                +{project.techStack.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-0 border-t border-zinc-800/60 flex items-center justify-between gap-3 mt-2">
        <button
          onClick={() => onOpenModal(project)}
          className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 group/btn transition-colors py-2 cursor-pointer"
        >
          <span>Deep Dive Breakdown</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>

        {project.videoTimestamp !== undefined && (
          <button
            onClick={() => onPlayInReel?.(project.videoTimestamp!)}
            className="p-2 rounded-lg bg-zinc-800/70 hover:bg-amber-500 hover:text-black text-amber-400 border border-zinc-700/60 transition-all cursor-pointer"
            aria-label={`Play ${project.title} in video showreel`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>

    </div>
  );
};
