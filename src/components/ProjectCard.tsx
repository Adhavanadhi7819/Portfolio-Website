import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, ArrowUpRight, Edit3, Trash2 } from 'lucide-react';
import { ProjectItem } from '../types/portfolio';
import { formatVideoTime } from '../utils/portfolioLogic';
import { MediaUploadOverlay } from './MediaUploadOverlay';
import { PhotoAdjustOverlay, getPhotoAlignImgProps } from './PhotoAdjustOverlay';

interface ProjectCardProps {
  project: ProjectItem;
  isOwnerMode?: boolean;
  onOpenModal: (project: ProjectItem) => void;
  onPlayInReel?: (timestamp: number) => void;
  onEdit?: (project: ProjectItem) => void;
  onDelete?: (id: string) => void;
  onSaveProject?: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isOwnerMode = false,
  onOpenModal,
  onPlayInReel,
  onEdit,
  onDelete,
  onSaveProject
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCardPlaying, setIsCardPlaying] = useState(false);
  const [isCardMuted, setIsCardMuted] = useState(true);
  const cardVideoRef = useRef<HTMLVideoElement>(null);
  const { fitClass, style: alignStyle } = getPhotoAlignImgProps(project.thumbnailAlign);

  const toggleCardVideo = () => {
    const vid = cardVideoRef.current;
    if (!vid) {
      onOpenModal(project);
      return;
    }
    if (vid.paused) {
      void vid.play().then(() => setIsCardPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsCardPlaying(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="h-full group rounded-2xl bg-zinc-950/65 hover:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 hover:border-amber-500/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-colors duration-300 flex flex-col justify-between"
    >
      {/* Top Image / Video & Overlays */}
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-black">
          {project.videoUrl ? (
            <>
              <video
                key={project.videoUrl}
                ref={cardVideoRef}
                src={project.videoUrl}
                poster={project.thumbnail}
                muted={isCardMuted}
                playsInline
                loop
                preload="metadata"
                onPlay={() => setIsCardPlaying(true)}
                onPause={() => setIsCardPlaying(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardVideo();
                }}
                className="w-full h-full object-cover bg-black cursor-pointer"
              />
              {!isCardPlaying && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardVideo();
                  }}
                  aria-label={`Play ${project.title} video preview`}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-xl z-10 cursor-pointer transition-transform hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full group-hover:scale-105 transition-transform duration-500">
              <img
                src={project.thumbnail}
                alt={project.title}
                className={`w-full h-full ${fitClass} transition-all duration-300`}
                style={alignStyle}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30"></div>

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-20">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono text-amber-400 border border-amber-500/30 uppercase font-semibold truncate max-w-[42%]">
              {project.categoryLabel}
            </span>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {isOwnerMode && (
                <>
                  {!project.videoUrl && (
                    <PhotoAdjustOverlay
                      align={project.thumbnailAlign}
                      isOwnerMode={isOwnerMode}
                      compact
                      staticPosition
                      onChange={(nextAlign) => {
                        const updated = { ...project, thumbnailAlign: nextAlign };
                        if (onSaveProject) {
                          onSaveProject(updated);
                        } else if (onEdit) {
                          onEdit(updated);
                        }
                      }}
                    />
                  )}
                  <MediaUploadOverlay
                    currentUrl={project.thumbnail}
                    mediaType="image"
                    isOwnerMode={isOwnerMode}
                    onMediaUploaded={(newUrl) => {
                      if (onSaveProject) {
                        onSaveProject({ ...project, thumbnail: newUrl });
                      } else if (onEdit) {
                        onEdit({ ...project, thumbnail: newUrl });
                      }
                    }}
                    label="Photo"
                    position="top-right"
                    className="!static"
                    defaultFallbackUrl="/showcase/gas-station-night.jpg"
                  />
                  <MediaUploadOverlay
                    currentUrl={project.videoUrl}
                    mediaType="video"
                    isOwnerMode={isOwnerMode}
                    onMediaUploaded={(newVideoUrl) => {
                      if (onSaveProject) {
                        onSaveProject({ ...project, videoUrl: newVideoUrl });
                      } else if (onEdit) {
                        onEdit({ ...project, videoUrl: newVideoUrl });
                      }
                      setTimeout(() => {
                        const vid = cardVideoRef.current;
                        if (vid) {
                          vid.muted = true;
                          void vid.play().then(() => setIsCardPlaying(true)).catch(() => {});
                        }
                      }, 120);
                    }}
                    label="Video"
                    position="top-right"
                    className="!static"
                  />
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

                  {confirmDelete ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(project.id);
                        setConfirmDelete(false);
                      }}
                      className="px-2 py-1 rounded-md bg-red-600 text-white font-mono text-[10px] font-bold uppercase transition-all shadow-lg cursor-pointer"
                      title="Click to permanently confirm delete"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                        setTimeout(() => setConfirmDelete(false), 3500);
                      }}
                      className="p-1.5 rounded-md bg-red-600/90 text-white hover:bg-red-500 font-bold transition-all shadow-md cursor-pointer"
                      title={`Delete ${project.title}`}
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              {project.videoUrl ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardVideo();
                    }}
                    className="p-1 rounded-md bg-black/75 hover:bg-amber-500 hover:text-black backdrop-blur-md text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                    title={isCardPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {isCardPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextMuted = !isCardMuted;
                      setIsCardMuted(nextMuted);
                      if (cardVideoRef.current) cardVideoRef.current.muted = nextMuted;
                    }}
                    className="p-1 rounded-md bg-black/75 hover:bg-zinc-800 backdrop-blur-md text-zinc-200 border border-zinc-700/80 transition-colors cursor-pointer"
                    title={isCardMuted ? 'Unmute preview' : 'Mute preview'}
                  >
                    {isCardMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5 text-amber-400" />}
                  </button>
                </div>
              ) : project.videoTimestamp !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayInReel?.(project.videoTimestamp!);
                  }}
                  className="px-2 py-0.5 rounded-md bg-black/75 hover:bg-amber-500 hover:text-black backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-700/80 hover:border-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Jump to this project in the showreel"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{formatVideoTime(project.videoTimestamp)}</span>
                </button>
              )}
            </div>
          </div>

          {project.isFlagship && (
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider shadow z-10">
              FLAGSHIP GAME
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2.5">
          <h3 className="text-lg font-heading font-bold text-white group-hover:text-amber-400 transition-colors">
            {project.title}
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 text-justify [text-justify:inter-word] hyphens-auto">
            {project.summary}
          </p>

          {/* Tech stack tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
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
      <div className="px-4 py-2.5 border-t border-zinc-800/60 flex items-center justify-between gap-3">
        <button
          onClick={() => onOpenModal(project)}
          className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 group/btn transition-colors py-1.5 cursor-pointer"
        >
          <span>Deep Dive Breakdown</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>

        {(project.videoUrl || project.videoTimestamp !== undefined) && (
          <button
            onClick={() =>
              project.videoUrl
                ? onOpenModal(project)
                : onPlayInReel?.(project.videoTimestamp!)
            }
            className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-amber-500 hover:text-black text-amber-400 border border-zinc-700/60 transition-all cursor-pointer"
            aria-label={
              project.videoUrl
                ? `Watch ${project.title} video`
                : `Play ${project.title} in video showreel`
            }
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
