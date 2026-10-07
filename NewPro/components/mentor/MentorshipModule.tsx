'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  Edit3,
  Sliders,
  Check,
  X,
  MessageSquare,
  HelpCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Tag,
  Star,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  MENTORSHIP_OFFERING,
  MENTORSHIP_REQUEST,
  MENTORSHIP,
  FounderInfo,
} from '@/types/mentor';
import {
  getMentorOfferings,
  saveMentorOfferings,
  getMentorshipRequests,
  acceptMentorshipRequest,
  declineMentorshipRequest,
  confirmPaymentAndActivate,
  activateWithEntitlement,
  getActiveMentorships,
  getMentorshipHistory,
  toggleTestimonialDisplay,
} from '@/lib/mentorshipService';
import { useToast } from '@/components/ui/Toast';
import { MentorshipWorkspace } from './MentorshipWorkspace';
import { FounderProfileModal } from './FounderProfileModal';

interface MentorshipModuleProps {
  initialRequests?: any[];
  initialActive?: any[];
  initialPast?: any[];
  defaultSubTab?: 'overview' | 'offerings' | 'requests' | 'active' | 'history';
  onNavigateMeetings?: () => void;
  onNavigateMessages?: (founderName?: string) => void;
  userRole?: 'startup' | 'mentor' | string;
}

type MentorshipSubTab = 'overview' | 'offerings' | 'requests' | 'active' | 'history';

export const MentorshipModule: React.FC<MentorshipModuleProps> = ({
  defaultSubTab,
  onNavigateMeetings,
  onNavigateMessages,
  userRole,
}) => {
  const { showToast } = useToast();
  const [role, setRole] = useState<string>(() => {
    if (userRole) return userRole;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('xentro_active_role') || 'mentor';
    }
    return 'mentor';
  });

  useEffect(() => {
    if (userRole) {
      setRole(userRole);
      return;
    }
    const handleRoleChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.role) setRole(ce.detail.role);
      else if (typeof window !== 'undefined') {
        setRole(localStorage.getItem('xentro_active_role') || 'mentor');
      }
    };
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    return () => window.removeEventListener('xentro-role-changed', handleRoleChanged);
  }, [userRole]);

  const isStartup = role === 'startup';

  const initialTab = defaultSubTab
    ? defaultSubTab
    : isStartup
    ? 'active'
    : 'overview';

  const [subTab, setSubTab] = useState<MentorshipSubTab>(initialTab);

  useEffect(() => {
    if (isStartup && (subTab === 'overview' || subTab === 'offerings' || subTab === 'requests')) {
      setSubTab('active');
    }
  }, [isStartup, subTab]);

  // Live domain state
  const [offerings, setOfferings] = useState<MENTORSHIP_OFFERING[]>([]);
  const [requests, setRequests] = useState<MENTORSHIP_REQUEST[]>([]);
  const [activeMentorships, setActiveMentorships] = useState<MENTORSHIP[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Active Workspace Selection
  const [selectedActiveMentorship, setSelectedActiveMentorship] = useState<MENTORSHIP | null>(null);

  // Selected Founder for Profile Modal
  const [selectedFounder, setSelectedFounder] = useState<FounderInfo | null>(null);

  // Offering Editing Modal
  const [editingOffering, setEditingOffering] = useState<MENTORSHIP_OFFERING | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editFrequency, setEditFrequency] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editCommMode, setEditCommMode] = useState('');
  const [editMaxStartups, setEditMaxStartups] = useState<number>(5);
  const [editDesc, setEditDesc] = useState('');
  const [editAreas, setEditAreas] = useState('');

  // Payment Confirmation Simulation Modal
  const [pendingPaymentReq, setPendingPaymentReq] = useState<MENTORSHIP_REQUEST | null>(null);
  const [simPaymentMethod, setSimPaymentMethod] = useState('Razorpay UPI (Verified)');

  // Decline with Reason Modal
  const [declineReq, setDeclineReq] = useState<MENTORSHIP_REQUEST | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const loadData = () => {
    setOfferings(getMentorOfferings());
    setRequests(getMentorshipRequests());
    setActiveMentorships(getActiveMentorships());
    setHistory(getMentorshipHistory());
  };

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener('xentro-mentorship-changed', handleChanged);
    window.addEventListener('xentro-mentorship-requests-changed', handleChanged);
    window.addEventListener('xentro-mentorship-offerings-changed', handleChanged);
    return () => {
      window.removeEventListener('xentro-mentorship-changed', handleChanged);
      window.removeEventListener('xentro-mentorship-requests-changed', handleChanged);
      window.removeEventListener('xentro-mentorship-offerings-changed', handleChanged);
    };
  }, []);

  // Toggle Offering Enabled / Disabled
  const handleToggleOffering = (id: string) => {
    const updated = offerings.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o));
    setOfferings(updated);
    saveMentorOfferings(updated);
    const target = updated.find((o) => o.id === id);
    showToast(
      `${target?.duration} Mentorship is now ${target?.enabled ? 'LIVE on Public Profile' : 'HIDDEN from Public Profile'}`,
      'info'
    );
  };

  // Open Edit Offering Modal
  const handleOpenEditOffering = (off: MENTORSHIP_OFFERING) => {
    setEditingOffering(off);
    setEditPrice(off.price);
    setEditFrequency(off.meetingFrequency);
    setEditDuration(off.preferredMeetingDuration);
    setEditCommMode(off.communicationMode);
    setEditMaxStartups(off.maximumActiveStartups);
    setEditDesc(off.description);
    setEditAreas(off.areasCovered.join(', '));
  };

  // Save Offering Changes
  const handleSaveOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffering) return;
    const updated = offerings.map((o) => {
      if (o.id === editingOffering.id) {
        return {
          ...o,
          price: Number(editPrice),
          meetingFrequency: editFrequency,
          preferredMeetingDuration: editDuration,
          communicationMode: editCommMode,
          maximumActiveStartups: Number(editMaxStartups),
          description: editDesc,
          areasCovered: editAreas.split(',').map((s) => s.trim()).filter(Boolean),
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    setOfferings(updated);
    saveMentorOfferings(updated);
    setEditingOffering(null);
    showToast(`Updated parameters for ${editingOffering.duration} offering!`, 'success');
  };

  // Accept Request (transitions to AWAITING_PAYMENT)
  const handleAcceptRequest = (req: MENTORSHIP_REQUEST) => {
    const updated = acceptMentorshipRequest(req.id);
    if (updated) {
      loadData();
      showToast(
        `Accepted request from ${req.startup.name}! Lifecycle updated to AWAITING_PAYMENT.`,
        'success'
      );
    }
  };

  // Confirm Payment & Activate
  const handleConfirmPaymentAndActivate = () => {
    if (!pendingPaymentReq) return;
    confirmPaymentAndActivate(pendingPaymentReq.id, {
      transactionId: `TXN-XEN-${Date.now().toString().slice(-4)}`,
      amount: pendingPaymentReq.price,
      paymentMethod: simPaymentMethod,
    });
    setPendingPaymentReq(null);
    loadData();
    showToast(
      `Payment confirmed! Mentorship activated for ${pendingPaymentReq.startup.name}. Workspace initialized.`,
      'success'
    );
    setSubTab('active');
  };

  // Activate via Institutional Entitlement
  const handleActivateViaEntitlement = (req: MENTORSHIP_REQUEST) => {
    activateWithEntitlement(req.id);
    loadData();
    showToast(
      `Activated complimentary mentorship for ${req.startup.name} via verified institutional entitlement!`,
      'success'
    );
    setSubTab('active');
  };

  // Decline Request
  const handleConfirmDecline = () => {
    if (!declineReq) return;
    declineMentorshipRequest(declineReq.id, declineReason);
    setDeclineReq(null);
    setDeclineReason('');
    loadData();
    showToast(`Declined mentorship request from ${declineReq.startup.name}.`, 'info');
  };

  // If viewing an active mentorship workspace
  if (selectedActiveMentorship) {
    return (
      <MentorshipWorkspace
        mentorship={selectedActiveMentorship}
        onBack={() => {
          setSelectedActiveMentorship(null);
          loadData();
        }}
        onNavigateMessages={onNavigateMessages}
        onNavigateMeetings={onNavigateMeetings}
      />
    );
  }

  const pendingRequests = requests.filter(
    (r) => r.status === 'REQUESTED' || r.status === 'UNDER_REVIEW' || r.status === 'AWAITING_PAYMENT'
  );

  const tabs: { id: MentorshipSubTab; label: string; count?: number }[] = isStartup
    ? [
        { id: 'active', label: 'Active Mentorships', count: activeMentorships.length },
        { id: 'history', label: 'History', count: history.length },
      ]
    : [
        { id: 'overview', label: 'Overview' },
        { id: 'offerings', label: 'Offerings & Pricing', count: offerings.length },
        { id: 'requests', label: 'Requests', count: pendingRequests.length },
        { id: 'active', label: 'Active Mentorships', count: activeMentorships.length },
        { id: 'history', label: 'History', count: history.length },
      ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Subnav Bar for Mentorship Subsections */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-2 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBSECTION 1: OVERVIEW                                    */}
      {/* ========================================================= */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Advisory Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Active Mentorships</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {activeMentorships.length}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Startups Guided
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Structured 1 / 3 / 6-month cycles
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Pending Requests</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {pendingRequests.length}
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Awaiting Review
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Applications from founders
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Monthly Net Earnings</span>
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  ₹36,000
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  +18% MoM
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Net after 10% Xentro platform commission
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Graduation Rate</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  100%
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  5.0 Rating
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                {history.length} completed engagements
              </p>
            </div>
          </div>

          {/* Active Mentorships Quick Access */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Active Engagements ({activeMentorships.length})
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Founders currently in an active structured advisory cycle
                </p>
              </div>
              <button
                onClick={() => setSubTab('active')}
                className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Active</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeMentorships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMentorships.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 hover:border-[#D9FF3F]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.founder.avatar}
                            alt={m.founder.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                              {m.startupName}
                            </h4>
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                              Founder: {m.founder.name} &bull; {m.startupSector}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {m.duration}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        🎯 Focus: {m.mentorshipFocus.join(' · ')}
                      </p>

                      <div className="p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-[11px]">
                        <span className="text-[#565B59]">Next Session:</span>
                        <span className="font-bold text-[#101212] dark:text-[#D9FF3F]">{m.nextMeeting || 'Pending scheduling'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedActiveMentorship(m)}
                      className="w-full py-2 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Open Mentorship Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] text-xs space-y-1">
                <p className="font-semibold text-[#101212] dark:text-white">No active structured engagements yet</p>
                <p>When you accept incoming mentorship applications and confirm packages, your active mentees will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBSECTION 2: OFFERINGS & PRICING                         */}
      {/* ========================================================= */}
      {subTab === 'offerings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Structured Mentorship Offerings & Pricing Packages
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Configure your 1-month, 3-month, and 6-month advisory packages. Mentors control pricing, duration, frequency, and visibility.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Enabled packages appear on your Public Profile
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offerings.map((off) => (
                <div
                  key={off.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    off.enabled
                      ? 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] shadow-subtle'
                      : 'bg-gray-50/50 dark:bg-[#181B1A]/40 border-gray-200 dark:border-[#262A29] opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Duration & Live Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF3F] bg-[#D9FF3F]/15 px-2.5 py-1 rounded-lg">
                        {off.duration}
                      </span>
                      <button
                        onClick={() => handleToggleOffering(off.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          off.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-[#565B59] dark:text-gray-300'
                        }`}
                      >
                        {off.enabled ? 'Live (Enabled)' : 'Hidden (Disabled)'}
                      </button>
                    </div>

                    {/* Pricing */}
                    <div>
                      <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                        ₹{off.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] ml-1">
                        / {off.duration}
                      </span>
                    </div>

                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {off.description}
                    </p>

                    {/* Specifications */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs">
                      <div className="flex justify-between text-[#565B59]">
                        <span>Frequency:</span>
                        <span className="font-semibold text-[#101212] dark:text-white">{off.meetingFrequency}</span>
                      </div>
                      <div className="flex justify-between text-[#565B59]">
                        <span>Session Length:</span>
                        <span className="font-semibold text-[#101212] dark:text-white">{off.preferredMeetingDuration}</span>
                      </div>
                      <div className="flex justify-between text-[#565B59]">
                        <span>Max Startups:</span>
                        <span className="font-semibold text-[#101212] dark:text-white">{off.maximumActiveStartups} concurrent</span>
                      </div>
                    </div>

                    {/* Areas Covered */}
                    <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#565B59]">Key Focus Areas:</span>
                      <div className="flex flex-wrap gap-1">
                        {off.areasCovered.map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-gray-300 font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditOffering(off)}
                    className="w-full py-2 px-3 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Configure Offering</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBSECTION 3: REQUESTS                                    */}
      {/* ========================================================= */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#101212] dark:text-[#D9FF3F]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                Lifecycle Rule: Accepting a mentorship application moves it to Awaiting Payment. Mentorship activates only after confirmed payment or verified institutional entitlement.
              </span>
            </div>
          </div>

          {requests.map((req) => {
            const isAwaitingPayment = req.status === 'AWAITING_PAYMENT';
            const isDeclined = req.status === 'DECLINED';
            const isConfirmed = req.status === 'PAYMENT_CONFIRMED';

            return (
              <div
                key={req.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4"
              >
                {/* Header: Founder & Startup Identity */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={req.founder.avatar}
                      alt={req.founder.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                          {req.startup.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {req.currentStartupStage}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {req.startup.industry}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAwaitingPayment
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : isDeclined
                              ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                              : isConfirmed
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        Founder: <span className="font-semibold text-[#101212] dark:text-white">{req.founder.name}</span> ({req.founder.title}) &bull; Requested {req.requestDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold font-sora text-[#101212] dark:text-white block">
                      ₹{req.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {req.selectedDuration} Package
                    </span>
                  </div>
                </div>

                {/* Requirement & Challenges Teardown */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#565B59]">Requested Areas:</span>
                    {req.mentorshipAreasRequired.map((area, idx) => (
                      <span key={idx} className="font-semibold text-[#101212] dark:text-[#D9FF3F] bg-[#D9FF3F]/15 px-2 py-0.5 rounded">
                        {area}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-[#101212] dark:text-white">Why requesting advisory:</strong> "{req.reasonForRequest}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200 dark:border-[#262A29] text-[11px]">
                    <div>
                      <span className="text-[#565B59] font-semibold">Current Challenges:</span>
                      <p className="text-gray-600 dark:text-gray-400">{req.currentChallenges}</p>
                    </div>
                    <div>
                      <span className="text-[#565B59] font-semibold">Expected Outcomes:</span>
                      <p className="text-gray-600 dark:text-gray-400">{req.expectedOutcomes}</p>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFounder(req.founder as any)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white transition-all"
                    >
                      View Founder Profile
                    </button>
                    <button
                      onClick={() => {
                        if (onNavigateMessages) onNavigateMessages(req.founder.name);
                        else showToast(`Opening chat with ${req.founder.name}`);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'REQUESTED' && (
                      <>
                        <button
                          onClick={() => {
                            setDeclineReq(req);
                            setDeclineReason('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Issue Invoice</span>
                        </button>
                      </>
                    )}

                    {isAwaitingPayment && (
                      <>
                        <button
                          onClick={() => handleActivateViaEntitlement(req)}
                          className="px-3.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-xs font-bold transition-all cursor-pointer"
                        >
                          Activate via Grant Entitlement
                        </button>
                        <button
                          onClick={() => setPendingPaymentReq(req)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Payment & Activate</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBSECTION 4: ACTIVE MENTORSHIPS                          */}
      {/* ========================================================= */}
      {subTab === 'active' && (
        <div className="space-y-4">
          {activeMentorships.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-[#D9FF3F]" />
              <h4 className="text-base font-bold text-[#101212] dark:text-white">No Active Mentorship Engagements</h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                When you accept incoming mentorship applications from founders, active cohorts and structured 1-on-1 advisory workspaces will be tracked here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMentorships.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={m.founder.avatar}
                        alt={m.founder.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                          {m.startupName}
                        </h4>
                        <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                          Founder: {m.founder.name}
                        </p>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {m.startupSector} &bull; {m.startupStage}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#565B59]">Mentorship Focus:</span>
                    <p className="text-xs font-semibold text-[#101212] dark:text-white">
                      {m.mentorshipFocus.join(' · ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs">
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block">Started</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{m.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block">Remaining</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{m.timeRemaining}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Next Meeting:
                    </span>
                    <span className="font-bold text-[#101212] dark:text-white">
                      {m.nextMeeting || 'Pending scheduling'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                  <button
                    onClick={() => {
                      if (onNavigateMessages) onNavigateMessages(m.founder.name);
                      else showToast(`Opening chat with ${m.founder.name}`);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() => setSelectedActiveMentorship(m)}
                    className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Open Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBSECTION 5: HISTORY                                     */}
      {/* ========================================================= */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#101212] dark:text-[#D9FF3F]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold">
                Verified Mentorship Track Record & Founder Testimonials. All testimonials are authored strictly by verified mentee founders.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {history.map((past) => (
              <div
                key={past.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <img
                      src={past.founderAvatar}
                      alt={past.founderName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                        {past.founderName}
                      </h4>
                      <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-medium">
                        {past.startupName} &bull; {past.packageTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] font-mono">
                      {past.startDate} — {past.endDate}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        past.finalStatus === 'Completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-gray-100 dark:bg-[#202422] text-[#565B59]'
                      }`}
                    >
                      {past.finalStatus}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs space-y-1">
                  <span className="font-bold text-[#101212] dark:text-white">🎯 Outcome:</span>
                  <p className="text-gray-700 dark:text-gray-300">{past.outcomeSummary}</p>
                </div>

                {past.testimonial && (
                  <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        {[...Array(past.testimonial.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-xs font-bold text-[#101212] dark:text-white ml-1">
                          Verified Founder Testimonial
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#565B59]">Display on Public Profile:</span>
                        <input
                          type="checkbox"
                          checked={past.testimonial.isPubliclyDisplayed}
                          onChange={(e) => toggleTestimonialDisplay(past.id, e.target.checked)}
                          className="w-4 h-4 accent-[#D9FF3F] rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                      "{past.testimonial.content}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIGURE OFFERING                                 */}
      {/* ========================================================= */}
      {editingOffering && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Configure {editingOffering.duration} Offering
              </h3>
              <button onClick={() => setEditingOffering(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOffering} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Max Concurrent Startups
                  </label>
                  <input
                    type="number"
                    required
                    value={editMaxStartups}
                    onChange={(e) => setEditMaxStartups(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Meeting Frequency
                  </label>
                  <input
                    type="text"
                    required
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                    placeholder="e.g. 2 sessions / month"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Preferred Session Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 45 Minutes"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Communication Mode
                </label>
                <input
                  type="text"
                  required
                  value={editCommMode}
                  onChange={(e) => setEditCommMode(e.target.value)}
                  placeholder="e.g. Xentro Messages + Video Meetings"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Covered Focus Areas (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={editAreas}
                  onChange={(e) => setEditAreas(e.target.value)}
                  placeholder="GTM Strategy, Seed SAFE, Architecture Review"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOffering(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs"
                >
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM PAYMENT (AUTHORITATIVE ACTIVATION)         */}
      {/* ========================================================= */}
      {pendingPaymentReq && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Activate</span>
              </h3>
              <button onClick={() => setPendingPaymentReq(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Authoritative activation gate: In accordance with core rules, mentorship is strictly activated only upon verified payment confirmation.
            </p>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#565B59]">Startup:</span>
                <span className="font-bold text-[#101212] dark:text-white">{pendingPaymentReq.startup.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59]">Package:</span>
                <span className="font-bold text-[#101212] dark:text-white">{pendingPaymentReq.selectedDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59]">Gross Amount:</span>
                <span className="font-bold font-sora text-[#101212] dark:text-white">₹{pendingPaymentReq.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                Payment Channel & Gateway Reference
              </label>
              <select
                value={simPaymentMethod}
                onChange={(e) => setSimPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
              >
                <option value="Razorpay UPI (Verified)">Razorpay UPI (Verified)</option>
                <option value="HDFC Corporate NetBanking">HDFC Corporate NetBanking</option>
                <option value="ICICI Business Credit Card">ICICI Business Credit Card</option>
                <option value="Stripe Wire Transfer">Stripe Wire Transfer</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingPaymentReq(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentAndActivate}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
              >
                Verify & Initialize Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DECLINE REQUEST                                    */}
      {/* ========================================================= */}
      {declineReq && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Decline Mentorship Request</span>
              </h3>
              <button onClick={() => setDeclineReq(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Provide constructive feedback to {declineReq.founder.name} regarding why this engagement cannot proceed.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                Decline Reason / Guidance
              </label>
              <textarea
                required
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Current advisory cohort capacity reached; recommend applying for Q1..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineReq(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Founder Profile Modal */}
      <FounderProfileModal
        founder={selectedFounder}
        isOpen={Boolean(selectedFounder)}
        onClose={() => setSelectedFounder(null)}
        onOpenMessage={(founder) => {
          if (onNavigateMessages) onNavigateMessages(founder.name);
        }}
        onScheduleMeeting={() => {
          if (onNavigateMeetings) onNavigateMeetings();
        }}
      />
    </div>
  );
};
