'use client';

import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Users,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  ExternalLink,
  Layers,
  FileText,
  UserCheck,
  Filter,
  Search,
  Check,
  Ban,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { espProfilesData } from '@/data/espProfilesData';
import {
  mockESPApplications,
  mockESPParticipants,
} from '@/data/espWorkspaceData';
import { ESPProgram, ProgramType, ESPApplication, ESPParticipant } from '@/types/esp';

interface ESPProgramsManagerProps {
  initialSubTab?: 'programs' | 'cohorts' | 'applications' | 'participants';
  onNavigateTab?: (tabId: string) => void;
}

export const ESPProgramsManager: React.FC<ESPProgramsManagerProps> = ({
  initialSubTab = 'programs',
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const esp = espProfilesData['uni_9'];
  const [activeMainTab, setActiveMainTab] = useState<'programs' | 'cohorts' | 'applications' | 'participants'>(initialSubTab);

  // Programs state
  const [programs, setPrograms] = useState<ESPProgram[]>(esp.programs);
  const [activeCategory, setActiveCategory] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<ESPApplication[]>(mockESPApplications);
  const [appFilter, setAppFilter] = useState<'all' | 'Under Review' | 'Shortlisted' | 'Interviewed' | 'Accepted' | 'Rejected'>('all');
  const [appSearch, setAppSearch] = useState('');

  // Participants state
  const [participants, setParticipants] = useState<ESPParticipant[]>(mockESPParticipants);
  const [partSearch, setPartSearch] = useState('');

  // New program form state
  const [newProgName, setNewProgName] = useState('');
  const [newProgType, setNewProgType] = useState<ProgramType>('Accelerator');
  const [newProgDuration, setNewProgDuration] = useState('12 Weeks');
  const [newProgCohortSize, setNewProgCohortSize] = useState('20 Startups');
  const [newProgFunding, setNewProgFunding] = useState('₹25 Lakhs Grant Support');
  const [newProgEquity, setNewProgEquity] = useState('0% Equity (Non-Dilutive)');
  const [newProgDesc, setNewProgDesc] = useState('');

  const filteredPrograms = programs.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const filteredApplications = applications.filter((app) => {
    if (appFilter !== 'all' && app.status !== appFilter) return false;
    if (!appSearch) return true;
    const q = appSearch.toLowerCase();
    return (
      app.startupName.toLowerCase().includes(q) ||
      app.founderName.toLowerCase().includes(q) ||
      app.sector.toLowerCase().includes(q)
    );
  });

  const filteredParticipants = participants.filter((part) => {
    if (!partSearch) return true;
    const q = partSearch.toLowerCase();
    return (
      part.startupName.toLowerCase().includes(q) ||
      part.founderName.toLowerCase().includes(q) ||
      part.cohort.toLowerCase().includes(q) ||
      (part.assignedMentor && part.assignedMentor.toLowerCase().includes(q))
    );
  });

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName) return;

    const newProgram: ESPProgram = {
      id: `prog_created_${Date.now()}`,
      name: newProgName,
      type: newProgType,
      category: 'active',
      status: 'Open',
      startupStage: 'Seed to Early Revenue',
      sectors: ['DeepTech', 'Enterprise AI', 'ClimateTech'],
      locationMode: 'Hybrid',
      duration: newProgDuration,
      applicationDeadline: 'Dec 31, 2026',
      cohortSize: newProgCohortSize,
      fundingGrantAvailable: newProgFunding,
      equityRequirement: newProgEquity,
      shortDescription: newProgDesc || 'Institutional flagship cohort empowering high-impact ventures.',
      fullDetails: 'Full acceleration curriculum including executive office hours and venture capital showcase.',
      eligibility: ['Functional MVP', 'Full-time founders', 'Clean incorporation'],
    };

    setPrograms([newProgram, ...programs]);
    setIsCreateModalOpen(false);
    showToast(`Created new program "${newProgName}"!`, 'success');

    setNewProgName('');
    setNewProgDesc('');
  };

  const handleBulkEndorseCohort = (progName: string) => {
    showToast(`Batch endorsement triggered for enrolled cohort ventures in ${progName}!`, 'success');
  };

  const handleUpdateAppStatus = (appId: string, newStatus: ESPApplication['status']) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    showToast(`Application status updated to "${newStatus}"!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Programs & Cohort Operations
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {programs.length} Programs • {applications.length} Applications
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage innovation programs, active batches, incoming applicant pipelines, and enrolled founders.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Program</span>
        </button>
      </div>

      {/* Sub-Navigation (Programs, Cohorts, Applications, Participants) */}
      <div className="bg-white dark:bg-[#181B1A] p-1.5 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'programs' as const, label: 'Programs', icon: Target, count: programs.length },
          { id: 'cohorts' as const, label: 'Cohorts', icon: Layers, count: 3 },
          { id: 'applications' as const, label: 'Applications', icon: FileText, count: applications.length, alert: applications.filter(a => a.status === 'Under Review').length },
          { id: 'participants' as const, label: 'Participants', icon: UserCheck, count: participants.length },
        ].map((tab) => {
          const isActive = activeMainTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#101212] text-white dark:bg-white dark:text-[#101212] shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#101212]'
                      : 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.alert ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROGRAMS */}
      {activeMainTab === 'programs' && (
        <div className="space-y-5 animate-fade-slide">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] w-fit">
            {(['all', 'active', 'upcoming', 'past'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7]'
                }`}
              >
                {cat === 'all' ? 'All Programs' : `${cat} Programs`}
              </button>
            ))}
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      prog.status === 'Open'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : prog.status === 'Upcoming'
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        : 'bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30'
                    }`}>
                      {prog.status}
                    </span>
                    <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                      {prog.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 line-clamp-2">
                      {prog.shortDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs">
                    <div>
                      <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Duration:</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{prog.duration}</span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Cohort Size:</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{prog.cohortSize}</span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Grant/Funding:</span>
                      <span className="font-semibold text-[#D9FF3F]">{prog.fundingGrantAvailable}</span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Equity Terms:</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{prog.equityRequirement}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleBulkEndorseCohort(prog.name)}
                    className="px-3 py-1.5 rounded-lg bg-[#D9FF3F]/10 hover:bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bulk Endorse Cohort</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab('applications')}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[#101212] dark:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Applications</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COHORTS */}
      {activeMainTab === 'cohorts' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Lab32 Cohort 12',
                program: 'Lab32 Market Readiness Accelerator',
                stage: 'Active Sprint (Week 8 of 12)',
                count: '16 Startups',
                demoDay: 'Nov 20, 2026',
                health: '94% On Track',
                healthColor: 'text-emerald-500',
              },
              {
                title: 'Aero Cohort 2026',
                program: 'Boeing Aviation Innovation Challenge',
                stage: 'POC Validation Stage',
                count: '8 Startups',
                demoDay: 'Dec 05, 2026',
                health: '100% On Track',
                healthColor: 'text-emerald-500',
              },
              {
                title: 'T-Angel Cohort 8',
                program: 'T-Angel Seed Investment Cohort',
                stage: 'Investor Pitch Prep',
                count: '12 Startups',
                demoDay: 'Nov 10, 2026',
                health: '88% On Track',
                healthColor: 'text-amber-500',
              },
            ].map((c, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {c.title}
                  </span>
                  <span className={`text-xs font-bold ${c.healthColor}`}>{c.health}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">{c.program}</h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">{c.stage}</p>
                </div>
                <div className="space-y-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div className="flex justify-between">
                    <span>Enrolled Ventures:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{c.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demo Day:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{c.demoDay}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBulkEndorseCohort(c.title)}
                  className="w-full py-2 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-[#D9FF3F] hover:text-[#101212] text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F] group-hover:text-black" />
                  <span>Grant Batch Endorsements</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPLICATIONS */}
      {activeMainTab === 'applications' && (
        <div className="space-y-4 animate-fade-slide">
          {/* Filters & Search */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search startup or founder..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {(['all', 'Under Review', 'Shortlisted', 'Interviewed', 'Accepted', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAppFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    appFilter === st
                      ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212]'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-[#202422]/60 border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] font-semibold">
                    <th className="p-3.5">Startup & Founder</th>
                    <th className="p-3.5">Target Program</th>
                    <th className="p-3.5">Stage & Sector</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#101212] dark:text-white">{app.startupName}</div>
                        <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{app.founderName} • {app.founderEmail}</div>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <span className="font-medium text-[#101212] dark:text-white truncate block">{app.programName}</span>
                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Applied {app.appliedDate}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-gray-300 mr-1.5">
                          {app.stage}
                        </span>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{app.sector}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {app.score}/100
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Accepted'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : app.status === 'Shortlisted'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                            : app.status === 'Interviewed'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : app.status === 'Rejected'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'Shortlisted')}
                            title="Shortlist"
                            className="p-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-600 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'Accepted')}
                            title="Accept into Cohort"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'Rejected')}
                            title="Reject"
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARTICIPANTS */}
      {activeMainTab === 'participants' && (
        <div className="space-y-4 animate-fade-slide">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search participant founder or mentor..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
            <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
              {filteredParticipants.length} Active Enrolled Founders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParticipants.map((part) => (
              <div
                key={part.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#101212] dark:text-white">{part.startupName}</h4>
                    <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">{part.founderName} ({part.founderEmail})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {part.cohort}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div className="flex justify-between">
                    <span>Program Track:</span>
                    <span className="font-semibold text-[#101212] dark:text-white">{part.programName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Mentor:</span>
                    <span className="font-semibold text-[#101212] dark:text-white">{part.assignedMentor || 'Pending Assignment'}</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Milestone Progress:</span>
                      <span className="font-bold text-[#D9FF3F]">{part.milestoneProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-[#202422] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#D9FF3F] h-full rounded-full" style={{ width: `${part.milestoneProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PROGRAM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">Create Innovation Program</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Program Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab32 ClimateTech Accelerator 2027"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Program Type</label>
                  <select
                    value={newProgType}
                    onChange={(e) => setNewProgType(e.target.value as ProgramType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Accelerator">Accelerator</option>
                    <option value="Incubation">Incubation</option>
                    <option value="Pre-Incubation">Pre-Incubation</option>
                    <option value="Challenge">Challenge</option>
                    <option value="Grant">Grant</option>
                    <option value="Corporate Innovation Program">Corporate Innovation Program</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Duration</label>
                  <input
                    type="text"
                    value={newProgDuration}
                    onChange={(e) => setNewProgDuration(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Cohort Size</label>
                  <input
                    type="text"
                    value={newProgCohortSize}
                    onChange={(e) => setNewProgCohortSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Funding / Grant</label>
                  <input
                    type="text"
                    value={newProgFunding}
                    onChange={(e) => setNewProgFunding(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Description & Objectives</label>
                <textarea
                  rows={3}
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  placeholder="Outline curriculum, corporate pilots, and investor showcases..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Launch Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
