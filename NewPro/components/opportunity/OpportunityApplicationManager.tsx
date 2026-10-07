'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ChevronDown,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  Opportunity,
  OpportunityApplicant,
  ApplicantStatus,
} from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { useToast } from '@/components/ui/Toast';

interface OpportunityApplicationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  adminMode?: boolean;
}

const APPLICANT_STATUS_OPTIONS: ApplicantStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Selected',
  'Waitlisted',
  'Rejected',
  'Withdrawn',
];

const STATUS_COLORS: Record<ApplicantStatus, { bg: string; text: string; border: string }> = {
  Applied: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  'Under Review': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  Shortlisted: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
  Interview: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
  },
  Selected: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  Waitlisted: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
  },
  Rejected: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  Withdrawn: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  },
};

export const OpportunityApplicationManager: React.FC<OpportunityApplicationManagerProps> = ({
  isOpen,
  onClose,
  opportunity,
  adminMode = false,
}) => {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<OpportunityApplicant[]>([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<OpportunityApplicant | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Load applicants
  const loadApplicants = () => {
    if (!opportunity) return;
    const list = opportunityService.getApplicants(opportunity.id);
    setApplicants(list);
  };

  useEffect(() => {
    if (isOpen && opportunity) {
      loadApplicants();
    }
  }, [isOpen, opportunity]);

  // Listen for external updates
  useEffect(() => {
    const handleUpdate = () => {
      if (opportunity) loadApplicants();
    };
    window.addEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    };
  }, [opportunity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Status Metrics
  const metrics = useMemo(() => {
    const total = applicants.length;
    const applied = applicants.filter((a) => a.status === 'Applied').length;
    const underReview = applicants.filter((a) => a.status === 'Under Review').length;
    const shortlisted = applicants.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview').length;
    const selected = applicants.filter((a) => a.status === 'Selected').length;
    const rejected = applicants.filter((a) => a.status === 'Rejected').length;

    return { total, applied, underReview, shortlisted, selected, rejected };
  }, [applicants]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchStatus =
        selectedStatusTab === 'all' ||
        app.status.toLowerCase() === selectedStatusTab.toLowerCase();
      if (!matchStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        app.applicantName.toLowerCase().includes(q) ||
        (app.organizationName && app.organizationName.toLowerCase().includes(q)) ||
        app.email.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q)) ||
        app.applicantType.toLowerCase().includes(q)
      );
    });
  }, [applicants, selectedStatusTab, searchQuery]);

  if (!isOpen || !opportunity) return null;

  const handleStatusChange = (applicantId: string, newStatus: ApplicantStatus) => {
    const updated = opportunityService.updateApplicantStatus(
      applicantId,
      newStatus,
      undefined,
      adminMode ? 'Xentro Admin' : 'Opportunity Manager'
    );
    if (updated) {
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a))
      );
      if (selectedApplicant && selectedApplicant.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
      showToast(`Applicant status updated to: ${newStatus}`, 'success');
    }
  };

  const handleSaveNotes = (applicantId: string) => {
    const updated = opportunityService.updateApplicantStatus(
      applicantId,
      (applicants.find((a) => a.id === applicantId)?.status as ApplicantStatus) || 'Applied',
      tempNotes,
      adminMode ? 'Xentro Admin' : 'Opportunity Reviewer'
    );
    if (updated) {
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, notes: tempNotes } : a))
      );
      if (selectedApplicant && selectedApplicant.id === applicantId) {
        setSelectedApplicant({ ...selectedApplicant, notes: tempNotes });
      }
      setEditingNotesId(null);
      showToast('Reviewer notes saved successfully', 'success');
    }
  };

  const exportCSV = () => {
    if (applicants.length === 0) {
      showToast('No applicants to export', 'info');
      return;
    }
    const headers = ['Applicant Name', 'Type', 'Organization', 'Email', 'Phone', 'Location', 'Date', 'Status', 'Notes'];
    const rows = applicants.map((a) => [
      `"${a.applicantName}"`,
      `"${a.applicantType}"`,
      `"${a.organizationName || ''}"`,
      `"${a.email}"`,
      `"${a.phone || ''}"`,
      `"${a.location || ''}"`,
      `"${a.applicationDate}"`,
      `"${a.status}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${opportunity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Applicant export CSV downloaded', 'success');
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative m-auto bg-white dark:bg-[#181B1A] w-full max-w-6xl rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] h-[90vh] max-h-[850px] flex flex-col overflow-hidden animate-fade-slide">
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-[#202422]/50">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                Application Review Desk
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {opportunity.category}
              </span>
              {adminMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Super Control
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sora text-[#101212] dark:text-white">
              {opportunity.title}
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#8E9390] mt-0.5">
              Reviewing candidacies, evaluating pitches, and updating selection pipelines for this program.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#6E7370] dark:text-[#8E9390]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#6E7370] dark:text-[#8E9390] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="shrink-0 p-4 sm:px-6 bg-white dark:bg-[#181B1A] border-b border-[#E5E7EB] dark:border-[#262A29] grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
              Total
            </p>
            <p className="text-lg font-black text-[#101212] dark:text-white mt-0.5 font-mono">
              {metrics.total}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Applied
            </p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
              {metrics.applied}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Under Review
            </p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
              {metrics.underReview}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Shortlisted / Intv
            </p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
              {metrics.shortlisted}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Selected
            </p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {metrics.selected}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Rejected
            </p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
              {metrics.rejected}
            </p>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="shrink-0 p-4 sm:px-6 bg-gray-50/50 dark:bg-[#181B1A]/80 border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusTab === 'all'
                  ? 'bg-[#101212] dark:bg-white text-white dark:text-[#101212] font-bold'
                  : 'bg-white dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white border border-gray-200 dark:border-[#262A29]'
              }`}
            >
              All Applicants ({applicants.length})
            </button>
            {APPLICANT_STATUS_OPTIONS.map((st) => {
              const count = applicants.filter((a) => a.status === st).length;
              const isSelected = selectedStatusTab === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatusTab(st)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-xs'
                      : 'bg-white dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white border border-gray-200 dark:border-[#262A29]'
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-black/15 text-black' : 'bg-gray-100 dark:bg-[#262A29]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or venture..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden"
            />
          </div>
        </div>

        {/* Content Split: List & Detail Drawer */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-[#262A29]">
          {/* Main List Table (7 cols on lg) */}
          <div
            className={`p-4 sm:p-6 overflow-y-auto space-y-3 ${
              selectedApplicant ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#8E9390] flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                  No applicants found
                </h4>
                <p className="text-xs text-[#6E7370] dark:text-[#8E9390] max-w-xs mx-auto">
                  {searchQuery || selectedStatusTab !== 'all'
                    ? 'No candidates match your current search query or active status filter.'
                    : 'Applications submitted to this opportunity will appear here in real-time.'}
                </p>
              </div>
            ) : (
              filteredApplicants.map((app) => {
                const colorConfig = STATUS_COLORS[app.status] || STATUS_COLORS['Applied'];
                const isSelectedRow = selectedApplicant?.id === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplicant(app)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelectedRow
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/5 shadow-sm'
                        : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {/* Left: Candidate Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D9FF3F] to-emerald-400 text-[#101212] font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs shadow-xs">
                        {app.applicantAvatar ? (
                          <img
                            src={app.applicantAvatar}
                            alt={app.applicantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          app.applicantName.charAt(0)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-[#101212] dark:text-white truncate">
                            {app.applicantName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390]">
                            {app.applicantType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#6E7370] dark:text-[#8E9390] mt-1 flex-wrap">
                          {app.organizationName && (
                            <span className="flex items-center gap-1 font-medium text-[#101212] dark:text-white">
                              <Building2 className="w-3 h-3 text-[#8E9390]" />
                              {app.organizationName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#8E9390]" />
                            {app.email}
                          </span>
                          {app.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#8E9390]" />
                              {app.location}
                            </span>
                          )}
                        </div>

                        {app.proposalPitch && (
                          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-1 mt-1.5 italic">
                            "{app.proposalPitch}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div
                      className="flex items-center gap-2.5 sm:self-center shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as ApplicantStatus)
                        }
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border outline-hidden transition-all cursor-pointer ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                      >
                        {APPLICANT_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st} className="bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white">
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setSelectedApplicant(app)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202422] text-[#8E9390] hover:text-[#101212] dark:hover:text-white transition-colors"
                        title="View Dossier"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dossier Detail Panel (5 cols on lg) */}
          {selectedApplicant && (
            <div className="lg:col-span-5 p-5 sm:p-6 bg-gray-50/50 dark:bg-[#202422]/30 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
                <h3 className="font-bold text-sm text-[#101212] dark:text-white font-heading">
                  Applicant Dossier
                </h3>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#8E9390]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Applicant Card Summary */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D9FF3F] to-emerald-400 text-[#101212] font-black flex items-center justify-center shrink-0 overflow-hidden text-sm">
                    {selectedApplicant.applicantAvatar ? (
                      <img
                        src={selectedApplicant.applicantAvatar}
                        alt={selectedApplicant.applicantName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedApplicant.applicantName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                      {selectedApplicant.applicantName}
                    </h4>
                    <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                      {selectedApplicant.organizationName || selectedApplicant.applicantType}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div>
                    <span className="text-[#8E9390] block">Email</span>
                    <span className="font-medium text-[#101212] dark:text-white truncate block">
                      {selectedApplicant.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E9390] block">Phone</span>
                    <span className="font-medium text-[#101212] dark:text-white block">
                      {selectedApplicant.phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E9390] block">Applied Date</span>
                    <span className="font-medium text-[#101212] dark:text-white block">
                      {selectedApplicant.applicationDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E9390] block">Location</span>
                    <span className="font-medium text-[#101212] dark:text-white block">
                      {selectedApplicant.location || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                  Application Stage
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {APPLICANT_STATUS_OPTIONS.map((st) => {
                    const isCurrent = selectedApplicant.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedApplicant.id, st)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                          isCurrent
                            ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                            : 'border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
                        }`}
                      >
                        <span>{st}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#D9FF3F]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proposal Statement */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                  Pitch & Proposal
                </label>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedApplicant.proposalPitch || 'No custom proposal entered with this application.'}
                </div>
              </div>

              {/* Submitted Documents */}
              {selectedApplicant.submittedDocuments && selectedApplicant.submittedDocuments.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                    Verified Documents
                  </label>
                  <div className="space-y-1.5">
                    {selectedApplicant.submittedDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-2 truncate text-[#101212] dark:text-white font-medium">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{doc}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 shrink-0">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                    Internal Committee Notes
                  </label>
                  {editingNotesId !== selectedApplicant.id && (
                    <button
                      onClick={() => {
                        setEditingNotesId(selectedApplicant.id);
                        setTempNotes(selectedApplicant.notes || '');
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedApplicant.notes ? 'Edit Notes' : '+ Add Notes'}
                    </button>
                  )}
                </div>

                {editingNotesId === selectedApplicant.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Add confidential evaluation criteria notes, next steps, or interview feedback..."
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#D9FF3F] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] outline-hidden resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8E9390] hover:bg-gray-200 dark:hover:bg-[#202422]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNotes(selectedApplicant.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D9FF3F] text-[#101212]"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#6E7370] dark:text-[#8E9390] italic">
                    {selectedApplicant.notes || 'No review comments logged yet.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
