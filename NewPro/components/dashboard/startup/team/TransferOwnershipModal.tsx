'use client';

import React, { useState } from 'react';
import { Crown, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { StartupTeamMember } from '@/types/startup';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  currentOwner: StartupTeamMember;
  candidates: StartupTeamMember[];
  onConfirm: (newOwnerId: string) => void;
  onCancel: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  currentOwner,
  candidates,
  onConfirm,
  onCancel,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id || ''
  );
  const [confirmPhrase, setConfirmPhrase] = useState('');

  if (!isOpen) return null;

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const isValid = selectedCandidateId && confirmPhrase === 'TRANSFER OWNERSHIP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181B1A] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-scale-up">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#202422] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Transfer Venture Ownership</h3>
            <p className="text-xs text-gray-400">Irreversible organizational handover</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ownership Transfer Currently Unavailable</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Venture ownership transfer is currently disabled pending authoritative backend governance workflow integration. Existing venture ownership and team permissions remain strictly preserved.
          </p>
        </div>

        <div className="space-y-3 opacity-60 pointer-events-none">
          <label className="block text-xs font-semibold text-gray-400">
            Select New Venture Owner (Preview Only)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="p-3 rounded-xl border flex items-center justify-between bg-[#202422] border-[#262A29] text-gray-400"
              >
                <div className="flex items-center gap-3">
                  <img src={cand.avatar} alt={cand.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold text-white">{cand.name}</div>
                    <div className="text-[11px] text-gray-400">{cand.designation} • {cand.teamCategory}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-[#202422] hover:bg-[#262A29] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-700 text-gray-400 cursor-not-allowed opacity-60 shadow-none"
          >
            Transfer Unavailable
          </button>
        </div>
      </div>
    </div>
  );
};
