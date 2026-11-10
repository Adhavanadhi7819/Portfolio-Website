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

interface ResumeSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditResume?: () => void;
  onContactClick?: () => void;
  onWatchReelClick?: () => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditResume,
  onContactClick,
  onWatchReelClick
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
    <section id="resume" className="py-24 relative bg-[#070709] border-t border-zinc-800/80">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Curriculum Vitae</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              {info.resumeHeading ? (
                info.resumeHeading
              ) : (
                <>GAME DESIGNER <span className="text-amber-500">RESUME</span></>
              )}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2">
              {info.resumeSubheading || 'Comprehensive overview of credentials, engine proficiencies, and in-engine game development deliverables.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleCopyPlainText}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              title="Copy formatted text resume to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied CV!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Text CV</span>
                </>
              )}
            </button>

            {isOwnerMode && (
              <button
                onClick={onEditResume}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Edit resume and profile details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Resume</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable Resume Sheet Container */}
        <div className="bg-[#0c0c10] border border-zinc-800/90 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-10 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
          
          {/* Resume Header */}
          <div className="border-b border-zinc-800 print:border-zinc-300 pb-8 space-y-4">
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
            <p className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 leading-relaxed font-sans">
              {info.resumeSummary || info.aboutGoals}
            </p>
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
