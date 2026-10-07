'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface SensitiveConfirmModalProps {
  isOpen: boolean;
  domainName: string;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SensitiveConfirmModal: React.FC<SensitiveConfirmModalProps> = ({
  isOpen,
  domainName,
  memberName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-[#181B1A] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-scale-up">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#202422] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sensitive Access Confirmation</h3>
            <p className="text-xs text-amber-400/90 font-medium">Confidential Domain: {domainName}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-gray-300 space-y-2">
          <div className="flex items-start gap-2 text-amber-300 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>High-Privilege Security Zone</span>
          </div>
          <p>
            You are granting <span className="font-bold text-white">{memberName}</span> access to confidential{' '}
            <span className="font-semibold text-amber-200">{domainName}</span> records, cap table / DD materials, or administrative workspace functions.
          </p>
          <p className="text-[11px] text-gray-400">
            Ensure this person has executed non-disclosure and authorized personnel agreements before confirming.
          </p>
        </div>

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
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Grant Sensitive Access
          </button>
        </div>
      </div>
    </div>
  );
};
