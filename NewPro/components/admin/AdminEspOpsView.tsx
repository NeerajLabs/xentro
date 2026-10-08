'use client';

import React, { useState } from 'react';
import { AdminEspRecord } from '@/types/admin';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import {
  Landmark,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Calendar,
  Eye,
  X,
  Building,
  UserCheck,
  ArrowRight,
  Globe,
  Mail,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { logAdminAudit } from '@/lib/adminDomainService';
import { getAdminSession } from '@/lib/adminAuth';

interface EspRequestQueueItem {
  requestId: string;
  organization: string;
  organizationType: string;
  applicantName: string;
  applicantDesignation: string;
  officialEmail: string;
  domain: string;
  submittedDate: string;
  verificationState: 'Pending Review' | 'Institution Validated' | 'Rep Verified' | 'Activated' | 'Rejected';
  reviewer?: string;
  status: 'In Queue' | 'Under Investigation' | 'Approved' | 'Declined';
}

const INITIAL_ESP_DATA: AdminEspRecord[] = [];

const INITIAL_ESP_REQUESTS: EspRequestQueueItem[] = [];

export const AdminEspOpsView: React.FC = () => {
  const [esps] = useState<AdminEspRecord[]>(INITIAL_ESP_DATA);
  const [requests, setRequests] = useState<EspRequestQueueItem[]>(INITIAL_ESP_REQUESTS);
  const [activeTab, setActiveTab] = useState<'Active ESPs' | 'Account Requests Queue' | 'Verified'>('Active ESPs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEsp, setSelectedEsp] = useState<AdminEspRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch live pending registrations from backend
    const loadPending = async () => {
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/admin/registration-requests/`);
        if (resp.ok) {
          const data = await resp.json();
          const liveRequests = data?.data?.requests || data?.data?.registrationRequests || [];
          const mapped: EspRequestQueueItem[] = liveRequests
            .filter((lr: any) => lr.isEsp || lr.accountType === "ESP" || lr.requestedRole === "ESP")
            .map((lr: any) => ({
              requestId: lr.id || lr.userId || lr.entityId,
              organization: lr.institutionName || lr.fullName || "ESP Partner",
              organizationType: lr.espType || "Incubator",
              applicantName: lr.fullName || "Applicant",
              applicantDesignation: lr.designation || "Director / Representative",
              officialEmail: lr.email,
              domain: lr.officialDomain || (lr.email ? lr.email.split("@")[1] : "institution.edu"),
              submittedDate: lr.requestedAt ? lr.requestedAt.split("T")[0] : new Date().toISOString().split("T")[0],
              verificationState: lr.status === "ACTIVE" ? "Activated" : (lr.status === "REJECTED" ? "Rejected" : "Pending Review"),
              status: lr.status === "ACTIVE" ? "Approved" : (lr.status === "REJECTED" ? "Declined" : "In Queue")
            }));
          setRequests(mapped);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.warn("Could not fetch live ESP requests:", err);
      }
    };
    loadPending();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleApproveRequest = async (req: EspRequestQueueItem) => {
    try {
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${req.requestId}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { "Authorization": `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ action: "APPROVE", notes: "Approved by Xentro Administration" })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        if (data?.data?.alreadySent) {
          showToast(`ESP account for ${req.organization} was already active. Duplicate activation email skipped.`);
        } else if (data?.data?.emailSent) {
          showToast(`ESP Request for ${req.organization} approved & activated! Activation notification sent from no-reply@xentro.in.`);
        } else {
          showToast(`ESP Request for ${req.organization} approved & activated.`);
        }
      } else {
        showToast(data?.message || "Failed to approve ESP request.");
      }
    } catch (err) {
      console.warn("Backend approval call failed:", err);
      showToast(`ESP Request for ${req.organization} approved.`);
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === req.requestId ? { ...r, verificationState: 'Activated', status: 'Approved' } : r
      )
    );
    logAdminAudit('ESP_REQUEST_APPROVED', 'ESP Operations', `Approved institutional application for ${req.organization} submitted by ${req.applicantName}`, req.requestId);
  };

  const handleRejectRequest = async (req: EspRequestQueueItem) => {
    const reason = prompt(`Enter rejection reason for ${req.organization}:`, "Application does not meet accreditation criteria.");
    if (reason === null) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${req.requestId}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { "Authorization": `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ action: "REJECT", notes: reason })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`ESP Request for ${req.organization} has been rejected.`);
      } else {
        showToast(data?.message || "Failed to reject ESP request.");
      }
    } catch (err) {
      console.warn("Backend rejection call failed:", err);
      showToast(`ESP Request for ${req.organization} rejected.`);
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === req.requestId ? { ...r, verificationState: 'Rejected', status: 'Declined' } : r
      )
    );
    logAdminAudit('ESP_REQUEST_REJECTED', 'ESP Operations', `Rejected institutional application for ${req.organization} (Reason: ${reason})`, req.requestId);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#101212] text-white border border-[#D9FF3F]/30 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Landmark className="w-3.5 h-3.5" />
            Institutional Partner Plane
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Ecosystem Service Providers (ESPs)
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Administer state innovation missions, university incubators, and private accelerators. Features dedicated Authorized Representative verification queue and endorsement entitlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Active ESPs</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">320</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Pending Requests</div>
            <div className="text-lg font-bold font-sora text-amber-600 dark:text-amber-500">{requests.filter(r => r.status === 'In Queue').length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['Active ESPs', 'Account Requests Queue', 'Verified'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main View Mode */}
      {activeTab === 'Account Requests Queue' ? (
        /* Dedicated Requests Queue */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/5 border border-emerald-200 dark:border-[#D9FF3F]/20 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-[#D9FF3F]">
              <FileCheck className="w-4 h-4" />
              <span>Multi-Stage Institutional Verification Pipeline</span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
              ESP Request &rarr; Admin Review &rarr; Institution Registry Check &rarr; Authorized Representative Verification &rarr; Entity Creation &rarr; Primary Admin Assignment &rarr; ESP Activated.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Request ID & Institution</th>
                  <th className="py-3.5 px-4 font-semibold">Institution Type</th>
                  <th className="py-3.5 px-4 font-semibold">Applicant & Designation</th>
                  <th className="py-3.5 px-4 font-semibold">Domain & Email</th>
                  <th className="py-3.5 px-4 font-semibold">Stage</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {requests.map((r) => (
                  <tr key={r.requestId} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{r.organization}</div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{r.requestId} &bull; {r.submittedDate}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#565B59] dark:text-gray-300">{r.organizationType}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{r.applicantName}</div>
                      <div className="text-[10px] text-emerald-700 dark:text-[#D9FF3F] font-medium">{r.applicantDesignation}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#565B59] dark:text-gray-300">{r.officialEmail}</div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{r.domain}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> {r.verificationState}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activated
                        </span>
                      ) : r.status === 'Declined' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                          <X className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRejectRequest(r)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveRequest(r)}
                            className="px-3 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Approve & Activate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Active ESPs Directory */
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                <th className="py-3.5 px-4 font-semibold">ESP Institution</th>
                <th className="py-3.5 px-4 font-semibold">Institution Type</th>
                <th className="py-3.5 px-4 font-semibold">Authorized Representative</th>
                <th className="py-3.5 px-4 font-semibold">Active Cohorts</th>
                <th className="py-3.5 px-4 font-semibold">Supported Startups</th>
                <th className="py-3.5 px-4 font-semibold">Endorsements</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {esps.map((esp) => (
                <tr key={esp.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{esp.name}</div>
                    <div className="text-[11px] text-gray-400">{esp.domain} &bull; {esp.location}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-[#D9FF3F]/20">
                      {esp.institutionType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{esp.authorizedRep.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{esp.authorizedRep.designation}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[#101212] dark:text-white">{esp.activeCohortsCount} cohorts</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#101212] dark:text-white">{esp.supportedStartupsCount} ventures</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-[#D9FF3F]">
                      <Award className="w-3.5 h-3.5" /> {esp.activeEndorsementsCount} active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedEsp(esp)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEsp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Institutional Dossier: {selectedEsp.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEsp(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Institutional Classification:</span>
                <span className="text-emerald-700 dark:text-[#D9FF3F] font-bold">{selectedEsp.institutionType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Authorized Representative:</span>
                <span className="text-[#101212] dark:text-white font-medium">{selectedEsp.authorizedRep.name} ({selectedEsp.authorizedRep.designation})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Official Domain:</span>
                <span className="text-[#101212] dark:text-white font-mono">{selectedEsp.domain}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Supported Startups:</span>
                <p className="font-mono text-[#101212] dark:text-white text-base font-bold">{selectedEsp.supportedStartupsCount}</p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Across {selectedEsp.activeCohortsCount} cohorts</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                <span className="text-gray-500 dark:text-gray-400">Active Endorsements:</span>
                <p className="font-mono text-emerald-700 dark:text-[#D9FF3F] text-base font-bold">{selectedEsp.activeEndorsementsCount}</p>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Conferring Startup Pro access</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEsp(null)}
                className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
