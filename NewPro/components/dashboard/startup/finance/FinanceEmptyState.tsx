'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { useToast } from '@/components/ui/Toast';

interface FinanceEmptyStateProps {
  onOpenUpload: (type: 'xlsx' | 'csv') => void;
  onLoadSeedData?: () => void;
}

export const FinanceEmptyState: React.FC<FinanceEmptyStateProps> = ({
  onOpenUpload,
  onLoadSeedData,
}) => {
  const { showToast } = useToast();

  const handleDownloadXlsx = () => {
    financeService.downloadXlsxTemplate();
    showToast('Downloaded Xentro Official XLSX Financial Template', 'success');
  };

  const handleDownloadCsv = () => {
    financeService.downloadAllCsvTemplates();
    showToast('Downloading Xentro CSV Financial Templates bundle...', 'info');
  };

  return (
    <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center space-y-6 max-w-2xl mx-auto my-6 animate-fade-slide">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center border border-gray-100 dark:border-[#262A29]">
        <FileSpreadsheet className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
          Start Tracking Your Startup Finances
        </h2>
        <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-lg mx-auto leading-relaxed">
          Upload your Xentro financial template to generate your real-time financial health, burn rate, cash runway, and cap table telemetry.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] inline-block text-left text-xs space-y-1.5 max-w-md mx-auto">
        <div className="flex items-center gap-2 text-[#101212] dark:text-white font-bold">
          <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
          <span>Recommended Format: XLSX</span>
        </div>
        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          The XLSX workbook includes all 7 structured sheets: Financial Updates, Revenue Breakdown, Expense Breakdown, Funding History, Grants, Capital Structure, and Forecasts.
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handleDownloadXlsx}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Download XLSX Template</span>
        </button>

        <button
          onClick={handleDownloadCsv}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Download CSV Templates</span>
        </button>

        <button
          onClick={() => onOpenUpload('xlsx')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Financial Data</span>
        </button>
      </div>

      {/* Demo seed button for developer/user convenience */}
      {onLoadSeedData && (
        <div className="pt-4 border-t border-gray-100 dark:border-[#262A29]">
          <button
            onClick={onLoadSeedData}
            className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white underline cursor-pointer"
          >
            Load Sample Startup Financial Telemetry (6 Months Seed)
          </button>
        </div>
      )}
    </div>
  );
};
