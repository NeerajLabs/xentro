'use client';

import React, { useState, useEffect } from 'react';
import {
  MOCK_AUDIT_LOGS,
  ADMIN_TEAM_MEMBERS,
  INITIAL_PLATFORM_CONFIG,
  AdminTeamMember,
} from '@/data/adminData';
import {
  AuditLogEntry,
  PlatformConfig,
  AdminRole,
  AdminSession,
  AdminFeatureFlag,
  AdminSystemHealthService,
} from '@/types/admin';
import {
  Shield,
  Lock,
  Database,
  Sliders,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Activity,
  Key,
  Clock,
  Save,
  RefreshCw,
  Wrench,
  Info,
  X,
  Power,
  ToggleLeft,
  ToggleRight,
  Server,
  Zap,
  ArrowRightLeft,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { getAdminSession, switchAdminRole, hasAdminPermission } from '@/lib/adminAuth';
import { adminDomainService } from '@/lib/adminDomainService';
import {
  getMaintenanceState,
  setMaintenanceState,
  clearMaintenanceState,
  MaintenanceState,
} from '@/lib/maintenance';

const ALL_CANONICAL_ROLES: AdminRole[] = [
  'Super Admin',
  'Identity Verification Admin',
  'Entity Verification Admin',
  'Operations Admin',
  'Startup Operations',
  'Mentor Operations',
  'Investor Operations',
  'ESP Operations',
  'Finance Admin',
  'Billing Admin',
  'Compliance Admin',
  'Content Moderator',
  'Support Agent',
  'Read-Only Auditor',
  'Security Admin',
  'System Administrator',
];

export const AdminSystemView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'team' | 'flags' | 'health' | 'audit' | 'config'>('team');
  const [teamMembers] = useState<AdminTeamMember[]>(ADMIN_TEAM_MEMBERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [config, setConfig] = useState<PlatformConfig>(INITIAL_PLATFORM_CONFIG);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live Session & Domain Store
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession());
  const [featureFlags, setFeatureFlags] = useState<AdminFeatureFlag[]>(() => adminDomainService.getFeatureFlags());
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealthService[]>(() => adminDomainService.getSystemHealth());

  // Maintenance Mode States
  const [maintenanceState, setMaintenanceStateLocal] = useState<MaintenanceState>({ isActive: false, reason: '' });
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState('');
  const [maintenanceEtaInput, setMaintenanceEtaInput] = useState('');

  useEffect(() => {
    const current = getMaintenanceState();
    setMaintenanceStateLocal(current);
    if (current.isActive) {
      setConfig((prev) => ({ ...prev, maintenanceMode: true }));
    }

    const handleUpdate = () => {
      setFeatureFlags(adminDomainService.getFeatureFlags());
      setSystemHealth(adminDomainService.getSystemHealth());
    };
    const handleSessionChanged = () => {
      setSession(getAdminSession());
    };

    window.addEventListener('xentro-admin-updated', handleUpdate);
    window.addEventListener('xentro-admin-session-changed', handleSessionChanged);
    return () => {
      window.removeEventListener('xentro-admin-updated', handleUpdate);
      window.removeEventListener('xentro-admin-session-changed', handleSessionChanged);
    };
  }, []);

  const handleRoleSwitch = (newRole: AdminRole) => {
    const updated = switchAdminRole(newRole);
    if (updated) {
      setSession(updated);
      showToast(`Switched active role to "${newRole}" (${updated.permissions.length} permissions active)`);
    }
  };

  const handleToggleFeatureFlag = (flagId: string) => {
    adminDomainService.toggleFeatureFlag(flagId);
    setFeatureFlags(adminDomainService.getFeatureFlags());
    showToast('Platform feature flag state updated and recorded in audit log');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleApplyMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const session = getAdminSession();
    const nextState: MaintenanceState = {
      isActive: true,
      reason: maintenanceReasonInput.trim() || 'Scheduled infrastructure upgrade and core service optimization. Service will resume shortly.',
      scheduledEnd: maintenanceEtaInput.trim() || 'Approximately 30-45 minutes',
      activatedAt: new Date().toISOString(),
      activatedBy: session?.name || 'Super Admin',
    };
    setMaintenanceState(nextState);
    setMaintenanceStateLocal(nextState);
    setConfig((prev) => ({ ...prev, maintenanceMode: true }));
    setMaintenanceModalOpen(false);

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      adminName: session?.name || 'Super Admin',
      employeeId: session?.employeeId || '9911223',
      action: 'MAINTENANCE_MODE_ACTIVATED',
      module: 'Platform Operations',
      details: `Closed web for temporary maintenance. Context reason: "${nextState.reason}"`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '103.24.12.89',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast('Web maintenance mode enabled! Context reason broadcast to website.');
  };

  const handleDeactivateMaintenance = () => {
    const session = getAdminSession();
    clearMaintenanceState();
    setMaintenanceStateLocal({ isActive: false, reason: '' });
    setConfig((prev) => ({ ...prev, maintenanceMode: false }));

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      adminName: session?.name || 'Super Admin',
      employeeId: session?.employeeId || '9911223',
      action: 'MAINTENANCE_MODE_DEACTIVATED',
      module: 'Platform Operations',
      details: 'Deactivated maintenance mode. Web platform reopened to public.',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '103.24.12.89',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast('Web platform reopened to all ecosystem members.');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const session = getAdminSession();
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      adminName: session?.name || 'Super Admin',
      employeeId: session?.employeeId || '9911223',
      action: 'PLATFORM_CONFIG_UPDATED',
      module: 'System Configuration',
      details: `Saved platform parameters. Maintenance=${config.maintenanceMode}, Commission=${config.mentorCommissionRatePercent}%`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '103.24.12.89',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast('Platform configurations applied and audited');
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditModuleFilter !== 'All' && log.module !== auditModuleFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.adminName.toLowerCase().includes(q) ||
        log.employeeId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const permissionsMatrix: {
    role: AdminRole;
    permissions: string[];
  }[] = [
    {
      role: 'Super Admin',
      permissions: ['All Permissions', 'Database Access', 'RBAC Management', 'Security Config', 'Financial Payouts'],
    },
    {
      role: 'Operations Admin',
      permissions: ['User Management', 'Opportunities Curation', 'Feed Moderation', 'Activity Logs'],
    },
    {
      role: 'Verification Admin',
      permissions: ['KYC Dossier Review', 'Accreditation Badges', 'Document Vault', 'User Directory'],
    },
    {
      role: 'Opportunities Manager',
      permissions: ['Grants & Challenges', 'AI Scraper Review', 'Publish Listings'],
    },
  ];

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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Governance & Architecture Controls</span>
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            System Settings, RBAC & Audit Logs
          </h2>
          <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1 max-w-2xl">
            Control administrative personnel roles, examine immutable system activity logs, and configure global platform engine parameters.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
          <button
            onClick={() => setActiveSection('team')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'team'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Admin Team & RBAC
          </button>
          <button
            onClick={() => setActiveSection('flags')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'flags'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Feature Flags ({featureFlags.length})
          </button>
          <button
            onClick={() => setActiveSection('health')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'health'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            System Health ({systemHealth.length})
          </button>
          <button
            onClick={() => setActiveSection('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'audit'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSection('config')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSection === 'config'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Global Configuration
          </button>
        </div>
      </div>

      {/* SECTION 1: ADMIN TEAM & RBAC */}
      {activeSection === 'team' && (
        <div className="space-y-6">
          {/* Live Admin Role Switcher & Security Evaluator */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#181B1A] to-[#121413] border border-[#D9FF3F]/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262A29] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9FF3F]/15 text-[#D9FF3F] flex items-center justify-center border border-[#D9FF3F]/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sora text-sm font-bold text-white">
                      Live Role Switcher & Permission Evaluator
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D9FF3F] text-black">
                      INTERACTIVE TEST BED
                    </span>
                  </div>
                  <p className="text-xs text-[#8E9390]">
                    Simulate administrative personnel roles in real-time to test fine-grained RBAC and permission gating
                  </p>
                </div>
              </div>

              {/* Active Admin Session Status */}
              <div className="flex items-center gap-3 bg-[#202422] p-2.5 rounded-xl border border-[#262A29]">
                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {session?.name || 'Authorized Admin'}
                  </div>
                  <div className="text-[10px] font-mono text-[#8E9390]">
                    ID: #{session?.employeeId || '9922953'} • {session?.role || 'Super Admin'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Switch Buttons & Full Role Dropdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 block">
                  Select Active Admin Role:
                </label>
                <select
                  value={session?.role || 'Super Admin'}
                  onChange={(e) => handleRoleSwitch(e.target.value as AdminRole)}
                  className="w-full h-10 px-3 rounded-xl bg-[#202422] border border-[#262A29] text-xs font-bold text-[#D9FF3F] focus:border-[#D9FF3F] outline-hidden cursor-pointer"
                >
                  {ALL_CANONICAL_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#181B1A] text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 block">
                  Quick Role Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { r: 'Super Admin' as AdminRole, label: 'Super Admin (All 36)' },
                    { r: 'Identity Verification Admin' as AdminRole, label: 'Identity KYC Admin (Restricted Review)' },
                    { r: 'Operations Admin' as AdminRole, label: 'Operations Admin (General)' },
                    { r: 'Finance Admin' as AdminRole, label: 'Finance & Billing' },
                    { r: 'Read-Only Auditor' as AdminRole, label: 'Read-Only Auditor' },
                  ].map((preset) => (
                    <button
                      key={preset.r}
                      onClick={() => handleRoleSwitch(preset.r)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        session?.role === preset.r
                          ? 'bg-[#D9FF3F] text-black shadow-md'
                          : 'bg-[#202422] hover:bg-[#262A29] text-gray-300 border border-[#262A29]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Permission Evaluator Status Banner */}
            <div className="p-3.5 rounded-xl bg-[#121413] border border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#D9FF3F]" />
                <span className="text-gray-300">
                  Active Permissions Granted:{' '}
                  <strong className="text-white font-mono">{session?.permissions?.length || 0} / 36</strong>
                </span>
              </div>

              {/* Crucial Section 5 test indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8E9390]">identity_verification.review:</span>
                {session?.permissions?.includes('identity_verification.review') ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    GRANTED (CAN REVIEW AADHAAR / KYC)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <Lock className="w-3 h-3" />
                    RESTRICTED (BLOCKED IN VERIFICATION CENTRE)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Team Members Table */}
          <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
              <div>
                <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                  Active Administrative Personnel
                </h3>
                <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                  Authorized personnel with cryptographic credentials and Employee ID authentication
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#151716] text-[11px] font-mono uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    <th className="py-3 px-4">Admin Name</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Role Assigned</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-xs">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#262A29]">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#101212] dark:text-white block">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-[#101212] dark:text-white">
                        #{member.employeeId}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30">
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#565B59] dark:text-gray-300">
                        {member.department}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {member.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                        {member.lastLogin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular RBAC Permissions Matrix */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
            <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#D9FF3F]" />
              <span>Role-Based Access Control (RBAC) Matrix</span>
            </h3>
            <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
              Operational privileges granted per functional administrative role
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {permissionsMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#101212] dark:text-white">
                      {item.role}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                      Enforced
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.permissions.map((p, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 text-[#4A504D] dark:text-gray-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: FEATURE FLAGS & KILL SWITCHES */}
      {activeSection === 'flags' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Runtime Control Plane</span>
              </div>
              <h3 className="font-sora text-lg font-bold text-[#101212] dark:text-white">
                Global Feature Flags & Kill Switches
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1 max-w-2xl">
                Dynamic architectural flags allowing instant enabling, disabling, and emergency kill-switching of core platform subsystems without redeployment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                Active Flags:{' '}
                <strong className="text-emerald-700 dark:text-[#D9FF3F] font-mono">
                  {featureFlags.filter((f) => f.isEnabled).length} / {featureFlags.length}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureFlags.map((flag) => (
              <div
                key={flag.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4 hover:border-[#D9FF3F]/30 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-sora text-sm font-bold text-[#101212] dark:text-white">
                        {flag.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-100 dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390] border border-gray-200 dark:border-[#262A29]">
                        {flag.targetAudience}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 block font-semibold">
                      {flag.key}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFeatureFlag(flag.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      flag.isEnabled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                    }`}
                  >
                    {flag.isEnabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>ENABLED</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                        <span>DISABLED</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#8E9390] leading-relaxed">
                  {flag.description}
                </p>

                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                  <span>Updated by: <strong className="text-[#101212] dark:text-white">{flag.updatedBy}</strong></span>
                  <span className="font-mono">{flag.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: SYSTEM HEALTH & TELEMETRY */}
      {activeSection === 'health' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
                <Activity className="w-3.5 h-3.5" />
                <span>Microservice Telemetry</span>
              </div>
              <h3 className="font-sora text-lg font-bold text-[#101212] dark:text-white">
                Platform Infrastructure & Service Mesh Health
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1 max-w-2xl">
                Continuous synthetic health probes monitoring database clusters, payment webhooks, tokenization vaults, and AI pipelines.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSystemHealth(adminDomainService.getSystemHealth());
                showToast('Telemetry refreshed from live microservices');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.map((svc, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#202422] flex items-center justify-center text-[#D9FF3F] border border-[#262A29]">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-sora text-xs font-bold text-[#101212] dark:text-white">
                        {svc.service}
                      </h4>
                      <span className="text-[10px] text-[#8E9390]">Checked {svc.lastChecked}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {svc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
                    <span className="text-[10px] text-[#8E9390] block">Latency</span>
                    <span className="text-xs font-bold font-mono text-[#101212] dark:text-[#D9FF3F]">
                      {svc.latencyMs} ms
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
                    <span className="text-[10px] text-[#8E9390] block">Uptime (30d)</span>
                    <span className="text-xs font-bold font-mono text-emerald-500">
                      {svc.uptimePercent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: IMMUTABLE AUDIT LOGS */}
      {activeSection === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter by admin, action code, or details..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
              >
                <option value="All">All Modules</option>
                <option value="Verification Center">Verification Center</option>
                <option value="Moderation & Safety">Moderation & Safety</option>
                <option value="Opportunities Engine">Opportunities Engine</option>
                <option value="Finance & Config">Finance & Config</option>
              </select>

              <button
                onClick={() => alert('Exporting cryptographic Audit Trail CSV...')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#151716] text-[11px] font-mono uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admin Officer</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-xs font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                      <td className="py-3 px-4 text-[#6E7370] dark:text-[#8E9390] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4 font-sans font-semibold text-[#101212] dark:text-white">
                        {log.adminName}
                        <span className="block text-[10px] font-mono text-[#6E7370] dark:text-[#8E9390]">
                          #{log.employeeId}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans text-gray-500 dark:text-gray-400">
                        {log.module}
                      </td>

                      <td className="py-3 px-4 font-sans text-[#101212] dark:text-gray-200 max-w-xs truncate">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-[#6E7370] dark:text-[#8E9390]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: GLOBAL CONFIGURATION */}
      {activeSection === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {/* Temporary Web Maintenance Control Panel */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              maintenanceState.isActive
                ? 'bg-amber-500/10 border-amber-500/40 dark:border-amber-500/30 shadow-md'
                : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    maintenanceState.isActive
                      ? 'bg-amber-500 text-black font-bold animate-pulse shadow-xs'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390]'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                      Temporary App & Web Maintenance Closure
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        maintenanceState.isActive
                          ? 'bg-amber-500 text-black'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {maintenanceState.isActive ? 'Maintenance Mode Active' : 'Web Public & Live'}
                    </span>
                  </div>

                  <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                    Temporarily pause public user interactions and display an official context notice explaining why maintenance is taking place.
                  </p>

                  {maintenanceState.isActive && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-amber-500/30 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px] uppercase font-mono">
                        <Info className="w-3.5 h-3.5" />
                        <span>Live Broadcast Context Notice on Web:</span>
                      </div>
                      <p className="text-[#101212] dark:text-white font-semibold leading-relaxed">
                        "{maintenanceState.reason}"
                      </p>
                      {maintenanceState.scheduledEnd && (
                        <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] font-mono">
                          Estimated Resumption: <strong>{maintenanceState.scheduledEnd}</strong> &bull; Activated by {maintenanceState.activatedBy || 'Super Admin'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                {maintenanceState.isActive ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMaintenanceReasonInput(maintenanceState.reason);
                        setMaintenanceEtaInput(maintenanceState.scheduledEnd || '');
                        setMaintenanceModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white border border-gray-200 dark:border-gray-700 transition-all"
                    >
                      Update Context Message
                    </button>
                    <button
                      type="button"
                      onClick={handleDeactivateMaintenance}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reopen Web Platform</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceReasonInput(
                        'Scheduled infrastructure upgrade and core service optimization. Service will resume shortly.'
                      );
                      setMaintenanceEtaInput('Approximately 30-45 minutes');
                      setMaintenanceModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Close Web for Maintenance</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-6">
            <div>
              <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D9FF3F]" />
                <span>Global Platform Switches & Engine Parameters</span>
              </h3>
              <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                Live toggle platform features and configure financial commission ceilings
              </p>
            </div>

            {/* Toggle Switches Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Maintenance Mode
                  </span>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Temporarily restricts non-admin public access
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-[#D9FF3F] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Allow New Registrations
                  </span>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Permits startups, mentors, investors to register
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.newRegistrationsAllowed}
                  onChange={(e) => setConfig({ ...config, newRegistrationsAllowed: e.target.checked })}
                  className="w-5 h-5 accent-[#D9FF3F] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    AI Scraping Queue Active
                  </span>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Auto-ingest national grants and fellowships nightly
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.aiScrapingQueueActive}
                  onChange={(e) => setConfig({ ...config, aiScrapingQueueActive: e.target.checked })}
                  className="w-5 h-5 accent-[#D9FF3F] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Auto KYC Pre-Check
                  </span>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    AI scans documents for validity before reviewer queue
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoVerificationPrecheck}
                  onChange={(e) => setConfig({ ...config, autoVerificationPrecheck: e.target.checked })}
                  className="w-5 h-5 accent-[#D9FF3F] cursor-pointer"
                />
              </div>
            </div>

            {/* Numeric Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Mentor Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={config.mentorCommissionRatePercent}
                  onChange={(e) =>
                    setConfig({ ...config, mentorCommissionRatePercent: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Startup Pro Monthly Fee ($)
                </label>
                <input
                  type="number"
                  value={config.startupProMonthlyPriceUSD}
                  onChange={(e) =>
                    setConfig({ ...config, startupProMonthlyPriceUSD: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Max Pitch Video Duration (Min)
                </label>
                <input
                  type="number"
                  value={config.maxPitchVideoDurationMinutes}
                  onChange={(e) =>
                    setConfig({ ...config, maxPitchVideoDurationMinutes: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Max File Upload Limit (MB)
                </label>
                <input
                  type="number"
                  value={config.maxFileUploadSizeMB}
                  onChange={(e) =>
                    setConfig({ ...config, maxFileUploadSizeMB: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Configurations</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Temporary Maintenance Configuration & Context Modal */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                    Temporary Web Maintenance Setup
                  </h4>
                  <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                    Broadcast a context notice to all web visitors
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMaintenanceModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Context Reason Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-[#101212] dark:text-white block">
                Quick Reason Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Scheduled infrastructure upgrade and database optimization.',
                  'Emergency security patch & integrity audit in progress.',
                  'Platform payment escrow engine performance scaling.',
                  'Upgrading matching algorithm & AI opportunity ingestion cluster.',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMaintenanceReasonInput(preset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#565B59] dark:text-gray-300 transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <form onSubmit={handleApplyMaintenance} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Why Maintenance? Context Message for Users <span className="text-amber-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={maintenanceReasonInput}
                  onChange={(e) => setMaintenanceReasonInput(e.target.value)}
                  placeholder="Explain why the web is closing for maintenance..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Estimated Downtime / Resumption ETA
                </label>
                <input
                  type="text"
                  value={maintenanceEtaInput}
                  onChange={(e) => setMaintenanceEtaInput(e.target.value)}
                  placeholder="e.g. 30-45 minutes or 11:30 PM UTC"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E7370] dark:text-[#8E9390] hover:bg-black/5 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black transition-colors shadow-xs cursor-pointer"
                >
                  Confirm & Broadcast Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
