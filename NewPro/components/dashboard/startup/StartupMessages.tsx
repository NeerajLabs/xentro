'use client';

import React from 'react';
import { MessageSquare, Shield, Sparkles } from 'lucide-react';
import { FullMessagesPage } from '@/components/dashboard/FullMessagesPage';

export const StartupMessages: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-slide">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#D9FF3F]" />
              <span>Startup Ecosystem Communications</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              End-to-End Encrypted
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Direct channels with institutional VCs, accredited angels, dedicated mentors, and peer startups.
          </p>
        </div>
      </div>

      {/* Embedded Full Messages Workspace */}
      <div className="rounded-3xl overflow-hidden border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle bg-white dark:bg-[#181B1A]">
        <FullMessagesPage />
      </div>
    </div>
  );
};
