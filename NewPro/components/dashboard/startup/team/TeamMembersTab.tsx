'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Crown,
  MoreVertical,
  Edit2,
  Trash2,
  UserMinus,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  StartupTeamMember,
  TeamCategory,
  StartupMemberStatus,
  StartupDashboardRole,
} from '@/types/startup';

interface TeamMembersTabProps {
  members: StartupTeamMember[];
  onOpenAddModal: () => void;
  onOpenMemberDrawer: (member: StartupTeamMember) => void;
  onToggleVisibility: (memberId: string, current: boolean) => void;
  onToggleDashboardAccess: (memberId: string, current: boolean) => void;
  onMarkFormer: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export const TeamMembersTab: React.FC<TeamMembersTabProps> = ({
  members,
  onOpenAddModal,
  onOpenMemberDrawer,
  onToggleVisibility,
  onToggleDashboardAccess,
  onMarkFormer,
  onRemoveMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');

  // Metrics
  const activeMembersCount = members.filter((m) => m.entityMembershipStatus === 'active').length;
  const dashboardUsersCount = members.filter((m) => m.dashboardAccessEnabled).length;
  const publicVisibleCount = members.filter((m) => m.publicProfileVisible).length;
  const invitedCount = members.filter((m) => m.entityMembershipStatus === 'invited' || m.entityMembershipStatus === 'pending').length;

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.xentroProfile && m.xentroProfile.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        categoryFilter === 'all' ||
        m.teamCategory === categoryFilter ||
        (categoryFilter === 'founder' && (m.teamCategory === 'co_founder' || m.roleCategory === 'founder'));

      const matchesStatus =
        statusFilter === 'all' || m.entityMembershipStatus === statusFilter;

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'enabled' && m.dashboardAccessEnabled) ||
        (accessFilter === 'disabled' && !m.dashboardAccessEnabled);

      return matchesSearch && matchesCat && matchesStatus && matchesAccess;
    });
  }, [members, searchQuery, categoryFilter, statusFilter, accessFilter]);

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Active Team</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{activeMembersCount}</span>
            <Users className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7]" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Belongs to Venture</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Dashboard Access</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{dashboardUsersCount}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-[#D9FF3F] font-semibold">Active workspace operators</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Public Profile Display</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{publicVisibleCount}</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Visible to public viewers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1">
          <div className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Pending Invitations</div>
          <div className="text-xl font-bold text-[#101212] dark:text-white flex items-center justify-between">
            <span>{invitedCount}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Awaiting acceptance</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, email, or @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="founder">Founders</option>
              <option value="leadership">Leadership</option>
              <option value="core_team">Core Team</option>
              <option value="advisor">Advisors</option>
              <option value="intern">Interns</option>
            </select>

            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
            >
              <option value="all">All Access</option>
              <option value="enabled">Dashboard Enabled</option>
              <option value="disabled">Dashboard Disabled</option>
            </select>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredMembers.map((member) => {
            const isOwner = member.dashboardRole === 'owner';

            return (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] hover:border-gray-300 dark:hover:border-[#383E3B] transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top line with Avatar & Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-white dark:border-gray-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#101212] dark:text-white truncate">
                            {member.name}
                          </span>
                          {isOwner && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              <Crown className="w-2.5 h-2.5" />
                              <span>Owner</span>
                            </span>
                          )}
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] uppercase">
                            {(member.teamCategory || 'core_team').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-[#101212] dark:text-white truncate">
                          {member.designation || member.role}
                        </p>
                        <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                          {member.xentroProfile || member.email || 'No linked account'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenMemberDrawer(member)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] transition-colors cursor-pointer"
                      title="Manage Member & Permissions"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bio */}
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                    {member.shortBio || member.bio}
                  </p>

                  {/* Status Pills Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-[#262A29] text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-gray-400">Public Profile:</span>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(member.id, !!member.publicProfileVisible)}
                        className={`flex items-center gap-1 font-bold cursor-pointer ${
                          member.publicProfileVisible
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 line-through'
                        }`}
                      >
                        {member.publicProfileVisible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-gray-400">Dashboard:</span>
                      <button
                        type="button"
                        onClick={() => onToggleDashboardAccess(member.id, !!member.dashboardAccessEnabled)}
                        className={`flex items-center gap-1 font-bold cursor-pointer ${
                          member.dashboardAccessEnabled
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {member.dashboardAccessEnabled ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>{member.dashboardRole ? member.dashboardRole.toUpperCase() : 'ENABLED'}</span>
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

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-[#262A29] text-[11px]">
                  <span className="text-gray-400">
                    Status:{' '}
                    <span className="font-semibold text-[#101212] dark:text-white capitalize">
                      {member.entityMembershipStatus}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenMemberDrawer(member)}
                    className="text-[#101212] dark:text-[#D9FF3F] hover:underline font-bold cursor-pointer"
                  >
                    Configure Access & Permissions →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
