import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Layers,
  FastForward,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { VIDEO_PATH, VIDEO_CHAPTERS } from '../data/portfolioData';
import { formatVideoTime, findCurrentChapter } from '../utils/portfolioLogic';
import { VideoChapter, DesignerInfo } from '../types/portfolio';

export interface VideoReelRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  scrollTo: () => void;
}

interface CinematicVideoReelProps {
  videoChapters?: VideoChapter[];
  videoPath?: string;
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onChapterSelect?: (chapter: VideoChapter) => void;
  onAddChapter?: () => void;
  onEditChapter?: (chapter: VideoChapter) => void;
  onDeleteChapter?: (chapterId: string) => void;
  onEditReelSettings?: () => void;
}

export const CinematicVideoReel = forwardRef<VideoReelRef, CinematicVideoReelProps>(({ 
  videoChapters = VIDEO_CHAPTERS,
  videoPath = VIDEO_PATH,
  designerInfo,
  isOwnerMode = false,
  onChapterSelect,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onEditReelSettings
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(292.65);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeChapter, setActiveChapter] = useState<VideoChapter>(videoChapters[0] || VIDEO_CHAPTERS[0]);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    },
    play: () => {
      videoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    },
    pause: () => {
      videoRef.current?.pause();
      setIsPlaying(false);
    },
    scrollTo: () => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const ch = findCurrentChapter(video.currentTime, videoChapters);
      if (ch && ch.id !== activeChapter.id) {
        setActiveChapter(ch);
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeChapter, videoChapters]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    const ch = findCurrentChapter(seconds, videoChapters);
    if (ch) {
      setActiveChapter(ch);
      onChapterSelect?.(ch);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(ratio * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(ratio * duration);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section id="reel" ref={containerRef} className="py-20 relative bg-[#09090c] border-y border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 block mb-2">
              Original Work Showcase Reel
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              {designerInfo?.reelHeading ? (
                designerInfo.reelHeading
              ) : (
                <>Cinematic <span className="text-amber-500">Showreel</span></>
              )}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              {designerInfo?.reelSubheading || 'Recorded directly from Unreal Engine and Autodesk Maya viewport sessions. Use the chapter navigator below to jump between projects.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline">
              {designerInfo?.reelResolutionNote || 'Resolution: 1080p 30fps'}
            </span>
            {isOwnerMode && (
              <>
                <button
                  onClick={onEditReelSettings}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Change Video Path or Showreel Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Video & Reel</span>
                </button>
                <button
                  onClick={onAddChapter}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Add Keyframe Chapter"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chapter</span>
                </button>
              </>
            )}
            <button
              onClick={() => handleSeek(171)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Jump to Pirate RPG (02:51)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Player Frame with Unreal HUD Styling */}
        <div 
          className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group"
          onMouseMove={handleUserActivity}
          onClick={handleUserActivity}
        >
          {/* Main Video Element */}
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              src={videoPath}
              poster="/showcase/hero-adhavan.jpg"
              playsInline
              preload="metadata"
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {/* Top HUD Overlay (Watermark & Active Chapter) */}
            <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded bg-black/60 border border-zinc-700/80 backdrop-blur-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">REC // UE5</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md">
                    {activeChapter.title}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-mono tracking-wider">
                    {activeChapter.subtitle}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700/80">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatVideoTime(currentTime)}</span>
                <span className="text-zinc-600">/</span>
                <span>{formatVideoTime(duration)}</span>
              </div>
            </div>

            {/* Center Big Play Button (when paused) */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 transition-all cursor-pointer z-20 group/btn"
                aria-label="Play Video"
              >
                <Play className="w-9 h-9 fill-black ml-1 text-black group-hover/btn:scale-105 transition-transform" />
              </button>
            )}

            {/* Bottom HUD Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/70 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              
              {/* Progress Scrubber Bar */}
              <div
                ref={progressBarRef}
                onClick={handleProgressBarClick}
                onMouseMove={handleProgressMouseMove}
                onMouseLeave={handleProgressMouseLeave}
                className="relative w-full h-3 bg-zinc-800/90 rounded-full cursor-pointer group/bar mb-4 overflow-visible"
              >
                {/* Chapter Ticks */}
                {videoChapters.map((ch) => {
                  const tickPercent = (ch.startTime / duration) * 100;
                  return (
                    <div
                      key={ch.id}
                      style={{ left: `${tickPercent}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-zinc-600 hover:bg-amber-400 z-10 transition-colors"
                      title={ch.title}
                    />
                  );
                })}

                {/* Filled Progress */}
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full relative"
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-300 shadow-md shadow-amber-500 scale-0 group-hover/bar:scale-100 transition-transform"></div>
                </div>

                {/* Hover time tooltip */}
                {hoverTime !== null && (
                  <div
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                    className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-amber-400 pointer-events-none whitespace-nowrap shadow-lg"
                  >
                    {formatVideoTime(hoverTime)}
                  </div>
                )}
              </div>

              {/* Lower Controls Row */}
              <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                
                {/* Left: Play/Pause, Rewind, Volume, Timecode */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white hover:text-amber-400 border border-zinc-700/80 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    onClick={() => handleSeek(0)}
                    className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors cursor-pointer hidden sm:block"
                    aria-label="Restart Video"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors cursor-pointer"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 accent-amber-500 cursor-pointer hidden sm:block h-1.5 rounded-lg bg-zinc-800"
                      aria-label="Volume Slider"
                    />
                  </div>

                  {/* Mobile Time */}
                  <span className="font-mono text-xs text-zinc-300 sm:hidden">
                    {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                  </span>
                </div>

                {/* Right: Chapter name, Speed, Fullscreen */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={cycleSpeed}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-700/80 font-mono text-xs transition-colors cursor-pointer"
                    aria-label={`Playback speed ${playbackSpeed}x`}
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors cursor-pointer"
                    aria-label="Toggle Fullscreen"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Interactive Chapter Strip */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Select Scene Chapter To Inspect:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                {videoChapters.length} Keyframe Milestones
              </span>

              {isOwnerMode && (
                <button
                  onClick={onAddChapter}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chapter</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {videoChapters.map((chapter) => {
              const isActive = activeChapter.id === chapter.id;
              return (
                <div
                  key={chapter.id}
                  className={`relative rounded-xl p-2.5 transition-all duration-200 border group ${
                    isActive
                      ? 'bg-zinc-800/90 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/50 hover:bg-zinc-800/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Owner edit & delete controls on chapter */}
                  {isOwnerMode && (
                    <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChapter?.(chapter);
                        }}
                        className="p-1 rounded bg-black/80 hover:bg-amber-500 text-zinc-300 hover:text-black border border-zinc-700 transition-colors"
                        title="Edit Chapter"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete chapter "${chapter.title}"?`)) {
                            onDeleteChapter?.(chapter.id);
                          }
                        }}
                        className="p-1 rounded bg-black/80 hover:bg-red-500 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleSeek(chapter.startTime)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-zinc-950">
                      <img
                        src={chapter.thumbnail}
                        alt={chapter.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-zinc-300">
                        {formatVideoTime(chapter.startTime)}
                      </span>
                      {isActive && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider shadow">
                            NOW PLAYING
                          </span>
                        </div>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-amber-400' : 'text-zinc-200 group-hover:text-white'}`}>
                      {chapter.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {chapter.subtitle}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
});

CinematicVideoReel.displayName = 'CinematicVideoReel';
