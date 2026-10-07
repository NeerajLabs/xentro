'use client';

import React from 'react';
import {
  FolderLock,
  FileText,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  ExternalLink,
  Lock,
  ArrowRight,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { initialDDDocuments, DDDocument } from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';

interface FinanceDocumentsViewProps {
  onNavigateToDDLocker?: () => void;
}

export const FinanceDocumentsView: React.FC<FinanceDocumentsViewProps> = ({
  onNavigateToDDLocker,
}) => {
  const { showToast } = useToast();

  // Financial documents connected to DD Locker's "Financial" folder
  const financialDocs: DDDocument[] = [
    ...initialDDDocuments.filter((d) => d.folder === 'Financial'),
    {
      id: 'doc_extra_1',
      name: 'GST_Filing_Returns_Q1_2026.pdf',
      folder: 'Financial',
      fileSize: '1.1 MB',
      updatedDate: 'Aug 02, 2026',
      fileType: 'PDF',
      isConfidential: true,
    },
    {
      id: 'doc_extra_2',
      name: 'Bank_Capital_Verification_HDFC.pdf',
      folder: 'Financial',
      fileSize: '890 KB',
      updatedDate: 'Sep 01, 2026',
      fileType: 'PDF',
      isConfidential: true,
    },
    {
      id: 'doc_extra_3',
      name: 'Monthly_MIS_Report_August_2026.pdf',
      folder: 'Financial',
      fileSize: '1.4 MB',
      updatedDate: 'Sep 05, 2026',
      fileType: 'PDF',
      isConfidential: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner connected to DD Locker */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Supporting Financial Documents
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <FolderLock className="w-3 h-3" />
              <span>Connected to DD Locker → Financial</span>
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Section 21 & 33 Architecture: Supporting financial verification documents, P&L statements, and audit reports are securely managed via the Due Diligence (DD) Locker.
          </p>
        </div>

        {onNavigateToDDLocker && (
          <button
            onClick={onNavigateToDDLocker}
            className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <span>Open Financial Documents</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Architecture Separation Notice (Section 33) */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-[#565B59] dark:text-[#B6B8B7]">
            <strong className="text-[#101212] dark:text-white">Single Source of Truth:</strong> Spreadsheets upload structured rows to the normalized Xentro Finance Database, while official scanned PDFs, audited financials, and bank letters are archived inside the DD Locker encryption vault.
          </div>
        </div>
      </div>

      {/* Document Reference Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['P&L Statements', 'Balance Sheets', 'Cash Flow', 'MIS Reports', 'Bank Statements', 'Auditor Reports'].map((cat, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#101212] dark:text-white block">
              {cat}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              Locker Active
            </span>
          </div>
        ))}
      </div>

      {/* Documents List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <h4 className="text-base font-bold font-sora text-[#101212] dark:text-white">
            Encrypted Documents in DD Locker Financial Folder ({financialDocs.length})
          </h4>
          {onNavigateToDDLocker && (
            <button
              onClick={onNavigateToDDLocker}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Permissions & Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {financialDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {doc.fileType === 'XLSX' ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#101212] dark:text-white truncate">
                      {doc.name}
                    </span>
                    {doc.isConfidential && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Confidential</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block mt-0.5">
                    {doc.fileSize} &bull; Updated {doc.updatedDate} &bull; Folder: {doc.folder}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>DD Verified</span>
                </span>
                <button
                  onClick={() => showToast(`Initiating secure download for ${doc.name}...`, 'info')}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-gray-500 hover:text-[#101212] dark:hover:text-white hover:bg-white dark:hover:bg-[#181B1A] transition-all cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
