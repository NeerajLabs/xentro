'use client';

import React, { useState } from 'react';
import {
  initialMentorshipRequests,
  initialActiveMentorships,
  initialPastMentorships,
  initialMentorMeetings,
  defaultAvailability,
  initialDiscoverStartups,
  initialMentorOpportunities,
  initialMentorNotifications,
} from '@/data/mentorMockData';
import { MentorCommandCenter } from './MentorCommandCenter';
import { MentorshipModule } from './MentorshipModule';
import { MentorMeetings } from './MentorMeetings';
import { MentorDiscover } from './MentorDiscover';
import { MentorRecommendations } from './MentorRecommendations';
import { MentorOpportunities } from './MentorOpportunities';
import { MentorProfileManage } from './MentorProfileManage';
import { MentorNotifications } from './MentorNotifications';
import { MentorSettings } from './MentorSettings';
import { Feed } from '@/components/dashboard/Feed';
import { FullMessagesPage } from '@/components/dashboard/FullMessagesPage';

interface MentorDashboardLayoutProps {
  activeTab: string;
  onNavigateTab: (tabId: string, subTab?: string) => void;
  onViewPublicProfile: () => void;
  onOpenMessages?: () => void;
  searchQuery?: string;
}

export const MentorDashboardLayout: React.FC<MentorDashboardLayoutProps> = ({
  activeTab,
  onNavigateTab,
  onViewPublicProfile,
  onOpenMessages,
  searchQuery = '',
}) => {
  const [requests] = useState(initialMentorshipRequests);
  const [activeMentorships] = useState(initialActiveMentorships);
  const [pastMentorships] = useState(initialPastMentorships);
  const [meetings] = useState(initialMentorMeetings);
  const [availability] = useState(defaultAvailability);
  const [startups] = useState(initialDiscoverStartups);
  const [opportunities] = useState(initialMentorOpportunities);
  const [notifications] = useState(initialMentorNotifications);

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6">
      {activeTab === 'home' && (
        <MentorCommandCenter
          requests={requests}
          activeMentorships={activeMentorships}
          meetings={meetings}
          startups={startups}
          opportunities={opportunities}
          onNavigateTab={onNavigateTab}
          onViewPublicProfile={onViewPublicProfile}
          onOpenMessages={onOpenMessages}
        />
      )}

      {activeTab === 'mentorship' && (
        <MentorshipModule
          initialRequests={requests}
          initialActive={activeMentorships}
          initialPast={pastMentorships}
          onNavigateMeetings={() => onNavigateTab('meetings')}
          onNavigateMessages={() => onNavigateTab('messages')}
        />
      )}

      {activeTab === 'meetings' && (
        <MentorMeetings
          meetings={meetings}
          availabilityConfig={availability}
        />
      )}

      {activeTab === 'messages' && (
        <FullMessagesPage onBackToFeed={() => onNavigateTab('home')} />
      )}

      {activeTab === 'discover' && (
        <MentorDiscover startups={startups} />
      )}

      {activeTab === 'recommendations' && (
        <MentorRecommendations
          recommendedStartups={startups}
          recommendedOpportunities={opportunities}
          onNavigateOpportunities={() => onNavigateTab('opportunities')}
          onNavigateDiscover={() => onNavigateTab('discover')}
        />
      )}

      {activeTab === 'opportunities' && (
        <MentorOpportunities opportunities={opportunities} />
      )}

      {activeTab === 'feed' && (
        <div className="max-w-[640px] mx-auto">
          <Feed searchQuery={searchQuery} />
        </div>
      )}

      {activeTab === 'profile' && (
        <MentorProfileManage onViewPublicProfile={onViewPublicProfile} />
      )}

      {activeTab === 'notifications' && (
        <MentorNotifications
          notifications={notifications}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeTab === 'settings' && <MentorSettings />}
    </div>
  );
};
