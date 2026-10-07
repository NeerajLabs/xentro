'use client';

import {
  ActiveInvestorContext,
  InvestorOrganization,
  InvestorOrganizationType,
  InvestorOrgMembership,
  InvestorOrgInvitation,
  InvestorOrgPermissions,
  ResourceAccessMode,
  IndividualInvestorProfile,
} from '@/types/investorOrganization';
import {
  InvestorEntityRole,
  InvestorDeal,
  InvestorDDDocument,
  InvestorMeeting,
  PortfolioCompany,
  InvestorSubscription,
  InvestorBillingAccount,
  InvestorInvoice,
  InvestorExperienceStats,
  InvestorTestimonial,
} from '@/types/investor';
import { initialInvestorDeals } from './investorDomainService';
import { getUserProfile } from './userProfile';

// =========================================================================
// STORAGE KEYS & EVENT CONSTANTS
// =========================================================================

export const INVESTOR_ORG_STORAGE_KEYS = {
  ACTIVE_CONTEXT: 'xentro_active_investor_context_v1',
  ORGANIZATIONS: 'xentro_investor_organizations_v1',
  MEMBERSHIPS: 'xentro_investor_org_memberships_v1',
  INVITATIONS: 'xentro_investor_org_invitations_v1',
  INDIVIDUAL_PROFILE: 'xentro_individual_investor_profile_v1',
  INDIVIDUAL_DEALS: 'xentro_individual_investor_deals_v1',
  INDIVIDUAL_PORTFOLIO: 'xentro_individual_investor_portfolio_v1',
};

export const INVESTOR_ORG_EVENTS = {
  CONTEXT_CHANGED: 'xentro-investor-context-changed',
  ORG_UPDATED: 'xentro-investor-org-updated',
  MEMBERS_CHANGED: 'xentro-investor-org-members-changed',
  INVITATIONS_CHANGED: 'xentro-investor-org-invites-changed',
  INDIVIDUAL_PROFILE_CHANGED: 'xentro-individual-investor-changed',
};

// =========================================================================
// ROLE PERMISSION PRESETS
// =========================================================================

export const ROLE_PERMISSION_PRESETS: Record<InvestorEntityRole, InvestorOrgPermissions> = {
  'Owner/Managing Partner': {
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
  Admin: {
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
  Partner: {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
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
  Principal: {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
    viewDealFlow: true,
    editDealFlow: true,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: true,
    accessDiligenceVault: true,
    requestDiligence: true,
    scheduleMeetings: true,
    publishContent: true,
    exportData: false,
  },
  Associate: {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
    viewDealFlow: true,
    editDealFlow: true,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: false,
    accessDiligenceVault: true,
    requestDiligence: true,
    scheduleMeetings: true,
    publishContent: false,
    exportData: false,
  },
  Analyst: {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
    viewDealFlow: true,
    editDealFlow: false,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: false,
    accessDiligenceVault: false,
    requestDiligence: true,
    scheduleMeetings: true,
    publishContent: false,
    exportData: false,
  },
  'Portfolio Manager': {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
    viewDealFlow: true,
    editDealFlow: false,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: true,
    accessDiligenceVault: false,
    requestDiligence: false,
    scheduleMeetings: true,
    publishContent: false,
    exportData: true,
  },
  'Finance/Operations': {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: true,
    viewDealFlow: false,
    editDealFlow: false,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: false,
    accessDiligenceVault: false,
    requestDiligence: false,
    scheduleMeetings: false,
    publishContent: false,
    exportData: true,
  },
  Viewer: {
    manageOrganization: false,
    manageTeam: false,
    manageBilling: false,
    viewDealFlow: true,
    editDealFlow: false,
    createInvestmentDecision: false,
    viewPortfolio: true,
    editPortfolio: false,
    accessDiligenceVault: false,
    requestDiligence: false,
    scheduleMeetings: false,
    publishContent: false,
    exportData: false,
  },
};

// =========================================================================
// SEED DATA: APEX VENTURES (ORGANIZATION)
// =========================================================================

const INITIAL_APEX_PORTFOLIO: PortfolioCompany[] = [];

const INITIAL_ORGANIZATIONS: InvestorOrganization[] = [
  {
    id: 'org_apex_vc',
    name: 'Apex Ventures Capital Management LLP',
    organizationType: 'VC Firm',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    shortDescription:
      'Early-stage Venture Capital fund backing generational founders across India & Southeast Asia building Enterprise SaaS, FinTech, and DeepTech.',
    website: 'https://apexventures.vc',
    linkedIn: 'https://linkedin.com/company/apex-ventures-vc',
    headquarters: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    foundedYear: '2021',
    officialEmail: 'partners@apexventures.vc',
    legalName: 'Apex Ventures Capital Management LLP',
    fundSize: '₹500 Cr ($60M Fund III)',
    aum: '₹1,200 Cr AUM',
    operatingRegions: ['India', 'Southeast Asia', 'US-India Corridor'],
    verified: true,
    ownerId: 'usr_rajesh_singhania',

    about: {
      overview:
        'Apex Ventures is an institutional early-stage venture capital firm headquartered in Bengaluru. We manage ₹1,200 Cr across three fund generations, leading Pre-Seed to Series A rounds in pioneering tech startups.',
      thesis:
        'We believe the next decade of software and hardware category kings will emerge from India. We back exceptional founders with technical depth, proprietary distribution, and bold global ambitions.',
      mission:
        'Empowering visionary teams to build compounding businesses with high unit economics and long-term societal resilience.',
      assetsInfo: '₹1,200 Cr AUM across Fund I (2021), Fund II (2023), and Fund III (2025).',
      fundGeneration: 'Fund III Active Deployment',
      geographicPresence: 'Bengaluru (HQ), Mumbai, Singapore',
    },

    investmentFocus: {
      sectors: ['Enterprise SaaS', 'FinTech', 'DeepTech', 'AI & Machine Learning', 'ClimateTech', 'B2B Marketplaces'],
      stages: ['Pre-Seed', 'Seed', 'Series A'],
      geography: {
        countries: ['India', 'Singapore', 'United States'],
        regions: ['Bengaluru', 'Mumbai', 'Delhi-NCR', 'Hyderabad', 'Pune'],
      },
      businessModels: ['SaaS', 'B2B', 'Marketplace', 'DeepTech'],
      ticketSize: {
        min: '₹2 Cr ($250k)',
        max: '₹10 Cr ($1.2M)',
        formatted: '₹2 Cr – ₹10 Cr ($250k – $1.2M)',
      },
      leadInvestorPreference: 'Strong preference to Lead or Co-Lead',
      coInvestorPreference: 'Collaborates with tier-1 global syndicates and angel networks',
      investmentInstruments: ['Equity', 'CCPS', 'SAFE notes', 'Convertible Notes'],
    },

    valueBeyondCapital: {
      supportAreas: [
        'Enterprise Go-To-Market Acceleration',
        'US Market Expansion & Customer Intros',
        'Executive Talent & Key Leadership Hiring',
        'Follow-On Syndication & Series A/B Readiness',
        'Architectural & DeepTech Technical Advisory',
      ],
      whatIBringToFounders:
        'Our platform team provides dedicated hands-on support in GTM playbooks, executive recruitment, and direct intros to 120+ CXO design partners across Fortune 500 enterprises.',
      advisoryCapabilities: ['GTM Playbooks', 'Pricing Strategy', 'Enterprise Sales', 'Board Governance'],
    },

    investmentCriteria: {
      evaluationCriteria: [
        'Proprietary IP or defensible technical moat',
        'Exceptional founder grit and domain insight',
        'Large addressable market (> $1B TAM)',
        'Early validation through customer LOIs or ARR',
      ],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF'],
      diligenceHighlights: [
        'Customer satisfaction and cohort retention benchmarks',
        'Codebase architectural review by our Venture Partners',
        'Unit economics and sustainable contribution margin',
      ],
    },

    investmentProcess: {
      stages: [
        {
          stepNumber: 1,
          title: 'Initial Deal Review & Screening',
          description: 'Our sector investment associate reviews pitch deck and metrics within 48 hours.',
          estimatedTime: '2-3 Days',
        },
        {
          stepNumber: 2,
          title: 'Partner Intro Discussion',
          description: '45-minute deep-dive on founder vision, market dynamics, and customer validation.',
          estimatedTime: '1 Week',
        },
        {
          stepNumber: 3,
          title: 'Deep Diligence & Customer Calls',
          description: 'Technical audit, customer reference interviews, and cap table assessment.',
          estimatedTime: '1-2 Weeks',
        },
        {
          stepNumber: 4,
          title: 'Investment Committee (IC) & Term Sheet',
          description: 'Presentation to full Partnership, unanimous consensus, and term sheet delivery.',
          estimatedTime: '3-5 Days',
        },
      ],
      preferredConnectionMethod: 'Warm introduction from portfolio founders or direct platform pitch',
      informationRequiredInitially: ['Pitch Deck (PDF)', 'Cap Table overview', 'Live Metrics / ARR'],
      typicalDecisionTimeline: '2 to 3 weeks from first partner meeting to term sheet',
      pitchDeckRequirements: 'Problem, Solution, Team, Moat, Traction, Market Size, and Ask',
      warmIntroPreferred: true,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [],

    experienceStats: {
      totalInvestments: 0,
      activePortfolio: 0,
      followOnInvestments: 0,
      exits: 0,
      yearsOfExperience: '0 Years',
      industriesInvested: 0,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: true,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
      guidelines: 'We review pitches weekly. Please attach your deck and current monthly burn/runway.',
    },

    content: [],

    activities: [],

    deals: [],
    diligenceDocs: [],
    meetings: [],

    subscription: {
      tier: 'institutional',
      status: 'active',
      currentPeriodEnd: '2026-12-31T23:59:59Z',
      cancelAtPeriodEnd: false,
      seatsIncluded: 15,
      seatsUsed: 1,
      dealFlowLimit: -1,
      dueDiligenceExportsLimit: 100,
      monthlyPrice: 24999,
      currency: 'INR',
    },

    billingAccount: {
      organizationName: 'Apex Ventures Capital Management LLP',
      billingEmail: 'finance@apexventures.vc',
      gstin: '29AABCA9876Q1ZM',
      pan: 'AABCA9876Q',
      taxExempt: false,
      billingAddress: {
        line1: 'Level 8, Prestige Tech Park, Marathahalli-Sarjapur Ring Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560103',
      },
      defaultPaymentMethod: {
        type: 'card',
        last4: '4829',
        brand: 'Visa Business Corporate',
        expiry: '08/28',
      },
    },

    invoices: [],

    createdAt: '2021-06-15T00:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
  {
    id: 'org_seedx_syndicate',
    name: 'SeedX Syndicate',
    organizationType: 'Syndicate',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80',
    shortDescription:
      'Curated community syndicate of 150+ angel investors co-investing in high-growth Indian startups alongside top VC funds.',
    website: 'https://seedx.vc',
    linkedIn: 'https://linkedin.com/company/seedx-syndicate',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    },
    foundedYear: '2023',
    officialEmail: 'syndicate@seedx.vc',
    fundSize: '₹50 Cr Syndicate Pool',
    aum: '₹85 Cr Deployed',
    verified: true,
    ownerId: 'usr_amit_patel',

    about: {
      overview:
        'SeedX Syndicate brings together tech founders, CXOs, and angel operators to back exceptional pre-seed and seed rounds with fast syndication checks.',
      thesis:
        'Democratizing access to high-conviction early-stage venture deals by pooling collective operator expertise and capital.',
      mission: 'Connecting angel operators with early-stage pioneers.',
    },

    investmentFocus: {
      sectors: ['Consumer Tech', 'FinTech', 'SaaS', 'Direct-to-Consumer'],
      stages: ['Pre-Seed', 'Seed'],
      geography: {
        countries: ['India'],
        regions: ['Mumbai', 'Bengaluru', 'Delhi-NCR'],
      },
      businessModels: ['B2B', 'B2C', 'D2C', 'Marketplace'],
      ticketSize: {
        min: '₹50 Lakh',
        max: '₹1.5 Cr',
        formatted: '₹50L – ₹1.5 Cr',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Operator Mentorship', 'CXO Networking', 'Hiring'],
      whatIBringToFounders: 'Access to 150+ experienced tech operators across top unicorns.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Early customer love', 'Strong unit economics'],
      preferredTraction: ['Early Revenue', 'PMF'],
      diligenceHighlights: ['Customer interviews', 'Founder background checks'],
    },

    investmentProcess: {
      stages: [
        {
          stepNumber: 1,
          title: 'Syndicate Deal Pitch',
          description: 'Pitch to syndicate investment committee.',
        },
      ],
      preferredConnectionMethod: 'Platform pitch submission',
      informationRequiredInitially: ['Pitch Deck'],
      typicalDecisionTimeline: '10 days',
      pitchDeckRequirements: 'PDF deck',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [],
    experienceStats: {
      totalInvestments: 12,
      activePortfolio: 11,
      followOnInvestments: 4,
      exits: 1,
    },
    testimonials: [],
    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },
    content: [],
    activities: [],
    deals: [],
    diligenceDocs: [],
    meetings: [],

    subscription: {
      tier: 'syndicate',
      status: 'active',
      currentPeriodEnd: '2026-12-31T23:59:59Z',
      cancelAtPeriodEnd: false,
      seatsIncluded: 10,
      seatsUsed: 3,
      dealFlowLimit: -1,
      dueDiligenceExportsLimit: 50,
      monthlyPrice: 14999,
      currency: 'INR',
    },

    billingAccount: {
      organizationName: 'SeedX Syndicate LLP',
      billingEmail: 'finance@seedx.vc',
      taxExempt: false,
      billingAddress: {
        line1: 'Nariman Point',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400021',
      },
      defaultPaymentMethod: {
        type: 'card',
        last4: '1192',
      },
    },
    invoices: [],
    createdAt: '2023-01-10T00:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
];

// =========================================================================
// SEED DATA: ORGANIZATION MEMBERSHIPS
// =========================================================================

const INITIAL_MEMBERSHIPS: InvestorOrgMembership[] = [];

// =========================================================================
// SEED DATA: INDIVIDUAL INVESTOR (THE PERSON)
// =========================================================================

const INITIAL_INDIVIDUAL_PROFILE: IndividualInvestorProfile = {
  userId: '',
  name: 'Investor',
  roleTitle: 'Angel / VC Investor',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
  location: {
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
  },
  website: '',
  linkedIn: '',
  verified: true,
  bio: '',
  background: '',
  yearsOfInvestingExperience: '0 Years',
  overview: {
    whoTheyInvestIn: '',
    sectorsFocus: 'SaaS, FinTech, DeepTech, AI',
    investmentPhilosophy: '',
    aimToContribute: '',
  },
  investmentFocus: {
    sectors: ['SaaS', 'FinTech', 'DeepTech', 'AI Dev Tools'],
    stages: ['Pre-Seed', 'Seed', 'Series A'],
    geography: {
      countries: ['India'],
      regions: ['Bengaluru', 'Mumbai', 'Delhi-NCR'],
    },
    businessModels: ['SaaS', 'B2B', 'DeepTech'],
    ticketSize: {
      min: '₹25 Lakh',
      max: '₹1 Cr',
      formatted: '₹25L – ₹1Cr',
    },
    leadInvestorPreference: 'Participant Angel / Co-investor',
    coInvestorPreference: 'Co-invests alongside leading seed funds and angel networks',
    investmentInstruments: ['SAFE Notes', 'Equity'],
  },
  valueBeyondCapital: {
    supportAreas: ['Product Strategy', 'First 10 Customers', 'Founder Mentorship', 'Fundraising Coaching'],
    whatIBringToFounders: '',
  },
  investmentCriteria: {
    evaluationCriteria: ['Obsessive founder customer focus', 'High velocity execution', 'Deep technical capability'],
    preferredTraction: ['MVP', 'Early Revenue'],
    diligenceHighlights: ['Direct founder discussion', 'Code and product walkthrough'],
  },
  investmentProcess: {
    stages: [
      {
        stepNumber: 1,
        title: 'Intro Video Call',
        description: 'Founder chat to understand vision and core differentiation.',
        estimatedTime: '3-4 Days',
      },
    ],
    preferredConnectionMethod: 'Platform message',
    informationRequiredInitially: ['Pitch Deck'],
    typicalDecisionTimeline: '1-2 weeks',
    pitchDeckRequirements: 'Concise deck',
    warmIntroPreferred: false,
    unsolicitedPitchesAccepted: true,
  },
  portfolio: [],
  experienceStats: {
    totalInvestments: 0,
    activePortfolio: 0,
    followOnInvestments: 0,
    exits: 0,
    yearsOfExperience: '0 Years',
    industriesInvested: 0,
  },
  testimonials: [],
  connectionPreferences: {
    openToConnectionRequests: true,
    openToStartupPitches: true,
    introductionPreferred: false,
    currentlyInvesting: true,
    notAcceptingNewPitches: false,
    guidelines: 'Happy to connect with innovative founders.',
  },
  content: [],
  activities: [],
  personalDeals: [],
};

// =========================================================================
// INVESTOR ORGANIZATION DOMAIN SERVICE CLASS
// =========================================================================

class InvestorOrganizationService {
  // -----------------------------------------------------------------------
  // 1. ACTIVE CONTEXT MANAGEMENT
  // -----------------------------------------------------------------------

  getActiveContext(): ActiveInvestorContext {
    if (typeof window === 'undefined') {
      return { type: 'individual' };
    }
    try {
      const stored = localStorage.getItem(INVESTOR_ORG_STORAGE_KEYS.ACTIVE_CONTEXT);
      if (stored) {
        return JSON.parse(stored) as ActiveInvestorContext;
      }
      // Check if user registered an investor entity during onboarding
      const entStr = localStorage.getItem('xentro_investor_entities');
      if (entStr) {
        const ent = JSON.parse(entStr);
        const first = Array.isArray(ent) ? ent[ent.length - 1] : ent;
        if (first && first.orgName) {
          const orgId = `org_${first.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}`;
          const userCtx: ActiveInvestorContext = { type: 'organization', organizationId: orgId };
          this.setActiveContext(userCtx);
          return userCtx;
        }
      }
    } catch (e) {
      console.warn('Failed to parse active investor context from storage:', e);
    }
    // Default context for an investor is their individual angel profile
    const defaultCtx: ActiveInvestorContext = {
      type: 'individual',
    };
    return defaultCtx;
  }

  setActiveContext(context: ActiveInvestorContext): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVESTOR_ORG_STORAGE_KEYS.ACTIVE_CONTEXT, JSON.stringify(context));
      window.dispatchEvent(
        new CustomEvent(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, {
          detail: { context },
        })
      );
    } catch (e) {
      console.error('Failed to set active investor context:', e);
    }
  }

  isOrganizationContext(): boolean {
    return this.getActiveContext().type === 'organization';
  }

  getActiveOrganization(): InvestorOrganization | null {
    const ctx = this.getActiveContext();
    if (ctx.type !== 'organization' || !ctx.organizationId) {
      return null;
    }
    return this.getOrganizationById(ctx.organizationId);
  }

  // -----------------------------------------------------------------------
  // 2. ORGANIZATION CRUD
  // -----------------------------------------------------------------------

  getOrganizations(): InvestorOrganization[] {
    if (typeof window === 'undefined') return INITIAL_ORGANIZATIONS;
    try {
      const stored = localStorage.getItem(INVESTOR_ORG_STORAGE_KEYS.ORGANIZATIONS);
      if (stored) {
        const parsed = JSON.parse(stored) as InvestorOrganization[];
        if (Array.isArray(parsed) && parsed.some((o: any) => o.portfolio?.some((p: any) => p.id === 'port_1' || p.name === 'Kinetix AI') || o.testimonials?.some((t: any) => t.founderName === 'Vikram Malhotra'))) {
          this.saveOrganizations(INITIAL_ORGANIZATIONS);
          return INITIAL_ORGANIZATIONS;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load investor organizations:', e);
    }
    // Initialize default seeds
    this.saveOrganizations(INITIAL_ORGANIZATIONS);
    return INITIAL_ORGANIZATIONS;
  }

  saveOrganizations(orgs: InvestorOrganization[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVESTOR_ORG_STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(orgs));
      window.dispatchEvent(new CustomEvent(INVESTOR_ORG_EVENTS.ORG_UPDATED, { detail: { orgs } }));
    } catch (e) {
      console.error('Failed to persist investor organizations:', e);
    }
  }

  getOrganizationById(orgId: string): InvestorOrganization | null {
    const orgs = this.getOrganizations();
    return orgs.find((o) => o.id === orgId) || null;
  }

  createInvestorOrganization(
    data: Omit<InvestorOrganization, 'id' | 'createdAt' | 'updatedAt' | 'deals' | 'diligenceDocs' | 'meetings'> & {
      ownerName?: string;
      ownerEmail?: string;
    }
  ): InvestorOrganization {
    const orgId = `org_${Date.now()}`;
    const now = new Date().toISOString();

    const newOrg: InvestorOrganization = {
      ...data,
      id: orgId,
      deals: [],
      diligenceDocs: [],
      meetings: [],
      createdAt: now,
      updatedAt: now,
    };

    const orgs = this.getOrganizations();
    orgs.push(newOrg);
    this.saveOrganizations(orgs);

    // Create Owner membership for creator using authenticated user identity
    const currentProfile = getUserProfile();
    const creatorMembership: InvestorOrgMembership = {
      id: `org_mem_${Date.now()}`,
      organizationId: orgId,
      userId: data.ownerId || currentProfile.id || `usr_${Date.now()}`,
      userName: data.ownerName || currentProfile.name || 'Managing Partner',
      userEmail: data.ownerEmail || currentProfile.email || 'partner@fund.vc',
      role: 'Owner/Managing Partner',
      title: 'Managing Partner / Founder',
      isOwner: true,
      isPublicTeam: true,
      canAccessWorkspace: true,
      status: 'active',
      dealAccessMode: 'all',
      portfolioAccessMode: 'all',
      permissions: ROLE_PERMISSION_PRESETS['Owner/Managing Partner'],
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      personalAccountVerified: true,
    };

    const memberships = this.getAllMemberships();
    memberships.push(creatorMembership);
    this.saveMemberships(memberships);

    // Automatically switch active context to the new organization!
    this.setActiveContext({
      type: 'organization',
      organizationId: orgId,
    });

    return newOrg;
  }

  updateInvestorOrganization(
    orgId: string,
    updates: Partial<Omit<InvestorOrganization, 'id' | 'verified'>>
  ): InvestorOrganization | null {
    const orgs = this.getOrganizations();
    const index = orgs.findIndex((o) => o.id === orgId);
    if (index === -1) return null;

    const existing = orgs[index];
    const updated: InvestorOrganization = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    orgs[index] = updated;
    this.saveOrganizations(orgs);
    return updated;
  }

  // -----------------------------------------------------------------------
  // 3. MEMBERSHIPS & RBAC
  // -----------------------------------------------------------------------

  getAllMemberships(): InvestorOrgMembership[] {
    if (typeof window === 'undefined') return INITIAL_MEMBERSHIPS;
    try {
      const stored = localStorage.getItem(INVESTOR_ORG_STORAGE_KEYS.MEMBERSHIPS);
      if (stored) {
        const parsed = JSON.parse(stored) as InvestorOrgMembership[];
        if (Array.isArray(parsed) && parsed.some((m: any) => m.id?.startsWith('org_mem_') || m.userEmail?.includes('apexventures.vc'))) {
          this.saveMemberships([]);
          return [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load memberships:', e);
    }
    this.saveMemberships(INITIAL_MEMBERSHIPS);
    return INITIAL_MEMBERSHIPS;
  }

  saveMemberships(members: InvestorOrgMembership[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVESTOR_ORG_STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(members));
      window.dispatchEvent(
        new CustomEvent(INVESTOR_ORG_EVENTS.MEMBERS_CHANGED, { detail: { members } })
      );
    } catch (e) {
      console.error('Failed to persist memberships:', e);
    }
  }

  getOrganizationMembers(orgId: string): InvestorOrgMembership[] {
    return this.getAllMemberships().filter((m) => m.organizationId === orgId);
  }

  getPublicTeamMembers(orgId: string): InvestorOrgMembership[] {
    return this.getOrganizationMembers(orgId).filter(
      (m) => m.isPublicTeam && m.status === 'active'
    );
  }

  inviteOrganizationMember(data: {
    organizationId: string;
    organizationName: string;
    email: string;
    name?: string;
    role: InvestorEntityRole;
    title: string;
    dealAccessMode: ResourceAccessMode;
    portfolioAccessMode: ResourceAccessMode;
    permissions?: Partial<InvestorOrgPermissions>;
    invitedBy: string;
  }): InvestorOrgInvitation {
    const invId = `inv_org_${Date.now()}`;
    const now = new Date();
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);

    const basePermissions = ROLE_PERMISSION_PRESETS[data.role];
    const finalPermissions: InvestorOrgPermissions = {
      ...basePermissions,
      ...(data.permissions || {}),
    };

    const newInvite: InvestorOrgInvitation = {
      id: invId,
      organizationId: data.organizationId,
      organizationName: data.organizationName,
      email: data.email,
      name: data.name,
      role: data.role,
      title: data.title,
      dealAccessMode: data.dealAccessMode,
      portfolioAccessMode: data.portfolioAccessMode,
      permissions: finalPermissions,
      invitedBy: data.invitedBy,
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'pending',
    };

    const invites = this.getAllInvitations();
    invites.push(newInvite);
    this.saveInvitations(invites);

    // Also create a provisional invited membership entry
    const newMember: InvestorOrgMembership = {
      id: `mem_${Date.now()}`,
      organizationId: data.organizationId,
      userId: `usr_pending_${Date.now()}`,
      userName: data.name || data.email.split('@')[0],
      userEmail: data.email,
      role: data.role,
      title: data.title,
      isOwner: false,
      isPublicTeam: false,
      canAccessWorkspace: true,
      status: 'invited',
      dealAccessMode: data.dealAccessMode,
      portfolioAccessMode: data.portfolioAccessMode,
      permissions: finalPermissions,
      joinedAt: 'Invited',
      invitedBy: data.invitedBy,
    };

    const members = this.getAllMemberships();
    members.push(newMember);
    this.saveMemberships(members);

    return newInvite;
  }

  getAllInvitations(): InvestorOrgInvitation[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(INVESTOR_ORG_STORAGE_KEYS.INVITATIONS);
      if (stored) {
        return JSON.parse(stored) as InvestorOrgInvitation[];
      }
    } catch (e) {
      console.warn('Failed to load invitations:', e);
    }
    return [];
  }

  saveInvitations(invites: InvestorOrgInvitation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVESTOR_ORG_STORAGE_KEYS.INVITATIONS, JSON.stringify(invites));
      window.dispatchEvent(
        new CustomEvent(INVESTOR_ORG_EVENTS.INVITATIONS_CHANGED, { detail: { invites } })
      );
    } catch (e) {
      console.error('Failed to persist invitations:', e);
    }
  }

  getOrganizationInvitations(orgId: string): InvestorOrgInvitation[] {
    return this.getAllInvitations().filter((i) => i.organizationId === orgId);
  }

  revokeInvitation(invitationId: string): void {
    const invites = this.getAllInvitations();
    const target = invites.find((i) => i.id === invitationId);
    if (!target) return;

    target.status = 'revoked';
    this.saveInvitations(invites);

    // Also remove provisional membership if in invited state
    const members = this.getAllMemberships().filter(
      (m) => !(m.userEmail === target.email && m.status === 'invited')
    );
    this.saveMemberships(members);
  }

  // -----------------------------------------------------------------------
  // 4. FINAL OWNER PROTECTION LOGIC
  // -----------------------------------------------------------------------

  updateMemberRole(
    orgId: string,
    memberId: string,
    newRole: InvestorEntityRole
  ): { success: boolean; message?: string } {
    const members = this.getAllMemberships();
    const memberIndex = members.findIndex((m) => m.id === memberId && m.organizationId === orgId);
    if (memberIndex === -1) {
      return { success: false, message: 'Member not found' };
    }

    const member = members[memberIndex];
    const orgMembers = members.filter((m) => m.organizationId === orgId && m.status === 'active');
    const ownerCount = orgMembers.filter((m) => m.isOwner).length;

    // RULE 34: Final Owner protection
    if (member.isOwner && ownerCount <= 1 && newRole !== 'Owner/Managing Partner') {
      return {
        success: false,
        message:
          'Cannot downgrade the final Owner. You must transfer ownership to another member before changing your role.',
      };
    }

    member.role = newRole;
    member.permissions = ROLE_PERMISSION_PRESETS[newRole];
    if (newRole === 'Owner/Managing Partner') {
      member.isOwner = true;
    }

    members[memberIndex] = member;
    this.saveMemberships(members);
    return { success: true };
  }

  updateMemberPermissions(
    orgId: string,
    memberId: string,
    permissions: Partial<InvestorOrgPermissions>
  ): InvestorOrgMembership | null {
    const members = this.getAllMemberships();
    const memberIndex = members.findIndex((m) => m.id === memberId && m.organizationId === orgId);
    if (memberIndex === -1) return null;

    members[memberIndex].permissions = {
      ...members[memberIndex].permissions,
      ...permissions,
    };

    this.saveMemberships(members);
    return members[memberIndex];
  }

  updateMemberAccessModes(
    orgId: string,
    memberId: string,
    dealMode: ResourceAccessMode,
    portfolioMode: ResourceAccessMode
  ): InvestorOrgMembership | null {
    const members = this.getAllMemberships();
    const memberIndex = members.findIndex((m) => m.id === memberId && m.organizationId === orgId);
    if (memberIndex === -1) return null;

    members[memberIndex].dealAccessMode = dealMode;
    members[memberIndex].portfolioAccessMode = portfolioMode;

    this.saveMemberships(members);
    return members[memberIndex];
  }

  updateMemberVisibility(
    orgId: string,
    memberId: string,
    isPublicTeam: boolean,
    canAccessWorkspace: boolean
  ): InvestorOrgMembership | null {
    const members = this.getAllMemberships();
    const memberIndex = members.findIndex((m) => m.id === memberId && m.organizationId === orgId);
    if (memberIndex === -1) return null;

    members[memberIndex].isPublicTeam = isPublicTeam;
    members[memberIndex].canAccessWorkspace = canAccessWorkspace;

    this.saveMemberships(members);
    return members[memberIndex];
  }

  removeOrganizationMember(
    orgId: string,
    memberId: string
  ): { success: boolean; message?: string } {
    const members = this.getAllMemberships();
    const target = members.find((m) => m.id === memberId && m.organizationId === orgId);
    if (!target) {
      return { success: false, message: 'Member not found' };
    }

    // RULE 34: Final Owner protection
    const orgActiveMembers = members.filter(
      (m) => m.organizationId === orgId && m.status === 'active'
    );
    const ownerCount = orgActiveMembers.filter((m) => m.isOwner).length;

    if (target.isOwner && ownerCount <= 1) {
      return {
        success: false,
        message:
          'Cannot remove the final Owner. You must transfer organization ownership to another member before leaving or removing this account.',
      };
    }

    // RULE 33: Removing membership does NOT touch personal account, startup or mentor roles
    const updated = members.filter((m) => m.id !== memberId);
    this.saveMemberships(updated);
    return { success: true };
  }

  transferOrganizationOwnership(
    orgId: string,
    newOwnerMemberId: string
  ): { success: boolean; message?: string } {
    const members = this.getAllMemberships();
    const targetIndex = members.findIndex(
      (m) => m.id === newOwnerMemberId && m.organizationId === orgId
    );
    if (targetIndex === -1) {
      return { success: false, message: 'Target member not found' };
    }

    // Designate target as new owner
    members[targetIndex].isOwner = true;
    members[targetIndex].role = 'Owner/Managing Partner';
    members[targetIndex].permissions = ROLE_PERMISSION_PRESETS['Owner/Managing Partner'];

    // Update organization entity ownerId
    const org = this.getOrganizationById(orgId);
    if (org) {
      this.updateInvestorOrganization(orgId, { ownerId: members[targetIndex].userId });
    }

    this.saveMemberships(members);
    return { success: true };
  }

  // -----------------------------------------------------------------------
  // 5. SCOPED WORKSPACE DATA PROVIDERS
  // -----------------------------------------------------------------------

  getScopedDeals(context?: ActiveInvestorContext): InvestorDeal[] {
    const ctx = context || this.getActiveContext();
    if (ctx.type === 'individual') {
      const indProfile = this.getIndividualProfile();
      return indProfile.personalDeals || [];
    }

    const org = this.getOrganizationById(ctx.organizationId || 'org_apex_vc');
    return org?.deals || initialInvestorDeals;
  }

  getScopedPortfolio(context?: ActiveInvestorContext): PortfolioCompany[] {
    const ctx = context || this.getActiveContext();
    if (ctx.type === 'individual') {
      const indProfile = this.getIndividualProfile();
      return indProfile.portfolio || [];
    }

    const org = this.getOrganizationById(ctx.organizationId || 'org_apex_vc');
    return org?.portfolio || INITIAL_APEX_PORTFOLIO;
  }

  getScopedBilling(context?: ActiveInvestorContext): {
    subscription: InvestorSubscription;
    billingAccount: InvestorBillingAccount;
    invoices: InvestorInvoice[];
  } {
    const ctx = context || this.getActiveContext();
    if (ctx.type === 'individual') {
      return {
        subscription: {
          tier: 'starter',
          status: 'active',
          currentPeriodEnd: '2026-12-31T23:59:59Z',
          cancelAtPeriodEnd: false,
          seatsIncluded: 1,
          seatsUsed: 1,
          dealFlowLimit: 20,
          dueDiligenceExportsLimit: 10,
          monthlyPrice: 0,
          currency: 'INR',
        },
        billingAccount: {
          organizationName: `${getUserProfile().name || 'Personal Angel'}`,
          billingEmail: getUserProfile().email || '',
          taxExempt: false,
          billingAddress: {
            line1: 'Indiranagar 100ft Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560038',
          },
          defaultPaymentMethod: {
            type: 'card',
            last4: '9012',
          },
        },
        invoices: [],
      };
    }

    const org = this.getOrganizationById(ctx.organizationId || 'org_apex_vc');
    return {
      subscription: org?.subscription || {
        tier: 'institutional',
        status: 'active',
        currentPeriodEnd: '2026-12-31T23:59:59Z',
        cancelAtPeriodEnd: false,
        seatsIncluded: 15,
        seatsUsed: 7,
        dealFlowLimit: -1,
        dueDiligenceExportsLimit: 100,
        monthlyPrice: 24999,
        currency: 'INR',
      },
      billingAccount: org?.billingAccount || {
        organizationName: 'Apex Ventures Capital Management LLP',
        billingEmail: 'finance@apexventures.vc',
        taxExempt: false,
        billingAddress: {
          line1: 'Prestige Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          postalCode: '560103',
        },
        defaultPaymentMethod: {
          type: 'card',
          last4: '4829',
        },
      },
      invoices: org?.invoices || [],
    };
  }

  // -----------------------------------------------------------------------
  // 6. INDIVIDUAL INVESTOR PROFILE STATE (SEPARATE DOMAIN ENTITY)
  // -----------------------------------------------------------------------

  getIndividualProfile(userId: string = ''): IndividualInvestorProfile {
    if (typeof window === 'undefined') return INITIAL_INDIVIDUAL_PROFILE;
    try {
      const stored = localStorage.getItem(INVESTOR_ORG_STORAGE_KEYS.INDIVIDUAL_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored) as IndividualInvestorProfile;
        if (parsed.userId === 'usr_rajesh_singhania' || parsed.portfolio?.some((p: any) => p.id === 'ind_port_1') || parsed.personalDeals?.some((d: any) => d.id === 'deal_p_1')) {
          this.saveIndividualProfile(INITIAL_INDIVIDUAL_PROFILE);
          return INITIAL_INDIVIDUAL_PROFILE;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load individual investor profile:', e);
    }
    this.saveIndividualProfile(INITIAL_INDIVIDUAL_PROFILE);
    return INITIAL_INDIVIDUAL_PROFILE;
  }

  saveIndividualProfile(profile: IndividualInvestorProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INVESTOR_ORG_STORAGE_KEYS.INDIVIDUAL_PROFILE, JSON.stringify(profile));
      window.dispatchEvent(
        new CustomEvent(INVESTOR_ORG_EVENTS.INDIVIDUAL_PROFILE_CHANGED, { detail: { profile } })
      );
    } catch (e) {
      console.error('Failed to persist individual investor profile:', e);
    }
  }

  updateIndividualProfile(updates: Partial<IndividualInvestorProfile>): IndividualInvestorProfile {
    const current = this.getIndividualProfile();
    const updated = {
      ...current,
      ...updates,
    };
    this.saveIndividualProfile(updated);
    return updated;
  }
}

export const investorOrganizationService = new InvestorOrganizationService();
