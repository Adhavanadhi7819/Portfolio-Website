import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatVideoTime,
  findCurrentChapter,
  filterProjects,
  validateContactForm,
  calculatePortfolioStats,
  verifyOwnerPasscode,
  addProject,
  updateProject,
  deleteProject,
  addChapter,
  deleteChapter,
  exportPortfolioJson,
  importPortfolioJson,
  generatePlainTextResume,
  getActiveSections,
  toggleSectionVisibility,
  reorderSections,
  addCustomSection,
  removeSection,
  updateSectionConfig
} from './portfolioLogic';
import { VideoChapter, ProjectItem, PortfolioSectionConfig } from '../types/portfolio';

test('formatVideoTime formats seconds correctly into MM:SS', () => {
  assert.equal(formatVideoTime(0), '00:00');
  assert.equal(formatVideoTime(5), '00:05');
  assert.equal(formatVideoTime(65), '01:05');
  assert.equal(formatVideoTime(171), '02:51');
  assert.equal(formatVideoTime(292), '04:52');
  assert.equal(formatVideoTime(-10), '00:00');
  assert.equal(formatVideoTime(NaN), '00:00');
});

test('findCurrentChapter finds active chapter accurately based on timestamp', () => {
  const sampleChapters: VideoChapter[] = [
    {
      id: 'intro',
      title: 'Intro',
      subtitle: 'Overview',
      startTime: 0,
      endTime: 10,
      thumbnail: '',
      category: 'all',
      description: ''
    },
    {
      id: 'temple',
      title: 'Temple Concept',
      subtitle: 'Ancient Stone',
      startTime: 11,
      endTime: 32,
      thumbnail: '',
      category: 'environment',
      description: ''
    },
    {
      id: 'pirate',
      title: 'Pirate RPG',
      subtitle: 'Game Walkthrough',
      startTime: 171,
      endTime: 285,
      thumbnail: '',
      category: 'flagship-game',
      description: ''
    }
  ];

  assert.equal(findCurrentChapter(0, sampleChapters)?.id, 'intro');
  assert.equal(findCurrentChapter(5, sampleChapters)?.id, 'intro');
  assert.equal(findCurrentChapter(11, sampleChapters)?.id, 'temple');
  assert.equal(findCurrentChapter(25, sampleChapters)?.id, 'temple');
  assert.equal(findCurrentChapter(200, sampleChapters)?.id, 'pirate');
  assert.equal(findCurrentChapter(300, sampleChapters)?.id, 'pirate');
});

test('filterProjects filters by category or returns all', () => {
  const dummyProjects: ProjectItem[] = [
    {
      id: 'p1',
      title: 'Temple',
      category: 'environment',
      categoryLabel: 'Environment Art',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: []
    },
    {
      id: 'p2',
      title: 'Car Drift',
      category: 'vehicle-rigging',
      categoryLabel: 'Vehicle Rigging',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: []
    },
    {
      id: 'p3',
      title: 'Pirate Game',
      category: 'flagship-game',
      categoryLabel: 'Flagship Game',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: [],
      isFlagship: true
    }
  ];

  assert.equal(filterProjects(dummyProjects, 'all').length, 3);
  assert.equal(filterProjects(dummyProjects, 'game-design').length, 2);
  assert.equal(filterProjects(dummyProjects, '3d-arts').length, 1);
  assert.equal(filterProjects(dummyProjects, 'environment').length, 1);
  assert.equal(filterProjects(dummyProjects, 'environment')[0].id, 'p1');
  assert.equal(filterProjects(dummyProjects, 'vehicle-rigging').length, 1);
  assert.equal(filterProjects(dummyProjects, 'flagship-game').length, 1);
  assert.equal(filterProjects(dummyProjects, 'maya-3d').length, 0);
});

test('validateContactForm checks required fields and formats', () => {
  // Empty form
  const emptyRes = validateContactForm({
    name: '',
    email: '',
    projectType: 'Game Studio Position',
    message: ''
  });
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.name);
  assert.ok(emptyRes.errors.email);
  assert.ok(emptyRes.errors.message);

  // Invalid email
  const invalidEmailRes = validateContactForm({
    name: 'Producer Alex',
    email: 'not-an-email',
    projectType: 'Game Studio Position',
    message: 'Hello Adhavan, we loved your Unreal Engine showcase reel!'
  });
  assert.equal(invalidEmailRes.isValid, false);
  assert.ok(invalidEmailRes.errors.email);

  // Valid form
  const validRes = validateContactForm({
    name: 'Lead Producer Sarah',
    email: 'sarah@epicgames.example',
    projectType: 'Game Studio Position',
    message: 'We are impressed by your Unreal Engine 5 level design and vehicle rigging work. Would love to connect!'
  });
  assert.equal(validRes.isValid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test('calculatePortfolioStats computes correct aggregates', () => {
  const dummyProjects: ProjectItem[] = [
    {
      id: 'p1',
      title: 'A',
      category: 'environment',
      categoryLabel: '',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: []
    },
    {
      id: 'p2',
      title: 'B',
      category: 'level-design',
      categoryLabel: '',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: []
    },
    {
      id: 'p3',
      title: 'C',
      category: 'flagship-game',
      categoryLabel: '',
      summary: '',
      description: '',
      keyFeatures: [],
      techStack: [],
      thumbnail: '',
      galleryImages: [],
      isFlagship: true
    }
  ];

  const stats = calculatePortfolioStats(dummyProjects);
  assert.equal(stats.totalProjects, 3);
  assert.equal(stats.categoriesCount, 3);
  assert.equal(stats.flagshipCount, 1);
});

test('verifyOwnerPasscode accurately checks owner password', () => {
  assert.equal(verifyOwnerPasscode('906', '906'), true);
  assert.equal(verifyOwnerPasscode(' 906 ', '906'), true);
  assert.equal(verifyOwnerPasscode('ADHAVAN', 'adhavan'), true);
  assert.equal(verifyOwnerPasscode('wrong-code', '906'), false);
  assert.equal(verifyOwnerPasscode('', '906'), false);
  assert.equal(verifyOwnerPasscode('906', ''), false);
});

test('addProject, updateProject, and deleteProject correctly mutate state', () => {
  const initialProjects: ProjectItem[] = [
    {
      id: 'proj-1',
      title: 'Gas Station',
      category: 'level-design',
      categoryLabel: 'Level Design',
      summary: 'Night scene',
      description: 'Full desc',
      keyFeatures: [],
      techStack: ['Unreal Engine'],
      thumbnail: '/showcase/gas-station-night.jpg',
      galleryImages: []
    }
  ];

  // Add project
  const newProj: ProjectItem = {
    id: 'proj-2',
    title: 'Cyberpunk Alley',
    category: 'environment',
    categoryLabel: 'Environment Art',
    summary: 'Neon alley',
    description: 'Cyberpunk level',
    keyFeatures: ['Volumetric fog'],
    techStack: ['Unreal Engine 5'],
    thumbnail: '/showcase/hero-adhavan.jpg',
    galleryImages: []
  };

  const withAdded = addProject(initialProjects, newProj);
  assert.equal(withAdded.length, 2);
  assert.equal(withAdded[0].id, 'proj-2');

  // Update project
  const updated = updateProject(withAdded, {
    ...newProj,
    title: 'Cyberpunk Alley Remastered'
  });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].title, 'Cyberpunk Alley Remastered');

  // Delete project
  const withDeleted = deleteProject(updated, 'proj-1');
  assert.equal(withDeleted.length, 1);
  assert.equal(withDeleted[0].id, 'proj-2');
});

test('chapter and maya model mutations work properly', () => {
  const chapters: VideoChapter[] = [
    { id: 'c1', title: 'Intro', subtitle: '', startTime: 0, endTime: 10, thumbnail: '', category: 'all', description: '' },
    { id: 'c2', title: 'Temple', subtitle: '', startTime: 15, endTime: 30, thumbnail: '', category: 'environment', description: '' }
  ];

  const newCh: VideoChapter = {
    id: 'c3',
    title: 'Interlude',
    subtitle: '',
    startTime: 10,
    endTime: 15,
    thumbnail: '',
    category: 'all',
    description: ''
  };

  const sortedChapters = addChapter(chapters, newCh);
  assert.equal(sortedChapters.length, 3);
  assert.equal(sortedChapters[1].id, 'c3'); // correctly sorted by startTime

  const deletedChapters = deleteChapter(sortedChapters, 'c2');
  assert.equal(deletedChapters.length, 2);
});

test('exportPortfolioJson and importPortfolioJson round-trip validation', () => {
  const validState = {
    designerInfo: { name: 'Adhavan' },
    projects: [{ id: 'p1', title: 'Test Project' }]
  };

  const jsonStr = exportPortfolioJson(validState);
  assert.ok(jsonStr.includes('Adhavan'));

  const importResult = importPortfolioJson(jsonStr);
  assert.equal(importResult.isValid, true);
  assert.equal(importResult.state?.designerInfo?.name, 'Adhavan');

  // Invalid JSON
  const invalidJsonResult = importPortfolioJson('{ bad json string ');
  assert.equal(invalidJsonResult.isValid, false);
  assert.ok(invalidJsonResult.error);

  // Missing required arrays
  const missingProjectsResult = importPortfolioJson(JSON.stringify({ designerInfo: {} }));
  assert.equal(missingProjectsResult.isValid, false);
});

test('generatePlainTextResume produces complete text CV with sections', () => {
  const dummyInfo = {
    name: 'Adhavan',
    title: 'Game Designer',
    email: 'prabuprabu906@gmail.com',
    phone: '8072647909',
    linkedin: 'Adhavan P',
    linkedinUrl: 'https://www.linkedin.com/in/adhavan-p',
    status: 'Open to Roles',
    aboutGoals: 'Passionate UE5 developer',
    skills: [{ name: 'Unreal Engine 5', pct: 90, desc: 'Lumen & Nanite' }],
    tools: ['Unreal Engine 5', 'Maya'],
    resumeExperiences: [
      {
        role: 'Lead Game Designer',
        project: 'Stylized Pirate RPG',
        period: '2024',
        description: 'Locomotion and port village layout.',
        tools: ['Unreal Engine 5']
      }
    ],
    resumeEducation: [
      {
        degree: 'Game Design',
        institution: 'University',
        year: '2022',
        details: 'Specialization in level design'
      }
    ]
  };

  const textResume = generatePlainTextResume(dummyInfo);
  assert.ok(textResume.includes('ADHAVAN'));
  assert.ok(textResume.includes('prabuprabu906@gmail.com'));
  assert.ok(textResume.includes('Unreal Engine 5'));
  assert.ok(textResume.includes('Stylized Pirate RPG'));
  assert.ok(textResume.includes('EDUCATION & TRAINING'));
});

test('section management functions toggle, reorder, add, and remove properly', () => {
  const initialSections: PortfolioSectionConfig[] = [
    { id: 'hero', title: 'Hero', label: 'Home', enabled: true, order: 0 },
    { id: 'reel', title: 'Reel', label: 'Showreel', enabled: true, order: 1 },
    { id: 'projects', title: 'Projects', label: 'Projects', enabled: true, order: 2 }
  ];

  // 1. getActiveSections
  assert.equal(getActiveSections(initialSections).length, 3);

  // 2. toggleSectionVisibility
  const toggled = toggleSectionVisibility(initialSections, 'reel', false);
  assert.equal(toggled.find(s => s.id === 'reel')?.enabled, false);
  assert.equal(getActiveSections(toggled).length, 2);

  // 3. reorderSections
  const reordered = reorderSections(initialSections, 'projects', 'up');
  const activeReordered = getActiveSections(reordered);
  assert.equal(activeReordered[1].id, 'projects');
  assert.equal(activeReordered[2].id, 'reel');

  // 4. addCustomSection
  const customSection: PortfolioSectionConfig = {
    id: 'custom_devlog',
    title: 'Devlog & Lore',
    label: 'Devlog',
    enabled: true,
    order: 3,
    isCustom: true,
    customData: {
      heading: 'Behind The Scenes',
      subheading: 'Level Design Breakdown',
      bodyText: 'Notes on lighting and locomotion physics'
    }
  };
  const added = addCustomSection(initialSections, customSection);
  assert.equal(added.length, 4);
  assert.equal(added[3].id, 'custom_devlog');
  assert.equal(added[3].isCustom, true);

  // 5. updateSectionConfig
  const updated = updateSectionConfig(added, 'custom_devlog', { title: 'Updated Devlog' });
  assert.equal(updated.find(s => s.id === 'custom_devlog')?.title, 'Updated Devlog');

  // 6. removeSection (custom vs core)
  // Removing custom permanently deletes it
  const withoutCustom = removeSection(updated, 'custom_devlog');
  assert.equal(withoutCustom.length, 3);
  assert.equal(withoutCustom.some(s => s.id === 'custom_devlog'), false);

  // Removing core section disables it
  const disabledCore = removeSection(withoutCustom, 'hero');
  assert.equal(disabledCore.find(s => s.id === 'hero')?.enabled, false);
});


