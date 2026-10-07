'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Info,
  Check,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { ImportPreviewData, ValidationErrorItem } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

interface FinanceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: 'xlsx' | 'csv';
  onSuccess: () => void;
}

export const FinanceUploadModal: React.FC<FinanceUploadModalProps> = ({
  isOpen,
  onClose,
  defaultFormat = 'xlsx',
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>(defaultFormat);
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'replace' | 'update' | 'skip' | 'cancel'>('update');
  const [isErrorReviewOpen, setIsErrorReviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;

    const ext = chosen.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      showToast('Please select a valid .xlsx or .csv spreadsheet file', 'error');
      return;
    }

    setFile(chosen);
    setIsValidating(true);
    setPreviewData(null);

    try {
      const preview = await financeService.validateAndParseSpreadsheet(chosen);
      setPreviewData(preview);
      if (preview.errorsCount > 0) {
        showToast(`Validation detected ${preview.errorsCount} critical error(s) that need review`, 'error');
      } else if (preview.warningsCount > 0) {
        showToast(`Validation passed with ${preview.warningsCount} warning(s)`, 'info');
      } else {
        showToast('Spreadsheet validated successfully with 0 errors!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Validation failed for this file', 'error');
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommit = () => {
    if (!previewData || !previewData.canImport) {
      showToast('Cannot import while critical errors remain unresolved.', 'error');
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      const ok = financeService.commitImport(previewData, duplicateStrategy);
      setIsImporting(false);
      if (ok) {
        showToast(`Successfully imported ${previewData.summary.financialUpdates} reporting period(s) into Xentro Finance Database!`, 'success');
        onSuccess();
        onClose();
      } else {
        showToast('Import cancelled.', 'info');
      }
    }, 600);
  };

  const handleDownloadErrorReport = () => {
    if (!previewData) return;
    const reportText = `XENTRO FINANCIAL VALIDATION REPORT
File: ${previewData.fileName}
Date: ${new Date().toISOString()}
Critical Errors: ${previewData.errorsCount}
Warnings: ${previewData.warningsCount}

DETAILS:
${previewData.errors
  .map(
    (e, idx) =>
      `[${idx + 1}] ${e.severity.toUpperCase()}: Sheet/File: "${e.sheetOrFile}" | Row: ${e.row} | Col: ${e.column}
Current Value: ${e.currentValue}
Error: ${e.error}
Suggested Fix: ${e.suggestedFix}
----------------------------------------`
  )
  .join('\n')}
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Xentro_Validation_Report_${previewData.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded detailed validation report', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Upload Financial Data
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                XLSX / CSV Multi-Sheet Validation & Import Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        {!previewData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('xlsx')}
                className={`flex-1 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedFormat === 'xlsx'
                    ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/5'
                    : 'border-gray-200 dark:border-[#262A29] hover:bg-gray-50 dark:hover:bg-[#202422]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>XLSX Workbook</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F] text-[#101212]">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Single file with all 7 sheets (Updates, Revenue, Expenses, Funding, Grants, Cap Table, Forecasts)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`flex-1 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedFormat === 'csv'
                    ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/5'
                    : 'border-gray-200 dark:border-[#262A29] hover:bg-gray-50 dark:hover:bg-[#202422]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>CSV Template</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Upload individual CSVs (financial_updates.csv, revenue_breakdown.csv, etc.)
                </p>
              </button>
            </div>

            {/* Hidden Input & Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept={selectedFormat === 'xlsx' ? '.xlsx' : '.csv'}
              onChange={handleFileSelected}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-[#262A29] hover:border-[#D9FF3F] rounded-3xl p-8 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-[#202422]/50 space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#101212] dark:text-white block">
                  Click to Browse or Drag and Drop {selectedFormat.toUpperCase()}
                </span>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                  Standard Xentro Financial Schema &bull; Max size: 25MB
                </p>
              </div>
            </div>

            {/* Template Download Links */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Need a blank template?</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => financeService.downloadXlsxTemplate()}
                  className="font-bold text-[#101212] dark:text-white hover:text-emerald-600 underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>XLSX Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => financeService.downloadAllCsvTemplates()}
                  className="font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-blue-600 underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV Templates</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation In Progress */}
        {isValidating && (
          <div className="p-8 text-center space-y-3">
            <Clock className="w-8 h-8 text-[#9EBE12] dark:text-[#D9FF3F] animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
              Validating File Structure & Formulas...
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Checking column types, customer logical rules, and cross-sheet totals.
            </p>
          </div>
        )}

        {/* Import Preview Stage */}
        {previewData && (
          <div className="space-y-4 animate-fade-slide">
            {/* File & Validation Summary Pill Banner */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#101212] dark:text-white block font-mono">
                  {previewData.fileName} ({previewData.fileSize})
                </span>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  {previewData.periodsCount} Reporting Period(s) &bull; {previewData.validRowsCount} Valid Rows
                </p>
              </div>

              <div className="flex items-center gap-2">
                {previewData.errorsCount > 0 ? (
                  <span className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{previewData.errorsCount} Error(s)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Structure Valid</span>
                  </span>
                )}

                {previewData.warningsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{previewData.warningsCount} Warning(s)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Records Summary Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] block">Financial Updates</span>
                <span className="text-base font-bold text-[#101212] dark:text-white">
                  {previewData.summary.financialUpdates}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] block">Revenue Splits</span>
                <span className="text-base font-bold text-[#101212] dark:text-white">
                  {previewData.summary.revenueRecords}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] block">Expense Splits</span>
                <span className="text-base font-bold text-[#101212] dark:text-white">
                  {previewData.summary.expenseRecords}
                </span>
              </div>
            </div>

            {/* Duplicate Reporting Periods Handling (Requirement 16) */}
            {previewData.duplicatePeriods.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Existing Period Detected: {previewData.duplicatePeriods.join(', ')} already exists in database.
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                  Select how Xentro should reconcile existing reporting period records:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('update')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      duplicateStrategy === 'update'
                        ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs'
                        : 'bg-white dark:bg-[#181B1A] border-amber-500/30 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <span className="font-bold block">Update Existing</span>
                    <span className="text-[10px] opacity-80 block">Merge new fields</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('replace')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      duplicateStrategy === 'replace'
                        ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs'
                        : 'bg-white dark:bg-[#181B1A] border-amber-500/30 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <span className="font-bold block">Replace Existing</span>
                    <span className="text-[10px] opacity-80 block">Overwrite record</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('skip')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      duplicateStrategy === 'skip'
                        ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-2xs'
                        : 'bg-white dark:bg-[#181B1A] border-amber-500/30 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <span className="font-bold block">Skip Period</span>
                    <span className="text-[10px] opacity-80 block">Keep existing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('cancel')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      duplicateStrategy === 'cancel'
                        ? 'bg-red-500 text-white font-bold border-red-600 shadow-2xs'
                        : 'bg-white dark:bg-[#181B1A] border-amber-500/30 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <span className="font-bold block">Cancel Import</span>
                    <span className="text-[10px] opacity-80 block">Abort action</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error / Warning Alert Callout */}
            {previewData.errors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-[#101212] dark:text-white font-medium">
                    {previewData.errors.length} item(s) flagged during schema check
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsErrorReviewOpen(!isErrorReviewOpen)}
                    className="text-[#9EBE12] dark:text-[#D9FF3F] font-bold hover:underline cursor-pointer"
                  >
                    {isErrorReviewOpen ? 'Hide Review' : 'Review Errors & Warnings'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="p-1 text-gray-500 hover:text-[#101212] dark:hover:text-white"
                    title="Download error report text file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Inline Error Review Table (Requirement 18) */}
            {isErrorReviewOpen && previewData.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] space-y-3 overflow-x-auto text-xs animate-fade-slide">
                <h4 className="font-bold text-[#101212] dark:text-white font-sora">
                  Error & Warning Diagnostics
                </h4>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] uppercase font-semibold">
                      <th className="pb-2">Sheet/CSV</th>
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Column</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Error</th>
                      <th className="pb-2">Suggested Fix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                    {previewData.errors.map((err) => (
                      <tr key={err.id}>
                        <td className="py-2 font-mono">{err.sheetOrFile}</td>
                        <td className="py-2 font-mono">{err.row}</td>
                        <td className="py-2 font-semibold text-[#101212] dark:text-white">{err.column}</td>
                        <td className="py-2 font-mono text-red-500">{err.currentValue}</td>
                        <td className="py-2 text-[#565B59] dark:text-[#B6B8B7]">{err.error}</td>
                        <td className="py-2 font-medium text-emerald-600 dark:text-emerald-400">{err.suggestedFix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewData(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Upload Different File
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!previewData.canImport || isImporting}
                  onClick={handleCommit}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    previewData.canImport && !isImporting
                      ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                      : 'bg-gray-200 dark:bg-[#262A29] text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isImporting ? 'Importing Data...' : 'Import Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
