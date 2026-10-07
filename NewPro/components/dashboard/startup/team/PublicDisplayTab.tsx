'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Globe,
  Check,
  Award,
  Sparkles,
  Users,
  Shield,
  Layers,
} from 'lucide-react';
import {
  StartupTeamMember,
  StartupMemberPublicFields,
  TeamCategory,
} from '@/types/startup';
import { DEFAULT_PUBLIC_FIELDS } from '@/lib/startupTeamService';

interface PublicDisplayTabProps {
  members: StartupTeamMember[];
  onUpdateMember: (id: string, updates: Partial<StartupTeamMember>) => void;
  onReorderMembers: (reordered: StartupTeamMember[]) => void;
}

export const PublicDisplayTab: React.FC<PublicDisplayTabProps> = ({
  members,
  onUpdateMember,
  onReorderMembers,
}) => {
  const [showFormerMembersSection, setShowFormerMembersSection] = useState(false);

  const categoriesOrder: Array<{
    key: 'founders' | 'leadership' | 'core' | 'advisors' | 'former';
    title: string;
    description: string;
    filter: (m: StartupTeamMember) => boolean;
  }> = [
    {
      key: 'founders',
      title: 'Founders & Co-Founders',
      description: 'Prominently featured with high visual weight at the top of your public profile.',
      filter: (m) =>
        (m.teamCategory === 'founder' || m.teamCategory === 'co_founder' || m.roleCategory === 'founder') &&
        m.entityMembershipStatus !== 'former',
    },
    {
      key: 'leadership',
      title: 'Leadership & C-Suite',
      description: 'Executive officers, VPs, and functional directors.',
      filter: (m) =>
        (m.teamCategory === 'leadership' || m.roleCategory === 'leadership') &&
        m.teamCategory !== 'founder' &&
        m.teamCategory !== 'co_founder' &&
        m.entityMembershipStatus !== 'former',
    },
    {
      key: 'core',
      title: 'Core Team & Engineering',
      description: 'Product architects, software developers, operations specialists, and key contributors.',
      filter: (m) =>
        (m.teamCategory === 'core_team' ||
          m.teamCategory === 'consultant' ||
          m.teamCategory === 'intern' ||
          m.teamCategory === 'contributor' ||
          m.roleCategory === 'core') &&
        m.entityMembershipStatus !== 'former',
    },
    {
      key: 'advisors',
      title: 'Advisors & Mentors',
      description: 'Domain mentors, strategic advisors, and research fellows.',
      filter: (m) =>
        (m.teamCategory === 'advisor' || m.teamCategory === 'mentor' || m.roleCategory === 'advisor') &&
        m.entityMembershipStatus !== 'former',
    },
    {
      key: 'former',
      title: 'Former Team Members',
      description: 'Historical contributors who have transitioned from active startup membership.',
      filter: (m) => m.entityMembershipStatus === 'former',
    },
  ];

  const handleToggleVisibility = (m: StartupTeamMember) => {
    onUpdateMember(m.id, {
      publicProfileVisible: !m.publicProfileVisible,
    });
  };

  const handleToggleField = (
    member: StartupTeamMember,
    fieldKey: keyof StartupMemberPublicFields
  ) => {
    const currentFields = member.publicDisplayFields || DEFAULT_PUBLIC_FIELDS;
    onUpdateMember(member.id, {
      publicDisplayFields: {
        ...currentFields,
        [fieldKey]: !currentFields[fieldKey],
      },
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const copy = [...members];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onReorderMembers(copy);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Guidance Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white">
            Public Profile Presentation & Field Visibility
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
            Configure how each person appears on your venture’s public profile. Appearing publicly never grants dashboard access, and dashboard users can remain completely private.
          </p>
        </div>
      </div>

      {/* Sections by Group */}
      <div className="space-y-6">
        {categoriesOrder.map((cat) => {
          const groupMembers = members.filter(cat.filter);
          if (groupMembers.length === 0 && cat.key !== 'former') return null;

          return (
            <div
              key={cat.key}
              className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
                <div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">{cat.title}</h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">{cat.description}</p>
                </div>
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  {groupMembers.filter((m) => m.publicProfileVisible).length} of {groupMembers.length} Visible
                </span>
              </div>

              {groupMembers.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs text-gray-400 text-center">
                  No members in this category.
                </div>
              ) : (
                <div className="space-y-3">
                  {groupMembers.map((member) => {
                    const globalIndex = members.findIndex((m) => m.id === member.id);
                    const fields = member.publicDisplayFields || DEFAULT_PUBLIC_FIELDS;

                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#101212] dark:text-white truncate">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                                • {member.designation || member.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                              <span>Category: {member.teamCategory}</span>
                              <span>•</span>
                              <span>Dashboard: {member.dashboardAccessEnabled ? 'Enabled' : 'None'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Visible fields toggles & Action */}
                        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
                          <div className="flex items-center gap-2 text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                            {(
                              [
                                ['photo', 'Photo'],
                                ['bio', 'Bio'],
                                ['expertise', 'Expertise'],
                                ['linkedin', 'LinkedIn'],
                                ['xentroProfile', 'Handle'],
                              ] as const
                            ).map(([fKey, fLabel]) => (
                              <button
                                key={fKey}
                                type="button"
                                disabled={!member.publicProfileVisible}
                                onClick={() => handleToggleField(member, fKey)}
                                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                  fields[fKey] && member.publicProfileVisible
                                    ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] font-bold'
                                    : 'bg-gray-200 dark:bg-[#262A29] text-gray-400 line-through'
                                }`}
                              >
                                {fLabel}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => handleMove(globalIndex, 'up')}
                              disabled={globalIndex === 0}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(globalIndex, 'down')}
                              disabled={globalIndex === members.length - 1}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Visibility toggle button */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(member)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                member.publicProfileVisible
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 hover:text-white'
                              }`}
                            >
                              {member.publicProfileVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
