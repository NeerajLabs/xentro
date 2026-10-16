'use client';

import React, { useState } from 'react';
import {
  Target,
  FileText,
  Send,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import { UniversalAskManager } from '../startup/StartupAskManager';
import { StartupMyListings } from '../startup/StartupMyListings';
import { StartupMyApplications } from '../startup/StartupMyApplications';
import { InvestorConnections } from '../investor/InvestorConnections';
import { InvestorMeetings } from '../investor/InvestorMeetings';
import { MentorMeetings } from '@/components/mentor/MentorMeetings';
import { initialMentorMeetings, defaultAvailability } from '@/data/mentorMockData';

interface DashboardActivitiesWorkspaceProps {
  role: 'startup' | 'mentor' | 'investor' | 'investor_individual' | 'investor_org' | 'esp' | 'institution';
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardActivitiesWorkspace: React.FC<DashboardActivitiesWorkspaceProps> = ({
  role,
  initialTab = 'asks',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const askRole: 'startup' | 'mentor' | 'investor' | 'esp' =
    role === 'mentor'
      ? 'mentor'
      : role === 'esp' || role === 'institution'
      ? 'esp'
      : 'investor';

  const askLabel =
    role === 'mentor'
      ? 'Mentor Asks'
      : role === 'esp' || role === 'institution'
      ? 'Ecosystem Asks'
      : 'Investor Asks';

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        <div>
          <h2 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
            Activities & Network
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage published requests, marketplace listings, incoming applications, and ecosystem engagements
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('asks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'asks'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{askLabel}</span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'listings'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Listings</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>My Applications</span>
          </button>

          {role !== 'mentor' && (
            <>
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'connections'
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Connections</span>
              </button>

              <button
                onClick={() => setActiveTab('meetings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'meetings'
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Meetings</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'asks' && <UniversalAskManager role={askRole} />}
      {activeTab === 'listings' && <StartupMyListings />}
      {activeTab === 'applications' && <StartupMyApplications onNavigateTab={onNavigateTab} />}
      {activeTab === 'connections' && <InvestorConnections showFilters={false} />}
      {activeTab === 'meetings' && <InvestorMeetings />}
    </div>
  );
};
