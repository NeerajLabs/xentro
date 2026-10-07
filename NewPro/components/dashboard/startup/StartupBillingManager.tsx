'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  ArrowRight,
  Plus,
  Check,
  ExternalLink,
  Award,
  Sparkles,
  RefreshCw,
  Building2,
  Eye,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  StartupSubscription,
  StartupBillingAccount,
  StartupInvoice,
  StartupSubscriptionPlan,
  StartupEntitlement,
  StartupEntityRole,
} from '@/types/startup';
import {
  getStartupSubscription,
  saveStartupSubscription,
  getStartupBillingAccount,
  saveStartupBillingAccount,
  getStartupInvoices,
  resolveStartupEntitlements,
  initialStartupSubscriptionPlans,
  getFailedPaymentSimulation,
  setFailedPaymentSimulation,
  retryStartupPayment,
  hasStartupPermission,
} from '@/lib/startupDomainService';

interface StartupBillingManagerProps {
  currentRole?: StartupEntityRole;
}

export const StartupBillingManager: React.FC<StartupBillingManagerProps> = ({
  currentRole = 'Owner / Founder',
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'details'>('overview');
  const [subscription, setSubscription] = useState<StartupSubscription>(getStartupSubscription());
  const [entitlement, setEntitlement] = useState<StartupEntitlement>(resolveStartupEntitlements());
  const [billingAccount, setBillingAccount] = useState<StartupBillingAccount>(getStartupBillingAccount());
  const [invoices, setInvoices] = useState<StartupInvoice[]>(getStartupInvoices());
  const [isFailedSim, setIsFailedSim] = useState<boolean>(getFailedPaymentSimulation());

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<StartupSubscriptionPlan | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<StartupInvoice | null>(null);

  // Billing account form state
  const [billingForm, setBillingForm] = useState<StartupBillingAccount>(billingAccount);

  const canManageBilling = hasStartupPermission(currentRole, 'manage_billing');

  const reloadData = () => {
    setSubscription(getStartupSubscription());
    setEntitlement(resolveStartupEntitlements());
    setBillingAccount(getStartupBillingAccount());
    setInvoices(getStartupInvoices());
    setIsFailedSim(getFailedPaymentSimulation());
  };

  useEffect(() => {
    reloadData();
    const handleBillingChanged = () => reloadData();
    const handleEndorsementChanged = () => reloadData();
    window.addEventListener('xentro-startup-billing-changed', handleBillingChanged);
    window.addEventListener('xentro-startup-endorsements-changed', handleEndorsementChanged);
    return () => {
      window.removeEventListener('xentro-startup-billing-changed', handleBillingChanged);
      window.removeEventListener('xentro-startup-endorsements-changed', handleEndorsementChanged);
    };
  }, []);

  const handleSaveBillingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBilling) {
      showToast('You do not have permission to modify billing details.', 'error');
      return;
    }
    saveStartupBillingAccount(billingForm);
    showToast('Billing details updated successfully.', 'success');
  };

  const handlePlanUpgradeDowngrade = (plan: StartupSubscriptionPlan) => {
    if (!canManageBilling) {
      showToast('You do not have permission to change subscription plans.', 'error');
      return;
    }
    const updated: StartupSubscription = {
      ...subscription,
      planId: plan.id,
      planName: plan.name,
      amount: subscription.billingCycle === 'Annual' ? plan.priceAnnual : plan.priceMonthly,
      status: 'Active',
      entitlementSource: entitlement.source === 'ESP Endorsement' ? 'ESP Endorsement' : 'Paid Subscription',
    };
    saveStartupSubscription(updated);
    setIsPlanModalOpen(false);
    showToast(`Subscription updated to ${plan.name}!`, 'success');
  };

  const handleCancelSubscription = () => {
    if (!canManageBilling) {
      showToast('You do not have permission to cancel subscriptions.', 'error');
      return;
    }
    saveStartupSubscription({
      ...subscription,
      status: 'Cancelled',
      autoRenew: false,
    });
    setIsCancelModalOpen(false);
    if (entitlement.source === 'ESP Endorsement') {
      showToast('Direct subscription cancelled. Your Startup Pro access remains ACTIVE through your ESP Endorsement.', 'info');
    } else {
      showToast('Subscription cancelled. Access remains active until end of billing period.', 'info');
    }
  };

  const handleRetryPayment = () => {
    retryStartupPayment();
    showToast('Payment retried successfully! Account is in good standing.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Billing & Payments</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Xentro SaaS & Entitlements
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage platform subscription plans, non-dilutive ESP endorsements, payment instruments, and GST tax invoices.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Role: {currentRole}</span>
          </div>
        </div>
      </div>

      {/* 2. Simulated Failed Payment Alert Banner (Section 36) */}
      {(isFailedSim || subscription.status === 'Past Due') && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Payment Failed — Renewal Processing Error
              </h4>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-400/90">
                Your recent payment of ₹{subscription.amount.toLocaleString()} was declined by your bank. Your Startup data and entity identity remain completely preserved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRetryPayment}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
            >
              Retry Payment
            </button>
          </div>
        </div>
      )}

      {/* 3. Top High-Level Telemetry Cards (Sections 28 & 29) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Plan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
            Current Tier
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              {entitlement.planTier}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Active
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {subscription.billingCycle} billing cycle
          </p>
        </div>

        {/* Entitlement Source */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
            Entitlement Grant Source
          </span>
          <div className="flex items-center gap-2">
            {entitlement.source === 'ESP Endorsement' ? (
              <span className="text-sm font-bold font-sora text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>ESP Endorsement</span>
              </span>
            ) : (
              <span className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Direct Subscription</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
            {entitlement.sponsoringEntityName || 'Self-Sponsored Venture'}
          </p>
        </div>

        {/* Next Billing / Payment Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
            Direct Payment Requirement
          </span>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {entitlement.directPaymentRequired ? `₹${subscription.amount.toLocaleString()}` : 'Not Required'}
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {entitlement.directPaymentRequired ? `Due on ${subscription.renewalDate}` : 'Fully sponsored by Incubator'}
          </p>
        </div>

        {/* Validity Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
            Access Valid Until
          </span>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {entitlement.validUntil}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Guaranteed Platform Standing
          </p>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Subscription & Plans', icon: Sparkles },
          { id: 'invoices', label: 'Invoices & Receipts', icon: FileText, count: invoices.length },
          { id: 'details', label: 'Billing Account Info', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]' : 'bg-gray-200 dark:bg-[#262A29] text-gray-700 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. TAB 1: SUBSCRIPTION & PLANS (Section 30) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Active Plan Detail Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-[#101212] dark:text-white font-display">
                    {entitlement.planTier}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {subscription.status}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Active entitlement: <strong>{entitlement.source}</strong> ({entitlement.sponsoringEntityName || 'Direct Venture Account'}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  Change Plan Tier
                </button>
                {subscription.status === 'Active' && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Direct Plan
                  </button>
                )}
              </div>
            </div>

            {/* Included Entitlement Features */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] mb-3">
                Features & Quotas Enabled on this Entitlement:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {entitlement.featuresGranted.map((feat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2.5 text-xs text-[#101212] dark:text-white font-medium"
                  >
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available Plans Comparison Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white">
              Available Xentro Venture Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {initialStartupSubscriptionPlans.map((plan) => {
                const isCurrent = entitlement.planTier === plan.name;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                      plan.recommended
                        ? 'bg-gradient-to-b from-[#181B1A] to-[#121413] border-2 border-[#D9FF3F] shadow-lg shadow-[#D9FF3F]/5'
                        : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212] uppercase tracking-wider shadow-xs">
                        Most Popular for Seed Ventures
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-[#101212] dark:text-white font-display">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1 py-2 border-y border-gray-100 dark:border-[#262A29]">
                        <span className="text-3xl font-black text-[#101212] dark:text-white font-sora">
                          {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly}`}
                        </span>
                        {plan.priceMonthly > 0 && (
                          <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                            / month (₹{plan.priceAnnual}/yr)
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[#101212] dark:text-white">
                            <Check className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100 dark:border-[#262A29]">
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                          Current Active Plan
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePlanUpgradeDowngrade(plan)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                            plan.recommended
                              ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-md'
                              : 'bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 text-[#101212] dark:text-white'
                          }`}
                        >
                          Select {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}



      {/* 8. TAB 4: INVOICES & RECEIPTS (Section 33) */}
      {activeTab === 'invoices' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                GST Tax Invoices & Downloadable Receipts
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Official tax-compliant B2B invoices containing your registered GSTIN.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#262A29] text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    <th className="pb-3">Invoice Number</th>
                    <th className="pb-3">Issue Date</th>
                    <th className="pb-3">Billing Period</th>
                    <th className="pb-3">Plan / Description</th>
                    <th className="pb-3">Taxable Value</th>
                    <th className="pb-3">18% GST</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-[#101212] dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 text-[#565B59] dark:text-[#B6B8B7]">{inv.date}</td>
                      <td className="py-3.5 text-[#565B59] dark:text-[#B6B8B7]">{inv.billingPeriod}</td>
                      <td className="py-3.5 font-semibold text-[#101212] dark:text-white">{inv.planName}</td>
                      <td className="py-3.5 text-[#565B59] dark:text-[#B6B8B7]">₹{inv.subtotal.toLocaleString()}</td>
                      <td className="py-3.5 text-[#565B59] dark:text-[#B6B8B7]">₹{inv.taxGst.toLocaleString()}</td>
                      <td className="py-3.5 font-bold font-sora text-[#101212] dark:text-white">₹{inv.total.toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            showToast(`Invoice ${inv.invoiceNumber} downloaded with GST breakdown.`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 5: BILLING INFORMATION (Section 34) */}
      {activeTab === 'details' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                Legal Entity & GST Invoicing Details
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Used exclusively to populate tax invoices. Updating this does NOT alter your Public Startup Profile.
              </p>
            </div>

            <form onSubmit={handleSaveBillingDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Legal Registered Company Name
                  </label>
                  <input
                    type="text"
                    value={billingForm.legalBillingName}
                    onChange={(e) => setBillingForm({ ...billingForm, legalBillingName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Goods and Services Tax (GSTIN)
                  </label>
                  <input
                    type="text"
                    value={billingForm.gstin}
                    onChange={(e) => setBillingForm({ ...billingForm, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Registered Billing Address
                  </label>
                  <input
                    type="text"
                    value={billingForm.billingAddress}
                    onChange={(e) => setBillingForm({ ...billingForm, billingAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    City & State
                  </label>
                  <input
                    type="text"
                    value={`${billingForm.city}, ${billingForm.state}`}
                    onChange={(e) => {
                      const [city, state] = e.target.value.split(',');
                      setBillingForm({ ...billingForm, city: city?.trim() || '', state: state?.trim() || '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Postal Code & Country
                  </label>
                  <input
                    type="text"
                    value={`${billingForm.postalCode}, ${billingForm.country}`}
                    onChange={(e) => {
                      const [pin, ctry] = e.target.value.split(',');
                      setBillingForm({ ...billingForm, postalCode: pin?.trim() || '', country: ctry?.trim() || '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Accounts Billing Email
                  </label>
                  <input
                    type="email"
                    value={billingForm.billingEmail}
                    onChange={(e) => setBillingForm({ ...billingForm, billingEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Finance Contact Person
                  </label>
                  <input
                    type="text"
                    value={billingForm.financeContact}
                    onChange={(e) => setBillingForm({ ...billingForm, financeContact: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                    required
                  />
                </div>
              </div>

              {canManageBilling && (
                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Save Billing Information
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}



      {/* MODAL: VIEW INVOICE */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative">
            <button
              onClick={() => setViewingInvoice(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Tax Invoice — Paid
                </span>
                <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
                  {viewingInvoice.invoiceNumber}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Date:</span>
                <span className="text-xs font-bold text-[#101212] dark:text-white">{viewingInvoice.date}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Billed To:
                </span>
                <p className="font-bold text-[#101212] dark:text-white">{viewingInvoice.legalEntityName}</p>
                <p className="text-[#565B59] dark:text-[#B6B8B7] font-mono">GSTIN: {viewingInvoice.gstin}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">{viewingInvoice.planName}</span>
                  <span className="font-semibold text-[#101212] dark:text-white">₹{viewingInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#262A29]">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">CGST (9%) + SGST (9%)</span>
                  <span className="font-semibold text-[#101212] dark:text-white">₹{viewingInvoice.taxGst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold">
                  <span className="text-[#101212] dark:text-white">Total Paid</span>
                  <span className="font-sora text-[#101212] dark:text-[#D9FF3F]">₹{viewingInvoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Invoice ${viewingInvoice.invoiceNumber} PDF downloaded.`, 'success');
                  setViewingInvoice(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL SUBSCRIPTION CONFIRMATION (Section 30) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-display">
              Cancel Direct Subscription?
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              Your direct credit card renewal for {subscription.planName} will be cancelled.
            </p>

            {entitlement.source === 'ESP Endorsement' && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Your Pro Features are Protected:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Because your venture has an active endorsement from <strong>{entitlement.sponsoringEntityName}</strong>, your <strong>Startup Pro</strong> feature access will NOT be revoked and remains active through {entitlement.validUntil}.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
