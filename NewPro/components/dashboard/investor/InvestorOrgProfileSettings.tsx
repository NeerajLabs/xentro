'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  Eye,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Globe,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import {
  InvestorOrganization,
  InvestorOrganizationType,
  INVESTOR_ORG_TYPES,
} from '@/types/investorOrganization';
import { useToast } from '@/components/ui/Toast';

interface InvestorOrgProfileSettingsProps {
  onViewPreview?: () => void;
  organizationId?: string;
}

export const InvestorOrgProfileSettings: React.FC<InvestorOrgProfileSettingsProps> = ({
  onViewPreview,
  organizationId,
}) => {
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<
    'identity' | 'focus' | 'value' | 'criteria' | 'process' | 'connect'
  >('identity');

  const [org, setOrg] = useState<InvestorOrganization>(() => {
    const orgs = investorOrganizationService.getOrganizations();
    if (organizationId) {
      const match = orgs.find((o) => o.id === organizationId);
      if (match) return match;
    }
    const active = investorOrganizationService.getActiveOrganization();
    if (active) return active;
    return orgs.find((o) => o.id === 'org_apex_vc') || orgs[0];
  });

  useEffect(() => {
    const handleOrgUpdate = () => {
      const orgs = investorOrganizationService.getOrganizations();
      const active = investorOrganizationService.getActiveOrganization();
      const current =
        (organizationId ? orgs.find((o) => o.id === organizationId) : null) ||
        active ||
        orgs.find((o) => o.id === 'org_apex_vc') ||
        orgs[0];
      if (current) setOrg(current);
    };

    window.addEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, handleOrgUpdate);
    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleOrgUpdate);
    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, handleOrgUpdate);
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleOrgUpdate);
    };
  }, [organizationId]);

  const handleSave = () => {
    const updated = investorOrganizationService.updateInvestorOrganization(org.id, org);
    if (updated) {
      showToast('Organization profile saved and published!', 'success');
    }
  };

  const categories = [
    { id: 'identity', label: 'Organization Identity' },
    { id: 'focus', label: 'Investment Focus & Cheque' },
    { id: 'value', label: 'Value Beyond Capital' },
    { id: 'criteria', label: 'Criteria & Diligence' },
    { id: 'process', label: 'Investment Process' },
    { id: 'connect', label: 'Connection Guidelines' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white">
              Organization Profile Settings
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
              {org.organizationType}
            </span>
            {org.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
            Manage institutional strategy, fund size, and public presence for{' '}
            <span className="font-semibold text-[#101212] dark:text-white">{org.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewPreview && (
            <button
              type="button"
              onClick={onViewPreview}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
              <span>Preview Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-90 active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active Section Content */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        {/* 1. IDENTITY */}
        {activeCategory === 'identity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Institutional Identity & Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Organization Type
                </label>
                <select
                  value={org.organizationType}
                  onChange={(e) =>
                    setOrg({ ...org, organizationType: e.target.value as InvestorOrganizationType })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                >
                  {INVESTOR_ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={org.shortDescription}
                  onChange={(e) => setOrg({ ...org, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={org.officialEmail}
                  onChange={(e) => setOrg({ ...org, officialEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={org.website}
                  onChange={(e) => setOrg({ ...org, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Fund Size
                </label>
                <input
                  type="text"
                  value={org.fundSize || ''}
                  onChange={(e) => setOrg({ ...org, fundSize: e.target.value })}
                  placeholder="e.g. ₹500 Cr ($60M Fund III)"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  AUM (Assets Under Management)
                </label>
                <input
                  type="text"
                  value={org.aum || ''}
                  onChange={(e) => setOrg({ ...org, aum: e.target.value })}
                  placeholder="e.g. ₹1,200 Cr AUM"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. FOCUS & TICKET */}
        {activeCategory === 'focus' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Institutional Investment Focus & Cheque Size
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Min Ticket Size
                </label>
                <input
                  type="text"
                  value={org.investmentFocus.ticketSize.min}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      investmentFocus: {
                        ...org.investmentFocus,
                        ticketSize: {
                          ...org.investmentFocus.ticketSize,
                          min: e.target.value,
                          formatted: `${e.target.value} – ${org.investmentFocus.ticketSize.max}`,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Max Ticket Size
                </label>
                <input
                  type="text"
                  value={org.investmentFocus.ticketSize.max}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      investmentFocus: {
                        ...org.investmentFocus,
                        ticketSize: {
                          ...org.investmentFocus.ticketSize,
                          max: e.target.value,
                          formatted: `${org.investmentFocus.ticketSize.min} – ${e.target.value}`,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Lead / Co-Investment Preference
                </label>
                <input
                  type="text"
                  value={org.investmentFocus.leadInvestorPreference || ''}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      investmentFocus: {
                        ...org.investmentFocus,
                        leadInvestorPreference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. VALUE BEYOND CAPITAL */}
        {activeCategory === 'value' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Value Beyond Capital & Platform Support
            </h3>

            <div>
              <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                Platform Support Narrative
              </label>
              <textarea
                rows={3}
                value={org.valueBeyondCapital.whatIBringToFounders}
                onChange={(e) =>
                  setOrg({
                    ...org,
                    valueBeyondCapital: {
                      ...org.valueBeyondCapital,
                      whatIBringToFounders: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
          </div>
        )}

        {/* 4. CRITERIA */}
        {activeCategory === 'criteria' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Investment Criteria & Diligence
            </h3>

            <div>
              <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                Core Evaluation Benchmarks
              </label>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mb-2">
                List the key requirements and moats your investment committee looks for.
              </p>
              <textarea
                rows={3}
                value={org.investmentCriteria.evaluationCriteria.join('\n')}
                onChange={(e) =>
                  setOrg({
                    ...org,
                    investmentCriteria: {
                      ...org.investmentCriteria,
                      evaluationCriteria: e.target.value.split('\n').filter((l) => l.trim()),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
          </div>
        )}

        {/* 5. PROCESS */}
        {activeCategory === 'process' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Investment Process & Decision Timeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Typical Decision Timeline
                </label>
                <input
                  type="text"
                  value={org.investmentProcess.typicalDecisionTimeline}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      investmentProcess: {
                        ...org.investmentProcess,
                        typicalDecisionTimeline: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Preferred Connection Method
                </label>
                <input
                  type="text"
                  value={org.investmentProcess.preferredConnectionMethod}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      investmentProcess: {
                        ...org.investmentProcess,
                        preferredConnectionMethod: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. GUIDELINES */}
        {activeCategory === 'connect' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Pitch & Connection Preferences
            </h3>

            <div>
              <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                Pitch Submission Guidelines
              </label>
              <textarea
                rows={3}
                value={org.connectionPreferences.guidelines || ''}
                onChange={(e) =>
                  setOrg({
                    ...org,
                    connectionPreferences: {
                      ...org.connectionPreferences,
                      guidelines: e.target.value,
                    },
                  })
                }
                placeholder="Guidelines shown to founders when submitting pitches..."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
