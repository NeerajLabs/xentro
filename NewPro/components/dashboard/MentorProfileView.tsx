'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  GraduationCap,
  Sparkles,
  Clock,
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Check,
  Building2,
  Send,
  Video,
  Mic,
  Briefcase,
  Layers,
  Globe,
  X,
  ArrowRight,
  Info,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { FullMentorProfile, MENTORSHIP_OFFERING } from '@/types/mentor';
import { getMentorProfileById } from '@/data/mentorProfilesData';
import { getMentorOfferings, submitMentorshipRequest, getMentorshipHistory } from '@/lib/mentorshipService';
import { getUserProfile } from '@/lib/userProfile';
import { notificationService } from '@/lib/notificationService';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import { messagingService } from '@/lib/messagingService';

export type MentorTabType = 'basic' | 'experience' | 'slots' | 'mentorship';

interface MentorProfileViewProps {
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
  onBackToDashboard?: () => void;
  onOpenDashboard?: () => void;
  isOwnProfile?: boolean;
  mentorData?: FullMentorProfile;
  mentorId?: string;
}

export const MentorProfileView: React.FC<MentorProfileViewProps> = ({
  onBackToFeed,
  onBackToDiscover,
  onBackToDashboard,
  onOpenDashboard,
  isOwnProfile,
  mentorData,
  mentorId,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<MentorTabType>('basic');

  // Determine mentor data dynamically from props and stored state
  const [mentor, setMentor] = useState<FullMentorProfile>(() => {
    return mentorData || getMentorProfileById(mentorId || 'user_mentor');
  });

  // Sync if mentorData or mentorId changes
  React.useEffect(() => {
    if (mentorData) {
      setMentor(mentorData);
    } else {
      setMentor(getMentorProfileById(mentorId || 'user_mentor'));
    }
  }, [mentorData, mentorId]);

  // Reactive listener: when profile is edited in Account > Mentor Profile
  React.useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ profile: FullMentorProfile }>;
      if (!mentorId || mentorId === 'user_mentor' || isOwnProfile) {
        if (customEvent.detail?.profile) {
          setMentor(customEvent.detail.profile);
        } else {
          setMentor(getMentorProfileById(mentorId || 'user_mentor'));
        }
      }
    };

    const handleOfferingsUpdate = () => {
      setOfferings(getMentorOfferings(mentor.id));
    };

    window.addEventListener('xentro-mentor-profile-updated', handleProfileUpdate);
    window.addEventListener('xentro-mentorship-offerings-changed', handleOfferingsUpdate);

    return () => {
      window.removeEventListener('xentro-mentor-profile-updated', handleProfileUpdate);
      window.removeEventListener('xentro-mentorship-offerings-changed', handleOfferingsUpdate);
    };
  }, [mentorId, isOwnProfile, mentor.id]);

  // Connection & Request state
  const partnerId = mentorId || mentor.id || 'mentor_1';
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'received' | 'connected'>(() =>
    connectionService.getConnectionStatus(partnerId)
  );
  const isConnected = connectionStatus === 'connected';
  const [isMentorshipRequested, setIsMentorshipRequested] = useState(false);

  const [liveConnectionsCount, setLiveConnectionsCount] = useState<number>(() =>
    connectionService.getConnectedCount(partnerId)
  );

  // Sync connection status and count on events
  React.useEffect(() => {
    const handleConnectionsChange = () => {
      setConnectionStatus(connectionService.getConnectionStatus(partnerId));
      setLiveConnectionsCount(connectionService.getConnectedCount(partnerId));
    };
    handleConnectionsChange();
    connectionService.syncFromServer().then(() => handleConnectionsChange()).catch(() => {});

    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
    window.addEventListener('xentro-connection-event', handleConnectionsChange);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
      window.removeEventListener('xentro-connection-event', handleConnectionsChange);
    };
  }, [partnerId]);

  // Structured Mentorship State
  const [offerings, setOfferings] = useState<MENTORSHIP_OFFERING[]>([]);
  const [isStructuredModalOpen, setIsStructuredModalOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<MENTORSHIP_OFFERING | null>(null);
  const [requestStep, setRequestStep] = useState<1 | 2>(1);

  // Auto-populated Startup & Founder details
  const userProfile = getUserProfile();
  const effectiveOwnProfile =
    isOwnProfile === false
      ? false
      : Boolean(isOwnProfile) ||
        mentorId === 'user_mentor' ||
        (userProfile.role === 'mentor' &&
          Boolean(userProfile.name) &&
          Boolean(mentor.name) &&
          mentor.name?.toLowerCase().trim() === userProfile.name?.toLowerCase().trim());

  const [reqStartupName, setReqStartupName] = useState(userProfile.organization || '');
  const [reqStartupStage, setReqStartupStage] = useState(userProfile.stageOrFocus || '');
  const [reqStartupIndustry, setReqStartupIndustry] = useState(userProfile.sector || '');
  const [reqSelectedAreas, setReqSelectedAreas] = useState<string[]>([]);
  const [reqReason, setReqReason] = useState('');
  const [reqChallenges, setReqChallenges] = useState('');
  const [reqOutcomes, setReqOutcomes] = useState('');
  const [reqStartDate, setReqStartDate] = useState('Next Month');
  const [reqMessage, setReqMessage] = useState('');

  React.useEffect(() => {
    const list = getMentorOfferings(mentor.id);
    setOfferings(list);
  }, [mentor.id]);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestFocusArea, setRequestFocusArea] = useState(
    mentor.areasOfMentorship[0] || 'Product-Market Fit'
  );

  // Meeting Slot Booking State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState(
    mentor.meetingSlots.sessionTypes[0] || 'Discovery Call'
  );
  const [selectedDuration, setSelectedDuration] = useState(
    mentor.meetingSlots.durations[0] || '30 Minutes'
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    mentor.meetingSlots.availableTimeSlots[0] || '10:00 AM — 10:45 AM'
  );
  const [selectedMeetingMode, setSelectedMeetingMode] = useState(
    mentor.meetingSlots.meetingModes[0] || 'Video'
  );
  const [meetingReason, setMeetingReason] = useState('');

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Mentor profile link copied to clipboard!', 'success');
  };

  const handleToggleConnect = async () => {
    if (connectionStatus === 'connected') {
      showToast(`You are already connected with ${mentor.name}.`, 'info');
      return;
    }

    if (connectionStatus === 'pending') {
      showToast(`Your connection request is pending ${mentor.name}'s approval.`, 'info');
      return;
    }

    if (connectionStatus === 'received') {
      await connectionService.acceptConnection(partnerId);
      setConnectionStatus('connected');
      showToast(`Connection accepted! You and ${mentor.name} are now connected.`, 'success');
      return;
    }

    // Default: Request Connection
    await connectionService.requestConnection({
      id: partnerId,
      name: mentor.name,
      role: mentor.currentRole?.designation || mentor.headline || 'Mentor',
      avatar: mentor.avatar,
    });
    setConnectionStatus('pending');
    showToast(`Connection request sent to ${mentor.name}! Status: Pending Approval`, 'success');
  };

  const handleConfirmMentorshipRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMentorshipRequested(true);
    setIsRequestModalOpen(false);

    // Dispatch notification to mentor
    notificationService.sendNotification({
      userId: mentor.id || 'XU-765776',
      category: 'mentorship',
      title: `Mentorship Requested: ${reqStartupName || 'New Venture'}`,
      description: `${userProfile.name || 'Founder'} requested mentorship on ${requestFocusArea}. Reason: "${requestReason || 'Advisory session'}"`,
      time: 'Just now',
      avatar: userProfile.avatar || '/xentro-logo.png',
      actorName: userProfile.name || 'Founder',
      actorRole: userProfile.roleTitle || 'Founder & CEO',
      actionRequired: true,
      actionType: 'connection_request',
      targetTab: 'dashboard',
    });

    showToast(`Mentorship request submitted to ${mentor.name}!`, 'success');
  };

  const handleConfirmMeetingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMeetingModalOpen(false);

    notificationService.sendNotification({
      userId: mentor.id || 'XU-765776',
      category: 'mentorship',
      title: `New Meeting Request from ${userProfile.name || 'Founder'}`,
      description: `${selectedSessionType} (${selectedDuration}) requested on ${selectedTimeSlot} via ${selectedMeetingMode}.`,
      time: 'Just now',
      avatar: userProfile.avatar || '/xentro-logo.png',
      actorName: userProfile.name || 'Founder',
      actorRole: userProfile.roleTitle || 'Founder & CEO',
      actionRequired: true,
      actionType: 'connection_request',
      targetTab: 'dashboard',
    });

    showToast(
      `Meeting request for ${selectedDuration} (${selectedSessionType}) sent to ${mentor.name}!`,
      'success'
    );
  };

  const handleBack = () => {
    if (onBackToDiscover) {
      onBackToDiscover();
    } else if (onBackToDashboard) {
      onBackToDashboard();
    } else if (onOpenDashboard) {
      onOpenDashboard();
    } else if (onBackToFeed) {
      onBackToFeed();
    }
  };

  const handleSubmitStructuredRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering) return;

    submitMentorshipRequest({
      mentorId: mentor.id,
      mentorName: mentor.name,
      startup: {
        id: userProfile.id || 'startup_user',
        name: reqStartupName,
        stage: reqStartupStage,
        industry: reqStartupIndustry,
        logo: userProfile.avatar || '/images/profile_avatar.webp',
        description: userProfile.bio || '',
      },
      founder: {
        id: userProfile.id || 'current_user',
        name: userProfile.name,
        email: userProfile.email || '',
        avatar: userProfile.avatar || '/images/profile_avatar.webp',
        title: userProfile.roleTitle || 'Founder',
      },
      selectedDuration: selectedOffering.duration,
      selectedPackage: `${selectedOffering.duration} Structured Advisory Sprint`,
      price: selectedOffering.price,
      currency: selectedOffering.currency,
      mentorshipAreasRequired: reqSelectedAreas.length > 0 ? reqSelectedAreas : selectedOffering.areasCovered,
      currentStartupStage: reqStartupStage,
      reasonForRequest: reqReason,
      currentChallenges: reqChallenges,
      expectedOutcomes: reqOutcomes,
      preferredStartDate: reqStartDate,
      additionalMessage: reqMessage,
    });

    setIsStructuredModalOpen(false);
    showToast(
      `Mentorship request for ${selectedOffering.duration} sent to ${mentor.name}! Your application is pending mentor review.`,
      'success'
    );
  };

  const tabs: { id: MentorTabType; label: string }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'experience', label: 'Experience & Mentorship' },
    { id: 'slots', label: 'Meeting Slots' },
    { id: 'mentorship', label: 'Mentorship' },
  ];

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6 animate-fade-slide pb-16">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:text-[#101212] hover:bg-white dark:hover:bg-[#181B1A] transition-all border border-gray-200 dark:border-[#262A29] shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>
            {onBackToDiscover
              ? 'Back to Discover'
              : onBackToDashboard || onOpenDashboard
              ? 'Back to Dashboard'
              : 'Back to Feed'}
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          {isOwnProfile && (
            <button
              onClick={() => {
                if (onOpenDashboard) {
                  onOpenDashboard();
                } else if (onBackToDashboard) {
                  onBackToDashboard();
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Edit Mentor Profile in Dashboard"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Share Profile"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 2. Profile Header Card */}
      <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle overflow-hidden relative">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-gradient-to-r from-[#101212] via-[#181B1A] to-[#0D0F0F] border-b border-[#262A29]">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#D9FF3F]/15 rounded-full blur-3xl pointer-events-none" />
          <img
            src={mentor.banner}
            alt="Mentor Cover Banner"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Verification Badge On Banner */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#101212]/90 backdrop-blur-md text-[#D9FF3F] shadow-md border border-[#262A29]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Mentor Account</span>
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-5">
            {/* Avatar & Active Indicator */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-[#181B1A] shadow-xl bg-white dark:bg-gray-800">
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#D9FF3F] text-[#101212] border-2 border-white dark:border-[#181B1A] flex items-center justify-center font-bold"
                title="Verified Mentor"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Primary Action Buttons: Connect & Request Mentorship or Own Profile Actions */}
            <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
              {effectiveOwnProfile ? (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border border-gray-200 dark:border-[#262A29]">
                    <span>Viewing Public Preview</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenDashboard) {
                        onOpenDashboard();
                      } else if (onBackToDashboard) {
                        onBackToDashboard();
                      } else if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('xentro-navigate-tab', { detail: { tab: 'dashboard' } })
                        );
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Manage Workspace</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleToggleConnect}
                    disabled={connectionStatus === 'pending'}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : connectionStatus === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 cursor-not-allowed opacity-90'
                        : connectionStatus === 'received'
                        ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-gray-800 text-[#101212] dark:text-white'
                    }`}
                  >
                    {connectionStatus === 'connected' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Connected</span>
                      </>
                    ) : connectionStatus === 'pending' ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Pending</span>
                      </>
                    ) : connectionStatus === 'received' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Accept Request</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  {connectionStatus === 'connected' && (
                    <button
                      onClick={() => {
                        messagingService.startOrOpenConversation({
                          id: mentor.id || partnerId,
                          name: mentor.name,
                          role: mentor.currentRole?.designation || mentor.primaryExpertise || 'Mentor',
                          avatar: mentor.avatar || '/xentro-logo.png',
                          company: mentor.currentRole?.organization,
                        });
                        showToast(`Opening chat conversation with ${mentor.name}...`, 'success');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (isMentorshipRequested) {
                        showToast('Mentorship request already pending review', 'info');
                      } else {
                        setIsRequestModalOpen(true);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                      isMentorshipRequested
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                    }`}
                  >
                    {isMentorshipRequested ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Request Sent</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Request Mentorship</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#101212] dark:text-white tracking-tight font-display">
                {mentor.name}
              </h1>
              {mentor.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{mentor.verificationBadge || 'Verified Mentor'}</span>
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base font-semibold text-[#101212] dark:text-[#D9FF3F]">
              {mentor.currentRole.designation} · {mentor.currentRole.organization}
            </p>

            {mentor.headline && (
              <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-3xl leading-relaxed">
                {mentor.headline}
              </p>
            )}

            {/* Quick Meta Info (No phone, personal email, or private address) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>{mentor.currentRole.organization}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7]" />
                <span>
                  {mentor.location.city}, {mentor.location.state ? `${mentor.location.state}, ` : ''}{mentor.location.country}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#101212] dark:text-white">
                <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>{mentor.primaryExpertise}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                <Users className="w-4 h-4 text-purple-500" />
                <span>{liveConnectionsCount} Connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation Bar (Basic Info, Experience & Mentorship, Meeting Slots) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-2 shadow-subtle">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'text-[#101212] dark:text-white font-bold'
                    : 'text-[#565B59] font-medium hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D9FF3F] rounded-full" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Content Panels */}
      <div className="animate-fade-slide">
        {/* ========================================================= */}
        {/* TAB 1: BASIC INFO                                         */}
        {/* ========================================================= */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* About Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <BookOpen className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>About</span>
              </h3>
              <p className="text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                {mentor.about}
              </p>
            </div>

            {/* Current Role Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <Briefcase className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Current Role</span>
              </h3>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    {mentor.currentRole.designation}
                  </h4>
                  <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                    {mentor.currentRole.organization}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#565B59] dark:text-[#B6B8B7]">
                  {mentor.currentRole.duration}
                </span>
              </div>
            </div>

            {/* Professional Experience */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <Layers className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Professional Experience</span>
              </h3>
              <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                {mentor.professionalExperience.map((exp, idx) => (
                  <div key={idx} className={`${idx > 0 ? 'pt-4' : ''} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                        {exp.position}
                      </h4>
                      <span className="text-xs font-mono text-[#565B59] dark:text-[#B6B8B7]">
                        {exp.startDate} — {exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                      {exp.organization}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <GraduationCap className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Education</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentor.education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] space-y-1"
                  >
                    <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {edu.startYear} — {edu.endYear}
                    </span>
                    <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                      {edu.degree}
                    </h4>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-medium">
                      {edu.fieldOfStudy}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      {edu.institution}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chips Grid: Expertise, Industries, Areas of Mentorship, Startup Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Expertise Chips */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h4 className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                  Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Industries Chips */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h4 className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                  Industries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.industries.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Areas of Mentorship Chips */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h4 className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                  Areas of Mentorship
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.areasOfMentorship.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Startup Stages Mentored Chips */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h4 className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                  Startup Stages Mentored
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.startupStagesMentored.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Location & Languages */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block mb-1">
                  Location
                </span>
                <p className="text-sm font-semibold text-[#101212] dark:text-white">
                  {mentor.location.city}, {mentor.location.state ? `${mentor.location.state}, ` : ''}{mentor.location.country}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block mb-1">
                  Languages
                </span>
                <p className="text-sm font-semibold text-[#101212] dark:text-white">
                  {mentor.languages.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EXPERIENCE & MENTORSHIP                            */}
        {/* Preserved Order: 1. Mentorship Background                */}
        {/*                  2. Previous Startup Experience           */}
        {/*                  3. Founder Testimonials                 */}
        {/* ========================================================= */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            {/* 1. Mentorship Background */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                    <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Mentorship Background</span>
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {mentor.mentorshipBackground.mentoringExperience}
                  </p>
                </div>

                {/* Number of Founders Mentored: Only displayed as verified if verification data exists */}
                {mentor.mentorshipBackground.isFoundersMentoredVerified && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{mentor.mentorshipBackground.foundersMentoredCount}+ Founders Mentored • Verified</span>
                  </div>
                )}
              </div>

              {/* Founder Types & Stages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block mb-1.5">
                    Founder Profiles Mentored:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.mentorshipBackground.founderTypesMentored.map((ft, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white"
                      >
                        {ft}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block mb-1.5">
                    Areas Mentored:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.mentorshipBackground.areasMentored.map((area, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Programs & Institutions */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                  Programs & Institutions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mentor.mentorshipBackground.programsAndInstitutions.map((prog, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                          {prog.name}
                        </h4>
                        <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                          {prog.period}
                        </span>
                      </div>
                      <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                        {prog.role}
                      </p>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-0.5 leading-relaxed">
                        {prog.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relevant Achievements */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                  Relevant Achievements:
                </span>
                <ul className="space-y-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {mentor.mentorshipBackground.relevantAchievements.map((ach, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F] flex-shrink-0 mt-0.5" />
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. Previous Startup Experience (Individual XENTRO Cards with actual role & contribution) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <Building2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Previous Startup Experience</span>
              </h3>

              {mentor.previousStartupExperience.length === 0 ? (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] italic py-2">
                  No startup experience has been added yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentor.previousStartupExperience.map((st, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-white">
                          <img
                            src={st.startupLogo}
                            alt={st.startupName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate">
                              {st.startupName}
                            </h4>
                            <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                              {st.period}
                            </span>
                          </div>
                          <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                            {st.role}
                          </p>
                          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            {st.industry} · {st.stage}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed pt-1 border-t border-gray-200 dark:border-[#262A29]">
                        &quot;{st.contribution}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Founder Testimonials (Title: "What Founders Say" - NO 5-star ratings) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                <MessageSquare className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>What Founders Say</span>
              </h3>

              {mentor.founderTestimonials.length === 0 ? (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] italic py-2">
                  No founder testimonials available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {mentor.founderTestimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3"
                    >
                      <p className="text-xs sm:text-sm text-[#101212] dark:text-white leading-relaxed italic">
                        &quot;{t.testimonial}&quot;
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#262A29]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={t.founderPhoto}
                              alt={t.founderName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                              {t.founderName}
                            </h4>
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                              {t.founderDesignation} • {t.startupName}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          {t.periodOfMentorship}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MEETING SLOTS                                      */}
        {/* ========================================================= */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                    <Calendar className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Meeting Slots & Availability</span>
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Time Zone: {mentor.meetingSlots.timeZone}
                  </p>
                </div>

                {!effectiveOwnProfile && (
                  <button
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Request a Meeting</span>
                  </button>
                )}
              </div>

              {mentor.meetingSlots.availableTimeSlots.length === 0 ? (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] italic py-2">
                  No meeting slots are currently available.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Session Types */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                      Session Types:
                    </span>
                    <div className="space-y-1">
                      {mentor.meetingSlots.sessionTypes.map((st, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#101212] dark:text-white">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Durations */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                      Durations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.meetingSlots.durations.map((dur, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]">
                          {dur}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Modes */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                      Meeting Mode:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.meetingSlots.meetingModes.map((mode, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Open Slots Overview */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                  Weekly Open Office Hours:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {mentor.meetingSlots.availableDays.map((day, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] space-y-2"
                    >
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {day}
                      </h4>
                      <div className="space-y-1">
                        {mentor.meetingSlots.availableTimeSlots.map((slot, j) => (
                          <div
                            key={j}
                            className="p-1.5 rounded-lg bg-white dark:bg-[#181B1A] text-[11px] font-mono text-[#565B59] dark:text-[#B6B8B7] border border-gray-200 dark:border-[#262A29]"
                          >
                            {slot}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STRUCTURED MENTORSHIP                              */}
        {/* ========================================================= */}
        {activeTab === 'mentorship' && (
          <div className="space-y-6">
            {/* Header / Intro banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 font-display">
                    <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Long-Term Structured Mentorship</span>
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Dedicated 1, 3, or 6-month advisory sprints with strategic goal-tracking, scheduled check-ins, and direct asynchronous guidance.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30 self-start sm:self-auto">
                  {offerings.filter((o) => o.enabled).length} Available Program{offerings.filter((o) => o.enabled).length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">How Structured Mentorship Works: </span>
                  Submitting a mentorship request sends your venture profile and milestones for mentor review. Mentorship does <strong>not</strong> activate immediately. Upon mutual mentor acceptance and verified payment confirmation, your dedicated Mentorship Workspace will unlock.
                </div>
              </div>
            </div>

            {/* Offerings Grid - ONLY enabled offerings */}
            {offerings.filter((o) => o.enabled).length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
                <Briefcase className="w-8 h-8 text-[#565B59] mx-auto" />
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                  No Open Mentorship Programs Currently Available
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                  {mentor.name} is not accepting new structured cohort intakes right now. You can book an individual one-off meeting slot in the &quot;Meeting Slots&quot; tab or connect to receive updates.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('slots')}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all"
                  >
                    View Meeting Slots
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {offerings
                  .filter((o) => o.enabled)
                  .map((offering) => {
                    const isRecommended = offering.duration === '3 Months';
                    const sessionsCount = offering.duration === '1 Month' ? 4 : offering.duration === '3 Months' ? 12 : 24;
                    const sampleRoadmap: Record<string, string[]> = {
                      '1 Month': [
                        'Comprehensive baseline audit & KPI assessment',
                        'Actionable 30-day tactical sprint plan',
                        'Bi-weekly live video reviews + direct messaging access',
                      ],
                      '3 Months': [
                        'Product-market fit validation & customer discovery',
                        'Enterprise ACV pricing and contract structuring',
                        'Investor pitch deck overhaul & fundraising rehearsal',
                      ],
                      '6 Months': [
                        'End-to-end venture acceleration & scaling blueprint',
                        'Executive leadership hiring & tech defense moat',
                        'Institutional SAFE / Series A lead investor diligence',
                      ],
                    };
                    const roadmapItems = sampleRoadmap[offering.duration] || offering.areasCovered;

                    return (
                      <div
                        key={offering.id}
                        className={`rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                          isRecommended
                            ? 'bg-white dark:bg-gradient-to-b dark:from-[#181B1A] dark:to-[#121413] border-2 border-[#D9FF3F] shadow-lg shadow-[#D9FF3F]/15 dark:shadow-[#D9FF3F]/5'
                            : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle'
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212] uppercase tracking-wider shadow-xs">
                            Recommended Sprint
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Duration & Price */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                              {offering.duration} Advisory Engagement
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-[#101212] dark:text-white font-display">
                                {offering.price === 0 ? 'Free' : `${offering.currency} ${offering.price.toLocaleString()}`}
                              </span>
                              {offering.price > 0 && (
                                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                                  total package
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sessions & Access Highlights */}
                          <div className="space-y-2 py-3 border-y border-gray-100 dark:border-[#262A29] text-xs">
                            <div className="flex items-center gap-2 text-[#101212] dark:text-white font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                              <span>{sessionsCount} dedicated deep-dive sessions</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#101212] dark:text-white font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                              <span>{offering.meetingFrequency || 'Bi-weekly 45-min strategic reviews'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#101212] dark:text-white font-medium">
                              <MessageSquare className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                              <span>Async {offering.communicationMode || 'Slack & Xentro Messaging'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#101212] dark:text-white font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                              <span>Xentro escrow protected & Milestone tracked</span>
                            </div>
                          </div>

                          {/* Areas Covered */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                              Focus Areas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {offering.areasCovered.map((area, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Deliverables / Roadmap Preview */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                              Deliverables & Roadmap:
                            </span>
                            <ul className="space-y-1 text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                              {roadmapItems.map((del, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F] shrink-0 mt-0.5" />
                                  <span>{del}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="pt-5 mt-4 border-t border-gray-100 dark:border-[#262A29]">
                          {effectiveOwnProfile ? (
                            <button
                              onClick={() => {
                                if (onOpenDashboard) {
                                  onOpenDashboard();
                                } else if (onBackToDashboard) {
                                  onBackToDashboard();
                                } else if (typeof window !== 'undefined') {
                                  window.dispatchEvent(
                                    new CustomEvent('xentro-navigate-tab', { detail: { tab: 'dashboard' } })
                                  );
                                }
                              }}
                              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Manage in Workspace</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedOffering(offering);
                                  setReqSelectedAreas(offering.areasCovered);
                                  setRequestStep(1);
                                  setIsStructuredModalOpen(true);
                                }}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isRecommended
                                    ? 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-md'
                                    : 'bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#282D2B] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]'
                                }`}
                              >
                                <span>Request Mentorship</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <p className="text-[10px] text-center text-[#565B59] dark:text-[#B6B8B7] mt-1.5">
                                No charge until mentor approves
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Testimonials from completed mentorships under this mentor */}
            {(() => {
              const completedTestimonials = getMentorshipHistory().filter(
                (m) =>
                  m.finalStatus === 'Completed' &&
                  m.testimonial &&
                  m.testimonial.isPubliclyDisplayed
              );
              if (completedTestimonials.length === 0) return null;

              return (
                <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Verified Mentorship Outcomes</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedTestimonials.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
                      >
                        <p className="text-xs text-[#101212] dark:text-white italic leading-relaxed">
                          &quot;{m.testimonial?.content}&quot;
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200 dark:border-gray-800 text-[#565B59] dark:text-[#B6B8B7]">
                          <span className="font-bold text-[#101212] dark:text-white">
                            {m.testimonial?.founderName || m.founderName} ({m.startupName})
                          </span>
                          <span>{m.duration} Engagement</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 5. Request Mentorship Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-slide">
          <div
            className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] bg-[#D9FF3F]/20 px-2.5 py-0.5 rounded-full">
                Mentorship Request
              </span>
              <h3 className="text-lg font-bold text-[#101212] dark:text-white font-display">
                Request Mentorship with {mentor.name}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Initial communication is handled securely through the XENTRO ecosystem.
              </p>
            </div>

            <form onSubmit={handleConfirmMentorshipRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#101212] dark:text-white block mb-1">
                  Strategic Focus Area
                </label>
                <select
                  value={requestFocusArea}
                  onChange={(e) => setRequestFocusArea(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                >
                  {mentor.areasOfMentorship.map((area, i) => (
                    <option key={i} value={area} className="bg-white dark:bg-[#181B1A]">
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#101212] dark:text-white block mb-1">
                  Reason / Context for Request
                </label>
                <textarea
                  required
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain your venture's current stage, key challenges, and how this mentor's background will assist..."
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Request a Meeting Modal Flow */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-slide">
          <div
            className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-md w-full p-6 space-y-5 relative overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setIsMeetingModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] bg-[#D9FF3F]/20 px-2.5 py-0.5 rounded-full">
                Meeting Request
              </span>
              <h3 className="text-lg font-bold text-[#101212] dark:text-white font-display">
                Request a Meeting with {mentor.name}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Does not automatically confirm mentorship relationship.
              </p>
            </div>

            <form onSubmit={handleConfirmMeetingRequest} className="space-y-3.5">
              {/* Step 1: Session Type */}
              <div>
                <label className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {mentor.meetingSlots.sessionTypes.map((type, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSessionType(type)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        selectedSessionType === type
                          ? 'bg-[#D9FF3F] text-[#101212] border-[#D9FF3F]'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Duration */}
              <div>
                <label className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                  Duration
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {mentor.meetingSlots.durations.map((dur, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDuration(dur)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedDuration === dur
                          ? 'bg-[#D9FF3F] text-[#101212] border-[#D9FF3F]'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Available Time Slot */}
              <div>
                <label className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                  Available Slot ({mentor.meetingSlots.timeZone})
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                >
                  {mentor.meetingSlots.availableTimeSlots.map((slot, i) => (
                    <option key={i} value={slot} className="bg-white dark:bg-[#181B1A]">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Meeting Mode */}
              <div>
                <label className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                  Meeting Mode
                </label>
                <div className="flex gap-2">
                  {mentor.meetingSlots.meetingModes.map((mode, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedMeetingMode(mode)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedMeetingMode === mode
                          ? 'bg-[#D9FF3F] text-[#101212] border-[#D9FF3F]'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 5: Context / Reason */}
              <div>
                <label className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                  Meeting Reason / Agenda
                </label>
                <textarea
                  required
                  rows={2}
                  value={meetingReason}
                  onChange={(e) => setMeetingReason(e.target.value)}
                  placeholder="Outline key questions or discussion points..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submit Meeting Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Structured Mentorship Request Modal (Multi-step wizard) */}
      {isStructuredModalOpen && selectedOffering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-slide">
          <div
            className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden relative"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] bg-[#D9FF3F]/20 px-2.5 py-0.5 rounded-full">
                    {selectedOffering.duration} Sprint
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    {selectedOffering.price === 0 ? 'Free / Pro Bono' : `${selectedOffering.currency} ${selectedOffering.price.toLocaleString()}`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-display">
                  Request Mentorship with {mentor.name}
                </h3>
              </div>
              <button
                onClick={() => setIsStructuredModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial Notice */}
            <div className="px-5 sm:px-6 pt-4 shrink-0">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> Submitting this request sends your venture for review. It does <strong>NOT</strong> activate mentorship or initiate billing. Activation occurs only after mentor acceptance and payment confirmation.
                </span>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitStructuredRequest} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Auto-populated Founder & Startup Info */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    Auto-Populated Profile Data
                  </span>
                  <span className="text-[10px] text-[#9EBE12] dark:text-[#D9FF3F] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Linked to Xentro Account
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Startup</span>
                    <input
                      type="text"
                      value={reqStartupName}
                      onChange={(e) => setReqStartupName(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-semibold text-[#101212] dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">Stage</span>
                    <input
                      type="text"
                      value={reqStartupStage}
                      onChange={(e) => setReqStartupStage(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-semibold text-[#101212] dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mentorship Focus Areas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Mentorship Areas Required
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOffering.areasCovered.map((area, idx) => {
                    const isSelected = reqSelectedAreas.includes(area);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setReqSelectedAreas(reqSelectedAreas.filter((a) => a !== area));
                          } else {
                            setReqSelectedAreas([...reqSelectedAreas, area]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D9FF3F] text-[#101212] border border-[#D9FF3F]'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border border-gray-200 dark:border-[#262A29]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Preferred Start Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Immediate', 'In 2 Weeks', 'Next Month', 'Flexible'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setReqStartDate(d)}
                      className={`py-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        reqStartDate === d
                          ? 'bg-[#D9FF3F] text-[#101212] font-bold border-[#D9FF3F]'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context & Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Reason for Choosing This Mentor
                </label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Why is this mentor the right strategic advisor for your current inflection point?"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              {/* Challenges */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Current Key Challenges / Bottlenecks
                </label>
                <textarea
                  rows={2}
                  value={reqChallenges}
                  onChange={(e) => setReqChallenges(e.target.value)}
                  placeholder="e.g. Closing enterprise ACVs, converting POC pilots, scaling go-to-market architecture..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              {/* Target Outcomes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Target Outcomes for this {selectedOffering.duration}
                </label>
                <textarea
                  rows={2}
                  value={reqOutcomes}
                  onChange={(e) => setReqOutcomes(e.target.value)}
                  placeholder="What measurable goals or milestones do you want to accomplish together?"
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              {/* Personal message */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white block">
                  Personal Intro Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="Any additional context you'd like to share with the mentor..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsStructuredModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Mentorship Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
