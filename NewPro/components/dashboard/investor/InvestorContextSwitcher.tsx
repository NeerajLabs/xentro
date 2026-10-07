'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import {
  ActiveInvestorContext,
  InvestorOrganization,
} from '@/types/investorOrganization';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile } from '@/lib/userProfile';

interface InvestorContextSwitcherProps {
  onCreateOrganization?: () => void;
  className?: string;
}

export const InvestorContextSwitcher: React.FC<InvestorContextSwitcherProps> = ({
  onCreateOrganization,
  className = '',
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<ActiveInvestorContext>(() =>
    investorOrganizationService.getActiveContext()
  );
  const [organizations, setOrganizations] = useState<InvestorOrganization[]>(() =>
    investorOrganizationService.getOrganizations()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.context) {
        setActiveContext(ce.detail.context);
      } else {
        setActiveContext(investorOrganizationService.getActiveContext());
      }
    };

    const handleOrgUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.orgs) {
        setOrganizations(ce.detail.orgs);
      } else {
        setOrganizations(investorOrganizationService.getOrganizations());
      }
    };

    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
    window.addEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, handleOrgUpdate);

    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
      window.removeEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, handleOrgUpdate);
    };
  }, []);

  // Close on click outside
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

  const activeOrg =
    activeContext.type === 'organization' && activeContext.organizationId
      ? organizations.find((o) => o.id === activeContext.organizationId) || organizations[0]
      : null;

  const handleSwitchToIndividual = () => {
    const nextContext: ActiveInvestorContext = { type: 'individual' };
    investorOrganizationService.setActiveContext(nextContext);
    setIsOpen(false);
    showToast(`Switched to Personal Account: ${getUserProfile().name || 'Individual Investor'}`, 'info');
  };

  const handleSwitchToOrg = (orgId: string, orgName: string) => {
    const nextContext: ActiveInvestorContext = {
      type: 'organization',
      organizationId: orgId,
    };
    investorOrganizationService.setActiveContext(nextContext);
    setIsOpen(false);
    showToast(`Switched to Institutional Account: ${orgName}`, 'success');
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] border border-[#E5E7EB] dark:border-[#262A29] transition-all cursor-pointer group shadow-2xs"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
            activeContext.type === 'organization'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-[#D9FF3F] dark:text-[#101212]'
              : 'bg-blue-600 text-white'
          }`}
        >
          {activeContext.type === 'organization' ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#101212] dark:text-white leading-tight truncate max-w-[160px] sm:max-w-[210px]">
              {activeContext.type === 'organization' && activeOrg
                ? activeOrg.name
                : (getUserProfile().name || 'Personal Account')}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                activeContext.type === 'organization'
                  ? 'bg-[#D9FF3F]/20 text-[#71870A] dark:text-[#D9FF3F]'
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}
            >
              {activeContext.type === 'organization'
                ? activeOrg?.organizationType || 'Entity'
                : 'Individual'}
            </span>
          </div>
          <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
            {activeContext.type === 'organization'
              ? 'Investor Organization Account'
              : 'Personal Angel Account'}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7] transition-transform duration-200 ml-1 ${
            isOpen ? 'rotate-180 text-[#101212] dark:text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl z-50 overflow-hidden animate-fade-slide">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-[#101212] border-b border-[#E5E7EB] dark:border-[#262A29]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
              Investment Context
            </p>
            <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
              Switch between Personal Account & Institutional Entities
            </p>
          </div>

          <div className="p-2 space-y-1">
            {/* Section 1: Individual Investor */}
            <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Personal Account
            </div>

            <button
              type="button"
              onClick={handleSwitchToIndividual}
              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                activeContext.type === 'individual'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#202422] text-[#101212] dark:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeContext.type === 'individual'
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{getUserProfile().name || 'Personal Account'}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        activeContext.type === 'individual'
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Angel
                    </span>
                  </div>
                  <p
                    className={`text-[10px] truncate ${
                      activeContext.type === 'individual'
                        ? 'text-gray-200 dark:text-gray-800'
                        : 'text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    Personal Deal Flow & Portfolio
                  </p>
                </div>
              </div>

              {activeContext.type === 'individual' && (
                <Check className="w-4 h-4 flex-shrink-0 text-[#D9FF3F] dark:text-[#101212]" />
              )}
            </button>

            {/* Section 2: Investor Organizations */}
            <div className="px-2 pt-2.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Investor Organizations
            </div>

            {organizations.map((org) => {
              const isSelected =
                activeContext.type === 'organization' && activeContext.organizationId === org.id;

              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSwitchToOrg(org.id, org.name)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-[#202422] text-[#101212] dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{org.name}</span>
                        {org.verified && (
                          <ShieldCheck
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isSelected
                                ? 'text-[#D9FF3F] dark:text-[#101212]'
                                : 'text-emerald-500'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span
                          className={`font-semibold ${
                            isSelected
                              ? 'text-gray-200 dark:text-gray-800'
                              : 'text-[#565B59] dark:text-[#B6B8B7]'
                          }`}
                        >
                          {org.organizationType}
                        </span>
                        {org.fundSize && (
                          <>
                            <span className="opacity-50">&bull;</span>
                            <span
                              className={`truncate ${
                                isSelected
                                  ? 'text-gray-200 dark:text-gray-800'
                                  : 'text-gray-400'
                              }`}
                            >
                              {org.fundSize}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0 text-[#D9FF3F] dark:text-[#101212]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action: + Create Investor Organization */}
          <div className="p-2 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#121414]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onCreateOrganization) {
                  onCreateOrganization();
                } else {
                  window.dispatchEvent(new CustomEvent('xentro-open-create-investor-org'));
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#c7ee2f] text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Investor Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
