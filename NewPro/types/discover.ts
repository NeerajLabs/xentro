export type DiscoverCategory = 'startups' | 'mentors' | 'investors' | 'esps';

export interface StartupRecommendation {
  id: string;
  name: string;
  logo: string;
  industry: string;
  stage: 'Pre-Seed' | 'Seed' | 'Early Stage' | 'Growth';
  location: string;
  fundingRaised: string;
  description: string;
  needsHelpWith: string[];
  tags: string[];
  founder: {
    name: string;
    avatar: string;
    role: string;
  };
  metrics?: string;
}

export interface MentorRecommendation {
  id: string;
  name: string;
  avatar: string;
  title: string;
  expertise: string[];
  industry: string;
  location: string;
  experienceYears: string;
  mentorshipAreas: string[];
  availabilityStatus?: 'Available for 1:1' | 'Accepting Mentees' | 'Limited Slots';
  bio: string;
  verified?: boolean;
}

export interface InvestorRecommendation {
  id: string;
  name: string;
  logo: string;
  investorType: 'Venture Capital' | 'Angel Network' | 'Corporate VC' | 'Growth Fund';
  location: string;
  stages: string[];
  focusIndustries: string[];
  ticketSize?: string;
  portfolioHighlights?: string[];
  description: string;
  verified?: boolean;
}

export interface UniversityRecommendation {
  id: string;
  name: string;
  logo: string;
  location: string;
  institutionType: 'University' | 'Technology Institute' | 'Business School' | 'Research Park';
  strengths: string[];
  ecosystemPrograms: string[];
  description: string;
  incubationStats?: {
    incubatedCount: number;
    fundingFacilitated: string;
    activeLabs: number;
  };
}
