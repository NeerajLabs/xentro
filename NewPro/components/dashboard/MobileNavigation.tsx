'use client';

import React from 'react';
import { LayoutDashboard, Home, MessageCircle, Briefcase, GraduationCap, User } from 'lucide-react';

interface MobileNavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onToggleMessages: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onSelectTab,
  onToggleMessages,
}) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'opportunity', label: 'Opportunity', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#181B1A] border-t border-[#E5E7EB] dark:border-[#262A29] px-4 py-2 flex items-center justify-around shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
              isActive
                ? 'text-[#101212] dark:text-[#D9FF3F] font-bold'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
