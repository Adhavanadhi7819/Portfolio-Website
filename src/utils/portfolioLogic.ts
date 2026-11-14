import { ProjectItem, ProjectCategory, VideoChapter, MayaModelItem, ContactFormData, ContactFormErrors, PortfolioSectionConfig } from '../types/portfolio';

/**
 * Format raw seconds into MM:SS format
 */
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Find the chapter matching the given playback timestamp
 */
export function findCurrentChapter(currentTime: number, chapters: VideoChapter[]): VideoChapter | undefined {
  if (!chapters || chapters.length === 0) return undefined;
  
  // Find chapter whose range covers currentTime
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].startTime) {
      return chapters[i];
    }
  }
  return chapters[0];
}

/**
 * Filter projects by category
 */
export function filterProjects(projects: ProjectItem[], category: ProjectCategory): ProjectItem[] {
  if (!projects) return [];
  if (category === 'all') return projects;
  if (category === 'game-design') {
    return projects.filter(item =>
      item.category === 'game-design' ||
      item.category === 'flagship-game' ||
      item.category === 'level-design' ||
      item.category === 'vehicle-rigging'
    );
  }
  if (category === '3d-arts') {
    return projects.filter(item =>
      item.category === '3d-arts' ||
      item.category === 'environment' ||
      item.category === 'maya-3d'
    );
  }
  return projects.filter(item => item.category === category);
}

/**
 * Validate contact form inputs
 */
export function validateContactForm(data: ContactFormData): { isValid: boolean; errors: ContactFormErrors } {
  const errors: ContactFormErrors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Please enter your name';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Please enter your email address';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.message = 'Please include a message or inquiry details';
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Compute aggregate statistics for the game designer's portfolio
 */
export function calculatePortfolioStats(projects: ProjectItem[]): {
  totalProjects: number;
  categoriesCount: number;
  flagshipCount: number;
} {
  if (!projects || projects.length === 0) {
    return { totalProjects: 0, categoriesCount: 0, flagshipCount: 0 };
  }

  const uniqueCategories = new Set(projects.map(p => p.category));
  const flagshipCount = projects.filter(p => p.isFlagship).length;

  return {
    totalProjects: projects.length,
    categoriesCount: uniqueCategories.size,
    flagshipCount
  };
}

/**
 * Owner Authentication: Verifies passcode match (case-insensitive and trimmed)
 */
export function verifyOwnerPasscode(inputPasscode: string, targetPasscode: string): boolean {
  if (!inputPasscode || !targetPasscode) return false;
  return inputPasscode.trim().toLowerCase() === targetPasscode.trim().toLowerCase();
}

/**
 * Validate required fields for a project item
 */
export function validateProjectData(project: Partial<ProjectItem>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!project.title || project.title.trim().length === 0) {
    errors.title = 'Project title is required';
  }

  if (!project.summary || project.summary.trim().length === 0) {
    errors.summary = 'Short project summary is required';
  }

  if (!project.category) {
    errors.category = 'Project category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Add a new project to the front of the list
 */
export function addProject(projects: ProjectItem[], newProject: ProjectItem): ProjectItem[] {
  return [newProject, ...projects];
}

/**
 * Update an existing project in the list
 */
export function updateProject(projects: ProjectItem[], updatedProject: ProjectItem): ProjectItem[] {
  return projects.map(p => p.id === updatedProject.id ? updatedProject : p);
}

/**
 * Delete a project by ID
 */
export function deleteProject(projects: ProjectItem[], projectId: string): ProjectItem[] {
  return projects.filter(p => p.id !== projectId);
}

/**
 * Add or update chapter in the chapters list, sorted by startTime
 */
export function addChapter(chapters: VideoChapter[], newChapter: VideoChapter): VideoChapter[] {
  const next = [...chapters, newChapter];
  return next.sort((a, b) => a.startTime - b.startTime);
}

export function updateChapter(chapters: VideoChapter[], updatedChapter: VideoChapter): VideoChapter[] {
  const next = chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c);
  return next.sort((a, b) => a.startTime - b.startTime);
}

export function deleteChapter(chapters: VideoChapter[], chapterId: string): VideoChapter[] {
  return chapters.filter(c => c.id !== chapterId);
}

/**
 * Maya 3D models mutations
 */
export function addMayaModel(models: MayaModelItem[], newModel: MayaModelItem): MayaModelItem[] {
  return [...models, newModel];
}

export function updateMayaModel(models: MayaModelItem[], updatedModel: MayaModelItem): MayaModelItem[] {
  return models.map(m => m.id === updatedModel.id ? updatedModel : m);
}

export function deleteMayaModel(models: MayaModelItem[], modelId: string): MayaModelItem[] {
  return models.filter(m => m.id !== modelId);
}

/**
 * Export portfolio state to JSON string
 */
export function exportPortfolioJson(state: any): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Safely parse and import portfolio state from JSON string
 */
export function importPortfolioJson(jsonString: string): { isValid: boolean; state?: any; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Uploaded JSON is empty or not an object.' };
    }
    if (!parsed.projects || !Array.isArray(parsed.projects)) {
      return { isValid: false, error: 'Missing projects list in portfolio JSON.' };
    }
    if (!parsed.designerInfo || typeof parsed.designerInfo !== 'object') {
      return { isValid: false, error: 'Missing designer info in portfolio JSON.' };
    }
    return { isValid: true, state: parsed };
  } catch (err: any) {
    return { isValid: false, error: 'Invalid JSON format: ' + (err?.message || 'Parse error') };
  }
}

/**
 * Generate formatted plain text resume for clipboard copy or plain text downloads
 */
export function generatePlainTextResume(info: any): string {
  if (!info) return '';
  const skillsList = (info.skills || []).map((s: any) => `• ${s.name || s.skill}: ${s.pct}% - ${s.desc}`).join('\n');
  const toolsList = (info.tools || []).join(', ');
  const experiencesList = (info.resumeExperiences || []).map((exp: any) => 
    `• ${exp.role} — ${exp.project} (${exp.period})\n  ${exp.description}\n  Tools: ${(exp.tools || []).join(', ')}`
  ).join('\n\n');
  const educationList = (info.resumeEducation || []).map((edu: any) => 
    `• ${edu.degree} — ${edu.institution} (${edu.year})\n  ${edu.details}`
  ).join('\n\n');

  return `=====================================================
${(info.name || 'ADHAVAN').toUpperCase()} — ${(info.title || 'GAME DESIGNER').toUpperCase()}
Email: ${info.email || ''} | Phone: ${info.phone || ''}
LinkedIn: ${info.linkedin || ''} (${info.linkedinUrl || ''})
Status: ${info.status || ''}
=====================================================

EXECUTIVE SUMMARY
${info.resumeSummary || info.aboutGoals || info.aboutIntro || ''}

CORE DISCIPLINES & SKILLS
${skillsList}

SOFTWARE & TOOLS
${toolsList}

PROJECT EXPERIENCE & PORTFOLIO HIGHLIGHTS
${experiencesList}

EDUCATION & TRAINING
${educationList}
`;
}

/**
 * Filter sections to only those currently active/enabled, sorted by order
 */
export function getActiveSections(sections: PortfolioSectionConfig[]): PortfolioSectionConfig[] {
  if (!sections) return [];
  return [...sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Toggle visibility of a section (enable or disable)
 */
export function toggleSectionVisibility(
  sections: PortfolioSectionConfig[], 
  sectionId: string, 
  enabled: boolean
): PortfolioSectionConfig[] {
  if (!sections) return [];
  return sections.map(s => s.id === sectionId ? { ...s, enabled } : s);
}

/**
 * Reorder a section up or down in the section flow
 */
export function reorderSections(
  sections: PortfolioSectionConfig[], 
  sectionId: string, 
  direction: 'up' | 'down'
): PortfolioSectionConfig[] {
  if (!sections) return [];
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex(s => s.id === sectionId);
  if (index === -1) return sections;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) return sections;

  // Swap orders
  const currentItem = sorted[index];
  const targetItem = sorted[targetIndex];
  const currentOrder = currentItem.order;
  const targetOrder = targetItem.order;

  return sections.map(s => {
    if (s.id === currentItem.id) return { ...s, order: targetOrder };
    if (s.id === targetItem.id) return { ...s, order: currentOrder };
    return s;
  });
}

/**
 * Add a new custom section to the portfolio
 */
export function addCustomSection(
  sections: PortfolioSectionConfig[], 
  newSection: PortfolioSectionConfig,
  insertAfterId?: string
): PortfolioSectionConfig[] {
  const current = sections || [];
  if (!insertAfterId) {
    const maxOrder = current.reduce((max, s) => Math.max(max, s.order), 0);
    return [...current, { ...newSection, order: maxOrder + 1, isCustom: true }];
  }

  // Insert right after the specified section ID
  const sorted = [...current].sort((a, b) => a.order - b.order);
  const targetIdx = sorted.findIndex(s => s.id === insertAfterId);
  if (targetIdx === -1) {
    return addCustomSection(current, newSection);
  }

  const result: PortfolioSectionConfig[] = [];
  let orderIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    result.push({ ...sorted[i], order: orderIndex++ });
    if (i === targetIdx) {
      result.push({ ...newSection, order: orderIndex++, isCustom: true });
    }
  }
  return result;
}

/**
 * Remove a custom section permanently, or disable a built-in section
 */
export function removeSection(
  sections: PortfolioSectionConfig[], 
  sectionId: string
): PortfolioSectionConfig[] {
  if (!sections) return [];
  const target = sections.find(s => s.id === sectionId);
  if (!target) return sections;

  // If custom, completely remove from array; if core section, disable it
  if (target.isCustom) {
    return sections.filter(s => s.id !== sectionId);
  }
  return sections.map(s => s.id === sectionId ? { ...s, enabled: false } : s);
}

/**
 * Update an existing section configuration (title, label, customData, etc.)
 */
export function updateSectionConfig(
  sections: PortfolioSectionConfig[], 
  sectionId: string, 
  updates: Partial<PortfolioSectionConfig>
): PortfolioSectionConfig[] {
  if (!sections) return [];
  return sections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
}

/**
 * Resolve which navigation tab a section belongs to
 */
export function getSectionTargetTab(section: PortfolioSectionConfig): string {
  if (section.targetTab) {
    return section.targetTab === 'own' ? section.id : section.targetTab;
  }
  switch (section.id) {
    case 'hero':
      return 'hero';
    case 'flagship':
    case 'reel':
    case 'projects':
    case 'maya':
      return 'projects';
    case 'about':
    case 'proficiency':
      return 'about';
    case 'resume':
      return 'resume';
    case 'contact':
      return 'contact';
    default:
      return section.id;
  }
}

/**
 * Move any section to a specific tab ('hero' | 'projects' | 'about' | 'resume' | 'contact' | 'own')
 */
export function moveSectionToTab(
  sections: PortfolioSectionConfig[],
  sectionId: string,
  targetTab: 'hero' | 'projects' | 'about' | 'resume' | 'contact' | 'own'
): PortfolioSectionConfig[] {
  if (!sections) return [];
  return sections.map(s => (s.id === sectionId ? { ...s, targetTab } : s));
}

/**
 * Reorder sections after drag-and-drop of a subset (or full list) of IDs, auto-aligning order indices
 */
export function applyDraggedSectionOrder(
  sections: PortfolioSectionConfig[],
  draggedSubsetIds: string[]
): PortfolioSectionConfig[] {
  if (!sections || draggedSubsetIds.length === 0) return sections || [];
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const subsetSet = new Set(draggedSubsetIds);
  const byId = new Map(sorted.map(s => [s.id, s]));

  let subsetPointer = 0;
  const result = sorted.map(sec => {
    if (!subsetSet.has(sec.id)) return sec;
    const replacementId = draggedSubsetIds[subsetPointer++];
    return byId.get(replacementId) || sec;
  });

  return result.map((sec, idx) => ({ ...sec, order: idx }));
}

