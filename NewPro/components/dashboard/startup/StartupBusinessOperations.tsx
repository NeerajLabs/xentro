'use client';

import React, { useState } from 'react';
import {
  FolderKanban,
  FileCheck2,
  Target,
  Layers,
} from 'lucide-react';
import { StartupMyListings } from './StartupMyListings';
import { StartupMyApplications } from './StartupMyApplications';
import { StartupAskManager } from './StartupAskManager';

interface StartupBusinessOperationsProps {
  initialSubTab?: 'listings' | 'applications' | 'asks';
  onNavigateTab?: (tab: string) => void;
}

export const StartupBusinessOperations: React.FC<StartupBusinessOperationsProps> = ({
  initialSubTab = 'listings',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'applications' | 'asks'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Sub-tab Switcher */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              Business Operations
            </h2>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage published opportunity listings, institutional grant/program applications, and venture asks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-gray-100 dark:border-[#262A29]">
          {[
            { id: 'listings', label: 'My Listings', icon: FolderKanban },
            { id: 'applications', label: 'My Applications', icon: FileCheck2 },
            { id: 'asks', label: 'Startup Asks', icon: Target },
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

      {/* 2. Sub-tab Views */}
      {activeTab === 'listings' && <StartupMyListings />}
      {activeTab === 'applications' && <StartupMyApplications onNavigateTab={onNavigateTab} />}
      {activeTab === 'asks' && <StartupAskManager role="startup" />}
    </div>
  );
};
