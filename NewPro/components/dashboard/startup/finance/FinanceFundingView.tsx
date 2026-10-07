'use client';

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  PieChart,
  ShieldCheck,
  Award,
  ArrowRight,
  FolderLock,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { FundingRoundItem, GrantItem, CapitalStructureItem } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

interface FinanceFundingViewProps {
  onNavigateToDDLocker?: () => void;
}

export const FinanceFundingView: React.FC<FinanceFundingViewProps> = ({
  onNavigateToDDLocker,
}) => {
  const { showToast } = useToast();
  const fundingRounds = financeService.getFundingHistory();
  const grants = financeService.getGrants();
  const capStructure = financeService.getCapitalStructure();

  // Active section tab
  const [activeFundingSection, setActiveFundingSection] = useState<'rounds' | 'grants' | 'cap_table'>('rounds');

  const totalEquityRaised = fundingRounds.reduce((acc, curr) => acc + curr.amountRaised, 0);
  const totalGrantsAwarded = grants.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGrantsDisbursed = grants.reduce((acc, curr) => acc + curr.disbursedAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Funding Summary Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Funding History, Non-Dilutive Grants & Capital Structure
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Official Record
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Section 12 Architecture: Investor rounds, non-dilutive government grants, and high-level cap table ownership.
          </p>
        </div>

        {onNavigateToDDLocker && (
          <button
            onClick={onNavigateToDDLocker}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#282D2B] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
          >
            <FolderLock className="w-3.5 h-3.5 text-blue-500" />
            <span>Open DD Locker Documents</span>
          </button>
        )}
      </div>

      {/* Funding KPI Cards (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Venture Capital */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Total Venture Capital</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(totalEquityRaised)}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {fundingRounds.length} Completed Rounds
          </div>
        </div>

        {/* Non-Dilutive Grants */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Gov / Non-Dilutive Grants</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(totalGrantsAwarded)}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            {formatCurrency(totalGrantsDisbursed)} Disbursed (0% Dilution)
          </div>
        </div>

        {/* Latest Post-Money Valuation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Latest Valuation</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {fundingRounds[0]?.postMoneyValuation
              ? formatCurrency(fundingRounds[0].postMoneyValuation)
              : '₹1.25 Cr'}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Post-money basis ({fundingRounds[0]?.roundType || 'Pre-Seed'})
          </div>
        </div>

        {/* Current Round Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Fundraising Status</span>
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Seed In Progress
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
            Target: ₹1.00 Cr
          </div>
        </div>
      </div>

      {/* Internal Section Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveFundingSection('rounds')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFundingSection === 'rounds'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          Equity Funding Rounds ({fundingRounds.length})
        </button>
        <button
          onClick={() => setActiveFundingSection('grants')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFundingSection === 'grants'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          Grants & Subsidies ({grants.length})
        </button>
        <button
          onClick={() => setActiveFundingSection('cap_table')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeFundingSection === 'cap_table'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          Capital Structure ({capStructure.length})
        </button>
      </div>

      {/* 1. EQUITY FUNDING ROUNDS TABLE */}
      {activeFundingSection === 'rounds' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              Historical Venture Capital Rounds
            </h4>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Source: Sheet 4 (Funding History)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                  <th className="pb-3 px-3">Round</th>
                  <th className="pb-3 px-3">Closing Date</th>
                  <th className="pb-3 px-3">Amount Raised</th>
                  <th className="pb-3 px-3">Lead / Syndicate</th>
                  <th className="pb-3 px-3">Instrument</th>
                  <th className="pb-3 px-3">Pre-Money</th>
                  <th className="pb-3 px-3">Post-Money</th>
                  <th className="pb-3 px-3">Dilution</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {fundingRounds.map((round) => (
                  <tr key={round.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                    <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">
                      {round.roundType}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {round.date}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(round.amountRaised)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#101212] dark:text-white">
                      {round.investorName} ({round.investorType})
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {round.instrument}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {round.preMoneyValuation ? formatCurrency(round.preMoneyValuation) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      {round.postMoneyValuation ? formatCurrency(round.postMoneyValuation) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-red-500">
                      {round.equityDilutedPct}%
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {round.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. GRANTS & SUBSIDIES (Kept strictly separate from equity) */}
      {activeFundingSection === 'grants' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Non-Dilutive Grants & Government Subsidies
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Section 12 Mandate: Grants must remain separate from investor equity capital.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 font-bold text-xs">
              0% Equity Dilution
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                  <th className="pb-3 px-3">Grant Program</th>
                  <th className="pb-3 px-3">Awarding Agency</th>
                  <th className="pb-3 px-3">Date Awarded</th>
                  <th className="pb-3 px-3">Total Sanctioned</th>
                  <th className="pb-3 px-3">Disbursed to Bank</th>
                  <th className="pb-3 px-3">Milestone Progress</th>
                  <th className="pb-3 px-3">Terms & Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {grants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                    <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">
                      {grant.grantName}
                    </td>
                    <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                      {grant.agencyOrGov}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {grant.dateAwarded}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(grant.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(grant.disbursedAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                        {grant.milestoneStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                      {grant.terms || 'Proof of concept development and verification'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CAPITAL STRUCTURE */}
      {activeFundingSection === 'cap_table' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                High-Level Capital Structure
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Ownership allocation and equity pools. Detailed legal cap tables remain securely held in DD Locker.
              </p>
            </div>
            {onNavigateToDDLocker && (
              <button
                onClick={onNavigateToDDLocker}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Legal Cap Table in DD Locker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capStructure.map((stake) => (
              <div
                key={stake.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    {stake.stakeholder}
                  </span>
                  <span className="text-base font-mono font-bold text-[#101212] dark:text-white">
                    {stake.ownershipPct}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-gray-200 dark:bg-[#262A29] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D9FF3F] h-full rounded-full"
                      style={{ width: `${stake.ownershipPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                    <span>{stake.shareClass}</span>
                    <span className="font-mono">{stake.sharesCount ? stake.sharesCount.toLocaleString() : '—'} Shares</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DD Locker Notice Banner */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <FolderLock className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="text-[#565B59] dark:text-[#B6B8B7]">
                Shareholders agreements, share certificates, and board resolutions are encrypted in{' '}
                <strong className="text-[#101212] dark:text-white">DD Locker → Corporate & Legal</strong>.
              </span>
            </div>
            {onNavigateToDDLocker && (
              <button
                onClick={onNavigateToDDLocker}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white shadow-2xs hover:bg-gray-100 cursor-pointer shrink-0"
              >
                Access DD Locker
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
