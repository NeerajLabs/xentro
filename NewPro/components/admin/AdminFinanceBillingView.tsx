'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminFinanceSummary,
  AdminSubscription,
  AdminEntitlementRecord,
  AdminPaymentTransaction,
  AdminPayoutRecord,
  AdminRefundRecord,
  AdminInvoiceRecord,
  AdminPlanPricing,
} from '@/types/admin';
import {
  adminDomainService,
  INITIAL_FINANCE_SUMMARY,
  logAdminAudit,
} from '@/lib/adminDomainService';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  X,
  FileText,
  RotateCcw,
  Zap,
  Lock,
  Layers,
  Building,
  User,
} from 'lucide-react';

const INITIAL_PLANS: AdminPlanPricing[] = [
  { id: 'plan-01', planName: 'Startup Pro', workspaceType: 'Startup Entity', billingCycle: 'Monthly / Annual', priceUSD: 49, features: ['Unlimited Pitch Decks', 'AI Investor Matching', 'Virtual DD Locker (5GB)', 'Custom Domain'], trialDays: 14, status: 'Active' },
  { id: 'plan-02', planName: 'Investor Pro (Multi-Seat)', workspaceType: 'Investor Organization', billingCycle: 'Monthly / Annual', priceUSD: 180, features: ['10 Partner Seats', 'Unlimited CRM Pipeline', 'DD Data Room Access', 'Watermarking', 'LP Reports'], trialDays: 30, status: 'Active' },
  { id: 'plan-03', planName: 'Institutional ESP Suite', workspaceType: 'ESP', billingCycle: 'Annual', priceUSD: 1200, features: ['Unlimited Cohorts', 'Endorsement Entitlement Broker', 'Application Portal', 'Alumni Tracking'], trialDays: 0, status: 'Active' },
];

export const AdminFinanceBillingView: React.FC = () => {
  const [financeSummary, setFinanceSummary] = useState<AdminFinanceSummary>(INITIAL_FINANCE_SUMMARY);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [entitlements, setEntitlements] = useState<AdminEntitlementRecord[]>([]);
  const [payments, setPayments] = useState<AdminPaymentTransaction[]>([]);
  const [plans] = useState<AdminPlanPricing[]>(INITIAL_PLANS);
  const [activeTab, setActiveTab] = useState<'Finance Overview' | 'Subscriptions' | 'Entitlements Engine' | 'Transactions' | 'Plans & Pricing'>('Finance Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<AdminPaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setFinanceSummary(adminDomainService.getFinanceSummary());
    setSubscriptions(adminDomainService.getSubscriptions());
    setEntitlements(adminDomainService.getEntitlements());
    setPayments(adminDomainService.getPayments());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('xentro-admin-updated', handleUpdate);
    return () => window.removeEventListener('xentro-admin-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenRefund = (tx: AdminPaymentTransaction) => {
    setSelectedTx(tx);
    setRefundModalOpen(true);
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !refundReason.trim()) return;

    logAdminAudit('PAYMENT_REFUND_EXECUTED', 'Finance & Billing', `Processed refund of $${selectedTx.amountUSD} for ${selectedTx.customerName}. Reason: ${refundReason}`, selectedTx.id);
    showToast(`Refund of $${selectedTx.amountUSD} processed for ${selectedTx.customerName}.`);
    setRefundModalOpen(false);
    setSelectedTx(null);
    setRefundReason('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#101212] text-white border border-[#D9FF3F]/30 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-700 dark:text-[#D9FF3F] bg-emerald-500/10 dark:bg-[#D9FF3F]/15 px-2.5 py-1 rounded-md w-fit mb-2 font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            Commercial & Ledger Control Plane
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Billing, Finance & Entitlements Engine
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Decouples SaaS billing subscriptions from feature entitlements. Audit platform GMV, mentor session payments, escrow settlements, 8% commissions, and tokenized payment cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Platform MRR</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-[#D9FF3F]">${financeSummary.mrrUSD.toLocaleString()}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Failed Payments</div>
            <div className="text-lg font-bold font-sora text-rose-500">{financeSummary.failedPaymentsCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['Finance Overview', 'Subscriptions', 'Entitlements Engine', 'Transactions', 'Plans & Pricing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Finance Overview */}
      {activeTab === 'Finance Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Platform ARR</span>
              <p className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">${financeSummary.arrUSD.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+19.3% vs last year</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Gross Platform GMV</span>
              <p className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">${financeSummary.grossRevenueUSD.toLocaleString()}</p>
              <span className="text-[10px] text-[#6E7370] dark:text-[#8E9390]">Monthly billing volume</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Net Xentro Revenue</span>
              <p className="font-sora text-xl font-bold text-emerald-700 dark:text-[#D9FF3F] mt-1">${financeSummary.netRevenueUSD.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">After mentor payouts</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Commissions</span>
              <p className="font-sora text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">${financeSummary.totalCommissionUSD.toLocaleString()}</p>
              <span className="text-[10px] text-[#6E7370] dark:text-[#8E9390]">8% advisory split</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
            <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
              Revenue Stream Aggregation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">SaaS Subscriptions</span>
                <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">
                  ${(financeSummary.startupSubRevenueUSD + financeSummary.investorSubRevenueUSD + financeSummary.espRevenueUSD).toLocaleString()}
                </p>
                <div className="space-y-1 text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                  <div>Startups: ${financeSummary.startupSubRevenueUSD.toLocaleString()}</div>
                  <div>Investors: ${financeSummary.investorSubRevenueUSD.toLocaleString()}</div>
                  <div>ESPs: ${financeSummary.espRevenueUSD.toLocaleString()}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">Advisory & Mentorship GMV</span>
                <p className="font-mono text-[#101212] dark:text-white text-lg font-bold">
                  ${(financeSummary.mentorSessionGMVUSD + financeSummary.mentorshipGMVUSD).toLocaleString()}
                </p>
                <div className="space-y-1 text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                  <div>1-on-1 Sessions: ${financeSummary.mentorSessionGMVUSD.toLocaleString()}</div>
                  <div>Structured Mentorships: ${financeSummary.mentorshipGMVUSD.toLocaleString()}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">Escrow & Payout Health</span>
                <p className="font-mono text-amber-500 text-lg font-bold">
                  ${financeSummary.pendingPayoutsUSD.toLocaleString()} Pending
                </p>
                <div className="space-y-1 text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                  <div>Total Settled Refunds: ${financeSummary.totalRefundsUSD.toLocaleString()}</div>
                  <div className="text-rose-500">{financeSummary.failedPaymentsCount} failed billing attempts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscriptions */}
      {activeTab === 'Subscriptions' && (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                <th className="py-3.5 px-4 font-semibold">Subscriber</th>
                <th className="py-3.5 px-4 font-semibold">Workspace Context</th>
                <th className="py-3.5 px-4 font-semibold">Plan & Cycle</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Next Renewal</th>
                <th className="py-3.5 px-4 font-semibold text-right">Payment State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{s.customerName}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">ID: {s.id} &bull; {s.customerType}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#565B59] dark:text-gray-300 font-medium">{s.workspaceType}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-[#101212] dark:text-white">{s.planName}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block">{s.billingCycle}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#101212] dark:text-white">${s.priceUSD}/mo</td>
                  <td className="py-3.5 px-4">
                    {s.status === 'Active' || s.status === 'Complimentary' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {s.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> {s.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px]">{s.nextBillingDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-transparent">
                      {s.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Entitlements Engine */}
      {activeTab === 'Entitlements Engine' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/5 border border-emerald-200 dark:border-[#D9FF3F]/20 text-xs text-[#565B59] dark:text-[#A0A4A2]">
            <p className="font-semibold text-emerald-800 dark:text-[#D9FF3F] mb-1">Architecture: ACCESS SOURCE &rarr; ENTITLEMENT &rarr; FEATURE ACCESS</p>
            <p>
              Subscription ≠ Entitlement. Entitlements can stem from Paid Subscriptions, ESP Endorsements, Partnerships, or Administrative Grants.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Subject Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Entitlement Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Access Source</th>
                  <th className="py-3.5 px-4 font-semibold">Features Unlocked</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Granted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {entitlements.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#101212] dark:text-white">{e.subjectName}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-[#D9FF3F]">{e.tier}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 font-medium">
                        {e.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {e.featuresGranted.map((f, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-gray-300 border border-gray-200/50 dark:border-transparent">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {e.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500 dark:text-gray-400">{e.grantedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Transactions */}
      {activeTab === 'Transactions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Tokenized PCI-DSS Compliant Payments. Zero raw CVV or PAN card numbers stored.</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Stripe / Razorpay Direct Gateway</span>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Transaction Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Customer / Workspace</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Instrument</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Gross Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {payments.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[#101212] dark:text-white font-medium">{tx.providerRef}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{tx.timestamp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{tx.customerName}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{tx.workspace}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#565B59] dark:text-gray-300">{tx.paymentMethodMasked}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-transparent">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#101212] dark:text-white">${tx.amountUSD.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      {tx.status === 'Succeeded' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Succeeded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.status === 'Succeeded' && (
                        <button
                          onClick={() => handleOpenRefund(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[11px] font-semibold text-[#101212] dark:text-gray-300 transition-all border border-gray-200 dark:border-transparent"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Plans & Pricing */}
      {activeTab === 'Plans & Pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-800 dark:text-[#D9FF3F] bg-emerald-500/10 dark:bg-[#D9FF3F]/10 px-2.5 py-1 rounded-md border border-emerald-500/20 dark:border-transparent">
                    {p.workspaceType}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active Tier</span>
                </div>
                <h4 className="font-sora text-xl font-bold text-[#101212] dark:text-white">{p.planName}</h4>
                <div className="text-2xl font-bold font-mono text-[#101212] dark:text-white">
                  ${p.priceUSD} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">/ {p.billingCycle}</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#262A29]">
                  {p.features.map((f, i) => (
                    <div key={i} className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#D9FF3F]" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29]">
                <button
                  onClick={() => showToast(`Plan ${p.planName} opened for configuration adjustment.`)}
                  className="w-full py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all border border-gray-200 dark:border-transparent"
                >
                  Configure Tier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleProcessRefund}
            className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2.5 text-amber-500">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                Execute Transaction Refund
              </h3>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
              Issue a full refund of <strong className="text-[#101212] dark:text-white">${selectedTx.amountUSD}</strong> to <strong className="text-[#101212] dark:text-white">{selectedTx.customerName}</strong> via {selectedTx.paymentMethodMasked}.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Refund Audit Reason (Mandatory)</label>
              <textarea
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="State the customer request, billing error, or dispute resolution reference..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#101212] text-xs font-bold transition-all shadow-xs"
              >
                Confirm Refund
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
