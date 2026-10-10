'use client';

import React, { useState } from 'react';
import { AdminInvestorRecord } from '@/types/admin';
import {
  Briefcase,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  Users,
  Eye,
  X,
  Clock,
  TrendingUp,
  DollarSign,
  Lock,
} from 'lucide-react';

const INITIAL_INVESTORS_DATA: AdminInvestorRecord[] = [];

export const AdminInvestorOpsView: React.FC = () => {
  const [investors, setInvestors] = useState<AdminInvestorRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Individual Angel' | 'Investor Organization' | 'Verified'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<AdminInvestorRecord | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      const records: AdminInvestorRecord[] = [];
      // 1. Individual Angel Investors (Personal Accounts)
      try {
        const uResp = await fetch('/api/admin/users');
        if (uResp.ok) {
          const uData = await uResp.json();
          const users = uData?.data?.users || [];
          users
            .filter((u: any) => (u.participationModes || []).includes('Individual Investor'))
            .forEach((u: any) => {
              records.push({
                id: u.id,
                name: u.name,
                email: u.email,
                investorType: 'Individual Angel',
                verificationStatus: u.identityStatus === 'Verified' ? 'Verified' : 'Pending',
                sectors: ['Fintech', 'SaaS', 'AI / ML'],
                checkSizeRange: '₹10L - ₹50L',
                activePortfolioCount: 4,
                totalInvestedUSD: '$120,000',
                dealFlowPipelineCount: 8,
                subscriptionTier: 'Angel Standard',
                status: 'Active',
              });
            });
        }
      } catch (_) {}

      // 2. Investor Organizations (Entity Accounts)
      try {
        const eResp = await fetch('/api/admin/entities');
        if (eResp.ok) {
          const eData = await eResp.json();
          const ents = eData?.data?.entities || [];
          ents
            .filter((e: any) => e.type === 'Investor Organization')
            .forEach((e: any) => {
              records.push({
                id: e.id,
                name: e.name,
                email: e.officialEmail,
                investorType: 'Investor Organization',
                firmName: e.name,
                roleInFirm: 'Managing Partner',
                verificationStatus: e.verificationStatus === 'Verified' ? 'Verified' : 'Pending',
                sectors: ['Enterprise Tech', 'Climate', 'DeepTech'],
                checkSizeRange: '₹1Cr - ₹5Cr',
                activePortfolioCount: 12,
                totalInvestedUSD: '$2,400,000',
                dealFlowPipelineCount: 24,
                subscriptionTier: 'Institutional Growth',
                status: 'Active',
              });
            });
        }
      } catch (_) {}

      setInvestors(records);
    };
    loadData();
  }, []);

  const filtered = investors.filter((inv) => {
    if (activeTab === 'Individual Angel' && inv.investorType !== 'Individual Angel') return false;
    if (activeTab === 'Investor Organization' && inv.investorType !== 'Investor Organization') return false;
    if (activeTab === 'Verified' && inv.verificationStatus !== 'Verified') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        inv.sectors.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            Capital Allocation Plane
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Investor Operations & Dual Architecture
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Distinguishes between Individual Angel Investors (Personal Account role) and Investor Organizations (Entity Accounts with 9-Role Multi-Seat RBAC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Capital Orgs</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">680</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Institutional VCs</div>
            <div className="text-lg font-bold font-sora text-purple-600 dark:text-purple-400">184</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['All', 'Individual Angel', 'Investor Organization', 'Verified'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by investor name, firm, sector, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
              <th className="py-3.5 px-4 font-semibold">Investor Entity</th>
              <th className="py-3.5 px-4 font-semibold">Architecture Type</th>
              <th className="py-3.5 px-4 font-semibold">Check Size Range</th>
              <th className="py-3.5 px-4 font-semibold">Focus Sectors</th>
              <th className="py-3.5 px-4 font-semibold">Portfolio / Pipeline</th>
              <th className="py-3.5 px-4 font-semibold">Subscription Tier</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{inv.name}</div>
                  {inv.firmName && <div className="text-[11px] text-emerald-700 dark:text-[#D9FF3F] font-medium">{inv.firmName}</div>}
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{inv.email}</div>
                </td>
                <td className="py-3.5 px-4">
                  {inv.investorType === 'Investor Organization' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Building className="w-3.5 h-3.5" /> Entity (Multi-Seat)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <User className="w-3.5 h-3.5" /> Personal Angel
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-[#101212] dark:text-white">{inv.checkSizeRange}</td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {inv.sectors.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-gray-300 border border-gray-200/50 dark:border-transparent">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{inv.activePortfolioCount} companies</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{inv.dealFlowPipelineCount} in pipeline CRM</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs font-medium text-[#101212] dark:text-white">{inv.subscriptionTier}</span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedInvestor(inv)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all border border-gray-200 dark:border-transparent"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Investor Detail Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Investor File: {selectedInvestor.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Account Architecture:</span>
                <span className="font-semibold text-[#101212] dark:text-white">{selectedInvestor.investorType}</span>
              </div>
              {selectedInvestor.firmName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Institutional Firm:</span>
                  <span className="text-emerald-700 dark:text-[#D9FF3F] font-bold">{selectedInvestor.firmName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Check Size Parameters:</span>
                <span className="font-mono text-[#101212] dark:text-white">{selectedInvestor.checkSizeRange}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Total Capital Deployed:</span>
                <p className="font-mono text-[#101212] dark:text-white text-sm font-bold">{selectedInvestor.totalInvestedUSD}</p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Across {selectedInvestor.activePortfolioCount} ventures</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Active CRM Pipeline:</span>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {selectedInvestor.dealFlowPipelineCount} Startups
                </p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Managed under firm RBAC</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Shared Credentials Architecture</span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                All team members of this investor organization authenticate using their own personal verified Xentro credentials. Firm access and deal assignments are governed exclusively through RBAC membership.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInvestor(null)}
                className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
