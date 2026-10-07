"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Check, Lock, X, Rocket, Compass, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreferenceRole = "Startup" | "Mentor" | "Investor";

export interface PreferenceDetail {
  id: PreferenceRole;
  title: string;
  icon: React.ElementType;
}

export const PREFERENCES: PreferenceDetail[] = [
  {
    id: "Startup",
    title: "Startup",
    icon: Rocket,
  },
  {
    id: "Mentor",
    title: "Mentor",
    icon: Compass,
  },
  {
    id: "Investor",
    title: "Investor",
    icon: TrendingUp,
  },
];

interface PreferenceConfirmModalProps {
  isOpen: boolean;
  preference: PreferenceRole | null;
  onClose: () => void;
  onConfirm: (preference: PreferenceRole) => void;
}

export const PreferenceConfirmModal: React.FC<PreferenceConfirmModalProps> = ({
  isOpen,
  preference,
  onClose,
  onConfirm,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, preference]);

  if (!isOpen || !preference) return null;

  const detail = PREFERENCES.find((p) => p.id === preference) || PREFERENCES[0];
  const IconComponent = detail.icon;

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm(preference);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preference-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E5E3] dark:border-[#262928]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Lock className="w-4 h-4" />
            </div>
            <h2
              id="preference-modal-title"
              className="font-manrope font-bold text-base text-[#101212] dark:text-white"
            >
              Confirm Ecosystem Preference
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-[#F7F8F6] dark:hover:bg-[#202422] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Current Choice Display */}
          <div className="p-6 rounded-2xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border-2 border-[#D9FF3F] dark:border-[#D9FF3F]/80 flex flex-col items-center justify-center">
            <p className="text-xs font-inter font-semibold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] mb-3">
              Your current choice is
            </p>
            
            {/* Big Icon in Modal */}
            <div className="w-20 h-20 rounded-2xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-md mb-3">
              <IconComponent className="w-10 h-10 stroke-[2.2]" />
            </div>

            <h3 className="font-manrope font-bold text-2xl text-[#101212] dark:text-white">
              {detail.title}
            </h3>
          </div>

          {/* One-time Warning Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FFFBEB] dark:bg-[#261E0A] border border-[#FDE68A] dark:border-[#78350F] text-[#92400E] dark:text-[#FCD34D] text-left">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-inter leading-relaxed">
              <span className="font-bold">One-Time Confirmation:</span> Once confirmed, no more changes can be made.
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div className="pt-1 text-left">
            <label className="relative flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                id="declare-preference"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#E3E5E3] dark:border-[#262928] text-[#101212] focus:ring-[#D9FF3F] accent-[#D9FF3F] cursor-pointer"
              />
              <span className="text-xs font-inter font-medium text-[#101212] dark:text-white leading-relaxed">
                I understand and declare my preference as{" "}
                <strong className="underline decoration-[#D9FF3F] decoration-2 underline-offset-2">
                  {detail.title}
                </strong>
                .
              </span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6]/50 dark:bg-[#141615]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-inter font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-white dark:hover:bg-[#202422] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isChecked}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-inter font-semibold transition-all duration-150 flex items-center gap-2",
              isChecked
                ? "bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm cursor-pointer"
                : "bg-[#E3E5E3] dark:bg-[#262928] text-[#565B59] dark:text-[#B6B8B7] opacity-60 cursor-not-allowed"
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Confirm Preference</span>
          </button>
        </div>
      </div>
    </div>
  );
};
