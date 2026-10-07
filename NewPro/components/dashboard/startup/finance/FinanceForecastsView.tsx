'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Flame,
  Wallet,
  Clock,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sliders,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { FinancialForecastItem } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

export const FinanceForecastsView: React.FC = () => {
  const { showToast } = useToast();
  const allForecasts = financeService.getForecasts();
  const [selectedScenario, setSelectedScenario] = useState<'Baseline' | 'Optimistic' | 'Conservative'>('Baseline');

  const filteredForecasts = allForecasts.filter((f) => f.scenario === selectedScenario);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Pro Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-purple-500/10 via-blue-500/10 to-[#D9FF3F]/10 border border-purple-500/20 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <span>Financial Projections & AI Forecasts</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-2xs">
              Pro Feature
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Predictive multi-quarter forward projections across baseline, aggressive growth, and conservative runway preservation scenarios.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center p-1 bg-white dark:bg-[#181B1A] rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold shadow-2xs self-start md:self-auto">
          <button
            onClick={() => setSelectedScenario('Baseline')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedScenario === 'Baseline'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Baseline
          </button>
          <button
            onClick={() => setSelectedScenario('Optimistic')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedScenario === 'Optimistic'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Optimistic (+35%)
          </button>
          <button
            onClick={() => setSelectedScenario('Conservative')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedScenario === 'Conservative'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Conservative (-15%)
          </button>
        </div>
      </div>

      {/* Pro Entitlement Notice (Section 24) */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
          <div className="text-[#565B59] dark:text-[#B6B8B7]">
            <strong className="text-[#101212] dark:text-white">Section 24 Entitlement Rule:</strong> Standard plan accounts retain full access to all historical uploads, reports, and calculations. Upgrading to or downgrading from Pro never deletes historical financial records.
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px] shrink-0">
          Pro Active in Workspace
        </span>
      </div>

      {/* 3-Month Forward Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredForecasts.map((f, idx) => (
          <div
            key={f.id || idx}
            className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
              <span className="text-xs font-bold text-[#101212] dark:text-white">
                {f.period} Projection
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600">
                {f.scenario}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Projected Revenue:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(f.projectedRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Projected Expenses:</span>
                <span className="font-mono font-semibold text-[#101212] dark:text-white">
                  {formatCurrency(f.projectedExpenses)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Projected Net Burn:</span>
                <span className="font-mono font-semibold text-red-500">
                  {formatCurrency(f.projectedNetBurn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Projected Cash Reserve:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(f.projectedCashBalance)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-[#262A29]">
                <span className="font-bold text-[#101212] dark:text-white">Projected Runway:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {f.projectedRunway} Months
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast Projections Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
          Itemized Multi-Scenario Forecast Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Period</th>
                <th className="pb-3 px-3">Scenario</th>
                <th className="pb-3 px-3">Projected Revenue</th>
                <th className="pb-3 px-3">Projected Expenses</th>
                <th className="pb-3 px-3">Projected Net Burn</th>
                <th className="pb-3 px-3">Projected Cash Balance</th>
                <th className="pb-3 px-3">Runway Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {allForecasts.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                  <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">{f.period}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-[#202422]">
                      {f.scenario}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(f.projectedRevenue)}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#101212] dark:text-white">
                    {formatCurrency(f.projectedExpenses)}
                  </td>
                  <td className="py-3 px-3 font-mono text-red-600 dark:text-red-400">
                    {formatCurrency(f.projectedNetBurn)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(f.projectedCashBalance)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {f.projectedRunway} Months
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
