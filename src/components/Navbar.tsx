import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Menu, X, Mail, Lock, Unlock } from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { PortfolioSectionConfig } from '../types/portfolio';

interface NavbarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  onWatchReelClick?: () => void;
  onNavigate: (sectionId: string) => void;
  isOwnerMode: boolean;
  onOpenOwnerAuth: () => void;
  sections?: PortfolioSectionConfig[];
  onOpenSectionManager?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab: propActiveTab,
  onSelectTab,
  onNavigate,
  isOwnerMode,
  onOpenOwnerAuth,
  sections,
  onOpenSectionManager
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<string>('hero');
  const currentTab = propActiveTab || localActiveTab;

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const tabIds = navLinks.map(l => l.id);
      const scrollPos = window.scrollY + 180;
      let current = tabIds[0];
      for (const id of tabIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            current = id;
          }
        }
      }
      setLocalActiveTab(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navLinks]);

  const handleLinkClick = (id: string) => {
    setLocalActiveTab(id);
    onSelectTab?.(id);
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
          
          {/* Left: Tab Section (Home, Work, About, Resume, Contact) with smooth interactive gliding tab */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md" role="tablist">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  tabIndex={0}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isActive ? 'text-black font-bold' : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/40'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/30"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </button>
              );
            })}
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

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
              {isOwnerMode ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
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
