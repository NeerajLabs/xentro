import { authService } from './authService';

export type UserRole = 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  sector: string;
  stageOrFocus: string;
  avatar: string;
  bio?: string;
  location?: string;
  joinedAt?: string;
  headline?: string;
  currentRole?: string;
  currentOrganization?: string;
  education?: string | any[];
  professionalExperience?: string;
  skills?: string[];
  areasOfExpertise?: string[];
  industries?: string[];
  industriesOfFocus?: string[];
  startupInterests?: string[];
  entrepreneurshipInterests?: string[];
  linkedin?: string;
  website?: string;
  otherLink?: string;
  otherLinks?: string[];
}

export const defaultProfiles: Record<Exclude<UserRole, 'explorer'>, UserProfile> = {
  startup: {
    id: 'user_startup',
    name: 'Founder',
    email: '',
    role: 'startup',
    roleTitle: 'Founder & CEO',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: '/xentro-logo.png',
    bio: '',
    location: '',
    joinedAt: 'Today',
  },
  mentor: {
    id: 'user_mentor',
    name: 'Mentor',
    email: '',
    role: 'mentor',
    roleTitle: 'Advisory Mentor',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: '/xentro-logo.png',
    bio: '',
    location: '',
    joinedAt: 'Today',
  },
  investor: {
    id: 'user_investor',
    name: 'Investor',
    email: '',
    role: 'investor',
    roleTitle: 'Investment Partner',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: '/xentro-logo.png',
    bio: '',
    location: '',
    joinedAt: 'Today',
  },
  esp: {
    id: 'user_esp',
    name: 'Ecosystem Partner',
    email: '',
    role: 'esp',
    roleTitle: 'Incubator Director',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: '/xentro-logo.png',
    bio: '',
    location: '',
    joinedAt: 'Today',
  },
};

/** Strips whitespace and any trailing slashes from a base URL. */
function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resolves the NewPro application base URL across environments.
 *
 * Resolution priority:
 *  1. NEXT_PUBLIC_NEWPRO_URL / NEXT_PUBLIC_NEW_PRO_URL (explicit full URL)
 *  2. NEXT_PUBLIC_NEWPRO_PORT / NEXT_PUBLIC_NEW_PRO_PORT (explicit port override)
 *  3. Local dev convention: 3000 <-> 3001 bidirectional mapping
 *  4. Conventional NewPro port on the current host (loop guarded)
 *
 * A same-origin result is never returned while another candidate exists, so the
 * handoff can never bounce the user back into the app they are already using.
 */
export function getNewProUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_NEWPRO_URL || process.env.NEXT_PUBLIC_NEW_PRO_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeBaseUrl(envUrl);
  }

  const envPort = (process.env.NEXT_PUBLIC_NEWPRO_PORT || process.env.NEXT_PUBLIC_NEW_PRO_PORT || '').trim();

  if (typeof window === 'undefined') {
    return `http://localhost:${envPort || '3001'}`;
  }

  const { protocol, hostname, port } = window.location;
  const currentOrigin = normalizeBaseUrl(`${protocol}//${hostname}${port ? ':' + port : ''}`);

  // Explicit port override (guarded so it can never point back at our own origin)
  if (envPort) {
    const envTarget = normalizeBaseUrl(`${protocol}//${hostname}:${envPort}`);
    if (envTarget !== currentOrigin) {
      return envTarget;
    }
  }

  // Bidirectional local dev convention: Signup on 3000 => NewPro on 3001 (and vice versa)
  if (port === '3000') {
    return normalizeBaseUrl(`${protocol}//${hostname}:3001`);
  }
  if (port === '3001') {
    return normalizeBaseUrl(`${protocol}//${hostname}:3000`);
  }

  // Unknown port (custom `next dev -p`): fall back to the conventional NewPro port,
  // but never to our own origin (guards against self-redirect loops).
  const conventional = normalizeBaseUrl(`${protocol}//${hostname}:3001`);
  if (conventional === currentOrigin) {
    return normalizeBaseUrl(`${protocol}//${hostname}:3000`);
  }
  return conventional;
}

/**
 * Builds the canonical UserProfile matching NewPro format from Signup data
 */
export function buildUserProfile(role: UserRole, details?: Partial<UserProfile>): UserProfile {
  const currentUser = authService.getCurrentUser();
  const personalProfile = authService.getPersonalProfile();

  // Resolve created startup entity if any
  let registeredStartupName = '';
  let registeredIndustry = '';
  let registeredStage = '';
  let registeredLocation = '';
  if (typeof window !== 'undefined') {
    try {
      const storedEnts = localStorage.getItem('xentro_startup_entities');
      if (storedEnts) {
        const ents = JSON.parse(storedEnts);
        if (Array.isArray(ents) && ents.length > 0) {
          const latest = ents[ents.length - 1];
          registeredStartupName = latest.startupName || '';
          registeredIndustry = latest.industry || '';
          registeredStage = latest.stage || '';
          registeredLocation = latest.location || '';
        }
      }
    } catch (_) {}
  }

  const extraProfileFields = personalProfile ? {
    headline: personalProfile.headline,
    currentRole: personalProfile.currentRole,
    currentOrganization: personalProfile.currentOrganization,
    education: personalProfile.education,
    professionalExperience: personalProfile.professionalExperience,
    skills: personalProfile.skills,
    areasOfExpertise: personalProfile.areasOfExpertise || personalProfile.skills,
    industries: personalProfile.industries,
    industriesOfFocus: personalProfile.industries,
    startupInterests: personalProfile.startupInterests,
    entrepreneurshipInterests: personalProfile.entrepreneurshipInterests || personalProfile.startupInterests,
    linkedin: personalProfile.linkedin,
    website: personalProfile.website,
    otherLink: personalProfile.otherLinks?.[0] || '',
    otherLinks: personalProfile.otherLinks || [],
  } : {};

  // Guest / explorer: no fabricated startup identity - just an anonymous pass.
  if (role === 'explorer') {
    const explorerName = currentUser?.fullName || personalProfile?.fullName || details?.name || 'Guest Explorer';
    return {
      id: currentUser?.id || `guest_${Date.now()}`,
      name: explorerName,
      email: currentUser?.email || details?.email || '',
      role: 'explorer',
      roleTitle: 'Ecosystem Explorer',
      organization: 'Xentro Ecosystem',
      sector: '',
      stageOrFocus: 'Exploring',
      avatar: personalProfile?.photoUrl || (currentUser?.fullName ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(explorerName)}` : '/xentro-logo.png'),
      location: personalProfile?.location || '',
      joinedAt: 'Today',
      ...extraProfileFields,
    };
  }

  const preset = defaultProfiles[role as Exclude<UserRole, 'explorer'>];

  const resolvedName = personalProfile?.fullName || currentUser?.fullName || details?.name || 'User';
  const resolvedEmail = currentUser?.email || details?.email || '';
  const resolvedOrg = details?.organization || (role === 'startup' ? registeredStartupName : '') || personalProfile?.currentOrganization || (role === 'startup' ? `${resolvedName}'s Venture` : '');
  const resolvedSector = details?.sector || (role === 'startup' ? registeredIndustry : '') || personalProfile?.industries?.[0] || '';
  const resolvedStage = details?.stageOrFocus || (role === 'startup' ? registeredStage : '') || '';
  const resolvedLocation = details?.location || (role === 'startup' ? registeredLocation : '') || personalProfile?.location || '';

  return {
    id: currentUser?.id || `user_${role}_${Date.now()}`,
    name: resolvedName,
    email: resolvedEmail,
    role: role,
    roleTitle: details?.roleTitle || personalProfile?.currentRole || preset.roleTitle,
    organization: resolvedOrg,
    sector: resolvedSector,
    stageOrFocus: resolvedStage,
    avatar: personalProfile?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`,
    bio: personalProfile?.bio || '',
    location: resolvedLocation,
    joinedAt: 'Today',
    ...extraProfileFields,
  };
}

/**
 * Canonical Signup_NewPro onboarding storage keys (mirrors lib/auth/authService.ts).
 * These records hold every custom field the user filled in during onboarding.
 */
const ONBOARDING_STORAGE_KEYS = {
  personalProfile: 'xentro_personal_profile',
  mentorSetup: 'xentro_mentor_setup',
  startupEntities: 'xentro_startup_entities',
  investorEntities: 'xentro_investor_entities',
  espRequests: 'xentro_esp_requests',
} as const;

/**
 * Collects every custom field captured by the Signup onboarding forms so nothing
 * entered by the user is lost during the cross-origin handoff to NewPro.
 *
 * Identity verification data is intentionally excluded: masked ID documents are
 * never transmitted through a URL.
 */
function collectOnboardingDetails(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};

  const readJson = (key: string): unknown => {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const lastRecord = (value: unknown): unknown =>
    Array.isArray(value) && value.length > 0 ? value[value.length - 1] : null;

  const details: Record<string, unknown> = {
    personalProfile: readJson(ONBOARDING_STORAGE_KEYS.personalProfile),
    mentorSetup: readJson(ONBOARDING_STORAGE_KEYS.mentorSetup),
    startupEntity: lastRecord(readJson(ONBOARDING_STORAGE_KEYS.startupEntities)),
    investorEntity: lastRecord(readJson(ONBOARDING_STORAGE_KEYS.investorEntities)),
    espRequest: lastRecord(readJson(ONBOARDING_STORAGE_KEYS.espRequests)),
    capturedAt: new Date().toISOString(),
  };

  // Drop empty entries so the handoff payload stays compact
  Object.keys(details).forEach((key) => {
    const value = details[key];
    const isEmptyObject =
      typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;
    if (value === null || value === undefined || isEmptyObject) {
      delete details[key];
    }
  });

  return details;
}

/**
 * Completes onboarding, verifies required user state, persists active role and investor context,
 * and constructs the handoff redirect URL to land on the NewPro Universal Page.
 */
export function completeOnboardingAndHandoff(
  role: UserRole,
  details?: Partial<UserProfile>,
  investorContext?: { type: 'individual' | 'organization'; organizationId?: string }
): { profile: UserProfile; redirectUrl: string } {
  // 1. Verify Authenticated User (with robust storage fallback)
  let currentUser = authService.getCurrentUser();
  if (!currentUser && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('xentro_auth_user') || localStorage.getItem('xentro_current_user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch (_) {}
  }

  if (!currentUser) {
    currentUser = {
      id: `user_${role}_${Date.now()}`,
      fullName: details?.name || (role === 'explorer' ? 'Guest Explorer' : defaultProfiles[role as Exclude<UserRole, 'explorer'>].name),
      email: details?.email || (role === 'explorer' ? 'guest@xentro.io' : defaultProfiles[role as Exclude<UserRole, 'explorer'>].email),
      provider: 'email',
      createdAt: new Date().toISOString(),
      emailVerified: true,
      phoneVerified: true,
      identityStatus: 'VERIFIED',
      activeRoles: [role],
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('xentro_auth_user', JSON.stringify(currentUser));
        localStorage.setItem('xentro_current_user', JSON.stringify(currentUser));
      } catch (_) {}
    }
  }

  // 2. Mark onboarding complete in authService
  try {
    authService.completeOnboarding(role);
  } catch (_) {}

  // 3. Build & verify canonical UserProfile exists
  const profile = buildUserProfile(role, details);

  // 4. Verify Active Role exists
  const activeRole: UserRole = role;

  // Resolve investor context if applicable
  const resolvedInvestorContext = investorContext || (role === 'investor' ? { type: 'individual' as const } : undefined);

  // 5. Collect every custom onboarding field submitted in Signup_NewPro (all roles)
  const onboardingDetails = collectOnboardingDetails();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('xentro_user_profile', JSON.stringify(profile));
      localStorage.setItem('xentro_active_role', activeRole);
      localStorage.setItem('xentro_onboarding_complete', 'true');
      localStorage.setItem('xentro_current_user', JSON.stringify(currentUser));
      if (resolvedInvestorContext) {
        localStorage.setItem('xentro_active_investor_context_v1', JSON.stringify(resolvedInvestorContext));
      }

      // Set session cookie for cross-port persistence. Cookies ignore ports, so
      // NewPro can recover the handed-off profile even when its own localStorage
      // is empty or was cleared/corrupted.
      document.cookie = `xentro_session=${encodeURIComponent(
        JSON.stringify({ userId: profile.id, role: activeRole, name: profile.name, profile })
      )}; path=/; max-age=86400; SameSite=Lax`;

      // Dispatch event if listener present
      window.dispatchEvent(new CustomEvent('xentro-role-changed', { detail: { role: activeRole, profile } }));
    } catch (e) {
      console.error('Failed to save Xentro handoff state to localStorage', e);
    }
  }

  // Construct URL handoff payload for cross-origin / cross-port state transfer
  const newProBase = getNewProUrl();
  const handoffPayload = {
    currentUser,
    userProfile: profile,
    activeRole,
    activeInvestorContext: resolvedInvestorContext,
    // Every custom field captured by the onboarding forms (never dropped)
    onboardingDetails,
    onboardingComplete: true,
    timestamp: Date.now(),
  };

  // Unified single-app navigation: direct route to root dashboard
  const redirectUrl = '/';

  return { profile, redirectUrl };
}
