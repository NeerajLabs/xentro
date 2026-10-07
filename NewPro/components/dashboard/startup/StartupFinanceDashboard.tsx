'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Flame,
  Wallet,
  Clock,
  Plus,
  Lock,
  Globe,
  Users,
  Eye,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
  FileText,
  X,
  Save,
  AlertCircle,
  Download,
  Building2,
  ShieldCheck,
  ChevronRight,
  PieChart,
  BarChart3,
  Layers,
  FileCheck,
  Sparkles,
  RefreshCw,
  FolderLock,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { useToast } from '@/components/ui/Toast';

// Sub-components
import { FinanceOverview } from './finance/FinanceOverview';
import { FinanceUpdatesView } from './finance/FinanceUpdatesView';
import { FinanceRevenueView } from './finance/FinanceRevenueView';
import { FinanceExpensesView } from './finance/FinanceExpensesView';
import { FinanceCashRunwayView } from './finance/FinanceCashRunwayView';
import { FinanceCapTableView } from './finance/FinanceCapTableView';
import { FinanceFundingView } from './finance/FinanceFundingView';
import { FinanceForecastsView } from './finance/FinanceForecastsView';
import { FinanceDocumentsView } from './finance/FinanceDocumentsView';
import { FinanceVisibilityView } from './finance/FinanceVisibilityView';
import { FinanceEmptyState } from './finance/FinanceEmptyState';
import { FinanceUploadModal } from './finance/FinanceUploadModal';

export type FinanceSubTab =
  | 'overview'
  | 'cash_runway'
  | 'cap_table'
  | 'financial_updates'
  | 'revenue'
  | 'expenses'
  | 'funding'
  | 'documents'
  | 'visibility'
  | 'forecasts'
  | 'runway'
  | 'captable';

interface StartupFinanceDashboardProps {
  initialTab?: FinanceSubTab | string;
  onNavigateTab?: (tabId: string) => void;
  userRole?: string;
  userPermissions?: string[];
}

export const StartupFinanceDashboard: React.FC<StartupFinanceDashboardProps> = ({
  initialTab = 'overview',
  onNavigateTab,
  userRole = 'Founder',
  userPermissions = ['view_financials', 'edit_financials'],
}) => {
  const { showToast } = useToast();

  const normalizeTab = (t?: string): FinanceSubTab => {
    if (!t) return 'overview';
    const low = t.toLowerCase();
    if (low === 'runway' || low === 'cash_runway') return 'cash_runway';
    if (low === 'cap_table' || low === 'captable') return 'cap_table';
    return low as FinanceSubTab;
  };

  const [activeTab, setActiveTab] = useState<FinanceSubTab>(normalizeTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);

  // Reactive data synchronization
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormat, setUploadFormat] = useState<'xlsx' | 'csv'>('xlsx');

  // Check RBAC permission for upload
  const canEditFinancials =
    userPermissions.includes('edit_financials') ||
    userRole === 'Founder' ||
    userRole === 'Owner' ||
    userRole === 'Finance' ||
    userRole === 'Owner / Founder';

  useEffect(() => {
    const handleFinancesUpdated = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('xentro-finances-updated', handleFinancesUpdated);
    return () => {
      window.removeEventListener('xentro-finances-updated', handleFinancesUpdated);
    };
  }, []);

  const updates = financeService.getFinancialUpdates();
  const isEmpty = financeService.isFinanceDataEmpty();
  const metrics = financeService.calculateMetrics();

  const handleOpenUpload = (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (!canEditFinancials) {
      showToast('Permission denied: You need edit_financials rights to upload spreadsheets.', 'error');
      return;
    }
    setUploadFormat(format);
    setIsUploadModalOpen(true);
  };

  const handleDownloadXlsx = () => {
    financeService.downloadXlsxTemplate();
    showToast('Downloaded Xentro Official XLSX Financial Template', 'success');
  };

  const handleDownloadCsv = () => {
    financeService.downloadAllCsvTemplates();
    showToast('Downloaded Xentro CSV Financial Templates', 'info');
  };

  const handleResetToEmpty = () => {
    financeService.resetToEmptyState();
    showToast('Finances reset to empty state for testing', 'info');
  };

  const handleLoadSeedData = () => {
    financeService.loadSeedFinancials();
    showToast('Loaded 6-month historical telemetry and seed records', 'success');
  };

  // Section 1 10-tab navigation bar specification
  const financeNavItems: Array<{ id: FinanceSubTab; label: string; badge?: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'cash_runway', label: 'Cash & Runway' },
    { id: 'cap_table', label: 'Cap Table' },
    { id: 'financial_updates', label: 'Financial Updates' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'funding', label: 'Funding & Grants' },
    { id: 'documents', label: 'Documents' },
    { id: 'visibility', label: 'Visibility' },
    { id: 'forecasts', label: 'Forecasts', badge: 'Pro' },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner & Quick Toolbars */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Financial Health & Runway Telemetry
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Section 33 Architecture Enforced</span>
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Structured normalized financial records, monthly burn monitoring, non-dilutive grants, and investor reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Developer / Testing Quick Toggles */}
          {isEmpty ? (
            <button
              onClick={handleLoadSeedData}
              className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Quickly load sample 6-month historical data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Seed Data</span>
            </button>
          ) : (
            <button
              onClick={handleResetToEmpty}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-[11px] font-semibold text-gray-500 hover:text-red-500 transition-all cursor-pointer"
              title="Test empty state"
            >
              Test Empty State
            </button>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => handleOpenUpload('xlsx')}
            disabled={!canEditFinancials}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              canEditFinancials
                ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                : 'bg-gray-200 dark:bg-[#202422] text-gray-400 cursor-not-allowed'
            }`}
            title={canEditFinancials ? 'Upload XLSX or CSV Spreadsheet' : 'Requires edit_financials permission'}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Financial Data</span>
          </button>
        </div>
      </div>

      {/* Preserved 9-Item Finance Navigation Bar */}
      <div className="p-1 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center gap-1 overflow-x-auto no-scrollbar">
        {financeNavItems.map((item) => {
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main View Area: Empty State vs 9 Sub-Tabs */}
      {isEmpty && activeTab !== 'documents' && activeTab !== 'visibility' ? (
        <FinanceEmptyState
          onOpenUpload={handleOpenUpload}
          onLoadSeedData={handleLoadSeedData}
        />
      ) : (
        <div>
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <FinanceOverview
              metrics={metrics}
              updates={updates}
              onOpenUpload={handleOpenUpload}
              onNavigateTab={(tab) => {
                if (tab === 'dd_locker' && onNavigateTab) {
                  onNavigateTab('dd_locker');
                } else if (tab in financeNavItems.map((n) => n.id)) {
                  setActiveTab(tab as FinanceSubTab);
                }
              }}
            />
          )}

          {/* 2. Financial Updates */}
          {activeTab === 'financial_updates' && (
            <FinanceUpdatesView
              onOpenUploadModal={() => handleOpenUpload('xlsx')}
            />
          )}

          {/* 3. Revenue */}
          {activeTab === 'revenue' && <FinanceRevenueView />}

          {/* 4. Expenses */}
          {activeTab === 'expenses' && <FinanceExpensesView />}

          {/* Cash & Runway */}
          {(activeTab === 'cash_runway' || (activeTab as string) === 'runway') && (
            <FinanceCashRunwayView />
          )}

          {/* Cap Table */}
          {(activeTab === 'cap_table' || (activeTab as string) === 'captable') && (
            <FinanceCapTableView
              onNavigateToDDLocker={() => {
                if (onNavigateTab) {
                  onNavigateTab('dd_locker');
                } else {
                  setActiveTab('documents');
                }
              }}
            />
          )}

          {/* Funding & Grants */}
          {activeTab === 'funding' && (
            <FinanceFundingView
              onNavigateToDDLocker={() => {
                if (onNavigateTab) {
                  onNavigateTab('dd_locker');
                } else {
                  setActiveTab('documents');
                }
              }}
            />
          )}

          {/* 7. Documents (Connected to DD Locker) */}
          {activeTab === 'documents' && (
            <FinanceDocumentsView
              onNavigateToDDLocker={() => {
                if (onNavigateTab) {
                  onNavigateTab('dd_locker');
                }
              }}
            />
          )}

          {/* 8. Visibility */}
          {activeTab === 'visibility' && <FinanceVisibilityView />}

          {/* 9. Forecasts [Pro] */}
          {activeTab === 'forecasts' && <FinanceForecastsView />}
        </div>
      )}

      {/* Global Multi-Stage Financial Upload Modal */}
      <FinanceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultFormat={uploadFormat}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
          showToast('Financial dashboard successfully updated with imported data!', 'success');
        }}
      />
    </div>
  );
};
