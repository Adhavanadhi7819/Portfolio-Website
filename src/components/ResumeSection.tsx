import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Upload, ArrowUpRight, Trash2 } from 'lucide-react';
import { DesignerInfo } from '../types/portfolio';
import { DESIGNER_INFO } from '../data/portfolioData';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';

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

  const handleResumeFile = (file: File) => {
    try {
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = file.size > 0 ? Math.floor(Math.log(file.size) / Math.log(k)) : 0;
        const formattedSize =
          file.size > 0
            ? parseFloat((file.size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
            : 'Ready';

        onUpdateDesignerInfo?.({
          resumePdfUrl: dataUrl,
          resumeFileName: file.name,
          resumeUploadDate: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          resumeFileSize: formattedSize
        });
      };
      reader.onerror = () => {
        setUploadError('Could not read resume file. Please select a valid PDF or DOCX.');
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError('Could not process resume file. Please select a valid PDF or DOCX.');
    }
  };

  const isPdfDocument =
    Boolean(info.resumePdfUrl?.startsWith('data:application/pdf')) ||
    Boolean(info.resumeFileName?.toLowerCase().endsWith('.pdf'));

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
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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

          {info.resumePdfUrl && (
            <a
              href={info.resumePdfUrl}
              download={
                info.resumeFileName ||
                `${info.name.replace(/\s+/g, '_')}_Game_Designer_Resume.pdf`
              }
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0 self-start md:self-auto"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Resume</span>
            </a>
          )}
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
            {/* File Metadata & Actions Bar */}
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
                  href={info.resumePdfUrl}
                  download={
                    info.resumeFileName ||
                    `${info.name.replace(/\s+/g, '_')}_Game_Designer_Resume.pdf`
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download</span>
                </a>

                {isOwnerMode && (
                  <>
                    <label
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Upload a new file to replace the current resume"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Replace File</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResumeFile(file);
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

            {/* Inline PDF Preview */}
            {isPdfDocument && (
              <div className="bg-black p-3 sm:p-4">
                <iframe
                  src={info.resumePdfUrl}
                  title={`${info.name} Resume Preview`}
                  className="w-full h-[540px] sm:h-[640px] rounded-xl border border-zinc-800 bg-zinc-950"
                />
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
                Upload your own crafted PDF or DOCX resume here. Once uploaded, visitors can
                preview and download it directly from this tab.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20">
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Choose Resume File (PDF / DOCX)</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeFile(file);
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
