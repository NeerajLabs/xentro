'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  FolderLock,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  PieChart,
  CheckCircle2,
  ShieldCheck,
  Eye,
  FileText,
  Calendar,
  Sparkles,
  Users,
  Compass,
  Building2,
  Clock,
  Video,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import {
  ActiveInvestorContext,
  InvestorOrganization,
} from '@/types/investorOrganization';
import { InvestorDeal, InvestorMeeting, InvestorAccountType } from '@/types/investor';

interface InvestorOverviewProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
  onSelectSubTab?: (subTab: string) => void;
}

export const InvestorOverview: React.FC<InvestorOverviewProps> = ({
  profile,
  onNavigateTab,
  onSelectSubTab,
}) => {
  const { showToast } = useToast();

  const [activeContext, setActiveContext] = useState<ActiveInvestorContext>(() =>
    investorOrganizationService.getActiveContext()
  );
  const [activeOrg, setActiveOrg] = useState<InvestorOrganization | null>(() =>
    investorOrganizationService.getActiveOrganization()
  );
  const [deals, setDeals] = useState<InvestorDeal[]>(() =>
    investorOrganizationService.getScopedDeals()
  );
  const [meetings, setMeetings] = useState<InvestorMeeting[]>([]);

  useEffect(() => {
    const refreshData = () => {
      const ctx = investorOrganizationService.getActiveContext();
      setActiveContext(ctx);
      setActiveOrg(investorOrganizationService.getActiveOrganization());
      setDeals(investorOrganizationService.getScopedDeals(ctx));
      setMeetings(investorDomainService.getMeetings());
    };

    refreshData();

    const handleContextChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.context) {
        setActiveContext(ce.detail.context);
        setActiveOrg(investorOrganizationService.getActiveOrganization());
        setDeals(investorOrganizationService.getScopedDeals(ce.detail.context));
      } else {
        refreshData();
      }
    };

    const handleDealsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) {
        setDeals(ce.detail.deals);
      }
    };

    const handleMeetingsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.meetings) {
        setMeetings(ce.detail.meetings);
      }
    };

    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
    window.addEventListener('xentro-investor-deals-changed', handleDealsChange);
    window.addEventListener('xentro-investor-meetings-changed', handleMeetingsChange);

    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChange);
      window.removeEventListener('xentro-investor-meetings-changed', handleMeetingsChange);
    };
  }, []);

  const isOrg = activeContext.type === 'organization';
  const pendingPitchesCount = deals.filter((d) => d.dealStage === 'new' || d.dealStage === 'reviewed').length;
  const activeDiligenceCount = deals.filter((d) => d.dealStage === 'due_diligence' || d.dealStage === 'evaluation').length;

  return (
    <div className="space-y-6">
      {/* 0. Account Architecture Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-[#181B1A] text-white border border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 flex items-center justify-center text-[#D9FF3F] flex-shrink-0">
            {isOrg ? (
              <Building2 className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white font-heading">
                {isOrg
                  ? activeOrg?.name || 'Apex Ventures Capital Management LLP'
                  : `${profile.name} (Independent Angel Investor)`}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
                {isOrg ? activeOrg?.organizationType || 'Entity Account' : 'Personal Angel Account'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isOrg ? (
                <>
                  Active Member: <span className="text-white font-medium">{profile.name}</span> &bull; Role:{' '}
                  <span className="text-[#D9FF3F] font-semibold">Managing Partner</span> &bull; Fund Size:{' '}
                  <span className="text-white">{activeOrg?.fundSize || '₹500 Cr'}</span> &bull; Cheque:{' '}
                  <span className="text-[#D9FF3F] font-semibold">{activeOrg?.investmentFocus.ticketSize.formatted || '₹2Cr – ₹10Cr'}</span>
                </>
              ) : (
                <>
                  Personal Cheque Size:{' '}
                  <span className="text-[#D9FF3F] font-semibold">₹25L – ₹1Cr</span> &bull; Focus:{' '}
                  <span className="text-white">SaaS, FinTech, DeepTech</span> &bull; Direct Angel Deals
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOrg ? (
            <button
              onClick={() => onSelectSubTab && onSelectSubTab('team_access')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Team & RBAC</span>
            </button>
          ) : (
            <button
              onClick={() => {
                investorOrganizationService.setActiveContext({
                  type: 'organization',
                  organizationId: 'org_apex_vc',
                });
                showToast('Switched to Apex Ventures Entity Account', 'success');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Switch to Apex Ventures</span>
            </button>
          )}

          <button
            onClick={() => onSelectSubTab && onSelectSubTab('profile_settings')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {isOrg ? 'Organization Profile' : 'Angel Profile'}
          </button>
        </div>
      </div>

      {/* 1. Top 4 Investor KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Deal Pipeline</span>
            <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {deals.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              +{pendingPitchesCount} inbound
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {pendingPitchesCount} pitches awaiting partner triage
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Active Diligence</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {activeDiligenceCount}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              Deep In Review
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Full Data Room unlocked
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Dry Powder</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {activeOrg?.aum || activeOrg?.fundSize || '$0'}
            </span>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Available
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Live fund deployment
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Portfolio Startups</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {(activeOrg?.portfolio || []).length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Active Companies
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            3.4x average unrealized multiple
          </p>
        </div>
      </div>

      {/* 2. Middle Grid: Deal Pipeline & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Active Deal Flow & Diligence Pipeline
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Track incoming pitches, diligence audits, and term sheet negotiations
              </p>
            </div>
            <button
              onClick={() => onSelectSubTab && onSelectSubTab('deal_flow')}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Deal CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {deals.slice(0, 4).map((deal) => (
              <div
                key={deal.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-[#D9FF3F]/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700">
                    <img src={deal.startupLogo} alt={deal.startupName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                        {deal.startupName}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 font-semibold text-[#565B59] dark:text-gray-300">
                        {deal.stage}
                      </span>
                      {deal.matchScore && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          {deal.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      Founder: {deal.founderName} &bull; {deal.sector}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Ask: {deal.fundingAsk} &bull; Assigned: {deal.assignedMemberName || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                      deal.dealStage === 'term_discussion'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : deal.dealStage === 'due_diligence'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {deal.dealStage.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => {
                      if (onSelectSubTab) {
                        onSelectSubTab('deal_flow');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>View Deal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Upcoming Meetings Schedule */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Upcoming Meetings
              </h3>
            </div>
            <button
              onClick={() => onSelectSubTab && onSelectSubTab('meetings')}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline cursor-pointer"
            >
              All Calls &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {meetings.slice(0, 3).map((meet) => (
              <div
                key={meet.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 group hover:border-[#D9FF3F]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white line-clamp-1">
                    {meet.title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${
                      meet.status === 'scheduled'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {meet.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  <Clock className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span>
                    {meet.date} &bull; {meet.time} ({meet.duration})
                  </span>
                </div>

                <p className="text-[11px] text-[#565B59] dark:text-[#8E9390]">
                  Founder: <span className="font-semibold text-[#101212] dark:text-white">{meet.founderName}</span>
                </p>

                {meet.meetingLink && meet.status === 'scheduled' && (
                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={meet.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>

                    <button
                      onClick={() => onSelectSubTab && onSelectSubTab('meetings')}
                      className="text-[11px] text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      Log Notes &rarr;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Portfolio Performance Highlights */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Fund Portfolio Performance Highlights
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Real-time multiples, revenue traction, and follow-on readiness
            </p>
          </div>
          <button
            onClick={() => onSelectSubTab && onSelectSubTab('portfolio')}
            className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Portfolio Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(activeOrg?.portfolio && activeOrg.portfolio.length > 0) ? (
            activeOrg.portfolio.map((ph: any) => (
              <div
                key={ph.id || ph.name}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 group hover:border-[#D9FF3F]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                    {ph.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[#565B59] dark:text-gray-300 font-semibold">
                    {ph.sector || 'Venture'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Check Invested:</span>
                    <span className="text-xs font-bold text-[#101212] dark:text-white">{ph.investmentAmount || '$0'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Current Multiple:</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {ph.multiple || '1.0x'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-gray-50 dark:bg-[#202422] rounded-xl border border-dashed border-gray-200 dark:border-[#262A29] col-span-3">
              <PieChart className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#101212] dark:text-white">No portfolio investments recorded yet</p>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">Add syndicate deals or portfolio companies in your organization profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
