import React, { useState, useRef, useEffect } from 'react';
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
import { Footer } from './components/Footer';
import { OwnerAdminBar } from './components/OwnerAdminBar';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { OwnerEditModal, EditModalMode } from './components/OwnerEditModal';
import { INITIAL_PORTFOLIO_STATE, DEFAULT_OWNER_PASSCODE } from './data/portfolioData';
import { ProjectItem, VideoChapter, MayaModelItem, DesignerInfo, PortfolioState } from './types/portfolio';
import { 
  addProject, 
  updateProject, 
  deleteProject, 
  addChapter, 
  updateChapter, 
  deleteChapter, 
  addMayaModel, 
  updateMayaModel, 
  deleteMayaModel 
} from './utils/portfolioLogic';

export default function App() {
  const reelRef = useRef<VideoReelRef>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Persistent Portfolio State
  const [portfolioState, setPortfolioState] = useState<PortfolioState>(() => {
    try {
      const saved = localStorage.getItem('adhavan_portfolio_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.videoChapters)) {
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

  // Navigation & Reel Playback
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePlayInReel = (timestamp: number) => {
    reelRef.current?.scrollTo();
    setTimeout(() => {
      reelRef.current?.seekTo(timestamp);
    }, 400);
  };

  const handleJumpToChapter = (chapterId: string) => {
    const ch = portfolioState.videoChapters.find(c => c.id === chapterId);
    if (ch) {
      handlePlayInReel(ch.startTime);
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

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 selection:bg-amber-500 selection:text-black">
      
      {/* Owner Admin Top HUD Bar (Only shown to authenticated owner) */}
      {isOwnerMode && (
        <OwnerAdminBar
          onAddProject={() => handleOpenEditModal('project')}
          onAddChapter={() => handleOpenEditModal('chapter')}
          onEditBio={() => handleOpenEditModal('hero')}
          onOpenSection={handleOpenEditModal}
          onExportJson={() => handleOpenEditModal('json_backup')}
          onImportJson={() => handleOpenEditModal('json_backup')}
          onResetDefaults={handleResetDefaults}
          onLockMode={() => handleSetOwnerMode(false)}
        />
      )}

      {/* Top Navigation */}
      <Navbar
        onWatchReelClick={() => handlePlayInReel(0)}
        onNavigate={handleNavigate}
        isOwnerMode={isOwnerMode}
        onOpenOwnerAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main>
        {/* Cinematic Hero */}
        <HeroSection
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onEditHero={() => handleOpenEditModal('hero')}
          onPlayReel={() => handlePlayInReel(0)}
          onExploreProjects={() => handleNavigate('projects')}
          onJumpToChapter={handleJumpToChapter}
        />

        {/* Cinematic Video Showreel Player */}
        <CinematicVideoReel
          ref={reelRef}
          videoChapters={portfolioState.videoChapters}
          videoPath={portfolioState.videoPath}
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onAddChapter={() => handleOpenEditModal('chapter')}
          onEditChapter={(ch) => handleOpenEditModal('chapter', ch)}
          onDeleteChapter={handleDeleteChapter}
          onEditReelSettings={() => handleOpenEditModal('video_reel')}
          onChapterSelect={(ch: VideoChapter) => {
            // Optional callback
          }}
        />

        {/* Flagship In-Progress Game Spotlight */}
        <FlagshipGameFeature
          flagshipProject={flagshipProject}
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onEditFlagship={(p) => handleOpenEditModal('project', p)}
          onEditFlagshipDetails={() => handleOpenEditModal('flagship')}
          onPlayWalkthrough={(timestamp: number) => handlePlayInReel(timestamp)}
          onOpenProjectModal={handleOpenProjectModal}
        />

        {/* Curated Unreal & Maya Projects Gallery */}
        <ProjectGallery
          projects={portfolioState.projects}
          isOwnerMode={isOwnerMode}
          onOpenModal={(project: ProjectItem) => setSelectedProject(project)}
          onPlayInReel={handlePlayInReel}
          onAddProject={() => handleOpenEditModal('project')}
          onEditProject={(p) => handleOpenEditModal('project', p)}
          onDeleteProject={handleDeleteProject}
        />

        {/* Autodesk Maya 3D Asset Showroom */}
        <MayaShowcase
          models={portfolioState.mayaModels}
          isOwnerMode={isOwnerMode}
          onPlayInReel={handlePlayInReel}
          onAddModel={() => handleOpenEditModal('model')}
          onEditModel={(m) => handleOpenEditModal('model', m)}
          onDeleteModel={handleDeleteModel}
        />

        {/* Technical Disciplines & Toolbelt (Proficiency) */}
        <ProficiencySection
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onEditSkills={() => handleOpenEditModal('skills')}
          onContactClick={() => handleNavigate('contact')}
        />

        {/* About & Studio Objectives (About) */}
        <AboutSection
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onContactClick={() => handleNavigate('contact')}
          onEditAbout={() => handleOpenEditModal('about')}
          onWatchReelClick={() => handlePlayInReel(0)}
        />

        {/* Game Designer Curriculum Vitae (Resume) */}
        <ResumeSection
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onEditResume={() => handleOpenEditModal('resume')}
          onContactClick={() => handleNavigate('contact')}
          onWatchReelClick={() => handlePlayInReel(0)}
        />

        {/* Contact & Inquiry Dispatch */}
        <ContactSection 
          designerInfo={portfolioState.designerInfo}
          isOwnerMode={isOwnerMode}
          onEditContact={() => handleOpenEditModal('contact')}
        />
      </main>

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
