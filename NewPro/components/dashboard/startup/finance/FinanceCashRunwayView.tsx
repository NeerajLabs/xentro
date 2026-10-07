'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Clock,
  Flame,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  DollarSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { FinancialUpdateRecord } from '@/types/finance';

export const FinanceCashRunwayView: React.FC = () => {
  const updates = financeService.getFinancialUpdates();
  const latestUpdate: FinancialUpdateRecord | undefined = updates[0];

  const openingCash = latestUpdate?.openingCashBalance || 0;
  const closingCash = latestUpdate?.closingCashBalance || 0;
  const totalRevenue = latestUpdate?.totalRevenue || 0;
  const totalExpenses = latestUpdate?.totalExpenses || 0;

  // Net Burn rule: Total Expenses - Total Revenue
  const rawNetBurn = totalExpenses - totalRevenue;
  const isCashFlowPositive = rawNetBurn <= 0;

  // Runway rule: Closing Cash / Average Monthly Net Burn
  const runwayMonths =
    !isCashFlowPositive && rawNetBurn > 0
      ? Math.round((closingCash / rawNetBurn) * 10) / 10
      : null;

  // Scenario Simulator state
  const [revenueChangePct, setRevenueChangePct] = useState<number>(0);
  const [expenseChangePct, setExpenseChangePct] = useState<number>(0);

  const simulatedRevenue = totalRevenue * (1 + revenueChangePct / 100);
  const simulatedExpenses = totalExpenses * (1 + expenseChangePct / 100);
  const simulatedNetBurn = simulatedExpenses - simulatedRevenue;
  const simulatedIsPositive = simulatedNetBurn <= 0;
  const simulatedRunway =
    !simulatedIsPositive && simulatedNetBurn > 0
      ? Math.round((closingCash / simulatedNetBurn) * 10) / 10
      : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Telemetry Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Cash Reserves & Runway Telemetry
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Bank Escrow</span>
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Liquid capital in bank, monthly net burn rate, and capital depletion horizon.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#565B59] dark:text-[#B6B8B7]">Reporting Period:</span>
          <span className="font-bold text-[#101212] dark:text-white px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#202422]">
            {latestUpdate?.period || 'Latest'}
          </span>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Closing Cash */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Liquid Cash in Bank</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(closingCash)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            <span>Opening Balance:</span>
            <span className="font-mono text-[#101212] dark:text-white font-semibold">
              {formatCurrency(openingCash)}
            </span>
          </div>
        </div>

        {/* Net Monthly Burn */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Net Monthly Burn</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {isCashFlowPositive ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-xl">
                Cash Flow Positive
              </span>
            ) : (
              formatCurrency(rawNetBurn)
            )}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Expenses ({formatCurrency(totalExpenses)}) - Rev ({formatCurrency(totalRevenue)})
          </div>
        </div>

        {/* Estimated Runway */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Estimated Runway</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {isCashFlowPositive ? (
              <span className="text-emerald-600 text-sm font-semibold">
                Runway not applicable — cash-flow positive
              </span>
            ) : (
              `${runwayMonths} Months`
            )}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Based on closing cash / net monthly burn
          </div>
        </div>

        {/* Gross Burn Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Gross Burn (Expenses)</span>
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Operating expenditure before revenue offset
          </div>
        </div>
      </div>

      {/* Runway Scenario Stress-Testing Simulator */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#D9FF3F]" />
              <span>Interactive Runway & Burn Scenario Simulator</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Simulate growth acceleration or expense changes to project future runway months.
            </p>
          </div>
          <button
            onClick={() => {
              setRevenueChangePct(0);
              setExpenseChangePct(0);
            }}
            className="text-xs font-bold text-gray-500 hover:text-[#101212] dark:hover:text-white cursor-pointer"
          >
            Reset Sliders
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Change Slider */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#101212] dark:text-white">
                Revenue Growth Adjustment:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {revenueChangePct >= 0 ? `+${revenueChangePct}%` : `${revenueChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="150"
              step="5"
              value={revenueChangePct}
              onChange={(e) => setRevenueChangePct(Number(e.target.value))}
              className="w-full accent-[#D9FF3F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
              <span>-50%</span>
              <span>Projected: {formatCurrency(simulatedRevenue)}</span>
              <span>+150%</span>
            </div>
          </div>

          {/* Expense Change Slider */}
          <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#101212] dark:text-white">
                Expense Adjustment:
              </span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                {expenseChangePct >= 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="100"
              step="5"
              value={expenseChangePct}
              onChange={(e) => setExpenseChangePct(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
              <span>-40%</span>
              <span>Projected: {formatCurrency(simulatedExpenses)}</span>
              <span>+100%</span>
            </div>
          </div>
        </div>

        {/* Simulator Projected Outcome Box */}
        <div className="p-4 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
              <span>Projected Scenario Outcome</span>
            </span>
            <p className="text-[#565B59] dark:text-[#B6B8B7]">
              Simulated Monthly Net Burn:{' '}
              <strong className="font-mono text-[#101212] dark:text-white">
                {simulatedIsPositive ? 'Cash Flow Positive' : formatCurrency(simulatedNetBurn)}
              </strong>
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Simulated Runway:</span>
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white font-mono">
              {simulatedIsPositive ? (
                <span className="text-emerald-600 text-lg">Cash Flow Positive</span>
              ) : (
                `${simulatedRunway} Months`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Cash Balance Trajectory Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
          Historical Cash Trajectory & Monthly Net Burn
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Period</th>
                <th className="pb-3 px-3">Opening Cash</th>
                <th className="pb-3 px-3">Closing Cash</th>
                <th className="pb-3 px-3">Net Outflow / Inflow</th>
                <th className="pb-3 px-3">Net Burn Rate</th>
                <th className="pb-3 px-3">Runway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {updates.map((u) => {
                const burn = u.totalExpenses - u.totalRevenue;
                const isPos = burn <= 0;
                const runw = !isPos && burn > 0 ? Math.round((u.closingCashBalance / burn) * 10) / 10 : null;
                const delta = u.closingCashBalance - u.openingCashBalance;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                    <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">{u.period}</td>
                    <td className="py-3 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {formatCurrency(u.openingCashBalance)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(u.closingCashBalance)}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      {delta >= 0 ? (
                        <span className="text-emerald-600">+{formatCurrency(delta)}</span>
                      ) : (
                        <span className="text-red-600">{formatCurrency(delta)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isPos ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          Cash Flow Positive
                        </span>
                      ) : (
                        <span className="font-mono text-red-600 font-semibold">{formatCurrency(burn)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isPos ? (
                        <span className="text-[10px] text-emerald-600 font-bold">Profitable</span>
                      ) : (
                        <span className="font-mono font-bold text-[#101212] dark:text-white">{runw} Months</span>
                      )}
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
