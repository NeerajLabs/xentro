import {
  Opportunity,
  OpportunityApplicant,
  ApplicantStatus,
  OpportunityStatus,
} from '@/types/opportunity';
import { getBackendBaseUrl } from '@/lib/backendUrl';

const STORAGE_KEY = 'xentro_universal_opportunities';
const APPLICANTS_STORAGE_KEY = 'xentro_opportunity_applicants';
const DRAFT_STORAGE_PREFIX = 'xentro_opportunity_draft_';

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-gov-sisfs-01',
    publisherAccountId: 'usr_admin_ops',
    publisherType: 'Xentro Admin',
    publisherName: 'Platform Operations',
    publisherRoleTitle: 'Super Admin, Platform Ops',
    publisherOrgName: 'Xentro Admin Office',
    publisherVerified: true,
    targetUserTypes: ['startup', 'founder'],
    visibilityScope: 'All Xentro Users',
    sourceType: 'government',
    externalOrganization: {
      name: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
      organizationType: 'Central Government',
      ownershipType: 'government',
      country: 'India',
      state: 'New Delhi',
      city: 'New Delhi',
      website: 'https://seedfund.startupindia.gov.in',
      officialOpportunityUrl: 'https://seedfund.startupindia.gov.in/apply',
    },
    title: 'Startup India Seed Fund Scheme (SISFS 2026)',
    category: 'Grant',
    subcategory: 'Government Seed Fund',
    shortDescription:
      'Financial assistance to early-stage DPIIT-recognized startups for proof of concept, prototype development, product trials, and market entry.',
    fullDescription: `The Startup India Seed Fund Scheme (SISFS) provides financial assistance to early-stage startups for proof of concept, prototype development, product trials, market entry, and commercialization.

Seed funding to eligible startups is provided through eligible incubators across India. Up to ₹20 Lakhs is awarded as a non-dilutive grant for validation of Proof of Concept, prototype development, or product trials. Up to ₹50 Lakhs is provided through convertible debentures or debt-linked instruments for commercialization and market expansion.`,
    objective:
      'Bridge the capital gap for innovative early-stage startups before securing institutional venture capital.',
    applicantTypes: ['Startup', 'Founder', 'Registered Company'],
    industries: ['DeepTech', 'Enterprise AI', 'HealthTech', 'CleanTech / Climate', 'AgriTech', 'Hardware & Robotics'],
    startupStages: ['Idea', 'Prototype', 'MVP', 'Pre-Revenue'],
    geographicEligibility: {
      scope: 'Country',
      country: 'India',
    },
    registrationRequirements: ['Incorporation Required', 'DPIIT Recognition Required'],
    customEligibility: [
      {
        id: 'crit-1',
        title: 'Incorporation Window',
        description: 'Startup must not be incorporated more than 2 years ago at the time of application.',
      },
      {
        id: 'crit-2',
        title: 'Prior Grant Limits',
        description: 'Must not have received more than ₹10 Lakhs of monetary support under any other Central/State scheme.',
      },
    ],
    benefits: ['Grant', 'Government Access', 'Incubation', 'Networking'],
    financialDetails: {
      type: 'Grant',
      amountType: 'Range',
      minimumAmount: 2000000,
      maximumAmount: 5000000,
      currency: 'INR',
      equityType: 'No Equity',
      additionalTerms: 'Up to ₹20L as 100% non-dilutive grant; up to ₹50L as 10-year convertible debt.',
    },
    participationMode: 'Online',
    opportunityScope: 'National',
    applicationMethod: 'Apply Through Xentro',
    acceptApplicationsThroughXentro: true,
    applicationSteps: [
      {
        stepNumber: 1,
        title: 'Institutional Application & DPIIT Sync',
        description: 'Submit pitch deck, cap table, and DPIIT certificate.',
      },
      {
        stepNumber: 2,
        title: 'Incubator Review & Due Diligence',
        description: 'Partner incubator committee reviews prototype and feasibility.',
      },
      {
        stepNumber: 3,
        title: 'Pitch Presentation & Sanction Letter',
        description: 'Online presentation to Seed Fund Committee for grant release.',
      },
    ],
    applicationRequirements: [
      'Startup Profile',
      'Pitch Deck',
      'Incorporation Certificate',
      'DPIIT Certificate',
      'Financial Statements',
    ],
    applicationsOpen: '2026-01-15',
    applicationDeadline: '2026-06-30',
    rollingApplications: false,
    opportunityStartDate: '2026-07-15',
    frequency: 'Annual',
    capacityType: 'Limited',
    availableSlots: 45,
    slotLabel: 'Startup Grants',
    links: [
      { id: 'l1', label: 'Official Portal', url: 'https://seedfund.startupindia.gov.in' },
      { id: 'l2', label: 'Scheme Guidelines PDF', url: 'https://seedfund.startupindia.gov.in/guidelines' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    verification: {
      officialSourceUrl: 'https://seedfund.startupindia.gov.in',
      officialApplicationUrl: 'https://seedfund.startupindia.gov.in/apply',
      sourcePublicationDate: '2026-01-10',
      lastVerifiedDate: '2026-03-20',
      verifiedBy: 'Karunya (#9922953) - Super Admin',
      status: 'Official',
    },
    status: 'open',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-03-20T11:00:00Z',
    applicantsCount: 14,
  },
  {
    id: 'opp-corp-google-ai-02',
    publisherAccountId: 'usr_corp_google_scout',
    publisherType: 'Entity Account',
    publisherName: 'Google for Startups Cloud Desk',
    publisherRoleTitle: 'Program Director',
    publisherOrgName: 'Google for Startups Ecosystem',
    publisherVerified: true,
    targetUserTypes: ['startup', 'founder', 'researcher'],
    visibilityScope: 'All Xentro Users',
    sourceType: 'corporate_mnc',
    externalOrganization: {
      name: 'Google Cloud & Alphabet Global',
      organizationType: 'MNC',
      ownershipType: 'private',
      country: 'United States',
      city: 'Mountain View, CA',
      website: 'https://cloud.google.com/startup',
      officialOpportunityUrl: 'https://cloud.google.com/startup/ai',
    },
    title: 'Google for Startups AI Cloud & TPU Launchpad (Cohort 2026)',
    category: 'Credits / Benefits',
    subcategory: 'Cloud Computing Credits ($100k+)',
    shortDescription:
      'Up to $350,000 in Google Cloud and Cloud TPU credits, Google AI research mentor access, and enterprise co-selling opportunities.',
    fullDescription: `The Google for Startups Cloud AI Program is designed to empower Seed and Series A AI startups building transformative foundational models and autonomous agent workflows.

Selected startups receive up to $350,000 in Google Cloud credits over two years, direct access to dedicated Cloud TPU clusters, Gemini Pro/Ultra API throughput allocations, technical office hours with Google DeepMind and Cloud AI engineers, and visibility with Google Ventures.`,
    objective:
      'Accelerate artificial intelligence model training and production deployments for high-growth tech companies.',
    applicantTypes: ['Startup', 'Founder', 'Registered Company'],
    industries: ['Enterprise AI', 'DeepTech', 'HealthTech', 'FinTech', 'SaaS & Cloud'],
    startupStages: ['Seed', 'Series A', 'Growth'],
    geographicEligibility: {
      scope: 'Global',
    },
    registrationRequirements: ['Incorporation Required'],
    benefits: ['Cloud Credits', 'Technology Infrastructure', 'Mentorship', 'Corporate Access'],
    financialDetails: {
      type: 'Credits',
      amountType: 'Fixed Amount',
      amount: 350000,
      currency: 'USD',
      equityType: 'No Equity',
      additionalTerms: '100% non-dilutive credit allocation covering Compute Engine, BigQuery, Vertex AI, and Cloud TPUs.',
    },
    participationMode: 'Online',
    opportunityScope: 'Global',
    applicationMethod: 'Apply Through Xentro',
    acceptApplicationsThroughXentro: true,
    applicationSteps: [
      { stepNumber: 1, title: 'AI Architecture & Stack Submission', description: 'Submit model architecture and cloud usage projection.' },
      { stepNumber: 2, title: 'Google Technical Architecture Review', description: 'Deep dive call with Google Cloud Solution Architects.' },
      { stepNumber: 3, title: 'Credit Onboarding & Access Grant', description: 'Immediate provisioning to Google Cloud Project organization.' },
    ],
    applicationRequirements: ['Startup Profile', 'Product Demo', 'Website'],
    applicationsOpen: '2026-02-01',
    applicationDeadline: '2026-11-30',
    rollingApplications: true,
    frequency: 'Rolling',
    capacityType: 'Limited',
    availableSlots: 60,
    slotLabel: 'AI Venture Seats',
    links: [
      { id: 'l1', label: 'Program Guidelines', url: 'https://cloud.google.com/startup' },
      { id: 'l2', label: 'Vertex AI Documentation', url: 'https://cloud.google.com/vertex-ai' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    verification: {
      officialSourceUrl: 'https://cloud.google.com/startup',
      officialApplicationUrl: 'https://cloud.google.com/startup/apply',
      sourcePublicationDate: '2026-02-01',
      lastVerifiedDate: '2026-03-15',
      verifiedBy: 'Sravan (#admin) - Security Admin',
      status: 'Verified',
    },
    status: 'open',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    applicantsCount: 22,
  },
  {
    id: 'opp-esp-thub-05',
    publisherAccountId: 'usr_esp_thub',
    publisherType: 'Entity Account',
    publisherName: 'Dr. Srinivas Rao',
    publisherRoleTitle: 'Chief Executive Officer',
    publisherOrgName: 'T-Hub Foundation',
    publisherVerified: true,
    targetUserTypes: ['startup', 'founder', 'researcher', 'mentor'],
    visibilityScope: 'All Xentro Users',
    sourceType: 'my_account',
    title: 'T-Hub SuperAngel Incubation & Scale Cohort 2026',
    category: 'Incubation',
    subcategory: 'Physical Incubation',
    shortDescription:
      'Physical co-working at T-Hub Phase 2 campus, maker lab access, state government pilot fast-track, and seed grant endorsements.',
    fullDescription: `T-Hub Foundation invites high-impact startups in Enterprise AI, Mobility, Smart Cities, and Precision Biotech for its flagship 9-month incubation residency in Hyderabad.

Selected ventures receive dedicated workspace in the world’s largest innovation campus, direct sandbox pilot deployment access with Telangana State Govt departments, legal & IP filing subsidies, and pre-vetted investor showcase presentations.`,
    objective: 'Provide comprehensive physical and regulatory sandbox support to high-growth Indian startups.',
    applicantTypes: ['Startup', 'Founder', 'Team'],
    industries: ['Enterprise AI', 'DeepTech', 'HealthTech', 'CleanTech / Climate', 'Hardware & Robotics'],
    startupStages: ['MVP', 'Early Revenue', 'Seed'],
    geographicEligibility: {
      scope: 'Country',
      country: 'India',
    },
    registrationRequirements: ['Incorporation Required', 'DPIIT Recognition Required'],
    benefits: ['Office Space', 'Co-working Space', 'Lab Access', 'Government Access', 'Investor Access'],
    financialDetails: {
      type: 'Grant',
      amountType: 'Range',
      minimumAmount: 1500000,
      maximumAmount: 2500000,
      currency: 'INR',
      equityType: 'No Equity',
      additionalTerms: 'Zero equity incubation residency; seed grant access via state innovation fund.',
    },
    participationMode: 'Hybrid',
    venue: {
      venueName: 'T-Hub Phase 2 Campus',
      address: '20 Inorbit Mall Road, Knowledge City, Silpa Gram Craft Village',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
    },
    opportunityScope: 'National',
    applicationMethod: 'Apply Through Xentro',
    acceptApplicationsThroughXentro: true,
    applicationSteps: [
      { stepNumber: 1, title: 'Application Dossier Submission', description: 'Submit venture traction, team profiles, and business deck.' },
      { stepNumber: 2, title: 'Admissions Panel Review', description: 'Screening by T-Hub advisory committee.' },
      { stepNumber: 3, title: 'Orientation & Lab Keycard Handover', description: 'Move-in to campus and start 9-month residency.' },
    ],
    applicationRequirements: [
      'Startup Profile',
      'Pitch Deck',
      'Incorporation Certificate',
      'GST Certificate',
    ],
    applicationsOpen: '2026-02-15',
    applicationDeadline: '2026-05-15',
    rollingApplications: false,
    frequency: 'Annual',
    capacityType: 'Limited',
    availableSlots: 25,
    slotLabel: 'Incubation Seats',
    links: [
      { id: 'l1', label: 'T-Hub Official Website', url: 'https://t-hub.co' },
    ],
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
    verification: {
      verifiedBy: 'Karunya (#9922953) - Super Admin',
      status: 'Official',
      lastVerifiedDate: '2026-03-18',
    },
    status: 'open',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-03-18T16:00:00Z',
    applicantsCount: 19,
  },
];

export const INITIAL_APPLICANTS: OpportunityApplicant[] = [
  {
    id: 'app-01',
    opportunityId: 'opp-gov-sisfs-01',
    applicantId: 'usr_founder_rahul',
    applicantName: 'Rahul Sharma',
    applicantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    applicantType: 'Startup',
    organizationName: 'Aetheris AI Pvt Ltd',
    email: 'rahul@aetheris.ai',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    applicationDate: '2026-03-20',
    status: 'Under Review',
    notes: 'DPIIT recognized #DIPP89123. Excellent agentic LLM orchestration engine with 4 paid enterprise trials.',
    proposalPitch: 'We are building self-healing API gateway infrastructure for banking microservices.',
    submittedDocuments: ['Pitch Deck (v3.2).pdf', 'DPIIT_Certificate.pdf', 'FY25_Financials.pdf'],
    reviewedBy: 'Karunya S. (Admin)',
  },
  {
    id: 'app-02',
    opportunityId: 'opp-gov-sisfs-01',
    applicantId: 'usr_founder_ananya',
    applicantName: 'Ananya Deshmukh',
    applicantAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    applicantType: 'Startup',
    organizationName: 'BioSynthetix Labs',
    email: 'ananya@biosynthetix.in',
    phone: '+91 98111 22334',
    location: 'Pune, India',
    applicationDate: '2026-03-18',
    status: 'Shortlisted',
    notes: 'Prototype validated in Pune lab. PoC meets grant criteria perfectly.',
    proposalPitch: 'Point-of-care microfluidic pathogen screening kit with 15-minute diagnostic time.',
    submittedDocuments: ['BioSynthetix_Deck.pdf', 'Patent_Filing_Receipt.pdf'],
    reviewedBy: 'Karunya S. (Admin)',
  },
  ];

class OpportunityService {
  private getStorage(): Opportunity[] {
    if (typeof window === 'undefined') return INITIAL_OPPORTUNITIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OPPORTUNITIES));
        return INITIAL_OPPORTUNITIES;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (o: any) =>
            o.id !== 'opp-vc-apex-syndicate-03' &&
            o.id !== 'opp-mentor-vikram-04' &&
            o.publisherName !== 'Rajesh Singhania' &&
            o.publisherName !== 'Dr. Vikram Malhotra'
        );
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
        return filtered;
      }
      return INITIAL_OPPORTUNITIES;
    } catch {
      return INITIAL_OPPORTUNITIES;
    }
  }

  private setStorage(items: Opportunity[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('xentro-opportunities-updated', { detail: { opportunities: items } }));
    } catch (e) {
      console.error('Failed to save opportunities to localStorage', e);
    }
  }

  public getOpportunities(): Opportunity[] {
    return this.getStorage();
  }

  public getOpportunityById(id: string): Opportunity | undefined {
    return this.getStorage().find((o) => o.id === id);
  }

  public calculateStatus(opp: Partial<Opportunity>): OpportunityStatus {
    if (opp.status === 'closed' || opp.status === 'draft') return opp.status;
    if (opp.rollingApplications) return 'rolling';

    const now = new Date();
    if (opp.applicationsOpen) {
      const openDate = new Date(opp.applicationsOpen);
      if (now < openDate) return 'upcoming';
    }

    if (opp.applicationDeadline) {
      const deadlineDate = new Date(opp.applicationDeadline);
      if (now > deadlineDate) return 'closed';
    }

    return 'open';
  }

  public saveOpportunity(opp: Opportunity): Opportunity {
    const all = this.getStorage();
    const existingIndex = all.findIndex((o) => o.id === opp.id);
    const calculatedStatus = this.calculateStatus(opp);

    const hardened: Opportunity = {
      ...opp,
      status: calculatedStatus,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = hardened;
    } else {
      hardened.createdAt = new Date().toISOString();
      hardened.applicantsCount = hardened.applicantsCount || 0;
      all.unshift(hardened);
    }

    this.setStorage(all);
    return hardened;
  }

  public deleteOpportunity(id: string): boolean {
    const all = this.getStorage();
    const filtered = all.filter((o) => o.id !== id);
    if (filtered.length !== all.length) {
      this.setStorage(filtered);
      return true;
    }
    return false;
  }

  public archiveOpportunity(id: string): boolean {
    const opp = this.updateOpportunityStatus(id, 'archived');
    return !!opp;
  }

  public updateOpportunityStatus(id: string, status: OpportunityStatus): Opportunity | null {
    const all = this.getStorage();
    const target = all.find((o) => o.id === id);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      this.setStorage(all);
      return target;
    }
    return null;
  }

  public duplicateOpportunity(id: string): Opportunity | null {
    const opp = this.getOpportunityById(id);
    if (!opp) return null;

    const duplicated: Opportunity = {
      ...opp,
      id: `opp_${Date.now()}_copy`,
      title: `${opp.title} (Copy)`,
      status: 'draft',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveOpportunity(duplicated);
  }

  public saveDraft(publisherAccountId: string, draftData: Partial<Opportunity>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${publisherAccountId}`, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }

  public getDraft(publisherAccountId: string): Partial<Opportunity> | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${publisherAccountId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public clearDraft(publisherAccountId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${publisherAccountId}`);
    } catch {}
  }

  public getFeedOpportunities(activeUserRole: string): Opportunity[] {
    const all = this.getStorage().filter((o) => o.status !== 'draft');
    const normalizedRole = activeUserRole.toLowerCase().trim();

    return all.filter((opp) => {
      // Check targetUserTypes matching activeUserRole or 'all'
      if (!opp.targetUserTypes || opp.targetUserTypes.length === 0) return true;
      const targetLower = opp.targetUserTypes.map((t) => t.toLowerCase());
      return targetLower.includes('all') || targetLower.includes(normalizedRole);
    });
  }

  public async fetchOpportunitiesFromApi(): Promise<Opportunity[]> {
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/opportunities/`);
      if (resp.ok) {
        const json = await resp.json();
        const apiRecords = json?.data?.opportunities || json?.data || [];
        if (Array.isArray(apiRecords) && apiRecords.length > 0) {
          const mapped: Opportunity[] = apiRecords.map((r: any, idx: number) => {
            const orgName = r.organizationName || r.organization || (typeof r.externalOrganization === 'string' ? r.externalOrganization : r.externalOrganization?.name) || 'Official Partner';
            return {
              id: r.id || `opp-api-${idx}-${Date.now()}`,
              publisherAccountId: r.publisherAccountId || 'usr_admin',
              publisherType: r.publisherType || 'Xentro Admin',
              publisherName: r.publisherName || 'Platform Ops',
              publisherRoleTitle: r.publisherRoleTitle || 'Ecosystem Lead',
              publisherOrgName: orgName,
              publisherVerified: true,
              targetUserTypes: r.targetUserTypes || ['startup', 'founder'],
              visibilityScope: 'All Xentro Users',
              sourceType: r.sourceType || 'government',
              title: r.title || 'Untitled Opportunity',
              category: r.category || 'Grant',
              subcategory: r.subcategory || 'Government & Corporate',
              shortDescription: r.description || r.shortDescription || 'Verified opportunity for ecosystem founders.',
              fullDescription: r.fullDescription || r.description || 'Details regarding terms, eligibility, and submission guidelines.',
              applicantTypes: r.applicantTypes || ['Startup', 'Founder'],
              industries: r.industries || ['DeepTech', 'Enterprise AI', 'SaaS', 'General Tech'],
              benefits: r.benefits || ['Grant', 'Mentorship', 'Market Access'],
              financialDetails: {
                type: r.financialDetails?.type || 'Grant',
                amountType: 'Fixed Amount',
                minimumAmount: Number(r.amount) || Number(r.grantAmount) || 1000000,
                maximumAmount: Number(r.amount) || Number(r.grantAmount) || 2500000,
                currency: 'INR',
                equityType: 'No Equity',
                additionalTerms: r.additionalTerms || 'Non-dilutive grant support.',
              },
              participationMode: r.participationMode || 'Online',
              opportunityScope: r.opportunityScope || 'National',
              applicationMethod: r.applicationUrl ? 'External Application' : 'Apply Through Xentro',
              acceptApplicationsThroughXentro: !r.applicationUrl,
              applicationDeadline: r.deadline || r.applicationDeadline || '2026-12-31',
              status: (r.status as OpportunityStatus) || 'open',
              externalOrganization: {
                name: orgName,
                organizationType: 'Institution',
                ownershipType: 'government',
                website: r.url || r.applicationUrl || 'https://xentro.in',
                officialOpportunityUrl: r.applicationUrl || r.url || 'https://xentro.in',
              },
              createdAt: r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || new Date().toISOString(),
              applicantsCount: r.applicantsCount || 0,
            };
          });

          // Merge with existing local records avoiding duplicates by id or title
          const current = this.getStorage();
          const combined = [...mapped];
          current.forEach((c) => {
            if (!combined.some((m) => m.id === c.id || m.title.toLowerCase() === c.title.toLowerCase())) {
              combined.push(c);
            }
          });
          this.setStorage(combined);
          return combined;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch opportunities from backend API:", e);
    }
    return this.getStorage();
  }

  public async importOpportunitiesCsv(csvFileOrText: File | string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const backendUrl = getBackendBaseUrl();
      let resp: Response;
      if (typeof csvFileOrText === 'string') {
        resp = await fetch(`${backendUrl}/opportunities/import-csv/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvContent: csvFileOrText }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", csvFileOrText);
        resp = await fetch(`${backendUrl}/opportunities/import-csv/`, {
          method: "POST",
          body: formData,
        });
      }

      const data = await resp.json();
      if (resp.ok && data?.success) {
        const count = data?.data?.importedCount || (data?.data?.records ? data.data.records.length : 0);
        await this.fetchOpportunitiesFromApi();
        return { success: true, count, message: data.message || `Successfully imported ${count} opportunities.` };
      } else {
        return { success: false, count: 0, message: data?.message || "Failed to parse and import CSV opportunities." };
      }
    } catch (err: any) {
      return { success: false, count: 0, message: err?.message || "Network error while importing opportunities CSV." };
    }
  }

  /* ---------------- APPLICANTS & APPLICATION MANAGEMENT ---------------- */

  private getApplicantsStorage(): OpportunityApplicant[] {
    if (typeof window === 'undefined') return INITIAL_APPLICANTS;
    try {
      const stored = localStorage.getItem(APPLICANTS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(APPLICANTS_STORAGE_KEY, JSON.stringify(INITIAL_APPLICANTS));
        return INITIAL_APPLICANTS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_APPLICANTS;
    }
  }

  private setApplicantsStorage(items: OpportunityApplicant[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(APPLICANTS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(
        new CustomEvent('xentro-opportunity-applicants-updated', { detail: { applicants: items } })
      );
    } catch (e) {
      console.error('Failed to save applicants', e);
    }
  }

  public getApplicants(opportunityId?: string): OpportunityApplicant[] {
    const all = this.getApplicantsStorage();
    if (!opportunityId) return all;
    return all.filter((a) => a.opportunityId === opportunityId);
  }

  public updateApplicantStatus(
    applicantId: string,
    status: ApplicantStatus,
    notes?: string,
    reviewedBy?: string
  ): OpportunityApplicant | null {
    const all = this.getApplicantsStorage();
    const applicant = all.find((a) => a.id === applicantId);
    if (applicant) {
      applicant.status = status;
      if (notes !== undefined) applicant.notes = notes;
      if (reviewedBy) applicant.reviewedBy = reviewedBy;
      this.setApplicantsStorage(all);
      return applicant;
    }
    return null;
  }

  public applyToOpportunity(
    opportunityId: string,
    data: {
      applicantId: string;
      applicantName: string;
      applicantAvatar?: string;
      applicantType: string;
      organizationName?: string;
      email: string;
      phone?: string;
      location?: string;
      proposalPitch?: string;
      submittedDocuments?: string[];
    }
  ): OpportunityApplicant {
    const all = this.getApplicantsStorage();
    const newApplicant: OpportunityApplicant = {
      id: `app_${Date.now()}`,
      opportunityId,
      ...data,
      applicationDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
    };

    all.unshift(newApplicant);
    this.setApplicantsStorage(all);

    // Increment applicantsCount on the opportunity
    const opps = this.getStorage();
    const opp = opps.find((o) => o.id === opportunityId);
    if (opp) {
      opp.applicantsCount = (opp.applicantsCount || 0) + 1;
      this.setStorage(opps);
    }

    return newApplicant;
  }
}

export const opportunityService = new OpportunityService();
