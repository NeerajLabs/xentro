export interface StartupDashboardData {
  stats: {
    pitchDeckViews: number;
    ddRequests: number;
    fundsTarget: string;
    fundsRaised: string;
    fundsPercent: number;
    mentorConnections: number;
    activeApplications: number;
  };
  investorPipeline: Array<{
    id: string;
    firmName: string;
    logo: string;
    contactPerson: string;
    stage: 'Initial Review' | 'Pitch Meeting' | 'Due Diligence' | 'Term Sheet';
    lastActivity: string;
    ticketSize: string;
    statusBadgeColor: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    category: string;
    dueDate: string;
    completed: boolean;
  }>;
  upcomingCalls: Array<{
    id: string;
    partnerName: string;
    partnerRole: string;
    partnerAvatar: string;
    date: string;
    time: string;
    topic: string;
    type: 'mentor' | 'investor';
  }>;
}

export interface MentorDashboardData {
  stats: {
    activeMentees: number;
    sessionsCompleted: number;
    hoursContributed: number;
    satisfactionRating: number;
    pendingRequests: number;
  };
  pendingRequests: Array<{
    id: string;
    startupName: string;
    founderName: string;
    avatar: string;
    industry: string;
    stage: string;
    requestedTopic: string;
    requestedDate: string;
  }>;
  scheduledSessions: Array<{
    id: string;
    startupName: string;
    founderName: string;
    avatar: string;
    date: string;
    time: string;
    agenda: string;
    meetingUrl: string;
  }>;
  activeMenteesList: Array<{
    id: string;
    name: string;
    startupName: string;
    industry: string;
    progress: string;
    lastSession: string;
  }>;
}

export interface InvestorDashboardData {
  stats: {
    pipelineDeals: number;
    activeDueDiligence: number;
    portfolioCount: number;
    dryPowder: string;
    capitalDeployed: string;
    pitchDecksToReview: number;
  };
  dealPipeline: Array<{
    id: string;
    startupName: string;
    founder: string;
    logo: string;
    industry: string;
    stage: string;
    askingRound: string;
    tractionMRR: string;
    status: 'Inbound Review' | 'First Pitch' | 'Deep Diligence' | 'Partner Discussion' | 'Term Sheet';
  }>;
  portfolioHighlights: Array<{
    id: string;
    name: string;
    investedAmount: string;
    currentMultiple: string;
    growthMoM: string;
    sector: string;
  }>;
  coInvestmentOpportunities: Array<{
    id: string;
    startupName: string;
    leadInvestor: string;
    roundSize: string;
    allocationRemaining: string;
    deadline: string;
  }>;
}

export interface ESPDashboardData {
  stats: {
    incubatedStartups: number;
    activeCohortSize: number;
    applicationsReceived: number;
    fundingFacilitated: string;
    partnerMentors: number;
    labOccupancyPercent: number;
  };
  cohortTimeline: {
    cohortName: string;
    currentWeek: number;
    totalWeeks: number;
    nextMilestone: string;
    demoDayDate: string;
  };
  applicationQueue: Array<{
    id: string;
    startupName: string;
    founders: string;
    category: string;
    pitchDeckUrl: string;
    score: number;
    status: 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Offered';
  }>;
  resourceAllocation: Array<{
    resource: string;
    total: number;
    allocated: number;
    unit: string;
  }>;
}

export const mockStartupDashboard: StartupDashboardData = {
  stats: {
    pitchDeckViews: 0,
    ddRequests: 0,
    fundsTarget: '$0',
    fundsRaised: '$0',
    fundsPercent: 0,
    mentorConnections: 0,
    activeApplications: 0,
  },
  investorPipeline: [],
  milestones: [],
  upcomingCalls: [],
};

export const mockMentorDashboard: MentorDashboardData = {
  stats: {
    activeMentees: 0,
    sessionsCompleted: 0,
    hoursContributed: 0,
    satisfactionRating: 5.0,
    pendingRequests: 0,
  },
  pendingRequests: [],
  scheduledSessions: [],
  activeMenteesList: [],
};

export const mockInvestorDashboard: InvestorDashboardData = {
  stats: {
    pipelineDeals: 0,
    activeDueDiligence: 0,
    portfolioCount: 0,
    dryPowder: '$0',
    capitalDeployed: '$0',
    pitchDecksToReview: 0,
  },
  dealPipeline: [],
  portfolioHighlights: [],
  coInvestmentOpportunities: [],
};

export const mockESPDashboard: ESPDashboardData = {
  stats: {
    incubatedStartups: 0,
    activeCohortSize: 0,
    applicationsReceived: 0,
    fundingFacilitated: '$0',
    partnerMentors: 0,
    labOccupancyPercent: 0,
  },
  cohortTimeline: {
    cohortName: 'Accelerator Cohort',
    currentWeek: 0,
    totalWeeks: 16,
    nextMilestone: 'Cohort Orientation',
    demoDayDate: 'Upcoming',
  },
  applicationQueue: [],
  resourceAllocation: [],
};
