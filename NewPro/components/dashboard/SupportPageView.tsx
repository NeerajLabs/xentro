'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  PlusCircle,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Rocket,
  User,
  Compass,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

interface SupportPageViewProps {
  onBackToFeed?: () => void;
  initialTab?: 'help' | 'tickets' | 'submit';
}

export interface SupportTicket {
  id: string;
  accountId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  userFacingStatus: 'Complaint sent' | 'Under investigation' | 'Resolved';
  stage: 1 | 2 | 3;
  resolutionComment?: string;
  adminReplies?: Array<{
    id: string;
    author: string;
    authorName: string;
    message: string;
    createdAt: string;
  }>;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  category: 'Account Setup' | 'Profiles & Personas' | 'Connections & Network' | 'Real-time Messaging' | 'Startup Listings' | 'Verification & KYC';
  question: string;
  answer: string;
  bullets?: string[];
  linkText?: string;
  linkHref?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Account Setup',
    question: 'How do I switch between Founder, Investor, Mentor, and ESP persona roles?',
    answer: 'Xentro allows you to operate multiple personas under a single verified account. You can switch roles seamlessly using the role selector in the top navigation bar or from your account profile. Your navigation, dashboard feeds, and feature permissions dynamically adjust to match your active persona.',
    bullets: [
      'Switch active persona anytime without logging out',
      'Each persona preserves customized workspace settings',
      'Entity ownership remains linked to your primary account ID'
    ],
    linkText: 'Manage Account & Roles',
    linkHref: '/profile'
  },
  {
    id: 'faq-2',
    category: 'Account Setup',
    question: 'How does passwordless OTP authentication protect my account?',
    answer: 'Xentro provides passwordless access via cryptographically generated 6-digit one-time passcodes (OTP) sent directly to your registered email address. This eliminates the vulnerability of shared or compromised passwords while issuing signed JWT tokens stored securely.',
    bullets: [
      'Fast 6-digit verification code sent to your inbox',
      '10-minute validity with single-use revocation',
      'Zero plain-text password risk'
    ],
    linkText: 'Sign-In Security Settings',
    linkHref: '/signin'
  },
  {
    id: 'faq-3',
    category: 'Profiles & Personas',
    question: 'How do I complete my founder or entity profile to attract investors?',
    answer: 'To maximize deal room engagement and directory visibility, navigate to your Profile page and complete all sections: your one-sentence thesis, traction metrics, pitch deck teaser, industry verticals, and verified social handles.',
    bullets: [
      'Add key sectors, stage, traction milestones, and team members',
      'Link PDF pitch decks and data room links',
      'Verified profiles receive up to 4x higher investor inquiries'
    ],
    linkText: 'Edit Your Profile',
    linkHref: '/profile'
  },
  {
    id: 'faq-4',
    category: 'Profiles & Personas',
    question: 'Can I manage multiple startup ventures or workspaces under one account?',
    answer: 'Yes. Founders and executives can create and switch between multiple startup entities and institutional workspaces. Use the workspace selector in the top header to manage team permissions and isolate diligence documents.',
    bullets: [
      'Multiple venture entities per master account',
      'Role-based permissions for co-founders and advisors',
      'Isolated financial metrics and diligence vaults'
    ]
  },
  {
    id: 'faq-5',
    category: 'Connections & Network',
    question: 'How do ecosystem connection requests and deal room invites work?',
    answer: 'You can discover founders, accredited angel investors, and mentors across the ecosystem directory. Clicking "Connect" sends a formal connection request. Once accepted by the recipient, direct messaging and shared deal rooms are immediately unlocked.',
    bullets: [
      'Send tailored introductory notes with your request',
      'Track pending and accepted invitations in real time',
      'Mutual connections can introduce you to angel syndicates'
    ],
    linkText: 'Explore Ecosystem Network',
    linkHref: '/'
  },
  {
    id: 'faq-6',
    category: 'Connections & Network',
    question: 'How do I partner with Ecosystem Service Providers (ESPs) and Incubators?',
    answer: 'Accredited Incubators and ESPs provide cohort funding, infrastructure grants, and structured mentorship. Explore partner listings in the directory and apply directly using your verified startup profile.',
    bullets: [
      'Apply to active cohort deadlines with one click',
      'Receive institutional validation and mentor hours',
      'ESP endorsements improve investor diligence scores'
    ]
  },
  {
    id: 'faq-7',
    category: 'Real-time Messaging',
    question: 'How does real-time chat and document sharing operate on Xentro?',
    answer: 'Xentro provides encrypted real-time communication between connected members. You can discuss deal terms, arrange advisory meetings, and send PDF pitch decks with instant delivery confirmation and typing indicators.',
    bullets: [
      'Live message delivery with read receipts',
      'Secure PDF and media attachment previews',
      'In-line deal room access directly from chat'
    ],
    linkText: 'Open Messages',
    linkHref: '/?tab=messages'
  },
  {
    id: 'faq-8',
    category: 'Real-time Messaging',
    question: 'Who can view pitch decks and documents shared in conversations?',
    answer: 'Only counterparties in the active direct message or verified diligence room can access shared files. You retain granular control and can revoke access to uploaded PDFs or update revisions at any time.',
    bullets: [
      'Watermarked previews for sensitive documents',
      'Bilateral NDA protection for diligence items',
      'Audit logs of document views and downloads'
    ]
  },
  {
    id: 'faq-9',
    category: 'Startup Listings',
    question: 'How do I list my startup to receive investor inquiries and applications?',
    answer: 'Navigate to Ventures in your sidebar and select "Register Startup". Fill in your venture details, funding stage (Pre-seed, Seed, Series A), target raise, traction MRR, and upload your teaser deck.',
    bullets: [
      'Standardized deal card format favored by institutional VCs',
      'Option to list in public directory or stealth syndicate mode',
      'Real-time analytics on investor page views and bookmarks'
    ],
    linkText: 'Go to Ventures',
    linkHref: '/'
  },
  {
    id: 'faq-10',
    category: 'Startup Listings',
    question: 'How do I protect confidential pitch metrics from competitors?',
    answer: 'Xentro provides tiered visibility. High-level summaries are visible across the ecosystem, while detailed metrics, cap tables, and data rooms require an explicit Diligence Access Request approved by you.',
    bullets: [
      'Tiered public vs. confidential data gating',
      'Investor accreditation check prior to data room unlocks',
      'Instant revoke capability for active shares'
    ]
  },
  {
    id: 'faq-11',
    category: 'Verification & KYC',
    question: 'What is the Verification process and how do I earn the Verified badge?',
    answer: 'Verification confirms your authentic founder, investor, or institutional identity. Submit government ID (such as Aadhaar or passport) through our secure portal. Our compliance desk audits submissions within 2 hours.',
    bullets: [
      'Govt ID and institutional affiliation verification',
      'Encrypted document storage with zero data sharing',
      'Unlocks the official green Verified badge on all posts'
    ],
    linkText: 'Start Identity Verification',
    linkHref: '/onboarding/verify'
  },
  {
    id: 'faq-12',
    category: 'Verification & KYC',
    question: 'What should I do if my identity verification is pending or rejected?',
    answer: 'Ensure your uploaded document photo is sharp, uncropped, and that the name matches your Xentro account profile. If you experience an unexpected delay or error, raise a support ticket below for immediate compliance desk assistance.',
    bullets: [
      'Clear photo with visible borders and government seal',
      'Name match across account and legal document',
      'Direct support escalation via the form below'
    ],
    linkText: 'Check Verification Status',
    linkHref: '/onboarding/verify'
  }
];

const CATEGORIES = [
  'All',
  'Account Setup',
  'Profiles & Personas',
  'Connections & Network',
  'Real-time Messaging',
  'Startup Listings',
  'Verification & KYC'
] as const;

function getActiveSessionIdentity(): { id: string; name: string; email: string; role: string } {
  if (typeof window === 'undefined') return { id: '', name: 'Ecosystem Member', email: '', role: 'Explorer' };
  try {
    const curUser = JSON.parse(localStorage.getItem('xentro_current_user') || 'null') ||
                    JSON.parse(localStorage.getItem('xentro_auth_user') || 'null');
    if (curUser && (curUser.id || curUser.userId)) {
      return {
        id: curUser.id || curUser.userId,
        name: curUser.fullName || curUser.name || 'Ecosystem Member',
        email: curUser.email || '',
        role: curUser.role || curUser.accountType || 'Explorer'
      };
    }

    const personal = JSON.parse(localStorage.getItem('xentro_personal_profile') || 'null');
    const profile = getUserProfile();
    const storedId = localStorage.getItem('xentro_user_id') || profile?.id || '';
    const resolvedName = (personal && personal.fullName) || profile?.name || 'Ecosystem Member';
    const resolvedEmail = (personal && personal.email) || profile?.email || '';

    return {
      id: storedId,
      name: resolvedName,
      email: resolvedEmail,
      role: profile?.role || 'Explorer'
    };
  } catch {
    return { id: '', name: 'Ecosystem Member', email: '', role: 'Explorer' };
  }
}

export const SupportPageView: React.FC<SupportPageViewProps> = ({
  onBackToFeed,
  initialTab = 'help'
}) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'help' | 'tickets' | 'submit'>(initialTab);
  const [sessionUser, setSessionUser] = useState(getActiveSessionIdentity());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqMap, setExpandedFaqMap] = useState<Record<string, boolean>>({ 'faq-1': true });
  const [isFeaturedExpanded, setIsFeaturedExpanded] = useState(false);

  // Ticket Submission Form State
  const [category, setCategory] = useState('Platform Issue');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Ticket History State
  const [history, setHistory] = useState<SupportTicket[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const identity = getActiveSessionIdentity();
    setSessionUser(identity);
    fetchHistory(identity.id);
  }, []);

  const fetchHistory = async (explicitUserId?: string) => {
    try {
      setIsLoadingHistory(true);
      const identity = explicitUserId ? { ...sessionUser, id: explicitUserId } : getActiveSessionIdentity();
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('xentro_access_token') : null;

      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      if (identity.id) headers['X-User-Id'] = identity.id;
      if (identity.email) headers['X-User-Email'] = identity.email;
      if (identity.name) headers['X-User-Name'] = identity.name;

      const params = new URLSearchParams();
      if (identity.id) params.set('accountId', identity.id);
      if (identity.email) params.set('email', identity.email);

      const res = await fetch(`/api/support/complaints?${params.toString()}`, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        const tickets: SupportTicket[] = data?.data?.tickets || [];
        setHistory(tickets);
      }
    } catch (e) {
      console.warn('Failed to fetch support history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopyTicketId = (id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      showToast(`Ticket ID #${id} copied to clipboard`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please provide both a subject and details for your complaint/request.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const identity = getActiveSessionIdentity();
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('xentro_access_token') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      if (identity.id) headers['X-User-Id'] = identity.id;
      if (identity.email) headers['X-User-Email'] = identity.email;
      if (identity.name) headers['X-User-Name'] = identity.name;

      const payload = {
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        userId: identity.id,
        accountId: identity.id,
        userEmail: identity.email,
        userName: identity.name,
      };

      const res = await fetch('/api/support/complaints', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const ticket: SupportTicket = data?.data?.ticket;
        setSubmittedTicket(ticket);
        showToast('Complaint ticket registered successfully in MongoDB!', 'success');
        setSubject('');
        setMessage('');
        fetchHistory(identity.id);
      } else {
        showToast(data?.message || 'Failed to submit the request.', 'error');
      }
    } catch {
      showToast('Network error while filing complaint. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answer.toLowerCase().includes(q);
      const matchB = item.bullets?.some((b) => b.toLowerCase().includes(q));
      return matchQ || matchA || Boolean(matchB);
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6 max-w-[1040px] mx-auto animate-fade-slide">
      {/* 1. Header & Filter Bar (Matching Opportunities Page layout & visual hierarchy) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] text-xs font-semibold mb-1.5 border border-[#D9FF3F]/30">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Ecosystem Support &amp; Complaints Engine</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-sora">
              Help Center &amp; Support Inquiries
            </h1>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Search platform guides, interactive FAQs, or lodge formal support requests with live 3-stage tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveSubTab('submit'); setSubmittedTicket(null); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Raise a Request</span>
            </button>
          </div>
        </div>

        {/* Category Pills Strip & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* View Sub-Tabs */}
            <button
              onClick={() => { setActiveSubTab('help'); setSelectedCategory('All'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'help' && selectedCategory === 'All'
                  ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-xs'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              Help Center ({FAQ_DATA.length})
            </button>

            <button
              onClick={() => setActiveSubTab('tickets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'tickets'
                  ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-xs'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              My Tickets ({history.length})
            </button>

            <button
              onClick={() => { setActiveSubTab('submit'); setSubmittedTicket(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'submit'
                  ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-xs'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              Raise a Request
            </button>

            {/* Quick Category Filters when on Help Center */}
            {activeSubTab === 'help' && (
              <>
                <div className="h-4 w-px bg-gray-200 dark:bg-[#2E3331] mx-1 shrink-0" />
                {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white dark:bg-[#D9FF3F] dark:text-[#101212] font-bold shadow-xs'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs, topics..."
              className="w-full h-8.5 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 2. Authenticated Session Identity Strip */}
      <div className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#565B59] dark:text-[#A0A4A2]">Verified Account:</span>
          <span className="font-semibold text-[#101212] dark:text-white">{sessionUser.name}</span>
          <span className="font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[11px] text-emerald-800 dark:text-[#D9FF3F] font-bold border border-[#E5E7EB] dark:border-[#2E3331]">
            ID: {sessionUser.id || 'Active Session'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] uppercase font-mono">
            Active Persona: <strong className="text-[#101212] dark:text-white">{sessionUser.role}</strong>
          </span>
          {onBackToFeed && (
            <button
              onClick={onBackToFeed}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-[#D9FF3F] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. SUB-TAB 1: HELP CENTER */}
      {activeSubTab === 'help' && (
        <div className="space-y-6">
          {/* Featured Guide Card (Layout matching Opportunity Card in screenshot) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4 hover:border-[#D9FF3F]/40 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] text-xs font-semibold border border-[#D9FF3F]/30 uppercase font-mono">
                FEATURED GUIDE
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20">
                Accreditation Guide
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-sora">
                Founder &amp; Venture Accreditation on Xentro
              </h2>
              <span className="text-xs text-emerald-800 dark:text-[#D9FF3F] font-semibold block mt-0.5">
                Xentro Trust &amp; Compliance Desk
              </span>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-3xl">
              Learn how to publish your venture listing, submit KYC documents for identity accreditation, configure confidential data room access, and connect with accredited investors.
            </p>

            {/* Metadata badges matching Opportunity Card in screenshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block uppercase font-mono">MODE &amp; SCOPE</span>
                <span className="text-xs font-semibold text-[#101212] dark:text-white">Full Ecosystem</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block uppercase font-mono">AUDIT SLA</span>
                <span className="text-xs font-semibold text-[#101212] dark:text-white">&lt; 2 Hours</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block uppercase font-mono">STEPS</span>
                <span className="text-xs font-semibold text-[#101212] dark:text-white">4 Milestones</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block uppercase font-mono">BADGE</span>
                <span className="text-xs font-semibold text-emerald-800 dark:text-[#D9FF3F]">Verified Founder</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setIsFeaturedExpanded(!isFeaturedExpanded)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <span>{isFeaturedExpanded ? 'Collapse Workflow' : 'View Step-by-Step Milestones'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFeaturedExpanded ? 'rotate-180' : ''}`} />
              </button>

              <Link
                href="/onboarding/verify"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <span>Open Verification Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isFeaturedExpanded && (
              <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29]">
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-[#D9FF3F] font-bold block mb-1">STEP 1</span>
                  <h4 className="font-bold text-[#101212] dark:text-white mb-1">Profile Setup</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">Complete founder thesis, bio, and LinkedIn handles.</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29]">
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-[#D9FF3F] font-bold block mb-1">STEP 2</span>
                  <h4 className="font-bold text-[#101212] dark:text-white mb-1">KYC Verification</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">Upload Govt ID for zero-leakage compliance review.</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29]">
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-[#D9FF3F] font-bold block mb-1">STEP 3</span>
                  <h4 className="font-bold text-[#101212] dark:text-white mb-1">Venture Listing</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">Publish traction MRR, funding stage, and pitch deck.</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29]">
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-[#D9FF3F] font-bold block mb-1">STEP 4</span>
                  <h4 className="font-bold text-[#101212] dark:text-white mb-1">Deal Flow</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">Send invitations to angel syndicates &amp; ESP cohorts.</p>
                </div>
              </div>
            )}
          </div>

          {/* FAQs Grid (Exact 2-column Opportunity Grid layout from screenshot) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#A0A4A2]">
                Platform Knowledge &amp; Frequently Asked Questions ({filteredFaqs.length})
              </h3>
              {searchQuery && (
                <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                  Filtered by: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
                <FileText className="w-8 h-8 mx-auto text-[#8E9290]/50" />
                <p className="text-sm font-bold text-[#101212] dark:text-white">
                  No matching articles found
                </p>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-sm mx-auto">
                  We couldn&apos;t find an answer for &ldquo;{searchQuery}&rdquo;. Raise a formal support request and our team will answer directly.
                </p>
                <button
                  onClick={() => { setActiveSubTab('submit'); setSubject(`Inquiry regarding: ${searchQuery}`); }}
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Raise a Request for this topic</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-slide">
                {filteredFaqs.map((faq) => {
                  const isExpanded = Boolean(expandedFaqMap[faq.id]);
                  return (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2]">
                            {faq.category}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#D9FF3F] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#101212] dark:text-white font-sora leading-snug">
                          {faq.question}
                        </h4>

                        <p className={`text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {faq.answer}
                        </p>

                        {isExpanded && faq.bullets && faq.bullets.length > 0 && (
                          <ul className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-[#202422]">
                            {faq.bullets.map((b, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                                <Check className="w-3 h-3 text-emerald-600 dark:text-[#D9FF3F] shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="pt-4 mt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2">
                        {faq.linkHref && faq.linkText ? (
                          <Link
                            href={faq.linkHref}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-[#D9FF3F] hover:underline"
                          >
                            <span>{faq.linkText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#8E9290]">Official Documentation</span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[11px] font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Read Full'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear "Raise a request" Action Card below Help Content */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-800 dark:text-[#D9FF3F]" />
                <h3 className="text-sm font-bold text-[#101212] dark:text-white font-sora">
                  Still have unresolved questions or facing an issue?
                </h3>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-xl">
                Our compliance and support operations desk is available 24/7. Lodge a formal ticket to track investigation and resolution across all 3 stages: Complaint sent, Under investigation, and Resolved.
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setActiveSubTab('submit'); setSubmittedTicket(null); }}
              className="px-5 py-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Raise a Request</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 2: MY TICKETS (3-STAGE LIFECYCLE & ADMIN REPLIES) */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="text-[#565B59] dark:text-[#A0A4A2]">
              Your persistent support tickets in MongoDB Atlas ({history.length}):
            </span>
            <button
              onClick={() => fetchHistory()}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-[#D9FF3F] hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8E9290] space-y-3 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-subtle">
              <FileText className="w-10 h-10 mx-auto text-[#8E9290]/40" />
              <p className="font-bold text-sm text-[#101212] dark:text-white">No tickets filed yet</p>
              <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-sm mx-auto">
                Any support complaints or platform inquiries you submit will appear here with live admin replies and stage updates.
              </p>
              <button
                onClick={() => setActiveSubTab('submit')}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise your first request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4 hover:border-[#D9FF3F]/40 transition-colors"
                >
                  {/* Ticket Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                          #{t.id}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#101212] dark:text-white font-sora">
                          {t.subject}
                        </h3>
                        <button
                          onClick={() => handleCopyTicketId(t.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                          title="Copy Ticket ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                        <span>Category: <strong>{t.category}</strong></span>
                        <span>&bull;</span>
                        <span>Priority: <strong>{t.priority}</strong></span>
                        <span>&bull;</span>
                        <span>Submitted: {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        t.stage === 3
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30'
                          : t.stage === 2
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.userFacingStatus || 'Complaint sent'}
                      </span>
                    </div>
                  </div>

                  {/* 3 User-Facing Stages Stepper */}
                  <div className="py-1">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* Stage 1 */}
                      <div className={`p-2.5 rounded-xl border text-center transition-all ${
                        t.stage >= 1
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                          : 'bg-gray-50 dark:bg-[#202422] border-transparent text-gray-400'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {t.stage > 1 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                          )}
                          <span className="text-xs font-bold">Complaint sent</span>
                        </div>
                        <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stage 2 */}
                      <div className={`p-2.5 rounded-xl border text-center transition-all ${
                        t.stage >= 2
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {t.stage > 2 ? (
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          ) : t.stage === 2 ? (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">2</span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">2</span>
                          )}
                          <span className="text-xs font-bold">Under investigation</span>
                        </div>
                        <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2]">
                          {t.stage >= 2 ? 'In Review' : 'Queued'}
                        </span>
                      </div>

                      {/* Stage 3 */}
                      <div className={`p-2.5 rounded-xl border text-center transition-all ${
                        t.stage === 3
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                          : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                      }`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {t.stage === 3 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">3</span>
                          )}
                          <span className="text-xs font-bold">Resolved</span>
                        </div>
                        <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2]">
                          {t.stage === 3 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grievance Message */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs text-[#565B59] dark:text-[#C3C6C4] leading-relaxed whitespace-pre-wrap">
                    {t.message}
                  </div>

                  {/* Official Admin Replies Thread */}
                  {t.adminReplies && t.adminReplies.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-[#262A29]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-[#D9FF3F] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Official Support Replies ({t.adminReplies.length}):</span>
                      </span>
                      <div className="space-y-2">
                        {t.adminReplies.map((r, rIdx) => (
                          <div
                            key={r.id || rIdx}
                            className="p-4 rounded-xl bg-emerald-500/5 dark:bg-[#202422] border border-emerald-500/20 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] text-[#565B59] dark:text-[#A0A4A2]">
                              <span className="font-bold text-emerald-800 dark:text-[#D9FF3F]">
                                {r.authorName || 'Support Specialist'}
                              </span>
                              <span>{new Date(r.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-[#101212] dark:text-white leading-relaxed">
                              {r.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Summary Comment */}
                  {t.resolutionComment && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                        Resolution Summary (From Operations Desk):
                      </span>
                      <p className="text-[#101212] dark:text-white text-xs leading-relaxed">{t.resolutionComment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SUB-TAB 3: RAISE A REQUEST (FULL PAGE FORM & PERSISTENCE) */}
      {activeSubTab === 'submit' && (
        <div className="space-y-4 animate-fade-in">
          {submittedTicket ? (
            /* Success View */
            <div className="py-12 px-6 space-y-6 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-subtle text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[#101212] dark:text-white font-sora">
                  Complaint Ticket Registered Successfully
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-md mx-auto">
                  Your grievance has been stored in MongoDB Atlas and associated with your verified account session.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29] mt-2 shadow-xs">
                  <span className="font-mono text-sm font-bold text-emerald-800 dark:text-[#D9FF3F]">
                    #{submittedTicket.id}
                  </span>
                  <button
                    onClick={() => handleCopyTicketId(submittedTicket.id)}
                    className="text-gray-400 hover:text-[#101212] dark:hover:text-white cursor-pointer"
                    title="Copy Ticket ID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3-Stage Progress Stepper */}
              <div className="p-5 bg-gray-50 dark:bg-[#141716] rounded-xl border border-[#E5E7EB] dark:border-[#262A29] max-w-lg mx-auto text-left space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#A0A4A2] block">
                  Current Lifecycle Stage
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/30 text-center">
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      1
                    </div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block">
                      Complaint sent
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Active</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      2
                    </div>
                    <span className="text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                      Under investigation
                    </span>
                    <span className="text-[10px] text-gray-400">Next Stage</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                      3
                    </div>
                    <span className="text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                      Resolved
                    </span>
                    <span className="text-[10px] text-gray-400">Final Stage</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => { setSubmittedTicket(null); setActiveSubTab('tickets'); }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer"
                >
                  View in My Tickets
                </button>
                <button
                  onClick={() => { setSubmittedTicket(null); setActiveSubTab('help'); }}
                  className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-colors cursor-pointer"
                >
                  Back to Help Center
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form in Full Page Container */
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 sm:p-8 shadow-subtle space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-sora">
                  Submit Support Ticket or Grievance
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                  Your ticket will be reviewed by platform operations with transparent stage tracking.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Issue / Request Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="Platform Issue">Platform Issue / Software Bug</option>
                      <option value="Account & Profile">Account Access &amp; Role Identity</option>
                      <option value="Verification & KYC">Identity Verification &amp; Accreditation</option>
                      <option value="Startup Listings">Startup Listings &amp; Pitch Decks</option>
                      <option value="Messaging & Network">Messaging &amp; Connections</option>
                      <option value="Trust & Safety">Trust &amp; Safety / Grievance</option>
                      <option value="General Support">General Ecosystem Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Severity / Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="LOW">Low (Inquiry / Non-urgent question)</option>
                      <option value="NORMAL">Normal (Standard platform assistance)</option>
                      <option value="HIGH">High (Impairs active deal or listing)</option>
                      <option value="URGENT">Urgent (Account security or violation)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Subject / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verification document pending review / Error saving startup deck"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Detailed Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Provide full details: what happened, steps to reproduce, relevant URLs or IDs, and expected resolution..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('help')}
                    className="text-xs text-[#565B59] dark:text-[#A0A4A2] hover:underline cursor-pointer"
                  >
                    &larr; Back to Help Center FAQs
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('help')}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
