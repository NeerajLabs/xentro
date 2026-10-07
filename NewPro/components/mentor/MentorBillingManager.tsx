'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
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
} from 'lucide-react';
import { getMentorEarnings, getMentorshipTransactions } from '@/lib/mentorshipService';
import { useToast } from '@/components/ui/Toast';

export const MentorBillingManager: React.FC = () => {
  const { showToast } = useToast();
  const [earnings, setEarnings] = useState(getMentorEarnings());
  const [subTab, setSubTab] = useState<'overview' | 'transactions' | 'payouts' | 'refunds'>('overview');

  useEffect(() => {
    const handleUpdate = () => setEarnings(getMentorEarnings());
    window.addEventListener('xentro-mentorship-transactions-changed', handleUpdate);
    window.addEventListener('xentro-mentorship-changed', handleUpdate);
    return () => {
      window.removeEventListener('xentro-mentorship-transactions-changed', handleUpdate);
      window.removeEventListener('xentro-mentorship-changed', handleUpdate);
    };
  }, []);

  const handleRequestPayout = () => {
    showToast(`Payout request for ₹${earnings.settledEarnings.toLocaleString('en-IN')} submitted to finance team.`, 'success');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Earnings Overview' },
    { id: 'transactions' as const, label: 'Mentorship Transactions', count: earnings.transactions.length },
    { id: 'payouts' as const, label: 'Bank Payouts & Transfers' },
    { id: 'refunds' as const, label: 'Refunds & Cancellations' },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                Billing, Earnings & Payouts
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                Mentor Finance Hub
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Advisory engagement transactions, Xentro 10% commission accounting, and automated banking payouts
            </p>
          </div>

          <button
            onClick={handleRequestPayout}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Payout (₹{earnings.settledEarnings.toLocaleString('en-IN')})</span>
          </button>
        </div>

        {/* Subnav Navigation */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUBTAB: EARNINGS OVERVIEW                              */}
      {/* ========================================================= */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Total Gross Invoiced</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  ₹{earnings.totalGross.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Across all active & completed packages
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Current Month Net</span>
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  ₹{earnings.currentMonthEarnings.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  +18% MoM
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Net after 10% platform fee
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Settled Earnings</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  ₹{earnings.settledEarnings.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Available</span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Ready for automated transfer
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span className="text-xs font-semibold">Pending Escrow</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  ₹{earnings.pendingEarnings.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Awaiting mid-term milestone release
              </p>
            </div>
          </div>

          {/* Connected Payout Bank Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-[#D9FF3F]" />
              <span>Verified Institutional Payout Account</span>
            </h3>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    HDFC Bank Ltd &bull; Current Account
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Account Holder: <span className="font-semibold text-[#101212] dark:text-white">Dr. Arvind Swaminathan</span> &bull; A/C: •••••••• 8812 &bull; IFSC: HDFC0001248
                </p>
              </div>

              <button
                onClick={() => showToast('Opening payout settings...', 'info')}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-all self-start sm:self-auto cursor-pointer"
              >
                Update Bank Mandate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SUBTAB: MENTORSHIP TRANSACTIONS                        */}
      {/* ========================================================= */}
      {subTab === 'transactions' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Mentorship Transaction Ledger
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Granular breakdown of gross fees, 10% platform commission, net payout, and payment references
              </p>
            </div>
            <button
              onClick={() => showToast('Exporting transaction CSV ledger...', 'info')}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#8E9390]">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Startup & Founder</th>
                  <th className="py-3 px-3">Package & Duration</th>
                  <th className="py-3 px-3">Gross</th>
                  <th className="py-3 px-3">Commission (10%)</th>
                  <th className="py-3 px-3">Net Mentor</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {earnings.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-[#101212] dark:text-white">
                      {tx.transactionId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#101212] dark:text-white block">
                        {tx.startupName}
                      </span>
                      <span className="text-[11px] text-[#565B59]">{tx.founderName}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#101212] dark:text-white block">
                        {tx.mentorshipPackage}
                      </span>
                      <span className="text-[11px] text-[#565B59]">{tx.date}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#101212] dark:text-white">
                      ₹{tx.grossAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono text-red-500">
                      -₹{tx.xentroCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{tx.netMentorAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => showToast(`Downloading tax invoice for ${tx.transactionId}...`, 'info')}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-[#565B59] transition-all cursor-pointer"
                        title="Download Tax Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SUBTAB: BANK PAYOUTS                                   */}
      {/* ========================================================= */}
      {subTab === 'payouts' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Payout History & Scheduled Transfers
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Automated NEFT / IMPS transfers released on the 1st and 15th of every month
            </p>
          </div>

          <div className="space-y-3">
            {[
              { id: 'po_1', date: '15 Sep 2026', amount: 36000, reference: 'NEFT-XEN-99120', status: 'Settled to HDFC •••• 8812' },
              { id: 'po_2', date: '01 Sep 2026', amount: 28800, reference: 'NEFT-XEN-88145', status: 'Settled to HDFC •••• 8812' },
              { id: 'po_3', date: '15 Aug 2026', amount: 44200, reference: 'NEFT-XEN-77190', status: 'Settled to HDFC •••• 8812' },
            ].map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold font-mono text-[#101212] dark:text-white block">
                    {p.reference}
                  </span>
                  <span className="text-[11px] text-[#565B59]">{p.date} &bull; {p.status}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-sora text-emerald-600 dark:text-emerald-400 block">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SUBTAB: REFUNDS & CANCELLATIONS                        */}
      {/* ========================================================= */}
      {subTab === 'refunds' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Centrally Governed Refund & Cancellation Policy
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Advisory engagements operate under standard Xentro Escrow & Milestone Refund protections
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 text-xs">
            <span className="font-bold text-[#101212] dark:text-white">Standard Policy Rules:</span>
            <ul className="space-y-1.5 text-gray-700 dark:text-gray-300 list-disc pl-4">
              <li><strong>Prior to 1st session:</strong> 100% full refund available to startup if canceled within 7 days of payment.</li>
              <li><strong>After 1st session conducted:</strong> Pro-rata refund calculated based on completed roadmap sessions minus 10% administrative processing fee.</li>
              <li><strong>Post 50% duration:</strong> Non-refundable except under mutual written mentor-founder release agreement.</li>
            </ul>
          </div>

          <div className="p-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
            No dispute or refund records logged. All mentorship engagements are operating within good standing.
          </div>
        </div>
      )}
    </div>
  );
};
