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

        <div className="p-4 rounded-2xl bg-red-950/25 border border-red-500/20 text-xs text-gray-300 space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Important Ownership Transfer Notice</span>
          </div>
          <p>
            You are transferring primary ownership from{' '}
            <span className="font-bold text-white">{currentOwner.name}</span>. Upon transfer:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>The new owner will receive sole authority over billing, deletion, and entity administration.</li>
            <li>Your role will be stepped down to <span className="text-[#D9FF3F] font-bold">Admin</span>.</li>
            <li>Only the new owner will be capable of reassigning ownership in the future.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-300">
            Select New Venture Owner
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedCandidateId === cand.id
                    ? 'bg-[#D9FF3F]/10 border-[#D9FF3F] text-white'
                    : 'bg-[#202422] border-[#262A29] text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={cand.avatar} alt={cand.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold text-white">{cand.name}</div>
                    <div className="text-[11px] text-gray-400">{cand.designation} • {cand.teamCategory}</div>
                  </div>
                </div>
                {selectedCandidateId === cand.id && (
                  <span className="text-xs font-bold text-[#D9FF3F]">Selected</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedCandidate && (
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">
              Type <span className="font-mono font-bold text-red-400">TRANSFER OWNERSHIP</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="TRANSFER OWNERSHIP"
              className="w-full px-3.5 py-2 rounded-xl bg-[#202422] border border-[#262A29] text-xs font-mono text-white focus:outline-hidden focus:border-red-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-[#202422] hover:bg-[#262A29] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => onConfirm(selectedCandidateId)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              isValid
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Transfer Ownership
          </button>
        </div>
      </div>
    </div>
  );
};
