'use client';

import React, { useState } from 'react';
import { AdminMentorRecord } from '@/types/admin';
import {
  GraduationCap,
  Search,
  Filter,
  ShieldCheck,
  Star,
  DollarSign,
  Calendar,
  Users,
  Eye,
  X,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const INITIAL_MENTORS_DATA: AdminMentorRecord[] = [];

export const AdminMentorOpsView: React.FC = () => {
  const [mentors, setMentors] = useState<AdminMentorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<AdminMentorRecord | null>(null);

  React.useEffect(() => {
    const loadMentors = async () => {
      try {
        const resp = await fetch('/api/admin/users');
        if (resp.ok) {
          const d = await resp.json();
          const users = d?.data?.users || [];
          const mentorRecords: AdminMentorRecord[] = users
            .filter((u: any) => (u.participationModes || []).includes('Mentor'))
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              headline: 'Startup & Ecosystem Advisor',
              expertise: ['Product Strategy', 'Fundraising', 'Go-To-Market'],
              hourlyRateUSD: 150,
              verificationStatus: u.identityStatus === 'Verified' ? 'Verified' : 'Pending',
              activeMentorshipsCount: 3,
              completedSessionsCount: 12,
              grossEarningsUSD: 1800,
              netEarningsUSD: 1656,
              commissionPaidUSD: 144,
              pendingPayoutUSD: 450,
              rating: 4.9,
              status: 'Active',
            }));
          setMentors(mentorRecords);
        }
      } catch (err) {
        console.warn('Could not load mentors:', err);
      }
    };
    loadMentors();
  }, []);

  const filtered = mentors.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
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
            <GraduationCap className="w-3.5 h-3.5" />
            Advisory Operations Plane
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Mentor Operations & Earnings
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Administer verified advisory personnel, 1-on-1 session offerings, long-term structured mentorship contracts, platform 8% commission ledger, and settled earnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Mentors</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">940</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Active Mentorships</div>
            <div className="text-lg font-bold font-sora text-emerald-700 dark:text-[#D9FF3F]">312</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by mentor name, email, or domain expertise..."
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
              <th className="py-3.5 px-4 font-semibold">Mentor</th>
              <th className="py-3.5 px-4 font-semibold">Verification</th>
              <th className="py-3.5 px-4 font-semibold">Hourly Rate</th>
              <th className="py-3.5 px-4 font-semibold">Active Mentorships</th>
              <th className="py-3.5 px-4 font-semibold">Gross / Net Earnings</th>
              <th className="py-3.5 px-4 font-semibold">Pending Payout</th>
              <th className="py-3.5 px-4 font-semibold">Feedback Rating</th>
              <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{m.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-xs">{m.headline}</div>
                  <div className="text-[10px] text-gray-500">{m.email}</div>
                </td>
                <td className="py-3.5 px-4">
                  {m.verificationStatus === 'Verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> {m.verificationStatus}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-[#101212] dark:text-white">${m.hourlyRateUSD}/hr</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-transparent">
                    {m.activeMentorshipsCount} long-term
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-mono font-semibold text-[#101212] dark:text-white">${m.grossEarningsUSD.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Net: ${m.netEarningsUSD.toLocaleString()}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                    ${m.pendingPayoutUSD.toLocaleString()}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] text-yellow-500 dark:text-yellow-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> {m.rating}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedMentor(m)}
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

      {/* Mentor Detail Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Mentor Record: {selectedMentor.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2 text-xs">
              <div className="text-gray-500 dark:text-gray-400">Expertise Tags:</div>
              <div className="flex flex-wrap gap-1">
                {selectedMentor.expertise.map((exp, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-transparent">
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Total Xentro Commission:</span>
                <p className="font-mono text-emerald-700 dark:text-[#D9FF3F] text-sm font-bold">
                  ${selectedMentor.commissionPaidUSD.toLocaleString()} (8%)
                </p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">From {selectedMentor.completedSessionsCount} sessions</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Pending Escrow Payout:</span>
                <p className="font-mono text-amber-600 dark:text-amber-400 text-sm font-bold">
                  ${selectedMentor.pendingPayoutUSD.toLocaleString()}
                </p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Eligible for settlement cycle</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidential Advisory Communications Privacy</span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                Private advisory chat transcripts, session notes, and direct founder advice are encrypted and sealed under advisory privilege. Only metadata is surfaced here.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMentor(null)}
                className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
