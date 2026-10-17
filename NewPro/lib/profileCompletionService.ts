/**
 * XENTRO V1 — PROFILE COMPLETION ENGINE
 * 
 * Centralized, persona-aware, server-authoritative profile completion service.
 * Applies a documented, deterministic weighting system deriving strictly from
 * persisted backend fields.
 * 
 * Separated strictly from Verification Status (regulatory/MCA attestations)
 * and Onboarding Approval.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
  description: string;
  navigationModule: string;
  missingFields?: string[];
}

export interface ProfileCompletionResult {
  persona: string;
  percentage: number;
  isComplete: boolean;
  checklist: ChecklistItem[];
  missingCount: number;
  completedCount: number;
  completedWeight: number;
  totalWeight: number;
}

/**
 * Checks if a string value is non-empty after trimming.
 */
function isValidString(val: any, minLen = 1): boolean {
  return typeof val === 'string' && val.trim().length >= minLen;
}

/**
 * Checks if an array is non-empty and has at least minItems.
 */
function isValidArray(val: any, minItems = 1): boolean {
  return Array.isArray(val) && val.length >= minItems;
}

// =========================================================================
// 1. STARTUP PERSONA COMPLETION
// =========================================================================
export function calculateStartupCompletion(data: any): ProfileCompletionResult {
  if (!data || typeof data !== 'object') {
    return createZeroResult('startup', getStartupChecklistTemplate());
  }

  const identity = data.identity || {};
  const overview = data.overview || {};
  const market = data.market || {};
  const businessModel = data.businessModel || {};
  const publicTeam = data.publicTeam || data.team || {};
  const pitchDeck = data.pitchDeck || {};
  const pitchVideo = data.pitchVideo || {};
  const financials = data.financials || {};

  // 1. Basic Info (20%)
  const basicMissing: string[] = [];
  const hasName = isValidString(identity.name || data.name);
  if (!hasName) basicMissing.push('Venture Name');
  const hasIndustry = isValidString(identity.industry || data.industry);
  if (!hasIndustry) basicMissing.push('Industry / Sector');
  const hasTagline = isValidString(identity.tagline || data.tagline, 5);
  if (!hasTagline) basicMissing.push('Tagline / Pitch');
  const hasLocation = isValidString(identity.location || data.location || data.headquarters);
  if (!hasLocation) basicMissing.push('Headquarters Location');
  const basicCompleted = hasName && hasIndustry && hasTagline && hasLocation;

  // 2. Problem & Solution (15%)
  const probMissing: string[] = [];
  const hasProblem = isValidString(data.problem || overview.whatItDoes || data.description, 10);
  if (!hasProblem) probMissing.push('Problem Statement / Overview');
  const hasSolution = isValidString(data.solution || overview.coreValueProp || data.mission, 10);
  if (!hasSolution) probMissing.push('Solution Description');
  const probCompleted = hasProblem && hasSolution;

  // 3. Market & Business Model (15%)
  const marketMissing: string[] = [];
  const hasMarket = isValidString(market.targetCustomer || market.primarySegment || data.subSector);
  if (!hasMarket) marketMissing.push('Target Market / Segment');
  const hasModel = isValidString(businessModel.businessModel || businessModel.revenueModel || data.businessModel);
  if (!hasModel) marketMissing.push('Revenue / Business Model');
  const marketCompleted = hasMarket && hasModel;

  // 4. Founding Team (15%)
  const teamMissing: string[] = [];
  const founders = publicTeam.founders || publicTeam.members || [];
  const hasFounder = Array.isArray(founders) && founders.some((f: any) => isValidString(f.name) && isValidString(f.role));
  if (!hasFounder) teamMissing.push('At least one Founder with Name & Role');
  const teamCompleted = hasFounder;

  // 5. Pitch Deck / Media (15%)
  const mediaMissing: string[] = [];
  const hasDeck = (isValidArray(pitchDeck.previewSlides) && pitchDeck.previewSlides.length > 0) ||
    isValidString(pitchDeck.documentUrl || pitchDeck.url || pitchDeck.title) ||
    isValidString(data.pitchDeckUrl);
  const hasVideo = isValidString(pitchVideo.videoUrl || data.elevatorPitchUrl);
  if (!hasDeck && !hasVideo) mediaMissing.push('Pitch Deck slides or Elevator Pitch video');
  const mediaCompleted = hasDeck || hasVideo;

  // 6. Finances & Operations (10%)
  const finMissing: string[] = [];
  const hasRunway = (typeof financials.runwayMonths === 'number' && financials.runwayMonths > 0) ||
    isValidString(financials.runwayMonths) ||
    (typeof data.runway === 'number' && data.runway > 0) ||
    isValidString(data.runway) ||
    isValidString(data.fundingTarget || financials.fundingGoal);
  if (!hasRunway) finMissing.push('Cash Runway or Capital Requirements');
  const finCompleted = Boolean(hasRunway);

  // 7. Ecosystem Ask / Listings (10%)
  const askMissing: string[] = [];
  const hasAsk = (data.currentAsk && isValidString(data.currentAsk.title) && data.currentAsk.title !== 'No Active Ask') ||
    (Array.isArray(data.asks) && data.asks.length > 0) ||
    (Array.isArray(data.listings) && data.listings.length > 0);
  if (!hasAsk) askMissing.push('Active Capital Round or Business Ask');
  const askCompleted = Boolean(hasAsk);

  const checklist: ChecklistItem[] = [
    {
      id: 'sec_basic',
      label: 'Basic Info & Identity',
      weight: 20,
      completed: basicCompleted,
      description: 'Organization name, industry sector, pitch tagline, and headquarters location',
      navigationModule: 'profile',
      missingFields: basicCompleted ? undefined : basicMissing,
    },
    {
      id: 'sec_problem',
      label: 'Problem & Solution',
      weight: 15,
      completed: probCompleted,
      description: 'Core problem definition, customer pain point, and unique value proposition',
      navigationModule: 'profile',
      missingFields: probCompleted ? undefined : probMissing,
    },
    {
      id: 'sec_market',
      label: 'Market & Business Model',
      weight: 15,
      completed: marketCompleted,
      description: 'Target customer segment, market sizing, and monetization model',
      navigationModule: 'profile',
      missingFields: marketCompleted ? undefined : marketMissing,
    },
    {
      id: 'sec_team',
      label: 'Founding Team',
      weight: 15,
      completed: teamCompleted,
      description: 'Founding member profiles, roles, and professional credentials',
      navigationModule: 'team_access',
      missingFields: teamCompleted ? undefined : teamMissing,
    },
    {
      id: 'sec_deck',
      label: 'Pitch Deck & Video',
      weight: 15,
      completed: mediaCompleted,
      description: 'Institutional pitch deck presentation slides or founder elevator video',
      navigationModule: 'dd_locker',
      missingFields: mediaCompleted ? undefined : mediaMissing,
    },
    {
      id: 'sec_finance',
      label: 'Financials & Runway',
      weight: 10,
      completed: finCompleted,
      description: 'Cash runway runway projection, historical burns, or funding goals',
      navigationModule: 'finance',
      missingFields: finCompleted ? undefined : finMissing,
    },
    {
      id: 'sec_ask',
      label: 'Active Ecosystem Ask',
      weight: 10,
      completed: askCompleted,
      description: 'Published capital formation ask or active ecosystem partnership requirement',
      navigationModule: 'business_operations',
      missingFields: askCompleted ? undefined : askMissing,
    },
  ];

  return compileCompletionResult('startup', checklist);
}

function getStartupChecklistTemplate(): ChecklistItem[] {
  return [
    { id: 'sec_basic', label: 'Basic Info & Identity', weight: 20, completed: false, description: 'Organization name, industry sector, pitch tagline, and headquarters location', navigationModule: 'profile' },
    { id: 'sec_problem', label: 'Problem & Solution', weight: 15, completed: false, description: 'Core problem definition, customer pain point, and unique value proposition', navigationModule: 'profile' },
    { id: 'sec_market', label: 'Market & Business Model', weight: 15, completed: false, description: 'Target customer segment, market sizing, and monetization model', navigationModule: 'profile' },
    { id: 'sec_team', label: 'Founding Team', weight: 15, completed: false, description: 'Founding member profiles, roles, and professional credentials', navigationModule: 'team_access' },
    { id: 'sec_deck', label: 'Pitch Deck & Video', weight: 15, completed: false, description: 'Institutional pitch deck presentation slides or founder elevator video', navigationModule: 'dd_locker' },
    { id: 'sec_finance', label: 'Financials & Runway', weight: 10, completed: false, description: 'Cash runway runway projection, historical burns, or funding goals', navigationModule: 'finance' },
    { id: 'sec_ask', label: 'Active Ecosystem Ask', weight: 10, completed: false, description: 'Published capital formation ask or active ecosystem partnership requirement', navigationModule: 'business_operations' },
  ];
}

// =========================================================================
// 2. MENTOR PERSONA COMPLETION
// =========================================================================
export function calculateMentorCompletion(data: any): ProfileCompletionResult {
  if (!data || typeof data !== 'object') {
    return createZeroResult('mentor', getMentorChecklistTemplate());
  }

  // 1. Identity & Bio (25%)
  const hasName = isValidString(data.name || data.fullName);
  const hasHeadline = isValidString(data.headline || data.title, 5);
  const hasBio = isValidString(data.bio, 20);
  const identityCompleted = hasName && hasHeadline && hasBio;

  // 2. Expertise & Sectors (25%)
  const skills = Array.isArray(data.skills) ? data.skills : Array.isArray(data.expertise) ? data.expertise : [];
  const sectors = Array.isArray(data.sectors) ? data.sectors : Array.isArray(data.targetSectors) ? data.targetSectors : [];
  const expertiseCompleted = (skills.length + sectors.length) >= 2;

  // 3. Mentorship Offerings & Packages (25%)
  const offerings = Array.isArray(data.offerings) ? data.offerings : [];
  const offeringsCompleted = offerings.some((o: any) => o.enabled && o.price >= 0 && isValidString(o.duration));

  // 4. Availability Schedule (25%)
  const avail = data.availability || data.availabilityConfig || {};
  const hasDays = isValidArray(avail.availableDays) && avail.availableDays.length > 0;
  const hasTimes = isValidString(avail.startTime) && isValidString(avail.endTime);
  const availCompleted = hasDays && hasTimes;

  const checklist: ChecklistItem[] = [
    {
      id: 'sec_mentor_id',
      label: 'Mentor Bio & Identity',
      weight: 25,
      completed: identityCompleted,
      description: 'Full name, professional headline, and detailed advisory background (20+ chars)',
      navigationModule: 'profile',
      missingFields: identityCompleted ? undefined : ['Name', 'Headline', 'Detailed Bio (min 20 chars)'],
    },
    {
      id: 'sec_mentor_exp',
      label: 'Expertise & Sectors',
      weight: 25,
      completed: expertiseCompleted,
      description: 'At least 2 functional advisory skills or target industry sectors',
      navigationModule: 'profile',
      missingFields: expertiseCompleted ? undefined : ['At least 2 advisory skills or focus sectors'],
    },
    {
      id: 'sec_mentor_off',
      label: 'Advisory Packages & Pricing',
      weight: 25,
      completed: offeringsCompleted,
      description: 'Configured and enabled 1-month, 3-month, or 6-month mentorship package',
      navigationModule: 'mentorship',
      missingFields: offeringsCompleted ? undefined : ['At least one active advisory package with pricing'],
    },
    {
      id: 'sec_mentor_avail',
      label: 'Meeting Availability Schedule',
      weight: 25,
      completed: availCompleted,
      description: 'Configured meeting days, start/end hours, and session length',
      navigationModule: 'meetings',
      missingFields: availCompleted ? undefined : ['Available meeting days and active time window'],
    },
  ];

  return compileCompletionResult('mentor', checklist);
}

function getMentorChecklistTemplate(): ChecklistItem[] {
  return [
    { id: 'sec_mentor_id', label: 'Mentor Bio & Identity', weight: 25, completed: false, description: 'Full name, professional headline, and detailed advisory background', navigationModule: 'profile' },
    { id: 'sec_mentor_exp', label: 'Expertise & Sectors', weight: 25, completed: false, description: 'At least 2 functional advisory skills or target industry sectors', navigationModule: 'profile' },
    { id: 'sec_mentor_off', label: 'Advisory Packages & Pricing', weight: 25, completed: false, description: 'Configured and enabled mentorship package', navigationModule: 'mentorship' },
    { id: 'sec_mentor_avail', label: 'Meeting Availability Schedule', weight: 25, completed: false, description: 'Configured meeting days and active time window', navigationModule: 'meetings' },
  ];
}

// =========================================================================
// 3. INDIVIDUAL INVESTOR PERSONA COMPLETION
// =========================================================================
export function calculateIndividualInvestorCompletion(data: any): ProfileCompletionResult {
  if (!data || typeof data !== 'object') {
    return createZeroResult('investor_individual', getIndividualInvestorChecklistTemplate());
  }

  // 1. Identity & Background (25%)
  const hasName = isValidString(data.name || data.fullName);
  const hasRole = isValidString(data.currentRole || data.role);
  const hasBio = isValidString(data.bio || data.background, 15);
  const idCompleted = hasName && (hasRole || hasBio);

  // 2. Investment Thesis & Focus (25%)
  const focus = data.investmentFocus || {};
  const sectors = Array.isArray(focus.sectors) ? focus.sectors : Array.isArray(data.sectors) ? data.sectors : [];
  const stages = Array.isArray(focus.stages) ? focus.stages : Array.isArray(data.stages) ? data.stages : [];
  const thesisCompleted = sectors.length > 0 && stages.length > 0;

  // 3. Cheque Size & Parameters (25%)
  const ticket = focus.ticketSize || {};
  const hasTicket = isValidString(ticket.formatted) || isValidString(data.ticketSize) ||
    (ticket.min !== undefined && ticket.max !== undefined && ticket.min !== '0' && ticket.max !== '0');
  const chequeCompleted = Boolean(hasTicket);

  // 4. Connection & Diligence Preferences (25%)
  const prefs = data.connectionPreferences || {};
  const proc = data.investmentProcess || {};
  const criteria = data.investmentCriteria || {};
  const hasPrefs = isValidString(prefs.guidelines) ||
    isValidArray(criteria.evaluationCriteria) ||
    isValidArray(proc.stages);
  const prefsCompleted = Boolean(hasPrefs);

  const checklist: ChecklistItem[] = [
    {
      id: 'sec_inv_id',
      label: 'Angel Identity & Bio',
      weight: 25,
      completed: idCompleted,
      description: 'Investor full name, professional affiliation/role, and background bio',
      navigationModule: 'profile',
      missingFields: idCompleted ? undefined : ['Name', 'Professional Role or Background Bio'],
    },
    {
      id: 'sec_inv_thesis',
      label: 'Investment Thesis & Sectors',
      weight: 25,
      completed: thesisCompleted,
      description: 'At least 1 focus sector and 1 target investment stage (e.g. Seed, Pre-Series A)',
      navigationModule: 'profile',
      missingFields: thesisCompleted ? undefined : ['At least 1 target sector and 1 investment stage'],
    },
    {
      id: 'sec_inv_cheque',
      label: 'Cheque Size & Parameters',
      weight: 25,
      completed: chequeCompleted,
      description: 'Defined minimum and maximum individual angel investment ticket range',
      navigationModule: 'profile',
      missingFields: chequeCompleted ? undefined : ['Ticket size range (e.g. ₹25L – ₹1Cr)'],
    },
    {
      id: 'sec_inv_prefs',
      label: 'Connection & Diligence Criteria',
      weight: 25,
      completed: prefsCompleted,
      description: 'Pitch submission guidelines, warm introduction preference, or evaluation criteria',
      navigationModule: 'profile',
      missingFields: prefsCompleted ? undefined : ['Pitch guidelines or diligence criteria'],
    },
  ];

  return compileCompletionResult('investor_individual', checklist);
}

function getIndividualInvestorChecklistTemplate(): ChecklistItem[] {
  return [
    { id: 'sec_inv_id', label: 'Angel Identity & Bio', weight: 25, completed: false, description: 'Investor full name and professional background', navigationModule: 'profile' },
    { id: 'sec_inv_thesis', label: 'Investment Thesis & Sectors', weight: 25, completed: false, description: 'Target sectors and investment stages', navigationModule: 'profile' },
    { id: 'sec_inv_cheque', label: 'Cheque Size & Parameters', weight: 25, completed: false, description: 'Defined ticket size range', navigationModule: 'profile' },
    { id: 'sec_inv_prefs', label: 'Connection & Diligence Criteria', weight: 25, completed: false, description: 'Pitch guidelines or diligence criteria', navigationModule: 'profile' },
  ];
}

// =========================================================================
// 4. INVESTMENT ORGANIZATION PERSONA COMPLETION
// =========================================================================
export function calculateInvestmentOrgCompletion(data: any): ProfileCompletionResult {
  if (!data || typeof data !== 'object') {
    return createZeroResult('investor_org', getInvestmentOrgChecklistTemplate());
  }

  // 1. Legal Entity & HQ (20%)
  const hasName = isValidString(data.name);
  const hasType = isValidString(data.organizationType || data.type);
  const hasEmail = isValidString(data.officialEmail || data.email);
  const legalCompleted = hasName && hasType && hasEmail;

  // 2. Fund Thesis & Focus (20%)
  const focus = data.investmentFocus || {};
  const hasThesis = isValidString(data.about?.thesis || data.about?.overview || data.thesis, 15);
  const hasSectors = isValidArray(focus.sectors) || isValidArray(data.sectors);
  const thesisCompleted = hasThesis && hasSectors;

  // 3. Fund Capital & Cheque Range (20%)
  const hasFundSize = isValidString(data.fundSize) && data.fundSize !== '₹0';
  const hasCheque = isValidString(focus.ticketSize?.formatted) || isValidString(data.ticketSize);
  const capCompleted = hasFundSize || hasCheque;

  // 4. Team & Governance (20%)
  const team = Array.isArray(data.teamMembers) ? data.teamMembers : Array.isArray(data.members) ? data.members : [];
  const teamCompleted = team.length > 0;

  // 5. Diligence & Investment Process (20%)
  const proc = data.investmentProcess || {};
  const crit = data.investmentCriteria || {};
  const hasProcess = isValidArray(proc.stages) || isValidArray(crit.evaluationCriteria);
  const procCompleted = Boolean(hasProcess);

  const checklist: ChecklistItem[] = [
    {
      id: 'sec_org_legal',
      label: 'Entity Identity & Official Contact',
      weight: 20,
      completed: legalCompleted,
      description: 'Firm legal name, organization type (VC/Syndicate/Fund), and verified official email',
      navigationModule: 'profile',
      missingFields: legalCompleted ? undefined : ['Firm Name', 'Entity Type', 'Official Email'],
    },
    {
      id: 'sec_org_thesis',
      label: 'Fund Thesis & Sectors',
      weight: 20,
      completed: thesisCompleted,
      description: 'Fund investment thesis and target industry deployment sectors',
      navigationModule: 'profile',
      missingFields: thesisCompleted ? undefined : ['Investment Thesis Description', 'Focus Sectors'],
    },
    {
      id: 'sec_org_cap',
      label: 'Fund Size & Cheque Range',
      weight: 20,
      completed: capCompleted,
      description: 'Total Fund AUM / Syndicate pool and target institutional cheque range',
      navigationModule: 'profile',
      missingFields: capCompleted ? undefined : ['Fund Size (AUM)', 'Target Cheque Range'],
    },
    {
      id: 'sec_org_team',
      label: 'Investment Team & RBAC',
      weight: 20,
      completed: teamCompleted,
      description: 'Managing partners, principals, and authorized investment committee leads',
      navigationModule: 'team_access',
      missingFields: teamCompleted ? undefined : ['At least one team member registered'],
    },
    {
      id: 'sec_org_proc',
      label: 'Diligence & Process Stages',
      weight: 20,
      completed: procCompleted,
      description: 'Documented investment committee evaluation stages and screening criteria',
      navigationModule: 'deal_flow',
      missingFields: procCompleted ? undefined : ['Defined evaluation process stages'],
    },
  ];

  return compileCompletionResult('investor_org', checklist);
}

function getInvestmentOrgChecklistTemplate(): ChecklistItem[] {
  return [
    { id: 'sec_org_legal', label: 'Entity Identity & Official Contact', weight: 20, completed: false, description: 'Firm legal name, type, and official email', navigationModule: 'profile' },
    { id: 'sec_org_thesis', label: 'Fund Thesis & Sectors', weight: 20, completed: false, description: 'Fund investment thesis and target sectors', navigationModule: 'profile' },
    { id: 'sec_org_cap', label: 'Fund Size & Cheque Range', weight: 20, completed: false, description: 'Fund AUM and target cheque range', navigationModule: 'profile' },
    { id: 'sec_org_team', label: 'Investment Team & RBAC', weight: 20, completed: false, description: 'Managing partners and team members', navigationModule: 'team_access' },
    { id: 'sec_org_proc', label: 'Diligence & Process Stages', weight: 20, completed: false, description: 'Documented investment evaluation stages', navigationModule: 'deal_flow' },
  ];
}

// =========================================================================
// 5. ESP & INSTITUTION PERSONA COMPLETION
// =========================================================================
export function calculateESPCompletion(data: any, isInstitution = false): ProfileCompletionResult {
  const personaName = isInstitution ? 'institution' : 'esp';
  if (!data || typeof data !== 'object') {
    return createZeroResult(personaName, getESPChecklistTemplate(isInstitution));
  }

  // 1. Organization Legal & Official Contact (25%)
  const hasName = isValidString(data.name);
  const hasEmail = isValidString(data.officialEmail || data.email);
  const hasLocation = isValidString(data.headquarters?.city || data.location || data.city);
  const legalCompleted = hasName && hasEmail && hasLocation;

  // 2. Mission & Focus (25%)
  const hasAbout = isValidString(data.about?.overview || data.description || data.overview, 15);
  const hasSectors = isValidArray(data.focusAreas) || isValidArray(data.sectors) || isValidArray(data.domains);
  const missionCompleted = hasAbout && hasSectors;

  // 3. Program Offerings (25%)
  const programs = Array.isArray(data.programs) ? data.programs : Array.isArray(data.cohorts) ? data.cohorts : [];
  const progCompleted = programs.length > 0;

  // 4. Team & Facilities (25%)
  const members = Array.isArray(data.members) ? data.members : Array.isArray(data.teamMembers) ? data.teamMembers : [];
  const facilities = Array.isArray(data.facilities) ? data.facilities : [];
  const teamCompleted = members.length > 0 || facilities.length > 0;

  const checklist: ChecklistItem[] = [
    {
      id: 'sec_esp_legal',
      label: isInstitution ? 'Institution Identity & HQ' : 'Incubator Identity & HQ',
      weight: 25,
      completed: legalCompleted,
      description: 'Organization name, official domain email, and campus/city location',
      navigationModule: 'profile',
      missingFields: legalCompleted ? undefined : ['Organization Name', 'Official Email', 'Campus / HQ Location'],
    },
    {
      id: 'sec_esp_mission',
      label: isInstitution ? 'Academic Mission & Sectors' : 'Incubation Mission & Focus',
      weight: 25,
      completed: missionCompleted,
      description: 'Institutional mission statement and key innovation domains',
      navigationModule: 'profile',
      missingFields: missionCompleted ? undefined : ['Mission Statement (15+ chars)', 'Focus Sectors / Domains'],
    },
    {
      id: 'sec_esp_prog',
      label: isInstitution ? 'Academic Programs & Labs' : 'Incubation Programs & Cohorts',
      weight: 25,
      completed: progCompleted,
      description: 'At least one active cohort program, accelerator track, or grant opportunity',
      navigationModule: 'programs_cohorts',
      missingFields: progCompleted ? undefined : ['At least one active program or cohort track'],
    },
    {
      id: 'sec_esp_team',
      label: 'Team & Infrastructure Facilities',
      weight: 25,
      completed: teamCompleted,
      description: 'Ecosystem managers, faculty mentors, or campus infrastructure facilities',
      navigationModule: 'team_access',
      missingFields: teamCompleted ? undefined : ['At least one team coordinator or facility resource'],
    },
  ];

  return compileCompletionResult(personaName, checklist);
}

function getESPChecklistTemplate(isInstitution = false): ChecklistItem[] {
  const persona = isInstitution ? 'institution' : 'esp';
  return [
    { id: 'sec_esp_legal', label: isInstitution ? 'Institution Identity & HQ' : 'Incubator Identity & HQ', weight: 25, completed: false, description: 'Organization name, email, and location', navigationModule: 'profile' },
    { id: 'sec_esp_mission', label: isInstitution ? 'Academic Mission & Sectors' : 'Incubation Mission & Focus', weight: 25, completed: false, description: 'Mission statement and innovation domains', navigationModule: 'profile' },
    { id: 'sec_esp_prog', label: isInstitution ? 'Academic Programs & Labs' : 'Incubation Programs & Cohorts', weight: 25, completed: false, description: 'Active cohort or grant program', navigationModule: 'programs_cohorts' },
    { id: 'sec_esp_team', label: 'Team & Infrastructure Facilities', weight: 25, completed: false, description: 'Ecosystem coordinators or facilities', navigationModule: 'team_access' },
  ];
}

// =========================================================================
// COMPILATION & ROUTING HELPER
// =========================================================================
function compileCompletionResult(persona: string, checklist: ChecklistItem[]): ProfileCompletionResult {
  const totalWeight = checklist.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = checklist.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0);
  const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const completedCount = checklist.filter((item) => item.completed).length;
  const missingCount = checklist.length - completedCount;

  return {
    persona,
    percentage,
    isComplete: percentage === 100,
    checklist,
    missingCount,
    completedCount,
    completedWeight,
    totalWeight,
  };
}

function createZeroResult(persona: string, template: ChecklistItem[]): ProfileCompletionResult {
  return {
    persona,
    percentage: 0,
    isComplete: false,
    checklist: template,
    missingCount: template.length,
    completedCount: 0,
    completedWeight: 0,
    totalWeight: 100,
  };
}

/**
 * Universal router that evaluates profile completion for any supported persona.
 */
export function calculateProfileCompletion(
  role: string,
  data: any,
  options?: { isInstitution?: boolean; isOrgContext?: boolean }
): ProfileCompletionResult {
  const normRole = (role || '').toLowerCase();

  if (normRole === 'startup') {
    return calculateStartupCompletion(data);
  }

  if (normRole === 'mentor') {
    return calculateMentorCompletion(data);
  }

  if (normRole === 'investor' || normRole.includes('investor')) {
    if (options?.isOrgContext || normRole === 'investor_org') {
      return calculateInvestmentOrgCompletion(data);
    }
    return calculateIndividualInvestorCompletion(data);
  }

  if (normRole === 'esp' || normRole.includes('incubator') || normRole.includes('accelerator')) {
    return calculateESPCompletion(data, false);
  }

  if (normRole === 'institution' || options?.isInstitution) {
    return calculateESPCompletion(data, true);
  }

  // Fallback to startup
  return calculateStartupCompletion(data);
}
