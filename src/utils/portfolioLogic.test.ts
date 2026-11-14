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
  updateSectionConfig,
  getSectionTargetTab,
  moveSectionToTab,
  applyDraggedSectionOrder
} from './portfolioLogic';
import { VideoChapter, ProjectItem, PortfolioSectionConfig } from '../types/portfolio';
import {
  buildOtpAuthUri,
  generateTotpCode,
  verifyTotpCode,
  OWNER_TOTP_SECRET
} from './totp';

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

test('TOTP 2FA authenticator generates and verifies standard RFC 6238 6-digit codes', async () => {
  // Official RFC 6238 SHA-1 test secret ("12345678901234567890" in Base32) at T = 59s -> last 6 digits of 94287082 = "287082"
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const rfcCode = await generateTotpCode(rfcSecret, 59_000);
  assert.equal(rfcCode, '287082');

  const nowMs = Date.now();
  const validCode = await generateTotpCode(OWNER_TOTP_SECRET, nowMs);
  assert.equal(validCode.length, 6);
  assert.equal(await verifyTotpCode(OWNER_TOTP_SECRET, validCode, nowMs), true);
  assert.equal(await verifyTotpCode(OWNER_TOTP_SECRET, '000000', nowMs), validCode === '000000');
  assert.equal(await verifyTotpCode(OWNER_TOTP_SECRET, '12345', nowMs), false);

  const uri = buildOtpAuthUri(OWNER_TOTP_SECRET);
  assert.ok(uri.startsWith('otpauth://totp/'));
  assert.ok(uri.includes(`secret=${OWNER_TOTP_SECRET}`));
  assert.ok(uri.includes('digits=6'));
});

test('data.json exists at repository root and contains complete portfolio schema', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const raw = fs.readFileSync(path.resolve(process.cwd(), 'data.json'), 'utf8');
  const parsed = JSON.parse(raw);

  assert.equal(parsed.initialized, true);
  assert.ok(Array.isArray(parsed.portfolios) && parsed.portfolios.length >= 1);
  const mainState = parsed.portfolios[0].state;
  assert.ok(mainState.designerInfo);
  assert.ok(mainState.designerInfo.name);
  assert.ok(Array.isArray(mainState.designerInfo.skills) && mainState.designerInfo.skills.length > 0);
  assert.ok(Array.isArray(mainState.projects) && mainState.projects.length > 0);
  assert.ok(Array.isArray(mainState.videoChapters) && mainState.videoChapters.length > 0);
});

test('Admin PIN validation, session token signing, and bundle normalization work securely', async () => {
  const {
    verifyAdminPinValue,
    createAdminSessionToken,
    verifyAdminSessionToken,
    normalizeIncomingBundle
  } = await import('../../api/update-portfolio');

  assert.equal(verifyAdminPinValue('906'), true);
  assert.equal(verifyAdminPinValue('wrong-pin'), false);

  const token = createAdminSessionToken();
  assert.equal(verifyAdminSessionToken(token), true);
  assert.equal(verifyAdminSessionToken(`${token}tampered`), false);
  assert.equal(verifyAdminSessionToken(undefined), false);

  const normalized = normalizeIncomingBundle(
    {
      activePortfolioId: 'default_portfolio',
      portfolios: [{ id: 'default_portfolio', name: 'Test', subtitle: '', createdAt: '', updatedAt: '', state: {} }]
    },
    3
  );
  assert.ok(normalized);
  assert.equal(normalized.initialized, true);
  assert.equal(normalized.version, 4);
  assert.equal(normalized.portfolios.length, 1);
});

test('commitGitHubDataJson commits base64 data.json via GitHub Contents API and retries on 409 SHA conflict', async () => {
  const { commitGitHubDataJson, fetchGitHubDataJson } = await import('../../api/update-portfolio');

  const prevToken = process.env.GITHUB_TOKEN;
  const prevOwner = process.env.GITHUB_OWNER;
  const prevRepo = process.env.GITHUB_REPO;
  const prevBranch = process.env.GITHUB_BRANCH;
  const prevFetch = globalThis.fetch;

  process.env.GITHUB_TOKEN = 'ghp_test_secret_token';
  process.env.GITHUB_OWNER = 'adhavan-test';
  process.env.GITHUB_REPO = 'hey-adhavan-test';
  process.env.GITHUB_BRANCH = 'main';

  const calls: Array<{ url: string; method: string; auth?: string; body?: string }> = [];
  let putAttempt = 0;

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();
    const headers = (init?.headers || {}) as Record<string, string>;
    calls.push({
      url,
      method,
      auth: headers.Authorization,
      body: typeof init?.body === 'string' ? init.body : undefined
    });

    if (method === 'GET') {
      const sampleBundle = {
        initialized: true,
        version: 1,
        updatedAt: '2026-11-14T00:00:00.000Z',
        activePortfolioId: 'default_portfolio',
        portfolios: [{ id: 'default_portfolio', name: 'Test', subtitle: '', createdAt: '', updatedAt: '', state: {} }]
      };
      return new Response(
        JSON.stringify({
          sha: putAttempt === 0 ? 'sha_stale' : 'sha_fresh',
          html_url: 'https://github.com/adhavan-test/hey-adhavan-test/blob/main/data.json',
          content: Buffer.from(JSON.stringify(sampleBundle), 'utf8').toString('base64')
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    putAttempt += 1;
    if (putAttempt === 1) {
      return new Response(
        JSON.stringify({ message: 'data.json does not match sha' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        commit: {
          sha: 'abc1234deadbeef',
          html_url: 'https://github.com/adhavan-test/hey-adhavan-test/commit/abc1234deadbeef'
        },
        content: { sha: 'sha_new_committed' }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  try {
    const fetched = await fetchGitHubDataJson();
    assert.equal(fetched.exists, true);
    assert.equal(fetched.sha, 'sha_stale');
    assert.equal(fetched.data?.version, 1);

    const result = await commitGitHubDataJson({
      bundle: {
        initialized: true,
        version: 2,
        updatedAt: '2026-11-14T01:00:00.000Z',
        activePortfolioId: 'default_portfolio',
        portfolios: [{ id: 'default_portfolio', name: 'Updated', subtitle: '', createdAt: '', updatedAt: '', state: {} }]
      },
      commitMessage: 'chore: test commit'
    });

    assert.equal(result.commitSha, 'abc1234deadbeef');
    assert.equal(result.branch, 'main');
    assert.equal(result.repoFullName, 'adhavan-test/hey-adhavan-test');
    assert.equal(putAttempt, 2);

    const finalPut = calls.filter((c) => c.method === 'PUT')[1];
    assert.equal(finalPut.auth, 'Bearer ghp_test_secret_token');
    const parsedPutBody = JSON.parse(finalPut.body || '{}') as { sha?: string; message?: string; branch?: string; content?: string };
    assert.equal(parsedPutBody.sha, 'sha_fresh');
    assert.equal(parsedPutBody.message, 'chore: test commit');
    assert.equal(parsedPutBody.branch, 'main');
    const decodedJson = JSON.parse(Buffer.from(parsedPutBody.content || '', 'base64').toString('utf8'));
    assert.equal(decodedJson.version, 2);
  } finally {
    globalThis.fetch = prevFetch;
    if (prevToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevToken;
    if (prevOwner === undefined) delete process.env.GITHUB_OWNER;
    else process.env.GITHUB_OWNER = prevOwner;
    if (prevRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = prevRepo;
    if (prevBranch === undefined) delete process.env.GITHUB_BRANCH;
    else process.env.GITHUB_BRANCH = prevBranch;
  }
});

test('getGitHubConfigStatus auto-detects owner, repo, and branch from Vercel System Environment Variables', async () => {
  const { getGitHubConfigStatus } = await import('../../api/update-portfolio');

  const prev = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH,
    VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER,
    VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF
  };

  try {
    process.env.GITHUB_TOKEN = 'ghp_server_only_token';
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
    delete process.env.GITHUB_BRANCH;
    process.env.VERCEL_GIT_REPO_OWNER = 'adhavan7819';
    process.env.VERCEL_GIT_REPO_SLUG = 'hey-adhavan';
    process.env.VERCEL_GIT_COMMIT_REF = 'main';

    const status = getGitHubConfigStatus();
    assert.equal(status.githubConfigured, true);
    assert.equal(status.canPullFromGitHub, true);
    assert.equal(status.hasToken, true);
    assert.equal(status.hasOwner, true);
    assert.equal(status.hasRepo, true);
    assert.equal(status.owner, 'adhavan7819');
    assert.equal(status.repo, 'hey-adhavan');
    assert.equal(status.branch, 'main');
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('isRemoteNewerThanLocal compares versions and timestamps safely and defaults to Adhavanadhi7819/Portfolio-Website for pull', async () => {
  const { getGitHubConfigStatus, isRemoteNewerThanLocal } = await import('../../api/update-portfolio');

  const prevToken = process.env.GITHUB_TOKEN;
  const prevOwner = process.env.GITHUB_OWNER;
  const prevRepo = process.env.GITHUB_REPO;

  try {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;

    const status = getGitHubConfigStatus();
    assert.equal(status.githubConfigured, false);
    assert.equal(status.canPullFromGitHub, true);
    assert.equal(status.owner, 'Adhavanadhi7819');
    assert.equal(status.repo, 'Portfolio-Website');

    const base = {
      initialized: true,
      version: 3,
      updatedAt: '2026-11-14T17:00:00.000Z',
      activePortfolioId: 'default_portfolio',
      portfolios: []
    };

    assert.equal(isRemoteNewerThanLocal({ ...base, version: 4 }, base), true);
    assert.equal(isRemoteNewerThanLocal({ ...base, version: 2 }, base), false);
    assert.equal(
      isRemoteNewerThanLocal({ ...base, updatedAt: '2026-11-14T17:05:00.000Z' }, base),
      true
    );
    assert.equal(
      isRemoteNewerThanLocal({ ...base, updatedAt: '2026-11-14T16:55:00.000Z' }, base),
      false
    );
  } finally {
    if (prevToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevToken;
    if (prevOwner === undefined) delete process.env.GITHUB_OWNER;
    else process.env.GITHUB_OWNER = prevOwner;
    if (prevRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = prevRepo;
  }
});

test('getSectionTargetTab, moveSectionToTab, and applyDraggedSectionOrder align tabs and section order cleanly', () => {
  const sections: PortfolioSectionConfig[] = [
    { id: 'hero', title: 'Hero', label: 'Home', enabled: true, order: 0 },
    { id: 'flagship', title: 'Flagship', label: 'Flagship', enabled: true, order: 1 },
    { id: 'reel', title: 'Showreel', label: 'Reel', enabled: true, order: 2 },
    { id: 'projects', title: 'Projects', label: 'Projects', enabled: true, order: 3 },
    {
      id: 'custom_1',
      title: 'Devlog Clip',
      label: 'Devlog',
      enabled: true,
      order: 4,
      isCustom: true,
      targetTab: 'projects'
    }
  ];

  // Default & explicit tab resolution
  assert.equal(getSectionTargetTab(sections[0]), 'hero');
  assert.equal(getSectionTargetTab(sections[2]), 'projects');
  assert.equal(getSectionTargetTab(sections[4]), 'projects');

  // Move section to About tab and Own Navbar tab
  const movedToAbout = moveSectionToTab(sections, 'custom_1', 'about');
  assert.equal(getSectionTargetTab(movedToAbout.find(s => s.id === 'custom_1')!), 'about');

  const movedToOwn = moveSectionToTab(movedToAbout, 'custom_1', 'own');
  assert.equal(getSectionTargetTab(movedToOwn.find(s => s.id === 'custom_1')!), 'custom_1');

  // Dragged subset inside Work tab re-aligns order indices automatically
  const reordered = applyDraggedSectionOrder(sections, ['projects', 'custom_1', 'flagship', 'reel']);
  const sortedIds = [...reordered].sort((a, b) => a.order - b.order).map(s => s.id);
  assert.deepEqual(sortedIds, ['hero', 'projects', 'custom_1', 'flagship', 'reel']);
  assert.deepEqual(
    [...reordered].sort((a, b) => a.order - b.order).map(s => s.order),
    [0, 1, 2, 3, 4]
  );
});

test('getGitHubConfigStatus reports tokenSource as env when GITHUB_TOKEN env is configured', async () => {
  const { getGitHubConfigStatus } = await import('../../api/update-portfolio');
  const prev = process.env.GITHUB_TOKEN;
  try {
    process.env.GITHUB_TOKEN = 'ghp_env_source_check';
    const st = getGitHubConfigStatus();
    assert.equal(st.hasToken, true);
    assert.equal(st.tokenSource, 'env');
  } finally {
    if (prev === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev;
  }
});

test('Owner unlock enforces BOTH Admin PIN and Authenticator TOTP, and reveal-setup-qr checks PIN', async () => {
  const {
    handleUpdatePortfolioRequest,
    generateServerTotpCode,
    OWNER_TOTP_DEFAULT_SECRET,
    verifyAdminSessionToken
  } = await import('../../api/update-portfolio');

  const invoke = async (body: Record<string, unknown>, extraOptions: Record<string, unknown> = {}) => {
    let statusCode = 200;
    let rawBody = '';
    const headers: Record<string, unknown> = {};
    const fakeReq = {
      method: 'POST',
      url: '/api/update-portfolio',
      headers: {},
      body
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[0];
    const fakeRes = {
      statusCode: 200,
      setHeader(k: string, v: unknown) {
        headers[k.toLowerCase()] = v;
      },
      getHeader(k: string) {
        return headers[k.toLowerCase()];
      },
      end(chunk?: string) {
        rawBody = String(chunk || '');
      }
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[1];

    Object.defineProperty(fakeRes, 'statusCode', {
      get: () => statusCode,
      set: (v: number) => {
        statusCode = v;
      }
    });

    await handleUpdatePortfolioRequest(fakeReq, fakeRes, extraOptions);
    return { statusCode, data: JSON.parse(rawBody || '{}') as Record<string, unknown> };
  };

  const validCode = generateServerTotpCode(OWNER_TOTP_DEFAULT_SECRET);

  // 1. Right PIN without Authenticator code -> REJECTED
  const pinOnly = await invoke({ action: 'verify-owner-2fa', pin: '906', code: '' });
  assert.equal(pinOnly.statusCode, 401);
  assert.equal(pinOnly.data.ok, false);
  assert.equal(pinOnly.data.token, undefined);

  // 2. Right Authenticator code with WRONG PIN -> REJECTED
  const totpOnlyWrongPin = await invoke({ action: 'verify-owner-2fa', pin: '000', code: validCode });
  assert.equal(totpOnlyWrongPin.statusCode, 401);
  assert.equal(totpOnlyWrongPin.data.ok, false);
  assert.equal(totpOnlyWrongPin.data.token, undefined);

  // 3. reveal-setup-qr with WRONG PIN -> REJECTED
  let resetCalled = false;
  const qrWrongPin = await invoke(
    { action: 'reveal-setup-qr', pin: '000' },
    { onResetPairingRequested: () => { resetCalled = true; } }
  );
  assert.equal(qrWrongPin.statusCode, 401);
  assert.equal(qrWrongPin.data.otpauthUri, undefined);
  assert.equal(resetCalled, false);

  // 4. reveal-setup-qr with RIGHT PIN -> returns otpauthUri and marks unpaired
  const qrRightPin = await invoke(
    { action: 'reveal-setup-qr', pin: '906' },
    { onResetPairingRequested: () => { resetCalled = true; } }
  );
  assert.equal(qrRightPin.statusCode, 200);
  assert.equal(qrRightPin.data.ok, true);
  assert.equal(qrRightPin.data.isPaired, false);
  assert.ok(String(qrRightPin.data.otpauthUri || '').startsWith('otpauth://totp/'));
  assert.equal(resetCalled, true);

  // 5. BOTH Right Admin PIN AND Right Authenticator code -> UNLOCKED + marks paired
  let verifiedCalled = false;
  const dualOk = await invoke(
    { action: 'verify-owner-2fa', pin: '906', code: validCode },
    { onTwoFactorVerified: () => { verifiedCalled = true; } }
  );
  assert.equal(dualOk.statusCode, 200);
  assert.equal(dualOk.data.ok, true);
  assert.equal(dualOk.data.isAuthenticated, true);
  assert.equal(dualOk.data.isPaired, true);
  assert.equal(verifyAdminSessionToken(String(dualOk.data.token || '')), true);
  assert.equal(verifiedCalled, true);
});

test('fetchGitHubDataJson sends no-cache headers/query and falls back to raw.githubusercontent.com on unauthenticated 403', async () => {
  const { fetchGitHubDataJson } = await import('../../api/update-portfolio');
  const prevToken = process.env.GITHUB_TOKEN;
  const prevOwner = process.env.GITHUB_OWNER;
  const prevRepo = process.env.GITHUB_REPO;
  const prevFetch = globalThis.fetch;

  delete process.env.GITHUB_TOKEN;
  process.env.GITHUB_OWNER = 'Adhavanadhi7819';
  process.env.GITHUB_REPO = 'Portfolio-Website';

  const requestedUrls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requestedUrls.push(url);
    if (url.startsWith('https://api.github.com/')) {
      return new Response(JSON.stringify({ message: 'API rate limit exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(
      JSON.stringify({
        initialized: true,
        version: 42,
        updatedAt: '2026-11-14T19:00:00.000Z',
        activePortfolioId: 'default_portfolio',
        portfolios: [{ id: 'default_portfolio', name: 'Raw Fallback', subtitle: '', createdAt: '', updatedAt: '', state: {} }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  try {
    const res = await fetchGitHubDataJson();
    assert.equal(res.exists, true);
    assert.equal(res.data?.version, 42);
    assert.ok(requestedUrls[0].includes('&_t='));
    assert.ok(requestedUrls[1].startsWith('https://raw.githubusercontent.com/Adhavanadhi7819/Portfolio-Website/'));
  } finally {
    globalThis.fetch = prevFetch;
    if (prevToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevToken;
    if (prevOwner === undefined) delete process.env.GITHUB_OWNER;
    else process.env.GITHUB_OWNER = prevOwner;
    if (prevRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = prevRepo;
  }
});

test('upload-asset commits binary to GitHub and action=asset + relink-qr work in Vercel serverless mode', async () => {
  const {
    handleUpdatePortfolioRequest,
    createAdminSessionToken,
    extractReferencedAssetIds
  } = await import('../../api/update-portfolio');

  const ids = extractReferencedAssetIds({
    thumb: '/api/assets/abcdef0123456789abcdef0123456789.jpg',
    other: '/uploaded-assets/11112222333344445555666677778888.pdf'
  });
  assert.equal(ids.size, 2);

  const prevToken = process.env.GITHUB_TOKEN;
  const prevOwner = process.env.GITHUB_OWNER;
  const prevRepo = process.env.GITHUB_REPO;
  const prevFetch = globalThis.fetch;

  process.env.GITHUB_TOKEN = 'ghp_asset_test_token';
  process.env.GITHUB_OWNER = 'Adhavanadhi7819';
  process.env.GITHUB_REPO = 'Portfolio-Website';

  const putCalls: Array<{ url: string; body: string }> = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();
    if (method === 'GET') {
      return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    }
    putCalls.push({ url, body: String(init?.body || '') });
    return new Response(JSON.stringify({ content: { path: 'public/uploaded-assets/test' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }) as typeof fetch;

  const sessionToken = createAdminSessionToken();
  const sampleBase64 = Buffer.from('hello-portfolio-asset-bytes', 'utf8').toString('base64');

  const invoke = async (method: string, url: string, body?: Record<string, unknown>) => {
    let statusCode = 200;
    let rawChunk: Buffer | string = '';
    const headers: Record<string, unknown> = {};
    const fakeReq = {
      method,
      url,
      headers: { authorization: `Bearer ${sessionToken}` },
      body
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[0];
    const fakeRes = {
      setHeader(k: string, v: unknown) {
        headers[k.toLowerCase()] = v;
      },
      getHeader(k: string) {
        return headers[k.toLowerCase()];
      },
      end(chunk?: Buffer | string) {
        rawChunk = chunk ?? '';
      }
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[1];
    Object.defineProperty(fakeRes, 'statusCode', {
      get: () => statusCode,
      set: (v: number) => {
        statusCode = v;
      }
    });
    await handleUpdatePortfolioRequest(fakeReq, fakeRes, { runtime: 'vercel' });
    return { statusCode, headers, rawChunk };
  };

  try {
    const uploadRes = await invoke('POST', '/api/update-portfolio', {
      action: 'upload-asset',
      filename: 'shot.png',
      mimeType: 'image/png',
      base64Content: sampleBase64
    });
    assert.equal(uploadRes.statusCode, 201);
    const uploadJson = JSON.parse(String(uploadRes.rawChunk)) as { ok: boolean; url: string };
    assert.equal(uploadJson.ok, true);
    assert.ok(uploadJson.url.startsWith('/api/assets/'));
    assert.ok(uploadJson.url.endsWith('.png'));
    assert.equal(putCalls.length, 1);
    assert.ok(putCalls[0].url.includes('/contents/public/uploaded-assets/'));

    const relinkRes = await invoke('POST', '/api/update-portfolio', { action: 'relink-qr' });
    assert.equal(relinkRes.statusCode, 200);
    const relinkJson = JSON.parse(String(relinkRes.rawChunk)) as { ok: boolean; otpauthUri: string };
    assert.equal(relinkJson.ok, true);
    assert.ok(relinkJson.otpauthUri.startsWith('otpauth://totp/'));

    const fileId = uploadJson.url.replace('/api/assets/', '');
    const assetGetRes = await invoke('GET', `/api/update-portfolio?action=asset&file=${fileId}`);
    assert.equal(assetGetRes.statusCode, 200);
    assert.equal(assetGetRes.headers['content-type'], 'image/png');
    assert.equal(Buffer.from(assetGetRes.rawChunk).toString('utf8'), 'hello-portfolio-asset-bytes');

    // Clean up local test file written by writeLocalAssetIfWritable
    const fs = await import('node:fs');
    const path = await import('node:path');
    for (const dir of ['portfolio-data/assets', 'public/uploaded-assets']) {
      const f = path.resolve(process.cwd(), dir, fileId);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  } finally {
    globalThis.fetch = prevFetch;
    if (prevToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevToken;
    if (prevOwner === undefined) delete process.env.GITHUB_OWNER;
    else process.env.GITHUB_OWNER = prevOwner;
    if (prevRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = prevRepo;
  }
});

test('status auto-detects unpaired 2FA and emits otpauthUri until 2FA verification sets paired cookie', async () => {
  const {
    handleUpdatePortfolioRequest,
    generateServerTotpCode,
    OWNER_TOTP_DEFAULT_SECRET
  } = await import('../../api/update-portfolio');

  const invoke = async (
    method: string,
    url: string,
    body?: Record<string, unknown>,
    cookieHeader = ''
  ) => {
    let statusCode = 200;
    let rawChunk = '';
    const headers: Record<string, unknown> = {};
    const fakeReq = {
      method,
      url,
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      body
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[0];
    const fakeRes = {
      setHeader(k: string, v: unknown) {
        headers[k.toLowerCase()] = v;
      },
      getHeader(k: string) {
        return headers[k.toLowerCase()];
      },
      end(chunk?: Buffer | string) {
        rawChunk = String(chunk || '');
      }
    } as unknown as Parameters<typeof handleUpdatePortfolioRequest>[1];
    Object.defineProperty(fakeRes, 'statusCode', {
      get: () => statusCode,
      set: (v: number) => {
        statusCode = v;
      }
    });
    await handleUpdatePortfolioRequest(fakeReq, fakeRes, { runtime: 'vercel' });
    return { statusCode, headers, data: JSON.parse(rawChunk || '{}') as Record<string, unknown> };
  };

  // 1. Fresh/unpaired state: automatically emits otpauthUri for QR rendering
  const unpairedStatus = await invoke('GET', '/api/update-portfolio?action=status');
  assert.equal(unpairedStatus.statusCode, 200);
  assert.equal(unpairedStatus.data.isPaired, false);
  assert.equal(unpairedStatus.data.canShowInitialSetupQr, true);
  assert.ok(String(unpairedStatus.data.otpauthUri || '').startsWith('otpauth://totp/'));

  // 2. Verify Admin PIN + TOTP -> issues session + paired cookies
  const validCode = generateServerTotpCode(OWNER_TOTP_DEFAULT_SECRET);
  const verifyRes = await invoke('POST', '/api/update-portfolio', {
    action: 'verify-owner-2fa',
    pin: '906',
    code: validCode
  });
  assert.equal(verifyRes.statusCode, 200);
  const setCookies = Array.isArray(verifyRes.headers['set-cookie'])
    ? verifyRes.headers['set-cookie']
    : [String(verifyRes.headers['set-cookie'] || '')];
  const cookieHeader = setCookies.map((c) => String(c).split(';')[0]).join('; ');
  assert.ok(cookieHeader.includes('adhavan_totp_paired='));

  // 3. Subsequent status check with paired cookie -> hides QR automatically
  const pairedStatus = await invoke('GET', '/api/update-portfolio?action=status', undefined, cookieHeader);
  assert.equal(pairedStatus.statusCode, 200);
  assert.equal(pairedStatus.data.isPaired, true);
  assert.equal(pairedStatus.data.canShowInitialSetupQr, false);
  assert.equal(pairedStatus.data.otpauthUri, undefined);

  // 4. unpair-2fa clears paired cookie and returns fresh otpauthUri
  const unpairRes = await invoke(
    'POST',
    '/api/update-portfolio',
    { action: 'unpair-2fa' },
    cookieHeader
  );
  assert.equal(unpairRes.statusCode, 200);
  assert.equal(unpairRes.data.isPaired, false);
  assert.ok(String(unpairRes.data.otpauthUri || '').startsWith('otpauth://totp/'));
});

test('plexusColors handles HEX/RGB conversions, cycling interpolation, and config clamping', async () => {
  const {
    DEFAULT_PLEXUS_BACKGROUND_CONFIG,
    normalizeHex,
    hexToRgb,
    rgbToHex,
    parseRgbString,
    formatRgbLabel,
    rgbaStr,
    sampleCycledColor,
    getResolvedBackgroundConfig
  } = await import('./plexusColors');

  assert.equal(normalizeHex('00F0FF'), '#00f0ff');
  assert.equal(normalizeHex('#abc'), '#aabbcc');
  assert.equal(normalizeHex('invalid'), null);

  assert.deepEqual(hexToRgb('#c026d3'), { r: 192, g: 38, b: 211 });
  assert.equal(rgbToHex(16, 185, 129), '#10b981');
  assert.equal(rgbToHex(-12, 300, 128.4), '#00ff80');

  assert.deepEqual(parseRgbString('rgb(37, 99, 235)'), { r: 37, g: 99, b: 235 });
  assert.deepEqual(parseRgbString('244, 63, 94'), { r: 244, g: 63, b: 94 });
  assert.equal(parseRgbString('rgb(256, 0, 0)'), null);
  assert.equal(formatRgbLabel('#00f0ff'), 'rgb(0, 240, 255)');
  assert.equal(rgbaStr({ r: 0, g: 240, b: 255 }, 0.5), 'rgba(0, 240, 255, 0.500)');

  const palette = [
    { r: 0, g: 0, b: 0 },
    { r: 100, g: 200, b: 250 }
  ];
  assert.deepEqual(sampleCycledColor(palette, 0), { r: 0, g: 0, b: 0 });
  assert.deepEqual(sampleCycledColor(palette, 0.5), { r: 50, g: 100, b: 125 });
  assert.deepEqual(sampleCycledColor(palette, 2), { r: 0, g: 0, b: 0 });
  assert.deepEqual(sampleCycledColor(palette, -0.5), { r: 50, g: 100, b: 125 });

  const resolved = getResolvedBackgroundConfig({
    enabled: false,
    voidInnerHex: '112233',
    voidOuterHex: 'not-a-hex',
    paletteHexes: ['#fff', 'bad-color', '#10b981'],
    cycleSpeed: 99,
    nodeDensity: 0.1,
    facetOpacity: 1,
    cursorRadius: 20,
    cursorMode: 'repel'
  });

  assert.equal(resolved.enabled, false);
  assert.equal(resolved.voidInnerHex, '#112233');
  assert.equal(resolved.voidOuterHex, DEFAULT_PLEXUS_BACKGROUND_CONFIG.voidOuterHex);
  assert.deepEqual(resolved.paletteHexes, ['#ffffff', '#10b981']);
  assert.equal(resolved.cycleSpeed, 3);
  assert.equal(resolved.nodeDensity, 0.4);
  assert.equal(resolved.facetOpacity, 0.28);
  assert.equal(resolved.cursorRadius, 80);
  assert.equal(resolved.cursorMode, 'repel');
});
