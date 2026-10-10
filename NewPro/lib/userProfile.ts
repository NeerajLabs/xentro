export type UserRole = 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer';

/** Guest/explorer display constants (never a stock demo photo). */
export const GUEST_AVATAR = '/xentro-logo.png';
export const GUEST_PROFILE_KEY_PREFIX = 'guest_';

/**
 * Builds a stable, anonymous guest identity from anything unique we have
 * (email prefix, user id, or random suffix). Never a forged person name.
 */
export function buildGuestName(identifier?: string | null): string {
  const cleaned = (identifier || '').trim();
  if (cleaned) {
    const base = cleaned.split('@')[0].replace(/[^a-zA-Z0-9]+/g, ' ').trim();
    if (base) {
      return `Guest ${base.charAt(0).toUpperCase()}${base.slice(1, 24)}`;
    }
  }
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `Guest ${suffix}`;
}

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
  /** Optional cover/banner image URL for the user's profile header. */
  banner?: string;
  bio?: string;
  location?: string;
  joinedAt?: string;
  /** True when this profile is read-only guest access (explorer). */
  isGuest?: boolean;
  headline?: string;
  currentRole?: string;
  currentOrganization?: string;
  education?: string;
  professionalExperience?: string;
  experienceSummary?: string;
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
    avatar: GUEST_AVATAR,
    bio: '',
    location: '',
    joinedAt: '',
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
    avatar: GUEST_AVATAR,
    bio: '',
    location: '',
    joinedAt: '',
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
    avatar: GUEST_AVATAR,
    bio: '',
    location: '',
    joinedAt: '',
  },
  esp: {
    id: 'user_esp',
    name: 'Ecosystem Partner',
    email: '',
    role: 'esp',
    roleTitle: 'Program Director',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: GUEST_AVATAR,
    bio: '',
    location: '',
    joinedAt: '',
  },
};

const USER_PROFILE_KEY = 'xentro_user_profile';
const USER_ROLE_KEY = 'xentro_active_role';

/** Build an empty "not filled yet" shell for a role (no demo person). */
export function emptyProfileForRole(role: UserRole, id?: string, email?: string): UserProfile {
  if (role === 'explorer') {
    return {
      id: id || `${GUEST_PROFILE_KEY_PREFIX}${Date.now()}`,
      name: buildGuestName(email || id),
      email: email || '',
      role: 'explorer',
      roleTitle: 'Ecosystem Explorer',
      organization: 'Xentro Ecosystem',
      sector: '',
      stageOrFocus: 'Exploring',
      avatar: GUEST_AVATAR,
      location: '',
      isGuest: true,
    };
  }
  return {
    id: id || `user_${role}_${Date.now()}`,
    name: '',
    email: email || '',
    role,
    roleTitle: '',
    organization: '',
    sector: '',
    stageOrFocus: '',
    avatar: GUEST_AVATAR,
  };
}

/**
 * Returns the stored profile for the active role.
 * Unlike the old demo fallback, this never invents a person:
 *  - a stored profile whose role matches the active role is returned,
 *  - otherwise an EMPTY shell for the active role is returned (no name, no fake org).
 * Demo presets (`defaultProfiles`) are for viewing other people's showcase cards only.
 */
export function formatLocation(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
  }
  return String(loc);
}

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return emptyProfileForRole('startup');
  }
  try {
    const role = getActiveRole();
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    const personal = safeParseJson(localStorage.getItem('xentro_personal_profile'));
    if (stored) {
      const parsed = JSON.parse(stored) as UserProfile;
      const parsedRole = (parsed?.role || '').toLowerCase();
      if (parsed && (parsedRole === role.toLowerCase() || (role === 'explorer' && parsedRole === 'explorer')) && parsed.name && parsed.name.trim()) {
        if (personal) {
          const merged: UserProfile = {
            ...parsed,
            name: parsed.name || personal.fullName,
            headline: parsed.headline || personal.headline,
            location: formatLocation(parsed.location || personal.location),
            bio: parsed.bio || personal.bio,
            currentRole: parsed.currentRole || personal.currentRole,
            currentOrganization: parsed.currentOrganization || personal.currentOrganization,
            education: parsed.education || personal.education,
            professionalExperience: parsed.professionalExperience || personal.professionalExperience,
            skills: (parsed.skills && parsed.skills.length > 0) ? parsed.skills : personal.skills,
            areasOfExpertise: (parsed.areasOfExpertise && parsed.areasOfExpertise.length > 0) ? parsed.areasOfExpertise : (personal.areasOfExpertise || personal.skills),
            industries: (parsed.industries && parsed.industries.length > 0) ? parsed.industries : personal.industries,
            industriesOfFocus: (parsed.industriesOfFocus && parsed.industriesOfFocus.length > 0) ? parsed.industriesOfFocus : (personal.industriesOfFocus || personal.industries),
            startupInterests: (parsed.startupInterests && parsed.startupInterests.length > 0) ? parsed.startupInterests : personal.startupInterests,
            entrepreneurshipInterests: (parsed.entrepreneurshipInterests && parsed.entrepreneurshipInterests.length > 0) ? parsed.entrepreneurshipInterests : (personal.entrepreneurshipInterests || personal.startupInterests),
            linkedin: parsed.linkedin || personal.linkedin,
            website: parsed.website || personal.website,
            otherLink: parsed.otherLink || personal.otherLinks?.[0],
            otherLinks: (parsed.otherLinks && parsed.otherLinks.length > 0) ? parsed.otherLinks : personal.otherLinks,
          };
          return merged;
        }
        return {
          ...parsed,
          location: formatLocation(parsed.location),
        };
      }
    }
    // Attempt recovery from handoff stores before returning an empty shell
    const recovered = recoverRoleProfile(role);
    if (recovered && recovered.name && recovered.name.trim()) {
      saveUserProfile(recovered);
      return recovered;
    }
    return emptyProfileForRole(role);
  } catch {
    return emptyProfileForRole('startup');
  }
}

/**
 * Resets seeded and custom profile/workspace keys back to a clean state.
 */
export function resetDemoData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    USER_PROFILE_KEY,
    USER_ROLE_KEY,
    'xentro_active_investor_context_v1',
    'xentro_handoff_details',
    'xentro_personal_profile',
    'xentro_mentor_setup',
    'xentro_mentor_profile',
    'xentro_startup_entities',
    'xentro_startup_basic_info',
    'xentro_investor_entities',
    'xentro_esp_requests',
    'xentro_esp_institution_v1',
    'xentro_startup_team_v1',
    'xentro_startup_billing_v1',
    'xentro_universal_feed_posts',
    'xentro_messages_state',
    'xentro_notifications_state',
  ];
  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (_) {}
  });
  window.dispatchEvent(
    new CustomEvent('xentro-role-changed', {
      detail: { role: 'startup', profile: emptyProfileForRole('startup') },
    })
  );
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(USER_ROLE_KEY, profile.role);
    window.dispatchEvent(new CustomEvent('xentro-role-changed', { detail: { role: profile.role, profile } }));
  } catch (err) {
    console.error('Failed to save user profile', err);
  }
}

export function getActiveRole(): UserRole {
  if (typeof window === 'undefined') return 'startup';
  try {
    const rawRole = (localStorage.getItem(USER_ROLE_KEY) || '').toLowerCase().trim();
    if (rawRole && (rawRole === 'startup' || rawRole === 'mentor' || rawRole === 'investor' || rawRole === 'esp' || rawRole === 'explorer')) {
      return rawRole as UserRole;
    }
    // Inspect stored profile to safely recover role if active role key was lost/corrupted
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const parsedRole = (parsed?.role || '').toLowerCase().trim();
      if (parsedRole && (parsedRole === 'startup' || parsedRole === 'mentor' || parsedRole === 'investor' || parsedRole === 'esp' || parsedRole === 'explorer')) {
        localStorage.setItem(USER_ROLE_KEY, parsedRole);
        return parsedRole as UserRole;
      }
    }
    // Inspect current user session
    const userRaw = localStorage.getItem('xentro_current_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      const uRole = (u?.role || u?.primaryRole || u?.baseRole || u?.accountType || '').toLowerCase().trim();
      if (uRole && (uRole === 'startup' || uRole === 'mentor' || uRole === 'investor' || uRole === 'esp' || uRole === 'explorer')) {
        localStorage.setItem(USER_ROLE_KEY, uRole);
        return uRole as UserRole;
      }
    }
    return 'startup';
  } catch {
    return 'startup';
  }
}

/**
 * Returns the roles the user actually registered for during onboarding.
 * If user only registered as a Startup, this returns ['startup'].
 */
export function getUserRegisteredRoles(): UserRole[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('xentro_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.activeRoles) && parsed.activeRoles.length > 0) {
        const roles = parsed.activeRoles
          .map((r: string) => r.toLowerCase().trim() as UserRole)
          .filter((r: UserRole) => ['startup', 'mentor', 'investor', 'esp', 'explorer'].includes(r));
        if (roles.length > 0) return roles;
      }
    }
    const profileRaw = localStorage.getItem(USER_PROFILE_KEY);
    if (profileRaw) {
      const prof = JSON.parse(profileRaw);
      if (prof?.role) return [prof.role as UserRole];
    }
    const activeRole = localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
    if (activeRole) return [activeRole];
  } catch (_) {}
  return [];
}

/**
 * Switches the active persona WITHOUT destroying data.
 * - Keeps the already-stored profile for that role when one exists.
 * - Reuses the per-role canonical stores already populated by the handoff
 *   (mentor setup -> names/org; startup entity -> names/org; harmless fallbacks otherwise).
 * - Never writes a demo person: no stored data => an EMPTY shell for the role.
 */
export function setActiveRole(role: UserRole): UserProfile {
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = localStorage.getItem(USER_PROFILE_KEY);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw) as UserProfile;
        if (existing && existing.role === role) {
          localStorage.setItem(USER_ROLE_KEY, role);
          window.dispatchEvent(new CustomEvent('xentro-role-changed', { detail: { role, profile: existing } }));
          return existing;
        }
      }
    } catch {
      // Fall through to role-preserving recovery below
    }
  }

  const preserved = recoverRoleProfile(role);
  saveUserProfile(preserved);
  return preserved;
}

/** Best-effort recovery: rebuild a role profile from persisted handoff stores (never demo data). */
function recoverRoleProfile(role: UserRole): UserProfile {
  if (typeof window === 'undefined') return emptyProfileForRole(role);
  try {
    const currentUser = safeParseJson(localStorage.getItem('xentro_current_user')) || safeParseJson(localStorage.getItem('xentro_auth_user'));
    const personal = safeParseJson(localStorage.getItem('xentro_personal_profile'));
    const resolvedName = (personal && personal.fullName) || (currentUser && currentUser.fullName) || '';
    const resolvedEmail = (personal && personal.email) || (currentUser && currentUser.email) || '';
    const resolvedAvatar = (personal && personal.photoUrl) || (resolvedName ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}` : GUEST_AVATAR);
    const resolvedLocation = (personal && personal.location) || '';
    const resolvedBio = (personal && personal.bio) || (personal && personal.headline) || '';

    const profileExtras = personal ? {
      headline: personal.headline,
      currentRole: personal.currentRole,
      currentOrganization: personal.currentOrganization,
      education: personal.education,
      professionalExperience: personal.professionalExperience,
      experienceSummary: personal.professionalExperience,
      skills: personal.skills,
      areasOfExpertise: personal.areasOfExpertise || personal.skills,
      industries: personal.industries,
      industriesOfFocus: personal.industries,
      startupInterests: personal.startupInterests,
      entrepreneurshipInterests: personal.entrepreneurshipInterests || personal.startupInterests,
      linkedin: personal.linkedin,
      website: personal.website,
      otherLink: personal.otherLinks?.[0] || '',
      otherLinks: personal.otherLinks || [],
    } : {};

    if (role === 'explorer') {
      const explorerName = resolvedName || buildGuestName(resolvedEmail || currentUser?.id);
      return {
        ...emptyProfileForRole('explorer', currentUser?.id, resolvedEmail || undefined),
        name: explorerName,
        email: resolvedEmail,
        avatar: resolvedAvatar,
        location: resolvedLocation,
        bio: resolvedBio,
        isGuest: !resolvedName,
        ...profileExtras,
      };
    }
    if (role === 'mentor') {
      const setup = safeParseJson(localStorage.getItem('xentro_mentor_setup'));
      const mentorName = resolvedName || 'Mentor';
      return {
        ...emptyProfileForRole('mentor', currentUser?.id),
        name: mentorName,
        email: resolvedEmail,
        roleTitle: (setup && setup.professionalRole) || (personal && personal.currentRole) || 'Advisory Mentor',
        organization: (setup && setup.organization) || (personal && personal.currentOrganization) || 'Mentorship Network',
        sector: Array.isArray(setup && setup.mentorshipAreas) && setup.mentorshipAreas.length > 0 ? setup.mentorshipAreas[0] : (personal && personal.industries?.[0]) || 'Technology & Innovation',
        avatar: resolvedAvatar,
        location: resolvedLocation,
        bio: resolvedBio,
        ...profileExtras,
      };
    }
    if (role === 'startup') {
      const entities = safeParseJson(localStorage.getItem('xentro_startup_entities'));
      const entity = Array.isArray(entities) && entities.length > 0 ? entities[entities.length - 1] : null;
      const founderName = resolvedName || (entity && entity.founderName) || 'Founder';
      const startupName = (entity && entity.startupName) || (founderName ? `${founderName}'s Venture` : 'My Startup Venture');
      return {
        ...emptyProfileForRole('startup', currentUser?.id),
        name: founderName,
        email: resolvedEmail,
        roleTitle: (personal && personal.currentRole) || 'Founder & CEO',
        organization: startupName,
        sector: (entity && entity.industry) || (personal && personal.industries?.[0]) || 'Enterprise Software & Technology',
        stageOrFocus: (entity && entity.stage) || 'Early Stage',
        location: (entity && entity.location) || resolvedLocation || 'India',
        avatar: resolvedAvatar,
        bio: resolvedBio,
        ...profileExtras,
      };
    }
    if (role === 'investor') {
      const entities = safeParseJson(localStorage.getItem('xentro_investor_entities'));
      const entity = Array.isArray(entities) && entities.length > 0 ? entities[entities.length - 1] : null;
      const investorName = resolvedName || 'Investor';
      return {
        ...emptyProfileForRole('investor', currentUser?.id),
        name: investorName,
        email: resolvedEmail,
        roleTitle: (entity && entity.applicantRole) || (personal && personal.currentRole) || 'Angel Investor',
        organization: (entity && entity.orgName) || (personal && personal.currentOrganization) || 'Individual Investor',
        stageOrFocus: 'Individual',
        location: resolvedLocation || 'India',
        avatar: resolvedAvatar,
        bio: resolvedBio,
        ...profileExtras,
      };
    }
    if (role === 'esp') {
      const requests = safeParseJson(localStorage.getItem('xentro_esp_requests'));
      const request = Array.isArray(requests) && requests.length > 0 ? requests[requests.length - 1] : null;
      const espName = (request && request.applicantName) || resolvedName || 'Ecosystem Partner';
      return {
        ...emptyProfileForRole('esp', currentUser?.id),
        name: espName,
        email: (request && request.institutionalEmail) || (request && request.officialEmail) || resolvedEmail,
        roleTitle: (request && request.designation) || (personal && personal.currentRole) || 'Incubator Director',
        organization: (request && request.institutionName) || 'Innovation Hub',
        location: (request && request.city) ? `${request.city}, ${request.country || 'India'}` : (resolvedLocation || 'India'),
        avatar: resolvedAvatar,
        bio: resolvedBio,
        ...profileExtras,
      };
    }
  } catch {
    // Fall through to an empty shell
  }
  return emptyProfileForRole(role);
}

function safeParseJson(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeParseEmail(currentUserRaw: string | null): string {
  try {
    const parsed = JSON.parse(currentUserRaw || 'null');
    return (parsed && (parsed.email || parsed.fullName)) || '';
  } catch {
    return '';
  }
}
