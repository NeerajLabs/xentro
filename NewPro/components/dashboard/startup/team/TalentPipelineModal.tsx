'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ArrowRight,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Filter,
  Briefcase,
  Star,
  Check,
} from 'lucide-react';
import {
  TalentApplicant,
  TalentApplicantStage,
  StartupTalentAsk,
  TeamCategory,
  StartupDashboardRole,
} from '@/types/startup';

interface TalentPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  asks: StartupTalentAsk[];
  selectedAskId?: string;
  applicants: TalentApplicant[];
  onMoveStage: (applicantId: string, newStage: TalentApplicantStage) => void;
  onConvertToMember: (
    applicantId: string,
    options: {
      teamCategory: TeamCategory;
      designation: string;
      department?: string;
      dashboardAccessEnabled: boolean;
      dashboardRole?: StartupDashboardRole;
      publicProfileVisible: boolean;
    }
  ) => void;
}

const ALL_STAGES: TalentApplicantStage[] = [
  'Interested',
  'Applied',
  'Reviewing',
  'Shortlisted',
  'Interview',
  'Selected',
  'Joined Team',
];

export const TalentPipelineModal: React.FC<TalentPipelineModalProps> = ({
  isOpen,
  onClose,
  asks,
  selectedAskId,
  applicants,
  onMoveStage,
  onConvertToMember,
}) => {
  const [filterAskId, setFilterAskId] = useState<string>(selectedAskId || 'all');
  const [activeStageFilter, setActiveStageFilter] = useState<TalentApplicantStage | 'all'>('all');

  // Conversion wizard modal state
  const [convertingApplicant, setConvertingApplicant] = useState<TalentApplicant | null>(null);
  const [convertCategory, setConvertCategory] = useState<TeamCategory>('core_team');
  const [convertDesignation, setConvertDesignation] = useState('');
  const [convertDepartment, setConvertDepartment] = useState('Engineering');
  const [convertDashboardAccess, setConvertDashboardAccess] = useState(false);
  const [convertDashboardRole, setConvertDashboardRole] = useState<StartupDashboardRole>('team_member');
  const [convertPublicVisible, setConvertPublicVisible] = useState(true);

  if (!isOpen) return null;

  const filteredApplicants = applicants.filter((a) => {
    const matchesAsk = filterAskId === 'all' || a.talentAskId === filterAskId;
    const matchesStage = activeStageFilter === 'all' || a.stage === activeStageFilter;
    return matchesAsk && matchesStage;
  });

  const handleStartConversion = (app: TalentApplicant) => {
    setConvertingApplicant(app);
    setConvertDesignation(app.roleAppliedFor);
    setConvertCategory('core_team');
    setConvertDepartment('Engineering');
    setConvertDashboardAccess(false);
    setConvertDashboardRole('team_member');
    setConvertPublicVisible(true);
  };

  const handleFinishConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingApplicant) return;

    onConvertToMember(convertingApplicant.id, {
      teamCategory: convertCategory,
      designation: convertDesignation || convertingApplicant.roleAppliedFor,
      department: convertDepartment,
      dashboardAccessEnabled: convertDashboardAccess,
      dashboardRole: convertDashboardAccess ? convertDashboardRole : undefined,
      publicProfileVisible: convertPublicVisible,
    });

    setConvertingApplicant(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
        <div className="relative w-full max-w-5xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Talent Application Pipeline & Candidates
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Manage applicants through discovery, review, interview, and formal team onboarding.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterAskId}
                onChange={(e) => setFilterAskId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
              >
                <option value="all">All Talent Positions</option>
                {asks.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.positionTitle} ({a.roleType})
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stage Filter Tabs */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-[#262A29] flex items-center gap-2 overflow-x-auto bg-gray-50/50 dark:bg-[#151716]">
            <button
              onClick={() => setActiveStageFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeStageFilter === 'all'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              All Stages ({applicants.length})
            </button>
            {ALL_STAGES.map((stg) => {
              const count = applicants.filter((a) => a.stage === stg).length;
              return (
                <button
                  key={stg}
                  onClick={() => setActiveStageFilter(stg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeStageFilter === stg
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                      : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  <span>{stg}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Body List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {filteredApplicants.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                <div className="text-sm font-semibold">No applicants found in this stage</div>
                <p className="text-xs">Candidates applying to your published Talent Asks will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApplicants.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={app.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={app.candidateName}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-gray-200 dark:border-[#262A29]"
                      />
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                            {app.candidateName}
                          </h4>
                          {app.xentroHandle && (
                            <span className="text-[11px] font-mono text-[#565B59] dark:text-[#D9FF3F]">
                              {app.xentroHandle}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {app.stage}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#101212] dark:text-white">
                          Applied for: <span className="text-blue-600 dark:text-[#D9FF3F]">{app.roleAppliedFor}</span>
                        </p>

                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                          {app.experience}
                        </p>

                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {app.skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-200 dark:border-[#262A29]">
                      <select
                        value={app.stage}
                        onChange={(e) => onMoveStage(app.id, e.target.value as TalentApplicantStage)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white focus:outline-hidden"
                      >
                        {ALL_STAGES.map((s) => (
                          <option key={s} value={s}>
                            Stage: {s}
                          </option>
                        ))}
                      </select>

                      {app.stage === 'Selected' && (
                        <button
                          type="button"
                          onClick={() => handleStartConversion(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add to Team</span>
                        </button>
                      )}

                      {app.stage === 'Joined Team' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined Team</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONVERT SELECTED APPLICANT TO TEAM MEMBER MODAL */}
      {convertingApplicant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#D9FF3F]/40 rounded-3xl p-6 shadow-2xl text-[#101212] dark:text-white space-y-5 animate-scale-up">
            <button
              onClick={() => setConvertingApplicant(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#202422] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Convert Candidate to Startup Member
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Onboarding candidate: <span className="font-bold text-[#101212] dark:text-white">{convertingApplicant.candidateName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleFinishConversion} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Designation / Venture Role
                </label>
                <input
                  type="text"
                  required
                  value={convertDesignation}
                  onChange={(e) => setConvertDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Team Category
                  </label>
                  <select
                    value={convertCategory}
                    onChange={(e) => setConvertCategory(e.target.value as TeamCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                  >
                    <option value="core_team">Core Team</option>
                    <option value="leadership">Leadership</option>
                    <option value="founder">Founder / Co-Founder</option>
                    <option value="advisor">Advisor</option>
                    <option value="intern">Intern</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={convertDepartment}
                    onChange={(e) => setConvertDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  />
                </div>
              </div>

              {/* Public visibility toggle */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#101212] dark:text-white">Show on Public Profile</div>
                  <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">Display on venture public page</div>
                </div>
                <input
                  type="checkbox"
                  checked={convertPublicVisible}
                  onChange={(e) => setConvertPublicVisible(e.target.checked)}
                  className="rounded text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F] w-4 h-4"
                />
              </div>

              {/* Dashboard Access toggle */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#101212] dark:text-white">Enable Workspace Dashboard Access</div>
                    <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">Allow candidate to operate dashboard modules</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={convertDashboardAccess}
                    onChange={(e) => setConvertDashboardAccess(e.target.checked)}
                    className="rounded text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F] w-4 h-4"
                  />
                </div>

                {convertDashboardAccess && (
                  <div className="pt-2 border-t border-gray-200 dark:border-[#262A29]">
                    <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                      Assigned Role Preset
                    </label>
                    <select
                      value={convertDashboardRole}
                      onChange={(e) => setConvertDashboardRole(e.target.value as StartupDashboardRole)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                    >
                      <option value="team_member">Team Member (General Contributor)</option>
                      <option value="operations">Operations</option>
                      <option value="finance">Finance</option>
                      <option value="admin">Admin</option>
                      <option value="advisor">Advisor</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertingApplicant(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Onboard Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
