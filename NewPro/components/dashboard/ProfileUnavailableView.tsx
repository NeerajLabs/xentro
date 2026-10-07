'use client';

import React from 'react';
import { UserX, ArrowLeft, Compass, RefreshCw } from 'lucide-react';

interface ProfileUnavailableViewProps {
  onBackToFeed?: () => void;
  onRetry?: () => void;
  message?: string;
}

export const ProfileUnavailableView: React.FC<ProfileUnavailableViewProps> = ({
  onBackToFeed,
  onRetry,
  message = "This user or entity profile could not be loaded. It may have been updated, restricted, or does not exist.",
}) => {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm text-center space-y-6 animate-fade-slide">
      <div className="w-16 h-16 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#D9FF3F] mx-auto flex items-center justify-center shadow-inner">
        <UserX className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[#101212] dark:text-white tracking-tight font-display">
          Profile Unavailable
        </h2>
        <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-md mx-auto">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onBackToFeed && (
          <button
            type="button"
            onClick={onBackToFeed}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Feed</span>
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#282D2B] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};
