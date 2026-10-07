'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Mail,
  UserCheck,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ArrowLeft,
  Crown,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import {
  StartupTeamMember,
  TeamCategory,
  StartupDashboardRole,
  StartupMemberPublicFields,
  StartupPermissionSet,
} from '@/types/startup';
import {
  DEFAULT_PUBLIC_FIELDS,
  getDefaultPermissionsForRole,
  isSensitiveDomain,
} from '@/lib/startupTeamService';
import { connectionService } from '@/lib/connectionService';

interface AddMemberWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: Partial<StartupTeamMember>) => void;
  existingMembers: StartupTeamMember[];
  initialCategory?: TeamCategory;
}

export const AddMemberWizardModal: React.FC<AddMemberWizardModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  existingMembers,
  initialCategory = 'core_team',
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity Mode
  const [identityMode, setIdentityMode] = useState<'search' | 'invite'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatformUser, setSelectedPlatformUser] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Step 2: Member Details
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [teamCategory, setTeamCategory] = useState<TeamCategory>(initialCategory);
  const [department, setDepartment] = useState('Engineering');
  const [shortBio, setShortBio] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  );

  // Step 3: Public Profile
  const [publicProfileVisible, setPublicProfileVisible] = useState(true);
  const [publicFields, setPublicFields] = useState<StartupMemberPublicFields>({ ...DEFAULT_PUBLIC_FIELDS });

  // Step 4: Dashboard Access
  const [dashboardAccessEnabled, setDashboardAccessEnabled] = useState(false);
  const [dashboardRole, setDashboardRole] = useState<StartupDashboardRole>('team_member');
  const [customPermissions, setCustomPermissions] = useState<StartupPermissionSet>(
    getDefaultPermissionsForRole('team_member')
  );
  const [isCustomizingPermissions, setIsCustomizingPermissions] = useState(false);

  if (!isOpen) return null;

  // Platform users pool for search derived from active connected network
  const platformUsers = React.useMemo(() => {
    try {
      const partners = connectionService.getConnectedPartners();
      return partners.map((p) => ({
        id: p.id,
        name: p.name,
        handle: `@${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        role: p.role,
        category: p.role?.toLowerCase().includes('advisor') ? 'advisor' : 'core_team',
        avatar: p.avatar || '/xentro-logo.png',
        bio: `Connected ${p.role} on Xentro network.`,
        expertise: [],
      }));
    } catch {
      return [];
    }
  }, []);

  const handleSelectUser = (u: any) => {
    setSelectedPlatformUser(u);
    setName(u.name);
    setDesignation(u.role);
    setShortBio(u.bio);
    setAvatar(u.avatar);
    setExpertiseInput(u.expertise ? u.expertise.join(', ') : '');
    if (u.category === 'advisor') {
      setTeamCategory('advisor');
      setDashboardAccessEnabled(false);
      setDashboardRole('advisor');
    }
  };

  const handleRoleChange = (role: StartupDashboardRole) => {
    setDashboardRole(role);
    setCustomPermissions(getDefaultPermissionsForRole(role));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expertiseList = expertiseInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let roleCat: 'founder' | 'leadership' | 'core' | 'advisor' = 'core';
    if (teamCategory === 'founder' || teamCategory === 'co_founder') roleCat = 'founder';
    else if (teamCategory === 'leadership') roleCat = 'leadership';
    else if (teamCategory === 'advisor' || teamCategory === 'mentor') roleCat = 'advisor';

    const memberData: Partial<StartupTeamMember> = {
      name: name.trim() || 'New Member',
      email: selectedPlatformUser?.email || inviteEmail || '',
      role: designation.trim() || 'Specialist',
      designation: designation.trim() || 'Specialist',
      department,
      roleCategory: roleCat,
      teamCategory,
      avatar,
      bio: shortBio.trim() || 'Valued startup team contributor.',
      shortBio: shortBio.trim() || 'Valued startup team contributor.',
      expertise: expertiseList,
      linkedin,
      startDate,
      xentroUserId: selectedPlatformUser?.id || undefined,
      xentroProfile: selectedPlatformUser?.handle || undefined,
      xentroProfileLinked: !!selectedPlatformUser,
      entityMembershipStatus: selectedPlatformUser ? 'active' : 'invited',
      publicProfileVisible,
      publicDisplayFields: publicFields,
      dashboardAccessEnabled,
      dashboardRole: dashboardAccessEnabled ? dashboardRole : undefined,
      permissions: dashboardAccessEnabled ? customPermissions : undefined,
      currentMember: true,
    };

    onAddMember(memberData);
    onClose();
  };

  const isStep1Valid =
    identityMode === 'search' ? !!selectedPlatformUser || !!name.trim() : !!inviteEmail.trim();
  const isStep2Valid = !!name.trim() && !!designation.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                Step {currentStep} of 4
              </span>
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                {currentStep === 1 && 'Step 1: Member Identity'}
                {currentStep === 2 && 'Step 2: Member Details & Classification'}
                {currentStep === 3 && 'Step 3: Public Profile Presentation'}
                {currentStep === 4 && 'Step 4: Workspace Access & Permissions'}
              </h3>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {currentStep === 1 && 'Search for registered Xentro users or invite external collaborators by email.'}
              {currentStep === 2 && 'Define role designation, department, and team category.'}
              {currentStep === 3 && 'Configure visibility on your venture’s public profile independently.'}
              {currentStep === 4 && 'Assign dashboard operation access preset and granular capabilities.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 h-1 bg-gray-100 dark:bg-[#262A29]">
          <div className={`h-full transition-all ${currentStep >= 1 ? 'bg-[#D9FF3F]' : ''}`} />
          <div className={`h-full transition-all ${currentStep >= 2 ? 'bg-[#D9FF3F]' : ''}`} />
          <div className={`h-full transition-all ${currentStep >= 3 ? 'bg-[#D9FF3F]' : ''}`} />
          <div className={`h-full transition-all ${currentStep >= 4 ? 'bg-[#D9FF3F]' : ''}`} />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-slide">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIdentityMode('search')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    identityMode === 'search'
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                      : 'border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-gray-400'
                  }`}
                >
                  <Search className="w-5 h-5 text-[#D9FF3F]" />
                  <div>
                    <div className="text-xs font-bold text-[#101212] dark:text-white">Search Xentro Profile</div>
                    <div className="text-[11px] text-[#565B59] dark:text-gray-400">Tag verified community member</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIdentityMode('invite')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    identityMode === 'invite'
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                      : 'border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-gray-400'
                  }`}
                >
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs font-bold text-[#101212] dark:text-white">Invite by Email</div>
                    <div className="text-[11px] text-[#565B59] dark:text-gray-400">Send an onboarding invite</div>
                  </div>
                </button>
              </div>

              {identityMode === 'search' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search connected community members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {platformUsers
                      .filter(
                        (u) =>
                          !searchQuery.trim() ||
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.handle.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((u) => {
                        const isSelected = selectedPlatformUser?.id === u.id;
                        const alreadyInTeam = existingMembers.some(
                          (m) => m.name.toLowerCase() === u.name.toLowerCase()
                        );
                        return (
                          <div
                            key={u.id}
                            onClick={() => !alreadyInTeam && handleSelectUser(u)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              alreadyInTeam
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#202422] border-gray-200 dark:border-[#262A29]'
                                : isSelected
                                ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 cursor-pointer'
                                : 'border-gray-200 dark:border-[#262A29] hover:bg-gray-50 dark:hover:bg-[#202422] cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#101212] dark:text-white truncate">
                                    {u.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#565B59] dark:text-[#D9FF3F]">
                                    {u.handle}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">{u.role}</p>
                              </div>
                            </div>

                            {alreadyInTeam ? (
                              <span className="text-[10px] font-semibold text-gray-400">Already in Team</span>
                            ) : isSelected ? (
                              <div className="p-1 rounded-full bg-[#D9FF3F] text-black">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-[#262A29] text-[11px] font-bold text-[#101212] dark:text-white"
                              >
                                Select
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Collaborator Official Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. colleague@venture.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                    <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      An invitation will be generated with a secure link to join your startup workspace once saved.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MEMBER DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-slide">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Designation / Role Title *
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Chief Technology Officer"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Team Category
                  </label>
                  <select
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value as TeamCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
                  >
                    <option value="founder">Founder</option>
                    <option value="co_founder">Co-Founder</option>
                    <option value="leadership">Leadership / C-Suite</option>
                    <option value="core_team">Core Team</option>
                    <option value="advisor">Advisor</option>
                    <option value="mentor">Venture Mentor</option>
                    <option value="consultant">Consultant</option>
                    <option value="intern">Intern</option>
                    <option value="contributor">Contributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
                  >
                    <option value="Engineering">Engineering & Technology</option>
                    <option value="Product">Product & Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance & Accounting</option>
                    <option value="Marketing">Marketing & Growth</option>
                    <option value="Sales">Sales & BD</option>
                    <option value="Research">Research & DeepTech</option>
                    <option value="Advisory Board">Advisory Board</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Short Bio / Background
                </label>
                <textarea
                  rows={2}
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="e.g. 8+ yrs in distributed systems; previously Senior Staff at Google Cloud."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    Expertise Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="e.g. Rust, Distributed Systems, Kubernetes"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PUBLIC PROFILE */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-slide">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${publicProfileVisible ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]' : 'bg-gray-200 dark:bg-[#262A29] text-gray-400'}`}>
                    {publicProfileVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">Show on Startup Public Profile</h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Renders this person in the public team directory under their designated category.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicProfileVisible}
                    onChange={(e) => setPublicProfileVisible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D9FF3F]"></div>
                </label>
              </div>

              {publicProfileVisible ? (
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-[#262A29] space-y-3">
                  <div className="text-xs font-bold text-[#101212] dark:text-white">
                    Permitted Public Fields
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        ['photo', 'Photo / Avatar'],
                        ['name', 'Full Name'],
                        ['designation', 'Designation'],
                        ['bio', 'Bio / Background'],
                        ['expertise', 'Expertise Tags'],
                        ['linkedin', 'LinkedIn Profile'],
                        ['xentroProfile', 'Xentro Profile Handle'],
                        ['experience', 'Years of Experience'],
                      ] as const
                    ).map(([fieldKey, label]) => (
                      <label key={fieldKey} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#202422]">
                        <input
                          type="checkbox"
                          checked={!!publicFields[fieldKey]}
                          onChange={(e) =>
                            setPublicFields({
                              ...publicFields,
                              [fieldKey]: e.target.checked,
                            })
                          }
                          className="rounded text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F]"
                        />
                        <span className="text-[#101212] dark:text-gray-300 text-xs">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  This member will remain hidden from the Startup Public Profile and discoverability index.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DASHBOARD ACCESS & PERMISSIONS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-slide">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${dashboardAccessEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-200 dark:bg-[#262A29] text-gray-400'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">Give Startup Dashboard Access?</h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Allows this person to sign in and operate workspace modules.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dashboardAccessEnabled}
                    onChange={(e) => setDashboardAccessEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D9FF3F]"></div>
                </label>
              </div>

              {!dashboardAccessEnabled ? (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7] space-y-1">
                  <p className="font-semibold text-[#101212] dark:text-white">No Workspace Operations Access</p>
                  <p>
                    This member will only exist in your venture’s public profile or historical team record. No dashboard access will be provisioned.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Select Dashboard Role Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(
                        [
                          ['admin', 'Admin', 'General workspace management'],
                          ['finance', 'Finance', 'Financials, DD locker & billing'],
                          ['operations', 'Operations', 'Opportunities, asks & content'],
                          ['team_member', 'Team Member', 'Standard working contributor'],
                          ['advisor', 'Advisor', 'Restricted read-only advisory'],
                          ['viewer', 'Viewer', 'Read-only observer'],
                        ] as const
                      ).map(([rKey, rTitle, rDesc]) => (
                        <div
                          key={rKey}
                          onClick={() => handleRoleChange(rKey)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            dashboardRole === rKey
                              ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                              : 'border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-[#101212] dark:text-white">{rTitle}</div>
                          <div className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">{rDesc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sensitive Access warning */}
                  {(dashboardRole === 'finance' || isSensitiveDomain('finance')) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold">Sensitive Access:</span> This role includes permissions to inspect confidential financial records and due diligence lockers.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#262A29]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 1 ? !isStep1Valid : currentStep === 2 ? !isStep2Valid : false}
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  (currentStep === 1 && isStep1Valid) || (currentStep === 2 && isStep2Valid) || currentStep === 3
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Complete & Save Member</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
