'use client';

import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { StartupConnections } from './StartupConnections';
import { MentorshipModule } from '@/components/mentor/MentorshipModule';
import { MentorMeetings } from '@/components/mentor/MentorMeetings';
import {
  initialMentorMeetings,
  defaultAvailability,
} from '@/data/mentorMockData';

interface StartupRelationshipsWorkspaceProps {
  initialSubTab?: 'connections' | 'mentorship' | 'meetings';
  onNavigateTab?: (tab: string) => void;
}

export const StartupRelationshipsWorkspace: React.FC<StartupRelationshipsWorkspaceProps> = ({
  initialSubTab = 'connections',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'mentorship' | 'meetings'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              Relationships & Mentorship
            </h2>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Engage with verified industry mentors, schedule advisory meetings, and manage your founder network.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-gray-100 dark:border-[#262A29]">
          {[
            { id: 'connections', label: 'Connections', icon: Users },
            { id: 'mentorship', label: 'Mentorship', icon: GraduationCap },
            { id: 'meetings', label: 'Meetings', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Views */}
      {activeTab === 'connections' && <StartupConnections />}
      {activeTab === 'mentorship' && <MentorshipModule userRole="startup" defaultSubTab="active" />}
      {activeTab === 'meetings' && (
        <MentorMeetings
          meetings={initialMentorMeetings}
          availabilityConfig={defaultAvailability}
          defaultTab="upcoming"
        />
      )}
    </div>
  );
};
