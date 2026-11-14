import React from 'react';
import { ArrowUp } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { DesignerInfo } from '../types/portfolio';

interface FooterProps {
  onScrollToTop: () => void;
  onNavigate: (sectionId: string) => void;
  isOwnerMode?: boolean;
  onOpenOwnerAuth?: () => void;
  designerInfo?: DesignerInfo;
  onEditOutro?: () => void;
  activeTab?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onScrollToTop,
  isOwnerMode = false,
  onOpenOwnerAuth,
  designerInfo = DESIGNER_INFO
}) => {
  const info = designerInfo || DESIGNER_INFO;

  return (
    <footer className="relative bg-zinc-950/55 backdrop-blur-md border-t border-zinc-800/70 text-zinc-400">
      {/* Clean Minimal Bottom Footer Bar */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 ${
          isOwnerMode ? 'pb-14 sm:pb-12 2xl:pb-6' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs font-mono">
          {/* Left Identity */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5 text-center sm:text-left">
            <span className="text-zinc-100 font-heading font-bold tracking-wide uppercase">
              {info.name || 'ADHAVAN'}
            </span>
            <span className="text-zinc-700">—</span>
            <span className="text-zinc-400">{info.title || 'Game Designer | 3D Artist'}</span>
          </div>

          {/* Right Copyright + Scroll Top (silent owner access via double-click / Shift+O) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <div
              onDoubleClick={onOpenOwnerAuth}
              className="text-zinc-400 text-center sm:text-right select-none whitespace-nowrap"
            >
              © 2026 {info.name || 'ADHAVAN'} . All rights reserved
            </div>

            <button
              onClick={onScrollToTop}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Scroll to top"
              title="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
