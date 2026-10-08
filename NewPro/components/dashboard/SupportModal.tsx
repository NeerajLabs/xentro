'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  AlertCircle,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MessageSquare,
  RefreshCw,
  FileText,
  LifeBuoy
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SupportTicket {
  id: string;
  accountId: string;
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
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());

  const [category, setCategory] = useState('Platform Issue');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  const [history, setHistory] = useState<SupportTicket[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUserProfile(getUserProfile());
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const profile = getUserProfile();
      const accountId = profile.id || '';
      if (!accountId) return;

      const res = await fetch(`/api/support/complaints?accountId=${encodeURIComponent(accountId)}`, {
        headers: {
          'X-User-Id': accountId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const tickets = data?.data?.tickets || [];
        setHistory(tickets);
      }
    } catch (e) {
      console.warn('Failed to fetch support history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please provide both a subject and details for your request.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const profile = getUserProfile();
      const payload = {
        accountId: profile.id || 'ANONYMOUS',
        userId: profile.id || 'ANONYMOUS',
        userName: profile.name || 'Ecosystem Member',
        userEmail: profile.email || '',
        userRole: profile.role || 'Explorer',
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      };

      const res = await fetch('/api/support/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': profile.id || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const ticket = data?.data?.ticket;
        setSubmittedTicket(ticket);
        showToast('Support request submitted successfully!', 'success');
        setSubject('');
        setMessage('');
        fetchHistory();
      } else {
        showToast(data?.message || 'Failed to submit request. Please try again.', 'error');
      }
    } catch {
      showToast('Network error while submitting support request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-floating overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#1C201F]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <LifeBuoy className="w-5 h-5 text-emerald-800 dark:text-[#D9FF3F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Xentro Support & Complaints
              </h2>
              <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                Submit inquiries, platform issues, or formal complaints to platform operations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account ID Banner */}
        <div className="px-6 py-2.5 bg-gray-100/60 dark:bg-[#1F2422] border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#565B59] dark:text-[#A0A4A2]">Submitting as:</span>
            <span className="font-semibold text-[#101212] dark:text-white">{userProfile.name}</span>
            <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-[#141716] text-[11px] text-emerald-800 dark:text-[#D9FF3F] font-bold border border-[#E5E7EB] dark:border-[#262A29]">
              ID: {userProfile.id || 'Guest'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">Role: {userProfile.role.toUpperCase()}</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-6 border-b border-[#E5E7EB] dark:border-[#262A29] gap-4">
          <button
            onClick={() => { setActiveTab('submit'); setSubmittedTicket(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'submit'
                ? 'border-emerald-600 dark:border-[#D9FF3F] text-emerald-800 dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit New Request</span>
          </button>
          <button
            onClick={() => { setActiveTab('history'); fetchHistory(); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 dark:border-[#D9FF3F] text-emerald-800 dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Submissions ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'submit' ? (
            submittedTicket ? (
              /* Success Confirmation View */
              <div className="py-6 px-4 text-center space-y-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                    Request Logged Successfully
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-md mx-auto">
                    Your submission has been securely persisted in the Xentro platform registry with ID:
                  </p>
                  <p className="font-mono text-sm font-bold text-emerald-800 dark:text-[#D9FF3F] pt-1">
                    #{submittedTicket.id}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-[#141716] rounded-xl border border-[#E5E7EB] dark:border-[#262A29] text-left text-xs max-w-md mx-auto space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#565B59] dark:text-[#A0A4A2]">Subject:</span>
                    <span className="font-semibold text-[#101212] dark:text-white">{submittedTicket.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565B59] dark:text-[#A0A4A2]">Category:</span>
                    <span className="font-medium">{submittedTicket.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565B59] dark:text-[#A0A4A2]">Initial Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-400">
                      {submittedTicket.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => { setSubmittedTicket(null); setActiveTab('history'); }}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors"
                  >
                    View All Submissions
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Issue Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="Platform Issue">Platform Issue / Bug</option>
                      <option value="Account & Profile">Account Access & Profile</option>
                      <option value="Verification & KYC">Identity Verification & KYC</option>
                      <option value="Misconduct & Safety">User Misconduct / Trust & Safety</option>
                      <option value="Billing & Finance">Billing, Escrow & Invoices</option>
                      <option value="General Support">General Ecosystem Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Severity / Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="LOW">Low (General question)</option>
                      <option value="NORMAL">Normal (Standard request)</option>
                      <option value="HIGH">High (Impacts daily workflow)</option>
                      <option value="URGENT">Urgent (Account or security critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Subject / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your complaint or assistance request"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Detailed Explanation / Complaint Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe what occurred, any specific URLs, entities or users involved, and desired resolution..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Submissions History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">
                  Your previous complaint and support submissions:
                </span>
                <button
                  onClick={fetchHistory}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-[#D9FF3F] hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8E9290] space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#8E9290]/40" />
                  <p className="font-semibold text-[#101212] dark:text-white">No complaints or requests logged</p>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                    Any requests you submit will appear here with live resolution updates.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#262A29] space-y-3">
                  {history.map((t) => (
                    <div key={t.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-[#D9FF3F]">
                              #{t.id}
                            </span>
                            <span className="text-xs font-bold text-[#101212] dark:text-white">
                              {t.subject}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                            Category: {t.category} &bull; Priority: {t.priority}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                            : t.status === 'IN_REVIEW'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            : t.status === 'DISMISSED'
                            ? 'bg-gray-500/15 text-gray-700 dark:text-gray-400'
                            : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1F2422] text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                        {t.message}
                      </div>

                      {t.resolutionComment && (
                        <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                            Admin Resolution Response:
                          </span>
                          <p className="text-[#101212] dark:text-white text-xs">{t.resolutionComment}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-[#8E9290]">
                        Submitted on: {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
