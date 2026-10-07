'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Flame,
  Wallet,
  Sparkles,
  ChevronDown,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  BarChart3,
  Lock,
  PieChart,
} from 'lucide-react';
import { CalculatedFinancialMetrics, FinancialUpdateRecord } from '@/types/finance';
import { financeService } from '@/lib/financeService';
import { useToast } from '@/components/ui/Toast';
import { FinanceTrajectoryChart } from './FinanceTrajectoryChart';

interface FinanceOverviewProps {
  metrics: CalculatedFinancialMetrics;
  updates: FinancialUpdateRecord[];
  onOpenUpload: (format: 'xlsx' | 'csv') => void;
  onNavigateTab: (tabId: string) => void;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  metrics,
  updates,
  onOpenUpload,
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDownloadXlsx = () => {
    financeService.downloadXlsxTemplate();
    setIsUploadMenuOpen(false);
    showToast('Downloaded Xentro Official XLSX Financial Template', 'success');
  };

  const handleDownloadCsv = () => {
    financeService.downloadAllCsvTemplates();
    setIsUploadMenuOpen(false);
    showToast('Downloaded Xentro CSV Financial Templates', 'info');
  };


  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header Telemetry & Upload Menu */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Finance Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Telemetry</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7] flex-wrap">
            <span>
              Latest Period: <strong className="text-[#101212] dark:text-white">{metrics.latestPeriod}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Last Updated: <strong className="text-[#101212] dark:text-white">{metrics.lastUpdated}</strong>
            </span>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Data Status: Active & Synced
            </span>
          </div>
        </div>

        {/* Primary CTA: Upload Financial Data with Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
            className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Financial Data</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {isUploadMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-2 shadow-2xl space-y-1 z-30 animate-scale-up">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#565B59] border-b border-gray-100 dark:border-[#262A29]">
                Recommended Format: XLSX
              </div>

              <button
                onClick={() => {
                  setIsUploadMenuOpen(false);
                  onOpenUpload('xlsx');
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#202422] text-[#101212] dark:text-white flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload XLSX Workbook</span>
              </button>

              <button
                onClick={() => {
                  setIsUploadMenuOpen(false);
                  onOpenUpload('csv');
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#202422] text-[#101212] dark:text-white flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Upload CSV File(s)</span>
              </button>

              <div className="border-t border-gray-100 dark:border-[#262A29] pt-1 mt-1">
                <button
                  onClick={handleDownloadXlsx}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#202422] flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download XLSX Template</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#202422] flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Templates</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Grid (6 Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Runway */}
        <div
          onClick={() => onNavigateTab('cash_runway')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Cash Runway</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {metrics.isRunwayApplicable
              ? `${metrics.runwayMonths} Months`
              : 'Cash Flow Positive'}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            {metrics.isRunwayApplicable ? 'Safe Zone' : 'Self-Sustaining'}
          </p>
        </div>

        {/* Current MRR */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Current MRR</span>
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(metrics.mrr)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            +{metrics.revenueGrowthPct}% MoM Growth
          </p>
        </div>

        {/* Net Monthly Burn */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Net Monthly Burn</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {metrics.isCashFlowPositive ? 'Cash Flow Positive' : formatCurrency(metrics.netBurn)}
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Gross Burn: {formatCurrency(metrics.grossBurn)}
          </p>
        </div>

        {/* Cash Available */}
        <div
          onClick={() => onNavigateTab('cash_runway')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Cash in Bank</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {formatCurrency(metrics.closingCash)}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
            Total Raised: {formatCurrency(metrics.totalFundingRaised)}
          </p>
        </div>
      </div>

      {/* 3. Revenue & Burn Trajectory Chart */}
      <FinanceTrajectoryChart updates={updates} />

      {/* 4. Quick Modules Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Cash & Runway Telemetry */}
        <div
          onClick={() => onNavigateTab('cash_runway')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Cash & Runway</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Horizon:</span>
              <strong className="text-[#101212] dark:text-white font-mono">
                {metrics.isRunwayApplicable ? `${metrics.runwayMonths} Months` : 'Self-Sustaining'}
              </strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Net Monthly Burn:</span>
              <strong className="text-red-500 font-mono">
                {metrics.isCashFlowPositive ? 'Profitable' : formatCurrency(metrics.netBurn)}
              </strong>
            </div>
          </div>
          <span className="text-[#9EBE12] dark:text-[#D9FF3F] font-bold flex items-center gap-1 pt-1">
            <span>Runway & Stress Simulator</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Cap Table & Capital Structure */}
        <div
          onClick={() => onNavigateTab('cap_table')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-[#D9FF3F]" />
                <span>Cap Table & Equity</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Basis:</span>
              <strong className="text-[#101212] dark:text-white font-mono">Fully Diluted</strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Pools:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">Founders · VC · ESOP</strong>
            </div>
          </div>
          <span className="text-[#9EBE12] dark:text-[#D9FF3F] font-bold flex items-center gap-1 pt-1">
            <span>Manage Cap Table</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Capital & Grants */}
        <div
          onClick={() => onNavigateTab('funding')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Capital & Grants</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Equity Raised:</span>
              <strong className="text-[#101212] dark:text-white font-mono">{formatCurrency(metrics.totalFundingRaised)}</strong>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Non-Dilutive Grants:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(metrics.grantsTotal)}</strong>
            </div>
          </div>
          <span className="text-[#9EBE12] dark:text-[#D9FF3F] font-bold flex items-center gap-1 pt-1">
            <span>View Funding Rounds</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* DD Locker Financial Vault */}
        <div
          onClick={() => onNavigateTab('documents')}
          className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2 cursor-pointer hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>DD Locker Vault</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400" />
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-1 leading-snug">
              Audited P&L, Balance Sheet, GST Returns & Bank Certs.
            </p>
          </div>
          <span className="text-[#9EBE12] dark:text-[#D9FF3F] font-bold flex items-center gap-1 pt-1">
            <span>Open Vault Files</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
