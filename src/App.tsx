import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Plus, Save, RotateCcw, Lock, X, CheckCircle2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { InteractiveCursor } from './components/InteractiveCursor';
import { HeroSection } from './components/HeroSection';
import { CinematicVideoReel, VideoReelRef } from './components/CinematicVideoReel';
import { FlagshipGameFeature } from './components/FlagshipGameFeature';
import { ProjectGallery } from './components/ProjectGallery';
import { ProjectModal } from './components/ProjectModal';
import { MayaShowcase } from './components/MayaShowcase';
import { AboutSection } from './components/AboutSection';
import { ResumeSection } from './components/ResumeSection';
import { ContactSection } from './components/ContactSection';
import { CustomSection } from './components/CustomSection';
import { SectionManagerModal } from './components/SectionManagerModal';
import { PortfolioManagerModal } from './components/PortfolioManagerModal';
import { Footer } from './components/Footer';
import { OwnerAdminBar } from './components/OwnerAdminBar';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { OwnerEditModal, EditModalMode } from './components/OwnerEditModal';
import { OwnerInboxModal } from './components/OwnerInboxModal';
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
import {
  fetchServerAuthStatus,
  fetchServerPortfolio,
  saveServerPortfolio,
  resetServerPortfolio,
  logoutOwnerServer,
  subscribeToPortfolioUpdates,
  fetchOwnerMessages
} from './utils/portfolioServerSync';

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
          } else {
            // Strip removed proficiency section and upgrade default portrait photo once
            const v3Migrated = localStorage.getItem('adhavan_v3_monochrome_cleanup');
            if (!v3Migrated) {
              parsed.sections = parsed.sections.filter((s: PortfolioSectionConfig) => s.id !== 'proficiency');
              if (
                parsed.designerInfo &&
                (!parsed.designerInfo.heroPhotoUrl || parsed.designerInfo.heroPhotoUrl === '/showcase/hero-adhavan.jpg')
              ) {
                parsed.designerInfo.heroPhotoUrl = '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png';
              }
              localStorage.setItem('adhavan_v3_monochrome_cleanup', 'true');
            }

            // Upgrade to v4 brand identity ("ADHAVAN" / "Game Designer | 3D Artist"), social URLs, and timeline photo
            const v4Migrated = localStorage.getItem('adhavan_v4_brand_title');
            if (!v4Migrated && parsed.designerInfo) {
              const info = parsed.designerInfo;
              if (!info.name || info.name === 'Adhavan') {
                info.name = 'ADHAVAN';
              }
              if (!info.title || info.title === 'Game Designer & 3D Environment Artist') {
                info.title = 'Game Designer | 3D Artist';
              }
              if (!info.instagramUrl) {
                info.instagramUrl = 'https://www.instagram.com/';
              }
              if (!info.youtubeUrl) {
                info.youtubeUrl = 'https://www.youtube.com/';
              }
              if (!info.artstationUrl) {
                info.artstationUrl = 'https://www.artstation.com/adhavan7819';
              }
              if (Array.isArray(info.careerTimeline)) {
                info.careerTimeline = info.careerTimeline.map((item: any) =>
                  item.photoUrl === '/showcase/hero-adhavan.jpg'
                    ? { ...item, photoUrl: '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png' }
                    : item
                );
              }
              localStorage.setItem('adhavan_v4_brand_title', 'true');
            }

            // Upgrade to v5 contact layout defaults & photo alignment defaults
            const v5Migrated = localStorage.getItem('adhavan_v5_contact_photo_align');
            if (!v5Migrated && parsed.designerInfo) {
              const info = parsed.designerInfo;
              if (info.contactHeading === 'GET IN TOUCH') {
                info.contactHeading = "Let's Work Together";
              }
              if (info.contactBadge === 'Connect & Collaborate') {
                info.contactBadge = 'GET IN TOUCH';
              }
              if (!info.heroPhotoAlign) {
                info.heroPhotoAlign = { x: 50, y: 50, zoom: 1, fit: 'cover' };
              }
              localStorage.setItem('adhavan_v5_contact_photo_align', 'true');
            }

            // Upgrade to v6 streamlined Latest Project (recorded gameplay video + playable build button + editable specs)
            const v6Migrated = localStorage.getItem('adhavan_v6_latest_project_clean');
            if (!v6Migrated && parsed.designerInfo) {
              const info = parsed.designerInfo;
              if (!info.flagshipGameTitle) {
                info.flagshipGameTitle = 'Game Specifications';
              }
              if (!info.flagshipGameSpecs) {
                info.flagshipGameSpecs =
                  'Add your game overview, core gameplay mechanics, controls, and build notes here.';
              }
              if (!Array.isArray(info.flagshipSpecRows) || info.flagshipSpecRows.length === 0) {
                info.flagshipSpecRows = [
                  { label: 'Engine', value: 'Unreal Engine 5' },
                  { label: 'Genre', value: 'To Be Updated' },
                  { label: 'Platform', value: 'Windows PC Build' },
                  { label: 'Status', value: 'Playable Build In Progress' }
                ];
              }
              if (!info.flagshipGameLabel || info.flagshipGameLabel === 'Download & Play Build') {
                info.flagshipGameLabel = 'Download Playable Build';
              }
              if (
                info.flagshipQuote ===
                '“Focuses on a fully packed game, which is in progress. These are the screenshots and video of the level from the game.”'
              ) {
                info.flagshipQuote =
                  'Recorded gameplay footage, playable build download, and game specifications.';
              }
              localStorage.setItem('adhavan_v6_latest_project_clean', 'true');
            }

            // Strip blank hero stats that had text cleared
            const v7Migrated = localStorage.getItem('adhavan_v7_stats_cleanup');
            if (!v7Migrated && parsed.designerInfo) {
              const info = parsed.designerInfo;
              if (Array.isArray(info.heroStats)) {
                info.heroStats = info.heroStats.filter(
                  (s: any) => Boolean(s?.number?.trim() || s?.label?.trim())
                );
              }
              localStorage.setItem('adhavan_v7_stats_cleanup', 'true');
            }

            // Remove legacy 'Soon Final out' outro sentence from cached storage
            const v8Migrated = localStorage.getItem('adhavan_v8_remove_outro');
            if (!v8Migrated && parsed.designerInfo) {
              const info = parsed.designerInfo;
              if (
                typeof info.outroText === 'string' &&
                info.outroText.toLowerCase().includes('soon final out')
              ) {
                info.outroText = '';
                info.outroTitle = '';
              }
              localStorage.setItem('adhavan_v8_remove_outro', 'true');
            }
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

  // Baseline snapshot taken when opening Owner Mode to detect session edits on close
  const [ownerSessionSnapshot, setOwnerSessionSnapshot] = useState<string | null>(() =>
    isOwnerMode ? JSON.stringify(portfolioState) : null
  );
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const serverVersionRef = useRef<number>(0);
  const isServerHydratedRef = useRef<boolean>(false);
  const lastSavedSignatureRef = useRef<string>('');
  const activeSyncPromiseRef = useRef<Promise<boolean> | null>(null);
  const hasPendingSaveRef = useRef<boolean>(false);

  const hasUnsavedOwnerChanges = useMemo(() => {
    if (!isOwnerMode || ownerSessionSnapshot === null) return false;
    try {
      return JSON.stringify(portfolioState) !== ownerSessionSnapshot;
    } catch {
      return false;
    }
  }, [isOwnerMode, ownerSessionSnapshot, portfolioState]);

  useEffect(() => {
    if (!saveToast) return;
    const t = window.setTimeout(() => setSaveToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [saveToast]);

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

  // Silent Owner Auth unlock triggers (Shift+O or ?owner=1 / #owner)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('owner') === '1' || window.location.hash === '#owner') {
        setIsAuthModalOpen(true);
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAuthModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-Portfolio Management (Owner exclusive)
  const [portfolios, setPortfolios] = useState<PortfolioProfile[]>(() => {
    try {
      const saved = localStorage.getItem('adhavan_portfolios_vault_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((profile: PortfolioProfile) => {
            if (!profile.state) return profile;
            const cleanedSections = Array.isArray(profile.state.sections)
              ? profile.state.sections.filter((s: PortfolioSectionConfig) => s.id !== 'proficiency')
              : DEFAULT_PORTFOLIO_SECTIONS;
            const info = profile.state.designerInfo;
            const updatedHero =
              info && (!info.heroPhotoUrl || info.heroPhotoUrl === '/showcase/hero-adhavan.jpg')
                ? '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png'
                : info?.heroPhotoUrl;
            const updatedTimeline = Array.isArray(info?.careerTimeline)
              ? info.careerTimeline.map((item) =>
                  item.photoUrl === '/showcase/hero-adhavan.jpg'
                    ? { ...item, photoUrl: '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png' }
                    : item
                )
              : info?.careerTimeline;
            return {
              ...profile,
              state: {
                ...profile.state,
                sections: cleanedSections,
                designerInfo: info
                  ? {
                      ...info,
                      name: !info.name || info.name === 'Adhavan' ? 'ADHAVAN' : info.name,
                      title: !info.title || info.title === 'Game Designer & 3D Environment Artist' ? 'Game Designer | 3D Artist' : info.title,
                      instagramUrl: info.instagramUrl || 'https://www.instagram.com/',
                      youtubeUrl: info.youtubeUrl || 'https://www.youtube.com/',
                      artstationUrl: info.artstationUrl || 'https://www.artstation.com/adhavan7819',
                      heroPhotoUrl: updatedHero,
                      careerTimeline: updatedTimeline
                    }
                  : info
              }
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse portfolios vault', e);
    }
    return [
      {
        id: 'default_portfolio',
        name: 'ADHAVAN — Game Designer | 3D Artist',
        subtitle: 'Unreal Engine gameplay, level layout, and 3D art',
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

  // Helper to apply canonical server payload without echoing back an extra save
  const applyServerPayload = (
    serverPortfolios: PortfolioProfile[],
    serverActiveId: string,
    version: number
  ) => {
    const resolvedActiveId =
      serverPortfolios.some((p) => p.id === serverActiveId)
        ? serverActiveId
        : serverPortfolios[0]?.id || 'default_portfolio';
    const activeProfile =
      serverPortfolios.find((p) => p.id === resolvedActiveId) || serverPortfolios[0];
    if (!activeProfile?.state) return;

    const normalizedState: PortfolioState = {
      ...activeProfile.state,
      sections:
        Array.isArray(activeProfile.state.sections) && activeProfile.state.sections.length > 0
          ? activeProfile.state.sections
          : DEFAULT_PORTFOLIO_SECTIONS
    };

    const sig = JSON.stringify({
      activePortfolioId: resolvedActiveId,
      state: normalizedState,
      portfolioIds: serverPortfolios.map((p) => ({ id: p.id, name: p.name, subtitle: p.subtitle }))
    });

    serverVersionRef.current = version;
    lastSavedSignatureRef.current = sig;
    setPortfolios(serverPortfolios);
    setActivePortfolioId(resolvedActiveId);
    setPortfolioState(normalizedState);
  };

  // Push current state & vault to persistent server
  const pushStateToServer = async (
    nextPortfolios: PortfolioProfile[],
    nextActiveId: string
  ): Promise<boolean> => {
    if (activeSyncPromiseRef.current) {
      await activeSyncPromiseRef.current.catch(() => false);
    }

    const runSave = async (): Promise<boolean> => {
      setSyncStatus('saving');
      try {
        const saved = await saveServerPortfolio({
          activePortfolioId: nextActiveId,
          portfolios: nextPortfolios
        });
        if (saved.initialized && Array.isArray(saved.portfolios) && saved.portfolios.length > 0) {
          const hadDataUrls = JSON.stringify(nextPortfolios).includes('data:');
          const nextVersion = saved.version ?? serverVersionRef.current + 1;
          serverVersionRef.current = nextVersion;
          if (hadDataUrls) {
            applyServerPayload(
              saved.portfolios,
              saved.activePortfolioId || nextActiveId,
              nextVersion
            );
          }
        }
        setSyncStatus('saved');
        return true;
      } catch (err) {
        console.error('Failed to sync portfolio to server:', err);
        setSyncStatus('error');
        return false;
      } finally {
        hasPendingSaveRef.current = false;
        activeSyncPromiseRef.current = null;
      }
    };

    const promise = runSave();
    activeSyncPromiseRef.current = promise;
    return promise;
  };

  // Initial server hydration + auth status verification + live SSE sync across all devices
  useEffect(() => {
    let active = true;

    const hydrateFromServer = async () => {
      try {
        const [authStatus, serverData] = await Promise.all([
          fetchServerAuthStatus().catch(() => null),
          fetchServerPortfolio().catch(() => null)
        ]);
        if (!active) return;

        if (authStatus && !authStatus.isAuthenticated && isOwnerMode) {
          setIsOwnerMode(false);
          setOwnerSessionSnapshot(null);
          try {
            localStorage.setItem('adhavan_portfolio_owner_auth', 'false');
          } catch {}
        }

        if (
          serverData?.initialized &&
          Array.isArray(serverData.portfolios) &&
          serverData.portfolios.length > 0
        ) {
          applyServerPayload(
            serverData.portfolios,
            serverData.activePortfolioId || 'default_portfolio',
            serverData.version || 1
          );
          if (authStatus?.isAuthenticated) {
            const activeP =
              serverData.portfolios.find(
                (p) => p.id === (serverData.activePortfolioId || 'default_portfolio')
              ) || serverData.portfolios[0];
            if (activeP?.state) {
              setOwnerSessionSnapshot(JSON.stringify(activeP.state));
            }
            fetchOwnerMessages()
              .then((inbox) => {
                if (active) setUnreadMessageCount(inbox.unreadCount || 0);
              })
              .catch(() => {});
          }
          setSyncStatus('saved');
        } else if (authStatus?.isAuthenticated) {
          // Server not initialized yet, seed it immediately with current state (including any local edits/resume)
          const seededPortfolios = portfolios.map((p) =>
            p.id === activePortfolioId ? { ...p, state: portfolioState } : p
          );
          await pushStateToServer(seededPortfolios, activePortfolioId);
          fetchOwnerMessages()
            .then((inbox) => {
              if (active) setUnreadMessageCount(inbox.unreadCount || 0);
            })
            .catch(() => {});
        }
      } finally {
        if (active) {
          isServerHydratedRef.current = true;
        }
      }
    };

    hydrateFromServer();

    const syncLatestIfNewer = async () => {
      if (activeSyncPromiseRef.current || hasPendingSaveRef.current) return;
      try {
        const serverData = await fetchServerPortfolio();
        if (!active || activeSyncPromiseRef.current || hasPendingSaveRef.current) return;
        if (
          serverData.initialized &&
          Array.isArray(serverData.portfolios) &&
          serverData.portfolios.length > 0 &&
          typeof serverData.version === 'number' &&
          serverData.version > serverVersionRef.current
        ) {
          applyServerPayload(
            serverData.portfolios,
            serverData.activePortfolioId || 'default_portfolio',
            serverData.version
          );
        }
      } catch {}
    };

    const unsubscribeSse = subscribeToPortfolioUpdates(
      ({ version }) => {
        if (version > serverVersionRef.current && !activeSyncPromiseRef.current && !hasPendingSaveRef.current) {
          syncLatestIfNewer();
        }
      },
      ({ unreadCount }) => {
        setUnreadMessageCount(unreadCount);
      }
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLatestIfNewer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      unsubscribeSse();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save to server whenever Owner makes edits
  useEffect(() => {
    if (!isOwnerMode || !isServerHydratedRef.current) return;

    const mergedPortfolios = portfolios.map((p) =>
      p.id === activePortfolioId
        ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() }
        : p
    );

    const sig = JSON.stringify({
      activePortfolioId,
      state: portfolioState,
      portfolioIds: mergedPortfolios.map((p) => ({ id: p.id, name: p.name, subtitle: p.subtitle }))
    });

    if (sig === lastSavedSignatureRef.current) return;

    hasPendingSaveRef.current = true;
    const timer = window.setTimeout(async () => {
      lastSavedSignatureRef.current = sig;
      await pushStateToServer(mergedPortfolios, activePortfolioId);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerMode, portfolioState, portfolios, activePortfolioId]);

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
    if (val) {
      try {
        setOwnerSessionSnapshot(JSON.stringify(portfolioState));
      } catch {
        setOwnerSessionSnapshot(null);
      }
      // If server hasn't been initialized yet, immediately publish current state & assets on unlock
      if (serverVersionRef.current === 0) {
        const merged = portfolios.map((p) =>
          p.id === activePortfolioId ? { ...p, state: portfolioState } : p
        );
        void pushStateToServer(merged, activePortfolioId);
      }
      fetchOwnerMessages()
        .then((inbox) => setUnreadMessageCount(inbox.unreadCount || 0))
        .catch(() => {});
    } else {
      setOwnerSessionSnapshot(null);
      setIsExitConfirmOpen(false);
    }
    setIsOwnerMode(val);
    try {
      localStorage.setItem('adhavan_portfolio_owner_auth', String(val));
    } catch {}
  };

  const handleRequestCloseOwnerMode = () => {
    if (hasUnsavedOwnerChanges) {
      setIsExitConfirmOpen(true);
    } else {
      void logoutOwnerServer();
      handleSetOwnerMode(false);
    }
  };

  const handleSaveAndExitOwnerMode = async () => {
    const mergedPortfolios = portfolios.map((p) =>
      p.id === activePortfolioId
        ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() }
        : p
    );
    try {
      localStorage.setItem('adhavan_portfolio_state_v1', JSON.stringify(portfolioState));
      localStorage.setItem('adhavan_portfolios_vault_v1', JSON.stringify(mergedPortfolios));
    } catch (e) {
      console.error('Failed to persist local portfolio backup', e);
    }

    const ok = await pushStateToServer(mergedPortfolios, activePortfolioId);
    if (!ok) {
      setSaveToast('Could not save to server · Please re-verify 2FA and retry');
      setIsExitConfirmOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    await logoutOwnerServer();
    handleSetOwnerMode(false);
    setSaveToast('Changes saved & live across all devices · Owner Mode closed');
  };

  const handleDiscardAndExitOwnerMode = async () => {
    if (ownerSessionSnapshot) {
      try {
        const restored = JSON.parse(ownerSessionSnapshot) as PortfolioState;
        const merged = portfolios.map((p) =>
          p.id === activePortfolioId
            ? { ...p, state: restored, updatedAt: new Date().toISOString() }
            : p
        );
        setPortfolioState(restored);
        localStorage.setItem('adhavan_portfolio_state_v1', ownerSessionSnapshot);
        await pushStateToServer(merged, activePortfolioId);
      } catch (e) {
        console.error('Failed to restore pre-session snapshot', e);
      }
    }
    await logoutOwnerServer();
    handleSetOwnerMode(false);
    setSaveToast('Unsaved changes discarded · Owner Mode closed');
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

  const handleResetDefaults = async () => {
    if (window.confirm('Reset portfolio to original default showcases and information? Custom changes will be reset across all devices.')) {
      setPortfolioState(INITIAL_PORTFOLIO_STATE);
      try {
        localStorage.removeItem('adhavan_portfolio_state_v1');
      } catch {}
      try {
        await resetServerPortfolio(INITIAL_PORTFOLIO_STATE);
        setSaveToast('Portfolio reset to defaults across all devices');
      } catch (err) {
        console.error('Server reset failed:', err);
      }
    }
  };

  // Tab-aware Navigation & Reel Playback
  const handleNavigate = (sectionId: string) => {
    let targetTab = sectionId;
    if (sectionId === 'hero') {
      targetTab = 'hero';
    } else if (['projects', 'flagship', 'reel', 'maya'].includes(sectionId)) {
      targetTab = 'projects';
    } else if (sectionId === 'about') {
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
        // About tab contains About & Philosophy and Career Timeline
        return ['about'];
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
    <MotionConfig reducedMotion="user">
      <div
        className={`min-h-screen flex flex-col bg-[#050507] text-zinc-100 selection:bg-amber-500 selection:text-black ${
          isOwnerMode ? 'pt-[44px]' : ''
        }`}
      >
        <InteractiveCursor />
        
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
          onLockMode={handleRequestCloseOwnerMode}
          onOpenSecurity={() => setIsAuthModalOpen(true)}
          hasUnsavedChanges={hasUnsavedOwnerChanges}
          syncStatus={syncStatus}
          onOpenInbox={() => setIsInboxOpen(true)}
          unreadMessageCount={unreadMessageCount}
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
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex-1 flex flex-col"
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
                onOpenResume={() => handleNavigate('resume')}
                onOpenContact={() => handleNavigate('contact')}
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
                onSaveProject={handleSaveProject}
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
                onSaveModel={handleSaveModel}
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
        activeTab={activeTab}
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
        onLockOwnerMode={handleRequestCloseOwnerMode}
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

      {/* Owner Direct Messages Inbox Modal */}
      <OwnerInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onUnreadCountChange={setUnreadMessageCount}
      />

      {/* Save Prompt Modal on Closing Owner Mode */}
      <AnimatePresence>
        {isExitConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-exit-save-title"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setIsExitConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-amber-500/40 p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <button
                type="button"
                onClick={() => setIsExitConfirmOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cancel and stay in Owner Mode"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5 pr-6">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="owner-exit-save-title"
                    className="text-lg font-heading font-black text-white uppercase tracking-tight"
                  >
                    Save Changes Before Closing?
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    You made edits while in Owner Mode. Save your updates before switching back to
                    visitor view, or discard changes from this session.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndExitOwnerMode}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4 stroke-[2.2]" />
                  <span>Save &amp; Close Owner Mode</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardAndExitOwnerMode}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-red-950/70 text-red-400 border border-zinc-800 hover:border-red-500/40 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Changes &amp; Exit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExitConfirmOpen(false)}
                  className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Owner Action Confirmation Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-5 right-5 z-[115] px-4 py-2.5 rounded-xl bg-zinc-950/95 border border-amber-500/45 text-xs font-mono text-zinc-100 shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </MotionConfig>
  );
}
