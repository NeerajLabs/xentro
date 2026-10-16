'use client';

import React, { useState } from 'react';
import { Briefcase, FolderLock } from 'lucide-react';
import { InvestorPortfolioManager } from './InvestorPortfolioManager';
import { InvestorDiligenceLocker } from './InvestorDiligenceLocker';

interface InvestorPortfolioDiligenceProps {
  initialTab?: 'portfolio' | 'diligence';
}

export const InvestorPortfolioDiligence: React.FC<InvestorPortfolioDiligenceProps> = ({
  initialTab = 'portfolio',
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'diligence'>(initialTab);

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Fund Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab('diligence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'diligence'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            <span>Diligence Locker</span>
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' ? <InvestorPortfolioManager /> : <InvestorDiligenceLocker />}
    </div>
  );
};
