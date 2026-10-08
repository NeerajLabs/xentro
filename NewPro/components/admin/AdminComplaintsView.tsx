'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  User,
  Mail,
  RefreshCw,
  Eye,
  X,
  MessageSquare,
  Send,
  Calendar,
  Check,
  Ban,
  FileText
} from 'lucide-react';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getAdminSession } from '@/lib/adminAuth';
import { logAdminAudit } from '@/lib/adminDomainService';

interface AdminComplaint {
  id: string;
  accountId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  resolutionComment?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export const AdminComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
    dismissed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Drawer / Detail modal
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [editingStatus, setEditingStatus] = useState<'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'>('PENDING');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const resp = await fetch(`${backendUrl}/admin/complaints/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        }
      });

      if (resp.ok) {
        const d = await resp.json();
        const data = d?.data || d;
        setComplaints(data.complaints || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.warn('Could not load admin complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleOpenDetail = (c: AdminComplaint) => {
    setSelectedComplaint(c);
    setEditingStatus(c.status);
    setAdminNotes(c.adminNotes || '');
    setResolutionComment(c.resolutionComment || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedComplaint) return;
    try {
      setSavingStatus(true);
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();

      const resp = await fetch(`${backendUrl}/admin/complaints/${selectedComplaint.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({
          status: editingStatus,
          adminNotes: adminNotes.trim(),
          resolutionComment: resolutionComment.trim(),
        })
      });

      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Complaint #${selectedComplaint.id} updated to ${editingStatus}.`);
        logAdminAudit(
          'COMPLAINT_STATUS_UPDATED',
          'SUPPORT_TICKET',
          selectedComplaint.id,
          `Status changed from ${selectedComplaint.status} to ${editingStatus}.`
        );
        setSelectedComplaint(null);
        loadComplaints();
      } else {
        showToast(data?.message || 'Failed to update complaint status.');
      }
    } catch {
      showToast('Network error while updating complaint status.');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#101212] text-white dark:bg-white dark:text-[#101212] text-xs font-bold shadow-floating flex items-center gap-2 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Mission Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            Support & Complaints Dispatch Centre
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            User Complaints & Support Inquiries
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1">
            Review user-submitted grievances, bugs, platform issues, and dispute investigations with authoritative status progression.
          </p>
        </div>

        <button
          onClick={loadComplaints}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'border-emerald-600 bg-emerald-50/20 dark:border-[#D9FF3F] dark:bg-[#D9FF3F]/10'
              : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]'
          }`}
        >
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">All Submissions</span>
          <span className="text-2xl font-bold font-mono text-[#101212] dark:text-white mt-1 block">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 bg-amber-50/20 dark:border-amber-500 dark:bg-amber-500/10'
              : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 block">Pending Review</span>
          <span className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-400 mt-1 block">
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'IN_REVIEW'
              ? 'border-blue-500 bg-blue-50/20 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]'
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block">In Investigation</span>
          <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1 block">
            {counts.inReview}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'RESOLVED'
              ? 'border-emerald-600 bg-emerald-50/20 dark:border-emerald-500 dark:bg-emerald-500/10'
              : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 block">Resolved</span>
          <span className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-400 mt-1 block">
            {counts.resolved}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('DISMISSED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'DISMISSED'
              ? 'border-gray-500 bg-gray-50/20 dark:border-gray-500 dark:bg-gray-500/10'
              : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]'
          }`}
        >
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">Dismissed</span>
          <span className="text-2xl font-bold font-mono text-[#565B59] dark:text-[#A0A4A2] mt-1 block">
            {counts.dismissed}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticket ID, submitter name, account ID, email, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#565B59] dark:text-[#A0A4A2]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#1C201F]/50 text-[#565B59] dark:text-[#A0A4A2] font-semibold">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Submitting User</th>
                <th className="py-3 px-4">Subject & Message</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#8E9290]">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#8E9290]/40" />
                    <p className="font-semibold text-[#101212] dark:text-white">No complaints found</p>
                    <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                      No tickets match the selected filter or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-[#D9FF3F] whitespace-nowrap">
                      #{c.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-[#101212] dark:text-white block">
                          {c.userName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#A0A4A2] font-mono mt-0.5">
                          <span>{c.accountId}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{c.userRole}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-[#101212] dark:text-white truncate">
                        {c.subject}
                      </p>
                      <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] line-clamp-1 mt-0.5">
                        {c.message}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                        {c.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'URGENT'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : c.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                          : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                      }`}>
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                          : c.status === 'IN_REVIEW'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                          : c.status === 'DISMISSED'
                          ? 'bg-gray-500/15 text-gray-700 dark:text-gray-400'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-[#D9FF3F] hover:text-[#101212] dark:hover:bg-[#D9FF3F] dark:hover:text-[#101212] text-xs font-semibold text-[#101212] dark:text-white transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Detail & Status Update Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-floating overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#1C201F]/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-800 dark:text-[#D9FF3F]">
                  #{selectedComplaint.id}
                </span>
                <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">&bull;</span>
                <span className="text-xs font-bold text-[#101212] dark:text-white">
                  {selectedComplaint.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submitter Identity Card */}
            <div className="px-6 py-3 bg-gray-100/50 dark:bg-[#1F2422] border-b border-[#E5E7EB] dark:border-[#262A29] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block">Submitter</span>
                <span className="font-semibold text-[#101212] dark:text-white">{selectedComplaint.userName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block">Account ID</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-[#D9FF3F]">{selectedComplaint.accountId}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block">Email</span>
                <span className="truncate block">{selectedComplaint.userEmail || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block">Submitted</span>
                <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white font-sora">
                  {selectedComplaint.subject}
                </h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block mb-1">
                  Full Grievance / Request Message
                </label>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.message}
                </div>
              </div>

              {/* Status Update Form */}
              <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Update Complaint Status
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditingStatus(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editingStatus === s
                          ? s === 'RESOLVED'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : s === 'IN_REVIEW'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : s === 'DISMISSED'
                            ? 'bg-gray-600 text-white border-gray-700'
                            : 'bg-amber-500 text-white border-amber-600'
                          : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#A0A4A2]'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Resolution Comment (Visible to User)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Issue resolved in v0.912 release; account flags cleared."
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Internal Admin Investigation Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Notes for platform audit records (internal only)..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#1C201F]/50">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingStatus}
                onClick={handleSaveStatus}
                className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {savingStatus ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Update Complaint Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
