import {
  MentorshipRequest,
  ActiveMentorship,
  PastMentorship,
  MentorMeeting,
  MentorAvailabilityConfig,
  DiscoverStartup,
  MentorOpportunityItem,
  MentorNotificationItem,
} from '@/types/mentor';

export const mentorUser = {
  id: 'user_mentor',
  name: 'Dr. Arvind Swaminathan',
  username: 'arvind_swaminathan',
  title: 'AI Research Scientist & Strategic Startup Mentor',
  headline: 'Guiding early & growth-stage founders on Scaled AI Architecture, GTM & Venture Readiness.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
  verified: true,
  rating: 4.9,
  reviewsCount: 48,
  mentoredStartupsCount: 42,
  mentoringHours: 320,
  activeMentees: 18,
  location: 'Hyderabad, India • Available Globally (Remote)',
  primaryAffiliation: 'Adjunct Professor, IIIT-H Foundation',
  pastAffiliation: 'Ex-Staff Research Scientist, Google DeepMind',
  email: 'arvind.swaminathan@xentro.network',
  linkedin: 'https://linkedin.com/in/arvind-swaminathan-ai',
  github: 'https://github.com/arvind-swaminathan',
  website: 'https://arvind-ai.research.org',
  bio: 'Ph.D. in Computer Science (Stanford AI Lab). Over 14 years of research and industry engineering experience spanning generative models, distributed vector stores, and neural reasoning graphs.',
};

export const initialMentorshipRequests: MentorshipRequest[] = [];

export const initialActiveMentorships: ActiveMentorship[] = [];
export const initialPastMentorships: PastMentorship[] = [];

export const initialMentorMeetings: MentorMeeting[] = [];

export const defaultAvailability: MentorAvailabilityConfig = {
  availableDays: ['Mon', 'Tue', 'Thu'],
  startTime: '10:00 AM',
  endTime: '05:00 PM',
  sessionDuration: 45,
  meetingModes: ['Video (Google Meet)', 'Video (Zoom)', 'Audio Call'],
  bufferTime: 15,
  autoAcceptCohort: false,
};

export const initialDiscoverStartups: DiscoverStartup[] = [];
export const initialMentorOpportunities: MentorOpportunityItem[] = [];
export const initialMentorNotifications: MentorNotificationItem[] = [];
