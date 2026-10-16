'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Briefcase,
  Shield,
  Eye,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  StartupTeamMember,
  StartupTalentAsk,
  TalentApplicant,
  TalentApplicantStage,
  TalentAskStatus,
  TeamCategory,
  StartupDashboardRole,
} from '@/types/startup';
import {
  getStartupMembers,
  saveStartupMembers,
  addStartupMember,
  updateStartupMember,
  removeStartupMember,
  markStartupMemberFormer,
  setMemberPublicVisibility,
  setMemberDashboardAccess,
  transferStartupOwnership,
  getTalentAsks,
  createTalentAsk,
  updateTalentAsk,
  changeTalentAskStatus,
  deleteTalentAsk,
  getTalentApplicants,
  moveTalentApplicantStage,
  convertApplicantToMember,
} from '@/lib/startupTeamService';
import { useToast } from '@/components/ui/Toast';

import { TeamMembersTab } from './TeamMembersTab';
import { AdvisorsMentorsTab } from './AdvisorsMentorsTab';
import { TalentAskTab } from './TalentAskTab';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { PublicDisplayTab } from './PublicDisplayTab';

import { AddMemberWizardModal } from './AddMemberWizardModal';
import { MemberControlDrawer } from './MemberControlDrawer';
import { TalentAskModal } from './TalentAskModal';
import { TalentPipelineModal } from './TalentPipelineModal';
import { DashboardErrorBoundary } from '@/components/dashboard/workspace/DashboardErrorBoundary';

export type TeamWorkspaceTab =
  | 'team_members'
  | 'advisors'
  | 'talent_asks'
  | 'roles_permissions'
  | 'public_display';

export const StartupTeamWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TeamWorkspaceTab>('team_members');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Core Data with safe array defaults
  const [members, setMembers] = useState<StartupTeamMember[]>(() => {
    try {
      const initial = getStartupMembers();
      return Array.isArray(initial) ? initial : [];
    } catch {
      return [];
    }
  });
  const [talentAsks, setTalentAsks] = useState<StartupTalentAsk[]>(() => {
    try {
      const initial = getTalentAsks();
      return Array.isArray(initial) ? initial : [];
    } catch {
      return [];
    }
  });
  const [applicants, setApplicants] = useState<TalentApplicant[]>(() => {
    try {
      const initial = getTalentApplicants();
      return Array.isArray(initial) ? initial : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialCategory, setAddModalInitialCategory] = useState<TeamCategory>('core_team');
  const [selectedMemberForDrawer, setSelectedMemberForDrawer] = useState<StartupTeamMember | null>(null);

  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);
  const [editingTalentAsk, setEditingTalentAsk] = useState<StartupTalentAsk | null>(null);

  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [pipelineSelectedAskId, setPipelineSelectedAskId] = useState<string | undefined>(undefined);

  // Load state and subscribe to events
  useEffect(() => {
    const initialMembers = getStartupMembers();
    setMembers(Array.isArray(initialMembers) ? initialMembers : []);
    const initialAsks = getTalentAsks();
    setTalentAsks(Array.isArray(initialAsks) ? initialAsks : []);
    const initialApplicants = getTalentApplicants();
    setApplicants(Array.isArray(initialApplicants) ? initialApplicants : []);

    const handleTeamChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (Array.isArray(ce.detail?.members)) {
        setMembers(ce.detail.members);
      } else {
        const fallback = getStartupMembers();
        setMembers(Array.isArray(fallback) ? fallback : []);
      }
    };

    const handleTalentChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (Array.isArray(ce.detail?.asks)) {
        setTalentAsks(ce.detail.asks);
      } else {
        const fallback = getTalentAsks();
        setTalentAsks(Array.isArray(fallback) ? fallback : []);
      }
    };

    const handleApplicantsChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (Array.isArray(ce.detail?.applicants)) {
        setApplicants(ce.detail.applicants);
      } else {
        const fallback = getTalentApplicants();
        setApplicants(Array.isArray(fallback) ? fallback : []);
      }
    };

    const handleSyncError = (e: Event) => {
      const ce = e as CustomEvent;
      setSyncError(ce.detail?.message || 'Server sync error');
    };

    window.addEventListener('xentro-startup-team-changed', handleTeamChanged);
    window.addEventListener('xentro-startup-talent-changed', handleTalentChanged);
    window.addEventListener('xentro-startup-applicants-changed', handleApplicantsChanged);
    window.addEventListener('xentro-team-sync-error', handleSyncError);

    return () => {
      window.removeEventListener('xentro-startup-team-changed', handleTeamChanged);
      window.removeEventListener('xentro-startup-talent-changed', handleTalentChanged);
      window.removeEventListener('xentro-startup-applicants-changed', handleApplicantsChanged);
      window.removeEventListener('xentro-team-sync-error', handleSyncError);
    };
  }, []);

  // Team Member Handlers
  const handleAddMember = (memberData: Partial<StartupTeamMember>) => {
    try {
      const added = addStartupMember(memberData);
      showToast(`Added ${added.name} to the team!`, 'success');
      setMembers(getStartupMembers());
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
    }
  };

  const handleUpdateMember = (id: string, updates: Partial<StartupTeamMember>) => {
    try {
      const updated = updateStartupMember(id, updates);
      if (updated) {
        showToast(`Updated ${updated.name}`, 'success');
        setMembers(getStartupMembers());
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update member', 'error');
    }
  };

  const handleToggleVisibility = (id: string, current: boolean) => {
    setMemberPublicVisibility(id, !current);
    setMembers(getStartupMembers());
    showToast(current ? 'Hidden from public profile' : 'Visible on public profile', 'info');
  };

  const handleToggleDashboardAccess = (id: string, current: boolean) => {
    try {
      setMemberDashboardAccess(id, !current);
      setMembers(getStartupMembers());
      showToast(current ? 'Dashboard access revoked' : 'Dashboard access enabled', 'info');
    } catch (err: any) {
      showToast(err.message || 'Action restricted', 'error');
    }
  };

  const handleMarkFormer = (id: string) => {
    try {
      markStartupMemberFormer(id, false);
      setMembers(getStartupMembers());
      showToast('Marked member as former. Dashboard access revoked.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Cannot mark former', 'error');
    }
  };

  const handleRemoveMember = (id: string) => {
    try {
      removeStartupMember(id);
      setMembers(getStartupMembers());
      showToast('Member removed from venture', 'info');
    } catch (err: any) {
      showToast(err.message || 'Cannot remove member', 'error');
    }
  };

  const handleTransferOwnership = (currentOwnerId: string, newOwnerId: string) => {
    try {
      transferStartupOwnership(currentOwnerId, newOwnerId);
      setMembers(getStartupMembers());
      showToast('Venture ownership successfully transferred', 'success');
    } catch (err: any) {
      showToast(err.message || 'Ownership transfer failed', 'error');
    }
  };

  const handleReorderMembers = (reordered: StartupTeamMember[]) => {
    saveStartupMembers(reordered);
    setMembers(reordered);
  };

  // Talent Ask Handlers
  const handleSaveTalentAsk = (askData: any) => {
    if (editingTalentAsk) {
      updateTalentAsk(editingTalentAsk.id, askData);
      showToast('Updated talent ask', 'success');
    } else {
      createTalentAsk(askData);
      showToast('Published new talent ask to public profile', 'success');
    }
    setTalentAsks(getTalentAsks());
    setEditingTalentAsk(null);
  };

  const handleChangeAskStatus = (askId: string, status: TalentAskStatus) => {
    changeTalentAskStatus(askId, status);
    setTalentAsks(getTalentAsks());
    showToast(`Talent ask status changed to ${status}`, 'info');
  };

  const handleDeleteAsk = (askId: string) => {
    deleteTalentAsk(askId);
    setTalentAsks(getTalentAsks());
    showToast('Talent ask removed', 'info');
  };

  // Applicant Pipeline Handlers
  const handleMoveApplicantStage = (applicantId: string, stage: TalentApplicantStage) => {
    moveTalentApplicantStage(applicantId, stage);
    setApplicants(getTalentApplicants());
    showToast(`Candidate moved to ${stage}`, 'info');
  };

  const handleConvertToMember = (
    applicantId: string,
    options: {
      teamCategory: TeamCategory;
      designation: string;
      department?: string;
      dashboardAccessEnabled: boolean;
      dashboardRole?: StartupDashboardRole;
      publicProfileVisible: boolean;
    }
  ) => {
    try {
      const newMember = convertApplicantToMember(applicantId, options);
      if (newMember) {
        showToast(`Successfully onboarded ${newMember.name} to the team!`, 'success');
        setMembers(getStartupMembers());
        setApplicants(getTalentApplicants());
      }
    } catch (err: any) {
      showToast(err.message || 'Onboarding failed', 'error');
    }
  };

  const tabs: Array<{
    id: TeamWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'team_members', label: 'Team Members', icon: Users, count: members.length },
    {
      id: 'advisors',
      label: 'Advisors & Mentors',
      icon: Award,
      count: members.filter(
        (m) => m.teamCategory === 'advisor' || m.teamCategory === 'mentor' || m.roleCategory === 'advisor'
      ).length,
    },
    { id: 'talent_asks', label: 'Talent Ask', icon: Briefcase, count: talentAsks.length },
    { id: 'roles_permissions', label: 'Roles & Permissions', icon: Shield },
    { id: 'public_display', label: 'Public Display', icon: Eye },
  ];

  return (
    <DashboardErrorBoundary moduleName="Startup Team & Roles">
      <div className="space-y-6 animate-fade-slide">
      {/* Server Persistence Error Banner */}
      {syncError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Server Persistence Warning:</strong> {syncError}. Changes are temporarily cached in your browser.
            </span>
          </div>
          <button
            onClick={() => setSyncError(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-100 dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                      : 'bg-black/5 dark:bg-white/10 text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab */}
      {activeTab === 'team_members' && (
        <TeamMembersTab
          members={members}
          onOpenAddModal={() => {
            setAddModalInitialCategory('core_team');
            setIsAddModalOpen(true);
          }}
          onOpenMemberDrawer={(m) => setSelectedMemberForDrawer(m)}
          onToggleVisibility={handleToggleVisibility}
          onToggleDashboardAccess={handleToggleDashboardAccess}
          onMarkFormer={handleMarkFormer}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {activeTab === 'advisors' && (
        <AdvisorsMentorsTab
          members={members}
          onOpenAddModal={() => {
            setAddModalInitialCategory('advisor');
            setIsAddModalOpen(true);
          }}
          onOpenMemberDrawer={(m) => setSelectedMemberForDrawer(m)}
          onToggleVisibility={handleToggleVisibility}
          onToggleDashboardAccess={handleToggleDashboardAccess}
        />
      )}

      {activeTab === 'talent_asks' && (
        <TalentAskTab
          asks={talentAsks}
          applicants={applicants}
          onOpenCreateModal={() => {
            setEditingTalentAsk(null);
            setIsTalentModalOpen(true);
          }}
          onOpenEditModal={(ask) => {
            setEditingTalentAsk(ask);
            setIsTalentModalOpen(true);
          }}
          onOpenPipelineModal={(askId) => {
            setPipelineSelectedAskId(askId);
            setIsPipelineModalOpen(true);
          }}
          onChangeStatus={handleChangeAskStatus}
          onDeleteAsk={handleDeleteAsk}
        />
      )}

      {activeTab === 'roles_permissions' && (
        <RolesPermissionsTab members={members} />
      )}

      {activeTab === 'public_display' && (
        <PublicDisplayTab
          members={members}
          onUpdateMember={handleUpdateMember}
          onReorderMembers={handleReorderMembers}
        />
      )}

      {/* Modals & Drawers */}
      {isAddModalOpen && (
        <AddMemberWizardModal
          isOpen={isAddModalOpen}
          initialCategory={addModalInitialCategory}
          existingMembers={members}
          onClose={() => setIsAddModalOpen(false)}
          onAddMember={handleAddMember}
        />
      )}

      {selectedMemberForDrawer && (
        <MemberControlDrawer
          isOpen={!!selectedMemberForDrawer}
          member={selectedMemberForDrawer}
          allMembers={members}
          onClose={() => setSelectedMemberForDrawer(null)}
          onUpdateMember={handleUpdateMember}
          onRemoveMember={handleRemoveMember}
          onMarkFormer={markStartupMemberFormer}
          onTransferOwnership={handleTransferOwnership}
        />
      )}

      {isTalentModalOpen && (
        <TalentAskModal
          isOpen={isTalentModalOpen}
          ask={editingTalentAsk}
          onClose={() => {
            setIsTalentModalOpen(false);
            setEditingTalentAsk(null);
          }}
          onSave={handleSaveTalentAsk}
        />
      )}

      {isPipelineModalOpen && (
        <TalentPipelineModal
          isOpen={isPipelineModalOpen}
          selectedAskId={pipelineSelectedAskId}
          asks={talentAsks}
          applicants={applicants}
          onClose={() => setIsPipelineModalOpen(false)}
          onMoveStage={handleMoveApplicantStage}
          onConvertToMember={handleConvertToMember}
        />
      )}
    </div>
    </DashboardErrorBoundary>
  );
};
