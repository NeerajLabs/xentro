'use client';

import React from 'react';
import {
  Shield,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Clock,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Target,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
} from 'lucide-react';
import { EcosystemAsk, ASK_ROLE_CONFIGS } from '@/lib/askConfig';
import { askService } from '@/lib/askService';
import { useToast } from '@/components/ui/Toast';

interface UniversalAskCardProps {
  ask: EcosystemAsk;
  isOwner?: boolean;
  onEdit?: (ask: EcosystemAsk) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onResponseAction?: (ask: EcosystemAsk, action: string) => void;
}

export const UniversalAskCard: React.FC<UniversalAskCardProps> = ({
  ask,
  isOwner = true,
  onEdit,
  onDelete,
  onToggleStatus,
  onResponseAction,
}) => {
  const { showToast } = useToast();
  const ghostProfile = askService.getGhostProfile(ask.creatorRole, ask);
  const isGhost = ask.visibility === 'ghost';
  const roleConfig = ASK_ROLE_CONFIGS[ask.creatorRole] || ASK_ROLE_CONFIGS.startup;
  const categoryConfig = roleConfig.categories[ask.category];

  const categoryLabel = categoryConfig?.label || ask.type || ask.category;
  const responseActions =
    ask.responseActions && ask.responseActions.length > 0
      ? ask.responseActions
      : categoryConfig?.responseActions || ['Express Interest', 'Send Message'];

  const isActive = ask.status === 'published' || ask.status === 'Active';
  const isDraft = ask.status === 'draft' || ask.status === 'Draft';
  const isPaused = ask.status === 'Paused';

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-subtle hover:border-gray-300 dark:hover:border-[#333836] transition-all space-y-4">
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-center overflow-hidden shrink-0">
            {isGhost || !ghostProfile.avatar ? (
              <Shield className="w-5 h-5 text-purple-500" />
            ) : (
              <img
                src={ghostProfile.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white">
                {ghostProfile.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                {ask.creatorRole}
              </span>
              {isGhost && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  Ghost Stealth
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
              {ghostProfile.subtitle} • {ask.dateCreated || 'Recent'}
            </p>
          </div>
        </div>

        {/* Status & Category Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
            {categoryLabel}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isDraft
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            {ask.status}
          </span>
        </div>
      </div>

      {/* Title & Short Summary */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white leading-snug">
          {ask.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          {ask.shortSummary || ask.description}
        </p>
      </div>

      {/* Key Category Highlights Grid */}
      {ask.categoryData && Object.keys(ask.categoryData).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* Startup Investment special highlights */}
          {ask.category === 'investment' && ask.categoryData.totalRoundSize && (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
              <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Round Size</span>
              <span className="text-xs font-bold font-mono text-[#101212] dark:text-white">
                ₹{Number(ask.categoryData.totalRoundSize).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          {ask.category === 'investment' && ask.categoryData.amountRemaining !== undefined && (
            <div className="p-2.5 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20">
              <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Remaining</span>
              <span className="text-xs font-bold font-mono text-[#101212] dark:text-[#D9FF3F]">
                ₹{Number(ask.categoryData.amountRemaining).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          {ask.category === 'investment' && ask.categoryData.fundingStage && (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
              <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Stage</span>
              <span className="text-xs font-bold text-[#101212] dark:text-white truncate block">
                {ask.categoryData.fundingStage}
              </span>
            </div>
          )}

          {/* Sourcing / Generic key fields */}
          {Object.entries(ask.categoryData)
            .filter(([k]) => !['totalRoundSize', 'amountRemaining', 'fundingStage', 'useOfFundsDescription', 'additionalThesisNotes'].includes(k))
            .slice(0, ask.category === 'investment' ? 1 : 4)
            .map(([k, v]) => {
              if (v === undefined || v === null || v === '' || typeof v === 'boolean') return null;
              const fieldDef = categoryConfig?.fields.find((f) => f.id === k);
              return (
                <div key={k} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block truncate">
                    {fieldDef?.label || k}
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block truncate">
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Target Audiences, Deadline & Attachments */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-[#262A29] flex-wrap text-xs text-[#565B59] dark:text-[#B6B8B7]">
        <div className="flex items-center gap-2 flex-wrap">
          {ask.targeting?.userTypes?.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]"
            >
              For: {t}
            </span>
          ))}

          {ask.deadline && (
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3" />
              <span>Due {ask.deadline}</span>
            </span>
          )}

          {ask.attachments?.pitchDeck && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#202422]">
              <FileText className="w-3 h-3" />
              <span>Pitch Deck</span>
            </span>
          )}
          {ask.attachments?.ddLocker && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Lock className="w-3 h-3" />
              <span>DD Locker</span>
            </span>
          )}
        </div>

        {/* Responses Count */}
        <div className="flex items-center gap-1.5 font-semibold text-xs text-[#101212] dark:text-white">
          <MessageSquare className="w-3.5 h-3.5 text-[#D9FF3F]" />
          <span>{ask.responsesCount || 0} Responses</span>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 flex-wrap">
        {/* Dynamic Response CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          {responseActions.slice(0, 3).map((act, idx) => (
            <button
              key={act}
              type="button"
              onClick={() => {
                if (onResponseAction) {
                  onResponseAction(ask, act);
                } else {
                  showToast(`Selected "${act}" for ${ask.title}`, 'success');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                idx === 0
                  ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-2xs'
                  : 'bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white'
              }`}
            >
              <span>{act}</span>
            </button>
          ))}
        </div>

        {/* Creator Control Buttons */}
        {isOwner && (
          <div className="flex items-center gap-1.5 ml-auto">
            {onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(ask.id)}
                title={isActive ? 'Pause Ask' : 'Activate Ask'}
                className="p-2 rounded-xl text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
              >
                {isActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(ask)}
                title="Edit Ask"
                className="p-2 rounded-xl text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(ask.id)}
                title="Delete Ask"
                className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
