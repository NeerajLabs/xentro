'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  Award,
  Layers,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  DollarSign,
  FileText,
  Cpu,
  ShieldCheck,
  Check,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { mockESPDashboard } from '@/data/dashboardData';
import { UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

interface ESPOverviewProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
  onPreviewProfile?: () => void;
}

export const ESPOverview: React.FC<ESPOverviewProps> = ({
  profile,
  onNavigateTab,
  onPreviewProfile,
}) => {
  const { showToast } = useToast();
  const [applicationQueue, setApplicationQueue] = useState(mockESPDashboard.applicationQueue);
  const data = mockESPDashboard;

  const handleStatusChange = (id: string, newStatus: 'Shortlisted' | 'Interview Scheduled' | 'Offered') => {
    setApplicationQueue((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    showToast(`Candidate marked as "${newStatus}"`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Quick Operational Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#181B1A] to-lime-950/20 border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#101212] dark:text-white">
                Institutional Workspace Active
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Verified ESP
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Managing programs, endorsements, student members, and ecosystem allocations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewProfile && (
            <button
              onClick={onPreviewProfile}
              className="px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Public Profile</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab && onNavigateTab('endorsements')}
            className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Endorse Startup</span>
          </button>
        </div>
      </div>

      {/* 1. Top 4 ESP KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Incubated Startups</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {data.stats.incubatedStartups}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              Total Alumni
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {data.stats.activeCohortSize} in current live cohort
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Applications Received</span>
            <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {data.stats.applicationsReceived}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              +38 new
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Cohort 2026 application cycle
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Funding Facilitated</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {data.stats.fundingFacilitated}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Raised by Startups
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Via government grants & angels
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Facility Occupancy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {data.stats.labOccupancyPercent}%
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Optimal
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            GPU nodes & cleanroom labs
          </p>
        </div>
      </div>

      {/* 2. Middle Grid: Active Cohort Timeline & Application Evaluation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cohort Application Queue (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Cohort Application Evaluation Queue
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Review inbound applications for incubation admission and grant allocation
              </p>
            </div>
            <span className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F]">
              {applicationQueue.length} In Review
            </span>
          </div>

          <div className="space-y-3">
            {applicationQueue && applicationQueue.length > 0 ? (
              applicationQueue.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-[#D9FF3F]/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                        {app.startupName}
                      </h4>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                        Match Score: {app.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      Founders: {app.founders} &bull; {app.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      app.status === 'Shortlisted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : app.status === 'Interview Scheduled'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {app.status}
                    </span>

                    {app.status !== 'Shortlisted' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Shortlisted')}
                        className="px-3 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        Shortlist
                      </button>
                    )}
                    {app.status === 'Shortlisted' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'Interview Scheduled')}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-[#101212] dark:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
                      >
                        Schedule Interview
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-[#202422] rounded-xl border border-dashed border-gray-200 dark:border-[#262A29]">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#101212] dark:text-white">No cohort applications in review</p>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">Inbound applications from startup founders will appear here for evaluation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cohort Live Status (1 Column) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Current Cohort Status
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {data.cohortTimeline.cohortName}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Cohort Progress:</span>
              <span className="font-bold text-[#101212] dark:text-white">
                Week {data.cohortTimeline.currentWeek} of {data.cohortTimeline.totalWeeks}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#202422] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#D9FF3F] h-full rounded-full transition-all duration-500"
                style={{ width: `${(data.cohortTimeline.currentWeek / data.cohortTimeline.totalWeeks) * 100}%` }}
              />
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                Next Major Milestone:
              </span>
              <p className="text-xs font-bold text-[#101212] dark:text-white">
                {data.cohortTimeline.nextMilestone}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                Demo Day: {data.cohortTimeline.demoDayDate}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('programs')}
              className="w-full py-2 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <span>Manage Cohorts & Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Facility & Lab Resource Allocation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Incubation Infrastructure & Lab Resource Allocation
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Shared physical laboratories, computing clusters, and mentor office hours
            </p>
          </div>
          <button
            onClick={() => showToast('Managing resource allocation...', 'info')}
            className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Capacity</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.resourceAllocation.map((res, idx) => {
            const pct = Math.round((res.allocated / res.total) * 100);
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
              >
                <h5 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                  {res.resource}
                </h5>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-lg text-[#101212] dark:text-white">
                    {res.allocated} / {res.total}
                  </span>
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">
                    {pct}% ({res.unit})
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D9FF3F] h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
