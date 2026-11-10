import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Briefcase, 
  Check, 
  Trash2, 
  Copy, 
  Download, 
  ArrowRight, 
  Layers, 
  Sparkles,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';
import { PortfolioProfile, PortfolioState } from '../types/portfolio';
import { INITIAL_PORTFOLIO_STATE } from '../data/portfolioData';

interface PortfolioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: PortfolioProfile[];
  activePortfolioId: string;
  onSwitchPortfolio: (portfolioId: string) => void;
  onCreatePortfolio: (name: string, subtitle: string, cloneCurrent: boolean) => void;
  onDeletePortfolio: (portfolioId: string) => void;
  onDuplicatePortfolio: (portfolioId: string) => void;
}

export const PortfolioManagerModal: React.FC<PortfolioManagerModalProps> = ({
  isOpen,
  onClose,
  portfolios,
  activePortfolioId,
  onSwitchPortfolio,
  onCreatePortfolio,
  onDeletePortfolio,
  onDuplicatePortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [cloneCurrent, setCloneCurrent] = useState(true);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onCreatePortfolio(
      newName.trim(), 
      newSubtitle.trim() || 'Custom Showcase Portfolio', 
      cloneCurrent
    );
    setNewName('');
    setNewSubtitle('');
    setActiveTab('list');
    onClose();
  };

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                  Portfolio Vault & Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase">
                  Owner Exclusive
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Create and switch between distinct portfolios (e.g. Game Design, Environment Art, Vehicle Rigging)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-zinc-800/80 bg-zinc-950">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Portfolios ({portfolios.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Portfolio</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-400 font-mono flex items-center justify-between pb-1">
                <span>Select a portfolio to load into live view:</span>
                <span className="text-amber-400 font-bold">Currently Active: {activePortfolio?.name}</span>
              </div>

              {portfolios.map((portfolio) => {
                const isActive = portfolio.id === activePortfolioId;
                const projectCount = portfolio.state?.projects?.length || 0;
                const chapterCount = portfolio.state?.videoChapters?.length || 0;

                return (
                  <div
                    key={portfolio.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-amber-500/10 border-amber-500/70 shadow-lg shadow-amber-500/5'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-heading font-black text-white text-base">
                            {portfolio.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {portfolio.subtitle || 'Custom portfolio showcase'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mt-2">
                          <span>📦 {projectCount} Projects</span>
                          <span>🎞️ {chapterCount} Chapters</span>
                          <span>🕒 {new Date(portfolio.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Portfolio actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive ? (
                          <button
                            onClick={() => {
                              onSwitchPortfolio(portfolio.id);
                              onClose();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Switch To This</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-mono">
                            Live on Site
                          </span>
                        )}

                        <button
                          onClick={() => onDuplicatePortfolio(portfolio.id)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="Duplicate as new portfolio"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {portfolios.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete portfolio "${portfolio.name}"? This cannot be undone.`)) {
                                onDeletePortfolio(portfolio.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete this portfolio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Create a distinct portfolio version (e.g., when targeting specific AAA roles like Combat Designer, Vehicle Rigging, or Art Director).
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Portfolio Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Combat & Mechanics Portfolio 2026"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Focus / Subtitle
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Focused on character abilities, vehicle tuning, and level pacing"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                  Initial Content Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCloneCurrent(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      cloneCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase font-mono text-amber-400 mb-1">
                      Clone Current Portfolio
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Copy all your current projects, video reel, and bio as a starting point.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCloneCurrent(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !cloneCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase font-mono text-amber-400 mb-1">
                      Fresh Starter Template
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Start fresh with clean placeholder sections ready for new work.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create & Launch Portfolio</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
