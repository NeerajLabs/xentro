'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  GraduationCap,
  TrendingUp,
  Rocket,
  Building2,
  Grid2X2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Plus,
  Sparkles,
  Layers,
  Building,
  RefreshCw,
} from 'lucide-react';
import { getUserProfile, UserProfile, setActiveRole } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';
import { RoleRequestModal } from './RoleRequestModal';

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

interface LinkedEntityItem {
  id: string;
  name: string;
  entityType: 'STARTUP' | 'INVESTOR_ORG' | 'ESP';
  accountType: string;
  verificationStatus: string;
  createdAt?: string;
}

interface AccountsAndRolesManagerProps {
  onSelectTab?: (tabId: string) => void;
  onOpenProfile?: () => void;
}

export const AccountsAndRolesManager: React.FC<AccountsAndRolesManagerProps> = ({
  onSelectTab,
  onOpenProfile,
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [requests, setRequests] = useState<RoleRequestItem[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalPreselectedRole, setRoleModalPreselectedRole] = useState<string>('Mentor');

  const fetchRoleRequestsAndEntities = async () => {
    setIsLoading(true);
    try {
      const p = getUserProfile();
      setProfile(p);
      const targetId = p.id;
      const targetEmail = p.email;

      // 1. Fetch pending & past role applications
      const resReq = await fetch(`/api/roles/request?userId=${encodeURIComponent(targetId)}&email=${encodeURIComponent(targetEmail)}`);
      if (resReq.ok) {
        const dataReq = await resReq.json();
        setRequests(dataReq?.data?.requests || dataReq?.requests || []);
      }

      // 2. Fetch linked entity accounts
      try {
        const resProf = await fetch(`/api/profile?userId=${encodeURIComponent(targetId)}&email=${encodeURIComponent(targetEmail)}`);
        if (resProf.ok) {
          const profData = await resProf.json();
          const userEntities = profData?.data?.user?.linkedEntities || profData?.user?.entities || [];
          if (Array.isArray(userEntities) && userEntities.length > 0) {
            setLinkedEntities(userEntities);
          }
        }
      } catch (_) {}
    } catch (err) {
      console.warn('Failed to fetch role status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleRequestsAndEntities();

    const handleRoleChanged = () => {
      setProfile(getUserProfile());
      fetchRoleRequestsAndEntities();
    };

    window.addEventListener('xentro-role-changed', handleRoleChanged);
    window.addEventListener('xentro-role-requests-updated', handleRoleChanged);
    return () => {
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
      window.removeEventListener('xentro-role-requests-updated', handleRoleChanged);
    };
  }, []);

  const openApplyForRole = (roleTitle: string) => {
    setRoleModalPreselectedRole(roleTitle);
    setIsRoleModalOpen(true);
  };

  // Helper to find existing application status
  const getRequestStatus = (roleName: string) => {
    return requests.find(
      (r) => r.requestedRole.toLowerCase().includes(roleName.toLowerCase()) ||
             (roleName === 'Mentor' && r.requestedRole.toLowerCase().includes('mentor')) ||
             (roleName === 'Investor' && r.requestedRole.toLowerCase().includes('investor')) ||
             (roleName === 'Startup' && (r.requestedRole.toLowerCase().includes('startup') || r.requestedRole.toLowerCase().includes('founder'))) ||
             (roleName === 'ESP' && (r.requestedRole.toLowerCase().includes('esp') || r.requestedRole.toLowerCase().includes('institution')))
    );
  };

  const hasRole = (roleKey: string) => {
    const roles = (profile as any).activeRoles || [profile.role || 'Explorer'];
    return roles.some((r: string) => r.toLowerCase().includes(roleKey.toLowerCase()));
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-8 animate-fade-slide pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141816] via-[#101412] to-[#0A0D0C] border border-[#E5E7EB]/10 dark:border-[#262A29] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9FF3F]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-xs font-mono font-bold text-[#D9FF3F] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account &amp; Role Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              My Accounts &amp; Roles
            </h1>
            <p className="text-sm text-[#B6B8B7] mt-1 max-w-xl leading-relaxed">
              Manage your presence across Xentro. Upgrade your personal account or launch dedicated entity organizations while preserving your unified Explorer identity.
            </p>
          </div>

          <button
            onClick={fetchRoleRequestsAndEntities}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D9FF3F]' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* 1. Base Personal Account Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-display flex items-center gap-2">
              <User className="w-4 h-4 text-[#D9FF3F]" />
              <span>Personal Account</span>
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#8E9290]">
              Your persistent zero-knowledge personal identity and foundational Explorer account.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D9FF3F] bg-[#202422] shrink-0">
              <img
                src={profile.avatar || '/xentro-logo.png'}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#101212] dark:text-white">
                  {profile.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-0.5">
                {profile.email} &bull; <span className="font-mono text-[#101212] dark:text-white font-semibold">ID: {profile.id}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  Explorer (Base Role)
                </span>
                {profile.headline && (
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] italic truncate max-w-xs">
                    &bull; {profile.headline}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              else if (onSelectTab) onSelectTab('profile');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F2F4F2] dark:bg-[#202422] text-[#101212] dark:text-white hover:bg-[#D9FF3F] hover:text-[#101212] transition-all cursor-pointer"
          >
            <span>View / Edit Personal Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. Upgrade Personal Account Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
            <span>Upgrade Your Personal Account</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#8E9290]">
            Personal role upgrades retain your existing Explorer user ID, profile, network connections, and messages. Workspaces unlock upon review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mentor Upgrade Card */}
          {(() => {
            const req = getRequestStatus('Mentor');
            const isMentorActive = hasRole('mentor');

            return (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    {isMentorActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active Workspace
                      </span>
                    ) : req?.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        Under Review
                      </span>
                    ) : req?.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Review Note Available
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/5 text-[#565B59] dark:text-[#8E9290]">
                        Personal Role
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-[#101212] dark:text-white">
                    Become a Mentor
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1.5 leading-relaxed">
                    Offer advisory sessions, review founder pitch decks, evaluate startup milestones, and guide ventures across the ecosystem.
                  </p>

                  {req && (
                    <div className="mt-4 p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#121413] border border-[#E5E7EB] dark:border-[#262A29] text-xs">
                      <div className="flex items-center justify-between text-[#8E9290] font-mono text-[10px]">
                        <span>Ref #{req.requestId}</span>
                        <span>{req.status}</span>
                      </div>
                      {req.adminNotes && (
                        <p className="text-[11px] text-[#101212] dark:text-white mt-1 italic">
                          "{req.adminNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#262A29]">
                  {isMentorActive ? (
                    <button
                      onClick={() => {
                        setActiveRole('mentor');
                        if (onSelectTab) onSelectTab('dashboard');
                        showToast('Switched to Mentor Workspace', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Switch to Mentor Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : req?.status === 'PENDING' ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-white/5 text-[#8E9290] cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Application Under Admin Review</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openApplyForRole('Mentor')}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#101212] dark:bg-white text-white dark:text-[#101212] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Apply for Mentor Role</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Individual Investor Upgrade Card */}
          {(() => {
            const req = getRequestStatus('Investor');
            const isInvestorActive = hasRole('investor');

            return (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    {isInvestorActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active Workspace
                      </span>
                    ) : req?.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        Under Review
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/5 text-[#565B59] dark:text-[#8E9290]">
                        Personal Role
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-[#101212] dark:text-white">
                    Become an Individual Investor
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1.5 leading-relaxed">
                    Explore verified deal flow, access diligence data rooms, evaluate cap tables, and syndicate angel investments under your verified name.
                  </p>

                  {req && (
                    <div className="mt-4 p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#121413] border border-[#E5E7EB] dark:border-[#262A29] text-xs">
                      <div className="flex items-center justify-between text-[#8E9290] font-mono text-[10px]">
                        <span>Ref #{req.requestId}</span>
                        <span>{req.status}</span>
                      </div>
                      {req.adminNotes && (
                        <p className="text-[11px] text-[#101212] dark:text-white mt-1 italic">
                          "{req.adminNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#262A29]">
                  {isInvestorActive ? (
                    <button
                      onClick={() => {
                        setActiveRole('investor');
                        if (onSelectTab) onSelectTab('dashboard');
                        showToast('Switched to Investor Workspace', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Switch to Investor Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : req?.status === 'PENDING' ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-white/5 text-[#8E9290] cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Application Under Admin Review</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openApplyForRole('Investor')}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#101212] dark:bg-white text-white dark:text-[#101212] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Apply for Investor Role</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 3. Create Entity Account Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-display flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D9FF3F]" />
            <span>Create an Entity Account</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#8E9290]">
            Entity accounts represent separate organizations (companies, funds, institutions) linked to your initiating user ID as owner or administrator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create Startup */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-4">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#101212] dark:text-white">
                Startup Venture
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                Register company profile, manage traction MRR, upload pitch deck, and set up your institutional Due Diligence Vault.
              </p>
            </div>
            <button
              onClick={() => openApplyForRole('Startup')}
              className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs bg-[#F2F4F2] dark:bg-[#202422] text-[#101212] dark:text-white hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Startup Entity</span>
            </button>
          </div>

          {/* Create Investor Organization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-4">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#101212] dark:text-white">
                Investor Organization
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                Institutional venture fund or angel network. Access dedicated deal CRM, team seats, and institutional deal room.
              </p>
            </div>
            <button
              onClick={() => openApplyForRole('Investor Organization')}
              className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs bg-[#F2F4F2] dark:bg-[#202422] text-[#101212] dark:text-white hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Form Investor Org</span>
            </button>
          </div>

          {/* Create ESP / Institution */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit mb-4">
                <Grid2X2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#101212] dark:text-white">
                ESP / Institution
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                Incubator, accelerator, or academic institution. Run cohort programs, issue incubation grants, and endorse startups.
              </p>
            </div>
            <button
              onClick={() => openApplyForRole('ESP / Institution')}
              className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs bg-[#F2F4F2] dark:bg-[#202422] text-[#101212] dark:text-white hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply as ESP / Institution</span>
            </button>
          </div>
        </div>

        {/* Linked Entities List if user has created entities */}
        {linkedEntities.length > 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-sm">
            <h3 className="font-bold text-sm text-[#101212] dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D9FF3F]" />
              <span>Your Linked Entity Accounts ({linkedEntities.length})</span>
            </h3>
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {linkedEntities.map((ent) => (
                <div key={ent.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-[#101212] dark:text-white block">
                      {ent.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#8E9290]">
                      ID: {ent.id} &bull; Type: {ent.entityType}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    {ent.verificationStatus || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Role Request Application Modal */}
      <RoleRequestModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUserProfile={profile}
        onRequestSubmitted={fetchRoleRequestsAndEntities}
      />
    </div>
  );
};
