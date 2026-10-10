import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Rocket,
  Sparkles,
  Tag,
  Briefcase,
  GraduationCap,
  Building2,
  Send,
  Compass,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import {
  entityContextService,
  LinkedEntity,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';

interface CreatePostTriggerProps {
  userProfile: UserProfile;
  onOpenModal: (initialIntent?: string, initialImageUrl?: string) => void;
}

export const CreatePostTrigger: React.FC<CreatePostTriggerProps> = ({
  userProfile,
  onOpenModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );

  useEffect(() => {
    const handleEntitySwitch = (e: Event) => {
      const ce = e as CustomEvent;
      setActiveEntity(ce.detail?.entity || entityContextService.getActiveEntity());
    };
    window.addEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    return () => {
      window.removeEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    };
  }, []);

  // Format role badge styling and label based on activeEntity or personal userProfile
  const getRoleBadge = () => {
    if (activeEntity) {
      const type = (activeEntity.entityType || '').toLowerCase();
      if (type === 'startup') {
        return {
          icon: <Rocket className="w-3 h-3 text-[#101212] dark:text-[#D9FF3F]" />,
          label: `${activeEntity.name} (Startup Founder)`,
          bg: 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40',
          placeholder: `Share an update, product launch, hiring ask, or milestone for ${activeEntity.name}...`,
          symbol: 'S',
          avatar: activeEntity.logo || null,
          initials: activeEntity.name.slice(0, 2).toUpperCase(),
          name: activeEntity.name,
        };
      }
      if (type.includes('investor')) {
        return {
          icon: <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
          label: `${activeEntity.name} (Investor Organization)`,
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          placeholder: `Share market thesis, portfolio update, or call for pitches...`,
          symbol: 'I',
          avatar: activeEntity.logo || null,
          initials: activeEntity.name.slice(0, 2).toUpperCase(),
          name: activeEntity.name,
        };
      }
      if (type === 'esp') {
        return {
          icon: <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
          label: `${activeEntity.name} (Incubator / ESP)`,
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
          placeholder: `Announce cohort openings, grant deadlines, or demo day...`,
          symbol: 'E',
          avatar: activeEntity.logo || null,
          initials: activeEntity.name.slice(0, 2).toUpperCase(),
          name: activeEntity.name,
        };
      }
    }

    switch (userProfile.role) {
      case 'explorer':
        return {
          icon: <Compass className="w-3 h-3 text-[#101212] dark:text-[#D9FF3F]" />,
          label: 'Ecosystem Explorer',
          bg: 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40',
          placeholder: "Share an idea, question, interesting discovery, or insight...",
          symbol: 'E',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'EX').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
      case 'startup':
        return {
          icon: <Rocket className="w-3 h-3 text-[#101212] dark:text-[#D9FF3F]" />,
          label: 'Startup Founder',
          bg: 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40',
          placeholder: "Share an update, product launch, hiring ask, or milestone...",
          symbol: 'S',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'ST').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
      case 'investor':
        return {
          icon: <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
          label: 'Investor',
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          placeholder: "Share market thesis, portfolio update, or call for pitches...",
          symbol: 'I',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'IN').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
      case 'mentor':
        return {
          icon: <GraduationCap className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
          label: 'Advisory Mentor',
          bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
          placeholder: "Share mentorship insight, office hours, or architecture tip...",
          symbol: 'M',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'ME').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
      case 'esp':
        return {
          icon: <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
          label: 'Incubator / ESP',
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
          placeholder: "Announce cohort openings, grant opportunities, or demo day...",
          symbol: 'E',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'ES').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
      default:
        return {
          icon: <Sparkles className="w-3 h-3 text-[#9EBE12]" />,
          label: 'Innovator',
          bg: 'bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white border-gray-300',
          placeholder: "What's happening in your venture or ecosystem? Start a post...",
          symbol: 'E',
          avatar: userProfile.avatar || null,
          initials: (userProfile.name || 'IN').slice(0, 2).toUpperCase(),
          name: userProfile.name,
        };
    }
  };

  const badge = getRoleBadge();

  const handleUploadImageClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onOpenModal('upload-image', dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      onOpenModal('upload-image');
    }
    // Reset so same file can be re-selected if needed
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-4 sm:p-5 shadow-subtle mb-5 transition-all duration-200 hover:border-gray-300 dark:hover:border-[#383D3B]">
      {/* Hidden file input for native image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Top row: Avatar + Fake Input field */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {badge.avatar ? (
            <img
              src={badge.avatar}
              alt={badge.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#E5E7EB] dark:border-[#262A29]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/profile_avatar.webp';
              }}
            />
          ) : activeEntity ? (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#D9FF3F] text-[#101212] font-black text-xs flex items-center justify-center border border-[#E5E7EB] dark:border-[#262A29] shadow-2xs">
              {badge.initials}
            </div>
          ) : (
            <img
              src={userProfile.avatar || '/images/profile_avatar.webp'}
              alt={userProfile.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#E5E7EB] dark:border-[#262A29]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/profile_avatar.webp';
              }}
            />
          )}
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] flex items-center justify-center text-[9px] font-bold border-2 border-white dark:border-[#181B1A]"
            title={`Active role: ${badge.label}`}
          >
            {badge.symbol}
          </span>
        </div>

        {/* Trigger Button that looks like a friendly input */}
        <button
          type="button"
          onClick={() => onOpenModal()}
          className="flex-1 text-left px-4 py-2.5 sm:py-3 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-[#101212] dark:hover:bg-[#151817] border border-[#E5E7EB] dark:border-[#262A29] text-xs sm:text-sm text-[#737876] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white transition-all duration-150 cursor-pointer flex items-center justify-between group"
        >
          <span className="truncate pr-2">{badge.placeholder}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#101212] dark:text-[#D9FF3F] px-2.5 py-1 rounded-full bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#2A2E2C] group-hover:scale-105 transition-transform flex-shrink-0">
            <Send className="w-3 h-3" />
            Post
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 dark:bg-[#262A29] my-3.5" />

      {/* Bottom Action Shortcut Buttons */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-0.5">
        {/* Upload Image button replaces Photo / Media */}
        <button
          type="button"
          onClick={handleUploadImageClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-4 h-4 text-emerald-500" />
          <span>Upload Image</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('milestone')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
        >
          <Rocket className="w-4 h-4 text-[#D9FF3F] dark:text-[#D9FF3F]" />
          <span>Milestone / Launch</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('opportunity')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Opportunity / Ask</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('tags')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
        >
          <Tag className="w-4 h-4 text-blue-500" />
          <span>Topic Tags</span>
        </button>
      </div>
    </div>
  );
};
