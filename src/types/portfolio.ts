export type ProjectCategory = 
  | 'all' 
  | 'game-design'
  | '3d-arts'
  | 'level-design' 
  | 'environment' 
  | 'vehicle-rigging' 
  | 'maya-3d' 
  | 'flagship-game';

export interface VideoChapter {
  id: string;
  title: string;
  subtitle: string;
  startTime: number; // in seconds
  endTime: number;
  thumbnail: string;
  category: ProjectCategory;
  description: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  summary: string;
  description: string;
  keyFeatures: string[];
  techStack: string[];
  thumbnail: string;
  galleryImages: string[];
  videoTimestamp?: number; // seconds into video reel
  isFlagship?: boolean;
  conceptNotes?: {
    theme: string;
    lighting: string;
    mechanics: string;
    levelScale?: string;
  };
}

export interface MayaModelItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  software: string;
  details: string[];
  specs: {
    topology: string;
    textures: string;
    category: string;
  };
}

export interface DesignerSkill {
  name: string;
  pct: number;
  desc: string;
  category?: string;
  skill?: string;
}

export interface ResumeExperience {
  role: string;
  project: string;
  period: string;
  description: string;
  tools: string[];
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  year: string;
  details: string;
}

export interface HeroStatItem {
  number: string;
  label: string;
}

export interface PhilosophyCardItem {
  title: string;
  description: string;
}

export interface FlagshipFeatureCard {
  title: string;
  description: string;
}

export interface FlagshipScreenshotItem {
  title: string;
  subtitle: string;
  image: string;
}

export interface CompetencyCardItem {
  title: string;
  description: string;
  tags: string[];
}

export interface StillPhotoItem {
  title: string;
  label: string;
  image: string;
}

export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  period: string;
  description: string;
  status: 'completed' | 'current' | 'target';
  highlights?: string[];
  photoUrl?: string;
  photoCaption?: string;
}

export interface DesignerInfo {
  name: string;
  title: string;
  tagline: string;
  aboutIntro: string;
  aboutGoals: string;
  introQuote?: string;
  objectiveQuote?: string;
  email: string;
  phone: string;
  linkedin: string;
  linkedinUrl: string;
  artstationUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  status: string;
  skills: DesignerSkill[];
  tools: string[];
  resumeSummary?: string;
  resumeExperiences?: ResumeExperience[];
  resumeEducation?: ResumeEducation[];
  // Uploaded Custom Resume Document
  resumePdfUrl?: string;
  resumeFileName?: string;
  resumeUploadDate?: string;
  resumeFileSize?: string;
  // Career Objective Timeline Chart
  careerTimeline?: TimelineMilestone[];
  // Hero customizations
  heroPhotoUrl?: string;
  heroPhotoAlign?: {
    x: number;
    y: number;
    zoom: number;
    fit: 'cover' | 'contain';
  };
  heroEngineTags?: {
    engine: string;
    maya: string;
    focus: string;
  };
  heroStats?: HeroStatItem[];
  heroDisciplines?: string[];
  // Section Headings & Subheadings
  contactHeading?: string;
  contactSubheading?: string;
  contactBadge?: string;
  contactLocationNote?: string;
  contactInquiryOptions?: string[];
  contactSlidePhotoUrl?: string;
  heroBadge?: string;
  heroSubtitle?: string;
  proficiencyHeading?: string;
  proficiencySubheading?: string;
  proficiencyCalloutTitle?: string;
  proficiencyCalloutText?: string;
  proficiencyCompetencyCards?: CompetencyCardItem[];
  aboutHeading?: string;
  aboutSubheading?: string;
  aboutPhilosophyCards?: PhilosophyCardItem[];
  aboutReelStills?: StillPhotoItem[];
  aboutCalloutTitle?: string;
  aboutCalloutText?: string;
  resumeHeading?: string;
  resumeSubheading?: string;
  flagshipHeading?: string;
  flagshipQuote?: string;
  flagshipRoadmapQuote?: string;
  flagshipGameTitle?: string;
  flagshipGameSpecs?: string;
  flagshipSpecRows?: Array<{ label: string; value: string }>;
  flagshipGameUrl?: string;
  flagshipGameLabel?: string;
  flagshipVideoUrl?: string;
  flagshipFeatureCards?: FlagshipFeatureCard[];
  flagshipScreenshots?: FlagshipScreenshotItem[];
  reelHeading?: string;
  reelSubheading?: string;
  reelResolutionNote?: string;
  projectsHeading?: string;
  projectsSubheading?: string;
  mayaHeading?: string;
  mayaSubheading?: string;
  outroTitle?: string;
  outroText?: string;
}

export interface CustomMediaBlock {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  caption?: string;
}

export interface CustomSectionCard {
  id: string;
  title: string;
  description: string;
  tag?: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  linkLabel?: string;
}

export interface CustomSectionData {
  badge?: string;
  heading: string;
  subheading?: string;
  bodyText?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaItems?: CustomMediaBlock[];
  cards?: CustomSectionCard[];
  callToActionText?: string;
  callToActionLink?: string;
}

export type SectionTargetTab = 'hero' | 'projects' | 'about' | 'resume' | 'contact' | 'own';

export interface PortfolioSectionConfig {
  id: string; // 'hero' | 'reel' | 'flagship' | 'projects' | 'maya' | 'proficiency' | 'about' | 'resume' | 'contact' | or custom id
  title: string;
  label: string; // for navbar navigation
  enabled: boolean;
  order: number;
  targetTab?: SectionTargetTab;
  isCustom?: boolean;
  customData?: CustomSectionData;
}

export interface PortfolioState {
  designerInfo: DesignerInfo;
  videoPath: string;
  videoChapters: VideoChapter[];
  projects: ProjectItem[];
  mayaModels: MayaModelItem[];
  sections?: PortfolioSectionConfig[];
}

export interface PortfolioProfile {
  id: string;
  name: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  state: PortfolioState;
}

export interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  message?: string;
}

