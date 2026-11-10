import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  Linkedin, 
  ExternalLink, 
  Download, 
  GraduationCap, 
  Briefcase, 
  Gamepad2, 
  Layers, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { DesignerInfo } from '../types/portfolio';
import { DESIGNER_INFO } from '../data/portfolioData';
import { generatePlainTextResume } from '../utils/portfolioLogic';
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
  onWatchReelClick,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const info = designerInfo || DESIGNER_INFO;
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPlainText = () => {
    const plainResume = generatePlainTextResume(info);

    navigator.clipboard.writeText(plainResume).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section id="resume" className="py-10 sm:py-12 md:py-14 relative bg-[#070709] border-t border-zinc-800/80">
      
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

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Curriculum Vitae</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={info.resumeHeading || 'GAME DESIGNER RESUME'}
                onSave={(val) => onUpdateDesignerInfo?.({ resumeHeading: val })}
                isOwnerMode={isOwnerMode}
                label="Resume Heading"
              />
            </h2>
            <div className="text-zinc-400 text-sm sm:text-base mt-2">
              <InlineEdit
                value={info.resumeSubheading || 'Comprehensive overview of credentials, engine proficiencies, and in-engine game development deliverables.'}
                onSave={(val) => onUpdateDesignerInfo?.({ resumeSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Resume Subtitle"
                as="p"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Primary Recruiter Download Button */}
            {info.resumePdfUrl ? (
              <a
                href={info.resumePdfUrl}
                download={info.resumeFileName || `${info.name.replace(/\s+/g, '_')}_Game_Designer_Resume.pdf`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer"
                title={`Download official uploaded resume (${info.resumeFileName})`}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Resume (PDF)</span>
              </a>
            ) : (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                title="Print or Save PDF"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download / Print PDF</span>
              </button>
            )}

            {/* Owner Resume Upload Button */}
            {isOwnerMode && (
              <label 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 hover:border-amber-400 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                title="Upload your official resume PDF or DOCX file so recruiters can download it directly"
              >
                <Download className="w-3.5 h-3.5 rotate-180" />
                <span>{info.resumePdfUrl ? 'Replace PDF Resume' : 'Upload My PDF Resume'}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const k = 1024;
                        const sizes = ['Bytes', 'KB', 'MB'];
                        const i = Math.floor(Math.log(file.size) / Math.log(k));
                        const formattedSize = parseFloat((file.size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

                        onUpdateDesignerInfo?.({
                          resumePdfUrl: dataUrl,
                          resumeFileName: file.name,
                          resumeUploadDate: new Date().toLocaleDateString(),
                          resumeFileSize: formattedSize
                        });
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      console.error('Failed to read resume file:', err);
                      alert('Could not process resume file. Please select a valid PDF.');
                    }
                  }}
                />
              </label>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              title="Print or view printer layout"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleCopyPlainText}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              title="Copy formatted text resume to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {isOwnerMode && (
              <button
                onClick={onEditResume}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Edit resume experiences and education"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Credentials</span>
              </button>
            )}
          </div>
        </div>

        {/* Uploaded Resume Status Banner (Visible to both recruiters and owner) */}
        {info.resumePdfUrl && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {info.resumeFileName || 'Adhavan_Game_Designer_Resume.pdf'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    OFFICIAL PDF
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Direct recruiter download ready {info.resumeFileSize ? `• ${info.resumeFileSize}` : ''} {info.resumeUploadDate ? `• Uploaded ${info.resumeUploadDate}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={info.resumePdfUrl}
                download={info.resumeFileName || `${info.name.replace(/\s+/g, '_')}_Game_Designer_Resume.pdf`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download File</span>
              </a>

              {isOwnerMode && (
                <button
                  onClick={() => {
                    if (window.confirm('Remove uploaded custom PDF resume and restore default formatted resume?')) {
                      onUpdateDesignerInfo?.({
                        resumePdfUrl: undefined,
                        resumeFileName: undefined,
                        resumeUploadDate: undefined,
                        resumeFileSize: undefined
                      });
                    }
                  }}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer text-xs font-mono"
                  title="Remove uploaded resume file"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* Printable Resume Sheet Container */}
        <div className="bg-[#0c0c10] border border-zinc-800/90 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
          
          {/* Resume Header */}
          <div className="border-b border-zinc-800 print:border-zinc-300 pb-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-heading font-black text-white print:text-black tracking-wider uppercase">
                  {info.name}
                </h1>
                <p className="text-amber-400 print:text-amber-700 font-mono text-sm sm:text-base font-semibold uppercase tracking-wide mt-1">
                  {info.title}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:text-emerald-700 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{info.status}</span>
              </div>
            </div>

            {/* Contact Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-zinc-300 print:text-zinc-700">
              <a 
                href={`mailto:${info.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 print:bg-zinc-100 border border-zinc-800 print:border-zinc-200 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{info.email}</span>
              </a>

              <a 
                href={`tel:${info.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 print:bg-zinc-100 border border-zinc-800 print:border-zinc-200 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{info.phone}</span>
              </a>

              <a 
                href={info.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 print:bg-zinc-100 border border-zinc-800 print:border-zinc-200 hover:text-amber-400 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-amber-400" />
                <span>LinkedIn: {info.linkedin}</span>
              </a>

              {onWatchReelClick && (
                <button
                  onClick={onWatchReelClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 print:bg-amber-100 border border-amber-500/30 text-amber-400 print:text-amber-800 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Showreel (4:52)</span>
                </button>
              )}
            </div>
          </div>

          {/* Section: Professional Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-amber-700 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Professional Summary</span>
            </h3>
            <div className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 leading-relaxed font-sans">
              <InlineEdit
                value={info.resumeSummary || info.aboutGoals || ''}
                onSave={(val) => onUpdateDesignerInfo?.({ resumeSummary: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Professional Summary"
                as="p"
              />
            </div>
          </div>

          {/* Section: Technical Disciplines */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-amber-700 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Core Game Design Competencies</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(info.skills || []).map((skill, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-zinc-900/60 print:bg-zinc-50 border border-zinc-800 print:border-zinc-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white print:text-black">
                    <span>{skill.name || skill.skill}</span>
                    <span className="text-amber-400 print:text-amber-700 font-mono">{skill.pct}%</span>
                  </div>
                  <p className="text-xs text-zinc-400 print:text-zinc-600 font-mono leading-relaxed">
                    {skill.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Projects & Production Highlights */}
          <div className="space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-amber-700 font-bold flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Project Experience & Game Design Portfolio</span>
            </h3>

            <div className="space-y-6">
              {(info.resumeExperiences || []).map((exp, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800/80 print:border-zinc-200 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-base font-bold text-white print:text-black">
                        {exp.role}
                      </h4>
                      <p className="text-xs font-mono text-amber-400 print:text-amber-700 font-medium">
                        {exp.project}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500 print:text-zinc-500 shrink-0">
                      {exp.period}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 print:text-zinc-700 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exp.tools.map((t, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 print:bg-zinc-200 text-zinc-300 print:text-zinc-800 border border-zinc-700/60 print:border-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Software & Toolbelt */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-amber-700 font-bold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Software & Pipeline Tools</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {(info.tools || []).map((t, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 print:bg-zinc-100 text-zinc-200 print:text-black text-xs font-mono border border-zinc-800 print:border-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Section: Education & Specialized Training */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-amber-700 font-bold flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education & Specialized Training</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(info.resumeEducation || []).map((edu, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800/80 print:border-zinc-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white print:text-black">
                    <span>{edu.degree}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{edu.year}</span>
                  </div>
                  <p className="text-xs text-amber-400/90 print:text-amber-700 font-mono font-medium">
                    {edu.institution}
                  </p>
                  <p className="text-xs text-zinc-400 print:text-zinc-600 leading-relaxed mt-1">
                    {edu.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
