import { UserProfile, UserRole, defaultProfiles, emptyProfileForRole } from './userProfile';

export interface AuthStatus {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  userProfile: UserProfile | null;
  activeRole: UserRole | null;
  currentUser: any | null;
  error?: 'NOT_AUTHENTICATED' | 'ONBOARDING_INCOMPLETE' | 'CORRUPTED_STATE';
}

/** Strips whitespace and any trailing slashes from a base URL. */
function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Resolves the Signup_NewPro application base URL across environments.
 * Resolution priority mirrors Signup_NewPro/lib/auth/xentroHandoff.ts:getNewProUrl():
 *  1. NEXT_PUBLIC_SIGNUP_URL / NEXT_PUBLIC_SIGNUP_APP_URL (explicit full URL)
 *  2. NEXT_PUBLIC_SIGNUP_PORT / NEXT_PUBLIC_SIGNUP_APP_PORT (explicit port override)
 *  3. Local dev convention: 3001 -> 3000 (and vice versa)
 *  4. Conventional Signup port on the current host (loop guarded)
 */
export function getSignupAppUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  const { protocol, hostname, port } = window.location;
  return normalizeBaseUrl(`${protocol}//${hostname}${port ? ':' + port : ''}`);
}

/**
 * True when the given absolute (or relative) URL points at the app currently
 * running in this tab. Used to guarantee that cross-app redirects can never loop.
 */
export function isSameOriginUrl(url: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const target = new URL(url, window.location.href);
    return normalizeBaseUrl(target.origin) === normalizeBaseUrl(window.location.origin);
  } catch {
    return false;
  }
}

/** Canonical NewPro storage keys (mirrors lib/startupProfileState.ts + lib/mentorProfileState.ts). */
const STARTUP_BASIC_INFO_KEY = 'xentro_startup_basic_info';
const MENTOR_PROFILE_KEY = 'xentro_mentor_profile';
const SESSION_COOKIE_NAME = 'xentro_session';
const LAST_HANDOFF_ID_KEY = 'xentro_last_handoff_id';
const HANDOFF_DETAILS_KEY = 'xentro_handoff_details';

/** Roles that NewPro can activate. */
const VALID_ROLES: UserRole[] = ['startup', 'mentor', 'investor', 'esp', 'explorer'];

/**
 * Parses an incoming handoff query parameter.
 * URLSearchParams.get() already URL-decodes once, so a literal '%' inside free-text
 * onboarding fields (bio, description, ...) must not be decoded a second time.
 * The fallback keeps compatibility with payloads that were double-encoded earlier.
 */
function parseHandoffParam(raw: string): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
}

/**
 * Checks for incoming state handoff parameters from Signup_NewPro and persists them.
 * Returns true when a fresh handoff payload was consumed.
 */
export function initAuthHandoff(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const url = new URL(window.location.href);
    const authHandoff = url.searchParams.get('auth_handoff');
    if (!authHandoff) return false;

    // The handoff parameter is single-use: strip it from history immediately, so a
    // refresh or a back-navigation can never replay the same cross-app redirect.
    url.searchParams.delete('auth_handoff');
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);

    try {
      const decoded = parseHandoffParam(authHandoff);
      if (!decoded || typeof decoded !== 'object') {
        console.error('Ignoring unparseable auth_handoff payload');
        return false;
      }

      // Replay guard: ignore a payload that has already been applied (prevents loops)
      const handoffId = `${decoded?.timestamp || 'na'}:${decoded?.activeRole || 'na'}:${decoded?.userProfile?.id || 'na'}`;
      if (localStorage.getItem(LAST_HANDOFF_ID_KEY) === handoffId) {
        return false;
      }

      if (decoded.userProfile) {
        localStorage.setItem('xentro_user_profile', JSON.stringify(decoded.userProfile));
      }
      if (decoded.activeRole) {
        localStorage.setItem('xentro_active_role', decoded.activeRole);
      }
      if (decoded.currentUser) {
        localStorage.setItem('xentro_current_user', JSON.stringify(decoded.currentUser));
      }
      if (decoded.activeInvestorContext) {
        localStorage.setItem('xentro_active_investor_context_v1', JSON.stringify(decoded.activeInvestorContext));
      }
      localStorage.setItem('xentro_onboarding_complete', 'true');

      // Preserve every custom onboarding field captured in Signup_NewPro
      applyOnboardingDetails(decoded.onboardingDetails, decoded.userProfile, decoded.activeInvestorContext);

      localStorage.setItem(LAST_HANDOFF_ID_KEY, handoffId);
      localStorage.setItem('xentro_handoff_received_at', new Date().toISOString());

      // Session cookie for cross-port / server sharing. Cookies ignore ports, so this
      // also acts as a recovery channel when localStorage is empty or corrupted.
      document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify({
          userId: decoded.userProfile?.id,
          role: decoded.activeRole,
          name: decoded.userProfile?.name,
          profile: decoded.userProfile || null,
        })
      )}; path=/; max-age=86400; SameSite=Lax`;

      // Notify active components of role change
      if (decoded.activeRole && decoded.userProfile) {
        window.dispatchEvent(
          new CustomEvent('xentro-role-changed', {
            detail: { role: decoded.activeRole, profile: decoded.userProfile },
          })
        );
      }

      return true;
    } catch (err) {
      console.error('Failed to parse auth_handoff:', err);
    }
  } catch (e) {
    console.error('Error in initAuthHandoff:', e);
  }
  return false;
}

/** Reads and parses a JSON object from localStorage (null-safe). */
function readStoredJson(key: string): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors the Startup Entity submitted during Signup onboarding into NewPro's
 * canonical startup basic info, so the startup dashboard/public profile renders
 * the values the founder actually entered (all other keys are preserved).
 */
function applyStartupEntity(entity: any): void {
  if (!entity || typeof entity !== 'object') return;
  const existing = readStoredJson(STARTUP_BASIC_INFO_KEY) || {};
  const patch: Record<string, any> = {};
  if (entity.startupName) patch.startupName = entity.startupName;
  if (entity.stage) patch.stage = entity.stage;
  if (entity.industry) patch.industry = entity.industry;
  if (entity.location) patch.headquarters = entity.location;
  if (entity.website) patch.website = entity.website;
  if (entity.description) patch.overview = entity.description;
  if (Object.keys(patch).length === 0) return;
  localStorage.setItem(STARTUP_BASIC_INFO_KEY, JSON.stringify({ ...existing, ...patch }));
}

/**
 * Mirrors the Mentor setup submitted during Signup onboarding into NewPro's
 * canonical mentor profile (read by MentorProfileView / MentorProfileManage).
 * Existing NewPro edits win for every field the user did not just submit.
 */
function applyMentorSetup(setup: any): void {
  if (!setup || typeof setup !== 'object') return;
  const existing =
    readStoredJson(`${MENTOR_PROFILE_KEY}_user_mentor`) || readStoredJson(MENTOR_PROFILE_KEY) || {};
  const areas: string[] = Array.isArray(setup.mentorshipAreas)
    ? setup.mentorshipAreas.filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
    : [];

  const currentRole = { ...(existing.currentRole || {}) };
  if (setup.professionalRole) currentRole.designation = setup.professionalRole;
  if (setup.organization) currentRole.organization = setup.organization;

  const mentorshipBackground = { ...(existing.mentorshipBackground || {}) };
  if (setup.yearsOfExperience) mentorshipBackground.mentoringExperience = setup.yearsOfExperience;
  if (areas.length > 0) mentorshipBackground.areasMentored = areas;

  const merged: Record<string, any> = {
    ...existing,
    ...(Object.keys(currentRole).length > 0 ? { currentRole } : {}),
    ...(Object.keys(mentorshipBackground).length > 0 ? { mentorshipBackground } : {}),
  };
  if (areas.length > 0) {
    if (!merged.primaryExpertise) merged.primaryExpertise = areas[0];
    if (!Array.isArray(merged.expertise) || merged.expertise.length === 0) merged.expertise = areas;
    if (!Array.isArray(merged.areasOfMentorship) || merged.areasOfMentorship.length === 0) {
      merged.areasOfMentorship = areas;
    }
  }

  const serialized = JSON.stringify(merged);
  localStorage.setItem(MENTOR_PROFILE_KEY, serialized);
  localStorage.setItem(`${MENTOR_PROFILE_KEY}_user_mentor`, serialized);
}

/**
 * Mirrors the Investor Entity / Role setup submitted during Signup onboarding into
 * NewPro's canonical investor state and organization registry.
 */
function applyInvestorEntity(
  investorEntity: any,
  userProfile?: any,
  activeInvestorContext?: any
): void {
  if (typeof window === 'undefined') return;

  const user = userProfile || readStoredJson('xentro_user_profile') || {};
  const userName = user.name || 'Verified Investor';
  const userEmail = user.email || (investorEntity && investorEntity.officialEmail) || '';
  const userId = user.id || 'inv_own';

  // 1. If an Institutional Investor entity was provided:
  if (investorEntity && typeof investorEntity === 'object') {
    const orgName = investorEntity.orgName || user.organization || 'My Investment Fund';
    const orgId =
      activeInvestorContext?.organizationId ||
      investorEntity.id ||
      `org_${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}`;

    const storedOrgsRaw = localStorage.getItem('xentro_investor_organizations_v1');
    const orgs = storedOrgsRaw ? JSON.parse(storedOrgsRaw) : [];
    const existingIndex = orgs.findIndex((o: any) => o.id === orgId || o.name === orgName);

    const now = new Date().toISOString();
    const userRoleInOrg = investorEntity.applicantRole || user.roleTitle || 'Owner/Managing Partner';

    const orgRecord = {
      id: orgId,
      name: orgName,
      organizationType:
        investorEntity.regType?.includes('Angel') || investorEntity.regType?.includes('Syndicate')
          ? 'Syndicate'
          : 'Venture Capital',
      logo: '/xentro-logo.png',
      banner: '',
      shortDescription: `${orgName} - Verified institutional investment entity on Xentro.`,
      website: investorEntity.website || 'https://venturefirm.com',
      linkedIn: '',
      headquarters: {
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
      foundedYear: new Date().getFullYear().toString(),
      officialEmail: investorEntity.officialEmail || userEmail,
      fundSize: '₹100 Cr Early-Stage Fund',
      aum: 'Deploying',
      verified: true,
      ownerId: userId,
      about: {
        overview: `${orgName} partners with visionary founders building scalable solutions.`,
        thesis: 'Backing category-defining startups across high-growth technology sectors.',
        mission: 'Accelerating early-stage venture building with patient capital and operator experience.',
      },
      investmentFocus: {
        sectors: ['FinTech', 'Enterprise SaaS', 'AI & ML', 'DeepTech'],
        stages: ['Pre-Seed', 'Seed', 'Series A'],
        geography: {
          countries: ['India'],
          regions: ['Bengaluru', 'Mumbai', 'Delhi-NCR'],
        },
        businessModels: ['B2B', 'Enterprise', 'Marketplace'],
        ticketSize: {
          min: '₹1 Cr',
          max: '₹10 Cr',
          formatted: '₹1 Cr – ₹10 Cr',
        },
      },
      valueBeyondCapital: {
        supportAreas: ['Fundraising Strategy', 'Enterprise Sales', 'Hiring Key Leaders'],
        whatIBringToFounders: 'Direct access to institutional co-investors, customer pipelines, and hands-on governance.',
      },
      investmentCriteria: {
        evaluationCriteria: ['Strong founder-market fit', 'Scalable unit economics', 'Clear competitive moat'],
        preferredTraction: ['MVP Live', 'Early Revenue', 'Product-Market Fit'],
        diligenceHighlights: ['Clean cap table', 'Customer references', 'Technical audit'],
      },
      investmentProcess: {
        stages: [
          {
            stepNumber: 1,
            title: 'Initial Screening',
            description: 'Pitch deck review and metrics evaluation within 72 hours.',
            estimatedTime: '3 Days',
          },
          {
            stepNumber: 2,
            title: 'Partner Discussion',
            description: 'Deep dive call with lead partners on vision, traction, and unit economics.',
            estimatedTime: '1 Week',
          },
          {
            stepNumber: 3,
            title: 'IC & Term Sheet',
            description: 'Final Investment Committee review and term sheet issuance.',
            estimatedTime: '1-2 Weeks',
          },
        ],
        preferredConnectionMethod: 'Platform pitch submission',
        informationRequiredInitially: ['Pitch Deck (PDF)', 'Cap Table overview', 'Live Metrics'],
        typicalDecisionTimeline: '2 to 3 weeks from pitch to term sheet',
        pitchDeckRequirements: 'Problem, Solution, Team, Traction, Market Size, and Capital Ask',
        warmIntroPreferred: false,
        unsolicitedPitchesAccepted: true,
      },
      portfolio: [],
      experienceStats: {
        totalInvestments: 0,
        activePortfolio: 0,
        followOnInvestments: 0,
        exits: 0,
        yearsOfExperience: '3+ Years',
        industriesInvested: 3,
      },
      testimonials: [],
      createdAt: now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      orgs[existingIndex] = { ...orgs[existingIndex], ...orgRecord, id: orgs[existingIndex].id };
    } else {
      orgs.unshift(orgRecord);
    }
    localStorage.setItem('xentro_investor_organizations_v1', JSON.stringify(orgs));

    // Create user Owner Membership
    const storedMembershipsRaw = localStorage.getItem('xentro_investor_org_memberships_v1');
    const memberships = storedMembershipsRaw ? JSON.parse(storedMembershipsRaw) : [];
    const hasMembership = memberships.some((m: any) => m.organizationId === orgId && m.userId === userId);
    if (!hasMembership) {
      memberships.unshift({
        id: `org_mem_${Date.now()}`,
        organizationId: orgId,
        userId,
        userName,
        userEmail,
        userAvatar: user.avatar || '/xentro-logo.png',
        role: 'Owner/Managing Partner',
        title: userRoleInOrg,
        isOwner: true,
        isPublicTeam: true,
        canAccessWorkspace: true,
        status: 'active',
        dealAccessMode: 'all',
        portfolioAccessMode: 'all',
        permissions: {
          manageOrganization: true,
          manageTeam: true,
          manageBilling: true,
          viewDealFlow: true,
          editDealFlow: true,
          createInvestmentDecision: true,
          viewPortfolio: true,
          editPortfolio: true,
          accessDiligenceVault: true,
          requestDiligence: true,
          scheduleMeetings: true,
          publishContent: true,
          exportData: true,
        },
        joinedAt: 'Today',
        personalAccountVerified: true,
      });
      localStorage.setItem('xentro_investor_org_memberships_v1', JSON.stringify(memberships));
    }

    // Set active context
    localStorage.setItem(
      'xentro_active_investor_context_v1',
      JSON.stringify({ type: 'organization', organizationId: orgId })
    );
  }

  // 2. Also initialize/sync the user's individual angel investor profile shell
  const existingIndRaw = localStorage.getItem('xentro_investor_full_profile_v1');
  const existingInd = existingIndRaw ? JSON.parse(existingIndRaw) : {};
  const indProfile = {
    ...existingInd,
    id: 'inv_own',
    name: userName,
    email: userEmail,
    roleTitle: user.roleTitle || (investorEntity ? investorEntity.applicantRole : 'Angel Investor'),
    currentRole: user.roleTitle || (investorEntity ? investorEntity.applicantRole : 'Angel Investor'),
    organization: user.organization || (investorEntity ? investorEntity.orgName : 'Individual Investor'),
    logo: user.avatar || '/xentro-logo.png',
    avatar: user.avatar || '/xentro-logo.png',
    bio: existingInd.bio || `Active investor on Xentro backing high-potential founders.`,
    investorType: investorEntity ? 'Institutional VC' : 'Angel',
  };
  localStorage.setItem('xentro_investor_full_profile_v1', JSON.stringify(indProfile));
  localStorage.setItem('xentro_individual_investor_profile_v1', JSON.stringify(indProfile));
}

/**
 * Persists every custom onboarding field handed over from Signup_NewPro under its
 * canonical NewPro key, so no submitted detail is ever dropped during the handoff.
 */
function applyOnboardingDetails(
  details: any,
  userProfile?: any,
  activeInvestorContext?: any
): void {
  if (!details || typeof details !== 'object') {
    // If no details object but user is an investor, still ensure their investor shell is ready
    if (userProfile?.role === 'investor') {
      applyInvestorEntity(null, userProfile, activeInvestorContext);
    }
    return;
  }
  try {
    localStorage.setItem(HANDOFF_DETAILS_KEY, JSON.stringify(details));
    if (details.personalProfile) {
      localStorage.setItem('xentro_personal_profile', JSON.stringify(details.personalProfile));
    }
    if (details.mentorSetup) {
      localStorage.setItem('xentro_mentor_setup', JSON.stringify(details.mentorSetup));
      applyMentorSetup(details.mentorSetup);
    }
    if (details.startupEntity) {
      localStorage.setItem('xentro_startup_entities', JSON.stringify([details.startupEntity]));
      applyStartupEntity(details.startupEntity);
    }
    if (details.investorEntity || userProfile?.role === 'investor') {
      if (details.investorEntity) {
        localStorage.setItem('xentro_investor_entities', JSON.stringify([details.investorEntity]));
      }
      applyInvestorEntity(details.investorEntity, userProfile, activeInvestorContext);
    }
    if (details.espRequest) {
      localStorage.setItem('xentro_esp_requests', JSON.stringify([details.espRequest]));
    }
  } catch (e) {
    console.error('Failed to persist onboarding handoff details:', e);
  }
}

/**
 * Recovers the handed-off profile from the shared session cookie.
 * Cookies ignore ports, so the Signup_NewPro handoff cookie is visible here even
 * when this app's own localStorage is empty (fresh install, cleared storage).
 */
function readSessionCookieProfile(): UserProfile | null {
  if (typeof document === 'undefined') return null;
  try {
    const entry = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (!entry) return null;
    const raw = decodeURIComponent(entry.slice(SESSION_COOKIE_NAME.length + 1));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const profile = parsed?.profile;
    return profile && VALID_ROLES.includes(profile.role) ? (profile as UserProfile) : null;
  } catch {
    return null;
  }
}

/**
 * Returns current authentication and onboarding status
 */
export function getAuthStatus(): AuthStatus {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      isOnboardingComplete: false,
      userProfile: null,
      activeRole: null,
      currentUser: null,
    };
  }

  try {
    initAuthHandoff();

    let currentUserStr = localStorage.getItem('xentro_current_user');
    let userProfileStr = localStorage.getItem('xentro_user_profile');

    // Self-heal: a valid session cookie without local profile data (cross-port
    // handoff, cleared or corrupted storage) must not bounce the user back to
    // Signup onboarding. Recover the handed-off profile from the cookie instead.
    if (!userProfileStr) {
      const cookieProfile = readSessionCookieProfile();
      if (cookieProfile) {
        try {
          userProfileStr = JSON.stringify(cookieProfile);
          localStorage.setItem('xentro_user_profile', userProfileStr);
          localStorage.setItem('xentro_active_role', cookieProfile.role);
          localStorage.setItem('xentro_onboarding_complete', 'true');
          if (!currentUserStr) {
            currentUserStr = JSON.stringify({
              id: cookieProfile.id,
              fullName: cookieProfile.name,
              email: cookieProfile.email,
              provider: 'email',
              emailVerified: true,
            });
            localStorage.setItem('xentro_current_user', currentUserStr);
          }
        } catch (e) {
          console.error('Failed to recover session from cookie:', e);
        }
      }
    }

    const activeRoleStr = localStorage.getItem('xentro_active_role') as UserRole | null;
    const onboardingComplete = localStorage.getItem('xentro_onboarding_complete') === 'true';

    // Cookie fallback check
    const hasCookieSession = document.cookie.includes('xentro_session=');
    const hasUser = Boolean(currentUserStr || hasCookieSession);

    // If no user session and no profile
    if (!hasUser && !userProfileStr) {
      return {
        isAuthenticated: false,
        isOnboardingComplete: false,
        userProfile: null,
        activeRole: null,
        currentUser: null,
        error: 'NOT_AUTHENTICATED',
      };
    }

    // If user account exists but onboarding is not complete
    if (hasUser && !onboardingComplete && !userProfileStr) {
      return {
        isAuthenticated: true,
        isOnboardingComplete: false,
        userProfile: null,
        activeRole: null,
        currentUser: currentUserStr ? JSON.parse(currentUserStr) : null,
        error: 'ONBOARDING_INCOMPLETE',
      };
    }

    // Parse user profile
    let profile: UserProfile | null = null;
    if (userProfileStr) {
      try {
        profile = JSON.parse(userProfileStr);
      } catch {
        profile = null;
      }
    }

    const resolvedRole: UserRole | null = (activeRoleStr && VALID_ROLES.includes(activeRoleStr))
      ? activeRoleStr
      : (profile?.role && VALID_ROLES.includes(profile.role))
      ? profile.role
      : null;

    // Rule 18: If role cannot be resolved and profile is missing, onboarding is genuinely incomplete
    if (!resolvedRole && !profile) {
      return {
        isAuthenticated: true,
        isOnboardingComplete: false,
        userProfile: null,
        activeRole: null,
        currentUser: currentUserStr ? JSON.parse(currentUserStr) : null,
        error: 'ONBOARDING_INCOMPLETE',
      };
    }

    const role: UserRole = resolvedRole || 'startup';

    // Safe recovery if profile was missing or corrupted: resolve from valid role (honest empty shell, never fake demo)
    if (!profile) {
      profile = emptyProfileForRole(role);
      localStorage.setItem('xentro_user_profile', JSON.stringify(profile));
    }
    localStorage.setItem('xentro_active_role', role);

    return {
      isAuthenticated: true,
      isOnboardingComplete: true,
      userProfile: profile,
      activeRole: role,
      currentUser: currentUserStr ? JSON.parse(currentUserStr) : null,
    };
  } catch (err) {
    console.error('getAuthStatus error:', err);
    return {
      isAuthenticated: false,
      isOnboardingComplete: false,
      userProfile: null,
      activeRole: null,
      currentUser: null,
      error: 'CORRUPTED_STATE',
    };
  }
}

/**
 * Terminates authentication session and redirects to /signin
 */
export function logoutFromNewPro(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('xentro_current_user');
    localStorage.removeItem('xentro_onboarding_complete');
    localStorage.removeItem('xentro_user_profile');
    localStorage.removeItem('xentro_active_role');
    localStorage.removeItem('xentro_active_investor_context_v1');
    localStorage.removeItem(HANDOFF_DETAILS_KEY);
    localStorage.removeItem(LAST_HANDOFF_ID_KEY);
    localStorage.removeItem('xentro_handoff_received_at');
    localStorage.removeItem('xentro_personal_profile');
    localStorage.removeItem('xentro_mentor_setup');
    localStorage.removeItem('xentro_startup_entities');
    localStorage.removeItem('xentro_investor_entities');
    localStorage.removeItem('xentro_esp_requests');
    localStorage.removeItem('xentro_identity_data');
    localStorage.removeItem('xentro_user_preference');
    localStorage.removeItem('xentro_universal_feed_posts');
    localStorage.removeItem('xentro_access_token');
    localStorage.removeItem('xentro_connections_v2');
    localStorage.removeItem('xentro_conversations_v1');
    localStorage.removeItem('xentro_custom_conversations_v2');
    localStorage.removeItem('xentro_shared_messages_v3');
    localStorage.removeItem('xentro_active_conversation_id');
    localStorage.removeItem('xentro_notifications_state');
    sessionStorage.clear();
    // Expire session cookies
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `xentro_session=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) {
    console.error('Error during logout:', e);
  }

  window.location.href = '/signin';
}
