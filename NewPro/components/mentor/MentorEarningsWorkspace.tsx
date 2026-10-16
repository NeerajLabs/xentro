'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Building,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Search,
  Filter,
  X,
  Lock,
  Info,
  ExternalLink,
  AlertTriangle,
  Receipt,
  Download,
  Eye,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile } from '@/lib/userProfile';
import {
  EarningsSummary,
  MentorEarning,
  WithdrawalRequest,
  PayoutAccount,
  WithdrawalStatus,
  formatPaiseToRupees,
  FinancialApiState,
} from '@/types/mentorFinancials';
import {
  mentorFinancialService,
  calculateHoldDetails,
} from '@/lib/mentorFinancialService';

interface MentorEarningsWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
}

export const MentorEarningsWorkspace: React.FC<MentorEarningsWorkspaceProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'earnings_ledger' | 'withdrawals' | 'payout_account'
  >('overview');

  // Authentication Context
  const user = getUserProfile();
  const mentorId = user?.id || 'user_mentor';

  // API State
  const [apiState, setApiState] = useState<FinancialApiState>('loading');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<MentorEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);

  // Filters & Search
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('all');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('all');

  // Modals & Drawers
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmountRupees, setWithdrawalAmountRupees] = useState<string>('');
  const [selectedWithdrawalForTimeline, setSelectedWithdrawalForTimeline] =
    useState<WithdrawalRequest | null>(null);
  const [selectedEarningDetail, setSelectedEarningDetail] = useState<MentorEarning | null>(null);

  // Fetch financial data from authoritative service
  const loadFinancialData = async () => {
    setApiState('loading');
    try {
      const [sumRes, earnRes, withRes, actRes] = await Promise.all([
        mentorFinancialService.getEarningsSummary(mentorId),
        mentorFinancialService.getEarningsHistory(mentorId),
        mentorFinancialService.getWithdrawals(mentorId),
        mentorFinancialService.getPayoutAccount(mentorId),
      ]);

      if (
        sumRes.state === 'unavailable' ||
        earnRes.state === 'unavailable' ||
        withRes.state === 'unavailable'
      ) {
        setApiState('unavailable');
        setSummary(null);
        setEarnings([]);
        setWithdrawals([]);
        setPayoutAccount(null);
      } else if (sumRes.state === 'available') {
        setApiState('available');
        setSummary(sumRes.data);
        setEarnings(earnRes.data || []);
        setWithdrawals(withRes.data || []);
        setPayoutAccount(actRes.data || null);
      } else {
        setApiState(sumRes.state);
      }
    } catch {
      setApiState('unavailable');
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [mentorId]);

  // Status badge styling helper
  const renderWithdrawalStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'requested':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Requested
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Under Review
          </span>
        );
      case 'approved_hold_active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Approved — Hold Active
          </span>
        );
      case 'extended_hold':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            Extended Hold
          </span>
        );
      case 'ready_for_payout':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Ready for Payout
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Rejected
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  // Filtered earnings
  const filteredEarnings = earnings.filter((e) => {
    const matchesSearch =
      ledgerSearch === '' ||
      e.transactionReference.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      e.startupName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      e.packageTitle.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesStatus =
      ledgerStatusFilter === 'all' || e.status === ledgerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    return (
      withdrawalStatusFilter === 'all' || w.status === withdrawalStatusFilter
    );
  });

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                Earnings & Withdrawals
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                Mentor Contractual Finance
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Advisory engagement contractual allocations (90%), Xentro 10% commission accounting, and RBI-aware withdrawal verification
            </p>
          </div>

          <button
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Withdrawal</span>
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview' as const, label: 'Overview & Balances' },
            { id: 'earnings_ledger' as const, label: 'Earnings History' },
            { id: 'withdrawals' as const, label: 'Withdrawal History' },
            { id: 'payout_account' as const, label: 'Payout Account & Verification' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration-Unavailable Alert Banner (Mandatory Behavior) */}
      {apiState === 'unavailable' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold">
              Centralized Payout & Ledger Integration Pending
            </h3>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            The authoritative Mentor Financial Ledger and Razorpay settlement infrastructure are currently being connected to Xentro V1. Live contractual balances, fee reconciliations, and payout verification holds will populate automatically once the payment and internal admin services are activated.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUBTAB: OVERVIEW & BALANCES (6 SUMMARY CARDS)           */}
      {/* ========================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total Earnings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Total Earnings (90%)</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {summary ? formatPaiseToRupees(summary.totalEarningsPaise) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Cumulative contractual advisory revenue
              </p>
            </div>

            {/* Card 2: Available Earnings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Available for Withdrawal</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
                  {summary ? formatPaiseToRupees(summary.availableEarningsPaise) : '—'}
                </span>
                {summary && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Eligible
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Cleared funds subject to 24-hr hold on request
              </p>
            </div>

            {/* Card 3: Pending Earnings */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Pending Earnings</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {summary ? formatPaiseToRupees(summary.pendingEarningsPaise) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Active engagements awaiting session milestone completion
              </p>
            </div>

            {/* Card 4: Withdrawals Under Review */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Under Verification Hold</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-amber-600 dark:text-amber-400">
                  {summary
                    ? formatPaiseToRupees(summary.withdrawalsUnderReviewPaise)
                    : '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Active 24-hour verification holds + admin review
              </p>
            </div>

            {/* Card 5: Total Withdrawn */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Total Withdrawn</span>
                <div className="p-2 rounded-xl bg-gray-500/10 text-gray-600 dark:text-gray-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {summary ? formatPaiseToRupees(summary.totalWithdrawnPaise) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Completed provider settlements to verified bank account
              </p>
            </div>

            {/* Card 6: Xentro Commission */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Xentro Commission (10%)</span>
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {summary ? formatPaiseToRupees(summary.xentroCommissionPaise) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Platform fee on gross customer mentorship payments
              </p>
            </div>
          </div>

          {/* Regulatory & Safety Notice */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7]">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#101212] dark:text-white">
                RBI Regulatory & Contractual Compliance Notice
              </p>
              <p>
                Xentro does not issue prepaid payment instruments or operate stored-value wallets. All figures represent contractual allocations for advisory services rendered. Eligible withdrawals are subject to a mandatory 24-hour verification hold and Internal Admin authorization prior to direct settlement to your verified commercial bank account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SUBTAB: EARNINGS HISTORY LEDGER                        */}
      {/* ========================================================= */}
      {activeSubTab === 'earnings_ledger' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Contractual Earnings Ledger
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Itemized transaction accounting for advisory sessions and milestone payments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reference or startup..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-transparent text-xs text-[#101212] dark:text-white focus:outline-hidden"
                />
              </div>

              <select
                value={ledgerStatusFilter}
                onChange={(e) => setLedgerStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-transparent text-xs text-[#101212] dark:text-white focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="pending_clearance">Pending Clearance</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {filteredEarnings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#8E9390]">
                    <th className="py-3 px-3">Transaction Ref</th>
                    <th className="py-3 px-3">Startup / Founder</th>
                    <th className="py-3 px-3">Package & Session</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 font-mono">Gross Payment</th>
                    <th className="py-3 px-3 font-mono">Commission (10%)</th>
                    <th className="py-3 px-3 font-mono">Net Contractual (90%)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                  {filteredEarnings.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-[#101212] dark:text-white">
                        {tx.transactionReference}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#101212] dark:text-white block">
                          {tx.startupName}
                        </span>
                        <span className="text-[11px] text-[#565B59]">
                          {tx.founderName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#101212] dark:text-white block">
                          {tx.packageTitle}
                        </span>
                        <span className="text-[11px] text-[#565B59]">
                          {tx.sessionDuration}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#565B59]">
                        {new Date(tx.transactionDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#101212] dark:text-white">
                        {formatPaiseToRupees(tx.grossPaymentPaise)}
                      </td>
                      <td className="py-3 px-3 font-mono text-red-500">
                        -{formatPaiseToRupees(tx.xentroCommissionPaise)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPaiseToRupees(tx.netPayablePaise)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                          {tx.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedEarningDetail(tx)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#565B59] transition-all cursor-pointer"
                          title="View Transaction Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-gray-200 dark:border-[#262A29] rounded-xl space-y-2">
              <Receipt className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {apiState === 'unavailable'
                  ? 'Earnings Ledger Integration Pending'
                  : 'No transaction records found'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {apiState === 'unavailable'
                  ? 'Authoritative records will synchronize here as soon as mentorship session payments are recorded.'
                  : 'Completed mentorship session transactions and revenue allocations will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SUBTAB: WITHDRAWAL HISTORY                             */}
      {/* ========================================================= */}
      {activeSubTab === 'withdrawals' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Withdrawal Requests & Settlements
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Status-aware withdrawal tracking with mandatory 24-hour verification hold and admin authorization
              </p>
            </div>

            <select
              value={withdrawalStatusFilter}
              onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-transparent text-xs text-[#101212] dark:text-white focus:outline-hidden self-start sm:self-auto"
            >
              <option value="all">All Statuses (9)</option>
              <option value="requested">Requested</option>
              <option value="under_review">Under Review</option>
              <option value="approved_hold_active">Approved — Hold Active</option>
              <option value="extended_hold">Extended Hold</option>
              <option value="ready_for_payout">Ready for Payout</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {filteredWithdrawals.length > 0 ? (
            <div className="space-y-3">
              {filteredWithdrawals.map((w) => {
                const hold = calculateHoldDetails(w.requestedAt);
                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-[#101212] dark:text-white">
                          {w.id}
                        </span>
                        {renderWithdrawalStatusBadge(w.status)}
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        Requested: {new Date(w.requestedAt).toLocaleString('en-IN')} &bull; Payout Account: {w.maskedBankReference}
                      </p>
                      {!hold.isHoldCompleted && (
                        <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Mandatory 24h Hold Active &bull; {hold.remainingFormatted} remaining
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-bold font-sora text-sm text-[#101212] dark:text-white block">
                          {formatPaiseToRupees(w.amountPaise)}
                        </span>
                        <span className="text-[10px] text-[#565B59]">
                          Admin Approval: <span className="font-semibold capitalize">{w.adminApprovalStatus}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedWithdrawalForTimeline(w)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-white dark:hover:bg-[#181B1A] text-xs font-semibold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-gray-200 dark:border-[#262A29] rounded-xl space-y-2">
              <ShieldCheck className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {apiState === 'unavailable'
                  ? 'Withdrawal Verification Service Pending'
                  : 'No withdrawal records'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {apiState === 'unavailable'
                  ? 'Withdrawal submissions and live status timelines will be enabled upon completion of payment setup.'
                  : 'Submitted withdrawal requests and settlement progress will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SUBTAB: PAYOUT ACCOUNT & VERIFICATION                  */}
      {/* ========================================================= */}
      {activeSubTab === 'payout_account' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-[#D9FF3F]" />
              <span>Verified Commercial Payout Account</span>
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Bank account for automated NEFT/IMPS settlement of contractual advisory earnings
            </p>
          </div>

          {payoutAccount ? (
            <div className="p-5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#101212] dark:text-white">
                      {payoutAccount.bankName} &bull; {payoutAccount.accountType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                      {payoutAccount.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Account Holder:{' '}
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {payoutAccount.accountHolderName}
                    </span>{' '}
                    &bull; A/C: {payoutAccount.maskedAccountNumber} &bull; IFSC:{' '}
                    {payoutAccount.ifscCode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                    Razorpay Linked: {payoutAccount.razorpayLinkedStatus}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center space-y-3">
              <Building className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                  No Payout Bank Account Registered
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                  Payout account registration and bank penny-drop verification will be activated during the centralized provider onboarding workstream.
                </p>
              </div>
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-400 text-xs font-semibold cursor-not-allowed"
              >
                Add Bank Account (Activation Pending)
              </button>
            </div>
          )}

          {/* Privacy & Safeguard notice */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2 text-xs text-[#565B59] dark:text-[#B6B8B7]">
            <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Data Protection & Banking Security</span>
            </span>
            <p>
              Full bank account numbers are never exposed in the browser interface and are never stored in unencrypted client storage. Account verification utilizes automated bank penny-drop validation in accordance with RBI merchant settlement guidelines.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: REQUEST WITHDRAWAL                              */}
      {/* ========================================================= */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white">
                    Request Contractual Withdrawal
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Disburse cleared advisory earnings to your verified bank account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawalModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Available Balance Preview */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] block">
                  Eligible Available Balance
                </span>
                <span className="text-lg font-bold font-sora text-emerald-600 dark:text-emerald-400">
                  {summary ? formatPaiseToRupees(summary.availableEarningsPaise) : 'Awaiting Activation'}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Direct NEFT/IMPS
              </span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#101212] dark:text-white block">
                Withdrawal Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={withdrawalAmountRupees}
                  onChange={(e) => setWithdrawalAmountRupees(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-transparent text-sm text-[#101212] dark:text-white font-mono focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                {['25%', '50%', '100%'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      if (summary) {
                        const mult = parseInt(pct) / 100;
                        setWithdrawalAmountRupees(
                          (summary.availableEarningsPaise * mult / 100).toString()
                        );
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#262A29] text-[11px] font-bold text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Conditions Notice */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Mandatory 24-Hour Verification Rule</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Upon request, a mandatory 24-hour verification hold begins at the backend creation timestamp. Settlement eligibility requires BOTH hold completion and Internal Admin authorization.
              </p>
            </div>

            {/* Mandatory Disabled Submit Action */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-[#262A29] text-gray-400 dark:text-gray-500 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Withdrawals will be available after payout activation.</span>
              </button>
              <p className="text-[11px] text-center text-[#565B59] dark:text-[#8E9390]">
                Disbursement authorization will be enabled upon Razorpay payout infrastructure activation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: VERIFICATION TIMELINE VIEW                      */}
      {/* ========================================================= */}
      {selectedWithdrawalForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white">
                    Withdrawal Verification Timeline
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Request ID: {selectedWithdrawalForTimeline.id} &bull; Amount: {formatPaiseToRupees(selectedWithdrawalForTimeline.amountPaise)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWithdrawalForTimeline(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Events Display */}
            <div className="space-y-4 pl-2">
              {[
                {
                  title: '1. Withdrawal Requested',
                  desc: `Recorded at ${new Date(selectedWithdrawalForTimeline.requestedAt).toLocaleString('en-IN')}`,
                  completed: true,
                  active: false,
                },
                {
                  title: '2. Under Admin Review',
                  desc: 'Internal compliance and transaction audit verification',
                  completed: selectedWithdrawalForTimeline.adminApprovalStatus === 'approved',
                  active: selectedWithdrawalForTimeline.adminApprovalStatus === 'pending',
                },
                {
                  title: '3. Mandatory 24-Hour Hold',
                  desc: `Earliest hold expiry: ${new Date(selectedWithdrawalForTimeline.holdExpiresAt).toLocaleString('en-IN')}. Expiry does not auto-approve payout.`,
                  completed: selectedWithdrawalForTimeline.holdCompleted,
                  active: !selectedWithdrawalForTimeline.holdCompleted,
                },
                {
                  title: '4. Admin Approved & Eligible',
                  desc: 'Approval granted by authorized finance operator',
                  completed: selectedWithdrawalForTimeline.adminApprovalStatus === 'approved',
                  active: false,
                },
                {
                  title: '5. Payout Processing',
                  desc: 'Queued for Razorpay commercial bank transfer',
                  completed: selectedWithdrawalForTimeline.status === 'completed',
                  active: selectedWithdrawalForTimeline.status === 'processing',
                },
                {
                  title: '6. Settlement Completed',
                  desc: selectedWithdrawalForTimeline.settledAt
                    ? `Disbursed to ${selectedWithdrawalForTimeline.maskedBankReference} on ${new Date(selectedWithdrawalForTimeline.settledAt).toLocaleString('en-IN')}`
                    : 'Awaiting provider bank credit confirmation',
                  completed: selectedWithdrawalForTimeline.status === 'completed',
                  active: false,
                },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.completed
                          ? 'bg-emerald-500 text-white'
                          : step.active
                          ? 'bg-purple-500 text-white animate-pulse'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {step.completed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    {idx < 5 && (
                      <div
                        className={`w-0.5 h-8 ${
                          step.completed
                            ? 'bg-emerald-500'
                            : 'bg-gray-200 dark:bg-gray-800'
                        }`}
                      />
                    )}
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex justify-end">
              <button
                onClick={() => setSelectedWithdrawalForTimeline(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL: EARNING DETAIL BREAKDOWN                        */}
      {/* ========================================================= */}
      {selectedEarningDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Transaction Breakdown
              </h3>
              <button
                onClick={() => setSelectedEarningDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                <span className="text-[#565B59]">Transaction Ref</span>
                <span className="font-mono font-bold text-[#101212] dark:text-white">
                  {selectedEarningDetail.transactionReference}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                <span className="text-[#565B59]">Startup</span>
                <span className="font-semibold text-[#101212] dark:text-white">
                  {selectedEarningDetail.startupName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                <span className="text-[#565B59]">Gross Customer Payment</span>
                <span className="font-mono font-bold">
                  {formatPaiseToRupees(selectedEarningDetail.grossPaymentPaise)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29] text-red-500">
                <span>Xentro Commission (10%)</span>
                <span className="font-mono">
                  -{formatPaiseToRupees(selectedEarningDetail.xentroCommissionPaise)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                <span className="text-[#565B59]">Mentor Allocation (90%)</span>
                <span className="font-mono font-semibold">
                  {formatPaiseToRupees(selectedEarningDetail.mentorContractualEarningsPaise)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                <span>Net Payable</span>
                <span className="font-mono font-sora">
                  {formatPaiseToRupees(selectedEarningDetail.netPayablePaise)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEarningDetail(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
