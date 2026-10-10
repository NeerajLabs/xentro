'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  entityContextService,
  LinkedEntity,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

interface EntityAccountSwitcherProps {
  onOpenEntityModal?: () => void;
  className?: string;
  variant?: 'header' | 'inline' | 'compact';
}

export const EntityAccountSwitcher: React.FC<EntityAccountSwitcherProps> = ({
  onOpenEntityModal,
  className = '',
  variant = 'header',
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>(() =>
    entityContextService.getLinkedEntities()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state and listen for switching events
  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    if (p.id) {
      entityContextService.fetchLinkedEntities(p.id).then((entities) => {
        setLinkedEntities(entities);
        setActiveEntity(entityContextService.getActiveEntity());
      });
    }

    const handleSwitch = (e: Event) => {
      const ce = e as CustomEvent;
      setActiveEntity(ce.detail?.entity || entityContextService.getActiveEntity());
      setLinkedEntities(entityContextService.getLinkedEntities());
    };

    const handleLinkedUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      setLinkedEntities(ce.detail?.entities || entityContextService.getLinkedEntities());
      setActiveEntity(entityContextService.getActiveEntity());
    };

    const handleRoleChanged = () => {
      setProfile(getUserProfile());
    };

    window.addEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleSwitch);
    window.addEventListener('xentro-linked-entities-updated', handleLinkedUpdated);
    window.addEventListener('xentro-role-changed', handleRoleChanged);

    return () => {
      window.removeEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleSwitch);
      window.removeEventListener('xentro-linked-entities-updated', handleLinkedUpdated);
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPersonal = () => {
    entityContextService.setActiveEntityId(null);
    setIsOpen(false);
    showToast(`Switched to Personal Profile: ${profile.name || 'Personal Account'}`, 'info');
  };

  const handleSelectEntity = (entity: LinkedEntity) => {
    entityContextService.setActiveEntityId(entity.id);
    setIsOpen(false);
    showToast(`Switched to ${entity.name} (${entity.accountType || 'Entity Account'}) workspace`, 'success');
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onOpenEntityModal) {
      onOpenEntityModal();
    } else {
      window.dispatchEvent(new CustomEvent('xentro-open-entity-modal'));
    }
  };

  const isPersonalActive = !activeEntity;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs select-none ${
          !isPersonalActive
            ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-white dark:bg-[#181B1A] hover:bg-gray-50 dark:hover:bg-[#202422] text-[#101212] dark:text-white border-[#E5E7EB] dark:border-[#262A29]'
        }`}
        title="Switch Account Profile / Entity Workspace"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {!isPersonalActive ? (
            activeEntity?.entityType === 'INVESTOR_ORG' ? (
              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            ) : (
              <Rocket className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )
          ) : (
            <User className="w-3.5 h-3.5 text-[#565B59] dark:text-[#8E9290] shrink-0" />
          )}

          <div className="text-left truncate max-w-[140px] sm:max-w-[180px]">
            <span className="block truncate font-bold text-xs">
              {!isPersonalActive ? activeEntity?.name : profile.name || 'Personal Profile'}
            </span>
          </div>

          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-[#565B59] dark:text-gray-300 shrink-0">
            {!isPersonalActive ? activeEntity?.entityType === 'STARTUP' ? 'Startup' : 'Org' : 'Personal'}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Switcher Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 bg-white dark:bg-[#181B1A] rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-3 z-50 animate-fade-slide">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB] dark:border-[#262A29]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
              Account &amp; Workspace Switcher
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {linkedEntities.length} Entity{linkedEntities.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Section 1: Personal Account */}
          <div className="mb-2.5">
            <span className="block text-[10px] font-semibold text-[#565B59] dark:text-[#8E9290] uppercase tracking-wider px-2 mb-1">
              Personal Account
            </span>
            <div
              onClick={handleSelectPersonal}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                isPersonalActive
                  ? 'bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/40'
                  : 'hover:bg-gray-50 dark:hover:bg-[#202422]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#565B59] dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                      {profile.name || 'Personal Account'}
                    </p>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-200 dark:bg-white/15 text-[#565B59] dark:text-gray-300">
                      {profile.role || 'Explorer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] truncate">
                    {profile.email || 'Personal Profile'}
                  </p>
                </div>
              </div>
              {isPersonalActive && <Check className="w-4 h-4 text-[#9EBE12] shrink-0" />}
            </div>
          </div>

          {/* Section 2: Dedicated Entity Accounts */}
          <div className="space-y-1 mb-2.5">
            <span className="block text-[10px] font-semibold text-[#565B59] dark:text-[#8E9290] uppercase tracking-wider px-2 mb-1">
              Dedicated Entity Accounts
            </span>

            {linkedEntities.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-gray-50 dark:bg-[#202422]/60 text-xs text-[#565B59] dark:text-[#8E9290]">
                No entity accounts registered yet.
              </div>
            ) : (
              linkedEntities.map((ent) => {
                const isActive = activeEntity?.id === ent.id;
                const isStartup = ent.entityType === 'STARTUP';
                return (
                  <div
                    key={ent.id}
                    onClick={() => handleSelectEntity(ent)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                        : 'hover:bg-gray-50 dark:hover:bg-[#202422]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isStartup
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isStartup ? (
                          <Rocket className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                            {ent.name}
                          </p>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              isStartup
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {ent.entityType}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#565B59] dark:text-[#8E9290] font-mono truncate">
                          {ent.id} {ent.sector ? `• ${ent.sector}` : ''}
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Action: Create New Entity Account */}
          <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#262A29]">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full py-2 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-[#D9FF3F]/20 text-[#101212] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-dashed border-gray-300 dark:border-[#262A29]"
            >
              <Plus className="w-3.5 h-3.5 text-[#9EBE12]" />
              <span>Register New Entity Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
