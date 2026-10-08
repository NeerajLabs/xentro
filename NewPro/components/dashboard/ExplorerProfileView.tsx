'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import { messagingService } from '@/lib/messagingService';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

interface ExplorerProfileViewProps {
  explorerId?: string;
  explorerData?: any;
  isOwnProfile?: boolean;
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
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

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'network'>('overview');
  const [profile, setProfile] = useState<any>(() => {
    if (isOwnProfile) {
      const cu = currentUser as any;
      return {
        id: cu.id || 'usr_explorer',
        name: cu.name || 'Ecosystem Explorer',
        username: cu.username || 'explorer',
        role: cu.roleTitle || 'Explorer',
        organization: cu.currentOrganization || cu.organization || 'Xentro Network',
        avatar: cu.avatar || '/xentro-logo.png',
        bio: cu.bio || '',
        email: cu.email || 'explorer@xentro.network',
        location: cu.location || '',
        joinedDate: 'Joined October 2026',
        headline: cu.headline || '',
        currentRole: cu.currentRole || cu.roleTitle || '',
        currentOrganization: cu.currentOrganization || cu.organization || '',
        education: cu.education || '',
        professionalExperience: cu.professionalExperience || '',
        skills: cu.skills || [],
        areasOfExpertise: cu.areasOfExpertise || cu.skills || [],
        industries: cu.industries || cu.industriesOfFocus || [],
        startupInterests: cu.startupInterests || cu.entrepreneurshipInterests || [],
        linkedin: cu.linkedin || '',
        website: cu.website || '',
        otherLink: cu.otherLink || cu.otherLinks?.[0] || '',
        interests: cu.industries || cu.industriesOfFocus || [],
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
      location: explorerData?.location || 'India',
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
  });

  const isOwn = Boolean(isOwnProfile) || (!explorerId && getUserProfile().role === 'explorer');
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
            {!isOwnProfile && (
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
                <div className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  <span className="font-semibold text-[#101212] dark:text-white">Education:</span> {profile.education}
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
        <div className="bg-white dark:bg-[#181B1A] p-8 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-2">
          <Compass className="w-8 h-8 text-[#9EBE12] mx-auto mb-2 opacity-70" />
          <h3 className="text-sm font-bold text-[#101212] dark:text-white">No Public Posts Yet</h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
            {profile.name} has not published public discussions or asks recently.
          </p>
        </div>
      )}
    </div>
  );
};
