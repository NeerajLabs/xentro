export type ESPPublicCategory =
  | 'Leadership & Governance'
  | 'Core Team'
  | 'Mentors & Advisors'
  | 'Investment Partners'
  | 'Ecosystem Partners'
  | 'Faculty Coordinators'
  | 'Student Innovators';

export type ESPRelationshipTypePublic =
  | 'Internal Member'
  | 'External Mentor'
  | 'External Advisor'
  | 'Ecosystem Partner'
  | 'Investment Partner'
  | 'Faculty'
  | 'Student'
  | 'Other';

export type ESPSourceType = 'entity_member' | 'xentro_user' | 'external_record';

export type ESPPublicVisibilityStatus = 'published' | 'draft' | 'hidden' | 'pending_confirmation';

export interface ESPPublicFieldVisibility {
  photo: boolean;
  designation: boolean;
  department: boolean;
  bio: boolean;
  expertise: boolean;
  linkedin: boolean;
  email: boolean; // default false
  phone: boolean; // default false
  xentroProfile: boolean;
}

export interface ESPPublicTeamMember {
  id: string;
  espEntityId: string;
  sourceType: ESPSourceType;
  membershipId?: string; // Linked to ESPMember id
  xentroUserId?: string; // Linked to personal Xentro account
  xentroMentorId?: string;
  xentroInvestorId?: string;
  name: string;
  avatar?: string;
  publicDesignation: string; // Distinct from internal RBAC role
  internalRoleSnapshot?: string; // Read-only indication of workspace role
  department?: string;
  publicBio?: string;
  publicCategory: ESPPublicCategory;
  relationshipType: ESPRelationshipTypePublic;
  expertise: string[];
  linkedin?: string;
  website?: string;
  email?: string;
  phone?: string;
  organization?: string;
  projectOrStartupName?: string;
  studentRollNumber?: string;
  investmentTicketSize?: string;
  displayOrder: number;
  isFeatured: boolean;
  visibilityStatus: ESPPublicVisibilityStatus;
  fieldVisibility: ESPPublicFieldVisibility;
  studentPrivacyNotice?: boolean;
  lastUpdated?: string;
}

export interface ESPEcosystemOrgPartner {
  id: string;
  espEntityId: string;
  name: string;
  logo?: string;
  category:
    | 'Universities'
    | 'Corporates'
    | 'Government Agencies'
    | 'Venture Funds'
    | 'Accelerators'
    | 'Technology Partners'
    | 'Industry Bodies';
  website?: string;
  partnershipScope?: string;
  isFeatured?: boolean;
  displayOrder: number;
  status: 'published' | 'draft' | 'hidden';
}

export interface ESPPublicSection {
  id: string;
  title: string;
  hasContent: boolean;
  members?: ESPPublicTeamMember[];
  orgPartners?: ESPEcosystemOrgPartner[];
  personPartners?: ESPPublicTeamMember[];
}

export interface ESPPublicViewData {
  totalPublishedCount: number;
  featuredLeadership: ESPPublicTeamMember[];
  sections: ESPPublicSection[];
}
