'use client';

import React, { useState, useEffect } from 'react';
import {
  ADMIN_KPIS,
  ECOSYSTEM_GROWTH_DATA,
  AdminKPI,
} from '@/data/adminData';
import { adminDomainService } from '@/lib/adminDomainService';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { AdminTab } from './AdminLayout';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  Users,
  Download,
  Send,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface AdminOverviewViewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const [kpiCategoryFilter, setKpiCategoryFilter] = useState<'all' | 'ecosystem' | 'operations' | 'financial'>('all');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTarget, setAnnouncementTarget] = useState('all');

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    totalMembers: 0,
    startups: 0,
    mentors: 0,
    investors: 0,
    esps: 0,
    pendingVerifications: 0,
    safetyReports: 0,
    supportTickets: 0,
    failedPayments: 0,
    pendingEndorsements: 0,
  });

  const loadRealData = async () => {
    let usersList: any[] = [];
    let pendingRequests: any[] = [];

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/users/`);
      if (resp.ok) {
        const d = await resp.json();
        usersList = d?.data?.users || d?.data || [];
      }
    } catch {
      // Backend not accessible, fallback to domain store
      usersList = adminDomainService.getPersonalAccounts();
    }

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/`);
      if (resp.ok) {
        const d = await resp.json();
        pendingRequests = d?.data?.requests || d?.data?.registrationRequests || [];
      }
    } catch {
      // No requests
    }

    const startupsCount = usersList.filter((u: any) => (u.user_type || u.userType || u.role) === 'Startup').length;
    const mentorsCount = usersList.filter((u: any) => (u.user_type || u.userType || u.role) === 'Mentor').length;
    const investorsCount = usersList.filter((u: any) => (u.user_type || u.userType || u.role) === 'Investor').length;
    const espsCount = usersList.filter((u: any) => (u.user_type || u.userType || u.role) === 'ESP').length;

    const pendingCount = Array.isArray(pendingRequests)
      ? pendingRequests.filter((r: any) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length
      : 0;

    const verificationCases = adminDomainService.getVerificationCases();
    const pendingCases = verificationCases.filter((c) => c.status === 'Pending' || c.status === 'Under Review').length;
    const totalPending = pendingCount + pendingCases;

    const endorsements = adminDomainService.getEndorsements();
    const pendingEndorsementsCount = endorsements.filter((e) => e.status === 'Pending').length;

    setCounts({
      totalMembers: usersList.length,
      startups: startupsCount,
      mentors: mentorsCount,
      investors: investorsCount,
      esps: espsCount,
      pendingVerifications: totalPending,
      safetyReports: 0,
      supportTickets: 0,
      failedPayments: 0,
      pendingEndorsements: pendingEndorsementsCount,
    });

    if (typeof window !== 'undefined') {
      try {
        const rawLogs = localStorage.getItem('xentro_admin_audit_logs');
        if (rawLogs) {
          setAuditLogs(JSON.parse(rawLogs).slice(0, 5));
        }
      } catch {
        setAuditLogs([]);
      }
    }
  };

  useEffect(() => {
    loadRealData();
    const handleUpdate = () => loadRealData();
    window.addEventListener('xentro-admin-updated', handleUpdate);
    window.addEventListener('xentro-audit-logged', handleUpdate);
    return () => {
      window.removeEventListener('xentro-admin-updated', handleUpdate);
      window.removeEventListener('xentro-audit-logged', handleUpdate);
    };
  }, []);

  // Compute dynamic KPIs reflecting real stats
  const dynamicKpis: AdminKPI[] = ADMIN_KPIS.map((kpi) => {
    if (kpi.id === 'total-members') return { ...kpi, value: counts.totalMembers.toLocaleString() };
    if (kpi.id === 'active-startups') return { ...kpi, value: counts.startups.toLocaleString() };
    if (kpi.id === 'verified-mentors') return { ...kpi, value: counts.mentors.toLocaleString() };
    if (kpi.id === 'accredited-investors') return { ...kpi, value: counts.investors.toLocaleString() };
    if (kpi.id === 'active-esps') return { ...kpi, value: counts.esps.toLocaleString() };
    if (kpi.id === 'pending-verifications') return { ...kpi, value: counts.pendingVerifications.toLocaleString() };
    return kpi;
  });

  const filteredKpis =
    kpiCategoryFilter === 'all'
      ? dynamicKpis
      : dynamicKpis.filter((k) => k.category === kpiCategoryFilter);

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setAnnouncementSent(true);
    setTimeout(() => {
      setAnnouncementSent(false);
      setAnnouncementModalOpen(false);
      setAnnouncementText('');
    }, 1500);
  };

  const actionableCount =
    counts.pendingVerifications +
    counts.safetyReports +
    counts.supportTickets +
    counts.failedPayments +
    counts.pendingEndorsements;

  const totalUsers = counts.totalMembers || 1;
  const startupPct = counts.totalMembers > 0 ? ((counts.startups / totalUsers) * 100).toFixed(1) : '0.0';
  const mentorPct = counts.totalMembers > 0 ? ((counts.mentors / totalUsers) * 100).toFixed(1) : '0.0';
  const investorPct = counts.totalMembers > 0 ? ((counts.investors / totalUsers) * 100).toFixed(1) : '0.0';
  const espPct = counts.totalMembers > 0 ? ((counts.esps / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Fast Insights */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-6 lg:p-8 shadow-xs">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9FF3F]/5 dark:bg-[#D9FF3F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xentro Operations Intelligence &bull; Live Platform Node</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-sora text-[#101212] dark:text-white tracking-tight">
              Ecosystem Platform Overview
            </h2>
            <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
              Live platform operational monitoring. All core microservices, KYC document pipelines, and connection brokers are nominal.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('verification')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review Queue ({counts.pendingVerifications})</span>
            </button>

            <button
              onClick={() => setAnnouncementModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-semibold border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attention Centre (Operational Dispatch Queue with Deep Links) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-amber-500/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-sora font-bold text-sm text-[#101212] dark:text-white">
                Requires Administrative Attention
              </h3>
              <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                Actionable operational queues requiring review, KYC validation, dispute resolution, or escrow clearance.
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            actionableCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {actionableCount > 0 ? `${actionableCount} Action Items` : 'All Queues Nominal'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => onNavigateTab('verification')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Identity Reviews</span>
              <span className={`font-mono font-bold ${counts.pendingVerifications > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                {counts.pendingVerifications}
              </span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Personal KYC cases pending compliance</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('esps')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">ESP Requests</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Institutional incubator applications</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('verification')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Investor Org KYC</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">VC fund accreditation documents</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('relationships')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Pending Endorsements</span>
              <span className={`font-mono font-bold ${counts.pendingEndorsements > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                {counts.pendingEndorsements}
              </span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">ESP &rarr; Startup sponsorship reviews</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('finance')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Failed Payments</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Dunning card retries & past due accounts</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('moderation')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Open Safety Cases</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Impersonation & scam reports</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('relationships')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Mentorship Disputes</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Advisory milestone mediation</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('moderation')}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#101212] dark:text-white">Urgent Support</span>
              <span className="font-mono text-gray-400 font-bold">0</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-1">Unassigned high priority founder tickets</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold mt-2 group-hover:underline">
              <span>Open Queue</span> <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </button>
        </div>
      </div>

      {/* KPI Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs">
          {(
            [
              { id: 'all', label: 'All 12 Metrics' },
              { id: 'ecosystem', label: 'Ecosystem Scale' },
              { id: 'operations', label: 'Operations & Verification' },
              { id: 'financial', label: 'Financial & Subs' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setKpiCategoryFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                kpiCategoryFilter === t.id
                  ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                  : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert('Platform analytics currently nominal with zero anomalies.')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Metrics</span>
        </button>
      </div>

      {/* 12 Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKpis.map((kpi) => {
          const isPositive = kpi.trend === 'up';
          const isPendingVerif = kpi.id === 'pending-verifications';
          const isSafetyFlag = kpi.id === 'safety-flags';

          return (
            <div
              key={kpi.id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#181B1A] border transition-all duration-200 hover:border-gray-300 dark:hover:border-[#383E3B] ${
                (isPendingVerif && counts.pendingVerifications > 0) || (isSafetyFlag && counts.safetyReports > 0)
                  ? 'border-amber-500/30 dark:border-amber-500/20'
                  : 'border-[#E5E7EB] dark:border-[#262A29]'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#6E7370] dark:text-[#8E9390] leading-tight">
                  {kpi.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold font-sora text-[#101212] dark:text-white tracking-tight">
                  {kpi.value}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                <span>{kpi.subtext}</span>
                {isPendingVerif && (
                  <button
                    onClick={() => onNavigateTab('verification')}
                    className="text-[#101212] dark:text-[#D9FF3F] font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>Resolve</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {isSafetyFlag && (
                  <button
                    onClick={() => onNavigateTab('moderation')}
                    className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Growth Dynamics & User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trends Visualization (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                Platform Cohort Expansion
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                Cumulative participant onboardings across verified ecosystem roles
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9FF3F]" />
                <span className="text-[#6E7370] dark:text-[#8E9390]">Startups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[#6E7370] dark:text-[#8E9390]">Mentors</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-[#6E7370] dark:text-[#8E9390]">Investors</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[#6E7370] dark:text-[#8E9390]">ESPs</span>
              </span>
            </div>
          </div>

          {/* Clean Zero State or Visual Bar Chart */}
          {ECOSYSTEM_GROWTH_DATA.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center border-b border-gray-100 dark:border-[#262A29]">
              <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/10 text-[#D9FF3F] flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#101212] dark:text-white">
                No Cohort Analytics Recorded Yet
              </p>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390] max-w-sm mt-1">
                Ecosystem monthly growth trends will plot automatically as newly registered members engage on the platform.
              </p>
            </div>
          ) : (
            <div className="pt-4 grid grid-cols-6 gap-3 sm:gap-6 items-end h-56 border-b border-gray-100 dark:border-[#262A29] pb-4">
              {ECOSYSTEM_GROWTH_DATA.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-mono text-[#6E7370] dark:text-[#8E9390]">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between text-xs text-[#6E7370] dark:text-[#8E9390] pt-1">
            <span>Growth velocity: Nominal</span>
            <span className="font-mono text-[#101212] dark:text-white">Active Retention: 100%</span>
          </div>
        </div>

        {/* User Distribution & Health (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white">
              Role Composition
            </h3>
            <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
              Active platform participant distribution
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D9FF3F]" />
                    <span className="text-[#101212] dark:text-white">Startups ({counts.startups})</span>
                  </span>
                  <span className="font-mono text-gray-500">{startupPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#262A29] overflow-hidden">
                  <div className="h-full bg-[#D9FF3F] rounded-full" style={{ width: `${startupPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[#101212] dark:text-white">Mentors ({counts.mentors})</span>
                  </span>
                  <span className="font-mono text-gray-500">{mentorPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#262A29] overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${mentorPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-[#101212] dark:text-white">Investors ({counts.investors})</span>
                  </span>
                  <span className="font-mono text-gray-500">{investorPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#262A29] overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${investorPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[#101212] dark:text-white">ESPs & Hubs ({counts.esps})</span>
                  </span>
                  <span className="font-mono text-gray-500">{espPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#262A29] overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${espPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#262A29]">
            <button
              onClick={() => onNavigateTab('users')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-bold transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Explore Ecosystem Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Activity Stream & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realtime Audit Activity Log (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D9FF3F]" />
                <span>Recent Administrative Activity</span>
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                Live immutable audit record of actions executed by verified administrators
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('system')}
              className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#262A29] text-gray-400 flex items-center justify-center mb-2.5">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-[#101212] dark:text-white">
                No Administrative Actions Recorded
              </p>
              <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] mt-0.5">
                Audit entries will log here in realtime as verifications, role updates, or policy changes are executed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {auditLogs.map((act) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                        {act.action}
                      </p>
                      <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] truncate">
                        {act.details} &bull; By {act.adminName || act.admin}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6E7370] dark:text-[#8E9390] flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{act.timestamp ? act.timestamp.slice(11, 16) : 'Recent'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Direct Operations (1 col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
          <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white">
            Quick Operations
          </h3>
          <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
            Direct mission tools for high-frequency admin workflows
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => onNavigateTab('verification')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D9FF3F]/15 flex items-center justify-center text-[#101212] dark:text-[#D9FF3F]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors">
                    Process KYC Queue
                  </div>
                  <div className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    {counts.pendingVerifications} dossiers waiting verification
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-[#D9FF3F] transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('opportunities')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors">
                    Curate Grants & Programs
                  </div>
                  <div className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Review and publish startup opportunities
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-[#D9FF3F] transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('moderation')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors">
                    Imposter & Fraud Defense
                  </div>
                  <div className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    {counts.safetyReports} active safety escalations
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-[#D9FF3F] transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {announcementModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#D9FF3F]" />
                <span>Ecosystem Broadcast Alert</span>
              </h4>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
              Broadcast a priority notification or platform banner to ecosystem participants.
            </p>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Target Audience
                </label>
                <select
                  value={announcementTarget}
                  onChange={(e) => setAnnouncementTarget(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                >
                  <option value="all">All Ecosystem Members ({counts.totalMembers})</option>
                  <option value="startups">Startups Only ({counts.startups})</option>
                  <option value="mentors">Mentors Only ({counts.mentors})</option>
                  <option value="investors">Investors Only ({counts.investors})</option>
                  <option value="esps">ESPs & Institutions Only ({counts.esps})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Notification Message
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. System scheduled maintenance on Sunday 2:00 AM UTC..."
                  className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden resize-none"
                  required
                />
              </div>

              {announcementSent ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Broadcast transmitted successfully!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setAnnouncementModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E7370] dark:text-[#8E9390] hover:bg-black/5 dark:hover:bg-[#202422]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-colors"
                  >
                    Send Broadcast
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
