'use client';

import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ESPPublicTeamMember } from '@/types/espPublicTeam';

interface RemoveConfirmModalProps {
  member: ESPPublicTeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RemoveConfirmModal: React.FC<RemoveConfirmModalProps> = ({
  member,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !member) return null;

  const isEntityMember = member.sourceType === 'entity_member';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm text-[#101212] dark:text-white">
              Remove from Public Profile?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          Are you sure you want to remove{' '}
          <strong className="text-[#101212] dark:text-white font-bold">{member.name}</strong> (
          {member.publicDesignation}) from the public-facing directory profile?
        </p>

        {/* Critical Architectural Safety Callout */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Workspace Membership Protection</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            {isEntityMember ? (
              <>
                This will <strong>only remove their public profile card</strong>. Their internal workspace
                membership, role permissions ({member.internalRoleSnapshot || 'Member'}), and account access
                will <strong>remain active and unaffected</strong>.
              </>
            ) : (
              <>
                This will only unlink their card from this public directory. Their personal Xentro account and
                external associations are unaffected.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
          >
            Remove from Public Profile
          </button>
        </div>
      </div>
    </div>
  );
};
