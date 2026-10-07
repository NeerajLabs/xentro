import { User } from './index';

export type MentorshipRequestStatus = 'pending' | 'accepted' | 'declined' | 'more_info';

export interface FounderInfo {
  id: string;
  name: string;
  avatar: string;
  title: string;
  startupName: string;
  startupStage: string;
  startupSector: string;
  location: string;
  bio: string;
  traction?: string;
  raised?: string;
  pitchSummary?: string;
}

export interface MentorshipRequest {
  id: string;
  founder: FounderInfo;
  reason: string;
  requestedArea: string;
  dateRequested: string;
  status: MentorshipRequestStatus;
  urgency?: 'normal' | 'high';
  notes?: string;
}

export interface ActiveMentorship {
  id: string;
  founder: FounderInfo;
  mentorshipFocus: string;
  startDate: string;
  lastInteraction: string;
  nextMeeting: string;
  status: 'Active' | 'On Hold';
  completedSessions: number;
  totalPlannedSessions: number;
  goals: string[];
}

export interface PastMentorship {
  id: string;
  founder: FounderInfo;
  mentorshipFocus: string;
  duration: string;
  completionDate: string;
  outcomeSummary: string;
  rating: number;
  testimonial?: string;
}

export type MeetingMode = 'Video (Google Meet)' | 'Video (Zoom)' | 'Audio Call' | 'In-person';

export interface MentorMeeting {
  id: string;
  title: string;
  founder: FounderInfo;
  date: string;
  time: string;
  duration: string;
  mode: MeetingMode;
  meetingLink?: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  isMentee: boolean;
  agenda: string;
}

export interface MentorAvailabilityConfig {
  availableDays: string[];
  startTime: string;
  endTime: string;
  sessionDuration: number; // in minutes
  meetingModes: string[];
  bufferTime: number; // in minutes
  autoAcceptCohort: boolean;
}

export interface DiscoverStartup {
  id: string;
  name: string;
  logo: string;
  industry: string;
  stage: 'Pre-Seed' | 'Seed' | 'Early Stage' | 'Growth';
  location: string;
  fundingRaised: string;
  needsHelpWith: string[];
  description: string;
  founder: {
    name: string;
    avatar: string;
    role: string;
  };
  metrics?: string;
}

export interface MentorOpportunityItem {
  id: string;
  title: string;
  category:
    | 'Mentorship Programs'
    | 'Startup Programs'
    | 'Events'
    | 'Workshops'
    | 'Conferences'
    | 'Speaking Opportunities'
    | 'Judging Opportunities'
    | 'Advisory Opportunities'
    | 'Ecosystem Initiatives';
  organization: string;
  location: string;
  type: string;
  deadline: string;
  badge: string;
  compensation: string;
  description: string;
}

export interface MentorNotificationItem {
  id: string;
  type: 'request' | 'meeting' | 'message' | 'connection' | 'opportunity' | 'system';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

export interface MentorProfessionalExperience {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface MentorEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface MentorshipProgramExperience {
  name: string;
  role: 'Mentor' | 'Advisor' | 'Startup Coach' | 'Jury Member' | 'Domain Expert' | string;
  period: string;
  description: string;
}

export interface MentorStartupExperience {
  startupName: string;
  startupLogo: string;
  role: string;
  industry: string;
  stage: string;
  period: string;
  contribution: string;
}

export interface FounderTestimonial {
  id: string;
  testimonial: string;
  founderName: string;
  founderPhoto: string;
  founderDesignation: string;
  startupName: string;
  startupLogo?: string;
  founderProfileLink?: string;
  startupProfileLink?: string;
  periodOfMentorship: string;
}

export interface MentorMeetingSlotConfig {
  sessionTypes: ('Discovery Call' | 'Mentorship Session' | 'Founder Consultation')[];
  durations: ('15 Minutes' | '30 Minutes' | '45 Minutes' | '60 Minutes')[];
  availableDays: string[];
  availableTimeSlots: string[];
  timeZone: string;
  meetingModes: ('Video' | 'Audio' | 'In-Person')[];
}

export interface FullMentorProfile {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  currentRole: {
    designation: string;
    organization: string;
    duration: string;
  };
  location: {
    city: string;
    state?: string;
    country: string;
  };
  primaryExpertise: string;
  headline?: string;
  verified: boolean;
  verificationBadge?: string;
  rating?: number;
  reviewsCount?: number;
  about: string;
  professionalExperience: MentorProfessionalExperience[];
  education: MentorEducation[];
  expertise: string[];
  industries: string[];
  areasOfMentorship: string[];
  startupStagesMentored: string[];
  languages: string[];
  mentorshipBackground: {
    mentoringExperience: string;
    founderTypesMentored: string[];
    startupStagesMentored: string[];
    areasMentored: string[];
    programsAndInstitutions: MentorshipProgramExperience[];
    relevantAchievements: string[];
    foundersMentoredCount: number;
    isFoundersMentoredVerified: boolean;
  };
  previousStartupExperience: MentorStartupExperience[];
  founderTestimonials: FounderTestimonial[];
  meetingSlots: MentorMeetingSlotConfig;
  mentorshipOfferings?: MENTORSHIP_OFFERING[];
}

// =========================================================================
// STRUCTURED MENTORSHIP DOMAIN MODELS
// =========================================================================

export type MentorshipDuration = '1 Month' | '3 Months' | '6 Months';

export type MentorshipLifecycleStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'ENDED_EARLY'
  | 'PAYMENT_FAILED'
  | 'REFUNDED';

export interface MENTORSHIP_OFFERING {
  id: string;
  mentorId: string;
  duration: MentorshipDuration;
  price: number;
  currency: string;
  enabled: boolean;
  description: string;
  areasCovered: string[];
  meetingFrequency: string;
  preferredMeetingDuration: string;
  communicationMode: string;
  maximumActiveStartups: number;
  activeStartupsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MENTORSHIP_REQUEST {
  id: string;
  mentorId: string;
  mentorName: string;
  startup: {
    id: string;
    name: string;
    stage: string;
    industry: string;
    logo?: string;
    description?: string;
  };
  founder: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    title: string;
  };
  selectedDuration: MentorshipDuration;
  selectedPackage: string;
  price: number;
  currency: string;
  mentorshipAreasRequired: string[];
  currentStartupStage: string;
  reasonForRequest: string;
  currentChallenges: string;
  expectedOutcomes: string;
  preferredStartDate: string;
  additionalMessage?: string;
  requestDate: string;
  status: MentorshipLifecycleStatus;
  rejectionReason?: string;
}

export interface MENTORSHIP_GOAL {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  targetDate?: string;
  completedAt?: string;
}

export interface MENTORSHIP_PROGRESS_UPDATE {
  id: string;
  author: string;
  role: 'Founder' | 'Mentor';
  title: string;
  summary: string;
  metrics?: string;
  timestamp: string;
}

export interface MENTORSHIP_TIMELINE_EVENT {
  id: string;
  title: string;
  category: 'System' | 'Meeting' | 'Milestone' | 'Resource' | 'Review';
  timestamp: string;
  description: string;
}

export interface MENTORSHIP_SHARED_RESOURCE {
  id: string;
  title: string;
  type: 'document' | 'link' | 'file' | 'spreadsheet';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
}

export interface MENTORSHIP_TESTIMONIAL {
  id: string;
  mentorshipId: string;
  mentorId: string;
  founderName: string;
  founderPhoto: string;
  founderDesignation: string;
  startupName: string;
  startupLogo?: string;
  rating: number;
  content: string;
  periodOfMentorship: string;
  submittedAt: string;
  isPubliclyDisplayed: boolean;
  authoredByFounderId: string;
}

export interface MENTORSHIP_TRANSACTION {
  id: string;
  mentorshipId: string;
  transactionId: string;
  startupId: string;
  startupName: string;
  founderName: string;
  mentorId: string;
  mentorName: string;
  mentorshipPackage: string;
  duration: string;
  grossAmount: number;
  xentroCommission: number;
  netMentorAmount: number;
  currency: string;
  paymentStatus: 'Completed' | 'Pending' | 'Refunded';
  date: string;
  paymentMethod: string;
}

export interface MENTORSHIP {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  startupId: string;
  startupName: string;
  startupStage: string;
  startupSector: string;
  startupLogo?: string;
  founder: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    title: string;
  };
  offeringId: string;
  duration: MentorshipDuration;
  packageTitle: string;
  price: number;
  currency: string;
  status: MentorshipLifecycleStatus;
  startDate: string;
  endDate: string;
  timeRemaining: string;
  lastInteraction: string;
  nextMeeting?: string;
  paymentStatus: 'PAID' | 'PENDING' | 'COMPLIMENTARY_ENTITLEMENT' | 'REFUNDED';
  mentorshipFocus: string[];
  expectedOutcomes: string[];
  goals: MENTORSHIP_GOAL[];
  currentFocus: string;
  progressUpdates: MENTORSHIP_PROGRESS_UPDATE[];
  mentorNotes: string[];
  timeline: MENTORSHIP_TIMELINE_EVENT[];
  sharedResources: MENTORSHIP_SHARED_RESOURCE[];
  meetings: MentorMeeting[];
  conversationId?: string;
  testimonialId?: string;
  testimonial?: MENTORSHIP_TESTIMONIAL;
}

