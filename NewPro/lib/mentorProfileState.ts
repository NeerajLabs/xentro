'use client';

import {
  FullMentorProfile,
  MentorProfessionalExperience,
  MentorEducation,
  MentorshipProgramExperience,
  MentorStartupExperience,
  FounderTestimonial,
  MentorMeetingSlotConfig,
} from '@/types/mentor';
import { getUserProfile } from './userProfile';

export const MENTOR_PROFILE_STORAGE_KEY = 'xentro_mentor_profile';
export const MENTOR_PROFILE_UPDATED_EVENT = 'xentro-mentor-profile-updated';

export const defaultMentorProfile: FullMentorProfile = {
  id: 'user_mentor',
  name: 'Dr. Arvind Swaminathan',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
  currentRole: {
    designation: 'Principal AI Systems Architect & Venture Mentor',
    organization: 'IIIT-H Foundation & ScaleCraft Advisory',
    duration: '2022 — Present',
  },
  location: {
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
  },
  primaryExpertise: 'Scaled AI Systems & Strategic GTM',
  headline: 'Guiding early & growth-stage founders on Scaled AI Architecture, GTM & Venture Readiness.',
  verified: true,
  verificationBadge: 'Verified Mentor • XENTRO Partner',
  rating: 4.9,
  reviewsCount: 38,
  about: 'Ph.D. in Computer Science (Stanford AI Lab). Over 14 years of research and industry engineering experience spanning generative models, distributed vector stores, and neural reasoning graphs. Former Staff Scientist at Google DeepMind. Passionate about helping deeptech founders navigate 0 to 1 scaling, enterprise contracts, and institutional fundraising rounds.',
  professionalExperience: [
    {
      organization: 'ScaleCraft Advisory',
      position: 'Principal Growth & Architecture Advisor',
      startDate: '2022',
      endDate: 'Present',
      description: 'Advising high-conviction deeptech and enterprise SaaS founders on architecture scalability, enterprise SLA defensibility, and institutional SAFE round structure.',
    },
    {
      organization: 'Google DeepMind',
      position: 'Staff Research Scientist',
      startDate: '2016',
      endDate: '2022',
      description: 'Led core technical teams on distributed vector retrieval, neural knowledge graphs, and LLM reasoning alignment.',
    },
    {
      organization: 'Stanford AI Lab',
      position: 'Postdoctoral Research Fellow',
      startDate: '2012',
      endDate: '2016',
      description: 'Pioneered research on topological knowledge graphs, graph neural networks, and automated semantic verification.',
    },
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'Doctor of Philosophy (Ph.D.)',
      fieldOfStudy: 'Computer Science & Machine Intelligence',
      startYear: '2008',
      endYear: '2012',
    },
    {
      institution: 'Indian Institute of Technology (IIT) Madras',
      degree: 'Bachelor of Technology (B.Tech)',
      fieldOfStudy: 'Computer Science & Engineering',
      startYear: '2004',
      endYear: '2008',
    },
  ],
  expertise: [
    'Product Strategy',
    'AI & Machine Learning',
    'Enterprise GTM',
    'Architecture Scaling',
    'Pricing Architecture',
    'SAFE Diligence',
    'Team Building',
  ],
  industries: ['Enterprise AI', 'DeepTech', 'B2B SaaS', 'Cloud Infrastructure', 'FinTech'],
  areasOfMentorship: [
    'Product-Market Fit',
    'Enterprise GTM',
    'Architecture Scaling',
    'Pitch Deck Review',
    'Fundraising Strategy',
    'Team Building',
  ],
  startupStagesMentored: ['Idea', 'Pre-Seed', 'Seed', 'Series A'],
  languages: ['English', 'Hindi', 'Telugu'],
  mentorshipBackground: {
    mentoringExperience: '6+ years active venture mentoring across South Asia accelerators',
    founderTypesMentored: ['Technical Founders', 'First-Time Entrepreneurs', 'DeepTech Researchers', 'Product Leaders'],
    startupStagesMentored: ['Pre-Seed', 'Seed', 'Series A'],
    areasMentored: ['Enterprise GTM Playbooks', 'Pricing Architecture', 'Architecture Scaling', 'SAFE Diligence'],
    programsAndInstitutions: [
      {
        name: 'T-Hub Accelerator',
        role: 'Lead Mentor & Coach',
        period: '2022 — Present',
        description: 'Conducting cohort masterclasses on enterprise pilot defense and 1:1 architectural audits.',
      },
      {
        name: 'IIIT-H Foundation',
        role: 'Adjunct Professor & Startup Advisor',
        period: '2020 — Present',
        description: 'Guiding research spin-outs on commercialization, patent strategy, and institutional capital.',
      },
      {
        name: 'Surge by Peak XV',
        role: 'Guest Speaker & Mentor',
        period: '2021 — 2023',
        description: 'Conducted engineering scalability teardowns for Seed cohort companies.',
      },
    ],
    relevantAchievements: [
      'Mentored 42+ early-stage startups with cumulative follow-on funding of $38M+',
      '14 mentees raised institutional Seed / Series A from Tier-1 venture funds',
      'Authored 20+ peer-reviewed papers on neural graph topologies & distributed AI systems',
    ],
    foundersMentoredCount: 42,
    isFoundersMentoredVerified: true,
  },
  previousStartupExperience: [],
  founderTestimonials: [],
  meetingSlots: {
    sessionTypes: ['Discovery Call', 'Mentorship Session', 'Founder Consultation'],
    durations: ['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes'],
    availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableTimeSlots: [
      '10:00 AM — 10:45 AM',
      '02:00 PM — 02:45 PM',
      '04:30 PM — 05:15 PM',
      '06:00 PM — 06:45 PM',
    ],
    timeZone: 'IST (UTC +5:30)',
    meetingModes: ['Video', 'Audio', 'In-Person'],
  },
};

/**
 * Own-profile shell: same shape as the demo record but with NO demo content.
 * Demo mentors remain available only when viewing OTHER people's profiles.
 */
function emptyOwnMentorProfile(): FullMentorProfile {
  // Inherit identity the user actually entered during onboarding (never demo data)
  const viewer = getUserProfile();
  const locationParts = (viewer.location || '').split(',').map((p) => p.trim()).filter(Boolean);
  return {
    ...defaultMentorProfile,
    name: viewer.name || '',
    avatar: viewer.avatar || '/xentro-logo.png',
    banner: viewer.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    currentRole: { designation: viewer.roleTitle || '', organization: viewer.organization || '', duration: '' },
    location: { city: locationParts[0] || '', state: locationParts[1] || '', country: locationParts[2] || '' },
    primaryExpertise: viewer.sector || '',
    headline: viewer.bio || '',
    verified: false,
    verificationBadge: '',
    rating: 0,
    reviewsCount: 0,
    about: viewer.bio || '',
    professionalExperience: [],
    education: [],
    expertise: [],
    industries: [],
    areasOfMentorship: [],
    startupStagesMentored: [],
    languages: [],
    mentorshipBackground: {
      ...defaultMentorProfile.mentorshipBackground,
      mentoringExperience: '',
      founderTypesMentored: [],
      startupStagesMentored: [],
      areasMentored: [],
      programsAndInstitutions: [],
      relevantAchievements: [],
      foundersMentoredCount: 0,
      isFoundersMentoredVerified: false,
    },
    previousStartupExperience: [],
    founderTestimonials: [],
    meetingSlots: {
      ...defaultMentorProfile.meetingSlots,
      sessionTypes: [],
      durations: [],
      availableDays: [],
      availableTimeSlots: [],
      meetingModes: [],
    },
  };
}

/**
 * Get stored mentor profile from localStorage, falling back to an empty own-profile shell.
 */
export function getStoredMentorProfile(mentorId = 'user_mentor'): FullMentorProfile {
  if (typeof window === 'undefined') {
    return emptyOwnMentorProfile();
  }

  try {
    const raw = localStorage.getItem(`${MENTOR_PROFILE_STORAGE_KEY}_${mentorId}`) || localStorage.getItem(MENTOR_PROFILE_STORAGE_KEY);
    if (!raw) {
      return emptyOwnMentorProfile();
    }

    const parsed = JSON.parse(raw);
    const shell = emptyOwnMentorProfile();
    return {
      ...shell,
      ...parsed,
      currentRole: {
        ...shell.currentRole,
        ...(parsed.currentRole || {}),
      },
      location: {
        ...shell.location,
        ...(parsed.location || {}),
      },
      mentorshipBackground: {
        ...shell.mentorshipBackground,
        ...(parsed.mentorshipBackground || {}),
      },
      meetingSlots: {
        ...shell.meetingSlots,
        ...(parsed.meetingSlots || {}),
      },
    };
  } catch (err) {
    console.error('Failed to parse stored mentor profile:', err);
    return emptyOwnMentorProfile();
  }
}

/**
 * Save updated mentor profile to localStorage and dispatch update event.
 */
export function saveStoredMentorProfile(profile: FullMentorProfile): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(MENTOR_PROFILE_STORAGE_KEY, serialized);
    localStorage.setItem(`${MENTOR_PROFILE_STORAGE_KEY}_${profile.id}`, serialized);

    window.dispatchEvent(
      new CustomEvent(MENTOR_PROFILE_UPDATED_EVENT, {
        detail: { profile },
      })
    );
  } catch (err) {
    console.error('Failed to save mentor profile:', err);
  }
}

/**
 * Reset mentor profile back to the blank own-profile template (no demo content).
 */
export function resetStoredMentorProfile(mentorId = 'user_mentor'): FullMentorProfile {
  const shell = emptyOwnMentorProfile();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(MENTOR_PROFILE_STORAGE_KEY);
      localStorage.removeItem(`${MENTOR_PROFILE_STORAGE_KEY}_${mentorId}`);
      window.dispatchEvent(
        new CustomEvent(MENTOR_PROFILE_UPDATED_EVENT, {
          detail: { profile: shell },
        })
      );
    } catch (err) {
      console.error('Failed to reset mentor profile:', err);
    }
  }
  return shell;
}
