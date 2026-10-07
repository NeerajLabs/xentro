'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Building2,
  Lock,
  Bell,
  Shield,
  Save,
  KeyRound,
  Smartphone,
  Laptop,
  Trash2,
  Check,
  Eye,
  Sliders,
  Users,
  UserPlus,
  ArrowRightLeft,
  ShieldCheck,
  Award,
  X,
  Plus,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  StartupEntityMember,
  StartupEntityRole,
  StartupInvitation,
} from '@/types/startup';
import {
  getStartupMembers,
  getStartupInvitations,
  inviteStartupMember,
  updateMemberRole,
  removeStartupMember,
  transferStartupOwnership,
  STARTUP_ROLES,
  STARTUP_ROLE_DESCRIPTIONS,
} from '@/lib/startupDomainService';
import {
  getStartupGhostMode,
  setStartupGhostMode,
  getStartupPrivacySettings,
  saveStartupPrivacySettings,
  StartupPrivacySettings,
  getStartupOverallVisibility,
  setStartupOverallVisibility,
  StartupOverallVisibility,
} from '@/lib/startupProfileState';

export const StartupSettings: React.FC = () => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'account' | 'startup' | 'privacy' | 'notifications' | 'security'>('account');

  // Account states
  const [accountForm, setAccountForm] = useState(() => {
    let name = 'Founder';
    let email = 'founder@xentro.ai';
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
        if (stored) {
          const p = JSON.parse(stored);
          if (p.name) name = p.name;
          if (p.email) email = p.email;
        }
      } catch (_) {}
    }
    return {
      founderName: name,
      email,
      phone: '+91 98765 43210',
      title: 'Founder & CEO',
    };
  });

  // Entity Member Management & RBAC states (Sections 10, 11, 12)
  const [members, setMembers] = useState<StartupEntityMember[]>([]);
  const [invitations, setInvitations] = useState<StartupInvitation[]>([]);

  // Member management modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StartupEntityRole>('Team Member');

  const [selectedMemberForRoleChange, setSelectedMemberForRoleChange] = useState<StartupEntityMember | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<StartupEntityRole>('Team Member');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [successorMemberId, setSuccessorMemberId] = useState('');
  const [isPermissionsMatrixOpen, setIsPermissionsMatrixOpen] = useState(false);

  // Privacy toggles & Visibility Modes
  const [overallVisibility, setOverallVisibility] = useState<StartupOverallVisibility>(getStartupOverallVisibility());
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [isGhostConfirmOpen, setIsGhostConfirmOpen] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<StartupPrivacySettings>({
    visibility: 'Public',
    isGhostMode: false,
    pitchDeck: 'Approved Users',
    finances: 'Connections Only',
    fundingDetails: 'Public',
    contactInfo: 'Connections Only',
    teamInfo: 'Public',
    ddLocker: 'Restricted',
  });

  React.useEffect(() => {
    setIsGhostMode(getStartupGhostMode());
    setOverallVisibility(getStartupOverallVisibility());
    setPrivacySettings(getStartupPrivacySettings());
    setMembers(getStartupMembers());
    setInvitations(getStartupInvitations());

    const handleMembersChanged = () => {
      setMembers(getStartupMembers());
      setInvitations(getStartupInvitations());
    };
    window.addEventListener('xentro-startup-members-changed', handleMembersChanged);

    const handleGhostChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.isGhostMode !== undefined) {
        setIsGhostMode(ce.detail.isGhostMode);
        if (ce.detail.isGhostMode) {
          setOverallVisibility('Ghost Mode');
        }
      }
    };
    const handleVisibilityChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.visibility) {
        setOverallVisibility(ce.detail.visibility);
        setIsGhostMode(ce.detail.visibility === 'Ghost Mode');
      }
    };
    const handlePrivacyChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.settings) {
        setPrivacySettings(ce.detail.settings);
        if (ce.detail.settings.isGhostMode !== undefined) {
          setIsGhostMode(ce.detail.settings.isGhostMode);
        }
        if (ce.detail.settings.visibility) {
          setOverallVisibility(ce.detail.settings.visibility);
        }
      }
    };
    window.addEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    window.addEventListener('xentro-visibility-changed', handleVisibilityChanged);
    window.addEventListener('xentro-privacy-settings-changed', handlePrivacyChanged);
    return () => {
      window.removeEventListener('xentro-startup-members-changed', handleMembersChanged);
      window.removeEventListener('xentro-ghost-mode-changed', handleGhostChanged);
      window.removeEventListener('xentro-visibility-changed', handleVisibilityChanged);
      window.removeEventListener('xentro-privacy-settings-changed', handlePrivacyChanged);
    };
  }, []);

  // Notification toggles
  const [notifPreferences, setNotifPreferences] = useState({
    messages: true,
    connections: true,
    opportunities: true,
    investorActivity: true,
    askResponses: true,
    mentorship: true,
    ddLocker: true,
  });

  // Security states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess_1', device: 'MacBook Pro 16" (Sonoma)', location: 'Bengaluru, India', ip: '103.21.144.12', current: true },
    { id: 'sess_2', device: 'iPhone 15 Pro Max', location: 'Bengaluru, India', ip: '103.21.144.98', current: false },
  ]);

  const handleSave = () => {
    showToast('Settings saved successfully!', 'success');
  };

  const handleRevokeSession = (id: string) => {
    setActiveSessions(activeSessions.filter((s) => s.id !== id));
    showToast('Session revoked', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#D9FF3F]" />
              <span>Startup & Account Control Settings</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              SOC2 Compliant Controls
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage founder authentication, team access roles, privacy disclosure tiers, and 2FA security.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('account')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'account'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account</span>
        </button>

        <button
          onClick={() => setActiveSection('startup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'startup'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Team Roles & Permissions</span>
        </button>

        <button
          onClick={() => setActiveSection('privacy')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'privacy'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy & Disclosures</span>
        </button>

        <button
          onClick={() => setActiveSection('notifications')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'notifications'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'security'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security & Sessions</span>
        </button>
      </div>

      {/* SECTION 1: ACCOUNT */}
      {activeSection === 'account' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white">Founder Account Details</h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Official login credentials and ecosystem contact email.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">Full Name</label>
              <input
                type="text"
                value={accountForm.founderName}
                onChange={(e) => setAccountForm({ ...accountForm, founderName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">Official Work Email</label>
              <input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={accountForm.phone}
                onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">Founder Title</label>
              <input
                type="text"
                value={accountForm.title}
                onChange={(e) => setAccountForm({ ...accountForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STARTUP TEAM PERMISSIONS & RBAC (Sections 10, 11, 12) */}
      {activeSection === 'startup' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                    <Users className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Startup Entity Members & RBAC</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {members.length} Verified Members
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Access is strictly role-and-permission based. Every member authenticates using their own Personal Account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermissionsMatrixOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Permissions Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Ownership</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>
            </div>

            {/* Privacy Architecture Notice (Section 11) */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Identity Document Exposure:</strong> Entity members NEVER receive access to another member&apos;s Aadhaar, government records, or personal login credentials.
              </span>
            </div>

            {/* Active Members Table / Cards */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                Active Entity Members ({members.length})
              </h4>
              <div className="space-y-2.5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-[#262A29] shrink-0">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                            {member.name}
                          </h4>
                          {member.isOwner && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
                              Primary Owner
                            </span>
                          )}
                          {member.personalAccountVerified && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Personal Account Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                          {member.title} &bull; {member.email} &bull; Joined {member.joinedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white">
                        {member.role}
                      </span>
                      {!member.isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForRoleChange(member);
                              setNewSelectedRole(member.role);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-[#282D2B] hover:bg-gray-300 text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
                          >
                            Change Role
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                removeStartupMember(member.id);
                                setMembers(getStartupMembers());
                                showToast(`Removed ${member.name} from entity workspace.`, 'info');
                              } catch (err: unknown) {
                                const errorMsg = err instanceof Error ? err.message : 'Failed to remove member.';
                                showToast(errorMsg, 'error');
                              }
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  Pending Invitations ({invitations.length})
                </h4>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#101212] dark:text-white">{inv.email}</span>
                        <span className="text-[#565B59] dark:text-[#B6B8B7] ml-2">
                          Invited as <strong>{inv.role}</strong> &bull; {inv.expiresAt}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: PRIVACY & DISCLOSURE */}
      {activeSection === 'privacy' && (
        <div className="space-y-5 animate-fade-slide">
          {/* Ghost Mode Active Warning Banner */}
          {isGhostMode && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    Ghost Mode Active
                  </h4>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                    Your Startup Profile is currently hidden from discovery.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStartupGhostMode(false);
                  setIsGhostMode(false);
                  setOverallVisibility('Public');
                  showToast('Your Startup Profile is now Public and discoverable across Xentro!', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs self-start sm:self-auto"
              >
                Make Profile Public
              </button>
            </div>
          )}

          {/* Ecosystem Overall Profile Visibility Tier Card (Section 13) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Ecosystem Profile Visibility Tier</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  overallVisibility === 'Ghost Mode'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : overallVisibility === 'Private'
                    ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400'
                    : overallVisibility === 'Limited'
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {overallVisibility}
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                Choose how your startup profile is discovered, matched, and surfaced to investors, mentors, and incubators across Xentro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'Public' as StartupOverallVisibility,
                  title: 'Public',
                  desc: 'Search, Explore, Recommendations, and Matching fully enabled. Direct URL accessible to all.',
                  color: 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20',
                  badge: 'bg-emerald-500 text-white',
                },
                {
                  id: 'Limited' as StartupOverallVisibility,
                  title: 'Limited',
                  desc: 'Discoverable in Search/Explore. Detailed pitch, financials, and DD locker are gated until connected.',
                  color: 'border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20',
                  badge: 'bg-blue-500 text-white',
                },
                {
                  id: 'Private' as StartupOverallVisibility,
                  title: 'Private',
                  desc: 'Hidden from general discovery. Accessible only via direct URL to verified connections and partners.',
                  color: 'border-purple-500/40 bg-purple-50/30 dark:bg-purple-950/20',
                  badge: 'bg-purple-500 text-white',
                },
                {
                  id: 'Ghost Mode' as StartupOverallVisibility,
                  title: 'Ghost Mode',
                  desc: 'Stealth mode. Completely omitted from all search, explore, and matching. Direct URL shows unavailable.',
                  color: 'border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20',
                  badge: 'bg-amber-500 text-white',
                },
              ].map((tier) => {
                const isSelected = overallVisibility === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => {
                      if (tier.id === 'Ghost Mode') {
                        setIsGhostConfirmOpen(true);
                      } else {
                        setStartupOverallVisibility(tier.id);
                        setOverallVisibility(tier.id);
                        setIsGhostMode(false);
                        showToast(`Startup profile visibility updated to ${tier.title}`, 'success');
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${
                      isSelected
                        ? `${tier.color} ring-2 ring-[#D9FF3F] shadow-sm`
                        : 'border-gray-200 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${tier.badge}`} />
                        <span>{tier.title}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {tier.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghost Mode (Profile Discoverability) Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-amber-500" />
                    <span>Profile Discoverability (Ghost Mode)</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isGhostMode
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isGhostMode ? 'Ghost Mode Active' : 'Public Profile'}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-xl leading-relaxed">
                  When Ghost Mode is enabled, your Startup Profile will not appear in Search, Explore, Recommendations, or discovery modules. You can continue using your Dashboard, Messages, and Opportunities normally.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isGhostMode ? (
                  <button
                    onClick={() => {
                      setStartupGhostMode(false);
                      setIsGhostMode(false);
                      showToast('Ghost Mode disabled. Your profile is now Public across Xentro.', 'success');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    Make Profile Public
                  </button>
                ) : (
                  <button
                    onClick={() => setIsGhostConfirmOpen(true)}
                    className="px-4 py-2 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Enable Ghost Mode
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Field-Level Privacy Settings Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white">Field-Level Privacy Controls</h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Control access to specific sensitive data points on your public profile independently of Ghost Mode.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'pitchDeck', label: 'Pitch Deck Presentation', desc: 'Who can view your slide deck without prior approval.' },
                { key: 'finances', label: 'Financial MRR & Runway', desc: 'Who can view detailed metrics and growth projections.' },
                { key: 'fundingDetails', label: 'Funding Ask & Valuation Cap', desc: 'Visibility of target amount and round instrument.' },
                { key: 'contactInfo', label: 'Founder Direct Contact', desc: 'Direct phone number and corporate email address.' },
                { key: 'teamInfo', label: 'Team Member List & Open Asks', desc: 'Public listing of founders, advisors, and open roles.' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">{item.label}</h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{item.desc}</p>
                  </div>
                  <select
                    value={(privacySettings as any)[item.key]}
                    onChange={(e) => {
                      const updated = { ...privacySettings, [item.key]: e.target.value };
                      setPrivacySettings(updated as any);
                      saveStartupPrivacySettings(updated as any);
                      showToast(`Updated ${item.label} to ${e.target.value}`, 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white self-start sm:self-auto"
                  >
                    <option value="Public">Public</option>
                    <option value="Connections Only">Connections Only</option>
                    <option value="Approved Users">Approved Users</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              ))}

              {/* DD Locker Access Control */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">Due Diligence Data Room (DD Locker)</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">Public state of data room documents and access application flow.</p>
                </div>
                <select
                  value={privacySettings.ddLocker}
                  onChange={(e) => {
                    const updated = { ...privacySettings, ddLocker: e.target.value as any };
                    setPrivacySettings(updated);
                    saveStartupPrivacySettings(updated);
                    showToast(`Updated DD Locker policy to ${e.target.value}`, 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white self-start sm:self-auto"
                >
                  <option value="Restricted">Restricted (Requires Access Request)</option>
                  <option value="Approved Users">Approved Users Only (Mutual NDA)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: NOTIFICATION PREFERENCES */}
      {activeSection === 'notifications' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white">Push & Email Notification Channels</h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Select alerts you wish to receive instantly on mobile and desktop.</p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'messages', label: 'Direct Messages & Call Invites', desc: 'When investors or mentors initiate a conversation.' },
              { key: 'connections', label: 'Connection Requests', desc: 'When an ecosystem stakeholder invites you to connect.' },
              { key: 'opportunities', label: 'New Matched Grants & Accelerators', desc: 'When high-matching programs open applications.' },
              { key: 'investorActivity', label: 'Investor Deck Views', desc: 'When institutional investors review your profile.' },
              { key: 'askResponses', label: 'Responses to Active Asks', desc: 'When a term sheet or mentorship offer arrives.' },
              { key: 'ddLocker', label: 'DD Locker Requests', desc: 'When someone requests data room document access.' },
            ].map((item) => (
              <label
                key={item.key}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">{item.label}</h4>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(notifPreferences as any)[item.key]}
                  onChange={(e) => {
                    setNotifPreferences({ ...notifPreferences, [item.key]: e.target.checked });
                    showToast(`${item.label} notification preference updated`, 'info');
                  }}
                  className="w-5 h-5 accent-[#D9FF3F] rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: SECURITY & SESSIONS */}
      {activeSection === 'security' && (
        <div className="space-y-6 animate-fade-slide">
          {/* 2FA */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Protect sensitive corporate due diligence docs with Authenticator app codes.</p>
              </div>

              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  showToast(!twoFactorEnabled ? '2FA Enabled with TOTP' : '2FA Disabled', !twoFactorEnabled ? 'success' : 'info');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  twoFactorEnabled
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[#D9FF3F] text-[#101212]'
                }`}
              >
                {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#D9FF3F]" />
                <span>Active Browser & Device Sessions</span>
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Devices currently logged in with founder executive access.</p>
            </div>

            <div className="space-y-3">
              {activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">{sess.device}</h4>
                      {sess.current && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {sess.location} &bull; IP: {sess.ip}
                    </p>
                  </div>

                  {!sess.current && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-500/30 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ghost Mode Confirmation Modal */}
      {isGhostConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <EyeOff className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#101212] dark:text-white font-heading">
                Enable Ghost Mode?
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Your Startup Profile will be hidden from Xentro Search, Explore, Recommendations, and discovery features. You will still be able to use your Dashboard, Messages, Opportunities, and other Xentro features.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsGhostConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartupGhostMode(true);
                  setIsGhostMode(true);
                  setIsGhostConfirmOpen(false);
                  showToast('Ghost Mode enabled. Your profile is now hidden from discovery.', 'info');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Enable Ghost Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVITE MEMBER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9FF3F] bg-[#D9FF3F]/20 px-2.5 py-0.5 rounded-full">
                Entity Membership
              </span>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-display">
                Invite Member to Venture
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Invitee must authenticate with their own Personal Account to accept.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                inviteStartupMember(inviteEmail, inviteRole, accountForm.founderName);
                setInvitations(getStartupInvitations());
                setIsInviteModalOpen(false);
                setInviteEmail('');
                showToast(`Invitation sent to ${inviteEmail} as ${inviteRole}!`, 'success');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Member Work Email
                </label>
                <input
                  type="email"
                  placeholder="collaborator@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Assigned Entity Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StartupEntityRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                >
                  {(['Admin', 'Finance', 'Operations', 'Team Member', 'Advisor', 'Viewer'] as StartupEntityRole[]).map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-[#181B1A]">
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1.5 leading-relaxed">
                  {STARTUP_ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE MEMBER ROLE */}
      {selectedMemberForRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedMemberForRoleChange(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-display">
                Modify Role for {selectedMemberForRoleChange.name}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Current role: <strong>{selectedMemberForRoleChange.role}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                Select New Role
              </label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as StartupEntityRole)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              >
                {(['Admin', 'Finance', 'Operations', 'Team Member', 'Advisor', 'Viewer'] as StartupEntityRole[]).map((r) => (
                  <option key={r} value={r} className="bg-white dark:bg-[#181B1A]">
                    {r}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                {STARTUP_ROLE_DESCRIPTIONS[newSelectedRole]}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setSelectedMemberForRoleChange(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    updateMemberRole(selectedMemberForRoleChange.id, newSelectedRole);
                    setMembers(getStartupMembers());
                    setSelectedMemberForRoleChange(null);
                    showToast(`Updated role for ${selectedMemberForRoleChange.name} to ${newSelectedRole}.`, 'success');
                  } catch (err: unknown) {
                    const errorMsg = err instanceof Error ? err.message : 'Failed to update role.';
                    showToast(errorMsg, 'error');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER OWNERSHIP (Section 12) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-display">
                Transfer Primary Venture Ownership
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                Ownership confers highest entity authority, billing management, and administrative control.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
              <strong>Section 12 Enforcement:</strong> The final Owner cannot leave without transferring ownership to another verified personal account.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                Select Successor Owner
              </label>
              <select
                value={successorMemberId}
                onChange={(e) => setSuccessorMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
              >
                <option value="">-- Choose verified member --</option>
                {members
                  .filter((m) => !m.isOwner)
                  .map((m) => (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-[#181B1A]">
                      {m.name} ({m.role} &bull; {m.title})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!successorMemberId}
                onClick={() => {
                  const currentOwner = members.find((m) => m.isOwner);
                  if (!currentOwner) return;
                  const res = transferStartupOwnership(currentOwner.id, successorMemberId);
                  if (res.success) {
                    setMembers(getStartupMembers());
                    setIsTransferModalOpen(false);
                    showToast(res.message, 'success');
                  } else {
                    showToast(res.message, 'error');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Confirm Ownership Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMISSIONS MATRIX (Section 11) */}
      {isPermissionsMatrixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col relative">
            <button
              onClick={() => setIsPermissionsMatrixOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-display flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span>Role Permissions Matrix</span>
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Granular security authority mapped across 8 permission categories.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#262A29] font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    <th className="pb-2">Permission Category</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Admin</th>
                    <th className="pb-2">Finance</th>
                    <th className="pb-2">Ops</th>
                    <th className="pb-2">Team</th>
                    <th className="pb-2">Advisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                  {[
                    { category: 'Entity (View/Edit/Archive)', owner: true, admin: true, fin: false, ops: false, team: false, adv: false },
                    { category: 'Members & Roles', owner: true, admin: true, fin: false, ops: false, team: false, adv: false },
                    { category: 'Ownership Transfer', owner: true, admin: false, fin: false, ops: false, team: false, adv: false },
                    { category: 'Profile & Pitch Editor', owner: true, admin: true, fin: false, ops: true, team: false, adv: false },
                    { category: 'Financials & Valuation', owner: true, admin: true, fin: true, ops: false, team: false, adv: true },
                    { category: 'Xentro SaaS Billing', owner: true, admin: true, fin: true, ops: false, team: false, adv: false },
                    { category: 'DD Locker Management', owner: true, admin: true, fin: true, ops: true, team: true, adv: false },
                    { category: 'Content & Updates', owner: true, admin: true, fin: false, ops: true, team: true, adv: false },
                    { category: 'Opportunities & Grants', owner: true, admin: true, fin: false, ops: true, team: true, adv: false },
                    { category: 'Analytics & Reporting', owner: true, admin: true, fin: true, ops: true, team: false, adv: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                      <td className="py-2.5 font-semibold text-[#101212] dark:text-white">{row.category}</td>
                      <td className="py-2.5 text-emerald-500 font-bold">✓</td>
                      <td className="py-2.5 font-bold">{row.admin ? '✓' : '—'}</td>
                      <td className="py-2.5 font-bold">{row.fin ? '✓' : '—'}</td>
                      <td className="py-2.5 font-bold">{row.ops ? '✓' : '—'}</td>
                      <td className="py-2.5 font-bold">{row.team ? '✓' : '—'}</td>
                      <td className="py-2.5 font-bold">{row.adv ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPermissionsMatrixOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

