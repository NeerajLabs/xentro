import { UserRole, getUserProfile } from './userProfile';
import { EcosystemAsk, AskVisibility, ASK_ROLE_CONFIGS } from './askConfig';
import { initialAsksList, initialAskResponses, AskResponseItem } from '@/data/startupWorkspaceData';

const ASKS_STORAGE_KEY = 'xentro_ecosystem_asks_v2';
const RESPONSES_STORAGE_KEY = 'xentro_ecosystem_ask_responses_v2';

// Seed asks for all personas so each role has realistic initial Asks
const SEED_ASKS: EcosystemAsk[] = [
  // --- Startup Asks ---
  {
    id: 'ask_startup_1',
    creatorId: 'startup_xentro_1',
    creatorName: 'Xentro Ventures Pvt. Ltd.',
    creatorRole: 'startup',
    creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Decentralized Collaborative Intelligence Infrastructure for Enterprise AI Workflows',
    creatorLocation: 'Bengaluru, India',
    creatorStage: 'Pre-Seed · Verified',
    creatorVerified: true,
    category: 'investment',
    type: 'Investment',
    title: 'Pre-Seed Institutional Round — Raising ₹1.50 Cr for Enterprise Agent Orchestration',
    shortSummary: 'Raising ₹1.5 Cr to accelerate enterprise pilots, expand core sub-50ms AI agent orchestration runtime, and hire founding engineers.',
    description: 'Xentro builds high-performance collaborative intelligence layers connecting enterprise agents with human operators, institutional security safeguards, and multi-tenant telemetry. With ₹30L committed from tier-1 operators, we are allocating the remaining ₹1.2 Cr to institutional micro-VCs and syndicates.',
    desiredOutcome: 'Secure institutional lead investor or strategic syndicate to close round by Nov 30, 2026.',
    categoryData: {
      fundingStage: 'Pre-Seed',
      currency: 'INR',
      totalRoundSize: 15000000,
      amountCommitted: 3000000,
      amountRemaining: 12000000,
      fundraisingStatus: 'Actively Raising',
      roundOpenDate: '2026-08-15',
      targetClosingDate: '2026-11-30',
      investmentInstruments: ['iSAFE', 'CCD'],
      minCheque: 1000000,
      preferredCheque: 2500000,
      maxCheque: 5000000,
      hasLeadInvestor: 'Open to Both',
      valuationStatus: 'Valuation Decided',
      preMoneyValuation: 105000000,
      postMoneyValuation: 120000000,
      equityOffered: '12.5%',
      useOfFunds: ['Product Development', 'Technology', 'Hiring', 'Sales'],
      useOfFundsDescription: '45% model fine-tuning & distributed runtime, 30% enterprise pilots, 25% talent.',
      investorPreferences: ['Micro VC', 'VC Fund', 'Angel Network', 'Strategic Investor'],
      sharePitchDeck: true,
      shareElevatorVideo: true,
      shareFinancialSnapshot: true,
      allowDdLockerRequest: true,
    },
    targeting: {
      userTypes: ['Investor'],
      industries: ['Enterprise Software', 'Artificial Intelligence', 'DeepTech'],
      geography: ['India', 'Singapore', 'United States'],
    },
    visibility: 'public',
    responseActions: ['Express Interest', 'Request Meeting', 'Request Pitch Deck', 'Request DD Locker', 'Send Message'],
    attachments: {
      pitchDeck: true,
      elevatorPitch: true,
      financialSnapshot: true,
      ddLocker: true,
    },
    deadline: '2026-11-30',
    status: 'published',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-09-20T14:30:00.000Z',
    dateCreated: 'Aug 15, 2026',
    requirement: 'Lead VC or syndicate with enterprise SaaS experience. Cheque size ₹25 L - ₹75 L.',
    targetUserType: 'Angel Investors, Micro-VCs & Seed Funds',
    responsesCount: 5,
  },
  {
    id: 'ask_startup_2',
    creatorId: 'startup_xentro_1',
    creatorName: 'Xentro Ventures Pvt. Ltd.',
    creatorRole: 'startup',
    creatorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Decentralized Collaborative Intelligence Infrastructure',
    creatorLocation: 'Bengaluru, India',
    creatorStage: 'Pre-Seed · Verified',
    creatorVerified: true,
    category: 'mentorship',
    type: 'Mentorship',
    title: 'Enterprise Pilot Go-To-Market Strategic Advisor (US & India BFSI)',
    shortSummary: 'Seeking a seasoned SaaS sales mentor to guide enterprise procurement frameworks, SOC2 sales compliance, and tier-1 bank pilot closures.',
    description: 'We have 3 enterprise pilot conversations ongoing and require a seasoned operator with 10+ years scaling enterprise software revenue to review pricing tiers, customer success SLAs, and security reviews.',
    desiredOutcome: 'Establish standard enterprise sales playbook and close 2 paid pilots within 60 days.',
    categoryData: {
      mentorType: 'Domain Expert',
      mentorshipArea: 'Sales',
      currentChallenge: 'Navigating enterprise procurement committees and compliance checklists for bank security reviews.',
      expectedOutcome: 'Deliver standardized enterprise sales contract templates and pricing tier schedule.',
      duration: '3 Months',
      meetingFrequency: 'Bi-weekly',
      preferredStartDate: '2026-10-01',
      meetingMode: 'Virtual (Video Calls)',
      mentorshipBudget: 'FAST Equity Advisory (0.25% - 0.5%)',
      preferredMentorExperience: 'Ex-VP Sales or Enterprise CRO with BFSI SaaS scaling experience.',
    },
    targeting: {
      userTypes: ['Mentor'],
      industries: ['Enterprise SaaS', 'BFSI'],
    },
    visibility: 'public',
    responseActions: ['Offer Mentorship', 'Request Meeting', 'Send Message'],
    deadline: '2026-10-31',
    status: 'published',
    createdAt: '2026-09-01T11:00:00.000Z',
    updatedAt: '2026-09-18T09:00:00.000Z',
    dateCreated: 'Sep 01, 2026',
    requirement: '10+ years scaling B2B enterprise software sales across India and Southeast Asia.',
    targetUserType: 'Founders & SaaS Growth Mentors',
    responsesCount: 3,
  },

  // --- Investor Asks ---
  {
    id: 'ask_investor_1',
    creatorId: 'investor_peak_1',
    creatorName: 'Peak XV Partners — DeepTech Surge Fund',
    creatorRole: 'investor',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Leading early-stage venture capital in India & Southeast Asia',
    creatorLocation: 'Bengaluru & Singapore',
    creatorStage: 'Institutional VC',
    creatorVerified: true,
    category: 'startup_sourcing',
    type: 'Startup Sourcing',
    title: 'Seeking Seed-Stage Enterprise AI & Autonomous Agent Platforms',
    shortSummary: 'Actively deploying $500k - $2M seed capital into technical founders building multi-agent infrastructure, developer tools, and verifiable compliance.',
    description: 'Our Q4 DeepTech thesis is focused on the next paradigm of autonomous agent runtimes, sub-100ms model orchestration, and verifiable enterprise guardrails. Startups should possess working technical prototypes or benchmark data.',
    desiredOutcome: 'Issue 2-3 term sheets for seed cohorts before year-end.',
    categoryData: {
      investmentStage: ['Pre-Seed', 'Seed', 'Seed+'],
      targetSectors: ['Enterprise SaaS', 'Artificial Intelligence & DeepTech'],
      targetSubSectors: 'Autonomous Multi-Agent Systems, LLM Observability, Developer Infra',
      targetGeography: 'India, Southeast Asia, US',
      minInvestmentSize: 25000000,
      maxInvestmentSize: 100000000,
      preferredBusinessModel: 'B2B SaaS / Enterprise API Licenses',
      revenuePreference: 'Early Beta Users',
      leadFollowPreference: 'Can Lead Rounds',
      investmentTimeline: '2-3 Weeks (Fast Track)',
      additionalThesisNotes: 'Strong preference for technical founding teams with distributed systems research backgrounds.',
    },
    targeting: {
      userTypes: ['Startup'],
      industries: ['Artificial Intelligence', 'Enterprise Software'],
      geography: ['India', 'Global'],
    },
    visibility: 'public',
    responseActions: ['Submit Startup', 'Express Fit', 'Request Meeting', 'Send Message'],
    deadline: '2026-12-15',
    status: 'published',
    createdAt: '2026-09-05T08:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
    dateCreated: 'Sep 05, 2026',
    requirement: 'Cheque size ₹2.5 Cr - ₹10 Cr. Fast-track IC review.',
    targetUserType: 'DeepTech Startups & Founders',
    responsesCount: 8,
  },
  {
    id: 'ask_investor_2',
    creatorId: 'investor_kalaari_1',
    creatorName: 'Kalaari Capital Seed Syndicate',
    creatorRole: 'investor',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Early-stage technology venture capital',
    creatorLocation: 'Bengaluru, India',
    creatorStage: 'Seed Fund',
    creatorVerified: true,
    category: 'co_investment',
    type: 'Co-Investment',
    title: 'Co-Investment Syndicate: ₹1.5 Cr Remaining Allocation in Series A SpaceTech',
    shortSummary: 'Syndicating remaining institutional allocation in a proprietary satellite imagery edge-AI compute venture with ₹8 Cr already led.',
    description: 'We are opening ₹1.5 Cr co-investment allocation for accredited micro-VCs and angel networks in a high-growth SpaceTech startup with confirmed defense and agricultural telemetry contracts.',
    desiredOutcome: 'Fill syndicate allocation with value-add operator co-investors within 3 weeks.',
    categoryData: {
      roundTitle: 'SpaceTech Edge-AI Series A Syndicate',
      sectorContext: 'SpaceTech & Geospatial AI',
      roundStage: 'Series A',
      roundSize: 95000000,
      availableAllocation: 15000000,
      expectedChequeSize: '₹25L - ₹50L per co-investor',
      coInvestorType: 'Operator Angels',
      leadStatus: 'We are Leading',
      instrument: 'CCPS',
      closingTimeline: '2026-10-25',
      valueAddExpected: 'Connections into defense procurement and government remote sensing agencies.',
      confidentiality: 'NDA Required before DD Access',
    },
    targeting: {
      userTypes: ['Investor'],
    },
    visibility: 'verified_only',
    responseActions: ['Express Co-Investment Interest', 'Request Deal Details', 'Request Meeting', 'Send Message'],
    deadline: '2026-10-25',
    status: 'published',
    createdAt: '2026-09-12T14:00:00.000Z',
    updatedAt: '2026-09-24T12:00:00.000Z',
    dateCreated: 'Sep 12, 2026',
    requirement: 'Accredited investors only. ₹25L minimum cheque.',
    targetUserType: 'Accredited Investors & Family Offices',
    responsesCount: 4,
  },

  // --- Mentor Asks ---
  {
    id: 'ask_mentor_1',
    creatorId: 'mentor_advisory_1',
    creatorName: 'Advisory Mentor',
    creatorRole: 'mentor',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Distinguished Systems Architect · Enterprise Infrastructure',
    creatorLocation: 'Bengaluru / Hybrid',
    creatorStage: 'Distinguished Fellow',
    creatorVerified: true,
    category: 'structured_mentorship',
    type: 'Structured Mentorship',
    title: 'Open for 2 Structured 3-Month Mentorship Slots: Distributed Systems & AI Reliability',
    shortSummary: 'Accepting applications from 2 seed-stage founders for a high-intensity 3-month cycle focusing on low-latency consensus, model safety, and high-throughput pipelines.',
    description: 'Hands-on architectural guidance covering distributed consensus, telemetry isolation, multi-tenant agent orchestration, and sub-50ms latency optimization. Includes weekly 1-on-1 sparring sessions, architecture diagram reviews, and team engineering reviews.',
    desiredOutcome: 'Help 2 engineering teams successfully pass enterprise SOC2 and latency SLAs for commercial deployments.',
    categoryData: {
      mentorshipArea: 'DeepTech Architecture & Scaling',
      programDuration: '3 Months Structured',
      meetingFrequency: 'Weekly 1-on-1 (45 mins)',
      maxActiveMentees: 2,
      meetingMode: 'Hybrid',
      compensationPreference: 'Equity (0.25% - 0.5%)',
      expectedMenteeCommitment: 'Weekly benchmark updates, code repository access, and structured agenda 24h prior to sessions.',
    },
    targeting: {
      userTypes: ['Startup'],
    },
    visibility: 'public',
    responseActions: ['Request Mentorship', 'Apply for Mentorship', 'Schedule Intro Meeting', 'Send Message'],
    deadline: '2026-10-15',
    status: 'published',
    createdAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-24T16:00:00.000Z',
    dateCreated: 'Sep 10, 2026',
    requirement: 'Technical founding teams with live codebases only.',
    targetUserType: 'Pre-Seed & Seed AI Startups',
    responsesCount: 6,
  },
  {
    id: 'ask_mentor_2',
    creatorId: 'mentor_advisory_1',
    creatorName: 'Advisory Mentor',
    creatorRole: 'mentor',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    creatorTagline: 'Distinguished Systems Architect · Advisory Faculty',
    creatorLocation: 'Bengaluru / Hybrid',
    creatorStage: 'Distinguished Fellow',
    creatorVerified: true,
    category: 'speaking_workshop',
    type: 'Speaking / Workshop',
    title: 'Masterclass: Architecting Sub-50ms Autonomous Multi-Agent Workflows for Enterprise',
    shortSummary: 'Available for technical masterclasses, accelerator bootcamps, and hackathon judging across top incubators and premier technical institutions.',
    description: 'Delivered keynote and workshop curriculum tested at DeepMind and premier developer conferences. Topics include state synchronization, Byzantine fault tolerance in AI agent networks, and token efficiency.',
    desiredOutcome: 'Partner with 2 forward-thinking accelerators or university incubators for Fall 2026 cohort keynotes.',
    categoryData: {
      topicAreas: 'Distributed AI Systems, Multi-Agent Concurrency, Enterprise Model Safety',
      sessionType: 'Masterclass',
      targetAudience: 'Technical Founders, Staff Engineers, Cohort Builders',
      sessionDuration: '90 Minutes (Masterclass)',
      deliveryMode: 'Hybrid',
      commercialPreference: 'Pro Bono for Approved Non-Profit / University Hubs',
    },
    targeting: {
      userTypes: ['ESP', 'Institution', 'Startup'],
    },
    visibility: 'public',
    responseActions: ['Invite to Session', 'Request Discussion', 'Send Message'],
    deadline: '2026-11-20',
    status: 'published',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-22T14:00:00.000Z',
    dateCreated: 'Sep 15, 2026',
    requirement: 'Hybrid or Virtual masterclass for cohorts of 15+ startups.',
    targetUserType: 'Incubators, Accelerators & Universities',
    responsesCount: 2,
  },

  // --- ESP Asks ---
  {
    id: 'ask_esp_1',
    creatorId: 'esp_thub_1',
    creatorName: 'T-Hub Foundation — Lab32 Innovation Center',
    creatorRole: 'esp',
    creatorAvatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&auto=format&fit=crop&q=80',
    creatorTagline: 'Premier Innovation Ecosystem & Startup Hub of India',
    creatorLocation: 'Hyderabad, Telangana, India',
    creatorStage: 'Institution / Tier-1 Hub',
    creatorVerified: true,
    category: 'startup_applications',
    type: 'Startup Applications',
    title: 'Applications Open: DeepTech Lab32 Acceleration Cohort 15 (₹50L Grants + Tier-1 VC Demo Day)',
    shortSummary: '16-week market-access acceleration program accepting 20 early-revenue and prototype deeptech ventures. Access $150k credits and marquee VC demo day.',
    description: 'Lab32 Cohort 15 focuses on Enterprise AI, SpaceTech, and Clean Energy. Selected founders receive dedicated workspace at T-Hub Phase 2, state-of-the-art prototyping labs, 1-on-1 mentorship with global venture partners, and pitch access to 80+ top angel networks and institutional VC funds.',
    desiredOutcome: 'Shortlist 20 high-impact ventures for cohort induction starting Nov 15, 2026.',
    categoryData: {
      programName: 'T-Hub Lab32 Cohort 15',
      programType: 'Accelerator',
      targetStage: ['Proof of Concept', 'Prototype', 'Beta / Early Revenue'],
      targetSectors: ['DeepTech & AI', 'FinTech', 'CleanTech', 'SaaS'],
      applicationDeadline: '2026-10-31',
      programStartDate: '2026-11-15',
      programDuration: '16 Weeks',
      cohortSize: 20,
      fundingAvailable: '₹50L Equity-Free Grant + $150k Tech Cloud Credits',
      equityTaken: 'Equity-Free (0%)',
      programBenefits: '$200k cloud credits (AWS/GCP), access to enterprise testbeds, live VC demo day, dedicated mentor.',
      eligibilityCriteria: 'Indian registered entity with working prototype, minimum 2 full-time co-founders.',
    },
    targeting: {
      userTypes: ['Startup'],
      industries: ['DeepTech', 'Enterprise AI', 'SaaS'],
    },
    visibility: 'public',
    responseActions: ['Apply to Program', 'Request Program Details', 'Send Message'],
    deadline: '2026-10-31',
    status: 'published',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-24T15:00:00.000Z',
    dateCreated: 'Sep 02, 2026',
    requirement: 'Prototype required. Apply before Oct 31, 2026.',
    targetUserType: 'Early Stage & Seed Startups',
    responsesCount: 14,
  },
  {
    id: 'ask_esp_2',
    creatorId: 'esp_thub_1',
    creatorName: 'T-Hub Foundation — Lab32 Innovation Center',
    creatorRole: 'esp',
    creatorAvatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&auto=format&fit=crop&q=80',
    creatorTagline: 'Premier Innovation Ecosystem & Startup Hub of India',
    creatorLocation: 'Hyderabad, India',
    creatorStage: 'Institution / Tier-1 Hub',
    creatorVerified: true,
    category: 'demo_day_participation',
    type: 'Demo Day Participation',
    title: 'Investor & Jury Invitation: Annual National DeepTech Flagship Demo Day 2026',
    shortSummary: 'Private showcase presenting 18 venture-backed deeptech graduates pitching live to accredited angels, family offices, and institutional partners.',
    description: 'Join over 120 verified investors for our private annual showcase. Startups have completed 100 days of rigorous technical validation, customer discovery, and enterprise benchmarking. Private data rooms and term-sheet negotiation suites provided.',
    desiredOutcome: 'Engage 80+ accredited investment funds for syndicate term sheets.',
    categoryData: {
      demoDayName: 'National DeepTech Showcase & Demo Day 2026',
      eventDate: '2026-11-28',
      numberOfStartups: 18,
      targetSectors: 'Enterprise AI, SpaceTech, Clean Energy, BioTech',
      participationRequired: ['Investor Attendance', 'Jury & Evaluation'],
      location: 'Hybrid',
    },
    targeting: {
      userTypes: ['Investor', 'Mentor'],
    },
    visibility: 'verified_only',
    responseActions: ['Join Demo Day', 'Express Interest', 'Request Details', 'Send Message'],
    deadline: '2026-11-20',
    status: 'published',
    createdAt: '2026-09-08T11:00:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z',
    dateCreated: 'Sep 08, 2026',
    requirement: 'Verified institutional investors and accredited angels only.',
    targetUserType: 'Accredited Investors & VCs',
    responsesCount: 19,
  },
];

export const askService = {
  // Load asks, seeding from memory if empty
  getAsks: (role?: UserRole): EcosystemAsk[] => {
    if (typeof window === 'undefined') return SEED_ASKS;
    try {
      const stored = localStorage.getItem(ASKS_STORAGE_KEY);
      let asks: EcosystemAsk[] = stored ? JSON.parse(stored) : [];

      if (!stored || asks.length === 0) {
        asks = SEED_ASKS;
        localStorage.setItem(ASKS_STORAGE_KEY, JSON.stringify(asks));
      } else if (asks.some((a) => a.creatorName === 'Dr. Ananya Sen')) {
        asks = asks.map((a) =>
          a.creatorName === 'Dr. Ananya Sen'
            ? { ...a, creatorName: 'Advisory Mentor', creatorTagline: 'Distinguished Systems Architect · Enterprise Infrastructure' }
            : a
        );
        localStorage.setItem(ASKS_STORAGE_KEY, JSON.stringify(asks));
      }

      if (role) {
        return asks.filter((a) => a.creatorRole === role);
      }
      return asks;
    } catch {
      return SEED_ASKS;
    }
  },

  getAskById: (id: string): EcosystemAsk | undefined => {
    const asks = askService.getAsks();
    return asks.find((a) => a.id === id);
  },

  saveAsk: (ask: EcosystemAsk): EcosystemAsk => {
    if (typeof window === 'undefined') return ask;
    const all = askService.getAsks();
    const existingIndex = all.findIndex((a) => a.id === ask.id);

    const now = new Date().toISOString();
    const askToSave: EcosystemAsk = {
      ...ask,
      updatedAt: now,
      dateCreated: ask.dateCreated || 'Just now',
      status: ask.status || 'published',
    };

    let updated: EcosystemAsk[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = askToSave;
    } else {
      updated = [askToSave, ...all];
    }

    try {
      localStorage.setItem(ASKS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-asks-updated', { detail: { ask: askToSave } }));
    } catch (e) {
      console.error('Failed to save ask to localStorage:', e);
    }
    return askToSave;
  },

  deleteAsk: (id: string): void => {
    if (typeof window === 'undefined') return;
    const all = askService.getAsks();
    const filtered = all.filter((a) => a.id !== id);
    try {
      localStorage.setItem(ASKS_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('xentro-asks-updated', { detail: { deletedId: id } }));
    } catch (e) {
      console.error('Failed to delete ask:', e);
    }
  },

  toggleAskStatus: (id: string): EcosystemAsk | undefined => {
    const all = askService.getAsks();
    const item = all.find((a) => a.id === id);
    if (!item) return undefined;

    const isCurrentlyActive = item.status === 'published' || item.status === 'Active';
    const nextStatus = isCurrentlyActive ? 'Paused' : 'published';
    const updated: EcosystemAsk = {
      ...item,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    askService.saveAsk(updated);
    return updated;
  },

  getResponses: (askId?: string): AskResponseItem[] => {
    if (typeof window === 'undefined') return initialAskResponses;
    try {
      const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
      let responses: AskResponseItem[] = stored ? JSON.parse(stored) : [];
      if (!stored || responses.length === 0) {
        responses = initialAskResponses;
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
      }
      if (askId) {
        return responses.filter((r) => r.askId === askId);
      }
      return responses;
    } catch {
      return initialAskResponses;
    }
  },

  updateResponseStatus: (responseId: string, status: 'Accepted' | 'Declined'): void => {
    if (typeof window === 'undefined') return;
    const all = askService.getResponses();
    const updated = all.map((r) => (r.id === responseId ? { ...r, status } : r));
    try {
      localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update response status:', e);
    }
  },

  // Helper for Ghost Mode anonymization
  getGhostProfile: (
    role: string,
    ask: EcosystemAsk
  ): {
    name: string;
    avatar: string;
    subtitle: string;
  } => {
    const isGhost = ask.visibility === 'ghost';
    if (!isGhost) {
      return {
        name: ask.creatorName || 'Ecosystem Member',
        avatar: ask.creatorAvatar || '',
        subtitle: `${ask.creatorLocation || 'Global'} • ${ask.creatorStage || ''}`,
      };
    }

    if (role === 'startup') {
      const industry = ask.targeting?.industries?.[0] || 'Technology';
      const stage = (ask.categoryData?.fundingStage as string) || 'Seed';
      const geo = ask.creatorLocation?.split(',').pop()?.trim() || 'India';
      return {
        name: `Verified ${industry} Startup`,
        avatar: '',
        subtitle: `${stage} • ${geo} • Stealth Mode`,
      };
    }

    if (role === 'investor') {
      const geo = ask.creatorLocation?.split(',').pop()?.trim() || 'India';
      return {
        name: 'Verified Early-Stage Institutional Investor',
        avatar: '',
        subtitle: `${geo} • Confidential Thesis`,
      };
    }

    if (role === 'mentor') {
      const area = (ask.categoryData?.mentorshipArea as string) || 'Executive Leadership';
      return {
        name: `Verified ${area} Mentor`,
        avatar: '',
        subtitle: '15+ Years Domain Experience • Confidential',
      };
    }

    if (role === 'esp') {
      const geo = ask.creatorLocation?.split(',').pop()?.trim() || 'India';
      return {
        name: 'Verified Tier-1 Accelerator / Hub',
        avatar: '',
        subtitle: `${geo} • Active Program Cohort`,
      };
    }

    return {
      name: 'Verified Ecosystem Member',
      avatar: '',
      subtitle: 'Stealth Identity',
    };
  },
};
