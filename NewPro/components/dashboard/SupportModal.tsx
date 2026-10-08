'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HelpCircle,
  AlertCircle,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  FileText,
  LifeBuoy,
  Check,
  Copy,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldAlert,
  Compass,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'help' | 'submit' | 'history'>('help');
  const [sessionUser, setSessionUser] = useState(getActiveSessionIdentity());

  // Help Center Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
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
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const identity = getActiveSessionIdentity();
    setSessionUser(identity);
    fetchHistory(identity.id, false);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('xentro_support_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'TICKET_STATUS_UPDATED') {
            fetchHistory(undefined, true);
          }
        };
      } catch {}
    }

    const handleTicketUpdated = () => fetchHistory(undefined, true);
    const handleNotificationsUpdated = () => fetchHistory(undefined, true);
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'xentro_ticket_sync') fetchHistory(undefined, true);
    };

    window.addEventListener('xentro-ticket-updated', handleTicketUpdated);
    window.addEventListener('xentro-notifications-updated', handleNotificationsUpdated);
    window.addEventListener('storage', handleStorageSync);

    const intervalId = setInterval(() => fetchHistory(undefined, true), 4000);

    return () => {
      if (bc) {
        try { bc.close(); } catch {}
      }
      window.removeEventListener('xentro-ticket-updated', handleTicketUpdated);
      window.removeEventListener('xentro-notifications-updated', handleNotificationsUpdated);
      window.removeEventListener('storage', handleStorageSync);
      clearInterval(intervalId);
    };
  }, [isOpen]);

  const fetchHistory = async (explicitUserId?: string, silent: boolean = false) => {
    try {
      if (!silent) setIsLoadingHistory(true);
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

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text || res.statusText };
      }

      if (res.ok && (data?.success || Array.isArray(data?.data?.tickets))) {
        const tickets: SupportTicket[] = data?.data?.tickets || [];
        setHistoryError(null);
        setHistory(tickets);
      } else {
        if (!silent) {
          setHistoryError(data?.message || data?.detail || 'Failed to retrieve support tickets from database.');
        }
      }
    } catch (e: any) {
      if (!silent) {
        console.warn('Failed to fetch support history:', e);
        setHistoryError(e?.message || 'Network error while retrieving support tickets.');
      }
    } finally {
      if (!silent) setIsLoadingHistory(false);
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
      let identity = getActiveSessionIdentity();
      if (!identity.id) {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('xentro_user_id') : null;
        if (storedId) {
          identity = { ...identity, id: storedId };
        }
      }
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
        showToast(`Complaint ticket #${ticket.id} registered successfully in database!`, 'success');
        setSubject('');
        setMessage('');
        fetchHistory(identity.id, false);
      } else {
        showToast(data?.message || data?.detail || 'Failed to submit the request.', 'error');
      }
    } catch {
      showToast('Network error while filing complaint. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter FAQs based on search and category
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
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#F7F8F6] dark:bg-[#101212] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-floating overflow-hidden flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/15 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-[#D9FF3F]/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-sora">
                  Xentro Help Center & Support
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-[#D9FF3F]/10 text-emerald-900 dark:text-[#D9FF3F]">
                  v0.912 Live
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                Instant answers to platform questions, founder accreditation guides, and support tickets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Support Modal"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticated User Session Banner */}
        <div className="px-5 sm:px-6 py-2 bg-gray-100/70 dark:bg-[#141716] border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#565B59] dark:text-[#A0A4A2]">Verified Account:</span>
            <span className="font-semibold text-[#101212] dark:text-white">{sessionUser.name}</span>
            <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-[#1F2422] text-[11px] text-emerald-800 dark:text-[#D9FF3F] font-bold border border-[#E5E7EB] dark:border-[#2E3331]">
              ID: {sessionUser.id || 'Active Session'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] uppercase font-mono">
              Active Persona: <strong className="text-[#101212] dark:text-white">{sessionUser.role}</strong>
            </span>
          </div>
        </div>

        {/* Top Tab Navigation */}
        <div className="flex items-center px-5 sm:px-6 border-b border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] gap-4 sm:gap-6">
          <button
            onClick={() => { setActiveTab('help'); setSubmittedTicket(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'help'
                ? 'border-emerald-600 dark:border-[#D9FF3F] text-emerald-800 dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); fetchHistory(); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 dark:border-[#D9FF3F] text-emerald-800 dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Tickets ({history.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('submit'); setSubmittedTicket(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'submit'
                ? 'border-emerald-600 dark:border-[#D9FF3F] text-emerald-800 dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Raise a Request</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: HELP CENTER (Hotjar layout inspired, styled with Xentro dark & lime identity) */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fade-in">
              {/* Prominent Help Heading & Hero Search (Inspired by Hotjar layout) */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#181B1A] to-[#121414] text-white border border-[#262A29] relative overflow-hidden text-center space-y-4 shadow-md">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#D9FF3F]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-[11px] font-mono font-bold text-[#D9FF3F]">
                  <Sparkles className="w-3 h-3" />
                  <span>XENTRO ECOSYSTEM KNOWLEDGE BASE</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sora text-white">
                  How can we help?
                </h1>
                <p className="text-xs sm:text-sm text-[#A0A4A2] max-w-xl mx-auto leading-relaxed">
                  Search guides on account setup, role personas, real-time messaging, startup listings, and founder verification.
                </p>

                {/* Prominent Search Bar */}
                <div className="max-w-xl mx-auto relative pt-1">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#8E9290] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions (e.g. verification, pitch deck, switch roles)..."
                      className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-[#1F2422] border border-[#2E3331] text-xs sm:text-sm text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F] transition-all shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Popular Search Tags */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                  <span className="text-[#8E9290] text-[11px]">Popular topics:</span>
                  {['Verification & KYC', 'Startup Listings', 'Switch Roles', 'Messaging', 'Pitch Decks'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag === 'Switch Roles' ? 'switch' : tag === 'Pitch Decks' ? 'deck' : tag)}
                      className="px-2.5 py-1 rounded-lg bg-[#202422] hover:bg-[#2A2F2D] text-[11px] text-[#D9FF3F] border border-[#2E3331] transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white dark:bg-[#D9FF3F] dark:text-[#101212] font-bold shadow-xs'
                        : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Featured Guide Card (Layout inspiration from Hotjar featured content) */}
              {!searchQuery && selectedCategory === 'All' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] relative overflow-hidden shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-[#D9FF3F]/20 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 dark:text-[#D9FF3F]">
                            FEATURED GUIDE
                          </span>
                          <span className="text-[10px] text-[#565B59] dark:text-[#8E9290]">&bull; 3 min read</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#101212] dark:text-white font-sora">
                          Founder &amp; Venture Accreditation on Xentro
                        </h3>
                        <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed max-w-2xl">
                          Learn how to list your startup, submit identity accreditation documents for the verified badge, and connect directly with verified investors and accelerators.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsFeaturedExpanded(!isFeaturedExpanded)}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <span>{isFeaturedExpanded ? 'Collapse Guide' : 'Read Guide'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFeaturedExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isFeaturedExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] space-y-3 animate-fade-in text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
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

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                          Need immediate manual approval from our compliance team?
                        </span>
                        <Link
                          href="/onboarding/verify"
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-[#D9FF3F] hover:underline"
                        >
                          <span>Open Verification Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Categorized FAQ Cards with Expandable Accordions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#A0A4A2]">
                    Frequently Answered Questions ({filteredFaqs.length})
                  </h3>
                  {searchQuery && (
                    <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                      Filtering by: &ldquo;{searchQuery}&rdquo;
                    </span>
                  )}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
                    <FileText className="w-8 h-8 mx-auto text-[#8E9290]/50" />
                    <p className="text-sm font-bold text-[#101212] dark:text-white">
                      No matching questions found
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-sm mx-auto">
                      We couldn&apos;t find an article matching &ldquo;{searchQuery}&rdquo;. Raise a request and our operations desk will answer directly.
                    </p>
                    <button
                      onClick={() => { setActiveTab('submit'); setSubject(`Question regarding: ${searchQuery}`); }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Raise a Request for this topic</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredFaqs.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                            isExpanded
                              ? 'bg-white dark:bg-[#181B1A] border-emerald-600/50 dark:border-[#D9FF3F]/40 shadow-xs'
                              : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-gray-300 dark:hover:border-[#333836]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(faq.id)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2] shrink-0">
                                {faq.category}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white">
                                {faq.question}
                              </span>
                            </div>
                            <div className={`p-1 rounded-md text-gray-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-800 dark:text-[#D9FF3F]' : ''}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-[#202422] space-y-3 text-xs leading-relaxed animate-fade-in">
                              <p className="text-[#3E4240] dark:text-[#C3C6C4]">
                                {faq.answer}
                              </p>

                              {faq.bullets && faq.bullets.length > 0 && (
                                <ul className="space-y-1.5 pl-1">
                                  {faq.bullets.map((b, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[#565B59] dark:text-[#A0A4A2] text-[11px]">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#D9FF3F] shrink-0 mt-0.5" />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {faq.linkHref && faq.linkText && (
                                <div className="pt-1">
                                  <Link
                                    href={faq.linkHref}
                                    onClick={onClose}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-900 dark:text-[#D9FF3F] text-xs font-bold border border-emerald-200 dark:border-[#D9FF3F]/20 hover:opacity-90 transition-opacity"
                                  >
                                    <span>{faq.linkText}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clear "Raise a request" Action Below the Help Content */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-800 dark:text-[#D9FF3F]" />
                    <h3 className="text-sm font-bold text-[#101212] dark:text-white font-sora">
                      Still have questions or facing an issue?
                    </h3>
                  </div>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-lg">
                    Our compliance and support operations desk is available 24/7. Raise a formal support request and track progress through all 3 stages: Complaint sent, Under investigation, and Resolved.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setActiveTab('submit'); setSubmittedTicket(null); }}
                  className="px-5 py-3 rounded-xl bg-emerald-600 dark:bg-[#D9FF3F] hover:bg-emerald-700 dark:hover:bg-[#C7F020] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Raise a Request</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TICKET CREATION FORM / CONFIRMATION */}
          {activeTab === 'submit' && (
            <div className="space-y-4 animate-fade-in">
              {submittedTicket ? (
                /* Success View - Shown strictly AFTER the ticket is saved in MongoDB */
                <div className="py-8 px-4 space-y-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-[#101212] dark:text-white font-sora">
                      Complaint Successfully Registered
                    </h3>
                    <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-md mx-auto">
                      Your ticket has been persistently stored in MongoDB Atlas and associated with your verified account session.
                    </p>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29] mt-2 shadow-xs">
                      <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                        #{submittedTicket.id}
                      </span>
                      <button
                        onClick={() => handleCopyTicketId(submittedTicket.id)}
                        className="text-gray-400 hover:text-[#101212] dark:hover:text-white cursor-pointer"
                        title="Copy Ticket ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 3-Stage Progress Stepper */}
                  <div className="p-4 bg-white dark:bg-[#141716] rounded-xl border border-[#E5E7EB] dark:border-[#262A29] max-w-lg mx-auto text-left space-y-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#A0A4A2] block">
                      Current Ticket Lifecycle Stage
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/30 text-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          1
                        </div>
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block">
                          Complaint sent
                        </span>
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold">Active</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          2
                        </div>
                        <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                          Under investigation
                        </span>
                        <span className="text-[9px] text-gray-400">Next Stage</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          3
                        </div>
                        <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                          Resolved
                        </span>
                        <span className="text-[9px] text-gray-400">Final Stage</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setSubmittedTicket(null); setActiveTab('history'); }}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer"
                    >
                      View in My Tickets
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 dark:bg-[#D9FF3F] hover:bg-emerald-700 dark:hover:bg-[#C7F020] text-xs font-bold text-white dark:text-[#101212] transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Ticket Submission Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#101212] dark:text-white block">Filing as Verified Session</span>
                      <span className="text-[#565B59] dark:text-[#A0A4A2]">
                        {sessionUser.name} ({sessionUser.email || sessionUser.id})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#2E3331] text-emerald-800 dark:text-[#D9FF3F] font-bold">
                      {sessionUser.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                        Issue / Request Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                      >
                        <option value="Platform Issue">Platform Issue / Software Bug</option>
                        <option value="Account & Profile">Account Access & Role Identity</option>
                        <option value="Verification & KYC">Identity Verification & Accreditation</option>
                        <option value="Startup Listings">Startup Listings & Pitch Decks</option>
                        <option value="Messaging & Network">Messaging & Connections</option>
                        <option value="Trust & Safety">Trust & Safety / Grievance</option>
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Detailed Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Provide full details: what you were trying to do, error messages observed, relevant URLs or IDs, and expected outcome..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('help')}
                      className="text-xs text-[#565B59] dark:text-[#A0A4A2] hover:underline"
                    >
                      &larr; Back to Help Center FAQs
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 dark:bg-[#D9FF3F] hover:bg-emerald-700 dark:hover:bg-[#C7F020] text-white dark:text-[#101212] text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: USER TICKET HISTORY & TRACKING */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">
                  Your persistent support tickets in MongoDB Atlas:
                </span>
                <button
                  onClick={() => fetchHistory()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-[#D9FF3F] hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh Tickets</span>
                </button>
              </div>

              {historyError ? (
                <div className="py-10 px-5 text-center text-xs text-[#8E9290] space-y-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl shadow-subtle">
                  <AlertCircle className="w-9 h-9 mx-auto text-red-500" />
                  <p className="font-bold text-sm text-red-600 dark:text-red-400">Unable to Load Support Tickets</p>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-sm mx-auto">
                    {historyError}
                  </p>
                  <button
                    onClick={() => fetchHistory(undefined, false)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#2E3331] text-[#101212] dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-[#282C2A]"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-800 dark:text-[#D9FF3F]" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8E9290] space-y-3 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl">
                  <FileText className="w-9 h-9 mx-auto text-[#8E9290]/40" />
                  <p className="font-bold text-sm text-[#101212] dark:text-white">No tickets filed yet</p>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-sm mx-auto">
                    Any support complaints or platform inquiries you submit will appear here with live admin replies and stage updates.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Raise your first request</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 sm:p-5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] shadow-xs space-y-3.5"
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                              #{t.id}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white">
                              {t.subject}
                            </span>
                            <button
                              onClick={() => handleCopyTicketId(t.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                            <span>Category: {t.category}</span>
                            <span>&bull;</span>
                            <span>Priority: {t.priority}</span>
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
                        <div className="grid grid-cols-3 gap-2">
                          {/* Stage 1: Complaint sent */}
                          <div className={`p-2.5 rounded-lg border text-center transition-all ${
                            t.stage >= 1
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-transparent text-gray-400'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage > 1 ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                              )}
                              <span className="text-[10px] font-bold">Complaint sent</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Stage 2: Under investigation */}
                          <div className={`p-2.5 rounded-lg border text-center transition-all ${
                            t.stage >= 2
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage > 2 ? (
                                <Check className="w-3 h-3 text-blue-600" />
                              ) : t.stage === 2 ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">2</span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">2</span>
                              )}
                              <span className="text-[10px] font-bold">Under investigation</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {t.stage >= 2 ? 'In Review' : 'Queued'}
                            </span>
                          </div>

                          {/* Stage 3: Resolved */}
                          <div className={`p-2.5 rounded-lg border text-center transition-all ${
                            t.stage === 3
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage === 3 ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">3</span>
                              )}
                              <span className="text-[10px] font-bold">Resolved</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {t.stage === 3 ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complaint Message Details */}
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs text-[#565B59] dark:text-[#C3C6C4] leading-relaxed whitespace-pre-wrap">
                        {t.message}
                      </div>

                      {/* Official Admin Replies Thread */}
                      {t.adminReplies && t.adminReplies.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-[#D9FF3F] flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            <span>Official Admin Replies ({t.adminReplies.length}):</span>
                          </span>
                          <div className="space-y-2">
                            {t.adminReplies.map((r, rIdx) => (
                              <div
                                key={r.id || rIdx}
                                className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-[#202422] border border-emerald-500/20 text-xs space-y-1.5"
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

                      {/* Resolution Comment (if resolved) */}
                      {t.resolutionComment && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                            Resolution Summary:
                          </span>
                          <p className="text-[#101212] dark:text-white text-xs">{t.resolutionComment}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-[#8E9290]">
                        Submitted on: {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
