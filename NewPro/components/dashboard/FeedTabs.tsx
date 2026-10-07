'use client';

import React from 'react';
import { FeedTabType } from '@/types';

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: FeedTabType; label: string }[] = [
    { id: 'for-you', label: 'For you' },
    { id: 'following', label: 'Following' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'mentors', label: 'Mentors' },
    { id: 'investors', label: 'Investors' },
  ];

  return (
    <div className="flex items-center border-b border-[#E5E7EB] dark:border-[#262A29] mb-5 mt-0 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-6 sm:gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#101212] dark:text-white font-bold'
                  : 'text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F]'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#D9FF3F] rounded-full animate-fade-slide shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
