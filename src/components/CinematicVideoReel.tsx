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
  Plus,
  Edit2,
  Trash2,
  Upload
} from 'lucide-react';
import { VIDEO_PATH, VIDEO_CHAPTERS } from '../data/portfolioData';
import { formatVideoTime, findCurrentChapter } from '../utils/portfolioLogic';
import { VideoChapter, DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';

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
  onUploadVideo?: (newVideoPath: string) => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
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
  onEditReelSettings,
  onUploadVideo,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(292.65);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeChapter, setActiveChapter] = useState<VideoChapter>(videoChapters[0] || VIDEO_CHAPTERS[0]);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isNativePlaying, setIsNativePlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Playback simulation timer when native video is not available or errored
  useEffect(() => {
    if (!isPlaying || isNativePlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prevTime => {
        const nextTime = prevTime + 0.1 * playbackSpeed;
        if (nextTime >= duration) {
          return 0; // loop smoothly from beginning
        }
        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isNativePlaying, playbackSpeed, duration]);

  // Synchronize active chapter as currentTime advances
  useEffect(() => {
    const ch = findCurrentChapter(currentTime, videoChapters);
    if (ch && ch.id !== activeChapter.id) {
      setActiveChapter(ch);
    }
  }, [currentTime, videoChapters, activeChapter.id]);

  const attemptPlay = async () => {
    setIsPlaying(true);
    if (!videoRef.current || hasVideoError) {
      setIsNativePlaying(false);
      return;
    }
    try {
      await videoRef.current.play();
      setIsNativePlaying(true);
    } catch {
      try {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          await videoRef.current.play();
          setIsNativePlaying(true);
        }
      } catch {
        setIsNativePlaying(false);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      setCurrentTime(seconds);
      const ch = findCurrentChapter(seconds, videoChapters);
      if (ch) {
        setActiveChapter(ch);
        onChapterSelect?.(ch);
      }
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = seconds;
        } catch {}
      }
      attemptPlay();
    },
    play: () => {
      attemptPlay();
    },
    pause: () => {
      setIsPlaying(false);
      setIsNativePlaying(false);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
    },
    scrollTo: () => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }));

  // Re-load video whenever videoPath changes
  useEffect(() => {
    setHasVideoError(false);
    if (videoRef.current) {
      try {
        videoRef.current.load();
      } catch {}
    }
  }, [videoPath]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (isNativePlaying) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
      setHasVideoError(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsNativePlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => {
      if (isNativePlaying) setIsPlaying(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setIsNativePlaying(false);
    };
    const handleWaiting = () => {
      if (isNativePlaying) setIsBuffering(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      setHasVideoError(false);
    };
    const handleError = () => {
      setIsBuffering(false);
      setIsNativePlaying(false);
      setHasVideoError(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [isNativePlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsNativePlaying(false);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
    } else {
      attemptPlay();
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

  const handleSelectChapter = (chapter: VideoChapter) => {
    setActiveChapter(chapter);
    setCurrentTime(chapter.startTime);
    onChapterSelect?.(chapter);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = chapter.startTime;
      } catch {}
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    const ch = findCurrentChapter(seconds, videoChapters);
    if (ch) {
      setActiveChapter(ch);
      onChapterSelect?.(ch);
    }
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = seconds;
      } catch {}
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
    <section id="reel" ref={containerRef} className="py-10 sm:py-12 relative bg-[#09090c] border-y border-zinc-800/80">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="reel"
          sectionTitle="Cinematic Showreel"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditReelSettings}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-5 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 block mb-1">
              Original Work Showcase Reel
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={designerInfo?.reelHeading || 'Cinematic Showreel'}
                onSave={(val) => onUpdateDesignerInfo?.({ reelHeading: val })}
                isOwnerMode={isOwnerMode}
                label="Reel Heading"
              />
            </h2>
            <div className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl">
              <InlineEdit
                value={designerInfo?.reelSubheading || 'Recorded directly from Unreal Engine and Autodesk Maya viewport sessions. Use the chapter navigator below to jump between projects.'}
                onSave={(val) => onUpdateDesignerInfo?.({ reelSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Reel Description"
                as="p"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Owner-Only Video Upload Option */}
            {isOwnerMode && (
              <label 
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Upload your MP4 video reel file from your computer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Reel (MP4)</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const objectUrl = URL.createObjectURL(file);
                    onUploadVideo?.(objectUrl);
                    setHasVideoError(false);
                    setTimeout(() => {
                      attemptPlay();
                    }, 120);
                  }}
                />
              </label>
            )}

            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline">
              <InlineEdit
                value={designerInfo?.reelResolutionNote || 'Resolution: 1080p 30fps'}
                onSave={(val) => onUpdateDesignerInfo?.({ reelResolutionNote: val })}
                isOwnerMode={isOwnerMode}
                label="Resolution Badge"
              />
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
          {/* Main Viewport Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            {/* HTML5 Video element */}
            <video
              ref={videoRef}
              src={videoPath}
              poster={activeChapter.thumbnail || '/showcase/hero-adhavan.jpg'}
              playsInline
              preload="auto"
              controlsList="nodownload"
              className={`w-full h-full object-contain cursor-pointer ${isNativePlaying ? 'block' : 'hidden'}`}
              onClick={togglePlay}
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support HTML5 MP4 video playback.
            </video>

            {/* Interactive Scene Viewport (Active when native video stream is not playing) */}
            {!isNativePlaying && (
              <div 
                className="relative w-full h-full cursor-pointer overflow-hidden group/screen select-none"
                onClick={togglePlay}
              >
                <img
                  src={activeChapter.thumbnail || '/showcase/hero-adhavan.jpg'}
                  alt={activeChapter.title}
                  className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                    isPlaying ? 'scale-105 filter brightness-105' : 'scale-100 filter brightness-100'
                  }`}
                />
                {/* Cinematic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none" />

                {/* Inspecting Scene HUD Badge */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black font-mono font-bold text-[11px] tracking-wider uppercase shadow-md">
                    {activeChapter.category}
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-zinc-700/80 text-zinc-300 font-mono text-[11px]">
                    {formatVideoTime(activeChapter.startTime)} — {formatVideoTime(activeChapter.endTime)}
                  </span>
                </div>
              </div>
            )}

            {/* In-Place Live Video Upload for Owner */}
            <MediaUploadOverlay
              currentUrl={videoPath}
              mediaType="video"
              isOwnerMode={isOwnerMode}
              onMediaUploaded={(newUrl) => {
                onUploadVideo?.(newUrl);
                setHasVideoError(false);
                setTimeout(() => attemptPlay(), 100);
              }}
              label="Upload Video File"
              position="top-right"
              className="mt-14 mr-3"
            />

            {/* Buffering Spinner */}
            {isBuffering && (
              <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/70 backdrop-blur-sm border border-amber-500/40 flex items-center justify-center z-20 pointer-events-none">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Top HUD Overlay (Clean Watermark & Active Chapter) */}
            <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded bg-black/60 border border-zinc-700/80 backdrop-blur-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-200 uppercase">REEL</span>
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
            {!isPlaying && !isBuffering && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 transition-all cursor-pointer z-20 group/btn"
                aria-label="Play Reel"
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

        {/* Active Scene Inspection Details Card */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {activeChapter.title}
                </h4>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {activeChapter.subtitle}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Keyframe: {formatVideoTime(activeChapter.startTime)} – {formatVideoTime(activeChapter.endTime)}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                {activeChapter.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => {
                const currentIndex = videoChapters.findIndex(c => c.id === activeChapter.id);
                const prevIndex = (currentIndex - 1 + videoChapters.length) % videoChapters.length;
                handleSelectChapter(videoChapters[prevIndex]);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
            >
              ← Prev Scene
            </button>
            <button
              onClick={() => {
                const currentIndex = videoChapters.findIndex(c => c.id === activeChapter.id);
                const nextIndex = (currentIndex + 1) % videoChapters.length;
                handleSelectChapter(videoChapters[nextIndex]);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Next Scene →
            </button>
          </div>
        </div>

        {/* Interactive Chapter Strip */}
        <div className="mt-4 sm:mt-5">
          <div className="flex items-center justify-between mb-2.5">
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
                          onDeleteChapter?.(chapter.id);
                        }}
                        className="p-1 rounded bg-black/80 hover:bg-red-500 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                        title={`Delete Chapter "${chapter.title}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectChapter(chapter)}
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
