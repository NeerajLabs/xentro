'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  Share2,
  MessageCircle,
  UserPlus,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Compass,
  Check,
  Clock,
  Edit3,
  X,
  Loader2,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import { messagingService } from '@/lib/messagingService';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile, saveUserProfile } from '@/lib/userProfile';
import { PersonalUpgradeModal } from './PersonalUpgradeModal';
import { EntityAccountModal } from './EntityAccountModal';

interface ExplorerProfileViewProps {
  explorerId?: string;
  explorerData?: any;
  isOwnProfile?: boolean;
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
}

function formatProfileLocation(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
  return String(loc);
}

function buildExplorerState(cu: any, isOwn: boolean, explorerData: any, explorerId?: string): any {
  if (isOwn) {
    return {
      id: cu?.id || 'usr_explorer',
      name: cu?.name || 'Ecosystem Explorer',
      username: (cu?.username || cu?.name || 'explorer').toLowerCase().replace(/[^a-z0-9]/g, ''),
      role: cu?.roleTitle || 'Explorer',
      organization: cu?.currentOrganization || cu?.organization || 'Xentro Network',
      avatar: cu?.avatar || '/xentro-logo.png',
      bio: cu?.bio || '',
      email: cu?.email || 'explorer@xentro.network',
      location: formatProfileLocation(cu?.location),
      joinedDate: 'Joined October 2026',
      headline: cu?.headline || '',
      currentRole: cu?.currentRole || cu?.roleTitle || '',
      currentOrganization: cu?.currentOrganization || cu?.organization || '',
      education: cu?.education || '',
      professionalExperience: cu?.professionalExperience || '',
      skills: cu?.skills || [],
      areasOfExpertise: cu?.areasOfExpertise || cu?.skills || [],
      industries: cu?.industries || cu?.industriesOfFocus || [],
      startupInterests: cu?.startupInterests || cu?.entrepreneurshipInterests || [],
      linkedin: cu?.linkedin || '',
      website: cu?.website || '',
      otherLink: cu?.otherLink || cu?.otherLinks?.[0] || '',
      interests: cu?.industries || cu?.industriesOfFocus || [],
    };
  }
  return {
    id: explorerId || explorerData?.id || 'usr_explorer_partner',
    name: explorerData?.name || explorerData?.fullName || 'Ecosystem Explorer',
    username: explorerData?.username || (explorerData?.name || 'explorer').toLowerCase().replace(/[^a-z0-9]/g, ''),
    role: explorerData?.role || explorerData?.roleTitle || 'Explorer',
    organization: explorerData?.organization || explorerData?.company || 'Ecosystem Member',
    avatar: explorerData?.avatar || '/xentro-logo.png',
    bio: explorerData?.bio || 'Passionate explorer connecting with founders, mentors, and investors across the venture network.',
    email: explorerData?.email || '',
    location: formatProfileLocation(explorerData?.location || 'India'),
    joinedDate: 'Joined 2026',
    headline: explorerData?.headline || '',
    currentRole: explorerData?.currentRole || explorerData?.roleTitle || '',
    currentOrganization: explorerData?.currentOrganization || explorerData?.organization || '',
    education: explorerData?.education || '',
    professionalExperience: explorerData?.professionalExperience || '',
    skills: explorerData?.skills || [],
    areasOfExpertise: explorerData?.areasOfExpertise || [],
    industries: explorerData?.industries || [],
    startupInterests: explorerData?.startupInterests || explorerData?.entrepreneurshipInterests || [],
    linkedin: explorerData?.linkedin || '',
    website: explorerData?.website || '',
    otherLink: explorerData?.otherLink || explorerData?.otherLinks?.[0] || '',
    interests: explorerData?.interests || explorerData?.industries || ['Ecosystem Growth', 'Startups', 'Collaborative Innovation'],
  };
}

export const ExplorerProfileView: React.FC<ExplorerProfileViewProps> = ({
  explorerId,
  explorerData,
  isOwnProfile = false,
  onBackToFeed,
  onBackToDiscover,
}) => {
  const { showToast } = useToast();
  const currentUser = getUserProfile();
  const isOwn = Boolean(isOwnProfile) || (!explorerId && getUserProfile().role === 'explorer');

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'network'>('overview');
  const [profile, setProfile] = useState<any>(() =>
    buildExplorerState(currentUser, isOwn, explorerData, explorerId)
  );

  // Sync profile reactively for both own profile changes and public profile fetching
  useEffect(() => {
    let isCancelled = false;

    if (isOwn) {
      const fresh = getUserProfile();
      setProfile(buildExplorerState(fresh, true, fresh, fresh.id));

      const handleRoleChanged = () => {
        const updated = getUserProfile();
        setProfile(buildExplorerState(updated, true, updated, updated.id));
      };
      window.addEventListener('xentro-role-changed', handleRoleChanged);
      return () => {
        window.removeEventListener('xentro-role-changed', handleRoleChanged);
      };
    } else {
      const targetId = explorerId || explorerData?.userId || explorerData?.id;
      const targetEmail = explorerData?.email;
      if (targetId || targetEmail) {
        const fetchPublicProfile = async () => {
          try {
            const params = new URLSearchParams();
            if (targetId) params.set('userId', targetId);
            if (targetEmail) params.set('email', targetEmail);
            const res = await fetch(`/api/profile?${params.toString()}`);
            if (res.ok) {
              const json = await res.json();
              const serverUser = json?.data?.user || json?.user;
              const p = json?.data?.profile || serverUser?.personalProfile;
              if (serverUser && !isCancelled) {
                setProfile((prev: any) => ({
                  ...prev,
                  name: serverUser.fullName || p?.fullName || prev.name,
                  username: serverUser.username ? serverUser.username.replace(/^@/, '') : prev.username,
                  role: p?.currentRole || serverUser.roleTitle || prev.role,
                  organization: p?.currentOrganization || serverUser.organization || prev.organization,
                  avatar: p?.photoUrl || serverUser.avatar || prev.avatar,
                  bio: p?.bio || serverUser.bio || prev.bio,
                  email: serverUser.email || prev.email,
                  location: formatProfileLocation(p?.location || serverUser.location || prev.location),
                  headline: p?.headline || serverUser.headline || prev.headline,
                  currentRole: p?.currentRole || serverUser.currentRole || prev.currentRole,
                  currentOrganization: p?.currentOrganization || serverUser.currentOrganization || prev.currentOrganization,
                  education: (Array.isArray(p?.education) && p.education.length > 0)
                    ? p.education
                    : (Array.isArray(serverUser.education) && serverUser.education.length > 0)
                    ? serverUser.education
                    : (p?.education || serverUser.education || prev.education),
                  professionalExperience: p?.professionalExperience || serverUser.professionalExperience || prev.professionalExperience,
                  skills: (p?.skills && p.skills.length > 0) ? p.skills : (serverUser.skills || prev.skills),
                  areasOfExpertise: (p?.areasOfExpertise && p.areasOfExpertise.length > 0) ? p.areasOfExpertise : prev.areasOfExpertise,
                  industries: (p?.industries && p.industries.length > 0) ? p.industries : (serverUser.industries || prev.industries),
                  startupInterests: (p?.startupInterests && p.startupInterests.length > 0) ? p.startupInterests : (serverUser.startupInterests || prev.startupInterests),
                  linkedin: p?.linkedin || serverUser.linkedin || prev.linkedin,
                  website: p?.website || serverUser.website || prev.website,
                  otherLink: (p?.otherLinks?.[0]) || (serverUser.otherLinks?.[0]) || prev.otherLink,
                }));
              }
            }
          } catch (_) {}
        };
        fetchPublicProfile();
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [isOwn, explorerId, explorerData]);

  const partnerId = profile.id;
  const targetCountId = isOwn ? undefined : (explorerData?.userId || (profile as any).userId || explorerId || profile.id);

  const [connStatus, setConnStatus] = useState<'none' | 'pending' | 'received' | 'connected'>(() =>
    connectionService.getConnectionStatus(partnerId)
  );
  const [liveConnectionsCount, setLiveConnectionsCount] = useState<number>(() =>
    connectionService.getConnectedCount(targetCountId)
  );

  useEffect(() => {
    const handleConnectionsChange = () => {
      setConnStatus(connectionService.getConnectionStatus(partnerId));
      setLiveConnectionsCount(connectionService.getConnectedCount(targetCountId));
    };
    handleConnectionsChange();
    connectionService.syncFromServer().then(() => handleConnectionsChange()).catch(() => {});

    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
    window.addEventListener('xentro-connection-event', handleConnectionsChange);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
      window.removeEventListener('xentro-connection-event', handleConnectionsChange);
    };
  }, [partnerId, targetCountId]);

  // Handle connection request
  const handleConnect = async () => {
    if (connStatus === 'connected' || connStatus === 'pending') return;

    try {
      await connectionService.requestConnection({
        id: partnerId,
        name: profile.name,
        role: 'Explorer',
        avatar: profile.avatar,
      });

      setConnStatus('pending');
      showToast(`Connection request sent to ${profile.name}!`, 'success');
    } catch {
      showToast('Error requesting connection.', 'error');
    }
  };

  // Handle direct message
  const handleMessage = () => {
    messagingService.startOrOpenConversation({
      id: partnerId,
      name: profile.name,
      role: 'Explorer',
      avatar: profile.avatar,
      company: profile.organization,
    });
  };

  // Edit Profile Modal State & Handlers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsMenuOpen]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    currentRole: '',
    currentOrganization: '',
    location: '',
    education: '',
    skills: '',
    industries: '',
    linkedin: '',
    website: '',
  });

  const handleOpenEditModal = () => {
    setEditFormData({
      name: profile.name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      currentRole: profile.currentRole || profile.role || '',
      currentOrganization: profile.currentOrganization || profile.organization || '',
      location: typeof profile.location === 'string' ? profile.location : formatProfileLocation(profile.location),
      education: typeof profile.education === 'string' ? profile.education : (Array.isArray(profile.education) ? profile.education.map((e: any) => typeof e === 'string' ? e : `${e.degree || ''} ${e.institution || ''}`).join(', ') : ''),
      skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
      industries: Array.isArray(profile.industries) ? profile.industries.join(', ') : '',
      linkedin: profile.linkedin || '',
      website: profile.website || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const skillsArray = editFormData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const industriesArray = editFormData.industries
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const targetUserId = profile.id || currentUser.id;
      const targetEmail = profile.email || currentUser.email;

      // 1. Persist to MongoDB Atlas via /api/profile
      const payload = {
        userId: targetUserId,
        email: targetEmail,
        fullName: editFormData.name,
        headline: editFormData.headline,
        bio: editFormData.bio,
        location: editFormData.location,
        currentRole: editFormData.currentRole,
        currentOrganization: editFormData.currentOrganization,
        education: editFormData.education,
        skills: skillsArray,
        areasOfExpertise: skillsArray,
        industries: industriesArray,
        linkedin: editFormData.linkedin,
        website: editFormData.website,
      };

      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 2. Update local storage & profile store
      const updatedProfileObj: UserProfile = {
        ...currentUser,
        name: editFormData.name || currentUser.name,
        headline: editFormData.headline,
        bio: editFormData.bio,
        location: editFormData.location,
        currentRole: editFormData.currentRole,
        roleTitle: editFormData.currentRole || currentUser.roleTitle,
        currentOrganization: editFormData.currentOrganization,
        organization: editFormData.currentOrganization || currentUser.organization,
        education: editFormData.education,
        skills: skillsArray,
        areasOfExpertise: skillsArray,
        industries: industriesArray,
        linkedin: editFormData.linkedin,
        website: editFormData.website,
      };
      saveUserProfile(updatedProfileObj);

      if (typeof window !== 'undefined') {
        try {
          const rawUser = localStorage.getItem('xentro_current_user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            u.fullName = editFormData.name;
            localStorage.setItem('xentro_current_user', JSON.stringify(u));
          }
          const rawPersonal = localStorage.getItem('xentro_personal_profile');
          const p = rawPersonal ? JSON.parse(rawPersonal) : {};
          const mergedPersonal = {
            ...p,
            fullName: editFormData.name,
            headline: editFormData.headline,
            bio: editFormData.bio,
            location: editFormData.location,
            currentRole: editFormData.currentRole,
            currentOrganization: editFormData.currentOrganization,
            education: editFormData.education,
            skills: skillsArray,
            industries: industriesArray,
            linkedin: editFormData.linkedin,
            website: editFormData.website,
          };
          localStorage.setItem('xentro_personal_profile', JSON.stringify(mergedPersonal));
        } catch (_) {}
      }

      setProfile((prev: any) => ({
        ...prev,
        name: editFormData.name,
        headline: editFormData.headline,
        bio: editFormData.bio,
        location: editFormData.location,
        role: editFormData.currentRole || prev.role,
        currentRole: editFormData.currentRole,
        organization: editFormData.currentOrganization || prev.organization,
        currentOrganization: editFormData.currentOrganization,
        education: editFormData.education,
        skills: skillsArray,
        areasOfExpertise: skillsArray,
        industries: industriesArray,
        linkedin: editFormData.linkedin,
        website: editFormData.website,
      }));

      setIsEditModalOpen(false);
      showToast('Explorer profile successfully updated!', 'success');
    } catch (err) {
      showToast('Failed to save profile changes. Please try again.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto space-y-6 animate-fade-slide">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToFeed || onBackToDiscover}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                showToast('Profile link copied to clipboard!', 'success');
              }
            }}
            className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors shadow-xs"
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-emerald-950 via-[#16221A] to-[#0D1410] relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,255,63,0.15),transparent_50%)]" />
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/40 backdrop-blur-md text-[#D9FF3F] border border-[#D9FF3F]/30">
              <Compass className="w-3.5 h-3.5" />
              Explorer Account
            </span>
          </div>
        </div>

        {/* Profile Content Details */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Avatar & Identifiers */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#181B1A] p-1.5 shadow-md border-2 border-white dark:border-[#262A29]">
                  <img
                    src={profile.avatar || '/xentro-logo.png'}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181B1A]" />
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#101212] dark:text-white tracking-tight font-display">
                    {profile.name}
                  </h1>
                  <ShieldCheck className="w-5 h-5 text-[#9EBE12]" />
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  @{profile.username} &bull; <span className="font-semibold text-[#101212] dark:text-white">{profile.role}</span>
                </p>
                {profile.headline && (
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5 italic">{profile.headline}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwn ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Connect button */}
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connStatus === 'connected' || connStatus === 'pending'}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    connStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : connStatus === 'pending'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                  }`}
                >
                  {connStatus === 'connected' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </>
                  ) : connStatus === 'pending' ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </>
                  )}
                </button>

                {/* Message Button */}
                <button
                  type="button"
                  onClick={handleMessage}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#101212] dark:bg-white text-white dark:text-[#101212] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                {/* Merged Actions Menu */}
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer border border-[#D9FF3F]"
                    aria-expanded={isActionsMenuOpen}
                    aria-haspopup="true"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#101212]" />
                    <span>Actions</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isActionsMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isActionsMenuOpen && (
                    <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {/* Action Choice 1: Upgrade Personal Account */}
                      {String(profile.role || 'explorer').toLowerCase() === 'explorer' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            setIsUpgradeModalOpen(true);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#202422] transition-colors flex items-start gap-3 group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4 fill-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                                Upgrade Account
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] mt-0.5 leading-snug">
                              Permanent conversion to Mentor or Individual Investor.
                            </p>
                          </div>
                        </button>
                      )}

                      {/* Action Choice 2: Create Entity Account */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setIsEntityModalOpen(true);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#202422] transition-colors flex items-start gap-3 group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-blue-500 transition-colors">
                              Create Entity Account
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <p className="text-[11px] text-[#565B59] dark:text-[#8E9290] mt-0.5 leading-snug">
                            Launch a dedicated Startup, Investor Organization, or ESP.
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-3xl leading-relaxed mt-2">
              {profile.bio}
            </p>
          )}

          {/* Quick Meta Stats Strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{profile.organization}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{profile.joinedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto font-semibold text-[#565B59] dark:text-[#B6B8B7]">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>{liveConnectionsCount} Connections</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-t border-[#E5E7EB] dark:border-[#262A29] px-6 bg-[#F7F8F6] dark:bg-[#202422]/40">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-[#D9FF3F] text-[#101212] dark:text-white'
                : 'border-transparent text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'network'
                ? 'border-[#D9FF3F] text-[#101212] dark:text-white'
                : 'border-transparent text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Network & Interests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'activity'
                ? 'border-[#D9FF3F] text-[#101212] dark:text-white'
                : 'border-transparent text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Recent Activity
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Headline */}
            {profile.headline && (
              <div className="bg-white dark:bg-[#181B1A] px-6 py-4 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm">
                <p className="text-sm font-semibold text-[#101212] dark:text-white italic">&ldquo;{profile.headline}&rdquo;</p>
              </div>
            )}

            {/* About / Bio Card */}
            <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9EBE12]" />
                About
              </h2>
              {profile.bio ? (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed italic">
                  As a verified Explorer in the Xentro ecosystem, {profile.name} engages with founders, mentors, and investors to track emerging deals, participate in open advisory discussions, and support innovative venture expansion.
                </p>
              )}

              {/* Current Role & Org */}
              {(profile.currentRole || profile.currentOrganization) && (
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7] flex flex-wrap gap-4">
                  {profile.currentRole && (
                    <span><span className="font-semibold text-[#101212] dark:text-white">Role:</span> {profile.currentRole}</span>
                  )}
                  {profile.currentOrganization && (
                    <span><span className="font-semibold text-[#101212] dark:text-white">Organization:</span> {profile.currentOrganization}</span>
                  )}
                </div>
              )}

              {/* Education */}
              {profile.education && (
                <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#262A29]">
                  <div className="text-xs font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
                    <span>Education</span>
                  </div>
                  {Array.isArray(profile.education) ? (
                    profile.education.length > 0 ? (
                      <div className="space-y-2">
                        {profile.education.map((edu: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs border border-gray-100 dark:border-gray-800">
                            <div className="font-semibold text-[#101212] dark:text-white">{edu.institution}</div>
                            {(edu.degree || edu.fieldOfStudy) && (
                              <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                                {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" • ")}
                              </div>
                            )}
                            {(edu.startYear || edu.endYear) && (
                              <div className="text-[10px] text-[#7D8280]">
                                {[edu.startYear, edu.endYear || (edu.currentlyStudying ? "Present" : "")].filter(Boolean).join(" - ")}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[#565B59]">No education information provided.</div>
                    )
                  ) : (
                    <div className="text-xs text-[#565B59] dark:text-[#B6B8B7]">{profile.education}</div>
                  )}
                </div>
              )}

              {/* Professional Experience Summary */}
              {profile.professionalExperience && (
                <div className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  <span className="font-semibold text-[#101212] dark:text-white">Experience:</span> {profile.professionalExperience}
                </div>
              )}
            </div>

            {/* Skills & Expertise */}
            {(profile.skills?.length > 0 || profile.areasOfExpertise?.length > 0) && (
              <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#9EBE12]" />
                  Skills & Areas of Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills?.length > 0 ? profile.skills : profile.areasOfExpertise).map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Industries of Focus */}
            {profile.industries?.length > 0 && (
              <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#9EBE12]" />
                  Industries of Focus
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.industries.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Startup & Entrepreneurship Interests */}
            {profile.startupInterests?.length > 0 && (
              <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9EBE12]" />
                  Startup & Entrepreneurship Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.startupInterests.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: Exploration Focus Tags (if no structured fields) */}
            {!profile.industries?.length && !profile.skills?.length && profile.interests?.length > 0 && (
              <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#9EBE12]" />
                  Exploration Focus & Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.interests || []).map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Details */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                Ecosystem Verification
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">Account Role</span>
                  <span className="font-bold text-[#101212] dark:text-white">Explorer</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">Email Verification</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">Network Tier</span>
                  <span className="font-bold text-[#9EBE12]">Standard Access</span>
                </div>
              </div>
            </div>

            {/* Public Links */}
            {(profile.linkedin || profile.website || profile.otherLink) && (
              <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  Public Links
                </h3>
                <div className="space-y-2">
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">LinkedIn</span>
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Website / Portfolio</span>
                    </a>
                  )}
                  {profile.otherLink && (
                    <a href={profile.otherLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">X / GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="bg-white dark:bg-[#181B1A] p-6 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Network Connections</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Connected with ecosystem members, incubators, and advisory partners across India.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between sm:col-span-2">
              <div>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Active Connections</span>
                <p className="text-lg font-bold text-[#101212] dark:text-white">
                  {liveConnectionsCount}
                </p>
              </div>
              <Users className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#181B1A] p-8 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#101212] dark:text-white">
            {isOwn ? 'Your Activity & Feed Posts' : `${profile.name}'s Activity`}
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto leading-relaxed">
            {isOwn
              ? 'As an Explorer, you can share questions, perspectives, and startup feedback directly to the Universal Feed.'
              : `${profile.name} has not published recent public discussions yet.`}
          </p>
          {isOwn && onBackToFeed && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToFeed}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-colors cursor-pointer shadow-xs"
              >
                <span>Go to Feed to Post</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Explorer Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#121413]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-display flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#9EBE12]" />
                  <span>Edit Explorer Profile</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Update your personal profile information and background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Full Name & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. Mukesh Sai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={editFormData.headline}
                    onChange={(e) => setEditFormData({ ...editFormData, headline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. Founder & Tech Explorer"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={3}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12] resize-none"
                  placeholder="Tell founders, mentors, and the network about your journey and interests..."
                />
              </div>

              {/* Current Role & Current Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Current Role / Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.currentRole}
                    onChange={(e) => setEditFormData({ ...editFormData, currentRole: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. Student / Software Engineer / Founder"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={editFormData.currentOrganization}
                    onChange={(e) => setEditFormData({ ...editFormData, currentOrganization: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. IIT Madras / Autonomous"
                  />
                </div>
              </div>

              {/* Location & Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. Bengaluru, Karnataka, India"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Education / University
                  </label>
                  <input
                    type="text"
                    value={editFormData.education}
                    onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="e.g. B.Tech Computer Science, IIIT Hyderabad"
                  />
                </div>
              </div>

              {/* Skills & Focus Industries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Key Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.skills}
                    onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="AI/ML, Full Stack, Product Strategy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Industries of Focus (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.industries}
                    onChange={(e) => setEditFormData({ ...editFormData, industries: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="Fintech, SaaS, Climate Tech"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={editFormData.linkedin}
                    onChange={(e) => setEditFormData({ ...editFormData, linkedin: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Website / Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={editFormData.website}
                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Account Upgrade Modal */}
      <PersonalUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentUserProfile={currentUser}
        onApplicationSubmitted={() => {
          showToast('Upgrade application submitted. Awaiting review.', 'info');
        }}
      />

      {/* Entity Account Creation Modal */}
      <EntityAccountModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        currentUserProfile={currentUser}
        onEntityCreated={(newEntity) => {
          showToast(`Entity "${newEntity.name}" registered successfully!`, 'success');
        }}
        onSelectTab={(tabId) => {
          if (tabId === 'feed' && onBackToFeed) onBackToFeed();
        }}
      />
    </div>
  );
};
