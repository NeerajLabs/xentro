'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
  Check,
  CheckCircle2,
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Layers,
  Send,
  MessageSquare,
  FileText,
  Calendar,
  X,
  Clock,
  Award,
  Users,
  Target,
  ArrowRight,
  Compass,
  Zap,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  FullInvestorProfile,
  PortfolioCompany,
  InvestorAccountType,
  InvestorVisibility,
} from '@/types/investor';
import { getInvestorProfileById } from '@/data/investorProfilesData';
import {
  getStoredInvestorProfile,
  INVESTOR_PROFILE_UPDATED_EVENT,
} from '@/lib/investorProfileState';
import { investorDomainService } from '@/lib/investorDomainService';
import { messagingService } from '@/lib/messagingService';

export type InvestorTabType =
  | 'about'
  | 'investment_profile'
  | 'portfolio_experience'
  | 'connect'
  | 'content_activities';

interface InvestorProfileViewProps {
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
  investorData?: FullInvestorProfile;
  investorId?: string;
  onOpenStartupProfile?: (startupId: string) => void;
  onEditProfile?: () => void;
  isOwnProfile?: boolean;
}

export const InvestorProfileView: React.FC<InvestorProfileViewProps> = ({
  onBackToFeed,
  onBackToDiscover,
  investorData,
  investorId,
  onOpenStartupProfile,
  onEditProfile,
  isOwnProfile = false,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<InvestorTabType>('about');

  // Load investor data dynamically with live stored state (own view uses empty shell, not the demo record)
  const [investor, setInvestor] = useState<FullInvestorProfile>(() =>
    investorData ||
    getStoredInvestorProfile(isOwnProfile ? 'inv_own' : (investorId || 'inv_1'), {
      ownProfile: isOwnProfile,
    })
  );

  useEffect(() => {
    if (investorData) {
      setInvestor(investorData);
    }
  }, [investorData]);

  // Interactive local states
  const [isConnected, setIsConnected] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Settings & Visibility live subscription
  const [liveSettings, setLiveSettings] = useState(() => investorDomainService.getSettings());
  const [liveAccountType, setLiveAccountType] = useState<InvestorAccountType>(() =>
    investorDomainService.getAccountType()
  );

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.profile) {
        setInvestor(ce.detail.profile);
      } else {
        setInvestor(
          getStoredInvestorProfile(isOwnProfile ? 'inv_own' : (investorId || 'inv_1'), {
            ownProfile: isOwnProfile,
          })
        );
      }
    };

    const handleSettingsChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.settings) {
        setLiveSettings(ce.detail.settings);
      } else {
        setLiveSettings(investorDomainService.getSettings());
      }
    };

    const handleAccountChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.type) {
        setLiveAccountType(ce.detail.type);
      }
    };

    window.addEventListener(INVESTOR_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    window.addEventListener('xentro-investor-settings-changed', handleSettingsChanged);
    window.addEventListener('xentro-investor-account-changed', handleAccountChanged);

    return () => {
      window.removeEventListener(INVESTOR_PROFILE_UPDATED_EVENT, handleProfileUpdate);
      window.removeEventListener('xentro-investor-settings-changed', handleSettingsChanged);
      window.removeEventListener('xentro-investor-account-changed', handleAccountChanged);
    };
  }, [investorId]);

  // Effective values adhering to Investor Connect & Privacy settings
  const effectiveVisibility = (liveSettings.visibility || investor.visibility || 'public') as InvestorVisibility;
  const effectiveOpenToPitches =
    liveSettings.openToPitches !== undefined
      ? liveSettings.openToPitches
      : investor.connectionPreferences.openToStartupPitches;
  const effectiveOpenToConnections =
    liveSettings.openToConnections !== undefined
      ? liveSettings.openToConnections
      : investor.connectionPreferences.openToConnectionRequests;
  const effectiveWarmIntroPreferred =
    liveSettings.warmIntroPreferred !== undefined
      ? liveSettings.warmIntroPreferred
      : investor.investmentProcess.warmIntroPreferred;
  const effectiveCheque =
    liveSettings.chequeMin && liveSettings.chequeMax
      ? `${liveSettings.chequeMin} – ${liveSettings.chequeMax}`
      : investor.investmentFocus.ticketSize.formatted;

  // Modals
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);

  // Pitch Form State
  const [pitchStartupName, setPitchStartupName] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [pitchAskAmount, setPitchAskAmount] = useState('');
  const [pitchStage, setPitchStage] = useState('Seed');
  const [pitchSummary, setPitchSummary] = useState('');

  // Message & Intro Form State
  const [messageText, setMessageText] = useState('');
  const [introMutualContext, setIntroMutualContext] = useState('');

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Investor profile link copied to clipboard!', 'success');
  };

  const handleToggleConnect = () => {
    if (!effectiveOpenToConnections) {
      showToast(`${investor.name} is currently not accepting direct connection requests.`, 'info');
      return;
    }
    const next = !isConnected;
    setIsConnected(next);
    if (next) {
      showToast(`Connected with ${investor.name}!`, 'success');
    } else {
      showToast(`Disconnected from ${investor.name}.`, 'info');
    }
  };

  const handleToggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    if (next) {
      showToast(`${investor.name} saved to your bookmarks!`, 'success');
    } else {
      showToast(`Removed from bookmarks.`, 'info');
    }
  };

  const handleBack = () => {
    if (onBackToDiscover) {
      onBackToDiscover();
    } else if (onBackToFeed) {
      onBackToFeed();
    }
  };

  const handlePitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPitchModalOpen(false);
    showToast(
      `Pitch for ${pitchStartupName || 'your startup'} sent to ${investor.name}!`,
      'success'
    );
    setPitchStartupName('');
    setPitchDeckUrl('');
    setPitchAskAmount('');
    setPitchSummary('');
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      showToast('Please connect with this investor first before messaging.', 'error');
      setIsMessageModalOpen(false);
      return;
    }
    const textToSend = messageText.trim();
    setIsMessageModalOpen(false);
    setMessageText('');
    messagingService.startOrOpenConversation({
      id: investor.id,
      name: investor.name,
      role: investor.currentRole || investor.investorType || 'Investor',
      avatar: investor.logo || '/xentro-logo.png',
      company: investor.organization,
      initialMessage: textToSend || undefined,
    });
  };

  const handleIntroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsIntroModalOpen(false);
    showToast(
      `Introduction request sent to ${investor.name} team!`,
      'success'
    );
    setIntroMutualContext('');
  };

  // Exactly 5 Top-Level Navigation Tabs
  const tabs: { id: InvestorTabType; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'investment_profile', label: 'Investment Profile' },
    { id: 'portfolio_experience', label: 'Portfolio & Experience' },
    { id: 'connect', label: 'Connect' },
    { id: 'content_activities', label: 'Content / Activities' },
  ];

  // Pipeline stages for Preferred Traction
  const tractionPipeline = ['Idea', 'MVP', 'Early Revenue', 'PMF', 'Growth'] as const;

  // Filtered testimonials that have verification or valid data
  const publicTestimonials = investor.testimonials || [];

  return (
    <div className="w-full max-w-[1060px] mx-auto space-y-6 animate-fade-slide pb-16">
      {/* Visibility / Ghost Mode Alert Banner */}
      {effectiveVisibility === 'ghost' && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 flex items-center justify-between text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>
              <strong>Ghost Mode Active:</strong> This investor profile is browsing anonymously. Direct pitch inbound and directory listings are restricted.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] uppercase tracking-wider">
            Anonymous
          </span>
        </div>
      )}

      {effectiveVisibility === 'private' && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-center justify-between text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Private Profile:</strong> Unlisted profile. Accessible only via direct share link or mutual warm introduction.
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
            Private
          </span>
        </div>
      )}

      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:text-[#101212] hover:bg-white dark:hover:bg-[#181B1A] transition-all border border-gray-200 dark:border-[#262A29] shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{onBackToDiscover ? 'Back to Discover' : 'Back to Feed'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          {isOwnProfile && (
            <button
              onClick={() => {
                if (onEditProfile) {
                  onEditProfile();
                } else {
                  showToast('Opening profile editor in Account Settings...', 'info');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Edit Profile
            </button>
          )}

          <button
            onClick={handleToggleSave}
            className={`p-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] transition-all shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300'
                : 'bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
            title={isSaved ? 'Saved to bookmarks' : 'Save investor'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

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
            src={investor.banner}
            alt={`${investor.name} Banner`}
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Verification Badge On Banner */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#101212]/90 backdrop-blur-md text-[#D9FF3F] shadow-md border border-[#262A29]">
              <TrendingUp className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Investor Account</span>
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-5">
            {/* Logo / Avatar & Active Indicator */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-[#181B1A] shadow-xl bg-white dark:bg-[#202422]">
                <img
                  src={investor.logo}
                  alt={investor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {investor.verified && (
                <div
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#D9FF3F] text-[#101212] border-2 border-white dark:border-[#181B1A] flex items-center justify-center font-bold shadow-md"
                  title="Verified Investor"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Header Actions (Strictly obeys Investor Connect Settings) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              {/* Message button */}
              <button
                onClick={() => setIsMessageModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
                <span>Message</span>
              </button>

              {/* Pitch Button (Strictly responds to Connect Preferences) */}
              <button
                onClick={() => {
                  if (investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches) {
                    showToast(`${investor.name} is currently not accepting new pitches.`, 'info');
                  } else {
                    setIsPitchModalOpen(true);
                  }
                }}
                disabled={investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    : 'bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-[#D9FF3F] cursor-pointer active:scale-95'
                }`}
                title={
                  investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches
                    ? 'Pitches currently closed by investor settings'
                    : 'Pitch your venture to this investor'
                }
              >
                <FileText className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>
                  {investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches
                    ? 'Pitches Closed'
                    : 'Send Pitch'}
                </span>
              </button>

              {/* Primary Connect CTA */}
              <button
                onClick={handleToggleConnect}
                disabled={!effectiveOpenToConnections && !isConnected}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${
                  !effectiveOpenToConnections && !isConnected
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    : isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer'
                    : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] cursor-pointer'
                }`}
                title={
                  !effectiveOpenToConnections && !isConnected
                    ? 'Connection requests closed by investor settings'
                    : isConnected
                    ? 'Connected'
                    : 'Connect with investor'
                }
              >
                {isConnected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#101212]" />
                    <span>Connect</span>
                  </>
                )}
              </button>

              {isConnected && (
                <button
                  onClick={() =>
                    messagingService.startOrOpenConversation({
                      id: investor.id,
                      name: investor.name,
                      role: investor.currentRole || investor.investorType || 'Investor',
                      avatar: investor.logo || '/xentro-logo.png',
                      company: investor.organization,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#101212] dark:bg-white text-white dark:text-[#101212] hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title={`Message ${investor.name}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>
              )}
            </div>
          </div>

          {/* Name & Headline Information */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#101212] dark:text-white font-heading">
                {investor.name}
              </h1>
              {investor.verified && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30">
                    <CheckCircle2 className="w-3 h-3 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Verified Investor</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Identity & Org Verified</span>
                  </span>
                </div>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                {investor.investorType}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-gray-300">
                {liveAccountType === 'organization' ? 'Entity Account' : 'Individual Angel'}
              </span>
            </div>

            <p className="text-sm font-semibold text-[#101212] dark:text-[#D9FF3F]">
              {investor.currentRole} · {investor.organization}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                {investor.location.city}
                {investor.location.state ? `, ${investor.location.state}` : ''}, {investor.location.country}
              </span>

              {investor.website && (
                <a
                  href={investor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#101212] dark:text-[#D9FF3F] font-semibold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{investor.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              {investor.linkedIn && (
                <a
                  href={investor.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#101212] dark:text-[#D9FF3F] font-semibold hover:underline"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Check: {effectiveCheque}</span>
              </span>
            </div>

            {/* Primary Focus Pill */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#D9FF3F]/10 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/20">
                <Target className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Focus: {investor.primaryInvestmentFocus}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs Bar (Exactly 5 top-level sections) */}
        <div className="px-6 sm:px-8 border-t border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#181B1A]/60 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'border-[#D9FF3F] text-[#101212] dark:text-white font-extrabold'
                    : 'border-transparent text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: ABOUT                                              */}
        {/* ========================================================= */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Identity & Introduction Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>About {investor.name}</span>
                </h3>
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  {investor.yearsOfInvestingExperience}
                </span>
              </div>

              <p className="text-sm text-[#101212] dark:text-white leading-relaxed font-medium">
                {investor.bio}
              </p>

              {investor.background && (
                <div className="pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <h4 className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider mb-2">
                    Background & Institutional Context
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {investor.background}
                  </p>
                </div>
              )}
            </div>

            {/* Investor Overview Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investor Overview</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    Who We Invest In
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed font-medium">
                    {investor.overview.whoTheyInvestIn}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    Sectors We Focus On
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed font-medium">
                    {investor.overview.sectorsFocus}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    Investment Philosophy
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed font-medium">
                    {investor.overview.investmentPhilosophy}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                    What We Aim To Contribute
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed font-medium">
                    {investor.overview.aimToContribute}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Identity & Professional Overview Card (Keeps About strictly focused on who the investor is) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Profile & Professional Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Entity Type</span>
                  <span className="font-bold text-[#101212] dark:text-white">{investor.investorType}</span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Firm / Fund</span>
                  <span className="font-bold text-[#101212] dark:text-white">{investor.organization || investor.name}</span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Role / Position</span>
                  <span className="font-bold text-[#101212] dark:text-white">{investor.currentRole}</span>
                </div>
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Headquarters</span>
                  <span className="font-bold text-[#101212] dark:text-white">{investor.location.city}, {investor.location.country}</span>
                </div>
              </div>
            </div>

            {/* Investor Organization Information (Public Institutional Info - Never leaks internal RBAC / private team) */}
            {investor.investorType !== 'Angel Investor' && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                    <span>Investor Organization Information</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Organization Verified</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Organization</span>
                    <strong className="text-[#101212] dark:text-white">{investor.organization || investor.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Firm Type</span>
                    <strong className="text-[#101212] dark:text-white">{investor.investorType}</strong>
                  </div>
                  <div>
                    <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Headquarters</span>
                    <strong className="text-[#101212] dark:text-white">{investor.location.city}, {investor.location.country}</strong>
                  </div>
                  <div>
                    <span className="text-[#565B59] dark:text-[#B6B8B7] block mb-0.5">Experience Track</span>
                    <strong className="text-[#101212] dark:text-white">{investor.yearsOfInvestingExperience}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>Investment Team:</span>
                    <span className="font-semibold text-[#101212] dark:text-white">Multidisciplinary Partners, Sector Specialists & Diligence Analysts</span>
                  </div>
                  {investor.website && (
                    <a
                      href={investor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                    >
                      <span>Visit Firm Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVESTMENT PROFILE                                 */}
        {/* ========================================================= */}
        {activeTab === 'investment_profile' && (
          <div className="space-y-6 animate-fade-slide">
            {/* SUBSECTION A: INVESTMENT FOCUS */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Investment Focus</span>
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  Cheque Range: {effectiveCheque}
                </span>
              </div>

              {/* Target Sectors */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                  Target Sectors
                </span>
                <div className="flex flex-wrap gap-2">
                  {investor.investmentFocus.sectors.map((sector, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>

              {/* Startup Stages */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                  Target Startup Stages
                </span>
                <div className="flex flex-wrap gap-2">
                  {investor.investmentFocus.stages.map((stg, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      {stg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Geography & Business Models */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Target Geography
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.investmentFocus.geography.countries.map((c, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Business Models
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.investmentFocus.businessModels.map((bm, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29]"
                      >
                        {bm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead, Co-investor & Investment Instruments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-[#262A29] text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Lead Investor Role
                  </span>
                  <p className="font-bold text-[#101212] dark:text-white">
                    {investor.investmentFocus.leadInvestorPreference || 'Lead / Co-lead Preferred'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Co-investor Preference
                  </span>
                  <p className="font-bold text-[#101212] dark:text-white truncate" title={investor.investmentFocus.coInvestorPreference || 'Open to syndicating with verified funds & angels'}>
                    {investor.investmentFocus.coInvestorPreference || 'Open to syndicating with verified funds & angels'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Instruments
                  </span>
                  <p className="font-bold text-[#101212] dark:text-white">
                    {(investor.investmentFocus.investmentInstruments || ['Priced Equity', 'SAFE', 'Convertible']).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* SUBSECTION B: VALUE BEYOND CAPITAL */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Zap className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Value Beyond Capital</span>
              </h3>

              {/* What I Bring To Founders */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 space-y-1.5">
                <span className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] uppercase tracking-wider block">
                  What We Bring to Founders
                </span>
                <p className="text-xs sm:text-sm text-[#101212] dark:text-white leading-relaxed font-medium">
                  "{investor.valueBeyondCapital.whatIBringToFounders}"
                </p>
              </div>

              {/* Support Areas */}
              <div className="space-y-2.5">
                <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                  Active Support Areas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {investor.valueBeyondCapital.supportAreas.map((area, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2.5 text-xs font-semibold text-[#101212] dark:text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F] flex-shrink-0" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {investor.valueBeyondCapital.advisoryCapabilities && investor.valueBeyondCapital.advisoryCapabilities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Advisory Capabilities
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {investor.valueBeyondCapital.advisoryCapabilities.map((cap, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* SUBSECTION C: INVESTMENT CRITERIA & TRACTION */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Target className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investment Criteria & Preferred Traction</span>
              </h3>

              {/* Preferred Traction Pipeline */}
              <div className="space-y-2.5">
                <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                  Preferred Traction Stage
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {tractionPipeline.map((trStage) => {
                    const isSupported = investor.investmentCriteria.preferredTraction.includes(trStage);
                    return (
                      <div
                        key={trStage}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSupported
                            ? 'bg-[#D9FF3F]/15 border-[#D9FF3F]/40 text-[#101212] dark:text-white font-bold'
                            : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] opacity-60 font-medium'
                        }`}
                      >
                        <div className="text-[11px] uppercase tracking-wider mb-1">
                          {isSupported ? '✓ Backed' : '—'}
                        </div>
                        <div className="text-xs font-bold truncate">{trStage}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Core Evaluation Factors */}
              {investor.investmentCriteria.evaluationCriteria && investor.investmentCriteria.evaluationCriteria.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Core Evaluation Factors
                  </span>
                  <div className="space-y-2">
                    {investor.investmentCriteria.evaluationCriteria.map((crit, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2.5 text-xs font-semibold text-[#101212] dark:text-white"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{crit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diligence Highlights */}
              {investor.investmentCriteria.diligenceHighlights && investor.investmentCriteria.diligenceHighlights.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <span className="text-xs uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                    Key Diligence Highlights
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {investor.investmentCriteria.diligenceHighlights.map((dh, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2 text-[#565B59] dark:text-[#B6B8B7]"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F] flex-shrink-0" />
                        <span>{dh}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SUBSECTION D: INVESTMENT PROCESS */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Investment Process & Timeline</span>
                </h3>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] font-semibold">
                  Decision: {investor.investmentProcess.typicalDecisionTimeline}
                </span>
              </div>

              {/* Stepper Timeline */}
              <div className="space-y-3">
                {investor.investmentProcess.stages.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs mt-0.5">
                      {step.stepNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                          {step.title}
                        </h4>
                        {step.estimatedTime && (
                          <span className="text-[11px] font-semibold text-[#9EBE12] dark:text-[#D9FF3F]">
                            {step.estimatedTime}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Process Guidance Summary */}
              <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#101212] dark:text-white">Preferred Way to Connect:</span>
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">{investor.investmentProcess.preferredConnectionMethod}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#101212] dark:text-white">Warm Intro Preferred:</span>
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">
                    {effectiveWarmIntroPreferred ? 'Yes (Platform introduction recommended)' : 'No (Direct inbound accepted)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#101212] dark:text-white">Pitch Deck Requirements:</span>
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">{investor.investmentProcess.pitchDeckRequirements}</span>
                </div>
                {investor.investmentProcess.informationRequiredInitially && investor.investmentProcess.informationRequiredInitially.length > 0 && (
                  <div className="pt-2 border-t border-gray-200/60 dark:border-[#262A29] space-y-1">
                    <span className="font-bold text-[#101212] dark:text-white block">Information Required Initially:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#565B59] dark:text-[#B6B8B7]">
                      {investor.investmentProcess.informationRequiredInitially.map((info, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#9EBE12] dark:text-[#D9FF3F]" />
                          <span>{info}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PORTFOLIO & EXPERIENCE                             */}
        {/* ========================================================= */}
        {activeTab === 'portfolio_experience' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Investment Experience Statistics */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Investment Experience & Track Record</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Platform Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-[#101212] dark:text-white block font-heading">
                    {investor.experienceStats.totalInvestments || '—'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Investments
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-[#101212] dark:text-[#D9FF3F] block font-heading">
                    {investor.experienceStats.activePortfolio || '—'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Active Portfolio
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-[#101212] dark:text-white block font-heading">
                    {investor.experienceStats.followOnInvestments || '—'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Follow-on Rounds
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block font-heading">
                    {investor.experienceStats.exits || '—'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Exits / IPOs
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-[#101212] dark:text-white block font-heading">
                    {investor.experienceStats.yearsOfExperience || '10+'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Experience
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center">
                  <span className="text-lg font-bold text-[#101212] dark:text-white block font-heading">
                    {investor.experienceStats.industriesInvested || '—'}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-semibold uppercase">
                    Industries
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] text-center pt-1">
                Metrics reflect verified fund track record & portfolio entries. Manually submitted data is audited through the Xentro verification network.
              </p>
            </div>

            {/* Portfolio Companies */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Portfolio Companies</span>
                </h3>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] font-semibold">
                  {investor.portfolio.length} Featured Companies
                </span>
              </div>

              {investor.portfolio.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <p className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    No public portfolio companies listed yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investor.portfolio.map((company) => {
                    const hasXentroProfile = !!company.xentroStartupId;
                    return (
                      <div
                        key={company.id}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200/80 dark:border-[#262A29] space-y-3 flex flex-col justify-between hover:border-[#D9FF3F]/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                                {company.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  company.currentStatus === 'IPO'
                                    ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                    : company.currentStatus === 'Acquired'
                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {company.currentStatus}
                              </span>
                            </div>
                            <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold truncate">
                              {company.sector}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5">
                              <span>Invested: {company.stageInvested} ({company.investmentYear})</span>
                            </div>
                          </div>
                        </div>

                        {company.description && (
                          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                            {company.description}
                          </p>
                        )}

                        {hasXentroProfile && (
                          <button
                            onClick={() => {
                              if (onOpenStartupProfile && company.xentroStartupId) {
                                onOpenStartupProfile(company.xentroStartupId);
                              } else {
                                showToast(`Opening ${company.name} venture profile...`, 'info');
                              }
                            }}
                            className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <span>View Xentro Startup Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Founder Testimonials (Cleanly hidden if none exist) */}
            {publicTestimonials.length > 0 && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                  <Users className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Founder Testimonials & Endorsements</span>
                </h3>

                <div className="space-y-4">
                  {publicTestimonials.map((test) => (
                    <div
                      key={test.id}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200/80 dark:border-[#262A29] space-y-3"
                    >
                      <p className="text-xs sm:text-sm text-[#101212] dark:text-white italic leading-relaxed">
                        "{test.testimonial}"
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-[#262A29]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-200">
                            <img
                              src={test.founderAvatar}
                              alt={test.founderName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#101212] dark:text-white">
                                {test.founderName}
                              </span>
                              {test.verified && (
                                <CheckCircle2 className="w-3 h-3 text-[#9EBE12] dark:text-[#D9FF3F]" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                              {test.founderRole} · {test.startupName}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-[#565B59] dark:text-[#B6B8B7] hidden sm:inline-block">
                          {test.relationship}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: CONNECT                                            */}
        {/* ========================================================= */}
        {activeTab === 'connect' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Connection Preferences Status Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Connection & Pitching Preferences</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                    Direct Connections
                  </span>
                  <span className={`text-xs font-bold ${effectiveOpenToConnections ? 'text-[#101212] dark:text-white' : 'text-rose-500'}`}>
                    {effectiveOpenToConnections ? '✓ Open to Requests' : '✕ Closed'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                    Startup Pitches
                  </span>
                  <span className={`text-xs font-bold ${effectiveOpenToPitches && !investor.connectionPreferences.notAcceptingNewPitches ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {effectiveOpenToPitches && !investor.connectionPreferences.notAcceptingNewPitches ? '✓ Open to Pitches' : '✕ Pitches Closed'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                    Introduction Mode
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    {effectiveWarmIntroPreferred ? 'Warm Intro Preferred' : 'Direct Inbound OK'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase block mb-1">
                    Fund Deployment
                  </span>
                  <span className="text-xs font-bold text-[#9EBE12] dark:text-[#D9FF3F]">
                    {investor.connectionPreferences.currentlyInvesting ? '● Actively Investing' : '○ Not Deploying'}
                  </span>
                </div>
              </div>

              {investor.connectionPreferences.guidelines && (
                <div className="p-4 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 text-xs text-[#101212] dark:text-white">
                  <span className="font-bold block mb-0.5">Investor Inbound Note:</span>
                  <p className="text-[#565B59] dark:text-[#B6B8B7]">
                    {investor.connectionPreferences.guidelines}
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Action Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action 1: Send Pitch */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F]/15 flex items-center justify-center text-[#101212] dark:text-[#D9FF3F]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Submit Formal Startup Pitch
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    Share your pitch deck, current funding round ask, and product traction directly with {investor.name}’s investment team.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches) {
                      showToast(`${investor.name} is not accepting new pitches at this time.`, 'info');
                    } else {
                      setIsPitchModalOpen(true);
                    }
                  }}
                  disabled={investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                    investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches
                      ? 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] cursor-not-allowed opacity-60'
                      : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] cursor-pointer active:scale-95'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {investor.connectionPreferences.notAcceptingNewPitches || !effectiveOpenToPitches
                      ? 'Pitches Currently Closed'
                      : 'Send Pitch Deck'}
                  </span>
                </button>
              </div>

              {/* Action 2: Request Warm Introduction */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#202422] flex items-center justify-center text-[#101212] dark:text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Request Platform Introduction
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    Leverage your mutual Xentro connections, verified mentors, or alumni to request an endorsed introduction.
                  </p>
                </div>

                <button
                  onClick={() => setIsIntroModalOpen(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Request Introduction</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CONTENT / ACTIVITIES                               */}
        {/* ========================================================= */}
        {activeTab === 'content_activities' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Published Content & Insights */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <FileText className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investment Insights & Published Content</span>
              </h3>

              {investor.content.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <p className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    No public content available yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investor.content.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200/80 dark:border-[#262A29] space-y-2.5 hover:border-[#D9FF3F]/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        <span className="uppercase font-bold tracking-wider text-[#9EBE12] dark:text-[#D9FF3F]">
                          {item.type.replace('_', ' ')}
                        </span>
                        <span>{item.publishedAt} · {item.readTime}</span>
                      </div>

                      <h4 className="text-sm font-bold text-[#101212] dark:text-white hover:text-[#9EBE12] dark:hover:text-[#D9FF3F] transition-colors cursor-pointer">
                        {item.title}
                      </h4>

                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                        {item.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-200/60 dark:border-[#262A29] gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] border border-gray-200 dark:border-[#262A29]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                          <span>{item.metrics.likes} likes</span>
                          <span>{item.metrics.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Public Activity Timeline */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Clock className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Public Ecosystem Activities</span>
              </h3>

              {investor.activities.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <p className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    No recent public activity to display.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {investor.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3.5"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D9FF3F] mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                            {act.title}
                          </h4>
                          <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            {act.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: SEND PITCH MODAL                                 */}
      {/* ========================================================= */}
      {isPitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Pitch to {investor.name}
                </h3>
              </div>
              <button
                onClick={() => setIsPitchModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePitchSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Startup Venture Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portfolio Company Name"
                  value={pitchStartupName}
                  onChange={(e) => setPitchStartupName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Current Stage
                  </label>
                  <select
                    value={pitchStage}
                    onChange={(e) => setPitchStage(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B+">Series B+</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Target Round Ask
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $1.5M or ₹5 Cr"
                    value={pitchAskAmount}
                    onChange={(e) => setPitchAskAmount(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Pitch Deck Link (PDF or DocSend) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://docsend.com/view/..."
                  value={pitchDeckUrl}
                  onChange={(e) => setPitchDeckUrl(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Elevator Pitch & Traction Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize your key metric milestones (ARR, users, growth rate) and product moat..."
                  value={pitchSummary}
                  onChange={(e) => setPitchSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPitchModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm cursor-pointer"
                >
                  Submit Pitch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MESSAGE MODAL                                    */}
      {/* ========================================================= */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Message {investor.name}
                </h3>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMessageSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce yourself, your venture, and why you are reaching out..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REQUEST INTRODUCTION MODAL                       */}
      {/* ========================================================= */}
      {isIntroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Request Introduction
                </h3>
              </div>
              <button
                onClick={() => setIsIntroModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIntroSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Introduction Context / Mutual Connection
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why you are requesting an intro, any mutual verified mentors, or your program affiliation..."
                  value={introMutualContext}
                  onChange={(e) => setIntroMutualContext(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsIntroModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-sm cursor-pointer"
                >
                  Request Intro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
