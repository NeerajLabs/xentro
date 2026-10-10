'use client';

import React, { useState } from 'react';
import { AdminStartupRecord } from '@/types/admin';
import {
  Rocket,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  X,
  Building,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  FileText,
  Lock,
  Award,
  ExternalLink,
  ChevronRight,
  Ghost,
} from 'lucide-react';

export const AdminStartupOpsView: React.FC = () => {
  const [startups, setStartups] = useState<AdminStartupRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Verified' | 'Pending Verification' | 'Ghost Mode' | 'Endorsed' | 'Pro Entitled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStartup, setSelectedStartup] = useState<AdminStartupRecord | null>(null);

  React.useEffect(() => {
    const loadStartups = async () => {
      try {
        const resp = await fetch('/api/admin/entities');
        if (resp.ok) {
          const d = await resp.json();
          const ents = d?.data?.entities || [];
          const startupEnts: AdminStartupRecord[] = ents
            .filter((e: any) => e.type === 'Startup')
            .map((e: any) => ({
              id: e.id,
              name: e.name,
              legalName: e.legalName || e.name,
              founderName: e.primaryOwner?.name || 'Founder',
              founderEmail: e.primaryOwner?.email || e.officialEmail || '',
              sector: 'Ecosystem Venture',
              stage: 'Seed / Early Stage',
              location: 'India',
              verificationStatus: e.verificationStatus === 'Verified' ? 'Verified' : 'Pending',
              visibility: 'Public',
              entitlementTier: e.entitlementTier || 'Startup Free',
              subscriptionPlan: e.entitlementTier || 'Startup Free',
              endorsements: [],
              ddLockerFilesCount: 4,
              status: 'Active',
              createdDate: e.createdDate || 'Recently',
            }));
          setStartups(startupEnts);
        }
      } catch (err) {
        console.warn('Could not load startups for ops view:', err);
      }
    };
    loadStartups();
  }, []);

  const filtered = startups.filter((s) => {
    if (activeTab === 'Verified' && s.verificationStatus !== 'Verified') return false;
    if (activeTab === 'Pending Verification' && s.verificationStatus !== 'Under Review' && s.verificationStatus !== 'Pending') return false;
    if (activeTab === 'Ghost Mode' && s.visibility !== 'Ghost Mode') return false;
    if (activeTab === 'Endorsed' && s.endorsements.length === 0) return false;
    if (activeTab === 'Pro Entitled' && !s.entitlementTier.includes('Pro')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.legalName.toLowerCase().includes(q) ||
        s.founderName.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Rocket className="w-3.5 h-3.5" />
            Startup Operations Control
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Startup Portfolio Operations
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Monitor and administer venture lifecycles, Ghost Mode visibility diagnostics, virtual DD locker telemetry, and ESP program endorsements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Startups</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">{startups.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">In Ghost Mode</div>
            <div className="text-lg font-bold font-sora text-purple-600 dark:text-purple-400">
              {startups.filter((s) => s.visibility === 'Ghost Mode').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['All', 'Verified', 'Pending Verification', 'Ghost Mode', 'Endorsed', 'Pro Entitled'] as const).map((tab) => (
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
          placeholder="Search by startup name, founder, legal entity, or sector..."
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
              <th className="py-3.5 px-4 font-semibold">Startup & Legal Entity</th>
              <th className="py-3.5 px-4 font-semibold">Sector & Stage</th>
              <th className="py-3.5 px-4 font-semibold">Visibility</th>
              <th className="py-3.5 px-4 font-semibold">Endorsements</th>
              <th className="py-3.5 px-4 font-semibold">Entitlement Tier</th>
              <th className="py-3.5 px-4 font-semibold">Ask / Valuation</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{s.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{s.legalName}</div>
                  <div className="text-[10px] text-gray-500">Founder: {s.founderName}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-[#101212] dark:text-white font-medium">{s.sector}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{s.stage} &bull; {s.location}</div>
                </td>
                <td className="py-3.5 px-4">
                  {s.visibility === 'Ghost Mode' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Ghost className="w-3.5 h-3.5" /> Ghost Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {s.visibility}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {s.endorsements.length > 0 ? (
                    <div className="space-y-0.5">
                      {s.endorsements.map((end, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-[#D9FF3F] font-medium">
                          <Award className="w-3 h-3" /> {end.espName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-[11px]">None</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-[#101212] dark:text-white">{s.entitlementTier}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{s.subscriptionPlan}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-mono text-[#101212] dark:text-white">{s.askAmount || 'N/A'}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Val: {s.valuation || 'Undisclosed'}</div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedStartup(s)}
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

      {/* Startup Detail Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Startup Operations File: {selectedStartup.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visibility Diagnostics */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#101212] dark:text-white">Discovery & Visibility Diagnostics:</span>
                <span className="text-emerald-700 dark:text-[#D9FF3F] font-mono font-medium">{selectedStartup.visibility}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-gray-100 dark:bg-black/20">
                  <span className="text-gray-500 dark:text-gray-400">Search Engine Discovery:</span>
                  <p className="font-semibold text-[#101212] dark:text-white">
                    {selectedStartup.visibility === 'Ghost Mode' ? 'Disabled (Stealth)' : 'Active'}
                  </p>
                </div>
                <div className="p-2 rounded bg-gray-100 dark:bg-black/20">
                  <span className="text-gray-500 dark:text-gray-400">AI Matching Sourcing:</span>
                  <p className="font-semibold text-[#101212] dark:text-white">
                    {selectedStartup.visibility === 'Ghost Mode' ? 'Disabled' : 'Active'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financials & DD Locker */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Ask & Valuation:</span>
                <p className="font-mono text-[#101212] dark:text-white text-sm font-bold">
                  {selectedStartup.askAmount} @ {selectedStartup.valuation}
                </p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">MRR: {selectedStartup.mrr || 'Pre-revenue'}</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Virtual DD Locker:</span>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {selectedStartup.ddLockerFilesCount} Protected Files
                </p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Watermarked & NDA Enforced</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStartup(null)}
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
