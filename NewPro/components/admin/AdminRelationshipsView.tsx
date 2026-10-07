'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminRelationshipRecord,
  AdminMentorshipRecord,
  AdminEndorsementRecord,
  EcosystemRelationshipType,
} from '@/types/admin';
import { adminDomainService, INITIAL_RELATIONSHIPS } from '@/lib/adminDomainService';
import {
  Network,
  Search,
  Filter,
  GraduationCap,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  X,
  FileCheck,
  Lock,
} from 'lucide-react';

export const AdminRelationshipsView: React.FC = () => {
  const [relationships, setRelationships] = useState<AdminRelationshipRecord[]>(INITIAL_RELATIONSHIPS);
  const [mentorships, setMentorships] = useState<AdminMentorshipRecord[]>([]);
  const [endorsements, setEndorsements] = useState<AdminEndorsementRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'Relationship Graph' | 'Mentorship Engagements' | 'ESP Endorsements'>('Relationship Graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setRelationships(adminDomainService.getRelationships());
    setMentorships(adminDomainService.getMentorships());
    setEndorsements(adminDomainService.getEndorsements());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('xentro-admin-updated', handleUpdate);
    return () => window.removeEventListener('xentro-admin-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApproveEndorsement = (e: AdminEndorsementRecord) => {
    const ok = adminDomainService.approveEndorsement(e.id);
    if (ok) {
      showToast(`Endorsement for ${e.startupName} by ${e.espName} approved! Startup Pro entitlement granted.`);
    }
  };

  const getRelBadge = (type: EcosystemRelationshipType) => {
    switch (type) {
      case 'Founder Of':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Founder Of</span>;
      case 'Mentors':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Mentors</span>;
      case 'Invested In':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Invested In</span>;
      case 'Incubated By':
      case 'Accelerated By':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-300 dark:border-[#D9FF3F]/20">{type}</span>;
      case 'Endorsed By':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Endorsed By</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-500 dark:text-gray-400">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#101212] text-white border border-[#D9FF3F]/30 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Network className="w-3.5 h-3.5" />
            Ecosystem Topology & Contracts
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Relationships, Mentorships & Endorsements
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Distinguishes across 11 granular ecosystem edge types (Invested In, Mentors, Incubated By, Founder Of, Endorsed By) rather than collapsing them into generic social connections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Active Mentorships</div>
            <div className="text-lg font-bold font-sora text-emerald-700 dark:text-[#D9FF3F]">{mentorships.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">ESP Endorsements</div>
            <div className="text-lg font-bold font-sora text-emerald-600 dark:text-emerald-400">{endorsements.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['Relationship Graph', 'Mentorship Engagements', 'ESP Endorsements'] as const).map((tab) => (
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

      {/* Tab 1: Relationship Graph */}
      {activeTab === 'Relationship Graph' && (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                <th className="py-3.5 px-4 font-semibold">Origin Entity/Person</th>
                <th className="py-3.5 px-4 font-semibold text-center">Relationship Edge</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity/Person</th>
                <th className="py-3.5 px-4 font-semibold">Edge State</th>
                <th className="py-3.5 px-4 font-semibold text-right">Established</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {relationships.map((rel) => (
                <tr key={rel.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{rel.sourceName}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{rel.sourceType} &bull; {rel.sourceId}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {getRelBadge(rel.relationshipType)}
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{rel.targetName}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{rel.targetType} &bull; {rel.targetId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-500 dark:text-gray-400 font-mono">{rel.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Mentorship Engagements */}
      {activeTab === 'Mentorship Engagements' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center justify-between">
            <div>
              <strong className="text-[#101212] dark:text-white">Structured Mentorship Contract Trace:</strong>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Startup Requests &rarr; Mentor Accepts &rarr; Escrow Payment Confirmed &rarr; Mentorship Activated &rarr; 8% Commission Recorded &rarr; Payout Settled.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-transparent">
              Commission: 8% Flat
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Mentorship Contract</th>
                  <th className="py-3.5 px-4 font-semibold">Mentor & Startup</th>
                  <th className="py-3.5 px-4 font-semibold">Contract Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Contract Price / Commission</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Escrow Payment</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Next Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {mentorships.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{m.packageName}</div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">ID: {m.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{m.mentorName}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Startup: {m.startupName} ({m.founderName})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[#565B59] dark:text-gray-300 font-medium">{m.durationMonths} months</span>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{m.startDate} &rarr; {m.endDate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#101212] dark:text-white">${m.priceUSD.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-700 dark:text-[#D9FF3F]">Fee: ${m.xentroCommissionUSD} | Net: ${m.netMentorAmountUSD}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-transparent">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{m.paymentStatus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500 dark:text-gray-400 font-mono">
                      {m.nextMeetingDate || 'None Scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: ESP Endorsements */}
      {activeTab === 'ESP Endorsements' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/5 border border-emerald-200 dark:border-[#D9FF3F]/20 text-xs text-[#565B59] dark:text-[#A0A4A2]">
            <p>
              Institutional endorsements by verified ESPs (Incubators, Accelerators) grant startups sponsored Startup Pro entitlements.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Endorsed Startup</th>
                  <th className="py-3.5 px-4 font-semibold">Endorsing ESP</th>
                  <th className="py-3.5 px-4 font-semibold">Relationship Type & Cohort</th>
                  <th className="py-3.5 px-4 font-semibold">Tenure</th>
                  <th className="py-3.5 px-4 font-semibold">Pro Entitlement</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {endorsements.map((end) => (
                  <tr key={end.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#101212] dark:text-white">{end.startupName}</td>
                    <td className="py-3.5 px-4 font-medium text-emerald-700 dark:text-[#D9FF3F]">{end.espName}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#101212] dark:text-white font-medium">{end.relationshipType}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{end.programCohort}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-gray-300 font-mono text-[11px]">
                      {end.startDate} &rarr; {end.endDate}
                    </td>
                    <td className="py-3.5 px-4">
                      {end.entitlementGranted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Granted (Pro Active)
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-[11px]">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {end.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {end.status === 'Pending' && (
                        <button
                          onClick={() => handleApproveEndorsement(end)}
                          className="px-3 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
                        >
                          Approve Endorsement
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
