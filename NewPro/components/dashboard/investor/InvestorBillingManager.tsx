'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import {
  InvestorSubscription,
  InvestorBillingAccount,
  InvestorInvoice,
  InvestorPlanTier,
} from '@/types/investor';

import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import { getUserProfile } from '@/lib/userProfile';

export const InvestorBillingManager: React.FC = () => {
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<InvestorSubscription>(() =>
    investorOrganizationService.getScopedBilling().subscription
  );
  const [billingAccount, setBillingAccount] = useState<InvestorBillingAccount>(() =>
    investorOrganizationService.getScopedBilling().billingAccount
  );
  const [invoices, setInvoices] = useState<InvestorInvoice[]>(() =>
    investorOrganizationService.getScopedBilling().invoices
  );

  // Simulated Payment Failure / Grace Period State
  const [isGracePeriodSimulated, setIsGracePeriodSimulated] = useState(false);

  // Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Edit Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState(() => getUserProfile().name || 'Cardholder');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 9082');

  useEffect(() => {
    const refreshBilling = () => {
      const b = investorOrganizationService.getScopedBilling();
      setSubscription(b.subscription);
      setBillingAccount(b.billingAccount);
      setInvoices(b.invoices);
    };

    const handleBillingChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.subscription) {
        setSubscription(ce.detail.subscription);
      } else {
        refreshBilling();
      }
    };
    window.addEventListener('xentro-investor-billing-changed', handleBillingChange);
    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshBilling);
    return () => {
      window.removeEventListener('xentro-investor-billing-changed', handleBillingChange);
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshBilling);
    };
  }, []);

  const handleSelectTier = (tier: InvestorPlanTier) => {
    const updated = investorDomainService.updateSubscriptionTier(tier);
    setSubscription(updated);
    showToast(`Subscription upgraded to ${tier.toUpperCase()} tier!`, 'success');
    setIsUpgradeModalOpen(false);
  };

  const handleDownloadInvoice = (inv: InvestorInvoice) => {
    showToast(`Downloading tax invoice ${inv.invoiceNumber}...`, 'info');
    setTimeout(() => {
      showToast(`Tax invoice ${inv.invoiceNumber} downloaded with GST breakdown!`, 'success');
    }, 1000);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Corporate payment method updated and verified!', 'success');
    setIsPaymentModalOpen(false);
  };

  const handleResolveGracePeriod = () => {
    setIsGracePeriodSimulated(false);
    showToast('Payment retry succeeded! Account returned to active standing.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>
              {investorOrganizationService.isOrganizationContext()
                ? 'Firm Subscription, Billing & GST Invoices'
                : 'Personal Angel Subscription & Billing'}
            </span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Dedicated billing ledger for {billingAccount.organizationName}
          </p>
        </div>

        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Change Subscription Plan</span>
        </button>
      </div>

      {/* Grace Period Simulated Alert */}
      {isGracePeriodSimulated ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold block">Payment Failed: 7-Day Grace Period Active</span>
              <span>Your corporate card retry failed on March 20. Team deal flow remains active until March 27 before read-only restriction.</span>
            </div>
          </div>
          <button
            onClick={handleResolveGracePeriod}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex-shrink-0 cursor-pointer"
          >
            Retry Outstanding Payment
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-xs text-gray-500">
          <span>Test Payment Resilience:</span>
          <button
            onClick={() => {
              setIsGracePeriodSimulated(true);
              showToast('Simulated corporate card payment failure.', 'error');
            }}
            className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
          >
            Simulate Failed Renewal & Grace Period
          </button>
        </div>
      )}

      {/* 2. Current Plan & Seats Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Current Plan Tier</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#D9FF3F] text-[#101212]">
              {subscription.tier}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              ₹{subscription.monthlyPrice.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">/ month + GST</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Next renewal date: December 31, 2026 &bull; Auto-renewal active
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Partner & Team Seats</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {subscription.seatsUsed} of {subscription.seatsIncluded} Used
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#202422] overflow-hidden">
            <div
              className="h-full bg-[#D9FF3F] rounded-full"
              style={{ width: `${(subscription.seatsUsed / subscription.seatsIncluded) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            3 partner seats available for allocation in Team & Access
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Deal Pipeline Limits</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Unlimited
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              50 / mo
            </span>
            <span className="text-xs text-gray-500">DD Data Room Exports</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Full compliance watermarking on all downloaded founder models
          </p>
        </div>
      </div>

      {/* 3. Registered Billing Details & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Legal Entity & GST Info */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="font-bold text-sm text-[#101212] dark:text-white font-heading">
              Registered Tax & Legal Details
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> GSTIN Verified
            </span>
          </div>

          <div className="space-y-1.5 text-[#565B59] dark:text-[#B6B8B7]">
            <div>
              <span className="text-gray-400 block text-[10px]">Entity Name:</span>
              <strong className="text-[#101212] dark:text-white">{billingAccount.organizationName}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px]">GSTIN:</span>
                <strong className="text-[#101212] dark:text-white font-mono">{billingAccount.gstin}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">PAN:</span>
                <strong className="text-[#101212] dark:text-white font-mono">{billingAccount.pan}</strong>
              </div>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Registered Address:</span>
              <span>
                {billingAccount.billingAddress.line1}, {billingAccount.billingAddress.city},{' '}
                {billingAccount.billingAddress.state}, {billingAccount.billingAddress.country} -{' '}
                {billingAccount.billingAddress.postalCode}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Billing Invoices Email:</span>
              <strong className="text-[#101212] dark:text-white">{billingAccount.billingEmail}</strong>
            </div>
          </div>
        </div>

        {/* Corporate Payment Method */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="font-bold text-sm text-[#101212] dark:text-white font-heading">
              Corporate Payment Method
            </h3>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline cursor-pointer"
            >
              Update Card
            </button>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#101212] text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                  {billingAccount.defaultPaymentMethod.brand}
                </h4>
                <p className="text-gray-400 text-xs">
                  Ending in •••• {billingAccount.defaultPaymentMethod.last4} &bull; Expires{' '}
                  {billingAccount.defaultPaymentMethod.expiry}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Default
            </span>
          </div>

          <p className="text-[11px] text-gray-400">
            Payments processed via RBI-compliant e-mandate with multi-factor biometric authentication.
          </p>
        </div>
      </div>

      {/* 4. GST Tax Invoices Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
        <h3 className="font-bold text-sm text-[#101212] dark:text-white font-heading">
          Tax Invoices & Receipts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border-b border-gray-200 dark:border-[#262A29]">
              <tr>
                <th className="py-3 px-4 font-bold">Invoice Number</th>
                <th className="py-3 px-4 font-bold">Billing Date</th>
                <th className="py-3 px-4 font-bold">Description</th>
                <th className="py-3 px-4 font-bold">Amount (INR)</th>
                <th className="py-3 px-4 font-bold">18% GST</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#101212] dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{inv.date}</td>
                  <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">{inv.description}</td>
                  <td className="py-3.5 px-4 font-bold text-[#101212] dark:text-white">
                    ₹{inv.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    ₹{inv.gstAmount?.toLocaleString() || '2,700'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-[#D9FF3F] hover:bg-gray-100 dark:hover:bg-[#262A29] transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Tier Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Choose Institutional Investor Tier
              </h3>
              <button onClick={() => setIsUpgradeModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => handleSelectTier('pro')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  subscription.tier === 'pro'
                    ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                    : 'border-gray-200 dark:border-[#262A29] hover:border-gray-400'
                }`}
              >
                <span className="font-bold text-sm text-[#101212] dark:text-white block">Pro Tier</span>
                <span className="text-lg font-bold font-sora">₹14,999</span> /mo
                <p className="text-[11px] text-gray-400">10 Partner Seats &bull; 50 DD Exports</p>
              </div>

              <div
                onClick={() => handleSelectTier('syndicate')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  subscription.tier === 'syndicate'
                    ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                    : 'border-gray-200 dark:border-[#262A29] hover:border-gray-400'
                }`}
              >
                <span className="font-bold text-sm text-[#101212] dark:text-white block">Syndicate</span>
                <span className="text-lg font-bold font-sora">₹29,999</span> /mo
                <p className="text-[11px] text-gray-400">25 Partner Seats &bull; Syndicate Allocations</p>
              </div>

              <div
                onClick={() => handleSelectTier('institutional')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  subscription.tier === 'institutional'
                    ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                    : 'border-gray-200 dark:border-[#262A29] hover:border-gray-400'
                }`}
              >
                <span className="font-bold text-sm text-[#101212] dark:text-white block">Institutional</span>
                <span className="text-lg font-bold font-sora">₹59,999</span> /mo
                <p className="text-[11px] text-gray-400">100 Seats &bull; Dedicated LP Portal</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Update Corporate Payment Method
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Cardholder Name:</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Corporate Card Number:</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Verify & Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
