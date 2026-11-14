import { ProjectItem, VideoChapter, MayaModelItem, DesignerInfo, PortfolioState, PortfolioSectionConfig } from '../types/portfolio';
import { DEFAULT_PLEXUS_BACKGROUND_CONFIG } from '../utils/plexusColors';

export const VIDEO_PATH = '/assets/aistudio/Portfolio_46956db1.mp4';

export const DESIGNER_INFO: DesignerInfo = {
  name: 'ADHAVAN',
  title: 'Game Designer | 3D Artist',
  tagline: 'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.',
  aboutIntro: 'I am an aspiring game designer currently working with Unreal Engine to develop interactive and engaging gameplay experiences. Through my projects, I have explored level design, basic mechanics, and environment creation. I am continuously learning and improving my skills to create better and more immersive games.',
  aboutGoals: 'I am a passionate game design student with hands-on experience in Unreal Engine, seeking an opportunity to apply my skills in a professional environment. I have worked on projects involving level design, gameplay mechanics, and environment creation, and I am eager to learn from industry professionals while contributing creatively to game development.',
  email: 'prabuprabu906@gmail.com',
  phone: '8072647909',
  linkedin: 'Adhavan P',
  linkedinUrl: 'https://www.linkedin.com/in/adhavan-p',
  artstationUrl: 'https://www.artstation.com/adhavan7819',
  whatsappUrl: 'https://wa.me/918072647909',
  instagramUrl: 'https://www.instagram.com/',
  youtubeUrl: 'https://www.youtube.com/',
  status: 'Open to Game Studio Roles & Freelance Design',
  skills: [
    { name: 'Unreal Engine 5 (Lumen, Nanite, Sequencer)', pct: 90, desc: 'Environment blockout, post-process color grading, camera sequencer', category: 'Engine & Workflows' },
    { name: 'Level Design & Flow Layout', pct: 88, desc: 'Player guidance, verticality, landmark composition, pacing', category: 'Design' },
    { name: 'Vehicle Rigging & Physics Simulation', pct: 85, desc: 'Chaos vehicles, suspension tuning, drift dynamics & chase cams', category: 'Mechanics' },
    { name: 'Autodesk Maya 3D Hard-Surface', pct: 82, desc: 'Clean sub-d modeling, quad topology, prop & architectural kits', category: '3D Art' },
    { name: 'Gameplay Blueprints & Locomotion', pct: 80, desc: 'Third-person character physics, sprint/jump arcs, UI dialog logic', category: 'Programming' }
  ],
  tools: [
    'Unreal Engine 5',
    'Autodesk Maya',
    'Post-Process Volume',
    'Chaos Vehicles / Rigging',
    'Sequencer',
    'Lumen & Nanite',
    'Substance / Texturing',
    'Blueprints'
  ],
  resumeSummary: 'Passionate game design student with hands-on development experience in Unreal Engine 5 and Autodesk Maya. Specializes in 3D level blockouts, third-person character locomotion, vehicle rigging, and cinematic sequencing. Eager to contribute to game development teams as a Junior Game Designer, Level Designer, or 3D Artist.',
  resumeExperiences: [
    {
      role: 'Lead Game Designer & Level Artist',
      project: 'Stylized Pirate Port RPG (In Development)',
      period: '2024 - Present',
      description: 'Architected handcrafted stylized port village hub. Designed fluid third-person locomotion physics (sprint, jump, slope alignment), obstacle-aware chase camera, and modular marketplace stalls and bridges in Unreal Engine 5.',
      tools: ['Unreal Engine 5', 'Blueprint Scripting', 'Level Blockout', 'Cinematic Lighting']
    },
    {
      role: 'Vehicle Physics & Sequencer Artist',
      project: 'Initial D AE86 Speedrun & Vehicle Rig',
      period: '2024',
      description: 'Rigged 4-wheel Chaos vehicle physics with custom suspension damping and drift dynamics. Directed high-speed urban chase camera sequences with anime-style speed line effects and camera shakes.',
      tools: ['Unreal Engine', 'Chaos Physics', 'Sequencer', 'Post-Process Speed FX']
    },
    {
      role: 'Level Designer & Lighting Artist',
      project: 'Optimal Gas Station Night Scene',
      period: '2023 - 2024',
      description: 'Built realistic night commercial environment with multi-car lineup. Tuned Post-Process Volume chromatic aberration, bloom, and tone mapping alongside wet ground reflection shaders.',
      tools: ['Unreal Engine', 'Post-Process Volume', 'Lumen Lighting', 'Vehicle Staging']
    },
    {
      role: 'Environment & Duality Artist',
      project: 'Temple Dual Concept (Upside & Downside)',
      period: '2023',
      description: 'Created architectural duality study featuring Dravidian temple sculptures in bright daylight god-rays, contrasted against a subterranean misty ruin illuminated by Niagara flame braziers.',
      tools: ['Unreal Engine', 'Volumetric Fog', 'Niagara Fire FX', 'Dravidian Architecture']
    },
    {
      role: '3D Hard-Surface Modeler',
      project: 'Autodesk Maya 3D Asset Collection',
      period: '2023',
      description: 'Modeled sub-d quad assets including vintage brass gramophone, streaming game room interior, and classical acoustic guitar with game-ready UVs.',
      tools: ['Autodesk Maya', 'Subdivision Modeling', 'Hard-Surface Topology', 'Turntable Lighting']
    }
  ],
  resumeEducation: [
    {
      degree: 'Game Design & Interactive Media',
      institution: 'Game Development Specialization',
      year: '2022 - Present',
      details: 'Focus on Unreal Engine 5 level design, gameplay mechanics scripting, 3D environment composition, and vehicle physics simulation.'
    },
    {
      degree: '3D Computer Graphics & Animation',
      institution: 'Autodesk Maya & Real-Time Engines',
      year: '2021 - 2022',
      details: 'Hard-surface 3D prop modeling, clean quad topology, PBR texturing pipelines, and real-time asset optimization.'
    }
  ],
  resumePdfUrl: '/showcase/Adhavan_Resume.pdf',
  resumeFileName: 'Adhavan B&W resume.pdf',
  resumeFileSize: '5.1 MB',
  resumeUploadDate: 'Nov 14, 2026',
  contactHeading: "Let's Work Together",
  contactSubheading: "Have a project in mind? I'd love to hear about it. Reach out for collaborations, freelance work, or just to say hello.",
  contactBadge: 'GET IN TOUCH',
  contactLocationNote: 'Based in India · Available Worldwide',
  contactInquiryOptions: [
    'Game Design & Level Design',
    '3D Modeling & Environment Art',
    'Game Studio Role / Full-Time Inquiry',
    'Freelance / Collaboration Inquiry'
  ],
  contactSlidePhotoUrl: '/showcase/contact-slide.jpg',
  backgroundConfig: DEFAULT_PLEXUS_BACKGROUND_CONFIG,
  heroBadge: 'Unreal Engine & Autodesk Maya Portfolio',
  heroSubtitle: 'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.',
  heroPhotoUrl: '/showcase/hero-portrait.jpg',
  heroPhotoAlign: {
    x: 50,
    y: 50,
    zoom: 1,
    fit: 'cover'
  },
  heroEngineTags: {
    engine: 'Unreal 5',
    maya: 'Maya',
    focus: 'Mechanics'
  },
  heroStats: [
    { number: '6+', label: 'Unreal Environments & Levels' },
    { number: '3D RPG', label: 'Flagship Game In Progress' },
    { number: 'Vehicle Rig', label: 'Physics & Drift Sequencer' },
    { number: 'Maya 3D', label: 'Hard-Surface & Prop Art' }
  ],
  heroDisciplines: ['Game Design', 'Level Layout', 'Vehicle Rigging', '3D Arts (Maya)'],
  proficiencyHeading: 'TECHNICAL PROFICIENCY',
  proficiencySubheading: 'Unreal Engine 5 level blockouts, responsive player mechanics, Chaos vehicle physics, and Autodesk Maya 3D hard-surface art.',
  proficiencyCalloutTitle: 'Seeking Junior Game Designer Roles',
  proficiencyCalloutText: 'Ready to assist lead level designers, white-box test environments, and construct interactive blueprint mechanics.',
  proficiencyCompetencyCards: [
    {
      title: 'Level Design & Flow',
      description: 'Player guidance, verticality, sightlines, and landmark composition to build intuitive game spaces.',
      tags: ['Landmark Orientation', 'Multi-tier Elevation', 'Market & Hub Flow', 'Pacing & Density']
    },
    {
      title: 'Vehicle Rigging & Physics',
      description: 'Chaos vehicle physics configuration, suspension damping, and high-speed drift cinematics.',
      tags: ['4-Wheel Suspension', 'Drift Angle Physics', 'Chassis Body Roll', 'Speed Camera Tracks']
    },
    {
      title: 'Autodesk Maya 3D',
      description: 'Clean hard-surface subdivision modeling with quad topology and real-time engine readiness.',
      tags: ['Sub-D Modeling', 'Clean Quad Mesh', 'Modular Props', 'Studio Turntables']
    },
    {
      title: 'Unreal Engine 5 & Blueprints',
      description: 'Third-person character physics, sprint/jump arcs, dynamic cameras, and thematic pirate UI systems.',
      tags: ['Locomotion Physics', 'Chase Cameras', 'Dialogue Prompt UI', 'Lumen & Sequencer']
    }
  ],
  aboutHeading: 'About Adhavan',
  aboutSubheading: 'Crafting immersive Unreal Engine worlds, cinematic camera sequences, and stylized gameplay mechanics.',
  aboutPhilosophyCards: [
    {
      title: 'Player-First Level Flow',
      description: 'Crafting levels where landmarks, lighting contrast, and architectural composition naturally guide players without intrusive waypoints.'
    },
    {
      title: 'Kinesthetic Feel & Movement',
      description: 'Tuning sprint arcs, jump trajectories, and physics damping so that player traversal feels satisfying, fluid, and grounded.'
    },
    {
      title: 'Cinematic Atmosphere',
      description: 'Harnessing Lumen global illumination, post-process color grading, and dynamic camera sequencers to evoke memorable gaming moods.'
    }
  ],
  aboutReelStills: [
    {
      title: 'Robot Rig Study',
      label: 'Unreal & Maya',
      image: '/showcase/intro-robot.jpg'
    },
    {
      title: 'UE5 Lighting Staging',
      label: 'Porsche GT3 RS Dual Car Render',
      image: '/showcase/about-porsche.jpg'
    }
  ],
  careerTimeline: [
    {
      id: 'timeline_1',
      phase: 'PHASE 01',
      title: 'Autodesk Maya 3D Hard-Surface Foundations',
      period: '2021 - 2022',
      description: 'Mastered clean subdivision quad modeling, topology optimization, prop kit creation, and turntable rendering for real-time engines.',
      status: 'completed',
      highlights: ['Sub-D Quad Modeling', 'Prop & Instrument Art', 'Modular Interior Assets', 'UV Mapping'],
      photoUrl: '/showcase/maya-models.jpg',
      photoCaption: 'Hard-surface prop modeling & studio turntable renders in Autodesk Maya'
    },
    {
      id: 'timeline_2',
      phase: 'PHASE 02',
      title: 'Unreal Engine 5 Environments & Lighting Duality',
      period: '2023 - 2024',
      description: 'Designed atmospheric 3D environments, tuning Post-Process Volumes, screen-space reflections, volumetric fog, and day vs night lighting dualities.',
      status: 'completed',
      highlights: ['Lumen & Nanite Workflows', 'Volumetric Fog', 'Post-Process Color Grading', 'Level Composition'],
      photoUrl: '/showcase/temple-upside.jpg',
      photoCaption: 'Atmospheric temple lighting duality & Lumen scene composition in UE5'
    },
    {
      id: 'timeline_3',
      phase: 'PHASE 03 · ACTIVE',
      title: 'Flagship Pirate RPG & Vehicle Rigging Mechanics',
      period: '2024 - PRESENT',
      description: 'Developing full third-person character locomotion, sprint/jump arcs, obstacle-aware chase camera, Chaos vehicle physics, and stylized maritime hub layout.',
      status: 'current',
      highlights: ['Locomotion Physics', 'Chaos Vehicle Tuning', 'Flagship Port Hub', 'Blueprint Logic'],
      photoUrl: '/showcase/pirate-village-hero.jpg',
      photoCaption: 'Flagship Stylized Pirate Port RPG hub level blockout & locomotion test'
    },
    {
      id: 'timeline_4',
      phase: 'PHASE 04 · TARGET',
      title: 'Studio Objective: Junior Game & Level Designer',
      period: '2025 & BEYOND',
      description: 'Seeking an opportunity to apply skills in a professional game studio environment—ready to white-box levels, balance gameplay traversal, and contribute creatively under lead design guidance.',
      status: 'target',
      highlights: ['Level White-Boxing', 'Player Pacing & Guidance', 'Studio Teamwork', 'Fast Creative Learning'],
      photoUrl: '/assets/aistudio/Gemini_Generated_Image_o735hbo735hbo735_ac6b7e92.png',
      photoCaption: 'Studio readiness: combining level layout, mechanics tuning & visual craft'
    }
  ],
  aboutCalloutTitle: 'Looking for a Dedicated Game Designer?',
  aboutCalloutText: 'Available for Junior Game Designer, Level Designer, or 3D Artist roles with game studios worldwide.',
  resumeHeading: 'GAME DESIGNER RESUME',
  resumeSubheading: 'Comprehensive overview of credentials, engine proficiencies, and in-engine game development deliverables.',
  flagshipHeading: 'MY LATEST PROJECT',
  flagshipQuote: 'Recorded gameplay footage, playable build download, and game specifications.',
  flagshipRoadmapQuote: '',
  flagshipGameTitle: 'Game Specifications',
  flagshipGameSpecs: 'Add your game overview, core gameplay mechanics, controls, and build notes here.',
  flagshipSpecRows: [
    { label: 'Engine', value: 'Unreal Engine 5' },
    { label: 'Genre', value: 'To Be Updated' },
    { label: 'Platform', value: 'Windows PC Build' },
    { label: 'Status', value: 'Playable Build In Progress' }
  ],
  flagshipGameUrl: '',
  flagshipGameLabel: 'Download Playable Build',
  flagshipVideoUrl: '',
  flagshipScreenshots: [
    {
      title: 'Vibrant Town Square Hub',
      subtitle: 'Overhead third-person perspective showing stone pavers, market canopies, and level pathing.',
      image: '/showcase/pirate-village-hero.jpg'
    },
    {
      title: 'Harbor Docks & Pier Walkway',
      subtitle: 'Waterfront boardwalk featuring moored boats, fish racks, barrel clusters, and ocean sightlines.',
      image: '/showcase/pirate-deck.jpg'
    },
    {
      title: 'Marketplace Stalls & Castle Overlook',
      subtitle: 'Lush village green surrounded by multi-tier timber houses, windmill landmarks, and hilltop citadel walls.',
      image: '/showcase/pirate-pumpkin-square.jpg'
    },
    {
      title: 'Canopy Alley & Stone Staircases',
      subtitle: 'Narrow cobblestone street navigation testing vertical elevation, market canopies, and ambient lighting.',
      image: '/showcase/pirate-bridge-action.jpg'
    }
  ],
  flagshipFeatureCards: [
    {
      title: 'Fluid Player Locomotion',
      description: 'Custom third-person character movement with sprint acceleration, directional jump arc, and smooth slope alignment across stairs and docks.'
    },
    {
      title: 'Handcrafted Port Village Level',
      description: 'Designed with natural sightlines, landmark orientation (windmill & watchtower), multi-tier bridges, and vibrant marketplace stalls.'
    },
    {
      title: 'Pirate UI & Choice Systems',
      description: 'Thematic pirate skull & crossbones interface with interactive prompt dialogs, character customization cards, and player feedback.'
    },
    {
      title: 'Environmental Dressing',
      description: 'Lush pumpkin patches, burning blacksmith braziers, hay wagons, barrels, and wooden pier structures bringing the maritime world to life.'
    }
  ],
  reelHeading: 'Cinematic Showreel',
  reelSubheading: 'Recorded directly from Unreal Engine and Autodesk Maya viewport sessions. Use the chapter navigator below to jump between projects.',
  reelResolutionNote: 'Resolution: 1080p 30fps',
  projectsHeading: 'Curated Works',
  projectsSubheading: 'Explorations spanning Unreal Engine level layout, dynamic vehicle rigging, lighting duality concepts, and Autodesk Maya models.',
  mayaHeading: '3D Modeling & Assets',
  mayaSubheading: '“Created these models using Autodesk Maya.” Hard-surface props and interior environments built with clean edge loops, optimized topology, and game-ready UV mapping.',
  outroTitle: '',
  outroText: ''
};

export const VIDEO_CHAPTERS: VideoChapter[] = [
  {
    id: 'intro',
    title: 'Identity & Introduction',
    subtitle: 'Adhavan // Game Designer Reel',
    startTime: 0,
    endTime: 10,
    thumbnail: '/showcase/hero-adhavan.jpg',
    category: 'all',
    description: 'Overview of Adhavan’s design philosophy, Unreal Engine focus, and 3D character work.'
  },
  {
    id: 'temple-upside',
    title: 'New Temple (Upside Concept)',
    subtitle: 'Sacred Daytime Architecture',
    startTime: 11,
    endTime: 23,
    thumbnail: '/showcase/temple-upside.jpg',
    category: 'environment',
    description: 'Grand Dravidian-style Indian temple environment featuring intricate Ganesha, Nandi, and sanctum sculptures with warm daylight god-rays.'
  },
  {
    id: 'temple-downside',
    title: 'Ruined Temple (Downside Concept)',
    subtitle: 'Mystical Subterranean Ruins',
    startTime: 24,
    endTime: 32,
    thumbnail: '/showcase/temple-ruins.jpg',
    category: 'environment',
    description: 'Atmospheric counterpart concept: dark temple ruins illuminated by ceremonial fire brazier bowls, fog, and moody dusk lighting.'
  },
  {
    id: 'pirate-haven',
    title: 'Tavern Island & Pirate Galleon',
    subtitle: 'Maritime Outpost & Vessel Rig',
    startTime: 33,
    endTime: 64,
    thumbnail: '/showcase/pirate-ship.jpg',
    category: 'environment',
    description: 'Multi-tiered wooden cliffside tavern fortress, blue ocean physics, shipwreck cove, and full 18th-century pirate galleon ship sailing on open sea.'
  },
  {
    id: 'ae86-speedrun',
    title: 'Car Speedrun & Rigging (AE86)',
    subtitle: 'Urban Drift & Dynamic Sequencer',
    startTime: 65,
    endTime: 89,
    thumbnail: '/showcase/ae86-drift.jpg',
    category: 'vehicle-rigging',
    description: 'Initial D style Toyota AE86 Trueno drifting through city streets with speed line camera shakes, tire physics, and dynamic chase sequence.'
  },
  {
    id: 'gas-station',
    title: 'Gas Station Cars Lineup & Night Lighting',
    subtitle: 'Post-Process Volume & Wet Reflections',
    startTime: 90,
    endTime: 109,
    thumbnail: '/showcase/gas-station-night.jpg',
    category: 'level-design',
    description: 'Night environment with "OPTIMAL" neon canopy, muscle Mustang, BMW M4, and Porsche GT3 RS with rain/wet surface shaders.'
  },
  {
    id: 'maya-3d',
    title: 'Autodesk Maya 3D Asset Models',
    subtitle: 'Gramophone, Gaming Room & Guitar',
    startTime: 110,
    endTime: 112,
    thumbnail: '/showcase/maya-models.jpg',
    category: 'maya-3d',
    description: 'Precision hard-surface modeling in Autodesk Maya showcasing vintage gramophone, modern streaming gaming room, and acoustic guitar.'
  },
  {
    id: 'level-design-breakdown',
    title: 'Level Design & Vehicle Rigging Breakdown',
    subtitle: 'Cinematic Sequencing Deep Dive',
    startTime: 113,
    endTime: 170,
    thumbnail: '/showcase/station-cars-detail.jpg',
    category: 'level-design',
    description: 'Detailed analysis of level composition, camera cuts, post-process color grading, and car suspension responsiveness.'
  },
  {
    id: 'flagship-rpg',
    title: 'Latest Project: Stylized Pirate RPG',
    subtitle: 'In-Progress Third-Person Game',
    startTime: 171,
    endTime: 284,
    thumbnail: '/showcase/pirate-village-hero.jpg',
    category: 'flagship-game',
    description: 'Full gameplay walkthrough of in-development stylized third-person adventure game. Features vibrant port town, sprinting, jumping over bridges, and marketplace.'
  },
  {
    id: 'credits-contact',
    title: 'Contact & Future Releases',
    subtitle: 'Get In Touch with Adhavan',
    startTime: 285,
    endTime: 292,
    thumbnail: '/showcase/contact-slide.jpg',
    category: 'all',
    description: 'Direct contact information, professional links, and upcoming final game releases announcement.'
  }
];

export const PORTFOLIO_PROJECTS: ProjectItem[] = [
  {
    id: 'stylized-pirate-rpg',
    title: 'Stylized Pirate Port RPG (In Development)',
    category: 'flagship-game',
    categoryLabel: 'Flagship Game',
    summary: 'A fully packed third-person action adventure game set in a vibrant stylized maritime port town, built in Unreal Engine.',
    description: 'My current flagship in-development project focusing on a full gameplay experience. Includes custom player movement mechanics (fluid sprinting, directional jumping, camera framing), an expansive handcrafted level featuring wooden arch bridges, town plazas, harbor docks, market stalls, and farm patches, complete with custom pirate UI dialogue screens.',
    keyFeatures: [
      'Complete third-person character locomotion with sprint and jump physics',
      'Dynamic over-the-shoulder chase camera with obstacle-aware framing',
      'Handcrafted stylized level design: marketplace, multi-level stairs, bridges, and harbor',
      'Interactive pirate UI system with dialogue prompt panels and character selection cards',
      'Rich environmental props: barrels, hay bales, pumpkin patches, blacksmith braziers, and wooden docks'
    ],
    techStack: ['Unreal Engine 5', 'Blueprint Mechanics', 'Level Blockout', 'Third-Person Locomotion', 'Cinematic Lighting'],
    thumbnail: '/showcase/pirate-village-hero.jpg',
    galleryImages: [
      '/showcase/pirate-village-hero.jpg',
      '/showcase/pirate-game-ui.jpg',
      '/showcase/pirate-bridge-action.jpg',
      '/showcase/pirate-pumpkin-square.jpg'
    ],
    videoTimestamp: 171,
    isFlagship: true,
    conceptNotes: {
      theme: 'Stylized 3D Pirate Action-Adventure',
      lighting: 'Warm saturated sun-drenched coastal daylight with soft cartoon shadows',
      mechanics: 'Smooth responsive sprint, jumping, camera damping, interactive quest prompts',
      levelScale: 'Seamless village hub connected to bridges, docks, and upper watchtowers'
    }
  },
  {
    id: 'gas-station-level-design',
    title: 'Optimal Gas Station Night Scene',
    category: 'level-design',
    categoryLabel: 'Level Design & Post-Process',
    summary: 'Realistic night environment with multi-car lineup, neon canopy lighting, and advanced post-process volume tuning.',
    description: 'A comprehensive Unreal Engine level design study focusing on cinematic nighttime lighting, vehicle staging, and atmospheric camera movements. Features realistic wet ground reflections, high-contrast neon accents, fuel pump props, and a showcase lineup of sports and muscle cars including the Porsche 911 GT3 RS, BMW M4, and classic Ford Mustang.',
    keyFeatures: [
      'Post-Process Volume with tuned chromatic aberration, bloom, and tone mapping',
      'Wet asphalt shader with high-fidelity roughness maps and screen-space reflections',
      'Cinematic camera sequencing panning across vehicle contours and pump bays',
      'Realistic red and white neon emission from the "OPTIMAL" gas station roof'
    ],
    techStack: ['Unreal Engine', 'Post-Process Volume', 'Cinematic Sequencer', 'Lumen Lighting', 'Vehicle Staging'],
    thumbnail: '/showcase/gas-station-night.jpg',
    galleryImages: [
      '/showcase/gas-station-night.jpg',
      '/showcase/porsche-duo.jpg',
      '/showcase/station-cars-detail.jpg',
      '/showcase/about-porsche.jpg'
    ],
    videoTimestamp: 90,
    conceptNotes: {
      theme: 'Photorealistic Night Gas Station Rendezvous',
      lighting: 'High-contrast red neon canopy wash against moody dark blue ambient shadows',
      mechanics: 'Cinematic multi-camera cut sequence timed to car silhouettes',
      levelScale: 'Commercial gas station layout with fuel islands, parking bays, and convenience store exterior'
    }
  },
  {
    id: 'ae86-speedrun-rigging',
    title: 'Initial D AE86 Speedrun & Vehicle Rig',
    category: 'vehicle-rigging',
    categoryLabel: 'Vehicle Rigging',
    summary: 'Full vehicle physics rigging and urban drift cinematic sequence with speed line FX.',
    description: 'Showcases custom vehicle rigging and cinematic speed camera sequences in an urban metropolitan street environment. Featuring the legendary Toyota Sprinter Trueno AE86 with custom "Fujiwara Tofu Shop" Japanese decals, tuned suspension, dynamic drift physics, and anime-inspired speed lines and camera shake.',
    keyFeatures: [
      'Wheel and chassis rigging with active suspension travel simulation',
      'High-speed chase camera sequencing with intentional camera shake and focal tracking',
      'Anime-inspired radial speed-line post-process effect during acceleration phases',
      'Urban street setting with crosswalks, multi-story buildings, and foggy depth-of-field'
    ],
    techStack: ['Unreal Engine', 'Vehicle Rigging & Physics', 'Sequencer Camera Track', 'Post-Process Speed FX'],
    thumbnail: '/showcase/ae86-drift.jpg',
    galleryImages: [
      '/showcase/ae86-drift.jpg'
    ],
    videoTimestamp: 65,
    conceptNotes: {
      theme: 'Tribute to Initial D Mountain/City Drifting',
      lighting: 'Overcast urban street lighting with desaturated atmospheric mist',
      mechanics: 'Rigged 4-wheel physics, drift angle yaw, body roll under centrifugal force'
    }
  },
  {
    id: 'temple-dual-concept',
    title: 'Temple Dual Concept: Upside vs Downside',
    category: 'environment',
    categoryLabel: 'Environment Art',
    summary: 'Contrasting environmental design exploring holy sunlit architecture versus dark subterranean ruined shrines.',
    description: 'An architectural and lighting duality concept created in Unreal Engine. The "Upside Concept" portrays a pristine ancient Indian temple with carved stone vimanas, sanctum sanctorum with floral garlands, Lord Ganesha, and sacred Nandi under radiant sunshine. The "Downside Concept" reimagines the same space as an ancient subterranean ruin guarded by ceremonial flame braziers and misty night air.',
    keyFeatures: [
      'Duality exploration: Sacred daylight atmosphere vs eerie underworld ruins',
      'Authentic Indian temple stone architecture, sculptures, and ornamental columns',
      'Particle-based fire braziers casting dynamic flickering light in the downside version',
      'God-ray atmospheric volumetric fog and directional sunlight'
    ],
    techStack: ['Unreal Engine', 'Volumetric Fog', 'Niagara / Flame FX', 'Architectural Composition'],
    thumbnail: '/showcase/temple-upside.jpg',
    galleryImages: [
      '/showcase/temple-upside.jpg',
      '/showcase/temple-ruins.jpg'
    ],
    videoTimestamp: 11,
    conceptNotes: {
      theme: 'Sacred Sanctum Duality (Daylight Divinity vs Subterranean Shadow)',
      lighting: 'Upside: Golden hour sun rays; Downside: Fiery torch orange highlights with cold mist shadows',
      mechanics: 'Environmental storytelling through architectural weathering and lighting shifts'
    }
  },
  {
    id: 'tavern-island-galleon',
    title: 'Tavern Island & Pirate Galleon Outpost',
    category: 'environment',
    categoryLabel: 'Environment Art',
    summary: 'Cliffside fortress tavern with wooden piers, open ocean water, and sailing 18th-century pirate galleon.',
    description: 'An expansive coastal island level featuring a multi-story hexagonal wooden tavern perched atop a sheer rocky cliff. Down at sea level, wooden catwalks and piers lead out past a weathered shipwreck toward a majestic, fully-rigged 18th-century pirate galleon vessel navigating the open waters, complete with detailed masts, sails, and deck helm.',
    keyFeatures: [
      'Multi-level verticality: sea-level docks connected to clifftop tavern fortress via stairways',
      'Full exterior and deck modeling of an authentic pirate warship',
      'Water plane simulation with shoreline foam and shipwreck props',
      'Cinematic flyover camera capturing the scale of the sea and rocky spires'
    ],
    techStack: ['Unreal Engine', 'Landscape & Cliffs', 'Ocean Water Shading', 'Prop Dressing'],
    thumbnail: '/showcase/pirate-ship.jpg',
    galleryImages: [
      '/showcase/pirate-ship.jpg',
      '/showcase/pirate-deck.jpg'
    ],
    videoTimestamp: 33,
    conceptNotes: {
      theme: 'Pirate Haven Island & High Seas Outpost',
      lighting: 'Crisp midday ocean sky with natural horizon atmospheric haze',
      mechanics: 'Player exploration paths from ship deck to fortress overlook'
    }
  },
  {
    id: 'autodesk-maya-3d-models',
    title: 'Autodesk Maya 3D Asset Collection',
    category: 'maya-3d',
    categoryLabel: '3D Modeling',
    summary: 'Precision hard-surface 3D models including a vintage gramophone, streaming game room, and acoustic guitar.',
    description: 'High-quality 3D props created from scratch in Autodesk Maya. Showcases clean edge-flow, subdivision surface modeling, realistic material assignment, and studio lighting setups for games and cinematic environments.',
    keyFeatures: [
      'Vintage Brass Gramophone: detailed flared horn, crank handle, needle tone arm, and wooden base',
      'Gaming Room Interior: multi-screen desk setup, gaming chair, acoustic foam wall panels, and RGB lighting',
      'Classical Acoustic Guitar: contoured soundboard, rosette, bridge, fretboard wire, and tuning pegs'
    ],
    techStack: ['Autodesk Maya', 'Subdivision Modeling', 'Hard-Surface Topology', 'Studio Lighting & Shading'],
    thumbnail: '/showcase/maya-models.jpg',
    galleryImages: [
      '/showcase/maya-models.jpg'
    ],
    videoTimestamp: 110,
    conceptNotes: {
      theme: 'Hard-Surface Prop Artistry & Architectural Interior',
      lighting: 'Studio turntable lighting for gramophone, ambient RGB for gaming station',
      mechanics: 'Game-ready topology optimized for real-time engine rendering'
    }
  }
];

export const MAYA_MODELS: MayaModelItem[] = [
  {
    id: 'gramophone',
    title: 'Vintage Brass Gramophone',
    description: 'A beautifully crafted retro acoustic record player with a polished brass horn, turntable platter, tonearm, and carved walnut wooden enclosure.',
    thumbnail: '/showcase/maya-models.jpg',
    software: 'Autodesk Maya',
    details: [
      'Smooth rotational curvature on the flared brass horn',
      'Detailed mechanical winding crank and tonearm needle assembly',
      'Turned wooden base molding with bevelled corners'
    ],
    specs: {
      topology: 'Clean quad-dominant mesh',
      textures: 'Polished Brass & Varnished Walnut',
      category: 'Antique Prop'
    }
  },
  {
    id: 'gaming-room',
    title: 'Pro Gaming & Streamer Room Interior',
    description: 'A complete contemporary game development and streaming room featuring an ergonomic gaming chair, dual ultrawide monitor setup, acoustic wall treatment, display shelving with collectible figures, and customizable RGB ambiance.',
    thumbnail: '/showcase/maya-models.jpg',
    software: 'Autodesk Maya',
    details: [
      'Ergonomic bucket-seat gaming chair with caster base and adjustable armrests',
      'Cable-managed modular desk with keyboard, studio microphone, and speakers',
      'Segmented hexagonal acoustic wall panels and LED strip underglow'
    ],
    specs: {
      topology: 'Modular architectural kit',
      textures: 'Matte Carbon, Acoustic Felt & Neon Emission',
      category: 'Environment Interior'
    }
  },
  {
    id: 'guitar',
    title: 'Classical Acoustic Guitar',
    description: 'An acoustic guitar modeled with attention to musical ergonomics—featuring a figured spruce soundboard, rosewood bridge, carved neck profile, frets, and headstock tuning pegs.',
    thumbnail: '/showcase/maya-models.jpg',
    software: 'Autodesk Maya',
    details: [
      'Accurate scale neck profile and graduated fret wire spacing',
      'Soundhole rosette inlay and slotted classical headstock',
      'Bevelled soundboard purfling and nylon/steel string rigging'
    ],
    specs: {
      topology: 'Sub-D ready high-poly asset',
      textures: 'Spruce Top, Rosewood Fretboard & Chrome Hardware',
      category: 'Hero Musical Prop'
    }
  }
];

export const DEFAULT_OWNER_PASSCODE = '906';

export const DEFAULT_PORTFOLIO_SECTIONS: PortfolioSectionConfig[] = [
  { id: 'hero', title: 'Hero & Introduction', label: 'Home', enabled: true, order: 0 },
  { id: 'reel', title: 'Cinematic Showreel', label: 'Showreel', enabled: true, order: 1 },
  { id: 'flagship', title: 'Flagship Pirate RPG', label: 'Flagship', enabled: true, order: 2 },
  { id: 'projects', title: 'Curated Works & Levels', label: 'Projects', enabled: true, order: 3 },
  { id: 'maya', title: 'Maya 3D Models', label: '3D Models', enabled: true, order: 4 },
  { id: 'about', title: 'About & Design Philosophy', label: 'About', enabled: true, order: 5 },
  { id: 'resume', title: 'Game Designer Resume', label: 'Resume', enabled: true, order: 6 },
  { id: 'contact', title: 'Contact & Inquiry', label: 'Contact', enabled: true, order: 7 },
];

export const INITIAL_PORTFOLIO_STATE: PortfolioState = {
  designerInfo: DESIGNER_INFO,
  videoPath: VIDEO_PATH,
  videoChapters: VIDEO_CHAPTERS,
  projects: PORTFOLIO_PROJECTS,
  mayaModels: MAYA_MODELS,
  sections: DEFAULT_PORTFOLIO_SECTIONS
};
