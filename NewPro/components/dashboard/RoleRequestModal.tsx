'use client';

import React, { useState, useEffect } from 'react';
import {
  Rocket,
  GraduationCap,
  TrendingUp,
  Building2,
  Globe2,
  ShieldCheck,
  Check,
  Clock,
  AlertCircle,
  X,
  ArrowRight,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

interface RoleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile;
  onRequestSubmitted?: () => void;
  initialRole?: string;
}

interface RoleRequestItem {
  id: string;
  requestId: string;
  requestedRole: string;
  currentRole: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  decisionDate?: string;
}

const AVAILABLE_ROLES = [
  {
    id: 'Founder',
    title: 'Startup Founder',
    badge: 'Founder Role',
    description: 'Lead early-stage ventures, raise capital, and collaborate with ecosystem partners.',
    icon: Rocket,
    color: 'emerald',
  },
  {
    id: 'Startup',
    title: 'Startup Entity',
    badge: 'Entity Account',
    description: 'Register company profile, access investor diligence vaults, and seek endorsements.',
    icon: Rocket,
    color: 'emerald',
  },
  {
    id: 'Mentor',
    title: 'Advisory Mentor',
    badge: 'Personal Role',
    description: 'Host advisory sessions, review founder pitch decks, and mentor startups.',
    icon: GraduationCap,
    color: 'purple',
  },
  {
    id: 'Investor',
    title: 'Angel & VC Investor',
    badge: 'Capital Role',
    description: 'Explore verified deal flow, review data rooms, and syndicate investments.',
    icon: TrendingUp,
    color: 'blue',
  },
  {
    id: 'ESP / Institution',
    title: 'Incubator / ESP / Institution',
    badge: 'Institution Account',
    description: 'Run cohort programs, grant incubation credits, and endorse startups.',
    icon: Building2,
    color: 'amber',
  },
];

export const RoleRequestModal: React.FC<RoleRequestModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onRequestSubmitted,
  initialRole,
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(currentUserProfile || getUserProfile());
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [selectedRole, setSelectedRole] = useState<string>(initialRole || 'Startup Founder');
  const [orgName, setOrgName] = useState<string>('');
  const [publicLink, setPublicLink] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requests, setRequests] = useState<RoleRequestItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const p = currentUserProfile || getUserProfile();
      setProfile(p);
      if (initialRole) {
        setSelectedRole(initialRole);
      }
      fetchRequests(p);
    }
  }, [isOpen, currentUserProfile, initialRole]);

  const fetchRequests = async (p?: UserProfile) => {
    const prof = p || profile;
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (prof.id) params.set('userId', prof.id);
      if (prof.email) params.set('email', prof.email);

      const res = await fetch(`/api/roles/request?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data?.requests || json?.requests || [];
        setRequests(list);
        if (list.length > 0 && activeTab === 'request') {
          // If there's an ongoing pending request, show status tab or indicator
        }
      }
    } catch (e) {
      console.warn('Failed to fetch role requests:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const pendingRequest = requests.find((r) => r.status === 'PENDING');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a brief reason or background for your request.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: profile.id,
        userEmail: profile.email,
        userName: profile.name,
        currentRole: profile.role || 'Explorer',
        requestedRole: selectedRole,
        reason: reason.trim(),
        entityDetails: {
          orgName: orgName.trim(),
          publicLink: publicLink.trim(),
        },
      };

      const res = await fetch('/api/roles/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast('Role request submitted! Sent to administrators for review.', 'success');
        setReason('');
        setOrgName('');
        setPublicLink('');
        await fetchRequests();
        setActiveTab('history');
        if (onRequestSubmitted) onRequestSubmitted();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('xentro-role-requests-updated'));
        }
      } else {
        showToast(json.message || 'Failed to submit role request', 'error');
      }
    } catch {
      showToast('Failed to connect to request service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40 uppercase tracking-wider">
                Participation Type
              </span>
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                Current Role: <strong className="text-[#101212] dark:text-white capitalize">{profile.role || 'Explorer'}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-manrope text-[#101212] dark:text-white">
              Change or Request Platform Role
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 dark:border-[#262A29] px-6 bg-gray-50/50 dark:bg-[#121413]">
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`py-3 text-xs font-bold border-b-2 transition-all mr-6 cursor-pointer ${
              activeTab === 'request'
                ? 'border-[#D9FF3F] text-[#101212] dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Request New Role
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#D9FF3F] text-[#101212] dark:text-[#D9FF3F]'
                : 'border-transparent text-[#565B59] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <span>Request Status & Decisions</span>
            {requests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5">
          {activeTab === 'request' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Notice for Pending requests */}
              {pendingRequest && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold">Pending Review In Progress</p>
                    <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                      You already have an active request for <strong>{pendingRequest.requestedRole}</strong> submitted on{' '}
                      {new Date(pendingRequest.createdAt).toLocaleDateString()}. Our admins review applications in 1-2 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Step: Select Role */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-2">
                  Select Role to Request:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/5 ring-1 ring-[#D9FF3F]'
                            : 'border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#141716] hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#101212] dark:text-[#D9FF3F]' : 'text-gray-400'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#8E9290]">
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#101212] dark:text-white">{r.title}</p>
                          <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] mt-0.5 leading-snug">
                            {r.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organization or Venture Name */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1">
                  Associated Organization / Venture / Firm Name (Optional):
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Health Technologies, Apex Capital"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141716] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              {/* Public Website / LinkedIn */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1">
                  Public Website, Portfolio, or LinkedIn Profile:
                </label>
                <input
                  type="url"
                  value={publicLink}
                  onChange={(e) => setPublicLink(e.target.value)}
                  placeholder="https://linkedin.com/in/... or https://yourventure.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141716] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              {/* Reason / Statement of Purpose */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1">
                  Statement of Intent / Qualifications: <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly state your background, ecosystem focus, and why you are applying for this role..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#141716] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F] resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History & Decision Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#565B59] dark:text-[#8E9290]">
                  Your role requests and administrative decisions ({requests.length}):
                </span>
                <button
                  type="button"
                  onClick={() => fetchRequests()}
                  className="text-xs text-emerald-600 dark:text-[#D9FF3F] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#565B59] dark:text-[#8E9290] bg-gray-50 dark:bg-[#121413] rounded-2xl border border-dashed border-gray-200 dark:border-[#262A29] space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="font-bold text-sm text-[#101212] dark:text-white">No role requests submitted yet</p>
                  <p className="text-xs max-w-xs mx-auto">
                    You are currently active as an <strong>{profile.role || 'Explorer'}</strong>. Use the Request tab to apply for additional roles.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('request')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Create a Request</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id || req.requestId}
                      className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#141716] space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-[#262A29] pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                              #{req.requestId || req.id}
                            </span>
                            <span className="font-bold text-sm text-[#101212] dark:text-white">
                              {req.requestedRole}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] mt-0.5">
                            Submitted: {new Date(req.createdAt).toLocaleDateString()} &bull; Current: {req.currentRole}
                          </p>
                        </div>

                        <div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.status === 'PENDING' ? 'Under Review' : req.status}
                          </span>
                        </div>
                      </div>

                      {req.reason && (
                        <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] italic">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      )}

                      {req.adminNotes && (
                        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#1a1d1c] border border-gray-100 dark:border-[#262A29] text-[11px]">
                          <span className="font-bold text-[#101212] dark:text-white">Admin Decision Note: </span>
                          <span className="text-[#565B59] dark:text-[#A0A4A2]">{req.adminNotes}</span>
                        </div>
                      )}
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
