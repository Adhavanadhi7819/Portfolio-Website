import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig, Reorder, useDragControls } from 'motion/react';
import { Plus, Save, RotateCcw, Lock, X, CheckCircle2, GitBranch } from 'lucide-react';
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
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { INITIAL_PORTFOLIO_STATE, DEFAULT_OWNER_PASSCODE, DEFAULT_PORTFOLIO_SECTIONS } from './data/portfolioData';
import { PUBLISHED_PORTFOLIO_SNAPSHOT } from './data/publishedPortfolio';
import { 
  ProjectItem, 
  VideoChapter, 
  MayaModelItem, 
  DesignerInfo, 
  PortfolioState,
  PortfolioSectionConfig,
  CustomSectionData,
  CustomSectionCard,
  PortfolioProfile,
  SectionTargetTab
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
  updateSectionConfig,
  getSectionTargetTab,
  moveSectionToTab,
  applyDraggedSectionOrder,
  importPortfolioJson
} from './utils/portfolioLogic';
import {
  fetchServerAuthStatus,
  fetchServerPortfolio,
  saveServerPortfolio,
  resetServerPortfolio,
  logoutOwnerServer,
  subscribeToPortfolioUpdates,
  fetchOwnerMessages,
  fetchGitHubSyncStatus,
  pullLatestFromGitHub,
  commitPortfolioToGitHub,
  GitHubSyncStatus
} from './utils/portfolioServerSync';

function getInitialPublishedProfile(): PortfolioProfile | null {
  if (
    PUBLISHED_PORTFOLIO_SNAPSHOT.initialized &&
    Array.isArray(PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios) &&
    PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios.length > 0
  ) {
    return (
      PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios.find(
        (p) => p.id === PUBLISHED_PORTFOLIO_SNAPSHOT.activePortfolioId
      ) || PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios[0]
    );
  }
  return null;
}

interface SortablePageSectionProps {
  sectionId: string;
  renderSection: (dragStartPointer: (e: React.PointerEvent) => void) => React.ReactNode;
}

const SortablePageSection: React.FC<SortablePageSectionProps> = ({
  sectionId,
  renderSection
}) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={sectionId}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="relative"
    >
      {renderSection((e) => dragControls.start(e))}
    </Reorder.Item>
  );
};

export default function App() {
  const reelRef = useRef<VideoReelRef>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hero');

  // Canonical Portfolio State (rendered from root data.json + live GitHub / server updates, zero localStorage)
  const [portfolioState, setPortfolioState] = useState<PortfolioState>(() => {
    const initial = getInitialPublishedProfile()?.state || INITIAL_PORTFOLIO_STATE;
    return {
      ...initial,
      sections:
        Array.isArray(initial.sections) && initial.sections.length > 0
          ? initial.sections
          : DEFAULT_PORTFOLIO_SECTIONS
    };
  });

  // Owner Authentication State (backed strictly by server httpOnly cookie session)
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(false);

  // Baseline snapshot taken when opening Owner Mode to detect session edits on close
  const [ownerSessionSnapshot, setOwnerSessionSnapshot] = useState<string | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // GitHub CMS Sync State
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GitHubSyncStatus>({
    githubConfigured: false,
    hasToken: false,
    hasOwner: false,
    hasRepo: false,
    owner: '',
    repo: '',
    branch: 'main',
    adminPinConfigured: false,
    isAuthenticated: false
  });
  const [commitMessage, setCommitMessage] = useState(
    'chore(portfolio): update data.json from Owner Mode'
  );
  const [autoPushOnSave, setAutoPushOnSave] = useState(true);
  const [lastCommitInfo, setLastCommitInfo] = useState<{
    sha: string;
    url: string;
    committedAt: string;
  } | null>(null);

  const serverVersionRef = useRef<number>(
    PUBLISHED_PORTFOLIO_SNAPSHOT.initialized ? PUBLISHED_PORTFOLIO_SNAPSHOT.version : 0
  );
  const isServerHydratedRef = useRef<boolean>(false);
  const lastSavedSignatureRef = useRef<string>('');
  const activeSyncPromiseRef = useRef<Promise<boolean> | null>(null);
  const hasPendingSaveRef = useRef<boolean>(false);
  const immediateSaveRequestedRef = useRef<boolean>(false);
  const hasBackendRef = useRef<boolean>(true);
  const [isStaticHost, setIsStaticHost] = useState<boolean>(false);
  const lastCommittedSnapshotRef = useRef<{
    activePortfolioId: string;
    portfolios: PortfolioProfile[];
    portfolioState: PortfolioState;
    version: number;
  } | null>(null);

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
    const t = window.setTimeout(() => setSaveToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [saveToast]);

  const [ownerPasscode, setOwnerPasscode] = useState<string>(DEFAULT_OWNER_PASSCODE);

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

  // Multi-Portfolio Management (rendered from root data.json, zero localStorage)
  const [portfolios, setPortfolios] = useState<PortfolioProfile[]>(() => {
    if (
      PUBLISHED_PORTFOLIO_SNAPSHOT.initialized &&
      Array.isArray(PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios) &&
      PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios.length > 0
    ) {
      return PUBLISHED_PORTFOLIO_SNAPSHOT.portfolios;
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
    return PUBLISHED_PORTFOLIO_SNAPSHOT.activePortfolioId || 'default_portfolio';
  });

  const [isPortfolioManagerOpen, setIsPortfolioManagerOpen] = useState(false);

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
    lastCommittedSnapshotRef.current = {
      activePortfolioId: resolvedActiveId,
      portfolios: JSON.parse(JSON.stringify(serverPortfolios)) as PortfolioProfile[],
      portfolioState: JSON.parse(JSON.stringify(normalizedState)) as PortfolioState,
      version
    };
    setPortfolios(serverPortfolios);
    setActivePortfolioId(resolvedActiveId);
    setPortfolioState(normalizedState);
  };

  const handleRefreshGitHubStatus = async (): Promise<GitHubSyncStatus> => {
    const nextStatus = await fetchGitHubSyncStatus();
    setGithubStatus(nextStatus);
    return nextStatus;
  };

  // Push current state & vault to GitHub/Express atomically:
  // When GitHub push is configured (or on Vercel), commit + push MUST succeed before save is applied; otherwise roll back.
  const pushStateToServer = async (
    nextPortfolios: PortfolioProfile[],
    nextActiveId: string,
    expectedSig?: string,
    forceGitHubCommit = false
  ): Promise<boolean> => {
    if (activeSyncPromiseRef.current) {
      await activeSyncPromiseRef.current.catch(() => false);
    }

    const runSave = async (): Promise<boolean> => {
      const githubPushRequired = Boolean(
        githubStatus.githubConfigured || githubStatus.runtime === 'vercel'
      );
      setSyncStatus('saving');
      if (githubPushRequired) {
        setSaveToast('Committing & pushing data.json to GitHub...');
      }

      try {
        const shouldCommitToGitHub = forceGitHubCommit || autoPushOnSave || githubPushRequired;
        const saved = shouldCommitToGitHub
          ? await saveServerPortfolio({
              activePortfolioId: nextActiveId,
              portfolios: nextPortfolios,
              commitMessage
            })
          : await saveServerPortfolio({
              activePortfolioId: nextActiveId,
              portfolios: nextPortfolios
            });

        if (githubPushRequired && !saved.githubCommit?.commitSha) {
          throw new Error('GitHub commit & push did not complete — save was not applied.');
        }

        const committedPortfolios =
          saved.initialized && Array.isArray(saved.portfolios) && saved.portfolios.length > 0
            ? saved.portfolios
            : nextPortfolios;
        const committedActiveId = saved.activePortfolioId || nextActiveId;
        const committedVersion = saved.version ?? serverVersionRef.current + 1;
        const committedActiveProfile =
          committedPortfolios.find((p) => p.id === committedActiveId) || committedPortfolios[0];

        serverVersionRef.current = committedVersion;
        if (committedActiveProfile?.state) {
          lastCommittedSnapshotRef.current = {
            activePortfolioId: committedActiveId,
            portfolios: JSON.parse(JSON.stringify(committedPortfolios)) as PortfolioProfile[],
            portfolioState: JSON.parse(JSON.stringify(committedActiveProfile.state)) as PortfolioState,
            version: committedVersion
          };
        }

        if (saved.initialized && Array.isArray(saved.portfolios) && saved.portfolios.length > 0) {
          const hadDataUrls = JSON.stringify(nextPortfolios).includes('data:');
          if (hadDataUrls && !saved.fromGitHub) {
            applyServerPayload(
              saved.portfolios,
              committedActiveId,
              committedVersion
            );
          } else if (expectedSig) {
            lastSavedSignatureRef.current = expectedSig;
          }
        } else if (expectedSig) {
          lastSavedSignatureRef.current = expectedSig;
        }

        if (saved.githubCommit?.commitSha) {
          setLastCommitInfo({
            sha: saved.githubCommit.commitSha,
            url: saved.githubCommit.commitUrl,
            committedAt: new Date().toISOString()
          });
          setSaveToast(
            `Pushed to GitHub (${saved.githubCommit.commitSha.slice(0, 7)}) — Save applied`
          );
        } else {
          setSaveToast('Saved to data.json');
        }

        setSyncStatus('saved');
        return true;
      } catch (err) {
        console.error('Failed to commit/save portfolio:', err);
        setSyncStatus('error');

        // Without successful GitHub commit & push (or valid server save), revert pending edits cleanly
        const rollback = lastCommittedSnapshotRef.current;
        if (rollback) {
          const rollbackSig = JSON.stringify({
            activePortfolioId: rollback.activePortfolioId,
            state: rollback.portfolioState,
            portfolioIds: rollback.portfolios.map((p) => ({
              id: p.id,
              name: p.name,
              subtitle: p.subtitle
            }))
          });
          lastSavedSignatureRef.current = rollbackSig;
          setPortfolios(rollback.portfolios);
          setActivePortfolioId(rollback.activePortfolioId);
          setPortfolioState(rollback.portfolioState);
        }

        if (err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED') {
          setSaveToast('Save not applied — Enter Admin PIN to commit edits to GitHub');
          setIsAuthModalOpen(true);
        } else if (err instanceof Error) {
          setSaveToast(`Save not applied: ${err.message}`);
        } else {
          setSaveToast('Save not applied — GitHub commit & push failed.');
        }
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

  const handleSaveAndCommitToGitHub = async (customMessage?: string) => {
    const mergedPortfolios = portfolios.map((p) =>
      p.id === activePortfolioId
        ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() }
        : p
    );
    setSyncStatus('saving');
    try {
      const result = await commitPortfolioToGitHub({
        activePortfolioId,
        portfolios: mergedPortfolios,
        commitMessage: customMessage || commitMessage
      });
      await handleRefreshGitHubStatus();

      if (result.ok && result.committed) {
        if (result.data?.version) {
          serverVersionRef.current = result.data.version;
        }
        if (result.commitSha) {
          setLastCommitInfo({
            sha: result.commitSha,
            url: result.commitUrl || '',
            committedAt: new Date().toISOString()
          });
        }
        lastSavedSignatureRef.current = JSON.stringify({
          activePortfolioId,
          state: portfolioState,
          portfolioIds: mergedPortfolios.map((p) => ({
            id: p.id,
            name: p.name,
            subtitle: p.subtitle
          }))
        });
        setSyncStatus('saved');
        setSaveToast(
          result.commitSha
            ? `Pushed data.json to GitHub (${result.commitSha.slice(0, 7)})`
            : 'Pushed data.json to GitHub'
        );
        return {
          ok: true,
          commitSha: result.commitSha,
          commitUrl: result.commitUrl
        };
      }

      setSyncStatus('error');
      return {
        ok: false,
        error:
          result.error ||
          'GitHub commit failed. Ensure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are configured.'
      };
    } catch (err) {
      setSyncStatus('error');
      if (err instanceof Error && err.message === 'OWNER_AUTH_REQUIRED') {
        setIsAuthModalOpen(true);
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'GitHub commit failed.'
      };
    }
  };

  const handlePullLatestFromGitHub = async () => {
    const res = await pullLatestFromGitHub(true);
    setGithubStatus(res.status);
    if (res.ok && res.data?.portfolios?.length) {
      applyServerPayload(
        res.data.portfolios,
        res.data.activePortfolioId || 'default_portfolio',
        res.data.version || serverVersionRef.current + 1
      );
      setSyncStatus('saved');
      setSaveToast(`Pulled latest data.json from GitHub (v${res.data.version || 1})`);
      return {
        ok: true,
        source: res.source,
        version: res.data.version
      };
    }
    return {
      ok: false,
      error: res.error || 'Could not pull latest data.json from GitHub.'
    };
  };

  // Initial server / GitHub hydration + httpOnly cookie auth check + live SSE sync
  useEffect(() => {
    let active = true;
    let unsubscribeSse: (() => void) | null = null;

    const syncLatestIfNewer = async () => {
      if (activeSyncPromiseRef.current || hasPendingSaveRef.current || !hasBackendRef.current) return;
      try {
        const serverData = await fetchServerPortfolio();
        if (!active || activeSyncPromiseRef.current || hasPendingSaveRef.current) return;
        if (serverData.fromStaticSnapshot) return;
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

    const hydrateFromServer = async () => {
      try {
        const ghStatus = await fetchGitHubSyncStatus().catch(() => null);
        if (!active) return;

        if (ghStatus) {
          setGithubStatus(ghStatus);
        }

        const [authStatus, serverData] = await Promise.all([
          fetchServerAuthStatus().catch(() => null),
          fetchServerPortfolio().catch(() => null)
        ]);
        if (!active) return;

        const hasExpress = Boolean(authStatus?.serverAvailable);
        const hasGitHub = Boolean(ghStatus?.githubConfigured || ghStatus?.canPullFromGitHub);
        hasBackendRef.current = hasExpress || hasGitHub;
        setIsStaticHost(!hasExpress && !ghStatus?.githubConfigured);

        const cookieAuthenticated = Boolean(
          authStatus?.isAuthenticated || ghStatus?.isAuthenticated
        );
        if (cookieAuthenticated) {
          setIsOwnerMode(true);
        } else {
          setIsOwnerMode(false);
          setOwnerSessionSnapshot(null);
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

          if (cookieAuthenticated) {
            const activeP =
              serverData.portfolios.find(
                (p) => p.id === (serverData.activePortfolioId || 'default_portfolio')
              ) || serverData.portfolios[0];
            if (activeP?.state) {
              setOwnerSessionSnapshot(JSON.stringify(activeP.state));
            }
            if (authStatus?.serverAvailable) {
              fetchOwnerMessages()
                .then((inbox) => {
                  if (active) setUnreadMessageCount(inbox.unreadCount || 0);
                })
                .catch(() => {});
            }
          }
          setSyncStatus('saved');
        }

        if (active && authStatus?.serverAvailable && hasBackendRef.current) {
          unsubscribeSse = subscribeToPortfolioUpdates(
            ({ version }) => {
              if (
                version > serverVersionRef.current &&
                !activeSyncPromiseRef.current &&
                !hasPendingSaveRef.current
              ) {
                syncLatestIfNewer();
              }
            },
            ({ unreadCount }) => {
              setUnreadMessageCount(unreadCount);
            }
          );
        }
      } finally {
        if (active) {
          isServerHydratedRef.current = true;
        }
      }
    };

    hydrateFromServer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncLatestIfNewer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      unsubscribeSse?.();
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
    const delayMs = immediateSaveRequestedRef.current || githubStatus.githubConfigured ? 0 : 250;
    const timer = window.setTimeout(async () => {
      const wasImmediate = immediateSaveRequestedRef.current;
      immediateSaveRequestedRef.current = false;
      const ok = await pushStateToServer(mergedPortfolios, activePortfolioId, sig);
      if (ok && wasImmediate) {
        setSaveToast(
          portfolioState.designerInfo.resumePdfUrl
            ? 'Resume uploaded, pushed to GitHub & published'
            : 'Resume changes pushed to GitHub & published'
        );
      }
    }, delayMs);

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
      handleRefreshGitHubStatus().then((st) => {
        setIsStaticHost(!hasBackendRef.current && !st.githubConfigured);
      });
      if (hasBackendRef.current) {
        fetchOwnerMessages()
          .then((inbox) => setUnreadMessageCount(inbox.unreadCount || 0))
          .catch(() => {});
      }
    } else {
      setOwnerSessionSnapshot(null);
      setIsExitConfirmOpen(false);
    }
    setIsOwnerMode(val);
  };

  const handleRequestCloseOwnerMode = async () => {
    if (hasUnsavedOwnerChanges || hasPendingSaveRef.current || activeSyncPromiseRef.current) {
      setIsExitConfirmOpen(true);
    } else {
      await logoutOwnerServer();
      handleSetOwnerMode(false);
    }
  };

  const handleSaveAndExitOwnerMode = async () => {
    const mergedPortfolios = portfolios.map((p) =>
      p.id === activePortfolioId
        ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() }
        : p
    );

    const ok = await pushStateToServer(mergedPortfolios, activePortfolioId, undefined, true);
    if (!ok) {
      setSaveToast('Could not save changes · Check Owner Auth or GitHub Sync configuration');
      setIsExitConfirmOpen(false);
      return;
    }

    await logoutOwnerServer();
    handleSetOwnerMode(false);
    setSaveToast(
      githubStatus.githubConfigured
        ? 'Changes committed to GitHub & saved · Owner Mode closed'
        : 'Changes saved to data.json · Owner Mode closed'
    );
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

  const handleDragReorderSections = (draggedSubsetIds: string[]) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: applyDraggedSectionOrder(
        prev.sections || DEFAULT_PORTFOLIO_SECTIONS,
        draggedSubsetIds
      )
    }));
  };

  const handleMoveSectionToTab = (sectionId: string, targetTab: SectionTargetTab) => {
    setPortfolioState(prev => ({
      ...prev,
      sections: moveSectionToTab(prev.sections || DEFAULT_PORTFOLIO_SECTIONS, sectionId, targetTab)
    }));
    const resolvedTab = targetTab === 'own' ? sectionId : targetTab;
    setActiveTab(resolvedTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSaveToast('Moved section & updated navigation tab');
  };

  const handleAddCustomSection = (newSection: PortfolioSectionConfig) => {
    const withTargetTab: PortfolioSectionConfig = {
      ...newSection,
      targetTab: newSection.targetTab || (activeTab as SectionTargetTab)
    };
    setPortfolioState(prev => ({
      ...prev,
      sections: addCustomSection(
        prev.sections || DEFAULT_PORTFOLIO_SECTIONS,
        withTargetTab,
        insertBelowTargetId
      )
    }));
    setInsertBelowTargetId(undefined);
    const resolvedTab = getSectionTargetTab(withTargetTab);
    if (resolvedTab) {
      setActiveTab(resolvedTab);
    }
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
    if ('resumePdfUrl' in info) {
      immediateSaveRequestedRef.current = true;
    }
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
        await resetServerPortfolio(INITIAL_PORTFOLIO_STATE);
        setSaveToast('Portfolio reset to defaults');
      } catch (err) {
        console.error('Server reset failed:', err);
      }
    }
  };

  // Tab-aware Navigation & Reel Playback
  const handleNavigate = (sectionId: string) => {
    const allSections = portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS;
    const matchedSection = allSections.find(s => s.id === sectionId);
    let targetTab = sectionId;

    if (matchedSection) {
      targetTab = getSectionTargetTab(matchedSection);
    } else if (['hero', 'projects', 'about', 'resume', 'contact'].includes(sectionId)) {
      targetTab = sectionId;
    }

    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId !== targetTab) {
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
    const reelSection = (portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS).find(s => s.id === 'reel');
    const reelTab = reelSection ? getSectionTargetTab(reelSection) : 'projects';
    setActiveTab(reelTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      reelRef.current?.scrollTo();
      setTimeout(() => {
        reelRef.current?.seekTo(timestamp);
      }, 320);
    }, 120);
  };

  const handleJumpToChapter = (chapterId: string) => {
    const reelSection = (portfolioState.sections || DEFAULT_PORTFOLIO_SECTIONS).find(s => s.id === 'reel');
    const reelTab = reelSection ? getSectionTargetTab(reelSection) : 'projects';
    setActiveTab(reelTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const ch = portfolioState.videoChapters.find(c => c.id === chapterId);
    if (ch) {
      setTimeout(() => {
        reelRef.current?.scrollTo();
        setTimeout(() => {
          reelRef.current?.seekTo(ch.startTime);
        }, 320);
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

  const currentTabSections = activeSections.filter(sec => {
    const secTab = getSectionTargetTab(sec);
    return secTab === activeTab || sec.id === activeTab;
  });

  const handleDownloadDataJson = () => {
    const mergedPortfolios = portfolios.map((p) =>
      p.id === activePortfolioId
        ? { ...p, state: portfolioState, updatedAt: new Date().toISOString() }
        : p
    );
    const fullBundle = {
      initialized: true,
      version: Math.max(1, serverVersionRef.current),
      updatedAt: new Date().toISOString(),
      activePortfolioId,
      portfolios: mergedPortfolios
    };
    const blob = new Blob([JSON.stringify(fullBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSaveToast('Downloaded data.json snapshot');
  };

  const handleImportDataJson = (jsonText: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonText) as {
        portfolios?: PortfolioProfile[];
        activePortfolioId?: string;
        version?: number;
      };
      if (parsed && Array.isArray(parsed.portfolios) && parsed.portfolios.length > 0) {
        const nextActiveId =
          parsed.activePortfolioId && parsed.portfolios.some((p) => p.id === parsed.activePortfolioId)
            ? parsed.activePortfolioId
            : parsed.portfolios[0].id;
        const activeP = parsed.portfolios.find((p) => p.id === nextActiveId) || parsed.portfolios[0];
        if (activeP?.state) {
          setPortfolios(parsed.portfolios);
          setActivePortfolioId(nextActiveId);
          setPortfolioState({
            ...activeP.state,
            sections:
              Array.isArray(activeP.state.sections) && activeP.state.sections.length > 0
                ? activeP.state.sections
                : DEFAULT_PORTFOLIO_SECTIONS
          });
          setSaveToast('Imported data.json into portfolio');
          return { ok: true };
        }
      }
      const imported = importPortfolioJson(jsonText);
      if (imported.isValid && imported.state) {
        setPortfolioState(imported.state);
        setSaveToast('Imported portfolio JSON');
        return { ok: true };
      }
      return { ok: false, error: imported.error || 'Invalid data.json format.' };
    } catch {
      return { ok: false, error: 'Could not parse JSON file.' };
    }
  };

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
          onOpenGitHubSync={() => setIsGitHubSyncOpen(true)}
          githubConfigured={githubStatus.githubConfigured}
          lastCommitSha={lastCommitInfo?.sha || null}
          hasUnsavedChanges={hasUnsavedOwnerChanges}
          syncStatus={syncStatus}
          isStaticHost={isStaticHost}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex-1 flex flex-col"
          >
            {/* On-Point Add Section Top Button in Owner Mode */}
            {isOwnerMode && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-1 flex items-center justify-center">
                <button
                  onClick={() => {
                    setInsertBelowTargetId(undefined);
                    setIsSectionManagerOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-full bg-zinc-900/90 hover:bg-amber-500 text-zinc-300 hover:text-black border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
                  title="Add a new custom section with video/photo or drag-reorder sections"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Section at Top</span>
                </button>
              </div>
            )}

            {currentTabSections.length === 0 && isOwnerMode && (
              <div className="max-w-2xl mx-auto my-20 p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4">
                <p className="text-sm font-mono text-zinc-400">
                  No sections are currently placed inside this tab.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSectionManagerOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Manage &amp; Add Sections
                </button>
              </div>
            )}

            {(() => {
              const renderSectionItem = (
                sec: PortfolioSectionConfig,
                idx: number,
                dragStartPointer?: (e: React.PointerEvent) => void
              ) => {
                const canMoveUp = idx > 0;
                const canMoveDown = idx < currentTabSections.length - 1;
                const moveWithinTab = (dir: 'up' | 'down') => {
                  const ids = currentTabSections.map((s) => s.id);
                  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
                  if (swapIdx < 0 || swapIdx >= ids.length) return;
                  [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
                  handleDragReorderSections(ids);
                };
                const onMoveUp = () => moveWithinTab('up');
                const onMoveDown = () => moveWithinTab('down');
                const onHide = () => handleToggleSectionVisibility(sec.id, false);
                const onAddSectionBelow = () => handlePromptAddSectionBelow(sec.id);
                const resolvedTabValue: SectionTargetTab = sec.targetTab
                  ? sec.targetTab
                  : (['hero', 'projects', 'about', 'resume', 'contact'].includes(
                      getSectionTargetTab(sec)
                    )
                      ? (getSectionTargetTab(sec) as SectionTargetTab)
                      : 'own');
                const onChangeTab = (nextTab: SectionTargetTab) =>
                  handleMoveSectionToTab(sec.id, nextTab);
                const showDragHandle = isOwnerMode && currentTabSections.length > 1;

                let sectionNode: React.ReactNode = null;

                if (sec.id === 'hero') {
                  sectionNode = (
                    <HeroSection
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onEditHero={() => handleOpenEditModal('hero')}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      onPlayReel={() => handlePlayInReel(0)}
                      onExploreProjects={() => handleNavigate('projects')}
                      onJumpToChapter={handleJumpToChapter}
                      onOpenResume={() => handleNavigate('resume')}
                      onOpenContact={() => handleNavigate('contact')}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      flagshipProject={flagshipProject}
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onEditFlagship={(p) => handleOpenEditModal('project', p)}
                      onEditFlagshipDetails={() => handleOpenEditModal('flagship')}
                      onPlayWalkthrough={(timestamp: number) => handlePlayInReel(timestamp)}
                      onOpenProjectModal={handleOpenProjectModal}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      models={portfolioState.mayaModels}
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onPlayInReel={handlePlayInReel}
                      onAddModel={() => handleOpenEditModal('model')}
                      onEditModel={(m) => handleOpenEditModal('model', m)}
                      onSaveModel={handleSaveModel}
                      onDeleteModel={handleDeleteModel}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onContactClick={() => handleNavigate('contact')}
                      onEditAbout={() => handleOpenEditModal('about')}
                      onWatchReelClick={() => handlePlayInReel(0)}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onEditResume={() => handleOpenEditModal('resume')}
                      onContactClick={() => handleNavigate('contact')}
                      onWatchReelClick={() => handlePlayInReel(0)}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      designerInfo={portfolioState.designerInfo}
                      isOwnerMode={isOwnerMode}
                      onEditContact={() => handleOpenEditModal('contact')}
                      onUpdateDesignerInfo={handleSaveDesignerInfo}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onHide={onHide}
                      onAddSectionBelow={onAddSectionBelow}
                    />
                  );
                } else {
                  sectionNode = (
                    <CustomSection
                      section={sec}
                      isOwnerMode={isOwnerMode}
                      currentTab={resolvedTabValue}
                      onChangeTab={onChangeTab}
                      showDragHandle={showDragHandle}
                      onDragStartPointer={dragStartPointer}
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
                      onUpdateSectionData={(dataUpdates) =>
                        handleUpdateCustomSectionData(sec.id, dataUpdates)
                      }
                      onAddCard={() => handleAddCustomCard(sec.id)}
                      onDeleteCard={(cardId) => handleDeleteCustomCard(sec.id, cardId)}
                    />
                  );
                }

                return (
                  <React.Fragment key={sec.id}>
                    {sectionNode}
                    {isOwnerMode && (
                      <div className="relative py-2 flex items-center justify-center group/add-divider z-20">
                        <div className="absolute inset-x-4 sm:inset-x-8 h-px border-t border-dashed border-amber-500/25 group-hover/add-divider:border-amber-500/70 transition-colors" />
                        <button
                          onClick={() => handlePromptAddSectionBelow(sec.id)}
                          className="relative px-3.5 py-1 rounded-full bg-zinc-950 hover:bg-amber-500 text-zinc-300 hover:text-black border border-amber-500/40 hover:border-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors shadow-xl flex items-center gap-1.5 cursor-pointer"
                          title={`Add a new section directly below ${sec.title}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add Section Here</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              };

              if (isOwnerMode && currentTabSections.length > 1) {
                return (
                  <Reorder.Group
                    axis="y"
                    values={currentTabSections.map((s) => s.id)}
                    onReorder={handleDragReorderSections}
                    className="flex flex-col"
                  >
                    {currentTabSections.map((sec, idx) => (
                      <SortablePageSection
                        key={sec.id}
                        sectionId={sec.id}
                        renderSection={(dragStartPointer) =>
                          renderSectionItem(sec, idx, dragStartPointer)
                        }
                      />
                    ))}
                  </Reorder.Group>
                );
              }

              return currentTabSections.map((sec, idx) => renderSectionItem(sec, idx));
            })()}
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
        onDragReorder={handleDragReorderSections}
        onMoveToTab={handleMoveSectionToTab}
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

      {/* Owner Auth Modal (Admin PIN + 2FA login/lock) */}
      <OwnerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleSetOwnerMode(true)}
        currentPasscode={ownerPasscode}
        onUpdatePasscode={handleChangePasscode}
        isAlreadyOwner={isOwnerMode}
        onLockOwnerMode={handleRequestCloseOwnerMode}
        onOpenGitHubSync={() => setIsGitHubSyncOpen(true)}
      />

      {/* GitHub CMS Sync & Vercel Setup Guide Modal */}
      <GitHubSyncModal
        isOpen={isGitHubSyncOpen}
        onClose={() => setIsGitHubSyncOpen(false)}
        githubStatus={githubStatus}
        onRefreshStatus={handleRefreshGitHubStatus}
        onStatusUpdated={setGithubStatus}
        commitMessage={commitMessage}
        onCommitMessageChange={setCommitMessage}
        autoPushOnSave={autoPushOnSave}
        onAutoPushOnSaveChange={setAutoPushOnSave}
        onSaveAndCommitToGitHub={handleSaveAndCommitToGitHub}
        onPullLatestFromGitHub={handlePullLatestFromGitHub}
        onDownloadDataJson={handleDownloadDataJson}
        onImportDataJson={handleImportDataJson}
        lastCommitInfo={lastCommitInfo}
        activeVersion={serverVersionRef.current}
        lastUpdatedAt={portfolios.find((p) => p.id === activePortfolioId)?.updatedAt}
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

      {/* Subtle Floating Owner Edit & GitHub Sync Toggle */}
      <div className="fixed bottom-4 left-4 z-[90] flex items-center gap-2">
        {isOwnerMode ? (
          <button
            type="button"
            onClick={() => setIsGitHubSyncOpen(true)}
            className="px-3 py-2 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-amber-500/40 text-zinc-100 text-[11px] font-mono uppercase tracking-wider shadow-xl backdrop-blur-md flex items-center gap-2 transition-colors cursor-pointer"
            title="Open GitHub Sync Status & Setup Guide"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                githubStatus.githubConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {syncStatus === 'saving'
                ? 'Committing...'
                : githubStatus.githubConfigured
                ? 'GitHub Sync'
                : 'GitHub Setup'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-950/75 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-400 hover:text-zinc-100 text-[10px] font-mono uppercase tracking-wider shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Unlock Owner Edit Mode (Shift+O)"
            aria-label="Unlock Owner Edit Mode"
          >
            <Lock className="w-3 h-3 text-amber-400/80" />
            <span>Owner Edit</span>
          </button>
        )}
      </div>

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
