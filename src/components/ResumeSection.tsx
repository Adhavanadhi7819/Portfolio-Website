import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Upload, ArrowUpRight, Trash2, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';
import { DesignerInfo } from '../types/portfolio';
import { DESIGNER_INFO } from '../data/portfolioData';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { uploadDocumentAsset } from '../utils/fileHelpers';

// Bind PDF.js worker in-bundle so preview works offline and inside nested iframes without worker fetch issues
(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

interface ResumeSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditResume?: () => void;
  onContactClick?: () => void;
  onWatchReelClick?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const base64 = dataUrl.slice(commaIdx + 1).replace(/\s/g, '');
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

interface PdfCanvasPreviewProps {
  src: string;
  fileName?: string;
}

const PdfCanvasPreview: React.FC<PdfCanvasPreviewProps> = ({ src, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageImages, setPageImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const renderPdf = async () => {
      setStatus('loading');
      setPageImages([]);

      try {
        const bytes = src.startsWith('data:') ? dataUrlToUint8Array(src) : null;
        loadingTask = bytes
          ? pdfjsLib.getDocument({ data: bytes })
          : pdfjsLib.getDocument({ url: src });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const containerWidth = containerRef.current?.clientWidth || 760;
        const targetDisplayWidth = Math.max(containerWidth - 24, 340);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderedPages: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = targetDisplayWidth / baseViewport.width;
          const renderScale = Math.max(fitScale * dpr, 1.8);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) continue;

          // Paint crisp white paper backdrop so transparent PDFs never render black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
            background: 'rgb(255, 255, 255)'
          }).promise;

          if (cancelled) return;
          renderedPages.push(canvas.toDataURL('image/png'));
          setPageImages([...renderedPages]);
        }

        if (!cancelled) {
          setStatus(renderedPages.length > 0 ? 'ready' : 'error');
        }
      } catch (err) {
        console.error('PDF preview render failed:', err);
        if (!cancelled) {
          setStatus('error');
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
    };
  }, [src, fileName]);

  return (
    <div ref={containerRef} className="bg-zinc-950/90 p-3 sm:p-4 space-y-3">
      {status === 'loading' && pageImages.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-xs font-mono text-zinc-400">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          <span>Rendering resume preview...</span>
        </div>
      )}

      {status === 'error' && pageImages.length === 0 && (
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center space-y-2 text-xs font-mono text-zinc-400">
          <p className="text-zinc-200 font-semibold">
            Preview could not render for this PDF format.
          </p>
          <p>Click the Download Resume button above to view the full file directly.</p>
        </div>
      )}

      {pageImages.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
            <span>Document Preview</span>
            <span>
              {pageImages.length} {pageImages.length === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
            {pageImages.map((imgSrc, idx) => (
              <img
                key={`pdf-page-${idx + 1}`}
                src={imgSrc}
                alt={`${fileName || 'Resume'} — Page ${idx + 1}`}
                className="w-full h-auto rounded-lg shadow-xl border border-zinc-800 bg-white block mx-auto"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditResume,
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
  const [confirmRemovePdf, setConfirmRemovePdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!info.resumePdfUrl) {
      setDownloadBlobUrl(null);
      return;
    }
    if (!info.resumePdfUrl.startsWith('data:')) {
      setDownloadBlobUrl(info.resumePdfUrl);
      return;
    }

    const commaIdx = info.resumePdfUrl.indexOf(',');
    if (commaIdx === -1) {
      setDownloadBlobUrl(info.resumePdfUrl);
      return;
    }

    const header = info.resumePdfUrl.slice(0, commaIdx);
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bytes = dataUrlToUint8Array(info.resumePdfUrl);

    if (!bytes) {
      setDownloadBlobUrl(info.resumePdfUrl);
      return;
    }

    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mime });
    const objectUrl = URL.createObjectURL(blob);
    setDownloadBlobUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [info.resumePdfUrl]);

  const handleResumeFile = async (file: File) => {
    try {
      setUploadError(null);
      setIsUploadingResume(true);
      const uploaded = await uploadDocumentAsset(file);
      onUpdateDesignerInfo?.({
        resumePdfUrl: uploaded.url,
        resumeFileName: uploaded.fileName,
        resumeUploadDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        resumeFileSize: uploaded.fileSize
      });
    } catch (err) {
      console.error('Resume upload failed:', err);
      setUploadError(
        err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED'
          ? 'Owner session expired. Re-verify 2FA to upload your resume to the server.'
          : 'Could not upload resume file. Please select a valid PDF, image, or DOCX.'
      );
    } finally {
      setIsUploadingResume(false);
    }
  };

  const isPdfDocument =
    Boolean(info.resumePdfUrl?.startsWith('data:application/pdf')) ||
    Boolean(info.resumePdfUrl?.toLowerCase().endsWith('.pdf')) ||
    Boolean(info.resumeFileName?.toLowerCase().endsWith('.pdf'));

  const isImageDocument =
    Boolean(info.resumePdfUrl?.startsWith('data:image/')) ||
    Boolean(/\.(png|jpe?g|webp)$/i.test(info.resumePdfUrl || '')) ||
    Boolean(/\.(png|jpe?g|webp)$/i.test(info.resumeFileName || ''));

  return (
    <section
      id="resume"
      className="pt-20 sm:pt-24 pb-10 sm:pb-12 relative bg-[#050507] flex-1 flex flex-col justify-center"
    >
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="resume"
          sectionTitle="Game Designer Resume"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditResume}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      {/* Subtle monochromatic backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[360px] bg-amber-500/6 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        {/* Clean Section Header */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Curriculum Vitae</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black uppercase text-white tracking-tight">
            <InlineEdit
              value={info.resumeHeading || 'RESUME'}
              onSave={(val) => onUpdateDesignerInfo?.({ resumeHeading: val })}
              isOwnerMode={isOwnerMode}
              label="Resume Heading"
            />
          </h2>
          <div className="text-zinc-400 text-sm sm:text-base mt-2">
            <InlineEdit
              value={
                info.resumeSubheading ||
                'Download my custom resume document directly for studio roles and collaboration inquiries.'
              }
              onSave={(val) => onUpdateDesignerInfo?.({ resumeSubheading: val })}
              isOwnerMode={isOwnerMode}
              multiline={true}
              label="Resume Subtitle"
              as="p"
            />
          </div>
        </div>

        {uploadError && (
          <div className="px-4 py-3 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs font-mono flex items-center justify-between">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="underline ml-3 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Uploaded Custom Resume Card */}
        {info.resumePdfUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden"
          >
            {/* File Metadata & Single Primary Download Action Bar */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-950 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">
                    {info.resumeFileName || `${info.name}_Resume.pdf`}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Ready to download
                    {info.resumeFileSize ? ` · ${info.resumeFileSize}` : ''}
                    {info.resumeUploadDate ? ` · Updated ${info.resumeUploadDate}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={downloadBlobUrl || info.resumePdfUrl}
                  download={
                    info.resumeFileName ||
                    `${info.name.replace(/\s+/g, '_')}_Game_Designer_Resume.pdf`
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Resume</span>
                </a>

                {isOwnerMode && (
                  <>
                    <label
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Upload a new file to replace the current resume"
                    >
                      {isUploadingResume ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingResume ? 'Uploading...' : 'Replace File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                        className="hidden"
                        disabled={isUploadingResume}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeFile(file);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {confirmRemovePdf ? (
                      <button
                        onClick={() => {
                          onUpdateDesignerInfo?.({
                            resumePdfUrl: undefined,
                            resumeFileName: undefined,
                            resumeUploadDate: undefined,
                            resumeFileSize: undefined
                          });
                          setConfirmRemovePdf(false);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-red-600 text-white border border-red-500 transition-colors cursor-pointer text-xs font-mono font-bold"
                      >
                        Confirm Remove?
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmRemovePdf(true);
                          setTimeout(() => setConfirmRemovePdf(false), 3500);
                        }}
                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800/50 transition-colors cursor-pointer"
                        title="Remove uploaded resume file"
                        aria-label="Remove uploaded resume file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Document Preview */}
            {isPdfDocument ? (
              <PdfCanvasPreview
                src={info.resumePdfUrl}
                fileName={info.resumeFileName}
              />
            ) : isImageDocument ? (
              <div className="bg-black p-4 flex justify-center">
                <img
                  src={info.resumePdfUrl}
                  alt={info.resumeFileName || 'Resume Preview'}
                  className="max-w-full max-h-[680px] rounded-xl border border-zinc-800 object-contain"
                />
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-zinc-400 bg-zinc-950/80">
                Document attached ({info.resumeFileName || 'Resume File'}). Click{' '}
                <strong className="text-amber-400">Download Resume</strong> above to open it.
              </div>
            )}
          </motion.div>
        ) : isOwnerMode ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleResumeFile(file);
            }}
            className="p-8 sm:p-10 rounded-2xl bg-zinc-950 border-2 border-dashed border-amber-500/40 hover:border-amber-400 transition-colors text-center space-y-4 shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-heading font-bold text-white">
                Upload Your Resume Document
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Upload your own crafted PDF, image, or DOCX resume here. Once uploaded, visitors can
                preview and download it directly from this tab.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20">
              {isUploadingResume ? (
                <Loader2 className="w-4 h-4 stroke-[2.5] animate-spin" />
              ) : (
                <Upload className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isUploadingResume ? 'Uploading Resume...' : 'Choose Resume File (PDF / DOCX)'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                className="hidden"
                disabled={isUploadingResume}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeFile(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-heading font-bold text-white">
                Resume Download Coming Soon
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                My downloadable resume file is being prepared. Please reach out directly if you
                would like a copy sent to you.
              </p>
            </div>
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Request Resume via Contact</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
