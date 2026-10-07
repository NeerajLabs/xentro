'use client';

import {
  FullInvestorProfile,
  PortfolioCompany,
  InvestorTestimonial,
  InvestmentProcessStep,
} from '@/types/investor';
import { investorProfilesMap } from '@/data/investorProfilesData';
import { investorDomainService } from '@/lib/investorDomainService';

export const INVESTOR_PROFILE_STORAGE_KEY = 'xentro_investor_full_profile_v1';
export const INVESTOR_PROFILE_UPDATED_EVENT = 'xentro-investor-profile-updated';

/** Own-profile shell: same shape as the demo record with user's genuine credentials and NO fake demo data. */
function emptyOwnInvestorProfile(base: FullInvestorProfile): FullInvestorProfile {
  let ownName = '';
  let ownEmail = '';
  let ownRoleTitle = 'Angel Investor';
  let ownOrg = 'Individual Investor';
  let ownAvatar = '/xentro-logo.png';

  if (typeof window !== 'undefined') {
    try {
      const storedUserRaw = localStorage.getItem('xentro_user_profile');
      if (storedUserRaw) {
        const u = JSON.parse(storedUserRaw);
        if (u.name) ownName = u.name;
        if (u.email) ownEmail = u.email;
        if (u.roleTitle) ownRoleTitle = u.roleTitle;
        if (u.organization) ownOrg = u.organization;
        if (u.avatar) ownAvatar = u.avatar;
      }
      const personalRaw = localStorage.getItem('xentro_personal_profile');
      if (personalRaw) {
        const p = JSON.parse(personalRaw);
        if (!ownName && p.fullName) ownName = p.fullName;
        if (!ownEmail && p.email) ownEmail = p.email;
      }
    } catch {}
  }

  return {
    ...base,
    id: 'inv_own',
    name: ownName,
    logo: ownAvatar,
    banner: '',
    investorType: 'Angel Investor',
    currentRole: ownRoleTitle,
    organization: ownOrg,
    location: { city: '', state: '', country: 'India' },
    website: '',
    linkedIn: '',
    verified: false,
    primaryInvestmentFocus: '',
    bio: '',
    background: '',
    yearsOfInvestingExperience: '',
    overview: { whoTheyInvestIn: '', sectorsFocus: '', investmentPhilosophy: '', aimToContribute: '' },
    investmentFocus: {
      ...base.investmentFocus,
      sectors: [],
      stages: [],
      geography: { countries: ['India'], regions: [], cities: [] },
      businessModels: [],
      ticketSize: { min: '', max: '', formatted: '' },
      leadInvestorPreference: '',
      coInvestorPreference: '',
      investmentInstruments: [],
    },
    valueBeyondCapital: {
      ...base.valueBeyondCapital,
      supportAreas: [],
      whatIBringToFounders: '',
      advisoryCapabilities: [],
    },
    investmentCriteria: {
      ...base.investmentCriteria,
      evaluationCriteria: [],
      preferredTraction: [],
      diligenceHighlights: [],
    },
    investmentProcess: {
      ...base.investmentProcess,
      stages: [],
      preferredConnectionMethod: '',
      informationRequiredInitially: [],
      typicalDecisionTimeline: '',
      pitchDeckRequirements: '',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: false,
    },
    connectionPreferences: {
      ...base.connectionPreferences,
      openToConnectionRequests: false,
      openToStartupPitches: false,
      introductionPreferred: false,
      currentlyInvesting: false,
      notAcceptingNewPitches: false,
      guidelines: '',
    },
    portfolio: [],
    testimonials: [],
    content: [],
    activities: [],
  };
}

/**
 * Retrieves the stored investor profile from localStorage, merged safely with default data.
 * Pass `{ ownProfile: true }` for the signed-in investor's own view: the demo record
 * (Sequoia) is only used when browsing OTHER people's profiles.
 */
export function getStoredInvestorProfile(
  investorId: string = 'inv_1',
  opts?: { ownProfile?: boolean }
): FullInvestorProfile {
  const base = investorProfilesMap[investorId] || investorProfilesMap['inv_1'];
  const fallback = opts?.ownProfile ? emptyOwnInvestorProfile(base) : base;
  if (typeof window === 'undefined') return fallback;

  try {
    const raw =
      localStorage.getItem(`${INVESTOR_PROFILE_STORAGE_KEY}_${investorId}`) ||
      localStorage.getItem(INVESTOR_PROFILE_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const resolvedName = (parsed && parsed.name && parsed.name.trim()) || fallback.name;
    const resolvedRole = (parsed && parsed.currentRole && parsed.currentRole.trim()) || fallback.currentRole;
    const resolvedOrg = (parsed && parsed.organization && parsed.organization.trim()) || fallback.organization;

    return {
      ...fallback,
      ...parsed,
      name: resolvedName,
      currentRole: resolvedRole,
      organization: resolvedOrg,
      location: { ...fallback.location, ...(parsed.location || {}) },
      overview: { ...fallback.overview, ...(parsed.overview || {}) },
      investmentFocus: {
        ...fallback.investmentFocus,
        ...(parsed.investmentFocus || {}),
        ticketSize: {
          ...fallback.investmentFocus.ticketSize,
          ...(parsed.investmentFocus?.ticketSize || {}),
        },
        geography: {
          ...fallback.investmentFocus.geography,
          ...(parsed.investmentFocus?.geography || {}),
        },
      },
      valueBeyondCapital: {
        ...fallback.valueBeyondCapital,
        ...(parsed.valueBeyondCapital || {}),
      },
      investmentCriteria: {
        ...fallback.investmentCriteria,
        ...(parsed.investmentCriteria || {}),
      },
      investmentProcess: {
        ...fallback.investmentProcess,
        ...(parsed.investmentProcess || {}),
      },
      connectionPreferences: {
        ...fallback.connectionPreferences,
        ...(parsed.connectionPreferences || {}),
      },
      experienceStats: {
        ...fallback.experienceStats,
        ...(parsed.experienceStats || {}),
      },
      portfolio: parsed.portfolio || fallback.portfolio,
      testimonials: parsed.testimonials || fallback.testimonials,
      content: parsed.content || fallback.content,
      activities: parsed.activities || fallback.activities,
    };
  } catch (err) {
    console.error('Failed to load stored investor profile:', err);
    return fallback;
  }
}

/**
 * Persists changes to the investor profile, synchronizes with domain settings, and broadcasts an update event.
 */
export function saveStoredInvestorProfile(profile: FullInvestorProfile): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(INVESTOR_PROFILE_STORAGE_KEY, serialized);
    localStorage.setItem(`${INVESTOR_PROFILE_STORAGE_KEY}_${profile.id}`, serialized);

    // Sync with investorDomainService settings
    const currentSettings = investorDomainService.getSettings();
    investorDomainService.updateSettings({
      ...currentSettings,
      visibility: profile.visibility || currentSettings.visibility || 'public',
      openToPitches: profile.connectionPreferences.openToStartupPitches,
      openToConnections: profile.connectionPreferences.openToConnectionRequests,
      warmIntroPreferred: profile.investmentProcess.warmIntroPreferred,
      chequeMin: profile.investmentFocus.ticketSize.min,
      chequeMax: profile.investmentFocus.ticketSize.max,
    });

    if (profile.accountType) {
      investorDomainService.setAccountType(profile.accountType);
    }

    // Broadcast the full profile updated event
    window.dispatchEvent(
      new CustomEvent(INVESTOR_PROFILE_UPDATED_EVENT, { detail: { profile } })
    );
  } catch (err) {
    console.error('Failed to save stored investor profile:', err);
  }
}

/**
 * Resets the stored investor profile to original platform defaults.
 */
export function resetStoredInvestorProfile(investorId: string = 'inv_1'): FullInvestorProfile {
  const fallback = investorProfilesMap[investorId] || investorProfilesMap['inv_1'];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INVESTOR_PROFILE_STORAGE_KEY);
    localStorage.removeItem(`${INVESTOR_PROFILE_STORAGE_KEY}_${investorId}`);
    window.dispatchEvent(
      new CustomEvent(INVESTOR_PROFILE_UPDATED_EVENT, { detail: { profile: fallback } })
    );
  }
  return fallback;
}
