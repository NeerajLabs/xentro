'use client';

import React, { useState } from 'react';
import {
  Award,
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react';
import { StartupTeamMember } from '@/types/startup';

interface AdvisorsMentorsTabProps {
  members: StartupTeamMember[];
  onOpenAddModal: () => void;
  onOpenMemberDrawer: (member: StartupTeamMember) => void;
  onToggleVisibility: (memberId: string, current: boolean) => void;
  onToggleDashboardAccess: (memberId: string, current: boolean) => void;
}

export const AdvisorsMentorsTab: React.FC<AdvisorsMentorsTabProps> = ({
  members,
  onOpenAddModal,
  onOpenMemberDrawer,
  onToggleVisibility,
  onToggleDashboardAccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter advisors and mentors only
  const advisors = members.filter(
    (m) =>
      m.teamCategory === 'advisor' ||
      m.teamCategory === 'mentor' ||
      m.roleCategory === 'advisor'
  );

  const filteredAdvisors = advisors.filter((a) => {
    return (
      !searchQuery.trim() ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.xentroProfile && a.xentroProfile.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Informational Guidance Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Advisory Board & Domain Mentors
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-2xl leading-relaxed">
              Advisors and mentors provide strategic guidance and public credibility without needing operational workspace control. They default to public visibility with no dashboard access.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Advisor / Mentor</span>
        </button>
      </div>

      {/* Advisory Directory */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search advisors and mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            {filteredAdvisors.length} Verified Advisor{filteredAdvisors.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredAdvisors.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Award className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <div className="text-sm font-semibold">No advisors listed yet</div>
            <p className="text-xs">Add key industry advisors, research fellows, or venture mentors to your board.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdvisors.map((adv) => (
              <div
                key={adv.id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={adv.avatar}
                        alt={adv.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white">{adv.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 uppercase">
                            {adv.teamCategory}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-[#101212] dark:text-white">
                          {adv.designation || adv.role}
                        </p>
                        <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          {adv.xentroProfile || adv.email || 'External Advisor'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenMemberDrawer(adv)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                    {adv.shortBio || adv.bio}
                  </p>

                  {adv.expertise && adv.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {adv.expertise.map((exp, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Public vs Dashboard Access status */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-[#262A29] text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-gray-400">Public Profile:</span>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(adv.id, !!adv.publicProfileVisible)}
                        className={`flex items-center gap-1 font-bold cursor-pointer ${
                          adv.publicProfileVisible ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        }`}
                      >
                        {adv.publicProfileVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{adv.publicProfileVisible ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-gray-400">Dashboard:</span>
                      <button
                        type="button"
                        onClick={() => onToggleDashboardAccess(adv.id, !!adv.dashboardAccessEnabled)}
                        className={`flex items-center gap-1 font-bold cursor-pointer ${
                          adv.dashboardAccessEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                        }`}
                      >
                        {adv.dashboardAccessEnabled ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>ADVISORY</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3" />
                            <span>NONE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-[#262A29] text-[11px]">
                  <span className="text-gray-400">Advisory Board Member</span>
                  <button
                    type="button"
                    onClick={() => onOpenMemberDrawer(adv)}
                    className="text-[#101212] dark:text-[#D9FF3F] hover:underline font-bold cursor-pointer"
                  >
                    Manage Advisory Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
