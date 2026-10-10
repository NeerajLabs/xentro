'use client';

import React, { useState } from 'react';
import { MOCK_VERIFICATION_REQUESTS } from '@/data/adminData';
import { VerificationRequest } from '@/types/admin';
import { getAdminSession, hasAdminPermission } from '@/lib/adminAuth';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Send,
  UserCheck,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Lock,
  Layers,
} from 'lucide-react';

export const AdminVerificationView: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [queueFilter, setQueueFilter] = useState<string>('All Queues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ name: string; type: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const resp = await fetch('/api/admin/verification');
      if (resp.ok) {
        const d = await resp.json();
        const live = d?.data?.requests || [];
        setRequests(live);
      }
    } catch (err) {
      console.warn('Failed to fetch verification requests from DB:', err);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const session = getAdminSession();
  const canReviewIdentity = hasAdminPermission(session, 'identity_verification.review');

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'pending' && !(r.status === 'Pending' || r.status === 'Under Review')) return false;
    if (activeTab === 'reviewed' && (r.status === 'Pending' || r.status === 'Under Review')) return false;

    if (queueFilter !== 'All Queues' && r.userType !== queueFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.organization?.toLowerCase().includes(q) ||
        r.userType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (
    reqId: string,
    newStatus: VerificationRequest['status'],
    customNote?: string
  ) => {
    const action = newStatus === 'Verified' ? 'APPROVE' : 'REJECT';
    try {
      const resp = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reqId,
          action,
          notes: customNote || reviewNote,
          reviewerName: session?.name || 'Super Admin',
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(data.message || `Verification marked as ${newStatus}`);
        loadRequests();
        if (selectedReq && selectedReq.id === reqId) {
          setSelectedReq(null);
        }
      } else {
        showToast(data?.message || 'Failed to update verification status.');
      }
    } catch {
      showToast('Network error while updating verification status.');
    }
    setReviewNote('');
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'High':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-[#101212] dark:bg-[#202422] text-[#D9FF3F] text-xs font-bold border border-[#D9FF3F]/30 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trust & Compliance Engine</span>
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            Verification & Accreditation Dossiers
          </h2>
          <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1">
            Review submitted government incorporation papers, institutional accreditations, and investor financial disclosures before issuing verified status.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center min-w-[100px]">
            <span className="text-[10px] font-mono uppercase text-[#6E7370] dark:text-[#8E9390] block">
              In Review
            </span>
            <span className="text-xl font-bold font-sora text-amber-500">
              {requests.filter((r) => r.status === 'Pending' || r.status === 'Under Review').length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center min-w-[100px]">
            <span className="text-[10px] font-mono uppercase text-[#6E7370] dark:text-[#8E9390] block">
              Needs Info
            </span>
            <span className="text-xl font-bold font-sora text-orange-500">
              {requests.filter((r) => r.status === 'Needs Information').length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center min-w-[100px]">
            <span className="text-[10px] font-mono uppercase text-[#6E7370] dark:text-[#8E9390] block">
              Rejected
            </span>
            <span className="text-xl font-bold font-sora text-rose-500">
              {requests.filter((r) => r.status === 'Rejected').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Pending Review Queue
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'reviewed'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Resolved & History
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            All Dossiers ({requests.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-1 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" /> Queue:
            </span>
            <select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
            >
              <option value="All Queues">All 8 Queues</option>
              <option value="Personal Identity">Personal Identity (Restricted)</option>
              <option value="Startup">Startup Entities</option>
              <option value="Mentor">Mentor Credentials</option>
              <option value="Investor">Individual Investor</option>
              <option value="Investor Organization">Investor Organizations</option>
              <option value="ESP">ESP Institutions</option>
              <option value="Domain Verification">Domain Verification</option>
              <option value="Authorized Representative">Authorized Representative</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant or org..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Review Layout: Queue List & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Queue List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#6E7370] dark:text-[#8E9390]">
              No dossiers match the current queue view.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isSelected = selectedReq?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-[#202422] border-[#D9FF3F] shadow-md'
                      : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#101212] dark:text-white">
                          {req.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-black/5 dark:bg-[#262A29] text-[#6E7370] dark:text-gray-300">
                          {req.userType}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-0.5 truncate">
                        {req.organization}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getRiskBadge(
                        req.riskLevel
                      )}`}
                    >
                      {req.riskLevel} Risk
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#6E7370] dark:text-[#8E9390] pt-2 border-t border-gray-100 dark:border-[#262A29]">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{req.submittedDocuments.length} files</span>
                    </span>

                    <span className="font-mono">{req.submissionDate}</span>

                    <span
                      className={`font-semibold ${
                        req.status === 'Verified'
                          ? 'text-emerald-500'
                          : req.status === 'Rejected'
                          ? 'text-rose-500'
                          : req.status === 'Needs Information'
                          ? 'text-orange-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inspection & Action Console (7 cols) */}
        <div className="lg:col-span-7">
          {selectedReq ? (
            <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-6 shadow-xs">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6E7370] dark:text-[#8E9390]">
                      Dossier #{selectedReq.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getRiskBadge(
                        selectedReq.riskLevel
                      )}`}
                    >
                      {selectedReq.riskLevel} Risk Assessment
                    </span>
                  </div>
                  <h3 className="font-sora text-xl font-bold text-[#101212] dark:text-white mt-1">
                    {selectedReq.name}
                  </h3>
                  <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                    {selectedReq.organization} &bull; Category: {selectedReq.userType}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#6E7370] dark:text-[#8E9390] block">
                    Submission Date
                  </span>
                  <span className="text-xs font-bold font-mono text-[#101212] dark:text-white">
                    {selectedReq.submissionDate}
                  </span>
                </div>
              </div>

              {/* Submitted Documentation Vault */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390] flex items-center justify-between">
                  <span>Attached Compliance Documents</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    {selectedReq.submittedDocuments.length} Verified Files
                  </span>
                </h4>

                <div className="space-y-2">
                  {selectedReq.submittedDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between group hover:border-[#D9FF3F] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                            {doc.type} &bull; {doc.size} &bull; Uploaded {doc.date}
                          </p>
                        </div>
                      </div>

                      {doc.type.includes('Identity') && !canReviewIdentity ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Shielded Proof</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 text-xs font-medium text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Identity Security Notice */}
                {!canReviewIdentity && (
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Restricted Identity Security Protocol (Section 5)</span>
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                      Explicit &apos;identity_verification.review&apos; administrative privilege is required to access sensitive government identity proofs and biometric tokens. Standard administrators are granted safe verification state overviews only.
                    </p>
                  </div>
                )}
              </div>

              {/* Historical Notes & Internal Audit */}
              {selectedReq.notes && selectedReq.notes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Review Audit Trail
                  </h4>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                    {selectedReq.notes.map((n, i) => (
                      <p key={i} className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                        {n}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Action Console */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Verification Determination
                </h4>

                <div>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter mandatory review note or justification for audit trail..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Verified', reviewNote)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Needs Information', reviewNote)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Details</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'Rejected', reviewNote)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Filing</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-[#6E7370] dark:text-[#8E9390] mb-3 stroke-[1.5]" />
              <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                Select a Verification Dossier
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390] max-w-sm mt-1">
                Choose any pending application from the left queue to inspect attached government credentials and render an approval verdict.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mock Document Inspection Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-sora text-sm font-bold text-[#101212] dark:text-white">
                    {previewDoc.name}
                  </h4>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Document Type: {previewDoc.type} &bull; Cryptographically Hashed (SHA-256)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Document Viewer Canvas */}
            <div className="p-8 rounded-xl bg-gray-100 dark:bg-[#121413] border border-dashed border-gray-300 dark:border-[#383E3B] text-center space-y-4 min-h-[260px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#202422] flex items-center justify-center shadow-md">
                <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-[#D9FF3F]" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#101212] dark:text-white">
                  Government Registry & Verification Preview
                </h5>
                <p className="text-xs text-[#6E7370] dark:text-[#8E9390] max-w-md mx-auto mt-1">
                  Document ID: SEC-DOC-{Math.random().toString(36).substring(2, 9).toUpperCase()} has been authenticated against state Ministry filings.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                Digital Signature Verified
              </span>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white hover:bg-gray-200 dark:hover:bg-[#262A29]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
