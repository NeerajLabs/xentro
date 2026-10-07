'use client';

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { PersonaDashboardConfig, DashboardNavItem, DashboardNavSection } from './dashboardNavConfig';

interface DashboardSidebarProps {
  config: PersonaDashboardConfig;
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  onBackToUniversal: () => void;
  backTargetLabel?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  config,
  activeModuleId,
  onSelectModule,
  onBackToUniversal,
  backTargetLabel = 'Universal',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  return (
    <aside
      className={`flex flex-col bg-white dark:bg-[#181B1A] border-r border-[#E5E7EB] dark:border-[#262A29] h-full ${
        isMobileDrawer ? 'w-72 max-w-[85vw]' : 'w-[260px]'
      }`}
      aria-label={`${config.workspaceName} Navigation`}
    >
      {/* 1. Header with prominent Back Button */}
      <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262A29] flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToUniversal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white bg-gray-100/80 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] transition-all cursor-pointer group active:scale-95"
            title={`Return to ${backTargetLabel}`}
          >
            <ArrowLeft className="w-4 h-4 text-[#101212] dark:text-[#D9FF3F] transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202422]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Title & Badge */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-sora text-[#101212] dark:text-white tracking-tight">
              {config.workspaceName}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${config.badgeColor}`}>
              {config.badge}
            </span>
          </div>
          <span className="text-[10px] text-[#565B59] dark:text-[#7A807D] font-medium block mt-0.5">
            Dedicated Workspace
          </span>
        </div>
      </div>

      {/* 2. Scrollable Sections Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {config.sections.map((section, sIndex) => (
          <div key={section.label || `section_${sIndex}`} className="space-y-1">
            {section.label && (
              <div className="px-2 pt-1 pb-1">
                <span className="text-[10.5px] font-bold tracking-wider text-[#565B59] dark:text-[#7A807D] uppercase font-sora block">
                  {section.label}
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModuleId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectModule(item.id);
                      if (isMobileDrawer && onCloseMobileDrawer) {
                        onCloseMobileDrawer();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-left group ${
                      isActive
                        ? 'bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] font-bold border border-[#D9FF3F]/40 shadow-2xs'
                        : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-[#202422]/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'text-[#101212] dark:text-[#D9FF3F]'
                            : 'text-[#565B59] dark:text-[#7A807D] group-hover:text-[#101212] dark:group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 flex-shrink-0 ${
                          item.badgeColor
                            ? item.badgeColor
                            : isActive
                            ? 'bg-[#D9FF3F] text-[#101212]'
                            : 'bg-gray-200 dark:bg-[#262A29] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
