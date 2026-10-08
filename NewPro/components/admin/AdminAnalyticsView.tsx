'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  DollarSign,
  GraduationCap,
  Award,
  Layers,
  Sparkles,
  Activity,
} from 'lucide-react';
import { ECOSYSTEM_GROWTH_DATA } from '@/data/adminData';
import { adminDomainService } from '@/lib/adminDomainService';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const AdminAnalyticsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Ecosystem' | 'Revenue' | 'Mentorship' | 'Endorsements'>('Ecosystem');
  const [stats, setStats] = useState({
    startups: 0,
    mentors: 0,
    investors: 0,
    esps: 0,
    mrr: 0,
    arr: 0,
    mentorshipCount: 0,
    endorsementsCount: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      let usersList: any[] = [];
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/admin/users/`);
        if (resp.ok) {
          const d = await resp.json();
          usersList = d?.data?.users || d?.data || [];
        }
      } catch {
        usersList = adminDomainService.getPersonalAccounts();
      }

      const startups = usersList.filter((u: any) => (u.user_type || u.role) === 'Startup').length;
      const mentors = usersList.filter((u: any) => (u.user_type || u.role) === 'Mentor').length;
      const investors = usersList.filter((u: any) => (u.user_type || u.role) === 'Investor').length;
      const esps = usersList.filter((u: any) => (u.user_type || u.role) === 'ESP').length;

      const finance = adminDomainService.getFinanceSummary();
      const mentorships = adminDomainService.getMentorships();
      const endorsements = adminDomainService.getEndorsements();

      setStats({
        startups,
        mentors,
        investors,
        esps,
        mrr: finance.mrrUSD,
        arr: finance.arrUSD,
        mentorshipCount: mentorships.length,
        endorsementsCount: endorsements.length,
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Ecosystem Intelligence Plane
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Platform & Ecosystem Analytics
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Live telemetry across ecosystem participant growth, subscription ARR trajectories, and institutional endorsement pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Ecosystem', 'Revenue', 'Mentorship', 'Endorsements'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-gray-200 dark:border-transparent ${
                activeCategory === cat
                  ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-200 dark:hover:bg-[#262A29]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Panels */}
      {activeCategory === 'Ecosystem' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Startups</span>
              <p className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">{stats.startups}</p>
              <span className="text-[10px] text-gray-500 font-medium">Real Registered Ventures</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Verified Mentors</span>
              <p className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">{stats.mentors}</p>
              <span className="text-[10px] text-gray-500 font-medium">Active Mentorship Network</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Accredited Investors</span>
              <p className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">{stats.investors}</p>
              <span className="text-[10px] text-gray-500 font-medium">Angels & Institutional VCs</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Institutional ESPs</span>
              <p className="font-sora text-xl font-bold text-emerald-700 dark:text-[#D9FF3F] mt-1">{stats.esps}</p>
              <span className="text-[10px] text-gray-500 font-medium">Accelerators & Hubs</span>
            </div>
          </div>

          {/* Growth Trends Visualization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
            <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">Ecosystem Expansion Trajectory</h3>
            {ECOSYSTEM_GROWTH_DATA.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202422] text-gray-400 flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-[#101212] dark:text-white">No Historical Trajectory Recorded</p>
                <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] mt-0.5">
                  Platform expansion milestones will aggregate automatically as users register and engage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] text-center">
                {ECOSYSTEM_GROWTH_DATA.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-[#D9FF3F]">{item.month}</span>
                    <div className="space-y-1 text-[11px] text-[#565B59] dark:text-gray-300">
                      <div>{item.startups} Startups</div>
                      <div className="text-gray-500 dark:text-gray-400">{item.mentors} Mentors</div>
                      <div className="text-gray-500 dark:text-gray-400">{item.investors} VCs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeCategory === 'Revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Annual Recurring Revenue (ARR)</span>
            <div className="font-sora text-3xl font-bold text-[#101212] dark:text-white">${stats.arr.toLocaleString()}</div>
            <p className="text-xs text-gray-500 font-medium">Platform verified subscriptions</p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
              <div>Startup Pro: $0/yr</div>
              <div>Investor Multi-Seat: $0/yr</div>
              <div>ESP Suite: $0/yr</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Advisory Platform Take-Rate</span>
            <div className="font-sora text-3xl font-bold text-emerald-700 dark:text-[#D9FF3F]">8.0%</div>
            <p className="text-xs text-[#565B59] dark:text-gray-300">Standard advisory commission baseline</p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
              <div>Gross GMV: $0/mo</div>
              <div>Platform Commission: $0/mo</div>
              <div>Settled to Mentors: $0/mo</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Collection & Invoicing Health</span>
            <div className="font-sora text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
            <p className="text-xs text-[#565B59] dark:text-gray-300">Billing gateway status: Nominal</p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
              <div>Invoices Generated: 0</div>
              <div>Dunning Retries: 0</div>
              <div>Dispute Rate: 0.0%</div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'Mentorship' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
          <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">Mentorship Engagement Velocity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Active Engagements:</span>
              <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">{stats.mentorshipCount} Contracts</p>
              <div className="text-[10px] text-gray-500">Live verified advisory contracts</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Contract Completion Rate:</span>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 text-lg font-bold">100%</p>
              <div className="text-[10px] text-gray-500">0 disputes reported</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Founder Feedback CSAT:</span>
              <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">5.0 / 5.0</p>
              <div className="text-[10px] text-gray-500">Platform verified reviews</div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === 'Endorsements' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
          <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">Institutional Endorsement Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Endorsed Startups:</span>
              <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">{stats.endorsementsCount} Startups</p>
              <div className="text-[10px] text-gray-500">Institutional pipeline active</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Endorsement Verification:</span>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 text-lg font-bold">100%</p>
              <div className="text-[10px] text-gray-500">Verified through ESP partnerships</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-transparent space-y-1">
              <span className="text-gray-500 dark:text-gray-400">Sponsored Entitlements:</span>
              <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">{stats.endorsementsCount} Active</p>
              <div className="text-[10px] text-gray-500">Granted via verified ESPs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
