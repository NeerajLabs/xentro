'use client';

import {
  ElevatorPitchVideo,
  PitchDeckDoc,
  StartupTeamMember,
  StartupProblem,
  StartupSolution,
  StartupProduct,
  StartupCompanyInfo,
  StartupMarket,
  StartupBusinessModel,
} from '@/types/startup';

export type FieldVisibility = 'Public' | 'Connections Only' | 'Approved Users' | 'Private' | 'Request Access';

export type StartupOverallVisibility = 'Public' | 'Limited' | 'Private' | 'Ghost Mode';

export interface StartupPrivacySettings {
  visibility: StartupOverallVisibility;
  isGhostMode: boolean;
  pitchDeck: FieldVisibility;
  finances: FieldVisibility;
  fundingDetails: FieldVisibility;
  contactInfo: FieldVisibility;
  teamInfo: FieldVisibility;
  ddLocker: 'Restricted' | 'Approved Users';
}

export const defaultStartupPrivacySettings: StartupPrivacySettings = {
  visibility: 'Public',
  isGhostMode: false,
  pitchDeck: 'Request Access',
  finances: 'Connections Only',
  fundingDetails: 'Public',
  contactInfo: 'Connections Only',
  teamInfo: 'Public',
  ddLocker: 'Restricted',
};

const OVERALL_VISIBILITY_KEY = 'xentro_startup_overall_visibility';
const GHOST_MODE_KEY = 'xentro_startup_ghost_mode';
const PRIVACY_SETTINGS_KEY = 'xentro_startup_privacy_settings';

export function getStartupOverallVisibility(): StartupOverallVisibility {
  if (typeof window === 'undefined') return 'Public';
  try {
    const val = localStorage.getItem(OVERALL_VISIBILITY_KEY) as StartupOverallVisibility;
    if (val && ['Public', 'Limited', 'Private', 'Ghost Mode'].includes(val)) {
      return val;
    }
    const ghost = localStorage.getItem(GHOST_MODE_KEY) === 'true';
    return ghost ? 'Ghost Mode' : 'Public';
  } catch {
    return 'Public';
  }
}

export function setStartupOverallVisibility(vis: StartupOverallVisibility): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OVERALL_VISIBILITY_KEY, vis);
    const isGhost = vis === 'Ghost Mode';
    localStorage.setItem(GHOST_MODE_KEY, String(isGhost));
    window.dispatchEvent(
      new CustomEvent('xentro-ghost-mode-changed', {
        detail: { isGhostMode: isGhost },
      })
    );
    window.dispatchEvent(
      new CustomEvent('xentro-visibility-changed', {
        detail: { visibility: vis },
      })
    );
  } catch (err) {
    console.error('Failed to save visibility state:', err);
  }
}

export function getStartupGhostMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const vis = getStartupOverallVisibility();
    return vis === 'Ghost Mode';
  } catch {
    return false;
  }
}

export function setStartupGhostMode(isGhost: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GHOST_MODE_KEY, String(isGhost));
    if (isGhost) {
      localStorage.setItem(OVERALL_VISIBILITY_KEY, 'Ghost Mode');
    } else {
      const currentVis = localStorage.getItem(OVERALL_VISIBILITY_KEY);
      if (currentVis === 'Ghost Mode') {
        localStorage.setItem(OVERALL_VISIBILITY_KEY, 'Public');
      }
    }
    window.dispatchEvent(
      new CustomEvent('xentro-ghost-mode-changed', {
        detail: { isGhostMode: isGhost },
      })
    );
    window.dispatchEvent(
      new CustomEvent('xentro-visibility-changed', {
        detail: { visibility: isGhost ? 'Ghost Mode' : 'Public' },
      })
    );
  } catch (err) {
    console.error('Failed to save ghost mode state:', err);
  }
}

export function getStartupPrivacySettings(): StartupPrivacySettings {
  if (typeof window === 'undefined') return defaultStartupPrivacySettings;
  try {
    const stored = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    const vis = getStartupOverallVisibility();
    const ghost = vis === 'Ghost Mode';
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultStartupPrivacySettings, ...parsed, visibility: vis, isGhostMode: ghost };
    }
    return { ...defaultStartupPrivacySettings, visibility: vis, isGhostMode: ghost };
  } catch {
    return defaultStartupPrivacySettings;
  }
}

export function saveStartupPrivacySettings(settings: Partial<StartupPrivacySettings>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStartupPrivacySettings();
    const updated = { ...current, ...settings };
    if (settings.isGhostMode !== undefined) {
      setStartupGhostMode(settings.isGhostMode);
    }
    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('xentro-privacy-settings-changed', {
        detail: { settings: updated },
      })
    );
  } catch (err) {
    console.error('Failed to save privacy settings:', err);
  }
}

const STARTUP_BANNER_KEY = 'xentro_startup_banner_image';
const STARTUP_AVATAR_KEY = 'xentro_startup_avatar_image';

export function getStartupBanner(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STARTUP_BANNER_KEY);
  } catch {
    return null;
  }
}

export function setStartupBanner(bannerUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (bannerUrl) {
      localStorage.setItem(STARTUP_BANNER_KEY, bannerUrl);
    } else {
      localStorage.removeItem(STARTUP_BANNER_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-startup-banner-changed', {
        detail: { banner: bannerUrl },
      })
    );
  } catch (err) {
    console.error('Failed to save banner:', err);
  }
}

export function getStartupAvatar(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STARTUP_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setStartupAvatar(avatarUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (avatarUrl) {
      localStorage.setItem(STARTUP_AVATAR_KEY, avatarUrl);
    } else {
      localStorage.removeItem(STARTUP_AVATAR_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-startup-avatar-changed', {
        detail: { avatar: avatarUrl },
      })
    );
  } catch (err) {
    console.error('Failed to save avatar:', err);
  }
}

/* ==================== PITCH VIDEO STATE ==================== */
const STARTUP_PITCH_VIDEO_KEY = 'xentro_startup_pitch_video';

export const defaultStartupPitchVideo: ElevatorPitchVideo = {
  videoUrl: '',
  thumbnailUrl: '',
  presenterName: 'Founder',
  presenterRole: 'Founder & CEO',
  duration: '0:00 min',
  lastUpdated: 'Recently',
};

export function getStartupPitchVideo(): ElevatorPitchVideo | null {
  if (typeof window === 'undefined') return defaultStartupPitchVideo;
  try {
    const raw = localStorage.getItem(STARTUP_PITCH_VIDEO_KEY);
    if (!raw) return defaultStartupPitchVideo;
    if (raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return defaultStartupPitchVideo;
  }
}

export function setStartupPitchVideo(video: ElevatorPitchVideo | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (video) {
      localStorage.setItem(STARTUP_PITCH_VIDEO_KEY, JSON.stringify(video));
    } else {
      localStorage.setItem(STARTUP_PITCH_VIDEO_KEY, 'null');
    }
    window.dispatchEvent(
      new CustomEvent('xentro-pitch-video-changed', {
        detail: { video },
      })
    );
  } catch (err) {
    console.error('Failed to save pitch video:', err);
  }
}

/* ==================== PITCH DECK STATE ==================== */
const STARTUP_PITCH_DECK_KEY = 'xentro_startup_pitch_deck';

export const defaultStartupPitchDeck: PitchDeckDoc = {
  title: 'Xentro_PreSeed_Deck_Q3_2026.pdf',
  fileName: 'Xentro_PreSeed_Deck_Q3_2026.pdf',
  fileSize: '4.2 MB',
  fileType: 'PDF',
  description: 'Series Pre-Seed investor presentation covering enterprise orchestration, architecture, and financial roadmap.',
  version: '2.4',
  lastUpdated: 'Sep 15, 2026',
  uploadedAt: 'Sep 15, 2026',
  updatedAt: 'Sep 15, 2026',
  slideCount: 14,
  visibility: 'Request Access',
  allowDownload: false,
  previewSlides: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  ],
};

export function getStartupPitchDeck(): PitchDeckDoc | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STARTUP_PITCH_DECK_KEY);
    // No uploaded deck yet => empty (demo deck is only for viewing showcase profiles)
    if (!raw) return null;
    if (raw === 'null' || raw === '""') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStartupPitchDeck(deck: PitchDeckDoc | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (deck) {
      localStorage.setItem(STARTUP_PITCH_DECK_KEY, JSON.stringify(deck));
    } else {
      localStorage.setItem(STARTUP_PITCH_DECK_KEY, 'null');
    }
    window.dispatchEvent(
      new CustomEvent('xentro-pitch-deck-changed', {
        detail: { deck },
      })
    );
  } catch (err) {
    console.error('Failed to save pitch deck:', err);
  }
}

export function uploadStartupPitchDeck(deck: PitchDeckDoc): PitchDeckDoc {
  setStartupPitchDeck(deck);
  return deck;
}

export function replaceStartupPitchDeck(deck: PitchDeckDoc): PitchDeckDoc {
  setStartupPitchDeck(deck);
  return deck;
}

export function updateStartupPitchDeckMetadata(metadata: Partial<PitchDeckDoc>): PitchDeckDoc | null {
  const current = getStartupPitchDeck();
  if (!current) return null;
  const nowFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const updated: PitchDeckDoc = {
    ...current,
    ...metadata,
    lastUpdated: nowFormatted,
    updatedAt: nowFormatted,
  };
  setStartupPitchDeck(updated);
  return updated;
}

export function removeStartupPitchDeck(): void {
  setStartupPitchDeck(null);
}

/* ==================== TEAM STATE ==================== */
const STARTUP_TEAM_KEY = 'xentro_startup_team_members';

export const defaultStartupTeamMembers: StartupTeamMember[] = [];

export function getStartupTeamMembers(): StartupTeamMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('xentro_startup_team_v1') || localStorage.getItem(STARTUP_TEAM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  let founderName = 'Founder';
  try {
    const prof = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
    if (prof) {
      const p = JSON.parse(prof);
      if (p.name) founderName = p.name;
    }
  } catch {}

  return [
    {
      id: 'tm_owner',
      name: founderName,
      role: 'Founder & CEO',
      roleCategory: 'founder',
      avatar: '/images/profile_avatar.webp',
      bio: 'Venture founder building via Xentro ecosystem.',
      isVerified: true,
      isFullTime: true,
      xentroProfile: '@founder',
    }
  ];
}

export function setStartupTeamMembers(members: StartupTeamMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_TEAM_KEY, JSON.stringify(members));
    localStorage.setItem('xentro_startup_team_v1', JSON.stringify(members));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-team-changed', {
        detail: { members },
      })
    );
  } catch (err) {
    console.error('Failed to save team members:', err);
  }
}

export function categorizeTeamMembers(members: StartupTeamMember[]) {
  const publicOnly = members.filter(
    (m) =>
      (m.publicProfileVisible === undefined || m.publicProfileVisible === true) &&
      m.entityMembershipStatus !== 'removed'
  );
  return {
    founders: publicOnly.filter(
      (m) =>
        m.teamCategory === 'founder' ||
        m.teamCategory === 'co_founder' ||
        m.roleCategory === 'founder'
    ),
    leadership: publicOnly.filter(
      (m) =>
        (m.teamCategory === 'leadership' || m.roleCategory === 'leadership') &&
        m.teamCategory !== 'founder' &&
        m.teamCategory !== 'co_founder'
    ),
    core: publicOnly.filter(
      (m) =>
        m.teamCategory === 'core_team' ||
        m.teamCategory === 'consultant' ||
        m.teamCategory === 'intern' ||
        m.teamCategory === 'contributor' ||
        m.roleCategory === 'core'
    ),
    advisors: publicOnly.filter(
      (m) =>
        m.teamCategory === 'advisor' ||
        m.teamCategory === 'mentor' ||
        m.roleCategory === 'advisor'
    ),
    former: publicOnly.filter((m) => m.entityMembershipStatus === 'former'),
  };
}

/* ==================== PROBLEM STATE ==================== */
const STARTUP_PROBLEM_KEY = 'xentro_startup_problem';

export const defaultStartupProblem: StartupProblem = {
  problemStatement: '',
  targetUsers: '',
  painPoints: [],
  whyItMatters: '',
  existingAlternatives: '',
};

export function getStartupProblem(): StartupProblem {
  if (typeof window === 'undefined') return defaultStartupProblem;
  try {
    const raw = localStorage.getItem(STARTUP_PROBLEM_KEY);
    if (!raw) return defaultStartupProblem;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.existingAlternatives?.includes('Collibra')) {
      localStorage.removeItem(STARTUP_PROBLEM_KEY);
      return defaultStartupProblem;
    }
    return { ...defaultStartupProblem, ...parsed };
  } catch {
    return defaultStartupProblem;
  }
}

export function setStartupProblem(problem: StartupProblem): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_PROBLEM_KEY, JSON.stringify(problem));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-problem-changed', {
        detail: { problem },
      })
    );
  } catch (err) {
    console.error('Failed to save startup problem:', err);
  }
}

/* ==================== SOLUTION STATE ==================== */
const STARTUP_SOLUTION_KEY = 'xentro_startup_solution';

export const defaultStartupSolution: StartupSolution = {
  overview: '',
  howItSolves: '',
  coreValueProp: '',
  keyDifferentiators: [],
};

export function getStartupSolution(): StartupSolution {
  if (typeof window === 'undefined') return defaultStartupSolution;
  try {
    const raw = localStorage.getItem(STARTUP_SOLUTION_KEY);
    if (!raw) return defaultStartupSolution;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.howItSolves?.includes('Kinetix') || parsed.overview?.includes('Kinetix'))) {
      localStorage.removeItem(STARTUP_SOLUTION_KEY);
      return defaultStartupSolution;
    }
    return { ...defaultStartupSolution, ...parsed };
  } catch {
    return defaultStartupSolution;
  }
}

export function setStartupSolution(solution: StartupSolution): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_SOLUTION_KEY, JSON.stringify(solution));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-solution-changed', {
        detail: { solution },
      })
    );
  } catch (err) {
    console.error('Failed to save startup solution:', err);
  }
}

/* ==================== PRODUCT STATE ==================== */
const STARTUP_PRODUCT_KEY = 'xentro_startup_product';

export const defaultStartupProduct: StartupProduct = {
  name: '',
  category: '',
  description: '',
  status: 'Prototype',
  keyFeatures: [],
  screenshots: [],
  demoLink: '',
  productWebsite: '',
};

export function getStartupProduct(): StartupProduct {
  if (typeof window === 'undefined') return defaultStartupProduct;
  try {
    const raw = localStorage.getItem(STARTUP_PRODUCT_KEY);
    if (!raw) return defaultStartupProduct;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.name?.includes('Kinetix') || parsed.demoLink?.includes('kinetix'))) {
      localStorage.removeItem(STARTUP_PRODUCT_KEY);
      return defaultStartupProduct;
    }
    return { ...defaultStartupProduct, ...parsed };
  } catch {
    return defaultStartupProduct;
  }
}

export function setStartupProduct(product: StartupProduct): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_PRODUCT_KEY, JSON.stringify(product));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-product-changed', {
        detail: { product },
      })
    );
  } catch (err) {
    console.error('Failed to save startup product:', err);
  }
}

/* ==================== COMPANY INFO STATE ==================== */
const STARTUP_COMPANY_INFO_KEY = 'xentro_startup_company_info';

export const defaultStartupCompanyInfo: StartupCompanyInfo = {
  legalName: 'Venture Entity',
  incorporationStatus: 'Early Stage / Active',
  incorporationDate: '2026',
  registeredLocation: 'India',
  isDPIITRecognised: false,
  dpiitNumberMasked: 'Pending Verification',
  isMSMERegistered: false,
  msmeNumberMasked: 'Not Registered',
  cinMasked: 'Not Registered',
  gstMasked: 'Not Registered',
  incubatorAffiliation: 'Xentro Cohort',
};

export function getStartupCompanyInfo(): StartupCompanyInfo {
  if (typeof window === 'undefined') return defaultStartupCompanyInfo;
  try {
    const raw = localStorage.getItem(STARTUP_COMPANY_INFO_KEY);
    if (raw) return { ...defaultStartupCompanyInfo, ...JSON.parse(raw) };
  } catch {}

  let startupName = '';
  let location = '';
  let regNo = '';
  let regType = 'Pvt Ltd';
  try {
    const rawEntities = localStorage.getItem('xentro_startup_entities');
    if (rawEntities) {
      const parsed = JSON.parse(rawEntities);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ent = parsed[parsed.length - 1];
        startupName = ent.startupName || '';
        location = ent.location || '';
        regNo = ent.regNo || '';
        regType = ent.regType || 'Pvt Ltd';
      }
    }
    if (!startupName) {
      const prof = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
      if (prof) {
        const p = JSON.parse(prof);
        startupName = p.organization || `${p.name}'s Venture`;
        location = p.location || '';
      }
    }
  } catch {}

  return {
    legalName: startupName || 'New Venture',
    incorporationStatus: regNo ? `Incorporated (${regType})` : 'Early Stage',
    incorporationDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    registeredLocation: location || 'India',
    isDPIITRecognised: false,
    dpiitNumberMasked: 'Pending Verification',
    isMSMERegistered: regType === 'MSME',
    msmeNumberMasked: regType === 'MSME' && regNo ? regNo : 'Not Registered',
    cinMasked: regType === 'Pvt Ltd' && regNo ? regNo : 'Not Registered',
    gstMasked: 'Not Registered',
    incubatorAffiliation: 'Xentro Ecosystem Cohort',
  };
}

export function setStartupCompanyInfo(companyInfo: StartupCompanyInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_COMPANY_INFO_KEY, JSON.stringify(companyInfo));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-company-info-changed', {
        detail: { companyInfo },
      })
    );
  } catch (err) {
    console.error('Failed to save startup company info:', err);
  }
}

/* ==================== MARKET STATE ==================== */
const STARTUP_MARKET_KEY = 'xentro_startup_market';

export const defaultStartupMarket: StartupMarket = {
  targetCustomer: '',
  primarySegment: '',
  secondarySegment: '',
  businessModelCategory: '',
  targetGeography: [],
  marketOpportunity: '',
  tam: '',
  sam: '',
  som: '',
  competitiveLandscape: '',
};

export function getStartupMarket(): StartupMarket {
  if (typeof window === 'undefined') return defaultStartupMarket;
  try {
    const raw = localStorage.getItem(STARTUP_MARKET_KEY);
    if (!raw) return defaultStartupMarket;
    return { ...defaultStartupMarket, ...JSON.parse(raw) };
  } catch {
    return defaultStartupMarket;
  }
}

export function setStartupMarket(market: StartupMarket): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_MARKET_KEY, JSON.stringify(market));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-market-changed', {
        detail: { market },
      })
    );
  } catch (err) {
    console.error('Failed to save startup market:', err);
  }
}

/* ==================== BUSINESS MODEL STATE ==================== */
const STARTUP_BUSINESS_MODEL_KEY = 'xentro_startup_business_model';

export const defaultStartupBusinessModel: StartupBusinessModel = {
  businessModel: '',
  revenueModel: '',
  pricingModel: '',
  revenueStreams: [],
  customerType: '',
  salesModel: '',
};

export function getStartupBusinessModel(): StartupBusinessModel {
  if (typeof window === 'undefined') return defaultStartupBusinessModel;
  try {
    const raw = localStorage.getItem(STARTUP_BUSINESS_MODEL_KEY);
    if (!raw) return defaultStartupBusinessModel;
    return { ...defaultStartupBusinessModel, ...JSON.parse(raw) };
  } catch {
    return defaultStartupBusinessModel;
  }
}

export function setStartupBusinessModel(businessModel: StartupBusinessModel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARTUP_BUSINESS_MODEL_KEY, JSON.stringify(businessModel));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-business-model-changed', {
        detail: { businessModel },
      })
    );
  } catch (err) {
    console.error('Failed to save startup business model:', err);
  }
}

export interface StartupBasicInfo {
  startupName: string;
  tagline: string;
  logo: string;
  stage: string;
  industry: string;
  subSector: string;
  businessModel: string;
  foundedYear: string;
  headquarters: string;
  operatingGeography: string;
  website: string;
  linkedin?: string;
  overview: string;
  unsdgs: string;
  impactAreas: string;
}

export const defaultStartupBasicInfo: StartupBasicInfo = {
  startupName: '',
  tagline: '',
  logo: '/xentro-logo.png',
  stage: '',
  industry: '',
  subSector: '',
  businessModel: '',
  foundedYear: '',
  headquarters: '',
  operatingGeography: '',
  website: '',
  linkedin: '',
  overview: '',
  unsdgs: '',
  impactAreas: '',
};

const BASIC_INFO_KEY = 'xentro_startup_basic_info';

export function getStartupBasicInfo(): StartupBasicInfo {
  if (typeof window === 'undefined') return defaultStartupBasicInfo;
  try {
    const raw = localStorage.getItem(BASIC_INFO_KEY);
    if (!raw) return defaultStartupBasicInfo;
    return { ...defaultStartupBasicInfo, ...JSON.parse(raw) };
  } catch {
    return defaultStartupBasicInfo;
  }
}

export function setStartupBasicInfo(info: StartupBasicInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BASIC_INFO_KEY, JSON.stringify(info));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-basic-info-changed', {
        detail: { basicInfo: info },
      })
    );
  } catch (err) {
    console.error('Failed to save startup basic info:', err);
  }
}

