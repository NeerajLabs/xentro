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
import { entityContextService } from './entityContextService';

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
const STARTUP_BANNER_KEY = 'xentro_startup_banner_image';
const STARTUP_AVATAR_KEY = 'xentro_startup_avatar_image';
const STARTUP_PITCH_VIDEO_KEY = 'xentro_startup_pitch_video';
const STARTUP_PITCH_DECK_KEY = 'xentro_startup_pitch_deck';
const STARTUP_TEAM_KEY = 'xentro_startup_team_members';
const STARTUP_PROBLEM_KEY = 'xentro_startup_problem';
const STARTUP_SOLUTION_KEY = 'xentro_startup_solution';
const STARTUP_PRODUCT_KEY = 'xentro_startup_product';
const STARTUP_COMPANY_INFO_KEY = 'xentro_startup_company_info';
const STARTUP_MARKET_KEY = 'xentro_startup_market';
const STARTUP_BUSINESS_MODEL_KEY = 'xentro_startup_business_model';
const BASIC_INFO_KEY = 'xentro_startup_basic_info';

/* ==================== MULTI-ENTITY HELPERS ==================== */

function getActiveEntityId(): string | null {
  if (typeof window === 'undefined') return null;
  return entityContextService.getActiveEntityId();
}

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const prof = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
    if (prof) {
      const p = JSON.parse(prof);
      return p.id || p.userId || p.email || '';
    }
  } catch {}
  return '';
}

function getScopedKey(baseKey: string, entityId?: string | null): string {
  const eid = entityId !== undefined ? entityId : getActiveEntityId();
  return eid ? `${baseKey}_${eid}` : baseKey;
}

function getStoredValue(baseKey: string, entityId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const eid = entityId !== undefined ? entityId : getActiveEntityId();
    if (eid) {
      const scopedVal = localStorage.getItem(`${baseKey}_${eid}`);
      if (scopedVal !== null && scopedVal !== undefined) return scopedVal;
    }
    return localStorage.getItem(baseKey);
  } catch {
    return null;
  }
}

function setStoredValue(baseKey: string, value: string, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const eid = entityId !== undefined ? entityId : getActiveEntityId();
    if (eid) {
      localStorage.setItem(`${baseKey}_${eid}`, value);
    }
    // Also keep legacy store in sync for backward compatibility
    localStorage.setItem(baseKey, value);
  } catch (err) {
    console.error(`Failed to store ${baseKey}:`, err);
  }
}

/**
 * Dispatches targeted atomic updates to MongoDB Atlas backend asynchronously.
 */
async function syncToBackend(patch: Record<string, any>, targetEntityId?: string | null) {
  if (typeof window === 'undefined') return;
  const eid = targetEntityId !== undefined ? targetEntityId : getActiveEntityId();
  if (!eid) return;

  try {
    const userId = getUserId();
    await fetch(`/api/startups/${eid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        ...patch,
        userId,
      }),
    });
  } catch (err) {
    console.warn('[StartupProfileState] Background sync to MongoDB failed (will retry):', err);
  }
}

/* ==================== OVERALL VISIBILITY & GHOST MODE ==================== */

export function getStartupOverallVisibility(entityId?: string | null): StartupOverallVisibility {
  if (typeof window === 'undefined') return 'Public';
  try {
    const val = getStoredValue(OVERALL_VISIBILITY_KEY, entityId) as StartupOverallVisibility;
    if (val && ['Public', 'Limited', 'Private', 'Ghost Mode'].includes(val)) {
      return val;
    }
    const ghost = getStoredValue(GHOST_MODE_KEY, entityId) === 'true';
    return ghost ? 'Ghost Mode' : 'Public';
  } catch {
    return 'Public';
  }
}

export function setStartupOverallVisibility(vis: StartupOverallVisibility, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(OVERALL_VISIBILITY_KEY, vis, entityId);
    const isGhost = vis === 'Ghost Mode';
    setStoredValue(GHOST_MODE_KEY, String(isGhost), entityId);

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

    syncToBackend({ visibility: vis }, entityId);
  } catch (err) {
    console.error('Failed to save visibility state:', err);
  }
}

export function getStartupGhostMode(entityId?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const vis = getStartupOverallVisibility(entityId);
    return vis === 'Ghost Mode';
  } catch {
    return false;
  }
}

export function setStartupGhostMode(isGhost: boolean, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(GHOST_MODE_KEY, String(isGhost), entityId);
    if (isGhost) {
      setStoredValue(OVERALL_VISIBILITY_KEY, 'Ghost Mode', entityId);
    } else {
      const currentVis = getStoredValue(OVERALL_VISIBILITY_KEY, entityId);
      if (currentVis === 'Ghost Mode') {
        setStoredValue(OVERALL_VISIBILITY_KEY, 'Public', entityId);
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

    syncToBackend({ visibility: isGhost ? 'Ghost Mode' : 'Public' }, entityId);
  } catch (err) {
    console.error('Failed to save ghost mode state:', err);
  }
}

export function getStartupPrivacySettings(entityId?: string | null): StartupPrivacySettings {
  if (typeof window === 'undefined') return defaultStartupPrivacySettings;
  try {
    const stored = getStoredValue(PRIVACY_SETTINGS_KEY, entityId);
    const vis = getStartupOverallVisibility(entityId);
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

export function saveStartupPrivacySettings(settings: Partial<StartupPrivacySettings>, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStartupPrivacySettings(entityId);
    const updated = { ...current, ...settings };
    if (settings.isGhostMode !== undefined) {
      setStartupGhostMode(settings.isGhostMode, entityId);
    }
    setStoredValue(PRIVACY_SETTINGS_KEY, JSON.stringify(updated), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-privacy-settings-changed', {
        detail: { settings: updated },
      })
    );
    if (updated.visibility) {
      syncToBackend({ visibility: updated.visibility }, entityId);
    }
  } catch (err) {
    console.error('Failed to save privacy settings:', err);
  }
}

/* ==================== BANNER & AVATAR ==================== */

export function getStartupBanner(entityId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return getStoredValue(STARTUP_BANNER_KEY, entityId);
}

export function setStartupBanner(bannerUrl: string | null, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (bannerUrl) {
      setStoredValue(STARTUP_BANNER_KEY, bannerUrl, entityId);
    } else {
      const eid = entityId !== undefined ? entityId : getActiveEntityId();
      if (eid) localStorage.removeItem(`${STARTUP_BANNER_KEY}_${eid}`);
      localStorage.removeItem(STARTUP_BANNER_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-startup-banner-changed', {
        detail: { banner: bannerUrl },
      })
    );
    syncToBackend({ identity: { banner: bannerUrl } }, entityId);
  } catch (err) {
    console.error('Failed to save banner:', err);
  }
}

export function getStartupAvatar(entityId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return getStoredValue(STARTUP_AVATAR_KEY, entityId);
}

export function setStartupAvatar(avatarUrl: string | null, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (avatarUrl) {
      setStoredValue(STARTUP_AVATAR_KEY, avatarUrl, entityId);
    } else {
      const eid = entityId !== undefined ? entityId : getActiveEntityId();
      if (eid) localStorage.removeItem(`${STARTUP_AVATAR_KEY}_${eid}`);
      localStorage.removeItem(STARTUP_AVATAR_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-startup-avatar-changed', {
        detail: { avatar: avatarUrl },
      })
    );
    syncToBackend({ identity: { logo: avatarUrl } }, entityId);
  } catch (err) {
    console.error('Failed to save avatar:', err);
  }
}

/* ==================== PITCH VIDEO STATE ==================== */

export const defaultStartupPitchVideo: ElevatorPitchVideo = {
  videoUrl: '',
  thumbnailUrl: '',
  presenterName: 'Founder',
  presenterRole: 'Founder & CEO',
  duration: '0:00 min',
  lastUpdated: 'Recently',
};

export function getStartupPitchVideo(entityId?: string | null): ElevatorPitchVideo | null {
  if (typeof window === 'undefined') return defaultStartupPitchVideo;
  try {
    const raw = getStoredValue(STARTUP_PITCH_VIDEO_KEY, entityId);
    if (!raw) return defaultStartupPitchVideo;
    if (raw === 'null') return null;
    return JSON.parse(raw);
  } catch {
    return defaultStartupPitchVideo;
  }
}

export function setStartupPitchVideo(video: ElevatorPitchVideo | null, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (video) {
      setStoredValue(STARTUP_PITCH_VIDEO_KEY, JSON.stringify(video), entityId);
    } else {
      setStoredValue(STARTUP_PITCH_VIDEO_KEY, 'null', entityId);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-pitch-video-changed', {
        detail: { video },
      })
    );
    syncToBackend({ pitchVideo: video }, entityId);
  } catch (err) {
    console.error('Failed to save pitch video:', err);
  }
}

/* ==================== PITCH DECK STATE ==================== */

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

export function getStartupPitchDeck(entityId?: string | null): PitchDeckDoc | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = getStoredValue(STARTUP_PITCH_DECK_KEY, entityId);
    if (!raw || raw === 'null' || raw === '""') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStartupPitchDeck(deck: PitchDeckDoc | null, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (deck) {
      setStoredValue(STARTUP_PITCH_DECK_KEY, JSON.stringify(deck), entityId);
    } else {
      setStoredValue(STARTUP_PITCH_DECK_KEY, 'null', entityId);
    }
    window.dispatchEvent(
      new CustomEvent('xentro-pitch-deck-changed', {
        detail: { deck },
      })
    );
    syncToBackend({ pitchDeck: deck }, entityId);
  } catch (err) {
    console.error('Failed to save pitch deck:', err);
  }
}

export function uploadStartupPitchDeck(deck: PitchDeckDoc, entityId?: string | null): PitchDeckDoc {
  setStartupPitchDeck(deck, entityId);
  return deck;
}

export function replaceStartupPitchDeck(deck: PitchDeckDoc, entityId?: string | null): PitchDeckDoc {
  setStartupPitchDeck(deck, entityId);
  return deck;
}

export function updateStartupPitchDeckMetadata(metadata: Partial<PitchDeckDoc>, entityId?: string | null): PitchDeckDoc | null {
  const current = getStartupPitchDeck(entityId);
  if (!current) return null;
  const nowFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const updated: PitchDeckDoc = {
    ...current,
    ...metadata,
    lastUpdated: nowFormatted,
    updatedAt: nowFormatted,
  };
  setStartupPitchDeck(updated, entityId);
  return updated;
}

export function removeStartupPitchDeck(entityId?: string | null): void {
  setStartupPitchDeck(null, entityId);
}

/* ==================== TEAM STATE ==================== */

export const defaultStartupTeamMembers: StartupTeamMember[] = [];

export function getStartupTeamMembers(entityId?: string | null): StartupTeamMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = getStoredValue('xentro_startup_team_v1', entityId) || getStoredValue(STARTUP_TEAM_KEY, entityId);
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
    },
  ];
}

export function setStartupTeamMembers(members: StartupTeamMember[], entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_TEAM_KEY, JSON.stringify(members), entityId);
    setStoredValue('xentro_startup_team_v1', JSON.stringify(members), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-team-changed', {
        detail: { members },
      })
    );
    const categorized = categorizeTeamMembers(members);
    syncToBackend({ publicTeam: categorized }, entityId);
  } catch (err) {
    console.error('Failed to save team members:', err);
  }
}

export function categorizeTeamMembers(members: StartupTeamMember[]) {
  const safeMembers = Array.isArray(members) ? members : [];
  const publicOnly = safeMembers.filter(
    (m) =>
      m &&
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

export const defaultStartupProblem: StartupProblem = {
  problemStatement: '',
  targetUsers: '',
  painPoints: [],
  whyItMatters: '',
  existingAlternatives: '',
};

export function getStartupProblem(entityId?: string | null): StartupProblem {
  if (typeof window === 'undefined') return defaultStartupProblem;
  try {
    const raw = getStoredValue(STARTUP_PROBLEM_KEY, entityId);
    if (!raw) return defaultStartupProblem;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.existingAlternatives?.includes('Collibra')) {
      const eid = entityId !== undefined ? entityId : getActiveEntityId();
      if (eid) localStorage.removeItem(`${STARTUP_PROBLEM_KEY}_${eid}`);
      localStorage.removeItem(STARTUP_PROBLEM_KEY);
      return defaultStartupProblem;
    }
    return { ...defaultStartupProblem, ...parsed };
  } catch {
    return defaultStartupProblem;
  }
}

export function setStartupProblem(problem: StartupProblem, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_PROBLEM_KEY, JSON.stringify(problem), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-problem-changed', {
        detail: { problem },
      })
    );
    syncToBackend({ problem }, entityId);
  } catch (err) {
    console.error('Failed to save startup problem:', err);
  }
}

/* ==================== SOLUTION STATE ==================== */

export const defaultStartupSolution: StartupSolution = {
  overview: '',
  howItSolves: '',
  coreValueProp: '',
  keyDifferentiators: [],
};

export function getStartupSolution(entityId?: string | null): StartupSolution {
  if (typeof window === 'undefined') return defaultStartupSolution;
  try {
    const raw = getStoredValue(STARTUP_SOLUTION_KEY, entityId);
    if (!raw) return defaultStartupSolution;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.howItSolves?.includes('Kinetix') || parsed.overview?.includes('Kinetix'))) {
      const eid = entityId !== undefined ? entityId : getActiveEntityId();
      if (eid) localStorage.removeItem(`${STARTUP_SOLUTION_KEY}_${eid}`);
      localStorage.removeItem(STARTUP_SOLUTION_KEY);
      return defaultStartupSolution;
    }
    return { ...defaultStartupSolution, ...parsed };
  } catch {
    return defaultStartupSolution;
  }
}

export function setStartupSolution(solution: StartupSolution, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_SOLUTION_KEY, JSON.stringify(solution), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-solution-changed', {
        detail: { solution },
      })
    );
    syncToBackend({ solution }, entityId);
  } catch (err) {
    console.error('Failed to save startup solution:', err);
  }
}

/* ==================== PRODUCT STATE ==================== */

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

export function getStartupProduct(entityId?: string | null): StartupProduct {
  if (typeof window === 'undefined') return defaultStartupProduct;
  try {
    const raw = getStoredValue(STARTUP_PRODUCT_KEY, entityId);
    if (!raw) return defaultStartupProduct;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.name?.includes('Kinetix') || parsed.demoLink?.includes('kinetix'))) {
      const eid = entityId !== undefined ? entityId : getActiveEntityId();
      if (eid) localStorage.removeItem(`${STARTUP_PRODUCT_KEY}_${eid}`);
      localStorage.removeItem(STARTUP_PRODUCT_KEY);
      return defaultStartupProduct;
    }
    return { ...defaultStartupProduct, ...parsed };
  } catch {
    return defaultStartupProduct;
  }
}

export function setStartupProduct(product: StartupProduct, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_PRODUCT_KEY, JSON.stringify(product), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-product-changed', {
        detail: { product },
      })
    );
    syncToBackend({ product }, entityId);
  } catch (err) {
    console.error('Failed to save startup product:', err);
  }
}

/* ==================== COMPANY INFO STATE ==================== */

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

export function getStartupCompanyInfo(entityId?: string | null): StartupCompanyInfo {
  if (typeof window === 'undefined') return defaultStartupCompanyInfo;
  try {
    const raw = getStoredValue(STARTUP_COMPANY_INFO_KEY, entityId);
    if (raw) return { ...defaultStartupCompanyInfo, ...JSON.parse(raw) };
  } catch {}

  let startupName = '';
  let location = '';
  let regNo = '';
  let regType = 'Pvt Ltd';
  try {
    const active = entityContextService.getActiveEntity();
    if (active && active.name) {
      startupName = active.name;
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

export function setStartupCompanyInfo(companyInfo: StartupCompanyInfo, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_COMPANY_INFO_KEY, JSON.stringify(companyInfo), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-company-info-changed', {
        detail: { companyInfo },
      })
    );
    syncToBackend({ companyInfo }, entityId);
  } catch (err) {
    console.error('Failed to save startup company info:', err);
  }
}

/* ==================== MARKET STATE ==================== */

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

export function getStartupMarket(entityId?: string | null): StartupMarket {
  if (typeof window === 'undefined') return defaultStartupMarket;
  try {
    const raw = getStoredValue(STARTUP_MARKET_KEY, entityId);
    if (!raw) return defaultStartupMarket;
    return { ...defaultStartupMarket, ...JSON.parse(raw) };
  } catch {
    return defaultStartupMarket;
  }
}

export function setStartupMarket(market: StartupMarket, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_MARKET_KEY, JSON.stringify(market), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-market-changed', {
        detail: { market },
      })
    );
    syncToBackend({ market }, entityId);
  } catch (err) {
    console.error('Failed to save startup market:', err);
  }
}

/* ==================== BUSINESS MODEL STATE ==================== */

export const defaultStartupBusinessModel: StartupBusinessModel = {
  businessModel: '',
  revenueModel: '',
  pricingModel: '',
  revenueStreams: [],
  customerType: '',
  salesModel: '',
};

export function getStartupBusinessModel(entityId?: string | null): StartupBusinessModel {
  if (typeof window === 'undefined') return defaultStartupBusinessModel;
  try {
    const raw = getStoredValue(STARTUP_BUSINESS_MODEL_KEY, entityId);
    if (!raw) return defaultStartupBusinessModel;
    return { ...defaultStartupBusinessModel, ...JSON.parse(raw) };
  } catch {
    return defaultStartupBusinessModel;
  }
}

export function setStartupBusinessModel(businessModel: StartupBusinessModel, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(STARTUP_BUSINESS_MODEL_KEY, JSON.stringify(businessModel), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-business-model-changed', {
        detail: { businessModel },
      })
    );
    syncToBackend({ businessModel }, entityId);
  } catch (err) {
    console.error('Failed to save startup business model:', err);
  }
}

/* ==================== BASIC INFO STATE ==================== */

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

export function getStartupBasicInfo(entityId?: string | null): StartupBasicInfo {
  if (typeof window === 'undefined') return defaultStartupBasicInfo;
  try {
    const raw = getStoredValue(BASIC_INFO_KEY, entityId);
    if (raw) return { ...defaultStartupBasicInfo, ...JSON.parse(raw) };
  } catch {}

  const active = entityContextService.getActiveEntity();
  if (active) {
    return {
      ...defaultStartupBasicInfo,
      startupName: active.name || '',
      tagline: active.pitch || '',
      logo: active.logo || '/xentro-logo.png',
      stage: active.stage || 'MVP',
      industry: active.sector || 'Technology & Innovation',
      website: active.website || '',
    };
  }

  return defaultStartupBasicInfo;
}

export function setStartupBasicInfo(info: StartupBasicInfo, entityId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    setStoredValue(BASIC_INFO_KEY, JSON.stringify(info), entityId);
    window.dispatchEvent(
      new CustomEvent('xentro-startup-basic-info-changed', {
        detail: { basicInfo: info },
      })
    );

    // Sync mapped identity & overview directly to MongoDB Atlas
    syncToBackend(
      {
        identity: {
          name: info.startupName,
          tagline: info.tagline,
          logo: info.logo,
          stage: info.stage,
          industry: info.industry,
          subSector: info.subSector,
          businessModelType: info.businessModel,
          foundedYear: info.foundedYear,
          location: info.headquarters,
          operatingGeography: info.operatingGeography ? [info.operatingGeography] : [],
          website: info.website,
          linkedin: info.linkedin,
        },
        overview: {
          whatItDoes: info.overview,
          coreValueProp: info.tagline,
          currentStage: info.stage,
        },
      },
      entityId
    );
  } catch (err) {
    console.error('Failed to save startup basic info:', err);
  }
}

/* ==================== MONGODB ATLAS SYNCHRONIZATION ENGINE ==================== */

/**
 * Fetches authoritative profile from MongoDB Atlas for the given entityId,
 * populates the entity-scoped localStorage cache, and notifies all UI views.
 */
export async function syncStartupProfileFromBackend(targetEntityId?: string | null): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const eid = targetEntityId !== undefined ? targetEntityId : getActiveEntityId();
  if (!eid) return false;

  try {
    const userId = getUserId();
    const res = await fetch(`/api/startups/${eid}?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (!res.ok) return false;
    const json = await res.json();
    if (!json.success || !json.data) return false;

    const data = json.data;

    // 1. Identity & Basic Info
    if (data.identity) {
      const basicInfo: StartupBasicInfo = {
        startupName: data.identity.name || '',
        tagline: data.identity.tagline || '',
        logo: data.identity.logo || '/xentro-logo.png',
        stage: data.identity.stage || '',
        industry: data.identity.industry || '',
        subSector: data.identity.subSector || '',
        businessModel: data.identity.businessModelType || '',
        foundedYear: String(data.identity.foundedYear || ''),
        headquarters: data.identity.location || '',
        operatingGeography: Array.isArray(data.identity.operatingGeography)
          ? data.identity.operatingGeography.join(', ')
          : '',
        website: data.identity.website || '',
        linkedin: data.identity.linkedin || '',
        overview: data.overview?.whatItDoes || '',
        unsdgs: Array.isArray(data.unsdg) ? data.unsdg.join(', ') : '',
        impactAreas: '',
      };
      setStoredValue(BASIC_INFO_KEY, JSON.stringify(basicInfo), eid);
      if (data.identity.banner) {
        setStoredValue(STARTUP_BANNER_KEY, data.identity.banner, eid);
      }
      if (data.identity.logo) {
        setStoredValue(STARTUP_AVATAR_KEY, data.identity.logo, eid);
      }
    }

    // 2. Sections
    if (data.problem) setStoredValue(STARTUP_PROBLEM_KEY, JSON.stringify(data.problem), eid);
    if (data.solution) setStoredValue(STARTUP_SOLUTION_KEY, JSON.stringify(data.solution), eid);
    if (data.product) setStoredValue(STARTUP_PRODUCT_KEY, JSON.stringify(data.product), eid);
    if (data.companyInfo) setStoredValue(STARTUP_COMPANY_INFO_KEY, JSON.stringify(data.companyInfo), eid);
    if (data.market) setStoredValue(STARTUP_MARKET_KEY, JSON.stringify(data.market), eid);
    if (data.businessModel) setStoredValue(STARTUP_BUSINESS_MODEL_KEY, JSON.stringify(data.businessModel), eid);
    if (data.pitchVideo) setStoredValue(STARTUP_PITCH_VIDEO_KEY, JSON.stringify(data.pitchVideo), eid);
    if (data.pitchDeck) setStoredValue(STARTUP_PITCH_DECK_KEY, JSON.stringify(data.pitchDeck), eid);
    if (data.visibility) {
      setStoredValue(OVERALL_VISIBILITY_KEY, data.visibility, eid);
      setStoredValue(GHOST_MODE_KEY, String(data.visibility === 'Ghost Mode'), eid);
    }

    // Emit events so all listening components re-render with authoritative data
    window.dispatchEvent(new CustomEvent('xentro-startup-basic-info-changed', { detail: { basicInfo: getStartupBasicInfo(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-problem-changed', { detail: { problem: getStartupProblem(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-solution-changed', { detail: { solution: getStartupSolution(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-product-changed', { detail: { product: getStartupProduct(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-company-info-changed', { detail: { companyInfo: getStartupCompanyInfo(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-market-changed', { detail: { market: getStartupMarket(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-startup-business-model-changed', { detail: { businessModel: getStartupBusinessModel(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-pitch-video-changed', { detail: { video: getStartupPitchVideo(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-pitch-deck-changed', { detail: { deck: getStartupPitchDeck(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-visibility-changed', { detail: { visibility: getStartupOverallVisibility(eid) } }));
    window.dispatchEvent(new CustomEvent('xentro-ghost-mode-changed', { detail: { isGhostMode: getStartupGhostMode(eid) } }));

    return true;
  } catch (err) {
    console.warn('[StartupProfileState] Failed to fetch profile from MongoDB:', err);
    return false;
  }
}

// Global browser listeners to automatically synchronize whenever entity switches
if (typeof window !== 'undefined') {
  window.addEventListener('xentro-active-entity-changed', (e: Event) => {
    const ce = e as CustomEvent;
    if (ce.detail?.entityId) {
      syncStartupProfileFromBackend(ce.detail.entityId);
    }
  });

  // Initial sync on startup
  setTimeout(() => {
    const currentId = entityContextService.getActiveEntityId();
    if (currentId) {
      syncStartupProfileFromBackend(currentId);
    }
  }, 100);
}
