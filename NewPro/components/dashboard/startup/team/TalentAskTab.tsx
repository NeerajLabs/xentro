'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Edit2,
  Pause,
  Play,
  XCircle,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  StartupTalentAsk,
  TalentApplicant,
  TalentAskStatus,
} from '@/types/startup';

interface TalentAskTabProps {
  asks: StartupTalentAsk[];
  applicants: TalentApplicant[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (ask: StartupTalentAsk) => void;
  onOpenPipelineModal: (askId?: string) => void;
  onChangeStatus: (askId: string, status: TalentAskStatus) => void;
  onDeleteAsk: (askId: string) => void;
}

export const TalentAskTab: React.FC<TalentAskTabProps> = ({
  asks,
  applicants,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenPipelineModal,
  onChangeStatus,
  onDeleteAsk,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const totalOpenings = asks.filter((a) => a.status === 'Open').length;
  const totalApplicants = applicants.length;
  const shortlistedCount = applicants.filter((a) => a.stage === 'Shortlisted' || a.stage === 'Selected').length;

  const filteredAsks = asks.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Metrics & Guidance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Active Talent Positions</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{totalOpenings}</span>
            <Briefcase className="w-4 h-4 text-[#D9FF3F]" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold">Live on Public Profile</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Total Applications</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{totalApplicants}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Across all open roles</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Shortlisted Candidates</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{shortlistedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready for interview / offer</div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white">Filter Status:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'open', 'paused', 'closed', 'draft'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPipelineModal()}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidate Pipeline ({applicants.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Talent Ask</span>
            </button>
          </div>
        </div>

        {/* Roles List */}
        {filteredAsks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Briefcase className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <div className="text-sm font-semibold">No talent asks matching filter</div>
            <p className="text-xs">Publish a new role to begin receiving community applications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAsks.map((ask) => {
              const askApplicants = applicants.filter((a) => a.talentAskId === ask.id);

              return (
                <div
                  key={ask.id}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                            {ask.roleType}
                          </span>
                          <span className="text-[10px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                            {ask.department}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              ask.status === 'Open'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : ask.status === 'Paused'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                            }`}
                          >
                            {ask.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white mt-1">
                          {ask.positionTitle}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(ask)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] transition-colors cursor-pointer"
                          title="Edit Position"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {ask.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-200/60 dark:border-[#262A29]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {ask.location} ({ask.workMode})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                          {ask.salaryRange || ask.compensationType}
                          {ask.equityRange ? ` + ${ask.equityRange}` : ''}
                        </span>
                      </div>
                    </div>

                    {ask.requiredSkills && ask.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ask.requiredSkills.slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            {s}
                          </span>
                        ))}
                        {ask.requiredSkills.length > 4 && (
                          <span className="text-[10px] text-gray-400 self-center">
                            +{ask.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Metrics Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 dark:border-[#262A29] text-[11px]">
                    <div className="flex items-center gap-3 text-gray-400">
                      <span>{ask.viewsCount} views</span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {askApplicants.length} applicants
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ask.status === 'Open' ? (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(ask.id, 'Paused')}
                          className="px-2.5 py-1 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-[11px] font-semibold cursor-pointer"
                        >
                          Pause
                        </button>
                      ) : ask.status === 'Paused' ? (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(ask.id, 'Open')}
                          className="px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-[11px] font-semibold cursor-pointer"
                        >
                          Resume
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onOpenPipelineModal(ask.id)}
                        className="px-3 py-1 rounded-lg bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span>Candidates ({askApplicants.length})</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
