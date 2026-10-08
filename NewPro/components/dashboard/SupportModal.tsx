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
  LifeBuoy,
  Check,
  Copy,
  ChevronRight,
  Search
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
  status: string;
  userFacingStatus: 'Complaint sent' | 'Under investigation' | 'Resolved';
  stage: 1 | 2 | 3;
  resolutionComment?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

function getActiveSessionIdentity(): { id: string; name: string; email: string; role: string } {
  if (typeof window === 'undefined') return { id: '', name: 'Ecosystem Member', email: '', role: 'Explorer' };
  try {
    const curUser = JSON.parse(localStorage.getItem('xentro_current_user') || 'null') ||
                    JSON.parse(localStorage.getItem('xentro_auth_user') || 'null');
    if (curUser && (curUser.id || curUser.userId)) {
      return {
        id: curUser.id || curUser.userId,
        name: curUser.fullName || curUser.name || 'Ecosystem Member',
        email: curUser.email || '',
        role: curUser.role || curUser.accountType || 'Explorer'
      };
    }

    const storedId = localStorage.getItem('xentro_user_id');
    const profile = getUserProfile();
    if (storedId) {
      return {
        id: storedId,
        name: profile.name || 'Ecosystem Member',
        email: profile.email || '',
        role: profile.role || 'Explorer'
      };
    }

    return {
      id: profile.id || '',
      name: profile.name || 'Ecosystem Member',
      email: profile.email || '',
      role: profile.role || 'Explorer'
    };
  } catch {
    return { id: '', name: 'Ecosystem Member', email: '', role: 'Explorer' };
  }
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [sessionUser, setSessionUser] = useState(getActiveSessionIdentity());

  const [category, setCategory] = useState('Platform Issue');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [history, setHistory] = useState<SupportTicket[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const identity = getActiveSessionIdentity();
      setSessionUser(identity);
      fetchHistory(identity.id);
    }
  }, [isOpen]);

  const fetchHistory = async (explicitUserId?: string) => {
    try {
      setIsLoadingHistory(true);
      const identity = explicitUserId || sessionUser.id || getActiveSessionIdentity().id;

      const headers: Record<string, string> = {};
      if (identity) {
        headers['X-User-Id'] = identity;
      }

      const res = await fetch(`/api/support/complaints${identity ? `?accountId=${encodeURIComponent(identity)}` : ''}`, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        const tickets: SupportTicket[] = data?.data?.tickets || [];
        setHistory(tickets);
      }
    } catch (e) {
      console.warn('Failed to fetch support history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopyTicketId = (id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      showToast(`Ticket ID #${id} copied to clipboard`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please provide both a subject and details for your complaint/request.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const identity = getActiveSessionIdentity();
      const payload = {
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
      };

      const res = await fetch('/api/support/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(identity.id ? { 'X-User-Id': identity.id } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const ticket: SupportTicket = data?.data?.ticket;
        setSubmittedTicket(ticket);
        showToast('Complaint ticket registered successfully in MongoDB!', 'success');
        setSubject('');
        setMessage('');
        fetchHistory(identity.id);
      } else {
        showToast(data?.message || 'Failed to submit complaint. Please sign in and try again.', 'error');
      }
    } catch {
      showToast('Network error while filing complaint.', 'error');
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
                Submit grievances, platform inquiries, or bug reports with end-to-end status tracking.
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

        {/* Authenticated User Session Banner */}
        <div className="px-6 py-2.5 bg-gray-100/60 dark:bg-[#1F2422] border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#565B59] dark:text-[#A0A4A2]">Authenticated Account:</span>
            <span className="font-semibold text-[#101212] dark:text-white">{sessionUser.name}</span>
            <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-[#141716] text-[11px] text-emerald-800 dark:text-[#D9FF3F] font-bold border border-[#E5E7EB] dark:border-[#262A29]">
              ID: {sessionUser.id || 'Active Session'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] uppercase font-mono">Role: {sessionUser.role}</span>
          </div>
        </div>

        {/* Tab Navigation */}
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
            <span>File New Complaint</span>
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
            <span>My Tickets ({history.length})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'submit' ? (
            submittedTicket ? (
              /* Success View - Shown strictly AFTER the ticket is saved in MongoDB */
              <div className="py-6 px-4 space-y-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                    Complaint Successfully Saved
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] max-w-md mx-auto">
                    Your ticket has been persisted in MongoDB Atlas and linked to your verified account identity.
                  </p>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#141716] border border-[#E5E7EB] dark:border-[#262A29] mt-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                      #{submittedTicket.id}
                    </span>
                    <button
                      onClick={() => handleCopyTicketId(submittedTicket.id)}
                      className="text-gray-400 hover:text-[#101212] dark:hover:text-white cursor-pointer"
                      title="Copy Ticket ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3-Stage User Status Stepper */}
                <div className="p-4 bg-white dark:bg-[#141716] rounded-xl border border-[#E5E7EB] dark:border-[#262A29] max-w-lg mx-auto text-left space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#A0A4A2] block">
                    Current Progress Stage
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/30 text-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                        1
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block">
                        Complaint sent
                      </span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-300">Active</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                        2
                      </div>
                      <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                        Under investigation
                      </span>
                      <span className="text-[9px] text-gray-400">Pending Review</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center opacity-60">
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                        3
                      </div>
                      <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">
                        Resolved
                      </span>
                      <span className="text-[9px] text-gray-400">Final Outcome</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => { setSubmittedTicket(null); setActiveTab('history'); }}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer"
                  >
                    View in My Tickets
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Complaint Submission Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Complaint / Issue Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="Platform Issue">Platform Issue / Software Bug</option>
                      <option value="Account & Profile">Account Access & Identity</option>
                      <option value="Verification & KYC">Identity Verification & Accreditation</option>
                      <option value="Trust & Safety">User Misconduct / Trust & Safety</option>
                      <option value="Billing & Finance">Escrow, Diligence & Invoices</option>
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
                      <option value="LOW">Low (Inquiry / Non-urgent feedback)</option>
                      <option value="NORMAL">Normal (Standard platform assistance)</option>
                      <option value="HIGH">High (Impairs active workflow or venture)</option>
                      <option value="URGENT">Urgent (Account security or violation)</option>
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
                    placeholder="Clear summary of the problem or grievance"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Detailed Complaint Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Provide full details: what happened, steps to reproduce, user IDs or URLs involved, and expected resolution..."
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
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Complaint</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* User Ticket History & Status Progression Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#565B59] dark:text-[#A0A4A2]">
                  Your persistent support & complaint tickets:
                </span>
                <button
                  onClick={() => fetchHistory()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-[#D9FF3F] hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8E9290] space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#8E9290]/40" />
                  <p className="font-semibold text-[#101212] dark:text-white">No complaints or tickets filed yet</p>
                  <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                    Any support requests you lodge will be preserved persistently in MongoDB and show live admin updates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#1C201F] shadow-xs space-y-3"
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                              #{t.id}
                            </span>
                            <span className="text-xs font-bold text-[#101212] dark:text-white">
                              {t.subject}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                            <span>Category: {t.category}</span>
                            <span>&bull;</span>
                            <span>Priority: {t.priority}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            t.stage === 3
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30'
                              : t.stage === 2
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {t.userFacingStatus || 'Complaint sent'}
                          </span>
                        </div>
                      </div>

                      {/* 3 User-Facing Stages Stepper */}
                      <div className="py-1">
                        <div className="grid grid-cols-3 gap-2">
                          {/* Stage 1: Complaint sent */}
                          <div className={`p-2 rounded-lg border text-center transition-all ${
                            t.stage >= 1
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-transparent text-gray-400'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage > 1 ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                              )}
                              <span className="text-[10px] font-bold">Complaint sent</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Stage 2: Under investigation */}
                          <div className={`p-2 rounded-lg border text-center transition-all ${
                            t.stage >= 2
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage > 2 ? (
                                <Check className="w-3 h-3 text-blue-600" />
                              ) : t.stage === 2 ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">2</span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">2</span>
                              )}
                              <span className="text-[10px] font-bold">Under investigation</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {t.stage >= 2 ? 'In review' : 'Queued'}
                            </span>
                          </div>

                          {/* Stage 3: Resolved */}
                          <div className={`p-2 rounded-lg border text-center transition-all ${
                            t.stage === 3
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-400 opacity-60'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {t.stage === 3 ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px] font-bold flex items-center justify-center">3</span>
                              )}
                              <span className="text-[10px] font-bold">Resolved</span>
                            </div>
                            <span className="text-[9px] text-[#565B59] dark:text-[#A0A4A2]">
                              {t.stage === 3 ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complaint Message Details */}
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed whitespace-pre-wrap">
                        {t.message}
                      </div>

                      {/* Resolution Comment (Visible to User) */}
                      {t.resolutionComment && (
                        <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                            Resolution Comment (From Operations):
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
