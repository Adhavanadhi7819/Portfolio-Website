import React, { useState, useEffect } from 'react';
import { Menu, X, Mail, Lock, Unlock } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';

import { PortfolioSectionConfig } from '../types/portfolio';

interface NavbarProps {
  onWatchReelClick?: () => void;
  onNavigate: (sectionId: string) => void;
  isOwnerMode: boolean;
  onOpenOwnerAuth: () => void;
  sections?: PortfolioSectionConfig[];
  onOpenSectionManager?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate,
  isOwnerMode,
  onOpenOwnerAuth,
  sections,
  onOpenSectionManager
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = sections && sections.length > 0
    ? sections
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order)
        .map(s => ({ label: s.label || s.title, id: s.id }))
    : [
        { label: 'Home', id: 'hero' },
        { label: 'Showreel', id: 'reel' },
        { label: 'Flagship', id: 'flagship' },
        { label: 'Projects', id: 'projects' },
        { label: 'Proficiency', id: 'proficiency' },
        { label: 'About', id: 'about' },
        { label: 'Resume', id: 'resume' },
        { label: 'Contact', id: 'contact' },
      ];

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        isOwnerMode ? 'top-[44px]' : 'top-0'
      } ${
        isScrolled
          ? 'bg-[#070709]/90 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-2xl shadow-black/80'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleLinkClick('hero')}
            className="flex items-center gap-3 group text-left cursor-pointer"
            aria-label="Adhavan Game Designer Home"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black tracking-wider text-lg text-white group-hover:text-amber-400 transition-colors uppercase">
                  ADHAVAN
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">
                Game Designer & 3D Artist
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all cursor-pointer font-medium"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">

            <button
              onClick={() => handleLinkClick('contact')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Hire Me</span>
            </button>

            {/* Owner Access Button */}
            <button
              onClick={onOpenOwnerAuth}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                isOwnerMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/20'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title={isOwnerMode ? 'Owner Studio Mode Active - Click to Manage' : 'Owner Edit Access (Passcode required)'}
              aria-label={isOwnerMode ? 'Owner Mode Active' : 'Owner Login'}
            >
              {isOwnerMode ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{isOwnerMode ? 'Owner: Active' : 'Owner'}</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenOwnerAuth}
              className={`p-2 rounded-lg border text-xs ${
                isOwnerMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              aria-label="Owner Login"
            >
              {isOwnerMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0c10] border-b border-zinc-800 px-4 pt-3 pb-6 mt-3 space-y-2 animate-in fade-in duration-200">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="w-full text-left px-3 py-2.5 text-base text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/40 rounded-lg transition-colors font-medium"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOwnerAuth();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-700 font-semibold text-xs uppercase tracking-wider"
            >
              {isOwnerMode ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4" />}
              <span>{isOwnerMode ? 'Owner Studio Active (Settings)' : 'Owner Access & Edit Mode'}</span>
            </button>
            <button
              onClick={() => handleLinkClick('contact')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 text-black font-semibold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
            >
              <Mail className="w-4 h-4" />
              <span>Get In Touch</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
