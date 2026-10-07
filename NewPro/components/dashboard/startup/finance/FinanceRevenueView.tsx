'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Layers,
  PieChart,
  Plus,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { RevenueBreakdownItem, FinancialUpdateRecord } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

export const FinanceRevenueView: React.FC = () => {
  const { showToast } = useToast();
  const updates = financeService.getFinancialUpdates();
  const allRevenueItems = financeService.getRevenueBreakdown();

  // Period selector (defaults to latest period)
  const latestPeriod = updates[0]?.period || 'Sep 2026';
  const [selectedPeriod, setSelectedPeriod] = useState<string>(latestPeriod);

  const currentUpdate: FinancialUpdateRecord | undefined = updates.find(
    (u) => u.period === selectedPeriod
  ) || updates[0];

  const currentRevenueBreakdown: RevenueBreakdownItem[] = allRevenueItems.filter(
    (item) => item.period === selectedPeriod
  );

  // Calculate sum of category breakdowns
  const breakdownSum = currentRevenueBreakdown.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenue = currentUpdate?.totalRevenue || 0;
  const isMismatch = Math.abs(breakdownSum - totalRevenue) > 1;

  // ARPU
  const payingCustomers = currentUpdate?.payingCustomers || 0;
  const arpu = payingCustomers > 0 ? Math.round(totalRevenue / payingCustomers) : 0;

  // Revenue recurring %
  const recurringPct =
    totalRevenue > 0
      ? Math.round(((currentUpdate?.recurringRevenue || 0) / totalRevenue) * 100)
      : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner & Period Selector */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Revenue Analytics & Streams
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {currentUpdate?.revenueStatus || 'Revenue Generating'}
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Monitor recurring subscriptions, enterprise pilots, contract streams, and average revenue per user (ARPU).
          </p>
        </div>

        {/* Period Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white"
          >
            {updates.map((u) => (
              <option key={u.period} value={u.period}>
                {u.period} ({u.frequency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Warning if Breakdown sum does not equal Total Revenue */}
      {isMismatch && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              Section 11 Notice: Revenue Breakdown sum does not match Total Revenue
            </span>
            <p>
              The sum of itemized revenue streams for {selectedPeriod} is{' '}
              <strong className="font-mono">{formatCurrency(breakdownSum)}</strong>, while the recorded Total Revenue is{' '}
              <strong className="font-mono">{formatCurrency(totalRevenue)}</strong> (Difference of {formatCurrency(Math.abs(breakdownSum - totalRevenue))}).
              Check your spreadsheet source file for unallocated income or rounding variances.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Total Revenue ({selectedPeriod})</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            <span>Recurring share:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {recurringPct}%
            </span>
          </div>
        </div>

        {/* MRR & ARR */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">MRR / ARR Run-Rate</span>
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(currentUpdate?.mrr || 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            <span>Annualized ARR:</span>
            <span className="font-bold text-[#101212] dark:text-white font-mono">
              {formatCurrency(currentUpdate?.arr || 0)}
            </span>
          </div>
        </div>

        {/* Paying Customers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Paying Customers</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {payingCustomers}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            <span>Total registered:</span>
            <span className="font-bold text-[#101212] dark:text-white font-mono">
              {currentUpdate?.totalCustomers || 0}
            </span>
          </div>
        </div>

        {/* ARPU */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">ARPU (Per Paying User)</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(arpu)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            <span>Monthly avg yield</span>
            <span className="font-bold text-emerald-600 font-mono">Healthy</span>
          </div>
        </div>
      </div>

      {/* Revenue Stream Breakdown Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              Revenue Stream Breakdown ({selectedPeriod})
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Itemized revenue by product category, contract structure, and licensing terms.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#101212] dark:text-white bg-gray-100 dark:bg-[#202422] px-3 py-1.5 rounded-xl">
            Total Breakdown: {formatCurrency(breakdownSum)}
          </span>
        </div>

        {currentRevenueBreakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-[#262A29] rounded-2xl">
            No itemized revenue streams recorded for {selectedPeriod}. Upload an XLSX with the "Revenue Breakdown" sheet or import revenue_breakdown.csv.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRevenueBreakdown.map((item) => {
              const share = totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#101212] dark:text-white">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    {item.description || 'Standard stream allocation'}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                      <span>Share of Total Revenue</span>
                      <span className="font-mono font-bold">{share}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#262A29] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D9FF3F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(share, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Revenue & Customer Progression Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
          Historical Revenue & Customer Progression
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Period</th>
                <th className="pb-3 px-3">Total Revenue</th>
                <th className="pb-3 px-3">Recurring</th>
                <th className="pb-3 px-3">Non-Recurring</th>
                <th className="pb-3 px-3">MRR</th>
                <th className="pb-3 px-3">ARR Run-Rate</th>
                <th className="pb-3 px-3">Paying Customers</th>
                <th className="pb-3 px-3">MoM Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {updates.map((u, idx) => {
                const prev = updates[idx + 1];
                let growth = '—';
                if (prev && prev.totalRevenue > 0) {
                  const pct = Math.round(((u.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100);
                  growth = pct >= 0 ? `+${pct}%` : `${pct}%`;
                }
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                    <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">{u.period}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(u.totalRevenue)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {formatCurrency(u.recurringRevenue)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {formatCurrency(u.nonRecurringRevenue)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#101212] dark:text-white">
                      {formatCurrency(u.mrr)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {formatCurrency(u.arr)}
                    </td>
                    <td className="py-3 px-3 font-mono">{u.payingCustomers}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {growth}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
