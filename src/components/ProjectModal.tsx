import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, CheckCircle2 } from 'lucide-react';
import { ProjectItem } from '../types/portfolio';
import { formatVideoTime } from '../utils/portfolioLogic';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onPlayInReel: (timestamp: number) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onPlayInReel
}) => {
  const initialImg = project?.galleryImages[0] || project?.thumbnail || '';
  const [activeImage, setActiveImage] = useState<string>(initialImg);

  useEffect(() => {
    if (project) {
      setActiveImage(project.galleryImages[0] || project.thumbnail || '');
    }
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase">
              {project.categoryLabel}
            </span>
            <span className="text-zinc-500 font-mono text-xs hidden sm:inline">• Game Design Study</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Main Visual Display */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black border border-zinc-800">
              <img
                src={activeImage || project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              {project.videoTimestamp !== undefined && (
                <button
                  onClick={() => {
                    onPlayInReel(project.videoTimestamp!);
                    onClose();
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play at {formatVideoTime(project.videoTimestamp)}</span>
                </button>
              )}
            </div>

            {/* Gallery Selector thumbnails if multiple images */}
            {project.galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {project.galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-24 aspect-video rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      activeImage === img
                        ? 'border-amber-500 ring-2 ring-amber-500/40'
                        : 'border-zinc-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-heading font-black text-white">
              {project.title}
            </h2>
            <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Concept Breakdown Grid */}
          {project.conceptNotes && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Visual Theme & Mood:
                </span>
                <p className="text-zinc-200 font-medium">{project.conceptNotes.theme}</p>
              </div>
              <div>
                <span className="font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Lighting & Post-Processing:
                </span>
                <p className="text-amber-400 font-medium">{project.conceptNotes.lighting}</p>
              </div>
              <div>
                <span className="font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Gameplay & Mechanics:
                </span>
                <p className="text-zinc-200 font-medium">{project.conceptNotes.mechanics}</p>
              </div>
              {project.conceptNotes.levelScale && (
                <div>
                  <span className="font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    Level Scale:
                  </span>
                  <p className="text-zinc-200 font-medium">{project.conceptNotes.levelScale}</p>
                </div>
              )}
            </div>
          )}

          {/* Key Technical Features Checklist */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-3">
              Key Technical Implementations:
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {project.keyFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold mb-2">
              Tools & Systems:
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-zinc-900 text-zinc-200 text-xs font-mono border border-zinc-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Back to Overview
          </button>

          {project.videoTimestamp !== undefined && (
            <button
              onClick={() => {
                onPlayInReel(project.videoTimestamp!);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Watch in Showreel ({formatVideoTime(project.videoTimestamp)})</span>
            </button>
          )}
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
