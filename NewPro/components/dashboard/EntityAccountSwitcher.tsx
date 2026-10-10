'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  Building2,
  Grid2X2,
  Building,
  User,
  ChevronDown,
  Check,
  Plus,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ArrowLeftRight,
  TrendingUp,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import {
  entityContextService,
  LinkedEntity,
  PersonalAccountContext,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

interface EntityAccountSwitcherProps {
  onOpenEntityModal?: () => void;
  className?: string;
  variant?: 'header' | 'profile-action' | 'inline';
}

export const EntityAccountSwitcher: React.FC<EntityAccountSwitcherProps> = ({
  onOpenEntityModal,
  className = '',
  variant = 'header',
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>(() =>
    entityContextService.getLinkedEntities()
  );
  const [personalAccount, setPersonalAccount] = useState<PersonalAccountContext | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Authoritative sync from MongoDB via entityContextService
  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);

    if (p.id) {
      entityContextService.fetchEligibleWorkspaces(p.id).then((res) => {
        setLinkedEntities(res.eligibleEntities);
        setPersonalAccount(res.personalAccount);
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
      const updated = getUserProfile();
      setProfile(updated);
      if (updated.id) {
        entityContextService.fetchEligibleWorkspaces(updated.id).then((res) => {
          setLinkedEntities(res.eligibleEntities);
          setPersonalAccount(res.personalAccount);
        });
      }
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

  // Close on outside click
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

  const handleSelectPersonal = async () => {
    if (isPersonalActive) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const res = await entityContextService.switchPersona(profile.id, null);
      setIsOpen(false);
      showToast(res.message, 'info');

      // Navigate to correct personal destination per requirement:
      // Explorer -> Feed; Mentor -> Mentor Dashboard; Individual Investor -> Individual Investor Dashboard
      if (typeof window !== 'undefined') {
        const dest = res.destinationTab;
        window.dispatchEvent(
          new CustomEvent('xentro-navigate-tab', {
            detail: { tab: dest },
          })
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to switch to personal account.', 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectEntity = async (entity: LinkedEntity) => {
    if (activeEntity?.id === entity.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const res = await entityContextService.switchPersona(profile.id, entity.id);
      setIsOpen(false);
      showToast(res.message, 'success');

      // Navigate to authorized entity dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('xentro-navigate-tab', {
            detail: { tab: 'dashboard' },
          })
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Authorization check failed for this entity.', 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  const isPersonalActive = !activeEntity;

  const getEntityIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('investor') || t.includes('fund') || t.includes('vc')) {
      return <Building2 className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (t.includes('esp') || t.includes('incubator')) {
      return <Grid2X2 className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (t.includes('institut')) {
      return <Building className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    return <Rocket className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

  const personalRoleName =
    personalAccount?.role ||
    (profile.role === 'mentor'
      ? 'Mentor'
      : profile.role === 'investor'
      ? 'Individual Investor'
      : 'Explorer');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button: Profile-Action Variant vs Header Variant */}
      {variant === 'profile-action' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSwitching}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white hover:bg-gray-50 dark:hover:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          title="Switch Persona / Active Workspace"
        >
          {isSwitching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9EBE12]" />
          ) : (
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#9EBE12]" />
          )}
          <span>Switch Persona</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSwitching}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs select-none ${
            !isPersonalActive
              ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-white dark:bg-[#181B1A] hover:bg-gray-50 dark:hover:bg-[#202422] text-[#101212] dark:text-white border-[#E5E7EB] dark:border-[#262A29]'
          }`}
          title="Switch Account Profile / Entity Workspace"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isSwitching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            ) : !isPersonalActive ? (
              getEntityIcon(activeEntity?.entityType || 'Startup')
            ) : (
              <User className="w-3.5 h-3.5 text-[#565B59] dark:text-[#8E9290] shrink-0" />
            )}

            <div className="text-left truncate max-w-[130px] sm:max-w-[170px]">
              <span className="block truncate font-bold text-xs">
                {!isPersonalActive ? activeEntity?.name : profile.name || 'Personal Account'}
              </span>
            </div>

            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-[#565B59] dark:text-gray-300 shrink-0">
              {!isPersonalActive ? activeEntity?.entityType || 'Entity' : personalRoleName}
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Switcher Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-92 bg-white dark:bg-[#181B1A] rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-3.5 z-50 animate-fade-slide">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB] dark:border-[#262A29]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-white flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#9EBE12]" />
                <span>Switch Persona Workspace</span>
              </h3>
              <p className="text-[10px] text-[#565B59] dark:text-[#8E9290] mt-0.5">
                Toggle between personal identity and authorized organizations.
              </p>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {linkedEntities.length} Org{linkedEntities.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Section 1: Personal Account */}
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-[#565B59] dark:text-[#8E9290] uppercase tracking-wider px-2 mb-1.5">
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
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#565B59] dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                      {profile.name || 'Personal Account'}
                    </p>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-gray-200 dark:bg-white/15 text-[#565B59] dark:text-gray-300">
                      {personalRoleName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] truncate">
                    Destination: {personalRoleName === 'Explorer' ? 'Feed' : `${personalRoleName} Dashboard`}
                  </p>
                </div>
              </div>
              {isPersonalActive && <Check className="w-4 h-4 text-[#9EBE12] shrink-0" />}
            </div>
          </div>

          {/* Section 2: Authorized Entity Dashboards (Real MongoDB Memberships Only) */}
          <div className="space-y-1 mb-2">
            <span className="block text-[10px] font-bold text-[#565B59] dark:text-[#8E9290] uppercase tracking-wider px-2 mb-1.5">
              Authorized Entity Dashboards
            </span>

            {linkedEntities.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-gray-50 dark:bg-[#202422]/60 text-xs text-[#565B59] dark:text-[#8E9290]">
                No authorized entity memberships found.
              </div>
            ) : (
              linkedEntities.map((ent) => {
                const isActive = activeEntity?.id === ent.id;
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                        {ent.logo ? (
                          <img
                            src={ent.logo}
                            alt={ent.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          getEntityIcon(ent.entityType)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                            {ent.name}
                          </p>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            {ent.entityType}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#565B59] dark:text-[#8E9290] truncate">
                          Role: <span className="font-semibold">{ent.role || 'Member'}</span> &bull; Status:{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {ent.membershipStatus || 'ACTIVE'}
                          </span>
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
