import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Sliders, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  FileJson,
  Layers,
  Sparkles,
  Film,
  Gamepad2,
  User,
  FileText,
  Mail,
  Image,
  Box,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { uploadDocumentAsset } from '../utils/fileHelpers';
import { 
  ProjectItem, 
  ProjectCategory, 
  VideoChapter, 
  MayaModelItem, 
  DesignerInfo, 
  PortfolioState,
  HeroStatItem,
  FlagshipFeatureCard,
  FlagshipScreenshotItem,
  PhilosophyCardItem,
  StillPhotoItem,
  CompetencyCardItem,
  ResumeExperience,
  ResumeEducation
} from '../types/portfolio';
import { validateProjectData, exportPortfolioJson, importPortfolioJson } from '../utils/portfolioLogic';

export type EditModalMode = 
  | 'project'
  | 'chapter'
  | 'model'
  | 'hero'
  | 'bio'
  | 'video_reel'
  | 'flagship'
  | 'skills'
  | 'about'
  | 'resume'
  | 'contact'
  | 'footer'
  | 'json_backup';

export type OwnerEditMode = EditModalMode;

interface OwnerEditModalProps {
  isOpen: boolean;
  mode: EditModalMode;
  onClose: () => void;
  editingItem: any;
  onSaveProject: (project: ProjectItem) => void;
  onSaveChapter: (chapter: VideoChapter) => void;
  onSaveModel: (model: MayaModelItem) => void;
  onSaveDesignerInfo: (info: Partial<DesignerInfo>) => void;
  onSaveVideoPath?: (path: string) => void;
  currentPortfolioState: PortfolioState;
  onImportState: (state: PortfolioState) => void;
}

export const OwnerEditModal: React.FC<OwnerEditModalProps> = ({
  isOpen,
  mode,
  onClose,
  editingItem,
  onSaveProject,
  onSaveChapter,
  onSaveModel,
  onSaveDesignerInfo,
  onSaveVideoPath,
  currentPortfolioState,
  onImportState
}) => {
  // Active Tab in the modal
  const [activeTab, setActiveTab] = useState<EditModalMode>(mode === 'bio' ? 'hero' : mode);

  // Local form states
  const [projectForm, setProjectForm] = useState<Partial<ProjectItem>>({});
  const [chapterForm, setChapterForm] = useState<Partial<VideoChapter>>({});
  const [modelForm, setModelForm] = useState<Partial<MayaModelItem>>({});
  const [bioForm, setBioForm] = useState<Partial<DesignerInfo>>({});
  const [videoPathForm, setVideoPathForm] = useState<string>('');
  const [skillsForm, setSkillsForm] = useState<any[]>([]);
  const [toolsInput, setToolsInput] = useState('');
  
  // JSON import/export state
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setJsonError('');
    setSavedSuccessMessage(null);

    const initialMode = mode === 'bio' ? 'hero' : mode;
    setActiveTab(initialMode);

    // Initialize all forms from current state
    const info = currentPortfolioState.designerInfo;
    setBioForm({ ...info });
    setVideoPathForm(currentPortfolioState.videoPath || '');
    setSkillsForm([...(info.skills || [])]);
    setToolsInput((info.tools || []).join(', '));

    if (mode === 'project') {
      if (editingItem) {
        setProjectForm({ ...editingItem });
      } else {
        setProjectForm({
          id: `proj-${Date.now()}`,
          title: '',
          category: 'level-design',
          categoryLabel: 'Level Design & Post-Process',
          summary: '',
          description: '',
          keyFeatures: ['Environment blockout and lighting passes'],
          techStack: ['Unreal Engine 5', 'Post-Process Volume'],
          thumbnail: '/showcase/gas-station-night.jpg',
          galleryImages: ['/showcase/gas-station-night.jpg'],
          videoTimestamp: 0,
          isFlagship: false,
          conceptNotes: {
            theme: '',
            lighting: '',
            mechanics: '',
            levelScale: ''
          }
        });
      }
    } else if (mode === 'chapter') {
      if (editingItem) {
        setChapterForm({ ...editingItem });
      } else {
        setChapterForm({
          id: `ch-${Date.now()}`,
          title: '',
          subtitle: '',
          startTime: 0,
          endTime: 30,
          thumbnail: '/showcase/hero-adhavan.jpg',
          category: 'all',
          description: ''
        });
      }
    } else if (mode === 'model') {
      if (editingItem) {
        setModelForm({ ...editingItem });
      } else {
        setModelForm({
          id: `model-${Date.now()}`,
          title: '',
          description: '',
          thumbnail: '/showcase/maya-models.jpg',
          software: 'Autodesk Maya',
          details: ['Clean quad topology with smooth edge loops'],
          specs: {
            topology: 'Clean quad-dominant mesh',
            textures: 'PBR Shading',
            category: '3D Prop'
          }
        });
      }
    } else if (mode === 'json_backup') {
      setJsonText(exportPortfolioJson(currentPortfolioState));
    }
  }, [isOpen, mode, editingItem, currentPortfolioState]);

  if (!isOpen) return null;

  // Flash success notification
  const triggerSuccess = (msg: string) => {
    setSavedSuccessMessage(msg);
    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 2500);
  };

  // Handlers
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateProjectData(projectForm);
    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }
    const categoryLabels: Record<ProjectCategory, string> = {
      'all': 'Showcase',
      'game-design': 'Game Design',
      '3d-arts': '3D Arts',
      'level-design': 'Level Design & Post-Process',
      'environment': 'Environment Art',
      'vehicle-rigging': 'Vehicle Rigging',
      'maya-3d': '3D Modeling',
      'flagship-game': 'Flagship Game'
    };

    const finalProject: ProjectItem = {
      id: projectForm.id || `proj-${Date.now()}`,
      title: projectForm.title || 'Untitled Project',
      category: (projectForm.category as ProjectCategory) || 'level-design',
      categoryLabel: categoryLabels[(projectForm.category as ProjectCategory) || 'level-design'],
      summary: projectForm.summary || '',
      description: projectForm.description || '',
      keyFeatures: Array.isArray(projectForm.keyFeatures) ? projectForm.keyFeatures : [],
      techStack: Array.isArray(projectForm.techStack) ? projectForm.techStack : [],
      thumbnail: projectForm.thumbnail || '/showcase/hero-adhavan.jpg',
      galleryImages: Array.isArray(projectForm.galleryImages) && projectForm.galleryImages.length > 0
        ? projectForm.galleryImages
        : [projectForm.thumbnail || '/showcase/hero-adhavan.jpg'],
      videoTimestamp: Number(projectForm.videoTimestamp) || 0,
      isFlagship: Boolean(projectForm.isFlagship),
      conceptNotes: projectForm.conceptNotes
    };

    onSaveProject(finalProject);
    triggerSuccess('Project saved successfully!');
    setTimeout(() => onClose(), 600);
  };

  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title?.trim()) {
      setErrors({ title: 'Chapter title is required' });
      return;
    }

    const finalChapter: VideoChapter = {
      id: chapterForm.id || `ch-${Date.now()}`,
      title: chapterForm.title.trim(),
      subtitle: chapterForm.subtitle?.trim() || '',
      startTime: Number(chapterForm.startTime) || 0,
      endTime: Number(chapterForm.endTime) || ((Number(chapterForm.startTime) || 0) + 15),
      thumbnail: chapterForm.thumbnail || '/showcase/hero-adhavan.jpg',
      category: (chapterForm.category as ProjectCategory) || 'all',
      description: chapterForm.description || ''
    };

    onSaveChapter(finalChapter);
    triggerSuccess('Video Chapter saved successfully!');
    setTimeout(() => onClose(), 600);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.title?.trim()) {
      setErrors({ title: 'Model title is required' });
      return;
    }

    const finalModel: MayaModelItem = {
      id: modelForm.id || `model-${Date.now()}`,
      title: modelForm.title.trim(),
      description: modelForm.description || '',
      thumbnail: modelForm.thumbnail || '/showcase/maya-models.jpg',
      software: modelForm.software || 'Autodesk Maya',
      details: Array.isArray(modelForm.details) ? modelForm.details : [],
      specs: {
        topology: modelForm.specs?.topology || 'Clean quad-dominant mesh',
        textures: modelForm.specs?.textures || 'PBR Materials',
        category: modelForm.specs?.category || '3D Prop'
      }
    };

    onSaveModel(finalModel);
    triggerSuccess('Maya 3D Model saved successfully!');
    setTimeout(() => onClose(), 600);
  };

  const handleSaveBioGeneric = (e: React.FormEvent, successMsg = 'Changes saved successfully!') => {
    e.preventDefault();
    const tools = toolsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updated: DesignerInfo = {
      ...currentPortfolioState.designerInfo,
      ...bioForm,
      skills: skillsForm.length > 0 ? skillsForm : currentPortfolioState.designerInfo.skills,
      tools: tools.length > 0 ? tools : currentPortfolioState.designerInfo.tools
    } as DesignerInfo;

    onSaveDesignerInfo(updated);
    if (onSaveVideoPath && videoPathForm) {
      onSaveVideoPath(videoPathForm);
    }
    triggerSuccess(successMsg);
  };

  const handleApplyJson = () => {
    const res = importPortfolioJson(jsonText);
    if (!res.isValid) {
      setJsonError(res.error || 'Invalid JSON format');
      return;
    }
    onImportState(res.state);
    triggerSuccess('JSON Data applied successfully!');
    setTimeout(() => onClose(), 800);
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const downloadJsonFile = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adhavan-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navTabs: { id: EditModalMode; label: string; icon: React.ReactNode }[] = [
    { id: 'hero', label: 'Hero & Stats', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'video_reel', label: 'Video Reel', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'flagship', label: 'Latest Project', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'project', label: 'Projects', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'model', label: 'Maya 3D', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'About & Timeline', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'resume', label: 'Resume / CV', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'contact', label: 'Contact', icon: <Mail className="w-3.5 h-3.5" /> },
    { id: 'json_backup', label: 'Backup / JSON', icon: <FileJson className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h2 id="owner-modal-title" className="text-base sm:text-lg font-heading font-black text-white uppercase tracking-wider">
              OWNER STUDIO EDITOR — EDIT ANY LINE, PHOTO OR VIDEO
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close edit dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs Navigator */}
        <div className="px-4 py-2.5 bg-black/60 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSavedSuccessMessage(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Success Alert Banner */}
        {savedSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}

        {/* Body content based on activeTab */}
        <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto space-y-6">

          {/* ======================================================== */}
          {/* TAB: HERO & STATS */}
          {/* ======================================================== */}
          {activeTab === 'hero' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Hero section & stats updated!')} className="space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Hero Title, Professional Identity & Bio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Customize the main headline, tagline, and photo card at the top of the portfolio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Designer Name *
                  </label>
                  <input
                    type="text"
                    value={bioForm.name || ''}
                    onChange={(e) => setBioForm({ ...bioForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Professional Role / Title *
                  </label>
                  <input
                    type="text"
                    value={bioForm.title || ''}
                    onChange={(e) => setBioForm({ ...bioForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Hero Bio / Tagline Statement
                </label>
                <textarea
                  rows={2}
                  value={bioForm.tagline || ''}
                  onChange={(e) => setBioForm({ ...bioForm, tagline: e.target.value })}
                  placeholder="Crafting immersive Unreal Engine worlds..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Hero Photo & Visual Card Settings */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Hero Visual Photo Card (Right Column)
                </span>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Hero Photo Image URL or File Path
                  </label>
                  <input
                    type="text"
                    value={bioForm.heroPhotoUrl || '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png'}
                    onChange={(e) => setBioForm({ ...bioForm, heroPhotoUrl: e.target.value })}
                    placeholder="/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Photo Alignment, Fit & Zoom Framing */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      Portrait Photo Alignment &amp; Framing
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBioForm({
                          ...bioForm,
                          heroPhotoAlign: { x: 50, y: 50, zoom: 1, fit: 'cover' }
                        })
                      }
                      className="text-[10px] font-mono text-zinc-400 hover:text-amber-400 cursor-pointer"
                    >
                      Reset Center
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBioForm({
                          ...bioForm,
                          heroPhotoAlign: {
                            x: bioForm.heroPhotoAlign?.x ?? 50,
                            y: bioForm.heroPhotoAlign?.y ?? 50,
                            zoom: bioForm.heroPhotoAlign?.zoom ?? 1,
                            fit: 'cover'
                          }
                        })
                      }
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase cursor-pointer border transition-colors ${
                        (bioForm.heroPhotoAlign?.fit || 'cover') === 'cover'
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      Fill Frame (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBioForm({
                          ...bioForm,
                          heroPhotoAlign: {
                            x: bioForm.heroPhotoAlign?.x ?? 50,
                            y: bioForm.heroPhotoAlign?.y ?? 50,
                            zoom: 1,
                            fit: 'contain'
                          }
                        })
                      }
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase cursor-pointer border transition-colors ${
                        bioForm.heroPhotoAlign?.fit === 'contain'
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      Show Full Photo (Fit)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Horizontal X</span>
                        <span className="text-amber-400">{bioForm.heroPhotoAlign?.x ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bioForm.heroPhotoAlign?.x ?? 50}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            heroPhotoAlign: {
                              x: Number(e.target.value),
                              y: bioForm.heroPhotoAlign?.y ?? 50,
                              zoom: bioForm.heroPhotoAlign?.zoom ?? 1,
                              fit: bioForm.heroPhotoAlign?.fit ?? 'cover'
                            }
                          })
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Vertical Y</span>
                        <span className="text-amber-400">{bioForm.heroPhotoAlign?.y ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bioForm.heroPhotoAlign?.y ?? 50}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            heroPhotoAlign: {
                              x: bioForm.heroPhotoAlign?.x ?? 50,
                              y: Number(e.target.value),
                              zoom: bioForm.heroPhotoAlign?.zoom ?? 1,
                              fit: bioForm.heroPhotoAlign?.fit ?? 'cover'
                            }
                          })
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Scale / Zoom</span>
                        <span className="text-amber-400">{(bioForm.heroPhotoAlign?.zoom ?? 1).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={1.8}
                        step={0.05}
                        value={bioForm.heroPhotoAlign?.zoom ?? 1}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            heroPhotoAlign: {
                              x: bioForm.heroPhotoAlign?.x ?? 50,
                              y: bioForm.heroPhotoAlign?.y ?? 50,
                              zoom: Number(e.target.value),
                              fit: bioForm.heroPhotoAlign?.fit ?? 'cover'
                            }
                          })
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Badge 1 (Engine)
                    </label>
                    <input
                      type="text"
                      value={bioForm.heroEngineTags?.engine || 'Unreal 5'}
                      onChange={(e) => setBioForm({
                        ...bioForm,
                        heroEngineTags: {
                          engine: e.target.value,
                          maya: bioForm.heroEngineTags?.maya || 'Maya',
                          focus: bioForm.heroEngineTags?.focus || 'Mechanics'
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Badge 2 (3D Tool)
                    </label>
                    <input
                      type="text"
                      value={bioForm.heroEngineTags?.maya || 'Maya'}
                      onChange={(e) => setBioForm({
                        ...bioForm,
                        heroEngineTags: {
                          engine: bioForm.heroEngineTags?.engine || 'Unreal 5',
                          maya: e.target.value,
                          focus: bioForm.heroEngineTags?.focus || 'Mechanics'
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Badge 3 (Discipline)
                    </label>
                    <input
                      type="text"
                      value={bioForm.heroEngineTags?.focus || 'Mechanics'}
                      onChange={(e) => setBioForm({
                        ...bioForm,
                        heroEngineTags: {
                          engine: bioForm.heroEngineTags?.engine || 'Unreal 5',
                          maya: bioForm.heroEngineTags?.maya || 'Maya',
                          focus: e.target.value
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Stat Counters (Add / Edit / Remove) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Hero Bottom Stat Counters
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const curr = Array.isArray(bioForm.heroStats)
                        ? bioForm.heroStats
                        : [
                            { number: '6+', label: 'Unreal Environments & Levels' },
                            { number: '3D RPG', label: 'Flagship Game In Progress' },
                            { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
                            { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
                          ];
                      setBioForm({
                        ...bioForm,
                        heroStats: [...curr, { number: 'New', label: 'Stat description' }]
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Add Stat</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(bioForm.heroStats)
                    ? bioForm.heroStats
                    : [
                        { number: '6+', label: 'Unreal Environments & Levels' },
                        { number: '3D RPG', label: 'Flagship Game In Progress' },
                        { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
                        { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
                      ]
                  ).map((stat, sIdx, allStats) => (
                    <div key={sIdx} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) => {
                          const curr = [...allStats];
                          curr[sIdx] = { ...curr[sIdx], number: e.target.value };
                          setBioForm({ ...bioForm, heroStats: curr });
                        }}
                        placeholder="e.g. 6+"
                        className="w-20 px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-amber-400 font-bold font-mono text-xs"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const curr = [...allStats];
                          curr[sIdx] = { ...curr[sIdx], label: e.target.value };
                          setBioForm({ ...bioForm, heroStats: curr });
                        }}
                        placeholder="Label"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-zinc-200 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = allStats.filter((_, i) => i !== sIdx);
                          setBioForm({ ...bioForm, heroStats: next });
                        }}
                        className="p-1.5 rounded bg-zinc-950 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer shrink-0"
                        title="Remove this stat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Hero, Bio & Stats</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: VIDEO REEL & VIDEO SOURCE */}
          {/* ======================================================== */}
          {activeTab === 'video_reel' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Video Reel settings updated!')} className="space-y-5">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Cinematic Showreel Video & Text
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Update the video source file path / URL, section title, description, and resolution label.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
                  Main Video Source Path / URL *
                </label>
                <input
                  type="text"
                  value={videoPathForm}
                  onChange={(e) => setVideoPathForm(e.target.value)}
                  placeholder="/assets/aistudio/Portfolio_46956db1.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/50 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Default local video: <code className="text-amber-400">/assets/aistudio/Portfolio_46956db1.mp4</code>. You can paste any local video path or hosted MP4 URL.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Reel Section Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.reelHeading || 'Cinematic Showreel'}
                    onChange={(e) => setBioForm({ ...bioForm, reelHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Resolution Badge Note
                  </label>
                  <input
                    type="text"
                    value={bioForm.reelResolutionNote || 'Resolution: 1080p 30fps'}
                    onChange={(e) => setBioForm({ ...bioForm, reelResolutionNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Reel Subtitle Description
                </label>
                <textarea
                  rows={2}
                  value={bioForm.reelSubheading || 'Recorded directly from Unreal Engine and Autodesk Maya viewport sessions. Use the chapter navigator below to jump between projects.'}
                  onChange={(e) => setBioForm({ ...bioForm, reelSubheading: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Chapters Quick Manager */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Reel Keyframe Chapters ({currentPortfolioState.videoChapters.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setChapterForm({
                        id: `ch-${Date.now()}`,
                        title: '',
                        subtitle: '',
                        startTime: 0,
                        endTime: 20,
                        thumbnail: '/showcase/hero-adhavan.jpg',
                        category: 'all',
                        description: ''
                      });
                      setActiveTab('chapter');
                    }}
                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentPortfolioState.videoChapters.map((ch) => (
                    <div key={ch.id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white mr-2">{ch.title}</span>
                        <span className="text-amber-400 font-mono">({Math.floor(ch.startTime / 60)}:{String(ch.startTime % 60).padStart(2, '0')})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChapterForm({ ...ch });
                          setActiveTab('chapter');
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-amber-400"
                        title="Edit chapter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Video Source & Settings</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: FLAGSHIP GAME FEATURE */}
          {/* ======================================================== */}
          {activeTab === 'flagship' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Latest Project details updated!')} className="space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Latest Project Showcase (Gameplay Video &amp; Specs)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure your recorded gameplay video, playable build download link, and game specifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.flagshipHeading || 'MY LATEST PROJECT'}
                    onChange={(e) => setBioForm({ ...bioForm, flagshipHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={bioForm.flagshipQuote || 'Recorded gameplay footage, playable build download, and game specifications.'}
                    onChange={(e) => setBioForm({ ...bioForm, flagshipQuote: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Game Download Link & Build Video */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Playable Build Download Link &amp; Recorded Gameplay Video
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1">
                      Playable Build URL (itch.io, Drive, Download Link)
                    </label>
                    <input
                      type="text"
                      value={bioForm.flagshipGameUrl || ''}
                      onChange={(e) => setBioForm({ ...bioForm, flagshipGameUrl: e.target.value })}
                      placeholder="https://itch.io/... or Drive/Download URL"
                      className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1">
                      Download Button Text
                    </label>
                    <input
                      type="text"
                      value={bioForm.flagshipGameLabel || 'Download Playable Build'}
                      onChange={(e) => setBioForm({ ...bioForm, flagshipGameLabel: e.target.value })}
                      placeholder="Download Playable Build"
                      className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1">
                    Recorded Gameplay Video URL / Path
                  </label>
                  <input
                    type="text"
                    value={bioForm.flagshipVideoUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, flagshipVideoUrl: e.target.value })}
                    placeholder="Upload directly on the Latest Project video slot or paste MP4 URL"
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Game Specifications Editor */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Game Specifications &amp; Build Overview
                </span>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1">
                    Game Title / Specs Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.flagshipGameTitle || 'Game Specifications'}
                    onChange={(e) => setBioForm({ ...bioForm, flagshipGameTitle: e.target.value })}
                    placeholder="e.g. Project Name — Game Specifications"
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1">
                    About The Game &amp; Build Notes
                  </label>
                  <textarea
                    rows={4}
                    value={bioForm.flagshipGameSpecs || ''}
                    onChange={(e) => setBioForm({ ...bioForm, flagshipGameSpecs: e.target.value })}
                    placeholder="Add your game overview, core gameplay mechanics, controls, and build notes here..."
                    className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">
                      Technical Specification Rows
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBioForm({
                          ...bioForm,
                          flagshipSpecRows: [
                            ...(bioForm.flagshipSpecRows || [
                              { label: 'Engine', value: 'Unreal Engine 5' },
                              { label: 'Genre', value: 'To Be Updated' },
                              { label: 'Platform', value: 'Windows PC Build' },
                              { label: 'Status', value: 'Playable Build In Progress' }
                            ]),
                            { label: 'Spec', value: 'Value' }
                          ]
                        })
                      }
                      className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(bioForm.flagshipSpecRows || [
                      { label: 'Engine', value: 'Unreal Engine 5' },
                      { label: 'Genre', value: 'To Be Updated' },
                      { label: 'Platform', value: 'Windows PC Build' },
                      { label: 'Status', value: 'Playable Build In Progress' }
                    ]).map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => {
                            const curr = [...(bioForm.flagshipSpecRows || [
                              { label: 'Engine', value: 'Unreal Engine 5' },
                              { label: 'Genre', value: 'To Be Updated' },
                              { label: 'Platform', value: 'Windows PC Build' },
                              { label: 'Status', value: 'Playable Build In Progress' }
                            ])];
                            curr[idx] = { ...curr[idx], label: e.target.value };
                            setBioForm({ ...bioForm, flagshipSpecRows: curr });
                          }}
                          placeholder="Label"
                          className="col-span-4 px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-xs text-zinc-300 font-mono"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            const curr = [...(bioForm.flagshipSpecRows || [
                              { label: 'Engine', value: 'Unreal Engine 5' },
                              { label: 'Genre', value: 'To Be Updated' },
                              { label: 'Platform', value: 'Windows PC Build' },
                              { label: 'Status', value: 'Playable Build In Progress' }
                            ])];
                            curr[idx] = { ...curr[idx], value: e.target.value };
                            setBioForm({ ...bioForm, flagshipSpecRows: curr });
                          }}
                          placeholder="Value"
                          className="col-span-7 px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-xs text-white font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const curr = bioForm.flagshipSpecRows || [];
                            if (curr.length <= 1) return;
                            setBioForm({
                              ...bioForm,
                              flagshipSpecRows: curr.filter((_, i) => i !== idx)
                            });
                          }}
                          className="col-span-1 p-1.5 rounded bg-zinc-900 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 flex items-center justify-center cursor-pointer"
                          title="Remove spec row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Latest Project Changes</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: PROJECT EDIT */}
          {/* ======================================================== */}
          {activeTab === 'project' && (
            <form onSubmit={handleSaveProject} className="space-y-5">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                    {editingItem ? 'Edit Portfolio Project' : 'Create New Portfolio Project'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure project titles, cover photo, multi-image gallery, tags, and deep dive analysis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectForm.title || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    placeholder="e.g. Cyberpunk Alley Level"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={projectForm.category || 'game-design'}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value as ProjectCategory })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="game-design">Game Design</option>
                    <option value="3d-arts">3D Arts</option>
                    <option value="level-design">Level Design & Post-Process</option>
                    <option value="environment">Environment Art</option>
                    <option value="vehicle-rigging">Vehicle Rigging</option>
                    <option value="maya-3d">3D Modeling</option>
                    <option value="flagship-game">Flagship Game</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Short Summary / Tagline *
                </label>
                <input
                  type="text"
                  value={projectForm.summary || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
                  placeholder="One sentence summary for gallery cards"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Full Project Description
                </label>
                <textarea
                  rows={3}
                  value={projectForm.description || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Detailed breakdown of layout, mechanics, and design intentions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photos & Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Primary Thumbnail Photo URL / Path *
                  </label>
                  <input
                    type="text"
                    value={projectForm.thumbnail || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, thumbnail: e.target.value })}
                    placeholder="/showcase/gas-station-night.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Showreel Video Timestamp (Seconds)
                  </label>
                  <input
                    type="number"
                    value={projectForm.videoTimestamp ?? 0}
                    onChange={(e) => setProjectForm({ ...projectForm, videoTimestamp: Number(e.target.value) })}
                    placeholder="90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Gallery Photos (1 URL / Path per line)
                </label>
                <textarea
                  rows={2}
                  value={projectForm.galleryImages ? projectForm.galleryImages.join('\n') : ''}
                  onChange={(e) => setProjectForm({
                    ...projectForm,
                    galleryImages: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="/showcase/photo-1.jpg&#10;/showcase/photo-2.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              {/* Key Features & Tech */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Key Features (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={projectForm.keyFeatures ? projectForm.keyFeatures.join('\n') : ''}
                    onChange={(e) => setProjectForm({
                      ...projectForm,
                      keyFeatures: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Volumetric lighting passes&#10;Chaos suspension tuning"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Tech Stack Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={projectForm.techStack ? projectForm.techStack.join(', ') : ''}
                    onChange={(e) => setProjectForm({
                      ...projectForm,
                      techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Unreal Engine 5, Lumen, Niagara"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="flagship-checkbox"
                  checked={Boolean(projectForm.isFlagship)}
                  onChange={(e) => setProjectForm({ ...projectForm, isFlagship: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="flagship-checkbox" className="text-xs text-zinc-200 cursor-pointer">
                  Mark as Flagship Game Project (Feature in the dedicated RPG showcase banner)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Project Changes</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: CHAPTER EDIT */}
          {/* ======================================================== */}
          {activeTab === 'chapter' && (
            <form onSubmit={handleSaveChapter} className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  {editingItem ? 'Edit Video Reel Chapter' : 'Add New Reel Keyframe Chapter'}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  value={chapterForm.title || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  placeholder="e.g. New Temple (Upside Concept)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Subtitle / Scene Type
                </label>
                <input
                  type="text"
                  value={chapterForm.subtitle || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, subtitle: e.target.value })}
                  placeholder="e.g. Sacred Daytime Architecture"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Start Timestamp (Seconds) *
                  </label>
                  <input
                    type="number"
                    value={chapterForm.startTime ?? 0}
                    onChange={(e) => setChapterForm({ ...chapterForm, startTime: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    End Timestamp (Seconds)
                  </label>
                  <input
                    type="number"
                    value={chapterForm.endTime ?? 25}
                    onChange={(e) => setChapterForm({ ...chapterForm, endTime: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Thumbnail Image Path or URL
                </label>
                <input
                  type="text"
                  value={chapterForm.thumbnail || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, thumbnail: e.target.value })}
                  placeholder="/showcase/temple-upside.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={chapterForm.description || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Chapter</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: MAYA 3D MODEL */}
          {/* ======================================================== */}
          {activeTab === 'model' && (
            <form onSubmit={handleSaveModel} className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  {editingItem ? 'Edit Maya 3D Asset' : 'Add New Maya 3D Asset'}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Model Title *
                </label>
                <input
                  type="text"
                  value={modelForm.title || ''}
                  onChange={(e) => setModelForm({ ...modelForm, title: e.target.value })}
                  placeholder="e.g. Vintage Brass Gramophone"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Model Photo / Render Image URL or Path
                </label>
                <input
                  type="text"
                  value={modelForm.thumbnail || ''}
                  onChange={(e) => setModelForm({ ...modelForm, thumbnail: e.target.value })}
                  placeholder="/showcase/maya-models.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={modelForm.description || ''}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Software
                  </label>
                  <input
                    type="text"
                    value={modelForm.software || 'Autodesk Maya'}
                    onChange={(e) => setModelForm({ ...modelForm, software: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Topology
                  </label>
                  <input
                    type="text"
                    value={modelForm.specs?.topology || ''}
                    onChange={(e) => setModelForm({
                      ...modelForm,
                      specs: { ...modelForm.specs!, topology: e.target.value }
                    })}
                    placeholder="Quad-dominant mesh"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={modelForm.specs?.category || ''}
                    onChange={(e) => setModelForm({
                      ...modelForm,
                      specs: { ...modelForm.specs!, category: e.target.value }
                    })}
                    placeholder="Antique Prop / Vehicle"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Modeling Highlights (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={modelForm.details ? modelForm.details.join('\n') : ''}
                  onChange={(e) => setModelForm({
                    ...modelForm,
                    details: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save 3D Model</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: SKILLS & TOOLBELT */}
          {/* ======================================================== */}
          {activeTab === 'skills' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Skills, Toolbelt & Competencies updated!')} className="space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Technical Proficiency, Skill Bars & Competency Cards
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tweak percentages, toolbelt software tags, callouts, and 4 specialized disciplines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.proficiencyHeading || 'TECHNICAL PROFICIENCY'}
                    onChange={(e) => setBioForm({ ...bioForm, proficiencyHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Subheading
                  </label>
                  <input
                    type="text"
                    value={bioForm.proficiencySubheading || 'Unreal Engine 5 level blockouts, responsive player mechanics, Chaos vehicle physics, and Autodesk Maya 3D hard-surface art.'}
                    onChange={(e) => setBioForm({ ...bioForm, proficiencySubheading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              {/* Skill Bars */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Skill Percentage Sliders
                </span>
                <div className="space-y-3">
                  {skillsForm.map((skill, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => {
                            const next = [...skillsForm];
                            next[idx].name = e.target.value;
                            setSkillsForm(next);
                          }}
                          className="flex-1 bg-transparent border-b border-zinc-700 text-xs font-semibold text-white py-1"
                        />
                        <span className="font-mono text-xs text-amber-400 font-bold">{skill.pct}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={skill.pct}
                        onChange={(e) => {
                          const next = [...skillsForm];
                          next[idx].pct = Number(e.target.value);
                          setSkillsForm(next);
                        }}
                        className="w-full accent-amber-500"
                      />
                      <input
                        type="text"
                        value={skill.desc}
                        onChange={(e) => {
                          const next = [...skillsForm];
                          next[idx].desc = e.target.value;
                          setSkillsForm(next);
                        }}
                        placeholder="Discipline notes..."
                        className="w-full bg-transparent text-[11px] text-zinc-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Toolbelt & Software Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                />
              </div>

              {/* 4 Competency Cards */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  4 Specialized Competency Cards (Bottom of Proficiency Section)
                </span>
                <div className="space-y-3">
                  {(bioForm.proficiencyCompetencyCards || [
                    { title: 'Level Design & Flow', description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.', tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density'] },
                    { title: 'Vehicle Rigging & Physics', description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.', tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks'] },
                    { title: 'Autodesk Maya 3D', description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.', tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables'] },
                    { title: 'Unreal Engine 5 & Blueprints', description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.', tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer'] }
                  ]).map((card, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => {
                          const curr = [...(bioForm.proficiencyCompetencyCards || [
                            { title: 'Level Design & Flow', description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.', tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density'] },
                            { title: 'Vehicle Rigging & Physics', description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.', tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks'] },
                            { title: 'Autodesk Maya 3D', description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.', tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables'] },
                            { title: 'Unreal Engine 5 & Blueprints', description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.', tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer'] }
                          ])];
                          curr[idx] = { ...curr[idx], title: e.target.value };
                          setBioForm({ ...bioForm, proficiencyCompetencyCards: curr });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-white font-bold"
                      />
                      <textarea
                        rows={2}
                        value={card.description}
                        onChange={(e) => {
                          const curr = [...(bioForm.proficiencyCompetencyCards || [
                            { title: 'Level Design & Flow', description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.', tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density'] },
                            { title: 'Vehicle Rigging & Physics', description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.', tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks'] },
                            { title: 'Autodesk Maya 3D', description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.', tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables'] },
                            { title: 'Unreal Engine 5 & Blueprints', description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.', tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer'] }
                          ])];
                          curr[idx] = { ...curr[idx], description: e.target.value };
                          setBioForm({ ...bioForm, proficiencyCompetencyCards: curr });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-zinc-300"
                      />
                      <input
                        type="text"
                        value={card.tags.join(', ')}
                        onChange={(e) => {
                          const curr = [...(bioForm.proficiencyCompetencyCards || [
                            { title: 'Level Design & Flow', description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.', tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density'] },
                            { title: 'Vehicle Rigging & Physics', description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.', tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks'] },
                            { title: 'Autodesk Maya 3D', description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.', tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables'] },
                            { title: 'Unreal Engine 5 & Blueprints', description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.', tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer'] }
                          ])];
                          curr[idx] = { ...curr[idx], tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                          setBioForm({ ...bioForm, proficiencyCompetencyCards: curr });
                        }}
                        placeholder="Tags comma separated"
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-amber-400 font-mono text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Skills & Competencies</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: ABOUT & STILLS */}
          {/* ======================================================== */}
          {activeTab === 'about' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'About section & stills updated!')} className="space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  About Section, Quotes &amp; Design Pillars
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.aboutHeading || 'About ADHAVAN'}
                    onChange={(e) => setBioForm({ ...bioForm, aboutHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Subheading Tagline
                  </label>
                  <input
                    type="text"
                    value={bioForm.aboutSubheading || 'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.'}
                    onChange={(e) => setBioForm({ ...bioForm, aboutSubheading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Introduction Quote / Philosophy
                </label>
                <textarea
                  rows={3}
                  value={bioForm.aboutIntro || ''}
                  onChange={(e) => setBioForm({ ...bioForm, aboutIntro: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  Career Objective &amp; Studio Focus
                </label>
                <textarea
                  rows={3}
                  value={bioForm.aboutGoals || ''}
                  onChange={(e) => setBioForm({ ...bioForm, aboutGoals: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                />
              </div>

              {/* 3 Philosophy Pillars */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  3 Core Design Pillars
                </span>
                <div className="space-y-3">
                  {(bioForm.aboutPhilosophyCards || [
                    { title: 'Player-First Level Flow', description: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.' },
                    { title: 'Kinesthetic Feel & Movement', description: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.' },
                    { title: 'Cinematic Atmosphere', description: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.' }
                  ]).map((pillar, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => {
                          const curr = [...(bioForm.aboutPhilosophyCards || [
                            { title: 'Player-First Level Flow', description: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.' },
                            { title: 'Kinesthetic Feel & Movement', description: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.' },
                            { title: 'Cinematic Atmosphere', description: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.' }
                          ])];
                          curr[idx] = { ...curr[idx], title: e.target.value };
                          setBioForm({ ...bioForm, aboutPhilosophyCards: curr });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-white font-bold"
                      />
                      <textarea
                        rows={2}
                        value={pillar.description}
                        onChange={(e) => {
                          const curr = [...(bioForm.aboutPhilosophyCards || [
                            { title: 'Player-First Level Flow', description: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.' },
                            { title: 'Kinesthetic Feel & Movement', description: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.' },
                            { title: 'Cinematic Atmosphere', description: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.' }
                          ])];
                          curr[idx] = { ...curr[idx], description: e.target.value };
                          setBioForm({ ...bioForm, aboutPhilosophyCards: curr });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-zinc-700 text-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save About Section Changes</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: RESUME / CV */}
          {/* ======================================================== */}
          {activeTab === 'resume' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Resume settings & file updated!')} className="space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Upload Custom Downloadable Resume
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload your own PDF or DOCX resume file here so visitors can preview and download it on the Resume tab.
                </p>
              </div>

              {/* Custom Resume File Upload Box */}
              <div className="p-5 rounded-xl bg-zinc-900/70 border border-amber-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      {bioForm.resumePdfUrl ? 'Active Uploaded Resume' : 'No Resume Uploaded Yet'}
                    </span>
                    <p className="text-xs text-zinc-300 mt-0.5 font-mono">
                      {bioForm.resumePdfUrl
                        ? `${bioForm.resumeFileName || 'Resume.pdf'}${bioForm.resumeFileSize ? ` · ${bioForm.resumeFileSize}` : ''}`
                        : 'Select a PDF or DOCX resume file to enable downloads'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{bioForm.resumePdfUrl ? 'Replace File' : 'Upload Resume (PDF/DOCX)'}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = '';
                          try {
                            const uploaded = await uploadDocumentAsset(file);
                            const nextFields = {
                              resumePdfUrl: uploaded.url,
                              resumeFileName: uploaded.fileName,
                              resumeUploadDate: new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }),
                              resumeFileSize: uploaded.fileSize
                            };
                            setBioForm((prev) => ({ ...prev, ...nextFields }));
                            onSaveDesignerInfo(nextFields);
                            triggerSuccess(`Uploaded "${uploaded.fileName}" for visitors to download!`);
                          } catch (err) {
                            console.error('Resume upload failed:', err);
                          }
                        }}
                      />
                    </label>

                    {bioForm.resumePdfUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const cleared = {
                            resumePdfUrl: undefined,
                            resumeFileName: undefined,
                            resumeUploadDate: undefined,
                            resumeFileSize: undefined
                          };
                          setBioForm((prev) => ({ ...prev, ...cleared }));
                          onSaveDesignerInfo(cleared);
                          triggerSuccess('Uploaded resume removed.');
                        }}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/70 text-zinc-400 hover:text-red-400 border border-zinc-700 transition-colors cursor-pointer"
                        title="Remove uploaded resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Resume Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.resumeHeading || 'RESUME'}
                    onChange={(e) => setBioForm({ ...bioForm, resumeHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Resume Subtitle
                  </label>
                  <input
                    type="text"
                    value={bioForm.resumeSubheading || 'Download my custom resume document directly for studio roles and collaboration inquiries.'}
                    onChange={(e) => setBioForm({ ...bioForm, resumeSubheading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Resume Section Settings</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: CONTACT */}
          {/* ======================================================== */}
          {activeTab === 'contact' && (
            <form onSubmit={(e) => handleSaveBioGeneric(e, 'Contact details & social URLs updated!')} className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Direct Contact Information &amp; Social Platforms
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={bioForm.contactHeading || 'GET IN TOUCH'}
                    onChange={(e) => setBioForm({ ...bioForm, contactHeading: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Studio Availability Status
                  </label>
                  <input
                    type="text"
                    value={bioForm.status || ''}
                    onChange={(e) => setBioForm({ ...bioForm, status: e.target.value })}
                    placeholder="Open to Game Studio Roles & Freelance Design"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
                  Contact Subheading &amp; Message Statement *
                </label>
                <textarea
                  rows={2}
                  value={bioForm.contactSubheading !== undefined ? bioForm.contactSubheading : 'Interested in my game design work, level layouts, or vehicle mechanics? Let’s discuss studio positions, freelance inquiries, or creative collaborations.'}
                  onChange={(e) => setBioForm({ ...bioForm, contactSubheading: e.target.value })}
                  placeholder="e.g. Interested in my game design work..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/50 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={bioForm.email || ''}
                    onChange={(e) => setBioForm({ ...bioForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={bioForm.phone || ''}
                    onChange={(e) => setBioForm({ ...bioForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    ArtStation Profile URL
                  </label>
                  <input
                    type="text"
                    value={bioForm.artstationUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, artstationUrl: e.target.value })}
                    placeholder="https://artstation.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    LinkedIn Full URL
                  </label>
                  <input
                    type="text"
                    value={bioForm.linkedinUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    WhatsApp URL
                  </label>
                  <input
                    type="text"
                    value={bioForm.whatsappUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, whatsappUrl: e.target.value })}
                    placeholder="https://wa.me/918072647909"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={bioForm.instagramUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    value={bioForm.youtubeUrl || ''}
                    onChange={(e) => setBioForm({ ...bioForm, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/@..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Contact &amp; Social URLs</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: JSON BACKUP / RESTORE */}
          {/* ======================================================== */}
          {activeTab === 'json_backup' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Full Portfolio Backup & Restore (JSON)
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                  Download your entire portfolio configuration (projects, videos, 3D models, texts, photos) as a single JSON file, or restore from a backup.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadJsonFile}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download .json file</span>
                </button>
                <button
                  type="button"
                  onClick={copyJsonToClipboard}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{copiedJson ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError('');
                }}
                className="w-full p-3 font-mono text-[11px] bg-black border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500"
              />

              {jsonError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyJson}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import & Apply JSON Data</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
