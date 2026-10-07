export interface SignUpFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  consentIdentityVerification: boolean;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
  agreedToPrivacy?: string;
  consentIdentityVerification?: string;
  general?: string;
}

export type IdentityVerificationState =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "FAILED"
  | "RESUBMISSION_REQUIRED"
  | "REVERIFICATION_REQUIRED"
  | "RESTRICTED";

export interface IdentityVerificationData {
  status: IdentityVerificationState;
  nameAsPerAadhaar: string;
  maskedAadhaar: string; // e.g. "XXXX XXXX 1234" - NEVER store full Aadhaar in unmasked profile!
  rawAadhaarLast4: string;
  dob?: string;
  gender?: string;
  address?: string;
  documentName?: string;
  consentGiven: boolean;
  submittedAt?: string;
  verifiedAt?: string;
  statusMessage?: string;
}

export interface PersonalProfile {
  photoUrl?: string;
  fullName: string;
  headline: string;
  location: string;
  bio: string;
  currentRole: string;
  currentOrganization: string;
  education: string;
  professionalExperience: string;
  skills: string[];
  areasOfExpertise: string[];
  industries: string[];
  startupInterests: string[];
  entrepreneurshipInterests: string[];
  linkedin?: string;
  website?: string;
  otherLinks?: string[];
}

export interface User {
  id: string; // e.g. "XU-284731"
  xentroId?: string; // "XU-XXXXXX"
  username?: string; // "@kranthi"
  roleId?: string; // "FO-594120", "MEN-350298", etc.
  fullName: string;
  email: string;
  phoneNumber?: string;
  provider: "email" | "google";
  createdAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityStatus: IdentityVerificationState;
  activeRoles: string[];
  accountType?: string;
  entityId?: string;
  avatar?: string;
  role?: string;
}

export type ParticipationPath =
  | "startup"
  | "mentor"
  | "investor_individual"
  | "investor_org"
  | "esp_request"
  | "explorer";

export interface StartupEntity {
  id: string; // e.g. "ST-726351"
  startupId?: string; // "ST-XXXXXX"
  username?: string; // "@apexventures"
  founderId?: string; // "FO-594120"
  startupName: string;
  founderName: string;
  founderPersonalAccountId: string;
  regType: "MSME" | "Pvt Ltd" | "LLP" | "OPC" | "GST" | "Other";
  regNo: string;
  website: string;
  industry: string;
  location: string;
  description: string;
  stage: "Idea" | "Prototype" | "Early Traction" | "Scaling" | "Growth";
  officialEmail: string;
  isOfficialEmailVerified: boolean;
  createdAt: string;
}

export interface MentorRoleSetup {
  professionalRole: string;
  organization: string;
  yearsOfExperience: string;
  areasOfExpertise: string[];
  mentorshipAreas: string[];
  industries: string[];
  supportingDocName?: string;
}

export interface InvestorOrgEntity {
  id: string; // e.g. "VCI-284912"
  vciId?: string;
  username?: string; // e.g. "@apexventures"
  orgName: string;
  regType: string;
  regNo: string;
  officialEmail: string;
  website: string;
  applicantRole: string;
  isMembershipRequested?: boolean;
}

export interface EspRequest {
  id: string;
  institutionName: string;
  organizationType: string;
  website: string;
  officialEmail: string;
  contactNumber: string;
  city: string;
  state: string;
  country: string;
  applicantName: string;
  designation: string;
  department: string;
  institutionalEmail: string;
  phone: string;
  linkedin: string;
  isAuthorizedRepresentative: boolean;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

export type AuthErrorType =
  | "EMAIL_EXISTS"
  | "INVALID_CREDENTIALS"
  | "NETWORK_ERROR"
  | "GOOGLE_CANCELLED"
  | "SERVER_ERROR"
  | "UNKNOWN";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: {
    type: AuthErrorType;
    message: string;
  };
}

