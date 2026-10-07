'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { ESPMemberRole } from '@/types/esp';

interface ESPUnauthorizedStateProps {
  moduleName: string;
  currentRole: ESPMemberRole;
  requiredPermission?: string;
  reason?: string;
  onNavigateOverview?: () => void;
  onSwitchRole?: (role: ESPMemberRole) => void;
}

export const ESPUnauthorizedState: React.FC<ESPUnauthorizedStateProps> = ({
  moduleName,
  currentRole,
  requiredPermission,
  reason,
  onNavigateOverview,
  onSwitchRole,
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center space-y-6 max-w-2xl mx-auto my-8 animate-fade-slide">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Role-Based Access Control (RBAC)</span>
        </div>
        <h3 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
          Access Restricted: {moduleName}
        </h3>
        <p className="text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-lg mx-auto">
          {reason || `Your current role (${currentRole}) does not have permission to access or manage this module.`}
        </p>
      </div>

      {requiredPermission && (
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7] inline-block">
          Required System Permission:{' '}
          <code className="font-mono font-bold text-[#101212] dark:text-white bg-gray-200 dark:bg-[#181B1A] px-2 py-0.5 rounded">
            {requiredPermission}
          </code>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onNavigateOverview && (
          <button
            onClick={onNavigateOverview}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </button>
        )}

        {onSwitchRole && (
          <button
            onClick={() => onSwitchRole('Primary Admin / Owner')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch to Primary Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};
