import {
  SignUpFormData,
  AuthResult,
  User,
  IdentityVerificationData,
  IdentityVerificationState,
  PersonalProfile,
  ParticipationPath,
  StartupEntity,
  InvestorOrgEntity,
  EspRequest,
} from "./types";
import { isFirebaseConfigured } from "./firebaseConfig";

const SESSION_USER_KEY = "xentro_current_user";
const EXISTING_EMAILS_KEY = "xentro_registered_emails";
const IDENTITY_DATA_KEY = "xentro_identity_verification";
const PERSONAL_PROFILE_KEY = "xentro_personal_profile";
const STARTUP_ENTITIES_KEY = "xentro_startup_entities";
const INVESTOR_ENTITIES_KEY = "xentro_investor_entities";
const ESP_REQUESTS_KEY = "xentro_esp_requests";

// In-memory fallback store for Node.js test runner / SSR
const memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return memoryStore[key] || null;
    }
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } catch {
      // Continue
    }
  }
  memoryStore[key] = value;
}

function removeStorageItem(key: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Continue
    }
  }
  delete memoryStore[key];
}

// Pre-seeded registered emails (clean initial state)
const DEFAULT_EXISTING_EMAILS: string[] = [];

function getRegisteredEmails(): string[] {
  const stored = getStorageItem(EXISTING_EMAILS_KEY);
  if (!stored) {
    setStorageItem(EXISTING_EMAILS_KEY, JSON.stringify(DEFAULT_EXISTING_EMAILS));
    return DEFAULT_EXISTING_EMAILS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_EXISTING_EMAILS;
  }
}

function saveRegisteredEmail(email: string) {
  try {
    const list = getRegisteredEmails();
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      setStorageItem(EXISTING_EMAILS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage issues
  }
}

export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX XXXX " + digits.padStart(4, "X");
  const last4 = digits.slice(-4);
  return `XXXX XXXX ${last4}`;
}

export function generateXentroId(prefix: "XU" | "FO" | "ST" | "MEN" | "INV" | "VCI" | "ES" | "INS" | "ADM"): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${digits}`;
}

export function generateUsername(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
  const num = Math.floor(10 + Math.random() * 90);
  return `@${clean}${num}`;
}

import { getBackendBaseUrl } from "../backendUrl";

async function syncBackendAccountType(accountType: string, extraData?: any) {
  try {
    const rawUser = getStorageItem(SESSION_USER_KEY);
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!user) return;

    setStorageItem("xentro_account_type", accountType);
    setStorageItem("xentro_onboarding_complete", "true");

    const token = getStorageItem("xentro_access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Id": user.id || "",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const backendUrl = getBackendBaseUrl();
    await fetch(`${backendUrl}/auth/account-type/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        accountType,
        userType: accountType,
        ...extraData,
      }),
    });
  } catch (err) {
    console.warn("Failed to sync backend account type:", err);
  }
}

export const authService = {
  /**
   * Register user Personal Account with Email + Phone + Password
   */
  async signUpWithEmail(data: SignUpFormData, backendUser?: Partial<User>): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Purge any old leftover identity verification artifacts
    removeStorageItem(IDENTITY_DATA_KEY);

    if (isFirebaseConfigured) {
      // In real Firebase: createUserWithEmailAndPassword(auth, email, password)
    }

    // Simulate realistic network latency
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Test triggers for error state demonstration
    if (normalizedEmail.includes("network-error")) {
      return {
        success: false,
        error: {
          type: "NETWORK_ERROR",
          message: "Unable to connect. Check your connection and try again.",
        },
      };
    }

    if (normalizedEmail.includes("server-error")) {
      return {
        success: false,
        error: {
          type: "INVALID_CREDENTIALS",
          message: "Something went wrong. Please try again.",
        },
      };
    }

    // Check for existing account
    const existing = getRegisteredEmails();
    if (existing.includes(normalizedEmail)) {
      return {
        success: false,
        error: {
          type: "EMAIL_EXISTS",
          message: "An account with this email already exists. Try signing in instead.",
        },
      };
    }

    // Create Personal Account representation with XU-XXXXXX identity model
    const xuId = backendUser?.id || backendUser?.xentroId || generateXentroId("XU");
    const username = backendUser?.username || generateUsername(data.fullName);

    const newUser: User = {
      id: xuId,
      xentroId: xuId,
      username: username,
      fullName: data.fullName.trim(),
      email: normalizedEmail,
      phoneNumber: data.phoneNumber?.trim() || "",
      provider: "email",
      createdAt: new Date().toISOString(),
      emailVerified: false,
      phoneVerified: false,
      identityStatus: "NOT_SUBMITTED",
      activeRoles: ["Personal Account"],
    };

    saveRegisteredEmail(normalizedEmail);
    setStorageItem(SESSION_USER_KEY, JSON.stringify(newUser));

    return {
      success: true,
      user: newUser,
    };
  },

  /**
   * Continue with Google authentication (Creates/links Personal Account ONLY, never an Entity!)
   */
  async signInWithGoogle(): Promise<AuthResult> {
    if (isFirebaseConfigured) {
      // In real Firebase: signInWithPopup(auth, googleProvider)
    }

    await new Promise((resolve) => setTimeout(resolve, 850));

    removeStorageItem(IDENTITY_DATA_KEY);

    const xuId = generateXentroId("XU");
    const googleUser: User = {
      id: xuId,
      xentroId: xuId,
      username: "@alexrivera24",
      fullName: "Alex Rivera",
      email: "alex.rivera@xentro.network",
      phoneNumber: "+91 98765 43210",
      provider: "google",
      createdAt: new Date().toISOString(),
      emailVerified: true,
      phoneVerified: false,
      identityStatus: "NOT_SUBMITTED",
      activeRoles: ["Personal Account"],
    };

    setStorageItem(SESSION_USER_KEY, JSON.stringify(googleUser));

    return {
      success: true,
      user: googleUser,
    };
  },

  /**
   * Retrieve active Personal Account
   */
  getCurrentUser(): User | null {
    const stored = getStorageItem(SESSION_USER_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Update active user contact details
   */
  updateContact(email?: string, phone?: string): User | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    if (email) user.email = email.trim().toLowerCase();
    if (phone) user.phoneNumber = phone.trim();

    setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Simulate Phone OTP Verification
   */
  async verifyPhoneOtp(code: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Any 6-digit code succeeds in simulation
    if (code.length === 6) {
      const user = this.getCurrentUser();
      if (user) {
        user.phoneVerified = true;
        setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
      }
      return true;
    }
    return false;
  },

  /**
   * Simulate Email Verification
   */
  async verifyEmailCode(code: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (code.length === 6) {
      const user = this.getCurrentUser();
      if (user) {
        user.emailVerified = true;
        setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
      }
      return true;
    }
    return false;
  },

  /**
   * Submit Identity Verification (Aadhaar Security: Only stores masked Aadhaar!)
   */
  async submitIdentityVerification(data: {
    nameAsPerAadhaar: string;
    aadhaarRaw?: string;
    dob?: string;
    gender?: string;
    address?: string;
    documentName?: string;
  }): Promise<IdentityVerificationData> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const masked = data.aadhaarRaw ? maskAadhaar(data.aadhaarRaw) : "VERIFIED";
    const last4 = data.aadhaarRaw ? data.aadhaarRaw.replace(/\D/g, "").slice(-4) : "";

    const record: IdentityVerificationData = {
      status: "VERIFIED", // Automatically simulated as Verified for prototype flow
      nameAsPerAadhaar: data.nameAsPerAadhaar.trim(),
      maskedAadhaar: masked,
      rawAadhaarLast4: last4,
      dob: data.dob,
      gender: data.gender,
      address: data.address,
      documentName: data.documentName || "aadhaar_card.pdf",
      consentGiven: true,
      submittedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      statusMessage: "Identity verified successfully under XENTRO Zero-Knowledge Protocol.",
    };

    setStorageItem(IDENTITY_DATA_KEY, JSON.stringify(record));

    const user = this.getCurrentUser();
    if (user) {
      user.identityStatus = "VERIFIED";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    return record;
  },

  /**
   * Update identity verification state for testing state machines
   */
  setIdentityVerificationState(status: IdentityVerificationState, message?: string): void {
    const existing = this.getIdentityVerification();
    if (existing) {
      existing.status = status;
      if (message) existing.statusMessage = message;
      setStorageItem(IDENTITY_DATA_KEY, JSON.stringify(existing));
    }
    const user = this.getCurrentUser();
    if (user) {
      user.identityStatus = status;
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Get stored identity verification data (masked Aadhaar only)
   */
  getIdentityVerification(): IdentityVerificationData | null {
    const stored = getStorageItem(IDENTITY_DATA_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Save Personal Profile (Isolated from identity verification data!)
   * Persists to localStorage and syncs to MongoDB backend
   */
  async savePersonalProfile(profile: PersonalProfile): Promise<void> {
    setStorageItem(PERSONAL_PROFILE_KEY, JSON.stringify(profile));

    // Also update xentro_user_profile with these fields
    try {
      const stored = getStorageItem("xentro_user_profile");
      if (stored) {
        const u = JSON.parse(stored);
        const updated = {
          ...u,
          name: profile.fullName || u.name,
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          roleTitle: profile.currentRole || u.roleTitle,
          currentRole: profile.currentRole,
          organization: profile.currentOrganization || u.organization,
          currentOrganization: profile.currentOrganization,
          education: profile.education,
          professionalExperience: profile.professionalExperience,
          skills: profile.skills,
          areasOfExpertise: profile.areasOfExpertise || profile.skills,
          industries: profile.industries,
          industriesOfFocus: profile.industries,
          startupInterests: profile.startupInterests,
          entrepreneurshipInterests: profile.entrepreneurshipInterests || profile.startupInterests,
          linkedin: profile.linkedin,
          website: profile.website,
          otherLink: profile.otherLinks?.[0] || "",
          otherLinks: profile.otherLinks || [],
          avatar: profile.photoUrl || u.avatar,
        };
        setStorageItem("xentro_user_profile", JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("xentro-role-changed", { detail: { role: updated.role, profile: updated } })
          );
        }
      }
    } catch (_) {}

    await this.syncPersonalProfileToBackend(profile);
  },

  async syncPersonalProfileToBackend(profile: PersonalProfile): Promise<boolean> {
    try {
      const user = this.getCurrentUser();
      const userId = user?.id || "";
      const email = user?.email || "";

      const payload = {
        userId,
        email,
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        bio: profile.bio,
        currentRole: profile.currentRole,
        currentOrganization: profile.currentOrganization,
        organization: profile.currentOrganization,
        education: profile.education,
        professionalExperience: profile.professionalExperience,
        experienceSummary: profile.professionalExperience,
        skills: profile.skills,
        areasOfExpertise: profile.areasOfExpertise || profile.skills,
        industries: profile.industries,
        industriesOfFocus: profile.industries,
        startupInterests: profile.startupInterests,
        entrepreneurshipInterests: profile.entrepreneurshipInterests || profile.startupInterests,
        linkedin: profile.linkedin,
        website: profile.website,
        otherLink: profile.otherLinks?.[0] || "",
        otherLinks: profile.otherLinks || [],
        photoUrl: profile.photoUrl,
        avatar: profile.photoUrl,
      };

      const backendUrl = getBackendBaseUrl();
      const res = await fetch(`${backendUrl}/auth/profile/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data?.user) {
          const updatedUser = { ...user, ...json.data.user };
          setStorageItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
        }
        return true;
      }
    } catch (err) {
      console.warn("Failed to sync personal profile to backend:", err);
    }
    return false;
  },

  async fetchUserProfileFromBackend(): Promise<PersonalProfile | null> {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;
      const backendUrl = getBackendBaseUrl();
      const res = await fetch(`${backendUrl}/auth/me/`, {
        headers: {
          "X-User-Id": user.id || "",
        },
      });
      if (res.ok) {
        const json = await res.json();
        const serverUser = json?.data?.user;
        if (serverUser) {
          const pProfile = serverUser.personalProfile || {};
          const p: PersonalProfile = {
            photoUrl: serverUser.avatar || serverUser.photoUrl,
            fullName: serverUser.fullName || pProfile.fullName || user.fullName,
            headline: serverUser.headline || pProfile.headline || "",
            location: serverUser.location || pProfile.location || "",
            bio: serverUser.bio || pProfile.bio || "",
            currentRole: serverUser.currentRole || pProfile.currentRole || "",
            currentOrganization: serverUser.currentOrganization || serverUser.organization || pProfile.currentOrganization || "",
            education: serverUser.education || pProfile.education || "",
            professionalExperience: serverUser.professionalExperience || serverUser.experienceSummary || pProfile.professionalExperience || "",
            skills: serverUser.skills || serverUser.areasOfExpertise || pProfile.skills || [],
            areasOfExpertise: serverUser.areasOfExpertise || serverUser.skills || pProfile.areasOfExpertise || [],
            industries: serverUser.industries || serverUser.industriesOfFocus || pProfile.industries || [],
            startupInterests: serverUser.startupInterests || serverUser.entrepreneurshipInterests || pProfile.startupInterests || [],
            entrepreneurshipInterests: serverUser.entrepreneurshipInterests || serverUser.startupInterests || pProfile.entrepreneurshipInterests || [],
            linkedin: serverUser.linkedin || serverUser.linkedinUrl || pProfile.linkedin || "",
            website: serverUser.website || serverUser.websiteUrl || pProfile.website || "",
            otherLinks: serverUser.otherLinks || (serverUser.otherLink ? [serverUser.otherLink] : []) || pProfile.otherLinks || [],
          };
          setStorageItem(PERSONAL_PROFILE_KEY, JSON.stringify(p));
          setStorageItem(SESSION_USER_KEY, JSON.stringify({ ...user, ...serverUser }));
          return p;
        }
      }
    } catch (_) {}
    return null;
  },

  /**
   * Get stored Personal Profile
   */
  getPersonalProfile(): PersonalProfile | null {
    const stored = getStorageItem(PERSONAL_PROFILE_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Register a Startup Entity (separate from personal account)
   */
  async createStartupEntity(entityData: Omit<StartupEntity, "id" | "founderPersonalAccountId" | "createdAt">): Promise<StartupEntity> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = this.getCurrentUser();
    const stId = generateXentroId("ST");
    const foId = generateXentroId("FO");
    const stUsername = generateUsername(entityData.startupName);

    const newStartup: StartupEntity = {
      ...entityData,
      id: stId,
      startupId: stId,
      username: stUsername,
      founderId: foId,
      founderPersonalAccountId: user?.id || generateXentroId("XU"),
      createdAt: new Date().toISOString(),
    };

    const stored = getStorageItem(STARTUP_ENTITIES_KEY);
    const list = stored ? JSON.parse(stored) : [];
    list.push(newStartup);
    setStorageItem(STARTUP_ENTITIES_KEY, JSON.stringify(list));

    if (user) {
      if (!user.activeRoles.includes("Startup Founder")) {
        user.activeRoles.push("Startup Founder");
      }
      user.roleId = foId;
      user.accountType = "Startup";
      user.entityId = stId;
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    await syncBackendAccountType("Startup", {
      startupDetails: {
        ...entityData,
        startupId: stId,
      }
    });

    return newStartup;
  },

  /**
   * Activate Mentor Personal Role on existing Personal Account
   */
  async activateMentorRole(setupData: any): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = this.getCurrentUser();
    const menId = generateXentroId("MEN");
    if (user) {
      if (!user.activeRoles.includes("Mentor")) {
        user.activeRoles.push("Mentor");
      }
      user.roleId = menId;
      user.accountType = "Mentor";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
      setStorageItem("xentro_mentor_setup", JSON.stringify({ ...setupData, mentorId: menId }));
    }

    await syncBackendAccountType("Mentor", {
      mentorDetails: {
        ...setupData,
        mentorId: menId,
      }
    });

    return true;
  },

  /**
   * Activate Individual Investor Personal Role
   */
  async activateIndividualInvestorRole(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = this.getCurrentUser();
    const invId = generateXentroId("INV");
    if (user) {
      if (!user.activeRoles.includes("Individual Investor")) {
        user.activeRoles.push("Individual Investor");
      }
      user.roleId = invId;
      user.accountType = "Investor";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    await syncBackendAccountType("Investor", {
      investorDetails: {
        investorType: "INDIVIDUAL",
        roleId: invId,
      }
    });

    return true;
  },

  /**
   * Create or Request Membership for Investor Organization Entity
   */
  async registerInvestorOrg(org: Omit<InvestorOrgEntity, "id">): Promise<InvestorOrgEntity> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const vciId = generateXentroId("VCI");
    const vciUsername = generateUsername(org.orgName);
    const newOrg: InvestorOrgEntity = {
      ...org,
      id: vciId,
      username: vciUsername,
    };

    const stored = getStorageItem(INVESTOR_ENTITIES_KEY);
    const list = stored ? JSON.parse(stored) : [];
    list.push(newOrg);
    setStorageItem(INVESTOR_ENTITIES_KEY, JSON.stringify(list));

    const user = this.getCurrentUser();
    if (user) {
      if (!user.activeRoles.includes("Institutional Investor")) {
        user.activeRoles.push("Institutional Investor");
      }
      user.roleId = vciId;
      user.accountType = "Investor";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    await syncBackendAccountType("Investor", {
      investorDetails: {
        ...org,
        investorType: "INSTITUTIONAL",
        roleId: vciId,
      }
    });

    return newOrg;
  },

  /**
   * Submit ESP / Institution Request for Xentro Admin Review
   */
  async submitEspRequest(requestData: Omit<EspRequest, "id" | "status" | "submittedAt">): Promise<EspRequest> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const esId = generateXentroId("ES");
    const newRequest: EspRequest = {
      ...requestData,
      id: esId,
      status: "UNDER_REVIEW",
      submittedAt: new Date().toISOString(),
    };

    const stored = getStorageItem(ESP_REQUESTS_KEY);
    const list = stored ? JSON.parse(stored) : [];
    list.push(newRequest);
    setStorageItem(ESP_REQUESTS_KEY, JSON.stringify(list));

    const user = this.getCurrentUser();
    if (user) {
      if (!user.activeRoles.includes("ESP Applicant")) {
        user.activeRoles.push("ESP Applicant");
      }
      user.roleId = esId;
      user.accountType = "ESP";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    await syncBackendAccountType("ESP", {
      espDetails: {
        ...requestData,
        id: esId,
      }
    });

    return newRequest;
  },

  /**
   * Activate Explorer Capabilities on existing Personal Account
   */
  async activateExplorerAccess(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const user = this.getCurrentUser();
    if (user) {
      if (!user.activeRoles.includes("Explorer")) {
        user.activeRoles.push("Explorer");
      }
      user.accountType = "Explorer";
      setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    await syncBackendAccountType("Explorer");

    return true;
  },

  /**
   * Sign in with existing email and password
   */
  async signInWithEmail(email: string, _password?: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existingUser = this.getCurrentUser();
    const user: User = existingUser && existingUser.email === normalizedEmail
      ? existingUser
      : {
          id: "usr_" + Math.random().toString(36).substring(2, 11),
          fullName: normalizedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          email: normalizedEmail,
          phoneNumber: "+91 98765 43210",
          provider: "email",
          createdAt: new Date().toISOString(),
          emailVerified: true,
          phoneVerified: true,
          identityStatus: "VERIFIED",
          activeRoles: ["Personal Account"],
        };

    saveRegisteredEmail(normalizedEmail);
    setStorageItem(SESSION_USER_KEY, JSON.stringify(user));

    return {
      success: true,
      user,
    };
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  /**
   * Check if user has completed full onboarding
   */
  isOnboardingComplete(): boolean {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("xentro_onboarding_complete") === "true";
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Complete onboarding and associate persona role
   */
  completeOnboarding(role?: string): void {
    setStorageItem("xentro_onboarding_complete", "true");
    if (role) {
      setStorageItem("xentro_active_role", role);
      const user = this.getCurrentUser();
      if (user) {
        if (!user.activeRoles) user.activeRoles = [];
        if (!user.activeRoles.includes(role)) {
          user.activeRoles.push(role);
          setStorageItem(SESSION_USER_KEY, JSON.stringify(user));
        }
      }
    }
  },

  /**
   * Clear session
   */
  signOut(): void {
    removeStorageItem(SESSION_USER_KEY);
    removeStorageItem(IDENTITY_DATA_KEY);
    removeStorageItem(PERSONAL_PROFILE_KEY);
    removeStorageItem("xentro_user_preference");
    removeStorageItem("xentro_onboarding_complete");
    removeStorageItem("xentro_user_profile");
    removeStorageItem("xentro_active_role");
    if (typeof document !== "undefined") {
      document.cookie = "xentro_session=; path=/; max-age=0; SameSite=Lax";
    }
  },
};

export { resolveAvatarUrl } from '../messagingService';

