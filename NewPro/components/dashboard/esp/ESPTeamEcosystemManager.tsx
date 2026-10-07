'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  GraduationCap,
  Sparkles,
  ArrowRight,
  X,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Star,
  Globe,
  Mail,
  Phone,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  ESPPublicTeamMember,
  ESPEcosystemOrgPartner,
  ESPPublicCategory,
  ESPPublicVisibilityStatus,
} from '@/types/espPublicTeam';
import { ESPMember } from '@/types/esp';
import { getStoredESPMembers } from '@/data/espWorkspaceData';
import {
  espPublicTeamService,
  ESP_PUBLIC_TEAM_EVENT,
} from '@/lib/espPublicTeamService';
import { AddMemberModal } from './team/AddMemberModal';
import { EditMemberModal } from './team/EditMemberModal';
import { RemoveConfirmModal } from './team/RemoveConfirmModal';
import { OrgPartnerModal } from './team/OrgPartnerModal';

interface ESPTeamEcosystemManagerProps {
  onNavigateTab?: (tabId: string) => void;
  onPreviewProfile?: () => void;
}

export const ESPTeamEcosystemManager: React.FC<ESPTeamEcosystemManagerProps> = ({
  onNavigateTab,
  onPreviewProfile,
}) => {
  const { showToast } = useToast();

  // Data states
  const [teamMembers, setTeamMembers] = useState<ESPPublicTeamMember[]>([]);
  const [orgPartners, setOrgPartners] = useState<ESPEcosystemOrgPartner[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<ESPMember[]>([]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<
    | 'all'
    | 'Leadership & Governance'
    | 'Core Team'
    | 'Mentors & Advisors'
    | 'Investment Partners'
    | 'Faculty Coordinators'
    | 'Student Innovators'
    | 'Ecosystem Partners (Orgs)'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'draft'>('all');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'entity_member' | 'xentro_user' | 'external_record'
  >('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialMode, setAddModalInitialMode] = useState<
    'internal' | 'student_roster' | 'external_xentro' | 'external_manual'
  >('internal');
  const [editingMember, setEditingMember] = useState<ESPPublicTeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<ESPPublicTeamMember | null>(null);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ESPEcosystemOrgPartner | null>(null);
  const [partnerToRemove, setPartnerToRemove] = useState<ESPEcosystemOrgPartner | null>(null);

  // Load data & subscribe to events
  const loadData = () => {
    setTeamMembers(espPublicTeamService.getPublicTeamMembers());
    setOrgPartners(espPublicTeamService.getEcosystemPartners());
    setWorkspaceMembers(getStoredESPMembers());
  };

  useEffect(() => {
    loadData();

    const handleTeamChange = () => {
      loadData();
    };

    window.addEventListener(ESP_PUBLIC_TEAM_EVENT, handleTeamChange);
    return () => {
      window.removeEventListener(ESP_PUBLIC_TEAM_EVENT, handleTeamChange);
    };
  }, []);

  // Filtered members list
  const filteredMembers = teamMembers.filter((m) => {
    if (activeTab !== 'all' && activeTab !== 'Ecosystem Partners (Orgs)') {
      if (m.publicCategory !== activeTab) return false;
    }
    if (statusFilter !== 'all' && m.visibilityStatus !== statusFilter) return false;
    if (sourceFilter !== 'all' && m.sourceType !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchDesig = m.publicDesignation.toLowerCase().includes(q);
      const matchDept = m.department?.toLowerCase().includes(q);
      const matchOrg = m.organization?.toLowerCase().includes(q);
      const matchExp = m.expertise.some((e) => e.toLowerCase().includes(q));
      if (!matchName && !matchDesig && !matchDept && !matchOrg && !matchExp) return false;
    }
    return true;
  });

  // Filtered org partners list
  const filteredOrgPartners = orgPartners.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.partnershipScope && p.partnershipScope.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Counters
  const publishedCount = teamMembers.filter((m) => m.visibilityStatus === 'published').length;
  const hiddenCount = teamMembers.filter((m) => m.visibilityStatus === 'hidden').length;
  const draftCount = teamMembers.filter((m) => m.visibilityStatus === 'draft').length;
  const featuredCount = teamMembers.filter((m) => m.isFeatured).length;

  // Add Member
  const handleAddMember = (newMember: Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>) => {
    espPublicTeamService.addPublicTeamMember(newMember);
    showToast(`Added ${newMember.name} to Public Profile (${newMember.publicCategory})!`, 'success');
    setIsAddModalOpen(false);
  };

  // Bulk Add Students (from CSV)
  const handleBulkAddStudents = (
    students: Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>>
  ) => {
    espPublicTeamService.bulkAddStudents(students);
    showToast(
      `Successfully imported ${students.length} student innovators into public directory!`,
      'success'
    );
    setIsAddModalOpen(false);
  };

  // Edit Member
  const handleSaveMember = (memberId: string, updates: Partial<ESPPublicTeamMember>) => {
    espPublicTeamService.updatePublicTeamMember(memberId, updates);
    showToast('Updated public presentation successfully.', 'success');
    setEditingMember(null);
  };

  // Toggle Member Visibility
  const handleToggleMemberVisibility = (member: ESPPublicTeamMember) => {
    const nextStatus: ESPPublicVisibilityStatus =
      member.visibilityStatus === 'published' ? 'hidden' : 'published';
    espPublicTeamService.toggleMemberVisibility(member.id, nextStatus);
    showToast(
      `${member.name} is now ${nextStatus === 'published' ? 'published on Public Profile' : 'hidden from public'}`,
      nextStatus === 'published' ? 'success' : 'info'
    );
  };

  // Toggle Featured
  const handleToggleFeatured = (member: ESPPublicTeamMember) => {
    espPublicTeamService.toggleFeatured(member.id);
    showToast(
      `${member.name} ${!member.isFeatured ? 'featured at the top of category' : 'unfeatured'}`,
      'info'
    );
  };

  // Reorder
  const handleMoveOrder = (member: ESPPublicTeamMember, direction: 'up' | 'down') => {
    const categoryMembers = teamMembers
      .filter((m) => m.publicCategory === member.publicCategory)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const index = categoryMembers.findIndex((m) => m.id === member.id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const target = categoryMembers[index - 1];
      const ordered = categoryMembers.map((m) => m.id);
      ordered[index] = target.id;
      ordered[index - 1] = member.id;
      espPublicTeamService.reorderMembers(member.publicCategory, ordered);
    } else if (direction === 'down' && index < categoryMembers.length - 1) {
      const target = categoryMembers[index + 1];
      const ordered = categoryMembers.map((m) => m.id);
      ordered[index] = target.id;
      ordered[index + 1] = member.id;
      espPublicTeamService.reorderMembers(member.publicCategory, ordered);
    }
  };

  // Remove Member Confirm
  const handleConfirmRemoveMember = () => {
    if (!memberToRemove) return;
    const name = memberToRemove.name;
    const isEntityMember = memberToRemove.sourceType === 'entity_member';

    espPublicTeamService.removePublicTeamMember(memberToRemove.id);

    showToast(
      `Removed ${name} from Public Profile.${
        isEntityMember
          ? ' Internal workspace membership and RBAC permissions remain untouched.'
          : ''
      }`,
      'success'
    );
    setMemberToRemove(null);
  };

  // Save Partner
  const handleSavePartner = (partnerData: Omit<ESPEcosystemOrgPartner, 'id' | 'displayOrder'>) => {
    if (editingPartner) {
      espPublicTeamService.updateEcosystemPartner(editingPartner.id, partnerData);
      showToast(`Updated partner organization ${partnerData.name}`, 'success');
    } else {
      espPublicTeamService.addEcosystemPartner({
        ...partnerData,
        displayOrder: orgPartners.length + 1,
      });
      showToast(`Added partner organization ${partnerData.name}`, 'success');
    }
    setIsPartnerModalOpen(false);
  };

  // Remove Partner Confirm
  const handleConfirmRemovePartner = () => {
    if (!partnerToRemove) return;
    espPublicTeamService.removeEcosystemPartner(partnerToRemove.id);
    showToast(`Removed partner ${partnerToRemove.name}`, 'success');
    setPartnerToRemove(null);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header Banner & Architectural Guardrail */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#D9FF3F]/10 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/20">
                <Users className="w-5 h-5 text-[#D9FF3F]" />
              </div>
              <h2 className="text-xl font-black text-[#101212] dark:text-white tracking-tight">
                Team & Ecosystem Directory Management
              </h2>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-3xl">
              Curate how institutional leadership, mentors, investors, and ecosystem partners appear on the
              public directory profile. Workspace membership and RBAC permissions remain strictly decoupled.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onPreviewProfile && (
              <button
                type="button"
                onClick={onPreviewProfile}
                className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
              >
                <Eye className="w-4 h-4 text-gray-400" />
                <span>Preview Public Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setAddModalInitialMode('student_roster');
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
              title="Add student innovators or bulk import via CSV"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Import Students (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddModalInitialMode('internal');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Team & Ecosystem</span>
            </button>
          </div>
        </div>

        {/* Core Architecture Callout Banner */}
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#101212] dark:text-white">
              Three-Layer Security Architecture:
            </span>
            <span className="text-[#565B59] dark:text-[#B6B8B7] ml-1">
              <strong>Workspace Membership</strong> (who has an account) ≠{' '}
              <strong>RBAC Role</strong> (what tools they access) ≠{' '}
              <strong>Public Team Entry</strong> (how they are presented to the world).
              Removing or toggling visibility here never revokes internal privileges or deletes accounts.
            </span>
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
              Total Published
            </p>
            <p className="text-lg font-black text-[#101212] dark:text-white mt-0.5">
              {publishedCount + orgPartners.filter((p) => p.status === 'published').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
              Featured Cards
            </p>
            <p className="text-lg font-black text-amber-500 mt-0.5 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{featuredCount}</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
              Hidden / Drafts
            </p>
            <p className="text-lg font-black text-gray-400 mt-0.5">
              {hiddenCount + draftCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
              Mentors & Investors
            </p>
            <p className="text-lg font-black text-cyan-500 mt-0.5">
              {
                teamMembers.filter((m) =>
                  ['Mentors & Advisors', 'Investment Partners'].includes(m.publicCategory)
                ).length
              }
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <p className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
              Org Alliances
            </p>
            <p className="text-lg font-black text-emerald-500 mt-0.5">
              {orgPartners.length}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-1">
        {[
          { id: 'all', label: 'All Entries', count: teamMembers.length },
          {
            id: 'Leadership & Governance',
            label: 'Leadership & Governance',
            count: teamMembers.filter((m) => m.publicCategory === 'Leadership & Governance').length,
          },
          {
            id: 'Core Team',
            label: 'Core Team',
            count: teamMembers.filter((m) => m.publicCategory === 'Core Team').length,
          },
          {
            id: 'Mentors & Advisors',
            label: 'Mentors & Advisors',
            count: teamMembers.filter((m) => m.publicCategory === 'Mentors & Advisors').length,
          },
          {
            id: 'Investment Partners',
            label: 'Investment Partners',
            count: teamMembers.filter((m) => m.publicCategory === 'Investment Partners').length,
          },
          {
            id: 'Faculty Coordinators',
            label: 'Faculty Coordinators',
            count: teamMembers.filter((m) => m.publicCategory === 'Faculty Coordinators').length,
          },
          {
            id: 'Student Innovators',
            label: 'Student Innovators',
            count: teamMembers.filter((m) => m.publicCategory === 'Student Innovators').length,
          },
          {
            id: 'Ecosystem Partners (Orgs)',
            label: 'Ecosystem Alliances (Orgs)',
            count: orgPartners.length,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                  : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#101212]'
                    : 'bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Quick Filters Bar */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'Ecosystem Partners (Orgs)'
                ? 'Search partner organizations by name, category, or scope...'
                : 'Search public team by name, public designation, department, or tags...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {activeTab !== 'Ecosystem Partners (Orgs)' && (
            <>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] cursor-pointer"
              >
                <option value="all">All Visibility</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="draft">Draft</option>
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="entity_member">Internal Workspace Member</option>
                <option value="xentro_user">Xentro External User</option>
                <option value="external_record">Manual External Record</option>
              </select>
            </>
          )}

          {activeTab === 'Ecosystem Partners (Orgs)' && (
            <button
              type="button"
              onClick={() => {
                setEditingPartner(null);
                setIsPartnerModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Partner Org</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Content: Team Members Table or Ecosystem Partners Grid */}
      {activeTab === 'Ecosystem Partners (Orgs)' ? (
        /* PARTNER ORGS GRID */
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Institutional Alliances & Strategic Partners
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Corporate partners, venture capital alliances, university testbeds, and government agencies.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {filteredOrgPartners.length} Organizations
            </span>
          </div>

          {filteredOrgPartners.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-[#202422] border border-dashed border-gray-200 dark:border-[#262A29]">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#101212] dark:text-white">
                No partner organizations found
              </p>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1">
                Add corporate or academic partners to display strategic alliances on your public profile.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingPartner(null);
                  setIsPartnerModalOpen(true);
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Partner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col justify-between gap-3 group hover:border-[#D9FF3F] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={partner.logo || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120'}
                          alt={partner.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white line-clamp-1">
                            {partner.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">
                            {partner.category}
                          </span>
                        </div>
                      </div>
                      {partner.isFeatured && (
                        <span className="p-1 text-amber-500" title="Featured Partner">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </span>
                      )}
                    </div>

                    {partner.partnershipScope && (
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                        {partner.partnershipScope}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-[#262A29] flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        partner.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {partner.status.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPartner(partner);
                          setIsPartnerModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29]"
                        title="Edit Partner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartnerToRemove(partner)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="Remove Partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TEAM MEMBERS TABLE */
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-[#E5E7EB] dark:border-[#262A29] text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member / Public Presentation</th>
                  <th className="py-3 px-3">Public Category</th>
                  <th className="py-3 px-3">Source & Role Isolation</th>
                  <th className="py-3 px-3">Privacy & Controls</th>
                  <th className="py-3 px-3 text-center">Featured</th>
                  <th className="py-3 px-3">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#565B59] dark:text-[#B6B8B7]">
                      <div className="max-w-md mx-auto space-y-2">
                        <Users className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                        <p className="text-sm font-bold text-[#101212] dark:text-white">
                          No team members match this view
                        </p>
                        <p className="text-xs text-gray-500">
                          Click "+ Add to Team & Ecosystem" to feature internal members or external mentors.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-[#202422]/50 transition-colors group"
                    >
                      {/* 1. Member Profile & Public Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={member.avatar || '/images/profile_avatar.webp'}
                              alt={member.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                            />
                            {member.isFeatured && (
                              <div
                                className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full shadow-xs"
                                title="Featured Entry"
                              >
                                <Star className="w-2.5 h-2.5 fill-black" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-[#101212] dark:text-white text-xs">
                                {member.name}
                              </h4>
                              {member.studentPrivacyNotice && (
                                <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Student
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-[#D9FF3F] line-clamp-1">
                              {member.publicDesignation}
                            </p>
                            {(member.department || member.organization) && (
                              <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">
                                {member.organization || member.department}
                              </p>
                            )}
                            {member.projectOrStartupName && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium line-clamp-1">
                                Project: {member.projectOrStartupName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Public Category */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white">
                          {member.publicCategory}
                        </span>
                      </td>

                      {/* 3. Source & Role Isolation */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {member.sourceType === 'entity_member' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Building2 className="w-3 h-3" />
                                Workspace Member
                              </span>
                              {member.internalRoleSnapshot && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  RBAC: {member.internalRoleSnapshot}
                                </p>
                              )}
                            </div>
                          ) : member.sourceType === 'xentro_user' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              <Sparkles className="w-3 h-3" />
                              Xentro User
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400">
                              <UserCheck className="w-3 h-3" />
                              Manual Record
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Privacy & Controls */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              member.fieldVisibility.email
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-gray-100 dark:bg-[#262A29] text-gray-400'
                            }`}
                            title={
                              member.fieldVisibility.email
                                ? 'Email is VISIBLE to web visitors'
                                : 'Email is hidden for privacy'
                            }
                          >
                            <Mail className="w-3 h-3 inline mr-0.5" />
                            {member.fieldVisibility.email ? 'Email ON' : 'Email Hidden'}
                          </span>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              member.fieldVisibility.phone
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-gray-100 dark:bg-[#262A29] text-gray-400'
                            }`}
                            title={
                              member.fieldVisibility.phone
                                ? 'Phone is VISIBLE to web visitors'
                                : 'Phone is hidden for privacy'
                            }
                          >
                            <Phone className="w-3 h-3 inline mr-0.5" />
                            {member.fieldVisibility.phone ? 'Phone ON' : 'Phone Hidden'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Featured Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(member)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            member.isFeatured
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                              : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'
                          }`}
                          title={member.isFeatured ? 'Featured card (click to unfeature)' : 'Feature at top of category'}
                        >
                          <Star
                            className={`w-4 h-4 ${member.isFeatured ? 'fill-amber-500' : ''}`}
                          />
                        </button>
                      </td>

                      {/* 6. Visibility Status Pill & Direct Toggle */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleMemberVisibility(member)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            member.visibilityStatus === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : member.visibilityStatus === 'draft'
                              ? 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-300'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle published / hidden"
                        >
                          {member.visibilityStatus === 'published' ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>{member.visibilityStatus === 'draft' ? 'Draft' : 'Hidden'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(member, 'up')}
                            className="p-1 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                            title="Move Up in category"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(member, 'down')}
                            className="p-1 rounded-lg text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                            title="Move Down in category"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMember(member)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                            title="Edit Public Card"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToRemove(member)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                            title="Remove from Public Profile (Does not affect workspace membership)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        workspaceMembers={workspaceMembers}
        existingTeamMemberIds={teamMembers
          .map((m) => m.membershipId)
          .filter(Boolean) as string[]}
        initialMode={addModalInitialMode}
        onAddMember={handleAddMember}
        onBulkAddStudents={handleBulkAddStudents}
      />

      <EditMemberModal
        member={editingMember}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMember}
      />

      <RemoveConfirmModal
        member={memberToRemove}
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
      />

      <OrgPartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSave={handleSavePartner}
        editingPartner={editingPartner}
      />

      {/* Partner Org Remove Modal */}
      {partnerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#101212] dark:text-white">
                  Remove Partner Organization?
                </h3>
              </div>
              <button
                onClick={() => setPartnerToRemove(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Are you sure you want to remove <strong>{partnerToRemove.name}</strong> from your
              public ecosystem partners?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPartnerToRemove(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePartner}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Remove Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
