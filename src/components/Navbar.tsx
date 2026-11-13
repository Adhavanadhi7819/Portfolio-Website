import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Mail, Unlock } from 'lucide-react';
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
  sections
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<string>('hero');
  const currentTab = propActiveTab || localActiveTab;

  const navLinks = useMemo(() => {
    const defaultTabs = [
      { label: 'Home', id: 'hero' },
      { label: 'Work', id: 'projects' },
      { label: 'About', id: 'about' },
      { label: 'Resume', id: 'resume' },
      { label: 'Contact', id: 'contact' }
    ];

    const customSections = sections
      ? sections
          .filter((s) => s.enabled && s.isCustom)
          .map((s) => ({ label: s.label || s.title, id: s.id }))
      : [];

    return [...defaultTabs, ...customSections];
  }, [sections]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id: string) => {
    setLocalActiveTab(id);
    onSelectTab?.(id);
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = navLinks[(idx + 1) % navLinks.length];
      handleLinkClick(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = navLinks[(idx - 1 + navLinks.length) % navLinks.length];
      handleLinkClick(prev.id);
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 z-40 transition-all duration-300 border-b ${
        isOwnerMode ? 'top-[44px]' : 'top-0'
      } ${
        isScrolled
          ? 'bg-[#070709]/95 backdrop-blur-md border-zinc-800/90 shadow-xl shadow-black/60'
          : 'bg-[#070709]/85 backdrop-blur-md border-zinc-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Desktop Interactive Navigation Tabs */}
          <nav
            className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium"
            role="tablist"
            aria-label="Primary Portfolio Navigation"
          >
            {navLinks.map((link, idx) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  tabIndex={0}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative py-1.5 transition-colors duration-200 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:text-amber-400 ${
                    isActive ? 'text-white font-bold' : 'hover:text-zinc-200'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-underline"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(192,169,223,0.85)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Compact Mobile Quick Tab Bar */}
          <nav
            className="flex md:hidden items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-mono uppercase tracking-wider"
            role="tablist"
            aria-label="Mobile Portfolio Navigation"
          >
            {navLinks.slice(0, 5).map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`relative px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-black font-bold bg-amber-500'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Get In Touch + Owner Access + Mobile Drawer Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 26 }}
              onClick={() => handleLinkClick('contact')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors duration-200 whitespace-nowrap shrink-0 shadow-md shadow-amber-500/25 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Get In Touch</span>
            </motion.button>

            {isOwnerMode && (
              <button
                onClick={onOpenOwnerAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 bg-amber-500/15 text-amber-400 border-amber-500/50"
                title="Owner Studio Mode Active - Click to Manage"
                aria-label="Owner Mode Active"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Owner</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-zinc-800 bg-[#050507]/98 px-5 py-4 space-y-2 font-mono text-sm text-zinc-300"
          >
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'text-amber-400 font-bold bg-zinc-900/80'
                      : 'hover:text-amber-400 hover:bg-zinc-900/50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              {isOwnerMode && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOwnerAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-amber-400 border border-amber-500/40 font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Owner Studio Active</span>
                </button>
              )}
              <button
                onClick={() => handleLinkClick('contact')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Get In Touch</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
