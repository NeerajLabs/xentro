'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MoreVertical,
  Upload,
  Link,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap,
  Building,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  ESPMember,
  ESPMemberRole,
  ESPInvitation,
} from '@/types/esp';
import {
  getStoredESPMembers,
  saveStoredESPMembers,
  mockESPInvitations,
} from '@/data/espWorkspaceData';

export const ESPMembersManager: React.FC = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<ESPMember[]>([]);
  const [invitations, setInvitations] = useState<ESPInvitation[]>(mockESPInvitations);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'students' | 'faculty' | 'staff' | 'managers' | 'invitations'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'individual' | 'csv' | 'link'>('individual');

  // Form states
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleRole, setSingleRole] = useState<ESPMemberRole>('Student Entrepreneur');
  const [singleDept, setSingleDept] = useState('');

  // Link copied state
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMembers(getStoredESPMembers());
  }, []);

  const studentCount = members.filter((m) => m.role === 'Student Entrepreneur').length;
  const facultyCount = members.filter((m) => m.role === 'Faculty Coordinator').length;
  const managerCount = members.filter((m) =>
    ['Super Admin', 'Incubator Admin', 'Program Manager', 'Workspace Manager'].includes(m.role)
  ).length;

  // Filtered list
  const filteredMembers = members.filter((m) => {
    // Category match
    if (activeCategory === 'students' && m.role !== 'Student Entrepreneur') return false;
    if (activeCategory === 'faculty' && m.role !== 'Faculty Coordinator') return false;
    if (activeCategory === 'managers' && !['Super Admin', 'Incubator Admin', 'Program Manager', 'Workspace Manager'].includes(m.role)) return false;
    if (activeCategory === 'staff' && ['Student Entrepreneur', 'Faculty Coordinator'].includes(m.role)) return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q))
    );
  });

  const handleAddIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName || !singleEmail) return;

    const newMember: ESPMember = {
      id: `esp_mem_${Date.now()}`,
      name: singleName,
      email: singleEmail,
      role: singleRole,
      department: singleDept || 'Incubation Directorate',
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
      avatar: '/images/profile_avatar.webp',
      identityVerified: false,
      verificationBadge: 'Verification Pending',
      studentPrivacyProtected: singleRole === 'Student Entrepreneur',
    };

    const updated = [newMember, ...members];
    setMembers(updated);
    saveStoredESPMembers(updated);

    showToast(`Invited ${singleName} as ${singleRole}!`, 'success');
    setSingleName('');
    setSingleEmail('');
    setSingleDept('');
    setIsAddModalOpen(false);
  };

  const handleSimulateCSV = () => {
    const csvMembers: ESPMember[] = [
      {
        id: `esp_mem_csv_${Date.now()}_1`,
        name: 'Arjun Swaminathan',
        email: 'arjun.s@campus.ac.in',
        role: 'Student Entrepreneur',
        department: 'B.Tech Robotics',
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        identityVerified: true,
        verificationBadge: 'Identity Verified',
        studentPrivacyProtected: true,
      },
      {
        id: `esp_mem_csv_${Date.now()}_2`,
        name: 'Suhani Jain',
        email: 'suhani.jain@campus.ac.in',
        role: 'Student Entrepreneur',
        department: 'M.Tech AI & Data',
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        identityVerified: false,
        verificationBadge: 'Verification Pending',
        studentPrivacyProtected: true,
      },
    ];

    const updated = [...csvMembers, ...members];
    setMembers(updated);
    saveStoredESPMembers(updated);
    showToast('Imported 2 campus members from CSV!', 'success');
    setIsAddModalOpen(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://xentro.io/invite/esp-thub-campus-2026?token=xesp9922');
    }
    setIsCopied(true);
    showToast('Secure campus invite link copied to clipboard!', 'info');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleRemoveMember = (id: string, name: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveStoredESPMembers(updated);
    showToast(`Removed ${name} from workspace members.`, 'info');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Members & Campus Ecosystem
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Internal Workspace
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage faculty advisors, students, incubation staff, and institutional coordinators with role-based governance.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Members</span>
        </button>
      </div>

      {/* 1. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Total Members
          </span>
          <p className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {members.length}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Active across entity hubs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Student Innovators
          </span>
          <p className="text-2xl font-bold font-sora text-[#D9FF3F]">
            {studentCount}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Privacy Protected
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Faculty & Coordinators
          </span>
          <p className="text-2xl font-bold font-sora text-cyan-500">
            {facultyCount}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Academic Liaisons
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Pending Invites
          </span>
          <p className="text-2xl font-bold font-sora text-amber-500">
            {invitations.filter((i) => i.status === 'Pending').length}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Awaiting campus acceptance
          </p>
        </div>
      </div>

      {/* 2. Privacy Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <span className="font-bold">Zero-Identity-Document Exposure & Student Safeguard</span>
          <p className="text-emerald-600 dark:text-emerald-400 leading-relaxed">
            Identity verification is evaluated securely at an administrative level. Only status badges (<span className="font-semibold">Identity Verified</span>, <span className="font-semibold">Pending</span>) are surfaced. No Aadhaar or national identity documents are ever visible to members. Student profiles remain internal to the institution and are never exposed publicly.
          </p>
        </div>
      </div>

      {/* 3. Subnav Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'students', label: `Students (${studentCount})` },
            { id: 'faculty', label: `Faculty (${facultyCount})` },
            { id: 'managers', label: `Managers (${managerCount})` },
            { id: 'invitations', label: `Invites (${invitations.length})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory !== 'invitations' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#565B59]" />
            <input
              type="text"
              placeholder="Search by name, role, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>
        )}
      </div>

      {/* 4. Table: Directory vs Invitations */}
      {activeCategory !== 'invitations' ? (
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Department / Unit</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatar || '/images/profile_avatar.webp'}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-[#262A29]"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.studentPrivacyProtected && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                                Private
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            {m.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#101212] dark:text-gray-200">
                      {m.role}
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {m.department || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.verificationBadge === 'Identity Verified' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Identity Verified</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {m.joinedAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Invitations Table */
        <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invited Email</th>
                  <th className="py-3 px-4">Role Assigned</th>
                  <th className="py-3 px-4">Invited By</th>
                  <th className="py-3 px-4">Sent Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {inv.email}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#D9FF3F]">
                      {inv.role}
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {inv.invitedBy}
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {inv.invitedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showToast(`Resent invitation to ${inv.email}!`, 'success')}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#D9FF3F] hover:bg-[#D9FF3F]/10 transition-colors cursor-pointer mr-2"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => {
                          setInvitations(invitations.filter((i) => i.id !== inv.id));
                          showToast('Invitation revoked.', 'info');
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Add Members Modal (3 Ingestion Options) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Add Ecosystem Members
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Invite individuals, bulk import from CSV, or share tokenized links
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
              {[
                { id: 'individual', label: 'Single Invite' },
                { id: 'csv', label: 'Bulk CSV' },
                { id: 'link', label: 'Shareable Link' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAddMode(m.id as any)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addMode === m.id
                      ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                      : 'text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode 1: Individual Invite */}
            {addMode === 'individual' && (
              <form onSubmit={handleAddIndividual} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Raghav Varma or Ananya Sen"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@campus.ac.in"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">
                      Assign Role
                    </label>
                    <select
                      value={singleRole}
                      onChange={(e) => setSingleRole(e.target.value as ESPMemberRole)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="Student Entrepreneur">Student Entrepreneur</option>
                      <option value="Faculty Coordinator">Faculty Coordinator</option>
                      <option value="Program Manager">Program Manager</option>
                      <option value="Cohort Reviewer">Cohort Reviewer</option>
                      <option value="Workspace Manager">Workspace Manager</option>
                      <option value="View-Only Auditor">View-Only Auditor</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">
                      Department / Lab
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI Research Center"
                      value={singleDept}
                      onChange={(e) => setSingleDept(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Bulk CSV Upload */}
            {addMode === 'csv' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#262A29] text-center space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-[#D9FF3F] mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      Upload CSV with Campus Roster
                    </h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                      Columns required: <span className="font-mono">name, email, role, department</span>
                    </p>
                  </div>
                  <button
                    onClick={handleSimulateCSV}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer"
                  >
                    Browse or Drop File (Simulate 2 Members)
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1">
                  <span>Need a formatted file?</span>
                  <button
                    onClick={() => showToast('Sample member roster template downloaded.', 'info')}
                    className="text-[#D9FF3F] font-bold hover:underline cursor-pointer"
                  >
                    Download CSV Template
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Shareable Tokenized Link */}
            {addMode === 'link' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Campus Onboarding Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="https://xentro.io/invite/esp-thub-campus-2026?token=xesp9922"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#565B59] dark:text-[#B6B8B7] focus:outline-hidden"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Anyone with this link and a verified campus email domain (<span className="font-mono">*.ac.in</span> or <span className="font-mono">*.edu</span>) will automatically join as a Student Entrepreneur. Token expires in 14 days.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
