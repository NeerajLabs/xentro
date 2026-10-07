'use client';

import React from 'react';
import {
  TrendingUp,
  PieChart,
  BarChart2,
  Layers,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  DollarSign,
} from 'lucide-react';

export const InvestorAnalytics: React.FC = () => {
  const funnelStages = [
    { stage: 'Inbound Pitches', count: 142, percentage: '100%', color: 'bg-gray-400' },
    { stage: 'Screened & Triage', count: 48, percentage: '33.8%', color: 'bg-blue-500' },
    { stage: 'Partner Pitches', count: 18, percentage: '12.6%', color: 'bg-indigo-500' },
    { stage: 'Deep Diligence', count: 6, percentage: '4.2%', color: 'bg-purple-500' },
    { stage: 'Term Sheets Issued', count: 3, percentage: '2.1%', color: 'bg-pink-500' },
    { stage: 'Cheques Deployed', count: 2, percentage: '1.4%', color: 'bg-emerald-500' },
  ];

  const sectorAllocations = [
    { sector: 'Enterprise AI & Autonomous Agents', percentage: 42, amount: '$3.55M', count: 7, color: 'bg-[#D9FF3F]' },
    { sector: 'Silicon & DeepTech Hardware', percentage: 26, amount: '$2.20M', count: 4, color: 'bg-purple-500' },
    { sector: 'FinTech & Capital Markets', percentage: 18, amount: '$1.52M', count: 4, color: 'bg-blue-500' },
    { sector: 'HealthTech & Precision Biotech', percentage: 14, amount: '$1.18M', count: 3, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
        <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
          <span>Venture Telemetry & Deal Flow Conversion Analytics</span>
        </h2>
        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
          Conversion pipeline throughput, sector allocation concentration, and turnaround velocity
        </p>
      </div>

      {/* 2. Top Funnel Metrics */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
            Pipeline Conversion Funnel (Last 12 Months)
          </h3>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Top-Decile 1.4% Acceptance Rate
          </span>
        </div>

        <div className="space-y-3">
          {funnelStages.map((stg) => (
            <div key={stg.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#101212] dark:text-white">
                  {stg.stage}
                </span>
                <span className="text-gray-400 font-mono">
                  {stg.count} ventures ({stg.percentage})
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-[#202422] overflow-hidden">
                <div
                  className={`h-full rounded-full ${stg.color} transition-all duration-500`}
                  style={{ width: stg.percentage }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Grid: Sector Allocations & Velocity Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
              Capital Concentration by Sector
            </h3>
            <span className="text-[11px] font-bold text-gray-400">Apex Fund II</span>
          </div>

          <div className="space-y-3">
            {sectorAllocations.map((sec) => (
              <div
                key={sec.sector}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${sec.color}`} />
                    <span className="font-bold text-[#101212] dark:text-white">
                      {sec.sector}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {sec.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{sec.percentage}% Fund Allocation</span>
                  <span>{sec.count} portfolio ventures</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Turnaround & Operational Velocity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
              Operational Deal Velocity Telemetry
            </h3>
            <span className="text-[11px] font-bold text-[#D9FF3F]">Real-Time SLA</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-gray-400 block">Avg Triage Response Time</span>
                <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  1.8 Days
                </span>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  94% of inbound decks reviewed within 48 hours
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-gray-400 block">Partner Meeting to Term Sheet</span>
                <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  14.2 Days
                </span>
                <p className="text-[10px] text-gray-400">
                  Fastest close: 6 days (Turnaround for qualified deals)
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-gray-400 block">Founder Net Promoter Score (NPS)</span>
                <span className="text-xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
                  +88 NPS
                </span>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Rated by 32 pitched founders on transparency & speed
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
