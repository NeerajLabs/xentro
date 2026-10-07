'use client';

import React from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  Cpu,
  Users,
  Target,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { espProfilesData } from '@/data/espProfilesData';

export const ESPAnalyticsManager: React.FC = () => {
  const { showToast } = useToast();
  const esp = espProfilesData['uni_9'];
  const stats = esp.impact.stats;

  const handleExportData = () => {
    showToast('Exporting institutional ecosystem impact report (CSV & PDF)...', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Export */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Ecosystem Impact & Venture Analytics
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Cumulative cohort outcomes, capital facilitation, patents, and job creation metrics.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* 1. Core KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Capital Facilitated
          </span>
          <p className="text-2xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
            {stats.fundingRaised}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Across seed & venture rounds
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Total Startups Supported
          </span>
          <p className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {stats.startupsSupported}+
          </p>
          <p className="text-[11px] text-emerald-500 font-semibold">
            {stats.activeStartups} active in campus
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Patents & Commercial IP
          </span>
          <p className="text-2xl font-bold font-sora text-cyan-500">
            {stats.patentsFiled}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Published with institutional priority
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Jobs Created
          </span>
          <p className="text-2xl font-bold font-sora text-[#D9FF3F]">
            {stats.jobsCreated}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            High-skill technology roles
          </p>
        </div>
      </div>

      {/* 2. Program Outcomes Breakdown */}
      {esp.impact.programOutcomes && esp.impact.programOutcomes.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D9FF3F]" />
            <span>Cohort Performance & Survival Outcomes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {esp.impact.programOutcomes.map((out) => (
              <div
                key={out.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#101212] dark:text-white">{out.programName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                    {out.cohortYear}
                  </span>
                </div>
                <div className="space-y-1 text-[#565B59] dark:text-[#B6B8B7]">
                  <div className="flex justify-between">
                    <span>Admitted / Graduated:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{out.startupsSelected} / {out.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funded Ventures:</span>
                    <span className="font-bold text-emerald-500">{out.fundedCount} Startups</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capital Facilitated:</span>
                    <span className="font-bold text-[#D9FF3F]">{out.cumulativeFunding}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise Pilots:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{out.corporatePilots}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
