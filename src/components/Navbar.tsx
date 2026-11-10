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

  // Exact requested 5 tabs: Home, Work, About, Resume, Contact
  const defaultTabs = [
    { label: 'Home', id: 'hero' },
    { label: 'Work', id: 'projects' },
    { label: 'About', id: 'about' },
    { label: 'Resume', id: 'resume' },
    { label: 'Contact', id: 'contact' }
  ];

  // If user has custom added sections (isCustom: true), we can also include them
  const customSections = sections
    ? sections.filter(s => s.enabled && s.isCustom).map(s => ({ label: s.label || s.title, id: s.id }))
    : [];

  const navLinks = [...defaultTabs, ...customSections];

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
          ? 'bg-[#070709]/95 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-2xl shadow-black/80'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Left: Tab Section (Home, Work, About, Resume, Contact) - No Name/Logo as requested */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer font-heading"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleLinkClick('contact')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Get In Touch</span>
              <span className="xs:hidden">Contact</span>
            </button>

            {/* Owner Access Button */}
            <button
              onClick={onOpenOwnerAuth}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                isOwnerMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/20'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title={isOwnerMode ? 'Owner Studio Mode Active - Click to Manage' : 'Owner Edit Access (Passcode required)'}
              aria-label={isOwnerMode ? 'Owner Mode Active' : 'Owner Login'}
            >
              {isOwnerMode ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{isOwnerMode ? 'Owner' : 'Owner'}</span>
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
