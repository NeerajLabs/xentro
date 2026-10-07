'use client';

import React, { useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { FounderInfo } from '@/types/mentor';
import { useToast } from '@/components/ui/Toast';

interface FounderProfileModalProps {
  founder: FounderInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMessage?: (founder: FounderInfo) => void;
  onScheduleMeeting?: (founder: FounderInfo) => void;
}

export const FounderProfileModal: React.FC<FounderProfileModalProps> = ({
  founder,
  isOpen,
  onClose,
  onOpenMessage,
  onScheduleMeeting,
}) => {
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !founder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-slide">
      <div
        className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Founder Header */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-[#262A29] shadow-sm">
            <img
              src={founder.avatar}
              alt={founder.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#101212] dark:text-white">
                {founder.name}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                {founder.startupStage}
              </span>
            </div>
            <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
              {founder.title} · {founder.startupName}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {founder.startupSector}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {founder.location}
              </span>
            </div>
          </div>
        </div>

        {/* Traction & Funding Metrics */}
        {(founder.traction || founder.raised) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {founder.traction && (
              <div className="p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">Traction</span>
                <p className="text-xs font-bold text-[#101212] dark:text-white line-clamp-1">{founder.traction}</p>
              </div>
            )}
            {founder.raised && (
              <div className="p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">Total Raised</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1">{founder.raised}</p>
              </div>
            )}
          </div>
        )}

        {/* Bio & Pitch Summary */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider text-[10px]">
              Founder Background
            </span>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              {founder.bio}
            </p>
          </div>

          {founder.pitchSummary && (
            <div className="p-3.5 rounded-xl bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 space-y-1">
              <span className="text-[10px] font-bold text-[#101212] dark:text-[#D9FF3F] uppercase tracking-wider">
                Startup Problem & Solution
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {founder.pitchSummary}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
          <button
            onClick={() => {
              if (onOpenMessage) onOpenMessage(founder);
              else showToast(`Opening chat with ${founder.name}`);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
            <span>Message</span>
          </button>
          <button
            onClick={() => {
              if (onScheduleMeeting) onScheduleMeeting(founder);
              else showToast(`Scheduling session with ${founder.name}`);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
