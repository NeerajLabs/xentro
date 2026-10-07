'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { logAuditEvent } from '@/lib/espDomainService';
import {
  mockESPBillingOverview,
  mockESPSubscriptionDetails,
  mockESPInvoices,
  mockESPPayments,
  mockESPPaymentMethods,
  mockESPBillingDetails,
} from '@/data/espWorkspaceData';
import { getUserProfile } from '@/lib/userProfile';

export const ESPBillingManager: React.FC = () => {
  const { showToast } = useToast();
  const user = typeof window !== 'undefined' ? getUserProfile() : null;
  const actorName = user?.name || 'Administrator';
  const actorRole = user?.roleTitle || 'Finance / Billing';

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'subscription' | 'invoices' | 'payments' | 'methods' | 'details'
  >('overview');

  const [invoices] = useState(mockESPInvoices);
  const [payments, setPayments] = useState(mockESPPayments);
  const [methods, setMethods] = useState(mockESPPaymentMethods);
  const [billingDetails, setBillingDetails] = useState(mockESPBillingDetails);
  const [subscription, setSubscription] = useState(mockESPSubscriptionDetails);

  // Modals state
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(true);

  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [editForm, setEditForm] = useState(billingDetails);

  const handleDownloadInvoice = (invoiceNumber: string) => {
    logAuditEvent(
      'Invoice Downloaded',
      'Billing',
      actorName,
      actorRole,
      `Downloaded official tax invoice ${invoiceNumber} (GST credit receipt)`
    );
    showToast(`Downloading tax invoice PDF for ${invoiceNumber}...`, 'success');
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber) return;

    const last4 = newCardNumber.slice(-4) || '9988';
    const newMethod = {
      id: `pm_${Date.now()}`,
      type: 'card' as const,
      brand: 'Visa',
      last4,
      expiryMonth: 12,
      expiryYear: 2028,
      isDefault: false,
    };

    setMethods([...methods, newMethod]);
    setIsAddCardOpen(false);
    setNewCardNumber('');
    setNewCardExpiry('');

    // Never log raw numbers or CVV!
    logAuditEvent(
      'Payment Method Added',
      'Billing',
      actorName,
      actorRole,
      `Added payment method token reference (Visa ending in •••• ${last4})`
    );
    showToast(`Added card ending in •••• ${last4}!`, 'success');
  };

  const handleRemovePaymentMethod = (id: string, last4?: string) => {
    setMethods(methods.filter((m) => m.id !== id));
    logAuditEvent(
      'Payment Method Removed',
      'Billing',
      actorName,
      actorRole,
      `Removed payment method reference (•••• ${last4 || '4242'})`
    );
    showToast('Payment method removed.', 'info');
  };

  const handleSetDefaultMethod = (id: string) => {
    setMethods(
      methods.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
    logAuditEvent(
      'Payment Method Updated',
      'Billing',
      actorName,
      actorRole,
      `Changed primary billing mandate to method ID ${id}`
    );
    showToast('Default payment method updated.', 'success');
  };

  const handleInitiateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForRefund) return;

    logAuditEvent(
      'Refund Initiated',
      'Billing',
      actorName,
      actorRole,
      `Initiated refund request for transaction ${selectedTxForRefund.referenceNumber} (${selectedTxForRefund.amount}). Reason: ${refundReason}`
    );

    setPayments(
      payments.map((p) =>
        p.id === selectedTxForRefund.id ? { ...p, status: 'Refunded' as any } : p
      )
    );

    setIsRefundModalOpen(false);
    showToast(`Refund request initiated for ${selectedTxForRefund.amount}. Audit record logged.`, 'success');
  };

  const handleToggleRenewal = () => {
    const nextState = !autoRenewEnabled;
    setAutoRenewEnabled(nextState);
    setIsRenewalModalOpen(false);

    logAuditEvent(
      'Renewal Changed',
      'Billing',
      actorName,
      actorRole,
      `Automatic renewal setting changed to: ${nextState ? 'Enabled' : 'Disabled (Expires at period end)'}`
    );
    showToast(`Renewal preference updated: ${nextState ? 'Auto-Renew Active' : 'Auto-Renew Off'}`, 'info');
  };

  const handleCancelSubscription = () => {
    setSubscription({
      ...subscription,
      status: 'Cancelled',
    });
    setIsCancelModalOpen(false);

    logAuditEvent(
      'Subscription Cancelled',
      'Billing',
      actorName,
      actorRole,
      `Institutional subscription cancellation scheduled for end of active cycle.`
    );
    showToast('Subscription cancellation scheduled. Audit record created.', 'info');
  };

  const handleSaveBillingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setBillingDetails(editForm);
    setIsEditDetailsOpen(false);

    logAuditEvent(
      'Billing Details Updated',
      'Billing',
      actorName,
      actorRole,
      `Updated institutional GSTIN (${editForm.gstin}), PAN, and registered billing address.`
    );
    showToast('Billing details & tax identification updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Security Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Billing & Payments
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              PCI-DSS Secure
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Institutional subscription, invoices with GST credit, masked payment credentials, and finance contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Payment Data Masked</span>
        </div>
      </div>

      {/* 1. Subnav Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Billing Overview' },
          { id: 'subscription', label: 'Subscription Plan' },
          { id: 'invoices', label: `Invoices (${invoices.length})` },
          { id: 'payments', label: `Payment History (${payments.length})` },
          { id: 'methods', label: 'Payment Methods' },
          { id: 'details', label: 'Tax & Entity Details' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Sub-Tab: Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Plan Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">Current Plan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  Active
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  {mockESPBillingOverview.currentPlan}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {mockESPBillingOverview.billingCycle} &bull; Next renewal {mockESPBillingOverview.renewalDate}
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('subscription')}
                className="text-xs font-bold text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer pt-2"
              >
                <span>Change Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quota Usage */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Endorsement Quota Allocation
              </span>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                    {mockESPBillingOverview.activeEndorsementsCount} / {mockESPBillingOverview.maxEndorsementsLimit}
                  </span>
                  <span className="text-xs font-semibold text-emerald-500">
                    {mockESPBillingOverview.remainingEndorsements} remaining
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#202422] h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#D9FF3F] h-full rounded-full"
                    style={{
                      width: `${(((mockESPBillingOverview.activeEndorsementsCount ?? 18) / (mockESPBillingOverview.maxEndorsementsLimit ?? 25))) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Startup Pro benefits grantable per billing cycle
              </p>
            </div>

            {/* Default Payment Method Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">Primary Card</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202422] flex items-center justify-center font-bold text-xs text-[#101212] dark:text-white">
                  VISA
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-[#101212] dark:text-white">
                    •••• •••• •••• 4242
                  </h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Expires 08/27 &bull; Auto-debit enabled
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('methods')}
                className="text-xs font-bold text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer pt-2"
              >
                <span>Manage Payment Methods</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Invoices Quick Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                Recent Invoices & GST Receipts
              </h3>
              <button
                onClick={() => setActiveSubTab('invoices')}
                className="text-xs font-bold text-[#D9FF3F] hover:underline cursor-pointer"
              >
                View All Invoices
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#101212] dark:text-white">{inv.invoiceNumber}</span>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{inv.period}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#101212] dark:text-white">{inv.amount}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {inv.status}
                    </span>
                    <button
                      onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Sub-Tab: Subscription Plan */}
      {activeSubTab === 'subscription' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                Current Active Subscription
              </span>
              <h3 className="text-2xl font-black font-sora text-[#101212] dark:text-white mt-1">
                {mockESPSubscriptionDetails.planName}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                {mockESPSubscriptionDetails.billingCycle} &bull; Next billing date {mockESPSubscriptionDetails.nextBillingDate}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-sora text-[#101212] dark:text-white">
                {mockESPSubscriptionDetails.price}
              </span>
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] block">billed annually</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
              Included Enterprise Entitlements:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(mockESPSubscriptionDetails.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#101212] dark:text-gray-200">
                  <Check className="w-4 h-4 text-[#D9FF3F] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#262A29] flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRenewalModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shadow-subtle"
              >
                Renewal Settings
              </button>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Subscription
              </button>
            </div>
            <button
              onClick={() => showToast('Opening enterprise tier inquiry...', 'info')}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold cursor-pointer"
            >
              Talk to Institutional Enterprise Specialist
            </button>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab: Invoices */}
      {activeSubTab === 'invoices' && (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
              Tax Invoices & GST Receipts
            </h3>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              All payments include 18% IGST credit invoice
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">{inv.period}</td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">{inv.issuedDate}</td>
                    <td className="py-3.5 px-4 font-bold">{inv.amount}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                        className="px-3 py-1 rounded-lg border border-gray-200 dark:border-[#262A29] text-[11px] font-bold hover:border-[#D9FF3F] text-[#101212] dark:text-white transition-all cursor-pointer inline-flex items-center gap-1"
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
      )}

      {/* 5. Sub-Tab: Payments */}
      {activeSubTab === 'payments' && (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
              Transaction Settlement Log
            </h3>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Tokenized settlement references & receipts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Settlement Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold">{p.referenceNumber}</td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">{p.date}</td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">{p.method}</td>
                    <td className="py-3.5 px-4 font-bold">{p.amount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Successful'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Successful' ? (
                        <button
                          onClick={() => {
                            setSelectedTxForRefund(p);
                            setIsRefundModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-amber-400 text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          Request Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] italic">Refund Processing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Sub-Tab: Payment Methods */}
      {activeSubTab === 'methods' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                Configured Payment Methods
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Used for automated recurring billing of institutional subscription
              </p>
            </div>
            <button
              onClick={() => setIsAddCardOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Payment Method</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {methods.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-center justify-center font-bold text-xs text-[#101212] dark:text-white">
                    {m.brand}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-[#101212] dark:text-white">
                      •••• •••• •••• {m.last4}
                    </h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Expires {m.expiryMonth}/{m.expiryYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {m.isDefault ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                      Default
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSetDefaultMethod(m.id)}
                        className="text-xs font-bold text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
                      >
                        Set Default
                      </button>
                      <button
                        onClick={() => handleRemovePaymentMethod(m.id, m.last4)}
                        className="p-1 rounded-lg text-[#565B59] hover:text-rose-500 cursor-pointer"
                        title="Remove method"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Sub-Tab: Billing Details */}
      {activeSubTab === 'details' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D9FF3F]" />
              <span>Taxation & Registered Entity Details</span>
            </h3>
            <button
              onClick={() => {
                setEditForm(billingDetails);
                setIsEditDetailsOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shadow-subtle"
            >
              Edit Details
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Legal Entity Name
              </span>
              <p className="font-bold text-[#101212] dark:text-white">{billingDetails.legalEntityName}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Goods & Services Tax Identification (GSTIN)
              </span>
              <p className="font-bold font-mono text-[#D9FF3F]">{billingDetails.gstin}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Permanent Account Number (PAN)
              </span>
              <p className="font-bold font-mono text-[#101212] dark:text-white">{billingDetails.panNumber}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Accounts & Finance Email
              </span>
              <p className="font-bold text-[#101212] dark:text-white">{billingDetails.financeEmail}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Registered Billing Address
              </span>
              <p className="font-medium text-[#101212] dark:text-white">
                {billingDetails.address}, {billingDetails.city}, {billingDetails.state} {billingDetails.postalCode}, {billingDetails.country}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Payment Method */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Add Payment Method
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Masked tokenization via PCI-compliant gateway
                </p>
              </div>
              <button
                onClick={() => setIsAddCardOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4111 2222 3333 4444"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={newCardExpiry}
                    onChange={(e) => setNewCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Initiate Refund */}
      {isRefundModalOpen && selectedTxForRefund && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Initiate Refund Request
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Transaction: {selectedTxForRefund.referenceNumber}
                </p>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateRefund} className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">Refundable Amount</span>
                <span className="text-lg font-bold font-sora text-[#101212] dark:text-white">{selectedTxForRefund.amount}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Reason for Refund</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renewal Settings */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Automatic Renewal Settings
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Control annual contract auto-extension
                </p>
              </div>
              <button
                onClick={() => setIsRenewalModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#101212] dark:text-white">Auto-Renewal Active</h4>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Renews annually on Oct 01, 2026
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRenewEnabled}
                onChange={() => setAutoRenewEnabled(!autoRenewEnabled)}
                className="w-4 h-4 accent-[#D9FF3F] cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleRenewal}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Subscription */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 font-heading">
                  Cancel Institutional Plan
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Action requires Primary Admin authorization
                </p>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              Are you sure you want to cancel the institutional subscription? Your active cohort endorsements and incubator verification will remain valid until the end of the current billing cycle.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Tax Details */}
      {isEditDetailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Edit Taxation & Entity Details
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Used for GST compliance invoices and government audit filing
                </p>
              </div>
              <button
                onClick={() => setIsEditDetailsOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBillingDetails} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#101212] dark:text-white">Legal Entity Name</label>
                <input
                  type="text"
                  required
                  value={editForm.legalEntityName}
                  onChange={(e) => setEditForm({ ...editForm, legalEntityName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#101212] dark:text-white">GSTIN</label>
                  <input
                    type="text"
                    required
                    value={editForm.gstin}
                    onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#101212] dark:text-white">PAN</label>
                  <input
                    type="text"
                    required
                    value={editForm.panNumber}
                    onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#101212] dark:text-white">Finance Contact Email</label>
                <input
                  type="email"
                  required
                  value={editForm.financeEmail}
                  onChange={(e) => setEditForm({ ...editForm, financeEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#101212] dark:text-white">Registered Address</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditDetailsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Save Tax Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
