import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Video, Link, Check, X, Sparkles } from 'lucide-react';
import { compressImageFile, readFileAsDataUrl } from '../utils/fileHelpers';

interface MediaUploadOverlayProps {
  currentUrl?: string;
  mediaType?: 'image' | 'video';
  isOwnerMode?: boolean;
  onMediaUploaded: (newUrl: string) => void;
  label?: string;
  className?: string;
  position?: 'top-right' | 'top-left' | 'center' | 'bottom-right';
}

export const MediaUploadOverlay: React.FC<MediaUploadOverlayProps> = ({
  currentUrl,
  mediaType = 'image',
  isOwnerMode = false,
  onMediaUploaded,
  label = mediaType === 'video' ? 'Change Video' : 'Upload Photo',
  className = '',
  position = 'top-right'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOwnerMode) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      if (mediaType === 'image') {
        const compressed = await compressImageFile(file);
        onMediaUploaded(compressed);
      } else {
        // Video file
        const dataUrl = await readFileAsDataUrl(file);
        onMediaUploaded(dataUrl);
      }
    } catch (err) {
      console.error('Failed to upload media file:', err);
      alert('Could not process this file. Please ensure it is a valid ' + mediaType + ' format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onMediaUploaded(urlInput.trim());
      setIsUrlModalOpen(false);
    }
  };

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-2 right-2'
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/png,image/jpeg,image/webp,image/gif'}
        className="hidden"
      />

      {/* Floating Upload Trigger Pill */}
      <div 
        className={`absolute z-30 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-all ${positionClasses[position]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/85 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 hover:border-amber-400 text-[11px] font-mono font-bold tracking-wider uppercase transition-all shadow-xl backdrop-blur-md cursor-pointer"
          title={`Upload new ${mediaType} from computer`}
        >
          {isUploading ? (
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full" />
          ) : mediaType === 'video' ? (
            <Video className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>{isUploading ? 'Uploading...' : label}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setUrlInput(currentUrl || '');
            setIsUrlModalOpen(true);
          }}
          className="p-1.5 rounded-lg bg-black/85 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/50 transition-all shadow-lg backdrop-blur-md cursor-pointer"
          title="Paste Web URL instead"
        >
          <Link className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL Input Modal */}
      {isUrlModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsUrlModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-zinc-950 border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase font-mono">
                <Link className="w-4 h-4" />
                <span>Set {mediaType === 'video' ? 'Video' : 'Photo'} URL</span>
              </div>
              <button 
                onClick={() => setIsUrlModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Enter Direct Web URL or Local Path:
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={mediaType === 'video' ? '/assets/aistudio/... or https://...' : '/showcase/... or https://...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Apply URL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
