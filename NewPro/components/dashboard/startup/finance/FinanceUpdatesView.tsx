'use client';

import React, { useState } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  Plus,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
  History,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { FinancialUpdateRecord, FinanceSourceFileVersion } from '@/types/finance';
import { financeService } from '@/lib/financeService';
import { useToast } from '@/components/ui/Toast';

interface FinanceUpdatesViewProps {
  onOpenUploadModal: () => void;
  onOpenManualModal?: () => void;
}

export const FinanceUpdatesView: React.FC<FinanceUpdatesViewProps> = ({
  onOpenUploadModal,
}) => {
  const { showToast } = useToast();
  const [frequencyFilter, setFrequencyFilter] = useState<'All' | 'Monthly' | 'Quarterly'>('All');
  const [selectedRecord, setSelectedRecord] = useState<FinancialUpdateRecord | null>(null);
  const [comparePeriodA, setComparePeriodA] = useState<string>('');
  const [comparePeriodB, setComparePeriodB] = useState<string>('');
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState<boolean>(false);

  const updates = financeService.getFinancialUpdates();
  const versions = financeService.getSourceVersions();

  const filteredUpdates = updates.filter((rec) => {
    if (frequencyFilter === 'All') return true;
    return rec.frequency === frequencyFilter;
  });

  const recordA = updates.find((u) => u.period === comparePeriodA);
  const recordB = updates.find((u) => u.period === comparePeriodB);

  const handleStartCompare = () => {
    if (updates.length < 2) {
      showToast('At least two reporting periods are required to compare.', 'info');
      return;
    }
    setComparePeriodA(updates[0]?.period || '');
    setComparePeriodB(updates[1]?.period || '');
    setIsCompareOpen(true);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getNetBurnBadge = (expenses: number, revenue: number) => {
    const netBurn = expenses - revenue;
    if (netBurn <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          Cash Flow Positive
        </span>
      );
    }
    return (
      <span className="font-mono text-red-600 dark:text-red-400 font-semibold">
        {formatCurrency(netBurn)}
      </span>
    );
  };

  const getRunwayBadge = (cash: number, expenses: number, revenue: number) => {
    const netBurn = expenses - revenue;
    if (netBurn <= 0) {
      return (
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          N/A (Profitable)
        </span>
      );
    }
    const runwayMonths = Math.round((cash / netBurn) * 10) / 10;
    return (
      <span className="font-mono font-bold text-[#101212] dark:text-white">
        {runwayMonths} mo
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Action Toolbar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Financial Updates & Core Reporting
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Normalized Database Record
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Structured chronological telemetry for revenues, operating burn, cash reserves, and customer growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Frequency Filter Toggle */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-[#202422] rounded-xl border border-gray-200 dark:border-[#262A29] text-xs">
            <button
              onClick={() => setFrequencyFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                frequencyFilter === 'All'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
              }`}
            >
              All ({updates.length})
            </button>
            <button
              onClick={() => setFrequencyFilter('Monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                frequencyFilter === 'Monthly'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFrequencyFilter('Quarterly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                frequencyFilter === 'Quarterly'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
              }`}
            >
              Quarterly
            </button>
          </div>

          <button
            onClick={handleStartCompare}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#282D2B] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
            <span>Compare Periods</span>
          </button>

          <button
            onClick={() => setIsVersionHistoryOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#282D2B] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-purple-500" />
            <span>Version History ({versions.length})</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import XLSX / CSV</span>
          </button>
        </div>
      </div>

      {/* Main Reporting Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
            Historical Reporting Periods ({filteredUpdates.length})
          </span>
          <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Click any row to inspect complete itemized data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Reporting Period</th>
                <th className="pb-3 px-3">Freq</th>
                <th className="pb-3 px-3">Total Revenue</th>
                <th className="pb-3 px-3">Total Expenses</th>
                <th className="pb-3 px-3">Net Burn</th>
                <th className="pb-3 px-3">Closing Cash</th>
                <th className="pb-3 px-3">Runway</th>
                <th className="pb-3 px-3">Paying / Total</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {filteredUpdates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400">
                    No financial updates found for this frequency filter.
                  </td>
                </tr>
              ) : (
                filteredUpdates.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
                        <span>{rec.period}</span>
                      </div>
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-mono">
                        v{rec.version} &bull; {rec.sourceFile}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-[#202422]">
                        {rec.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(rec.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-[#101212] dark:text-white">
                      {formatCurrency(rec.totalExpenses)}
                    </td>
                    <td className="py-3.5 px-3">
                      {getNetBurnBadge(rec.totalExpenses, rec.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(rec.closingCashBalance)}
                    </td>
                    <td className="py-3.5 px-3">
                      {getRunwayBadge(rec.closingCashBalance, rec.totalExpenses, rec.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {rec.payingCustomers} / {rec.totalCustomers}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Committed</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(rec);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#D9FF3F] hover:text-[#101212] dark:bg-[#202422] dark:hover:bg-[#D9FF3F] text-[11px] font-bold transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Inspection Modal / Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Detailed Financial Record
                </span>
                <h3 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  {selectedRecord.period} ({selectedRecord.frequency})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Total Revenue</span>
                <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedRecord.totalRevenue)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Total Expenses</span>
                <span className="font-mono text-base font-bold text-[#101212] dark:text-white">
                  {formatCurrency(selectedRecord.totalExpenses)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Net Burn</span>
                <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                  {selectedRecord.totalExpenses - selectedRecord.totalRevenue <= 0
                    ? 'Cash Flow +'
                    : formatCurrency(selectedRecord.totalExpenses - selectedRecord.totalRevenue)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Closing Cash</span>
                <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(selectedRecord.closingCashBalance)}
                </span>
              </div>
            </div>

            {/* Field Breakdown Grid */}
            <div className="border border-gray-100 dark:border-[#262A29] rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-bold text-[#101212] dark:text-white block pb-1 border-b border-gray-100 dark:border-[#262A29]">
                Itemized Metrics & Customer Statistics
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Recurring Revenue:</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.recurringRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Non-Recurring Revenue:</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.nonRecurringRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">MRR / ARR:</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.mrr)} / {formatCurrency(selectedRecord.arr)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Opening Cash Balance:</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.openingCashBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Paying / Total Customers:</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {selectedRecord.payingCustomers} paying ({selectedRecord.totalCustomers} total)
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Customer Flow (New / Lost):</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    +{selectedRecord.newCustomers} new / -{selectedRecord.lostCustomers} churned
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Funding Received (Period):</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.fundingReceived)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Grant Received (Period):</span>
                  <span className="font-mono font-semibold text-[#101212] dark:text-white">
                    {formatCurrency(selectedRecord.grantReceived)}
                  </span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[11px]">Source & Version:</span>
                  <span className="font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    v{selectedRecord.version} &bull; {selectedRecord.sourceFile}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Imported at: {new Date(selectedRecord.uploadedAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Periods Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Period-over-Period Financial Comparison
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Select two reporting periods to evaluate revenue trajectory, expense changes, and cash delta.
                </p>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] space-y-1.5">
                <label className="font-bold text-[#101212] dark:text-white">Period A (Base):</label>
                <select
                  value={comparePeriodA}
                  onChange={(e) => setComparePeriodA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] font-bold text-xs"
                >
                  {updates.map((u) => (
                    <option key={u.period} value={u.period}>
                      {u.period} ({u.frequency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] space-y-1.5">
                <label className="font-bold text-[#101212] dark:text-white">Period B (Comparison):</label>
                <select
                  value={comparePeriodB}
                  onChange={(e) => setComparePeriodB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] font-bold text-xs"
                >
                  {updates.map((u) => (
                    <option key={u.period} value={u.period}>
                      {u.period} ({u.frequency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Delta Table */}
            {recordA && recordB && (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-[#262A29]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">{recordA.period}</th>
                      <th className="py-2.5 px-3">{recordB.period}</th>
                      <th className="py-2.5 px-3">Delta / Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">Total Revenue</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordA.totalRevenue)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordB.totalRevenue)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {recordB.totalRevenue - recordA.totalRevenue >= 0 ? (
                          <span className="text-emerald-600">
                            +{formatCurrency(recordB.totalRevenue - recordA.totalRevenue)}
                          </span>
                        ) : (
                          <span className="text-red-600">
                            {formatCurrency(recordB.totalRevenue - recordA.totalRevenue)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">Total Expenses</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordA.totalExpenses)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordB.totalExpenses)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {formatCurrency(recordB.totalExpenses - recordA.totalExpenses)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">Closing Cash</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordA.closingCashBalance)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatCurrency(recordB.closingCashBalance)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {formatCurrency(recordB.closingCashBalance - recordA.closingCashBalance)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold">Paying Customers</td>
                      <td className="py-2.5 px-3 font-mono">{recordA.payingCustomers}</td>
                      <td className="py-2.5 px-3 font-mono">{recordB.payingCustomers}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {recordB.payingCustomers - recordA.payingCustomers >= 0
                          ? `+${recordB.payingCustomers - recordA.payingCustomers}`
                          : recordB.payingCustomers - recordA.payingCustomers}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {isVersionHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Financial Source File & Version History
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Preserved audit trail of spreadsheet imports with timestamp and user attribution.
                </p>
              </div>
              <button
                onClick={() => setIsVersionHistoryOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center font-bold font-mono">
                      v{ver.importVersion}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#101212] dark:text-white">{ver.fileName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {ver.importStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block mt-0.5">
                        Uploaded by {ver.uploadedBy} &bull; {new Date(ver.uploadedAt).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                        Affects periods: {ver.reportingPeriods.join(', ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      showToast(`Source file "${ver.fileName}" download requested.`, 'info');
                    }}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-white dark:hover:bg-[#181B1A] text-[#101212] dark:text-white transition-all cursor-pointer"
                    title="Download Source File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsVersionHistoryOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
