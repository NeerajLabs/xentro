'use client';

import React, { useState } from 'react';
import {
  Lock,
  Globe,
  Users,
  Eye,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { FinanceVisibilityConfig, FinanceVisibilityLevel } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

export const FinanceVisibilityView: React.FC = () => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<FinanceVisibilityConfig>(
    financeService.getVisibilityConfig()
  );

  const updates = financeService.getFinancialUpdates();
  const latest = updates[0];
  const metrics = financeService.calculateMetrics();

  const handleUpdate = (metric: keyof FinanceVisibilityConfig, val: FinanceVisibilityLevel) => {
    const updated = {
      ...config,
      [metric]: val,
    };
    setConfig(updated);
    financeService.setVisibilityConfig(updated);
    showToast(`Visibility for ${metric} saved: ${val}`, 'success');
  };

  const visibilityLevels: Array<{ value: FinanceVisibilityLevel; label: string; desc: string }> = [
    { value: 'Public', label: 'Public', desc: 'Visible to everyone on Xentro platform' },
    { value: 'Connections Only', label: 'Connections Only', desc: 'Visible only to accepted partner connections' },
    { value: 'Approved Users', label: 'Approved Users', desc: 'Requires explicit founder NDA/DD approval' },
    { value: 'Private', label: 'Private', desc: 'Strictly restricted to internal startup entity' },
  ];

  const metricsList: Array<{
    key: keyof FinanceVisibilityConfig;
    label: string;
    description: string;
    sampleValue: string;
  }> = [
    {
      key: 'revenueStatus',
      label: 'Revenue Status',
      description: 'Pre-revenue vs Revenue Generating indicator',
      sampleValue: latest?.revenueStatus || 'Revenue Generating',
    },
    {
      key: 'revenue',
      label: 'Monthly Total Revenue',
      description: 'Total monthly top-line revenue',
      sampleValue: '₹4,80,000 / mo',
    },
    {
      key: 'mrr',
      label: 'Monthly Recurring Revenue (MRR)',
      description: 'Contracted recurring subscription base',
      sampleValue: '₹4,80,000',
    },
    {
      key: 'arr',
      label: 'Annualized Run-Rate (ARR)',
      description: '12-month pro-rated run-rate',
      sampleValue: '₹57,60,000',
    },
    {
      key: 'expenses',
      label: 'Monthly Operating Expenses',
      description: 'Total monthly expenditure and cost centers',
      sampleValue: '₹7,20,000',
    },
    {
      key: 'burn',
      label: 'Net Monthly Burn Rate',
      description: 'Operating cash deficit per month',
      sampleValue: '₹2,40,000 / mo',
    },
    {
      key: 'cash',
      label: 'Cash Reserves in Bank',
      description: 'Liquid cash balances held across bank accounts',
      sampleValue: '₹38,50,000',
    },
    {
      key: 'runway',
      label: 'Runway Months',
      description: 'Months remaining before capital depletion',
      sampleValue: '16.0 Months',
    },
    {
      key: 'fundingRaised',
      label: 'Total Funding Raised',
      description: 'Aggregate historical venture capital and SAFEs',
      sampleValue: '₹25,00,000',
    },
    {
      key: 'valuation',
      label: 'Valuation Benchmarks',
      description: 'Pre and post-money valuation metrics',
      sampleValue: '₹1,25,00,000',
    },
    {
      key: 'growth',
      label: 'MoM Growth Percentage',
      description: 'Month-over-month revenue growth rate',
      sampleValue: '+24% MoM',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <span>Metrics Visibility & External Privacy Controls</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Backend Enforced
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Section 22 & 23: Control precisely what external investors, ecosystem partners, and visitors see on your public startup profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Level Controls (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Metric Privacy Permissions
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Configure visibility levels on a granular per-metric basis. Changes sync automatically to the API gateway.
              </p>
            </div>

            <div className="space-y-3">
              {metricsList.map((m) => {
                const currentVal = config[m.key] || 'Private';
                return (
                  <div
                    key={m.key}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#101212] dark:text-white">
                          {m.label}
                        </span>
                        <span className="font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          ({m.sampleValue})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                        {m.description}
                      </p>
                    </div>

                    <select
                      value={currentVal}
                      onChange={(e) => handleUpdate(m.key, e.target.value as FinanceVisibilityLevel)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        currentVal === 'Public'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : currentVal === 'Connections Only'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : currentVal === 'Approved Users'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                          : 'bg-gray-200 dark:bg-[#262A29] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {visibilityLevels.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Public Profile Financial Snapshot Preview (Section 23) */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  Section 23 Preview
                </span>
                <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Public Profile Financial Snapshot
                </h4>
              </div>
              <span className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                <Eye className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              This live card illustrates what unauthenticated visitors or external investors see when visiting your public startup profile.
            </p>

            {/* Rendered Snapshot Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#262A29]">
                <span className="font-bold text-[#101212] dark:text-white">Financial Snapshot</span>
                <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                  Public View
                </span>
              </div>

              {/* Revenue Status */}
              <div className="flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Revenue Status:</span>
                {config.revenueStatus === 'Public' ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Revenue Generating
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {/* MRR */}
              <div className="flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Monthly MRR:</span>
                {config.mrr === 'Public' ? (
                  <span className="font-mono font-bold text-[#101212] dark:text-white">
                    ₹4.8L
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Lock className="w-3 h-3" /> {config.mrr === 'Connections Only' ? 'Connections Only' : 'Private'}
                  </span>
                )}
              </div>

              {/* MoM Growth */}
              <div className="flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Growth:</span>
                {config.growth === 'Public' ? (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +24% MoM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {/* Funding Raised */}
              <div className="flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Funding Raised:</span>
                {config.fundingRaised === 'Public' ? (
                  <span className="font-mono font-bold text-[#101212] dark:text-white">
                    ₹25L
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {/* Runway */}
              <div className="flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Runway:</span>
                {config.runway === 'Public' ? (
                  <span className="font-mono font-bold text-[#101212] dark:text-white">
                    16.0 Mo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
            </div>

            {/* Backend Security Note (Section 22 & 29) */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Section 22 & 29 Enforcement:</strong> Visibility is not just CSS display hiding; the Xentro API gateway strictly redacts unpermitted fields from JSON payload responses before delivery to client browsers.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
