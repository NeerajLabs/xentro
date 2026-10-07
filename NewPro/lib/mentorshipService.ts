import {
  MENTORSHIP_OFFERING,
  MENTORSHIP_REQUEST,
  MENTORSHIP,
  MENTORSHIP_GOAL,
  MENTORSHIP_PROGRESS_UPDATE,
  MENTORSHIP_TIMELINE_EVENT,
  MENTORSHIP_SHARED_RESOURCE,
  MENTORSHIP_TESTIMONIAL,
  MENTORSHIP_TRANSACTION,
  MentorMeeting,
} from '@/types/mentor';

const STORAGE_KEYS = {
  OFFERINGS: 'xentro_mentor_offerings',
  REQUESTS: 'xentro_mentorship_requests',
  ACTIVE: 'xentro_active_mentorships',
  TRANSACTIONS: 'xentro_mentorship_transactions',
  HISTORY: 'xentro_mentorship_history',
};

// =========================================================================
// DEFAULT DATA SETS
// =========================================================================

export const defaultMentorshipOfferings: MENTORSHIP_OFFERING[] = [
  {
    id: 'off_1m',
    mentorId: 'user_mentor',
    duration: '1 Month',
    price: 8000,
    currency: 'INR',
    enabled: false,
    description: 'Intensive single-month strategic sprint focused on tackling an acute bottleneck or preparing for a specific investor milestone.',
    areasCovered: ['Seed Pitch Teardown', 'Product-Market Fit', 'Architecture Review'],
    meetingFrequency: '2 sessions / month',
    preferredMeetingDuration: '45 Minutes',
    communicationMode: 'Xentro Messages + Video Meetings',
    maximumActiveStartups: 4,
    activeStartupsCount: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'off_3m',
    mentorId: 'user_mentor',
    duration: '3 Months',
    price: 20000,
    currency: 'INR',
    enabled: false,
    description: 'Structured quarter-long advisory engagement guiding technical founders through GTM positioning, pilot conversions, and SAFE rounds.',
    areasCovered: ['Enterprise GTM', 'Pricing Architecture', 'SAFE Diligence', 'Team Building'],
    meetingFrequency: '2 sessions / month (6 total)',
    preferredMeetingDuration: '45 Minutes',
    communicationMode: 'Xentro Messages + Video Meetings + Document Teardowns',
    maximumActiveStartups: 5,
    activeStartupsCount: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'off_6m',
    mentorId: 'user_mentor',
    duration: '6 Months',
    price: 36000,
    currency: 'INR',
    enabled: false,
    description: 'Comprehensive semi-annual strategic partnership for high-growth startups scaling from early traction to institutional Series A.',
    areasCovered: ['Scale Architecture', 'Series A Readiness', 'Board Advisory', 'Cross-Border Expansion'],
    meetingFrequency: '2 sessions / month (12 total)',
    preferredMeetingDuration: '60 Minutes',
    communicationMode: 'Xentro Messages + Priority Async Access + Bi-Weekly Calls',
    maximumActiveStartups: 3,
    activeStartupsCount: 0,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  },
];

export const initialMentorshipRequestsData: MENTORSHIP_REQUEST[] = [];

export const initialActiveMentorshipsData: MENTORSHIP[] = [];
export const initialMentorshipTransactions: MENTORSHIP_TRANSACTION[] = [];
export const initialMentorshipHistory: {
  id: string;
  startupName: string;
  founderName: string;
  founderAvatar: string;
  packageTitle: string;
  duration: string;
  startDate: string;
  endDate: string;
  sessionsConducted: number;
  finalStatus: 'Completed' | 'Ended Early' | 'Cancelled';
  outcomeSummary: string;
  testimonial?: MENTORSHIP_TESTIMONIAL;
}[] = [];

// =========================================================================
// SERVICE METHODS
// =========================================================================

export function getMentorOfferings(mentorId = 'user_mentor'): MENTORSHIP_OFFERING[] {
  if (typeof window === 'undefined') return defaultMentorshipOfferings;
  const raw = localStorage.getItem(`${STORAGE_KEYS.OFFERINGS}_${mentorId}`);
  if (!raw) {
    localStorage.setItem(`${STORAGE_KEYS.OFFERINGS}_${mentorId}`, JSON.stringify(defaultMentorshipOfferings));
    return defaultMentorshipOfferings;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultMentorshipOfferings;
  }
}

export function saveMentorOfferings(offerings: MENTORSHIP_OFFERING[], mentorId = 'user_mentor'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEYS.OFFERINGS}_${mentorId}`, JSON.stringify(offerings));
  window.dispatchEvent(new CustomEvent('xentro-mentorship-offerings-changed', { detail: { offerings } }));
}

export function getMentorshipRequests(): MENTORSHIP_REQUEST[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r.id !== 'mreq_1' && r.id !== 'mreq_2');
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function submitMentorshipRequest(
  newReq: Omit<MENTORSHIP_REQUEST, 'id' | 'requestDate' | 'status'>
): MENTORSHIP_REQUEST {
  const current = getMentorshipRequests();
  const created: MENTORSHIP_REQUEST = {
    ...newReq,
    id: `mreq_${Date.now()}`,
    requestDate: 'Just now',
    status: 'REQUESTED',
  };
  const updated = [created, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-requests-changed', { detail: { requests: updated } }));
  }
  return created;
}

export function acceptMentorshipRequest(requestId: string): MENTORSHIP_REQUEST | null {
  const current = getMentorshipRequests();
  let updatedReq: MENTORSHIP_REQUEST | null = null;
  const updated = current.map((r) => {
    if (r.id === requestId) {
      // Transition lifecycle: ACCEPTED -> AWAITING_PAYMENT
      updatedReq = { ...r, status: 'AWAITING_PAYMENT' as const };
      return updatedReq;
    }
    return r;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-requests-changed', { detail: { requests: updated } }));
  }
  return updatedReq;
}

export function declineMentorshipRequest(requestId: string, reason?: string): void {
  const current = getMentorshipRequests();
  const updated = current.map((r) => {
    if (r.id === requestId) {
      return { ...r, status: 'DECLINED' as const, rejectionReason: reason };
    }
    return r;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-requests-changed', { detail: { requests: updated } }));
  }
}

export function getActiveMentorships(): MENTORSHIP[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((m) => m.id !== 'ment_kinetix' && m.id !== 'ment_synthlabs');
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function getMentorshipById(id: string): MENTORSHIP | undefined {
  const all = getActiveMentorships();
  return all.find((m) => m.id === id);
}

export function confirmPaymentAndActivate(
  requestId: string,
  paymentDetails: { transactionId: string; amount: number; paymentMethod: string }
): MENTORSHIP | null {
  const requests = getMentorshipRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  // 1. Mark request as PAYMENT_CONFIRMED & archive from pending
  const updatedRequests = requests.map((r) =>
    r.id === requestId ? { ...r, status: 'PAYMENT_CONFIRMED' as const } : r
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updatedRequests));
  }

  // 2. Calculate duration dates
  const now = new Date();
  const months = req.selectedDuration === '1 Month' ? 1 : req.selectedDuration === '3 Months' ? 3 : 6;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);

  // 3. Create active MENTORSHIP object
  const newActive: MENTORSHIP = {
    id: `ment_${Date.now()}`,
    mentorId: req.mentorId,
    mentorName: req.mentorName,
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    startupId: req.startup.id,
    startupName: req.startup.name,
    startupStage: req.startup.stage,
    startupSector: req.startup.industry,
    startupLogo: req.startup.logo,
    founder: {
      id: req.founder.id,
      name: req.founder.name,
      avatar: req.founder.avatar,
      email: req.founder.email,
      title: req.founder.title,
    },
    offeringId: `off_${req.selectedDuration.toLowerCase().replace(' ', '')}`,
    duration: req.selectedDuration,
    packageTitle: req.selectedPackage,
    price: req.price,
    currency: req.currency,
    status: 'ACTIVE',
    startDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    endDate: endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeRemaining: `${months * 30} Days Remaining`,
    lastInteraction: 'Just activated',
    paymentStatus: 'PAID',
    mentorshipFocus: req.mentorshipAreasRequired,
    expectedOutcomes: [req.expectedOutcomes],
    goals: [
      {
        id: `g_${Date.now()}_1`,
        title: 'Initial roadmap alignment & first strategic review',
        status: 'In Progress',
        targetDate: 'Next 7 days',
      },
    ],
    currentFocus: `Initial onboarding & deep-dive into ${req.currentChallenges}`,
    progressUpdates: [],
    mentorNotes: [req.additionalMessage ? `Founder note: "${req.additionalMessage}"` : 'Active engagement initiated.'],
    timeline: [
      {
        id: `tl_${Date.now()}`,
        title: 'Mentorship Activated',
        category: 'System',
        timestamp: 'Just now',
        description: `Payment confirmed (${req.currency} ${req.price.toLocaleString('en-IN')}). Dedicated Mentorship Workspace created.`,
      },
    ],
    sharedResources: [],
    meetings: [],
  };

  const actives = getActiveMentorships();
  const updatedActives = [newActive, ...actives];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updatedActives));
  }

  // 4. Record transaction in billing
  recordMentorshipTransaction({
    id: `tx_${Date.now()}`,
    mentorshipId: newActive.id,
    transactionId: paymentDetails.transactionId,
    startupId: req.startup.id,
    startupName: req.startup.name,
    founderName: req.founder.name,
    mentorId: req.mentorId,
    mentorName: req.mentorName,
    mentorshipPackage: req.selectedPackage,
    duration: req.selectedDuration,
    grossAmount: req.price,
    xentroCommission: Math.round(req.price * 0.1),
    netMentorAmount: Math.round(req.price * 0.9),
    currency: req.currency,
    paymentStatus: 'Completed',
    date: 'Today',
    paymentMethod: paymentDetails.paymentMethod,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }

  return newActive;
}

export function activateWithEntitlement(requestId: string): MENTORSHIP | null {
  const requests = getMentorshipRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const now = new Date();
  const months = req.selectedDuration === '1 Month' ? 1 : req.selectedDuration === '3 Months' ? 3 : 6;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);

  const newActive: MENTORSHIP = {
    id: `ment_${Date.now()}`,
    mentorId: req.mentorId,
    mentorName: req.mentorName,
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    startupId: req.startup.id,
    startupName: req.startup.name,
    startupStage: req.startup.stage,
    startupSector: req.startup.industry,
    startupLogo: req.startup.logo,
    founder: {
      id: req.founder.id,
      name: req.founder.name,
      avatar: req.founder.avatar,
      email: req.founder.email,
      title: req.founder.title,
    },
    offeringId: `off_${req.selectedDuration.toLowerCase().replace(' ', '')}`,
    duration: req.selectedDuration,
    packageTitle: `${req.selectedPackage} (Ecosystem Grant Entitlement)`,
    price: 0,
    currency: req.currency,
    status: 'ACTIVE',
    startDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    endDate: endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeRemaining: `${months * 30} Days Remaining`,
    lastInteraction: 'Just activated via Entitlement',
    paymentStatus: 'COMPLIMENTARY_ENTITLEMENT',
    mentorshipFocus: req.mentorshipAreasRequired,
    expectedOutcomes: [req.expectedOutcomes],
    goals: [
      {
        id: `g_${Date.now()}`,
        title: 'Cohort onboarding & initial strategic review',
        status: 'In Progress',
        targetDate: 'Next 7 days',
      },
    ],
    currentFocus: `Incubator grant onboarding & sprint execution for ${req.startup.name}`,
    progressUpdates: [],
    mentorNotes: ['Activated under verified institutional partner entitlement.'],
    timeline: [
      {
        id: `tl_${Date.now()}`,
        title: 'Activated via Institutional Entitlement',
        category: 'System',
        timestamp: 'Just now',
        description: 'No payment required. Activated under accredited incubator mentorship entitlement grant.',
      },
    ],
    sharedResources: [],
    meetings: [],
  };

  const actives = getActiveMentorships();
  const updatedActives = [newActive, ...actives];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updatedActives));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
  return newActive;
}

export function addMentorshipGoal(mentorshipId: string, title: string, targetDate?: string): void {
  const actives = getActiveMentorships();
  const updated = actives.map((m) => {
    if (m.id === mentorshipId) {
      const newGoal: MENTORSHIP_GOAL = {
        id: `g_${Date.now()}`,
        title,
        status: 'Pending',
        targetDate,
      };
      return { ...m, goals: [...m.goals, newGoal] };
    }
    return m;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function toggleMentorshipGoal(mentorshipId: string, goalId: string): void {
  const actives = getActiveMentorships();
  const updated = actives.map((m) => {
    if (m.id === mentorshipId) {
      const updatedGoals = m.goals.map((g) => {
        if (g.id === goalId) {
          const nextStatus = g.status === 'Completed' ? 'Pending' : 'Completed';
          return {
            ...g,
            status: nextStatus as 'Pending' | 'Completed',
            completedAt: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return g;
      });
      return { ...m, goals: updatedGoals };
    }
    return m;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function addProgressUpdate(
  mentorshipId: string,
  update: { title: string; summary: string; metrics?: string; author: string; role: 'Founder' | 'Mentor' }
): void {
  const actives = getActiveMentorships();
  const updated = actives.map((m) => {
    if (m.id === mentorshipId) {
      const newUpdate: MENTORSHIP_PROGRESS_UPDATE = {
        id: `up_${Date.now()}`,
        ...update,
        timestamp: 'Today',
      };
      const newTimeline: MENTORSHIP_TIMELINE_EVENT = {
        id: `tl_${Date.now()}`,
        title: `Progress Update: ${update.title}`,
        category: 'Milestone',
        timestamp: 'Today',
        description: update.summary,
      };
      return {
        ...m,
        progressUpdates: [newUpdate, ...m.progressUpdates],
        timeline: [newTimeline, ...m.timeline],
      };
    }
    return m;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function addSharedResource(
  mentorshipId: string,
  resource: { title: string; type: 'document' | 'link' | 'file' | 'spreadsheet'; url: string; size?: string; uploadedBy: string }
): void {
  const actives = getActiveMentorships();
  const updated = actives.map((m) => {
    if (m.id === mentorshipId) {
      const newRes: MENTORSHIP_SHARED_RESOURCE = {
        id: `res_${Date.now()}`,
        ...resource,
        uploadedAt: 'Today',
      };
      const newTimeline: MENTORSHIP_TIMELINE_EVENT = {
        id: `tl_${Date.now()}`,
        title: `Resource Shared: ${resource.title}`,
        category: 'Resource',
        timestamp: 'Today',
        description: `Uploaded by ${resource.uploadedBy}`,
      };
      return {
        ...m,
        sharedResources: [newRes, ...m.sharedResources],
        timeline: [newTimeline, ...m.timeline],
      };
    }
    return m;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function scheduleMentorshipMeeting(mentorshipId: string, meeting: MentorMeeting): void {
  const actives = getActiveMentorships();
  const updated = actives.map((m) => {
    if (m.id === mentorshipId) {
      const newTimeline: MENTORSHIP_TIMELINE_EVENT = {
        id: `tl_${Date.now()}`,
        title: `Meeting Scheduled: ${meeting.title}`,
        category: 'Meeting',
        timestamp: 'Today',
        description: `${meeting.date} at ${meeting.time} via ${meeting.mode}`,
      };
      return {
        ...m,
        nextMeeting: `${meeting.date} · ${meeting.time}`,
        meetings: [meeting, ...m.meetings],
        timeline: [newTimeline, ...m.timeline],
      };
    }
    return m;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function completeMentorship(mentorshipId: string, outcomeSummary: string): void {
  const actives = getActiveMentorships();
  const target = actives.find((m) => m.id === mentorshipId);
  if (!target) return;

  const remaining = actives.filter((m) => m.id !== mentorshipId);
  const historyItem = {
    id: target.id,
    startupName: target.startupName,
    founderName: target.founder.name,
    founderAvatar: target.founder.avatar,
    packageTitle: target.packageTitle,
    duration: target.duration,
    startDate: target.startDate,
    endDate: 'Today',
    sessionsConducted: target.meetings.length || 6,
    finalStatus: 'Completed' as const,
    outcomeSummary: outcomeSummary || 'Successfully completed full mentorship engagement curriculum.',
  };

  const currentHistory = getMentorshipHistory();
  const updatedHistory = [historyItem, ...currentHistory];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(remaining));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function endMentorshipEarly(mentorshipId: string, reason: string): void {
  const actives = getActiveMentorships();
  const target = actives.find((m) => m.id === mentorshipId);
  if (!target) return;

  const remaining = actives.filter((m) => m.id !== mentorshipId);
  const historyItem = {
    id: target.id,
    startupName: target.startupName,
    founderName: target.founder.name,
    founderAvatar: target.founder.avatar,
    packageTitle: target.packageTitle,
    duration: target.duration,
    startDate: target.startDate,
    endDate: 'Today',
    sessionsConducted: target.meetings.length,
    finalStatus: 'Ended Early' as const,
    outcomeSummary: `Engagement concluded early: ${reason}`,
  };

  const currentHistory = getMentorshipHistory();
  const updatedHistory = [historyItem, ...currentHistory];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, JSON.stringify(remaining));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function getMentorshipHistory(): typeof initialMentorshipHistory {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('past_'))) {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function submitFounderTestimonial(
  historyId: string,
  testimonial: Omit<MENTORSHIP_TESTIMONIAL, 'id' | 'submittedAt' | 'isPubliclyDisplayed'>
): void {
  const history = getMentorshipHistory();
  const updated = history.map((item) => {
    if (item.id === historyId) {
      const newTestimonial: MENTORSHIP_TESTIMONIAL = {
        ...testimonial,
        id: `test_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        isPubliclyDisplayed: true,
      };
      return { ...item, testimonial: newTestimonial };
    }
    return item;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function toggleTestimonialDisplay(historyId: string, isDisplayed: boolean): void {
  const history = getMentorshipHistory();
  const updated = history.map((item) => {
    if (item.id === historyId && item.testimonial) {
      return {
        ...item,
        testimonial: { ...item.testimonial, isPubliclyDisplayed: isDisplayed },
      };
    }
    return item;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-changed'));
  }
}

export function getMentorshipTransactions(): MENTORSHIP_TRANSACTION[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('tx_m_'))) {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function recordMentorshipTransaction(tx: MENTORSHIP_TRANSACTION): void {
  const current = getMentorshipTransactions();
  const updated = [tx, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-mentorship-transactions-changed', { detail: { transactions: updated } }));
  }
}

export function getMentorEarnings(mentorId = 'user_mentor') {
  const transactions = getMentorshipTransactions().filter((t) => t.mentorId === mentorId);
  const settled = transactions
    .filter((t) => t.paymentStatus === 'Completed')
    .reduce((acc, t) => acc + t.netMentorAmount, 0);
  const pending = transactions
    .filter((t) => t.paymentStatus === 'Pending')
    .reduce((acc, t) => acc + t.netMentorAmount, 0);

  return {
    totalGross: transactions.reduce((acc, t) => acc + t.grossAmount, 0),
    totalCommission: transactions.reduce((acc, t) => acc + t.xentroCommission, 0),
    totalNet: settled + pending,
    settledEarnings: settled,
    pendingEarnings: pending,
    currentMonthEarnings: Math.round(settled * 0.4),
    transactions,
  };
}
