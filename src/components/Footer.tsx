import { ArrowUp, Mail, Phone, Heart, Gamepad2, Lock, Unlock, Edit3 } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo } from '../types/portfolio';

interface FooterProps {
  onScrollToTop: () => void;
  onNavigate: (sectionId: string) => void;
  isOwnerMode?: boolean;
  onOpenOwnerAuth?: () => void;
  designerInfo?: DesignerInfo;
  onEditOutro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onScrollToTop, 
  onNavigate,
  isOwnerMode = false,
  onOpenOwnerAuth,
  designerInfo = DESIGNER_INFO,
  onEditOutro
}) => {
  const info = designerInfo || DESIGNER_INFO;
  return (
    <footer className="relative bg-black border-t border-zinc-900 text-zinc-400 py-8 sm:py-10 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-[90px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Outro Callout from Video Outro Slide */}
        <div className="p-5 sm:p-7 rounded-2xl bg-zinc-950 border border-zinc-800/80 mb-6 relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-amber-500 font-bold uppercase">
                {info.name.toUpperCase()} // OUTRO NOTE
              </span>
              {isOwnerMode && (
                <button
                  onClick={onEditOutro}
                  className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                  title="Edit outro note"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
            <h3 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight">
              {info.outroTitle || (
                <>THANK YOU <span className="font-serif italic font-normal text-amber-400">For Your Attention</span></>
              )}
            </h3>
            <p className="text-sm text-zinc-300">
              {info.outroText || '“Soon Final out of the game will be posted.” Stay tuned for upcoming gameplay footage and interactive builds.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Get In Touch
            </button>
            <button
              onClick={onScrollToTop}
              className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Metadata & Credits */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-zinc-900 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-black text-sm">
              A
            </div>
            <div>
              <span className="font-heading font-black text-white text-sm tracking-wider uppercase">
                ADHAVAN
              </span>
              <p className="text-zinc-500 text-[11px] font-mono">
                Game Designer • Unreal Engine 5 & Autodesk Maya
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
            <button onClick={() => onNavigate('hero')} className="hover:text-amber-400 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => onNavigate('projects')} className="hover:text-amber-400 transition-colors cursor-pointer">
              Projects
            </button>
            <button onClick={() => onNavigate('proficiency')} className="hover:text-amber-400 transition-colors cursor-pointer">
              Proficiency
            </button>
            <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors cursor-pointer">
              About
            </button>
            <button onClick={() => onNavigate('resume')} className="hover:text-amber-400 transition-colors cursor-pointer">
              Resume
            </button>
            <button onClick={() => onNavigate('contact')} className="hover:text-amber-400 transition-colors cursor-pointer">
              Contact
            </button>
            <button
              onClick={onOpenOwnerAuth}
              className="flex items-center gap-1.5 transition-colors cursor-pointer text-zinc-500 hover:text-amber-400 border-l border-zinc-800 pl-4"
              title={isOwnerMode ? 'Owner Mode Active (Click to Manage/Lock)' : 'Owner Portal Sign-In'}
            >
              {isOwnerMode ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-mono">Owner Mode</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-zinc-500 hover:text-zinc-300">Owner Access</span>
                </>
              )}
            </button>
          </div>

          <div className="text-zinc-500 font-mono text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} Adhavan. Built with Unreal Engine & Autodesk Maya.
          </div>
        </div>

      </div>
    </footer>
  );
};
