import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CinematicVideoReel, VideoReelRef } from './components/CinematicVideoReel';
import { FlagshipGameFeature } from './components/FlagshipGameFeature';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectModal } from './components/ProjectModal';
import { MayaShowcase } from './components/MayaShowcase';
import { AboutSection } from './components/AboutSection';
import { ProficiencySection } from './components/ProficiencySection';
import { ResumeSection } from './components/ResumeSection';
import { ContactSection } from './components/ContactSection';
import { CustomSection } from './components/CustomSection';
import { SectionManagerModal } from './components/SectionManagerModal';
import { PortfolioManagerModal } from './components/PortfolioManagerModal';
import { Footer } from './components/Footer';
import { OwnerAdminBar } from './components/OwnerAdminBar';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { OwnerEditModal, EditModalMode } from './components/OwnerEditModal';
import { INITIAL_PORTFOLIO_STATE, DEFAULT_OWNER_PASSCODE, DEFAULT_PORTFOLIO_SECTIONS } from './data/portfolioData';
import { 
  ProjectItem, 
  VideoChapter, 
  MayaModelItem, 
  DesignerInfo, 
  PortfolioState,
  PortfolioSectionConfig,
  CustomSectionData,
  CustomSectionCard,
  PortfolioProfile
} from './types/portfolio';
import { 
  addProject, 
  updateProject, 
  deleteProject, 
  addChapter, 
  updateChapter, 
  deleteChapter, 
  addMayaModel, 
  updateMayaModel, 
  deleteMayaModel,
  getActiveSections,
  toggleSectionVisibility,
  reorderSections,
  addCustomSection,
  removeSection,
  updateSectionConfig
} from './utils/portfolioLogic';

export default function App() {
  const reelRef = useRef<VideoReelRef>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hero');

  // Persistent Portfolio State
  const [portfolioState, setPortfolioState] = useState<PortfolioState>(() => {
    try {
      const saved = localStorage.getItem('adhavan_portfolio_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.videoChapters)) {
          if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
            parsed.sections = DEFAULT_PORTFOLIO_SECTIONS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved portfolio state', e);
    }
    return INITIAL_PORTFOLIO_STATE;
  });

  // Sync portfolio state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adhavan_portfolio_state_v1', JSON.stringify(portfolioState));
    } catch (e) {
      console.error('Failed to save portfolio state', e);
    }
  }, [portfolioState]);

  // Persistent Owner Authentication State
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('adhavan_portfolio_owner_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Owner Passcode (defaults to '906', customizable by owner)
  const [ownerPasscode, setOwnerPasscode] = useState<string>(() => {
    try {
      return localStorage.getItem('adhavan_portfolio_passcode') || DEFAULT_OWNER_PASSCODE;
    } catch {
      return DEFAULT_OWNER_PASSCODE;
    }
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editModalConfig, setEditModalConfig] = useState<{
    isOpen: boolean;
    mode: EditModalMode;
    initialData?: any;
  }>({
    isOpen: false,
    mode: 'project',
    initialData: undefined
  });

  // Multi-Portfolio Management (Owner exclusive)
  const [portfolios, setPortfolios] = useState<PortfolioProfile[]>(() => {
    try {
      const saved = localStorage.getItem('adhavan_portfolios_vault_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse portfolios vault', e);
    }
    return [
      {
        id: 'default_portfolio',
        name: 'UE5 Game Designer & 3D Artist',
        subtitle: 'Unreal Engine gameplay, level layout, and vehicle mechanics',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: INITIAL_PORTFOLIO_STATE
      }
    ];
  });

  const [activePortfolioId, setActivePortfolioId] = useState<string>(() => {
    try {
      return localStorage.getItem('adhavan_active_portfolio_id') || 'default_portfolio';
    } catch {
      return 'default_portfolio';
    }
  });

  const [isPortfolioManagerOpen, setIsPortfolioManagerOpen] = useState(false);

  // Sync portfolios vault to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adhavan_portfolios_vault_v1', JSON.stringify(portfolios));
    } catch (e) {
      console.error('Failed to save portfolios vault', e);
    }
  }, [portfolios]);

  useEffect(() => {
    try {
      localStorage.setItem('adhavan_active_portfolio_id', activePortfolioId);
    } catch (e) {}
  }, [activePortfolioId]);

  // Keep active portfolio state synchronized into the portfolios vault
  useEffect(() => {
    setPortfolios(prev => 
      prev.map(p => p.id === activePortfolioId ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() } : p)
    );
  }, [portfolioState, activePortfolioId]);

  const handleSwitchPortfolio = (portfolioId: string) => {
    const target = portfolios.find(p => p.id === portfolioId);
    if (target && target.state) {
      setActivePortfolioId(portfolioId);
      setPortfolioState(target.state);
    }
  };

  const handleCreatePortfolio = (name: string, subtitle: string, cloneCurrent: boolean) => {
    const newId = `portfolio_${Date.now()}`;
    const newState: PortfolioState = cloneCurrent ? JSON.parse(JSON.stringify(portfolioState)) : INITIAL_PORTFOLIO_STATE;
    const newProfile: PortfolioProfile = {
      id: newId,
      name,
      subtitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: newState
    };

    setPortfolios(prev => [...prev, newProfile]);
    setActivePortfolioId(newId);
    setPortfolioState(newState);
  };

  const handleDeletePortfolio = (portfolioId: string) => {
    if (portfolios.length <= 1) return;
    const remaining = portfolios.filter(p => p.id !== portfolioId);
    setPortfolios(remaining);
    if (activePortfolioId === portfolioId) {
      setActivePortfolioId(remaining[0].id);
      setPortfolioState(remaining[0].state);
    }
  };

  const handleDuplicatePortfolio = (portfolioId: string) => {
    const target = portfolios.find(p => p.id === portfolioId);
    if (!target) return;
    const newId = `portfolio_${Date.now()}`;
    const clonedProfile: PortfolioProfile = {
      id: newId,
      name: `${target.name} (Copy)`,
      subtitle: target.subtitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(target.state))
    };
    setPortfolios(prev => [...prev, clonedProfile]);
  };

  // Section Manager Modal & Insertion State
  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);
  const [insertBelowTargetId, setInsertBelowTargetId] = useState<string | undefined>(undefined);

  const handleSetOwnerMode = (val: boolean) => {
    setIsOwnerMode(val);
    try {
      localStorage.setItem('adhavan_portfolio_owner_auth', String(val));
    } catch {}
  };

  const handleChangePasscode = (newCode: string) => {
    setOwnerPasscode(newCode);
    try {
      localStorage.setItem('adhavan_portfolio_passcode', newCode);
    } catch {}
  };

  const handleOpenEditModal = (mode: EditModalMode, initialData?: any) => {
    setEditModalConfig({
      isOpen: true,
      mode,
      initialData
    });
  };

  const handleCloseEditModal = () => {
    setEditModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Section Management Handlers
  const handleToggleSectionVisibility = (sectionId: string, enabled: boolean) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: toggleSectionVisibility(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, sectionId, enabled)
    }));
  };

  const handleReorderSection = (sectionId: string, direction: 'up' | 'down') => {
    setPortfolioState(prev => ({
      ...prev,
      sections: reorderSections(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, sectionId, direction)
    }));
  };

  const handleAddCustomSection = (newSection: PortfolioSectionConfig) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: addCustomSection(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, newSection, insertBelowTargetId)
    }));
    setInsertBelowTargetId(undefined);
  };

  const handleRemoveSection = (sectionId: string) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: removeSection(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, sectionId)
    }));
  };

  const handleUpdateSectionConfig = (sectionId: string, updates: Partial<PortfolioSectionConfig>) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: updateSectionConfig(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, sectionId, updates)
    }));
  };

  const handleResetSections = () => {
    setPortfolioState(prev => ({
      ...prev,
      sections: DEFAULT_PORTFOLIO_SECTIONS
    }));
  };

  const handlePromptAddSectionBelow = (referenceSectionId: string) => {
    setInsertBelowTargetId(referenceSectionId);
    setIsSectionManagerOpen(true);
  };

  const handleUpdateCustomSectionData = (sectionId: string, updates: Partial<CustomSectionData>) => {
    setPortfolioState(prev => {
      const currentSections = prev.sections || DEFAULT_PORTFOLIO_SECTIONS;
      return {
        ...prev,
        sections: currentSections.map(s => {
          if (s.id === sectionId && s.customData) {
            return {
              ...s,
              customData: {
                ...s.customData,
                ...updates
              }
            };
          }
          return s;
        })
      };
    });
  };

  const handleAddCustomCard = (sectionId: string) => {
    const newCard: CustomSectionCard = {
      id: `card_${Date.now()}`,
      title: 'New Feature / Asset',
      description: 'Detailed description of this game design pillar, asset breakdown, or gameplay mechanic.',
      tag: 'FEATURE',
      imageUrl: '/showcase/shot-town-01.jpg'
    };

    setPortfolioState(prev => {
      const currentSections = prev.sections || DEFAULT_PORTFOLIO_SECTIONS;
      return {
        ...prev,
        sections: currentSections.map(s => {
          if (s.id === sectionId && s.customData) {
            const existingCards = s.customData.cards || [];
            return {
              ...s,
              customData: {
                ...s.customData,
                cards: [...existingCards, newCard]
              }
            };
          }
          return s;
        })
      };
    });
  };

  const handleDeleteCustomCard = (sectionId: string, cardId: string) => {
    setPortfolioState(prev => {
      const currentSections = prev.sections || DEFAULT_PORTFOLIO_SECTIONS;
      return {
        ...prev,
        sections: currentSections.map(s => {
          if (s.id === sectionId && s.customData && s.customData.cards) {
            return {
              ...s,
              customData: {
                ...s.customData,
                cards: s.customData.cards.filter(c => c.id !== cardId)
              }
            };
          }
          return s;
        })
      };
    });
  };

  // Portfolio Mutation Handlers
  const handleSaveProject = (proj: ProjectItem) => {
    setPortfolioState(prev => {
      const exists = prev.projects.some(p => p.id === proj.id);
      return {
        ...prev,
        projects: exists ? updateProject(prev.projects, proj) : addProject(prev.projects, proj)
      };
    });
    if (selectedProject?.id === proj.id) {
      setSelectedProject(proj);
    }
  };

  const handleDeleteProject = (id: string) => {
    setPortfolioState(prev => ({
      ...prev,
      projects: deleteProject(prev.projects, id)
    }));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const handleSaveChapter = (chapter: VideoChapter) => {
    setPortfolioState(prev => {
      const exists = prev.videoChapters.some(c => c.id === chapter.id);
      return {
        ...prev,
        videoChapters: exists ? updateChapter(prev.videoChapters, chapter) : addChapter(prev.videoChapters, chapter)
      };
    });
  };

  const handleDeleteChapter = (id: string) => {
    setPortfolioState(prev => ({
      ...prev,
      videoChapters: deleteChapter(prev.videoChapters, id)
    }));
  };

  const handleSaveModel = (model: MayaModelItem) => {
    setPortfolioState(prev => {
      const exists = prev.mayaModels.some(m => m.id === model.id);
      return {
        ...prev,
        mayaModels: exists ? updateMayaModel(prev.mayaModels, model) : addMayaModel(prev.mayaModels, model)
      };
    });
  };

  const handleDeleteModel = (id: string) => {
    setPortfolioState(prev => ({
      ...prev,
      mayaModels: deleteMayaModel(prev.mayaModels, id)
    }));
  };

  const handleSaveDesignerInfo = (info: Partial<DesignerInfo>) => {
    setPortfolioState(prev => ({
      ...prev,
      designerInfo: {
        ...prev.designerInfo,
        ...info
      }
    }));
  };

  const handleSaveVideoPath = (newPath: string) => {
    setPortfolioState(prev => ({
      ...prev,
      videoPath: newPath
    }));
  };

  const handleImportState = (newState: PortfolioState) => {
    setPortfolioState(newState);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset portfolio to original default showcases and information? Custom changes will be reset.')) {
      setPortfolioState(INITIAL_PORTFOLIO_STATE);
      try {
        localStorage.removeItem('adhavan_portfolio_state_v1');
      } catch {}
    }
  };

  // Tab-aware Navigation & Reel Playback
  const handleNavigate = (sectionId: string) => {
    let targetTab = sectionId;
    if (sectionId === 'hero') {
      targetTab = 'hero';
    } else if (['projects', 'flagship', 'reel', 'maya'].includes(sectionId)) {
      targetTab = 'projects';
    } else if (['about', 'proficiency'].includes(sectionId)) {
      targetTab = 'about';
    } else if (sectionId === 'resume') {
      targetTab = 'resume';
    } else if (sectionId === 'contact') {
      targetTab = 'contact';
    }

    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If targeting an anchor inside a multi-section tab, smoothly position to it
    if (!['hero', 'projects', 'about', 'resume', 'contact'].includes(sectionId)) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          const navOffset = isOwnerMode ? 105 : 75;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  };

  const handlePlayInReel = (timestamp: number) => {
    setActiveTab('projects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      reelRef.current?.scrollTo();
      setTimeout(() => {
        reelRef.current?.seekTo(timestamp);
      }, 350);
    }, 120);
  };

  const handleJumpToChapter = (chapterId: string) => {
    setActiveTab('projects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const ch = portfolioState.videoChapters.find(c => c.id === chapterId);
    if (ch) {
      setTimeout(() => {
        reelRef.current?.scrollTo();
        setTimeout(() => {
          reelRef.current?.seekTo(ch.startTime);
        }, 350);
      }, 120);
    }
  };

  const handleOpenProjectModal = (projectIdOrProject: string | ProjectItem) => {
    if (typeof projectIdOrProject === 'string') {
      const p = portfolioState.projects.find(item => item.id === projectIdOrProject);
      if (p) setSelectedProject(p);
    } else {
      setSelectedProject(projectIdOrProject);
    }
  };

  const flagshipProject = portfolioState.projects.find(p => p.isFlagship) || portfolioState.projects[0];
  const activeSections = getActiveSections(portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS);

  // Map tab IDs to the respective sections they contain
  const getSectionsForTab = (tabId: string): string[] => {
    switch (tabId) {
      case 'hero':
        // Home tab contains ONLY the home section
        return ['hero'];
      case 'projects':
        // Work tab contains the work showcase: Flagship RPG, Showreel, Curated Projects, Maya 3D
        return ['flagship', 'reel', 'projects', 'maya'];
      case 'about':
        // About tab contains About & Philosophy, Career Timeline, and Technical Proficiency
        return ['about', 'proficiency'];
      case 'resume':
        // Resume tab contains complete CV and credentials
        return ['resume'];
      case 'contact':
        // Contact tab contains direct contact channels, ArtStation, LinkedIn, WhatsApp, form
        return ['contact'];
      default:
        // Custom section or directly selected section
        return [tabId];
    }
  };

  const visibleSectionIds = getSectionsForTab(activeTab);
  const currentTabSections = activeSections.filter(sec => visibleSectionIds.includes(sec.id));

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 selection:bg-amber-500 selection:text-black">
      
      {/* Owner Admin Top HUD Bar (Only shown to authenticated owner) */}
      {isOwnerMode && (
        <OwnerAdminBar
          onAddProject={() => handleOpenEditModal('project')}
          onAddChapter={() => handleOpenEditModal('chapter')}
          onEditBio={() => handleOpenEditModal('hero')}
          onOpenSection={handleOpenEditModal}
          onOpenSectionManager={() => setIsSectionManagerOpen(true)}
          activePortfolioName={portfolios.find(p => p.id === activePortfolioId)?.name}
          onOpenPortfolioManager={() => setIsPortfolioManagerOpen(true)}
          onExportJson={() => handleOpenEditModal('json_backup')}
          onImportJson={() => handleOpenEditModal('json_backup')}
          onResetDefaults={handleResetDefaults}
          onLockMode={() => handleSetOwnerMode(false)}
        />
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onWatchReelClick={() => handlePlayInReel(0)}
        onNavigate={handleNavigate}
        isOwnerMode={isOwnerMode}
        onOpenOwnerAuth={() => setIsAuthModalOpen(true)}
        sections={portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS}
        onOpenSectionManager={() => setIsSectionManagerOpen(true)}
      />

      {/* Main Content - Tab-specific with smooth motion transitions and zero negative space */}
      <main className="min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full"
          >
            {/* On-Point Add Section Top Button in Owner Mode */}
            {isOwnerMode && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 flex items-center justify-center">
                <button
                  onClick={() => {
                    setInsertBelowTargetId(undefined);
                    setIsSectionManagerOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-zinc-900/90 hover:bg-amber-500 text-zinc-300 hover:text-black border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105"
                  title="Add a new custom section at the top of your portfolio"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Add Section at Top</span>
                </button>
              </div>
            )}

            {currentTabSections.map((sec, idx) => {
          const canMoveUp = idx > 0;
          const canMoveDown = idx < activeSections.length - 1;
          const onMoveUp = () => handleReorderSection(sec.id, 'up');
          const onMoveDown = () => handleReorderSection(sec.id, 'down');
          const onHide = () => handleToggleSectionVisibility(sec.id, false);
          const onAddSectionBelow = () => handlePromptAddSectionBelow(sec.id);

          let sectionNode = null;

          if (sec.id === 'hero') {
            sectionNode = (
              <HeroSection
                key="hero"
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onEditHero={() => handleOpenEditModal('hero')}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                onPlayReel={() => handlePlayInReel(0)}
                onExploreProjects={() => handleNavigate('projects')}
                onJumpToChapter={handleJumpToChapter}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'reel') {
            sectionNode = (
              <CinematicVideoReel
                key="reel"
                ref={reelRef}
                videoChapters={portfolioState.videoChapters}
                videoPath={portfolioState.videoPath}
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onAddChapter={() => handleOpenEditModal('chapter')}
                onEditChapter={(ch) => handleOpenEditModal('chapter', ch)}
                onDeleteChapter={handleDeleteChapter}
                onEditReelSettings={() => handleOpenEditModal('video_reel')}
                onUploadVideo={handleSaveVideoPath}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'flagship') {
            sectionNode = (
              <FlagshipGameFeature
                key="flagship"
                flagshipProject={flagshipProject}
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onEditFlagship={(p) => handleOpenEditModal('project', p)}
                onEditFlagshipDetails={() => handleOpenEditModal('flagship')}
                onPlayWalkthrough={(timestamp: number) => handlePlayInReel(timestamp)}
                onOpenProjectModal={handleOpenProjectModal}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'projects') {
            sectionNode = (
              <ProjectGallery
                key="projects"
                projects={portfolioState.projects}
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onOpenModal={(project: ProjectItem) => setSelectedProject(project)}
                onPlayInReel={handlePlayInReel}
                onAddProject={() => handleOpenEditModal('project')}
                onEditProject={(p) => handleOpenEditModal('project', p)}
                onDeleteProject={handleDeleteProject}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'maya') {
            sectionNode = (
              <MayaShowcase
                key="maya"
                models={portfolioState.mayaModels}
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onPlayInReel={handlePlayInReel}
                onAddModel={() => handleOpenEditModal('model')}
                onEditModel={(m) => handleOpenEditModal('model', m)}
                onDeleteModel={handleDeleteModel}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'proficiency') {
            sectionNode = (
              <ProficiencySection
                key="proficiency"
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onEditSkills={() => handleOpenEditModal('skills')}
                onContactClick={() => handleNavigate('contact')}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'about') {
            sectionNode = (
              <AboutSection
                key="about"
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onContactClick={() => handleNavigate('contact')}
                onEditAbout={() => handleOpenEditModal('about')}
                onWatchReelClick={() => handlePlayInReel(0)}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'resume') {
            sectionNode = (
              <ResumeSection
                key="resume"
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onEditResume={() => handleOpenEditModal('resume')}
                onContactClick={() => handleNavigate('contact')}
                onWatchReelClick={() => handlePlayInReel(0)}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else if (sec.id === 'contact') {
            sectionNode = (
              <ContactSection 
                key="contact"
                designerInfo={portfolioState.designerInfo}
                isOwnerMode={isOwnerMode}
                onEditContact={() => handleOpenEditModal('contact')}
                onUpdateDesignerInfo={handleSaveDesignerInfo}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onAddSectionBelow={onAddSectionBelow}
              />
            );
          } else {
            // Any custom section created by the user
            sectionNode = (
              <CustomSection
                key={sec.id}
                section={sec}
                isOwnerMode={isOwnerMode}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onHide={onHide}
                onDelete={() => handleRemoveSection(sec.id)}
                onEditSettings={() => {
                  setInsertBelowTargetId(undefined);
                  setIsSectionManagerOpen(true);
                }}
                onAddSectionBelow={onAddSectionBelow}
                onUpdateSectionData={(dataUpdates) => handleUpdateCustomSectionData(sec.id, dataUpdates)}
                onAddCard={() => handleAddCustomCard(sec.id)}
                onDeleteCard={(cardId) => handleDeleteCustomCard(sec.id, cardId)}
              />
            );
          }

          return (
            <React.Fragment key={sec.id}>
              {sectionNode}

              {/* On-Point Add Section Divider directly after each section in Owner Mode */}
              {isOwnerMode && (
                <div className="relative py-2 flex items-center justify-center group/add-divider z-20">
                  <div className="absolute inset-x-4 sm:inset-x-8 h-px border-t border-dashed border-amber-500/25 group-hover/add-divider:border-amber-500/70 transition-colors"></div>
                  <button
                    onClick={() => handlePromptAddSectionBelow(sec.id)}
                    className="relative px-3.5 py-1 rounded-full bg-zinc-950 hover:bg-amber-500 text-zinc-300 hover:text-black border border-amber-500/40 hover:border-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider transition-all shadow-xl flex items-center gap-1.5 cursor-pointer hover:scale-105"
                    title={`Add a new section directly below ${sec.title}`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Add Section Here</span>
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Section Manager Modal */}
      <SectionManagerModal
        isOpen={isSectionManagerOpen}
        onClose={() => {
          setIsSectionManagerOpen(false);
          setInsertBelowTargetId(undefined);
        }}
        initialTab={insertBelowTargetId ? 'add' : 'manage'}
        insertTargetName={portfolioState.sections?.find(s => s.id === insertBelowTargetId)?.title}
        sections={portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS}
        onToggleVisibility={handleToggleSectionVisibility}
        onReorder={handleReorderSection}
        onAddSection={(newSec) => {
          handleAddCustomSection(newSec);
          setIsSectionManagerOpen(false);
          setInsertBelowTargetId(undefined);
        }}
        onRemoveSection={handleRemoveSection}
        onUpdateSection={handleUpdateSectionConfig}
        onResetSections={handleResetSections}
      />

      {/* Portfolio Manager Modal (Multi-Portfolio Vault) */}
      <PortfolioManagerModal
        isOpen={isPortfolioManagerOpen}
        onClose={() => setIsPortfolioManagerOpen(false)}
        portfolios={portfolios}
        activePortfolioId={activePortfolioId}
        onSwitchPortfolio={handleSwitchPortfolio}
        onCreatePortfolio={handleCreatePortfolio}
        onDeletePortfolio={handleDeletePortfolio}
        onDuplicatePortfolio={handleDuplicatePortfolio}
      />

      {/* Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigate={handleNavigate}
        isOwnerMode={isOwnerMode}
        onOpenOwnerAuth={() => setIsAuthModalOpen(true)}
        designerInfo={portfolioState.designerInfo}
        onEditOutro={() => handleOpenEditModal('footer')}
      />

      {/* Deep Dive Project Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onPlayInReel={handlePlayInReel}
      />

      {/* Owner Auth Modal (Passcode login/lock/change) */}
      <OwnerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleSetOwnerMode(true)}
        currentPasscode={ownerPasscode}
        onUpdatePasscode={handleChangePasscode}
        isAlreadyOwner={isOwnerMode}
        onLockOwnerMode={() => handleSetOwnerMode(false)}
      />

      {/* Universal Owner Edit Modal */}
      <OwnerEditModal
        isOpen={editModalConfig.isOpen}
        mode={editModalConfig.mode}
        onClose={handleCloseEditModal}
        editingItem={editModalConfig.initialData}
        onSaveProject={handleSaveProject}
        onSaveChapter={handleSaveChapter}
        onSaveModel={handleSaveModel}
        onSaveDesignerInfo={handleSaveDesignerInfo}
        onSaveVideoPath={handleSaveVideoPath}
        currentPortfolioState={portfolioState}
        onImportState={handleImportState}
      />

    </div>
  );
}
