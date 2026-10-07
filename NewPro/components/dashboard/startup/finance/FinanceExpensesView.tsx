'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Flame,
  TrendingDown,
  AlertTriangle,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { ExpenseBreakdownItem, FinancialUpdateRecord } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

export const FinanceExpensesView: React.FC = () => {
  const { showToast } = useToast();
  const updates = financeService.getFinancialUpdates();
  const allExpenseItems = financeService.getExpenseBreakdown();

  const latestPeriod = updates[0]?.period || 'Sep 2026';
  const [selectedPeriod, setSelectedPeriod] = useState<string>(latestPeriod);

  const currentUpdate: FinancialUpdateRecord | undefined = updates.find(
    (u) => u.period === selectedPeriod
  ) || updates[0];

  const currentExpenseBreakdown: ExpenseBreakdownItem[] = allExpenseItems.filter(
    (item) => item.period === selectedPeriod
  );

  // Calculate sum of category breakdowns
  const breakdownSum = currentExpenseBreakdown.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = currentUpdate?.totalExpenses || 0;
  const isMismatch = Math.abs(breakdownSum - totalExpenses) > 1;

  // Gross Burn is strictly Total Expenses
  const grossBurn = totalExpenses;

  // Previous period comparison for expense trend
  const currentIndex = updates.findIndex((u) => u.period === selectedPeriod);
  const prevUpdate = currentIndex >= 0 && currentIndex < updates.length - 1 ? updates[currentIndex + 1] : undefined;
  let expenseDeltaPct = 0;
  if (prevUpdate && prevUpdate.totalExpenses > 0) {
    expenseDeltaPct = Math.round(((totalExpenses - prevUpdate.totalExpenses) / prevUpdate.totalExpenses) * 100);
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Header & Period Selector */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Operating Expenses & Gross Burn
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400">
              Gross Burn = Total Expenses
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Monitor department cost drivers, infrastructure hosting, payroll allocations, and monthly spend trajectories.
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

      {/* Section 11 Validation Mismatch Warning */}
      {isMismatch && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              Section 11 Notice: Expense Breakdown sum does not match Total Expenses
            </span>
            <p>
              The sum of itemized expense categories for {selectedPeriod} is{' '}
              <strong className="font-mono">{formatCurrency(breakdownSum)}</strong>, while recorded Total Expenses is{' '}
              <strong className="font-mono">{formatCurrency(totalExpenses)}</strong> (Variance of {formatCurrency(Math.abs(breakdownSum - totalExpenses))}).
              Verify spreadsheet entries for miscellaneous unclassified outflows.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Total Expenses ({selectedPeriod})</span>
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {expenseDeltaPct > 0 ? (
              <span className="text-red-500 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{expenseDeltaPct}% MoM
              </span>
            ) : expenseDeltaPct < 0 ? (
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> {expenseDeltaPct}% MoM
              </span>
            ) : (
              <span>Stable MoM</span>
            )}
            <span>vs previous period</span>
          </div>
        </div>

        {/* Gross Monthly Burn */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Gross Monthly Burn</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(grossBurn)}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Gross Burn = Total operational outflows
          </div>
        </div>

        {/* Itemized Categories Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Active Cost Centers</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {currentExpenseBreakdown.length} Categories
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Breakdown sum: <strong className="font-mono text-[#101212] dark:text-white">{formatCurrency(breakdownSum)}</strong>
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              Category Distribution ({selectedPeriod})
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Visual breakdown of departmental expenses and operational expenditure.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#101212] dark:text-white bg-gray-100 dark:bg-[#202422] px-3 py-1.5 rounded-xl">
            Total Burn: {formatCurrency(totalExpenses)}
          </span>
        </div>

        {currentExpenseBreakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-[#262A29] rounded-2xl">
            No itemized expenses recorded for {selectedPeriod}. Upload an XLSX with the "Expense Breakdown" sheet or import expense_breakdown.csv.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentExpenseBreakdown.map((item) => {
              const share = totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#101212] dark:text-white">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    {item.description || 'Department operational cost center'}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                      <span>Share of Gross Burn</span>
                      <span className="font-mono font-bold">{share}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#262A29] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all duration-500"
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

      {/* Historical Expenses Trend Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
          Historical Monthly Expense Trajectory
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Period</th>
                <th className="pb-3 px-3">Total Expenses</th>
                <th className="pb-3 px-3">Gross Monthly Burn</th>
                <th className="pb-3 px-3">MoM Spend Delta</th>
                <th className="pb-3 px-3">Source File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {updates.map((u, idx) => {
                const prev = updates[idx + 1];
                let spendDelta = '—';
                if (prev && prev.totalExpenses > 0) {
                  const pct = Math.round(((u.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100);
                  spendDelta = pct > 0 ? `+${pct}%` : `${pct}%`;
                }
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                    <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">{u.period}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#101212] dark:text-white">
                      {formatCurrency(u.totalExpenses)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(u.totalExpenses)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                      {spendDelta}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {u.sourceFile}
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
