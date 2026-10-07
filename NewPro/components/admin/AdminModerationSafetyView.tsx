'use client';

import React, { useState } from 'react';
import {
  MOCK_FEED_ITEMS,
  MOCK_SAFETY_REPORTS,
  MOCK_SUPPORT_TICKETS,
} from '@/data/adminData';
import {
  FeedModerationItem,
  SafetyReportItem,
  SupportTicketItem,
} from '@/types/admin';
import {
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  LifeBuoy,
  CheckCircle2,
  Trash2,
  EyeOff,
  UserX,
  Search,
  Clock,
  Send,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

export const AdminModerationSafetyView: React.FC = () => {
  const [subTab, setSubTab] = useState<'safety' | 'feed' | 'support'>('safety');
  const [safetyReports, setSafetyReports] = useState<SafetyReportItem[]>(MOCK_SAFETY_REPORTS);
  const [feedItems, setFeedItems] = useState<FeedModerationItem[]>(MOCK_FEED_ITEMS);
  const [supportTickets, setSupportTickets] = useState<SupportTicketItem[]>(MOCK_SUPPORT_TICKETS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected item modal/drawer for safety
  const [selectedReport, setSelectedReport] = useState<SafetyReportItem | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Feed Actions
  const handleFeedAction = (id: string, action: 'Approve' | 'Restrict' | 'Remove') => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (action === 'Approve') return { ...item, status: 'Active', reportCount: 0 };
          if (action === 'Restrict') return { ...item, status: 'Restricted' };
          if (action === 'Remove') return { ...item, status: 'Removed' };
        }
        return item;
      })
    );
    showToast(`Post action applied: ${action}`);
  };

  // Safety Actions
  const handleResolveSafety = (id: string, actionType: 'Action Taken' | 'Closed') => {
    setSafetyReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: actionType,
            resolution: resolutionInput || 'Case reviewed and closed by Super Admin.',
          };
        }
        return r;
      })
    );
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport(null);
    }
    setResolutionInput('');
    showToast(`Safety case updated: ${actionType}`);
  };

  // Support Ticket Actions
  const handleTicketStatus = (id: string, newStatus: SupportTicketItem['status']) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    showToast(`Ticket status changed to ${newStatus}`);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Platform Defense & Integrity Operations</span>
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            Trust, Safety & Moderation Operations
          </h2>
          <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1 max-w-2xl">
            Monitor reported feed content, investigate fraudulent entity impersonation, and resolve ecosystem member support inquiries.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
          <button
            onClick={() => setSubTab('safety')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === 'safety'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Safety Escalations ({safetyReports.filter((r) => r.status !== 'Closed').length})
          </button>

          <button
            onClick={() => setSubTab('feed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === 'feed'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Feed Moderation ({feedItems.filter((f) => f.status !== 'Active').length})
          </button>

          <button
            onClick={() => setSubTab('support')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              subTab === 'support'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Support Inquiries ({supportTickets.filter((t) => t.status !== 'Resolved').length})
          </button>
        </div>
      </div>

      {/* VIEW 1: SAFETY ESCALATIONS */}
      {subTab === 'safety' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {safetyReports.map((report) => {
              const isClosed = report.status === 'Closed' || report.status === 'Action Taken';
              return (
                <div
                  key={report.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-[#181B1A] border transition-all flex flex-col justify-between ${
                    report.priority === 'Critical' && !isClosed
                      ? 'border-rose-500/40 dark:border-rose-500/30 shadow-xs'
                      : 'border-[#E5E7EB] dark:border-[#262A29]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getPriorityBadge(
                          report.priority
                        )}`}
                      >
                        {report.priority} Priority
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isClosed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono text-[#6E7370] dark:text-[#8E9390]">
                        Category: {report.category}
                      </div>
                      <h4 className="font-sora text-sm font-bold text-[#101212] dark:text-white mt-0.5">
                        Target: {report.reportedEntity}
                      </h4>
                      <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] mt-0.5">
                        Reported by: {report.reporterName} &bull; {report.date}
                      </p>
                    </div>

                    <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                      {report.description}
                    </p>

                    {report.resolution && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        <strong className="block text-[10px] uppercase font-mono">Resolution:</strong>
                        {report.resolution}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                    <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                      Lead: {report.assignedAdmin || 'Unassigned'}
                    </span>

                    {!isClosed ? (
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all"
                      >
                        Enforce Action
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Case Closed</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: FEED MODERATION */}
      {subTab === 'feed' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] divide-y divide-gray-100 dark:divide-[#262A29] overflow-hidden">
            {feedItems.map((item) => (
              <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#101212] dark:text-white">
                      {item.author}
                    </span>
                    <span className="text-[10px] text-[#6E7370] dark:text-[#8E9390]">
                      ({item.authorRole})
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">&bull; {item.date}</span>

                    {item.reportCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {item.reportCount} user reports
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#565B59] dark:text-gray-300 leading-relaxed font-mono bg-gray-50 dark:bg-[#202422] p-3 rounded-xl border border-gray-100 dark:border-[#262A29]">
                    "{item.contentPreview}"
                  </p>

                  {item.reason && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Violation Flag: {item.reason}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleFeedAction(item.id, 'Approve')}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-all"
                  >
                    Clear Flag
                  </button>

                  <button
                    onClick={() => handleFeedAction(item.id, 'Restrict')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all"
                  >
                    Restrict
                  </button>

                  <button
                    onClick={() => handleFeedAction(item.id, 'Remove')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all"
                  >
                    Takedown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SUPPORT TICKETS */}
      {subTab === 'support' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] divide-y divide-gray-100 dark:divide-[#262A29] overflow-hidden">
            {supportTickets.map((tkt) => (
              <div key={tkt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-[#262A29] text-[#6E7370] dark:text-[#A0A4A2]">
                      #{tkt.id} &bull; {tkt.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getPriorityBadge(
                        tkt.priority
                      )}`}
                    >
                      {tkt.priority} Priority
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">&bull; {tkt.date}</span>
                  </div>

                  <h4 className="font-sora text-sm font-bold text-[#101212] dark:text-white">
                    {tkt.subject}
                  </h4>
                  <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                    From: <strong className="text-[#101212] dark:text-white">{tkt.user}</strong> ({tkt.userEmail})
                  </p>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] pt-1">
                    {tkt.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={tkt.status}
                    onChange={(e) => handleTicketStatus(tkt.id, e.target.value as SupportTicketItem['status'])}
                    className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden font-semibold"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for User">Waiting for User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Resolution Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Enforce Trust & Safety Sanction</span>
              </h4>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-[#101212] dark:text-rose-300 space-y-1">
              <div className="font-bold">Target Entity: {selectedReport.reportedEntity}</div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                Category: {selectedReport.category} &bull; Priority: {selectedReport.priority}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Internal Case Resolution Note
              </label>
              <textarea
                rows={3}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Detail the disciplinary actions taken (account restricted, IP blacklisted, legal notice sent)..."
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E7370] dark:text-[#8E9390] hover:bg-black/5 dark:hover:bg-[#202422]"
              >
                Cancel
              </button>

              <button
                onClick={() => handleResolveSafety(selectedReport.id, 'Action Taken')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
              >
                Suspend Entity & Sanction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
