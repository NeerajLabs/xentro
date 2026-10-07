'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Bookmark,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Send,
  MessageSquare,
  Calendar,
  FileText,
  DollarSign,
  ArrowLeft,
  Check,
  Target,
  Zap,
} from 'lucide-react';
import {
  InvestorOrganization,
  InvestorOrgMembership,
} from '@/types/investorOrganization';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import { useToast } from '@/components/ui/Toast';

export type OrgPublicTabType =
  | 'about'
  | 'investment_profile'
  | 'portfolio_experience'
  | 'connect'
  | 'content_activities';

interface InvestorOrgProfileViewProps {
  organizationId?: string;
  onBackToDashboard?: () => void;
  onBackToFeed?: () => void;
  onEditProfile?: () => void;
  isOwnProfile?: boolean;
}

export const InvestorOrgProfileView: React.FC<InvestorOrgProfileViewProps> = ({
  organizationId,
  onBackToDashboard,
  onBackToFeed,
  onEditProfile,
  isOwnProfile = true,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<OrgPublicTabType>('about');
  const [isSaved, setIsSaved] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load organization data
  const [organization, setOrganization] = useState<InvestorOrganization>(() => {
    const orgs = investorOrganizationService.getOrganizations();
    if (organizationId) {
      const match = orgs.find((o) => o.id === organizationId);
      if (match) return match;
    }
    const active = investorOrganizationService.getActiveOrganization();
    if (active) return active;
    return orgs.find((o) => o.id === 'org_apex_vc') || orgs[0];
  });

  // Load public team members
  const [teamMembers, setTeamMembers] = useState<InvestorOrgMembership[]>(() =>
    investorOrganizationService.getPublicTeamMembers(organization.id)
  );

  useEffect(() => {
    const refreshOrg = () => {
      const orgs = investorOrganizationService.getOrganizations();
      const active = investorOrganizationService.getActiveOrganization();
      const current =
        (organizationId ? orgs.find((o) => o.id === organizationId) : null) ||
        active ||
        orgs.find((o) => o.id === 'org_apex_vc') ||
        orgs[0];
      if (current) {
        setOrganization(current);
        setTeamMembers(investorOrganizationService.getPublicTeamMembers(current.id));
      }
    };

    window.addEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, refreshOrg);
    window.addEventListener(INVESTOR_ORG_EVENTS.MEMBERS_CHANGED, refreshOrg);
    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshOrg);

    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, refreshOrg);
      window.removeEventListener(INVESTOR_ORG_EVENTS.MEMBERS_CHANGED, refreshOrg);
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshOrg);
    };
  }, [organizationId]);

  const navItems: Array<{ id: OrgPublicTabType; label: string }> = [
    { id: 'about', label: 'About' },
    { id: 'investment_profile', label: 'Investment Profile' },
    { id: 'portfolio_experience', label: 'Portfolio & Experience' },
    { id: 'connect', label: 'Connect' },
    { id: 'content_activities', label: 'Content / Activities' },
  ];

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-fade-slide">
      {/* 0. Top Navigation & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
        <div className="flex items-center gap-2">
          {onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
              <span>Back to Dashboard</span>
            </button>
          ) : onBackToFeed ? (
            <button
              onClick={onBackToFeed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
              <span>Back to Feed</span>
            </button>
          ) : null}

          <div className="flex items-center gap-2 px-2 border-l border-gray-200 dark:border-[#262A29]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
              Investor Organization Public Profile
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnProfile && onEditProfile && (
            <button
              onClick={onEditProfile}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#c7ee2f] text-xs font-bold text-[#101212] transition-all cursor-pointer shadow-2xs"
            >
              Edit Organization Profile
            </button>
          )}

          <button
            onClick={() => {
              setIsSaved(!isSaved);
              showToast(isSaved ? 'Removed from saved organizations' : 'Saved to your bookmarks', 'info');
            }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-all cursor-pointer"
            title="Bookmark Organization"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-blue-500' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                showToast('Organization public link copied to clipboard!', 'success');
              }
            }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-all cursor-pointer"
            title="Share Organization Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Institutional Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
        {/* Banner Cover Image */}
        <div className="h-44 sm:h-56 w-full relative bg-gray-800">
          <img
            src={organization.banner}
            alt={organization.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Quick Badges in Header */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#101212]/80 backdrop-blur-md text-[#D9FF3F] border border-white/10 shadow-lg">
              {organization.organizationType}
            </span>
            {organization.verified && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Entity</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Card Overlay */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Logo & Identity */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#101212] p-1.5 border-4 border-white dark:border-[#181B1A] shadow-xl overflow-hidden flex-shrink-0">
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
                    {organization.name}
                  </h1>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7] flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-[#101212] dark:text-white">
                    <Building2 className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
                    {organization.organizationType}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {organization.headquarters.city}, {organization.headquarters.country}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Est. {organization.foundedYear}
                  </span>
                  {organization.fundSize && (
                    <>
                      <span>&bull;</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#D9FF3F]/20 text-[#71870A] dark:text-[#D9FF3F] font-bold">
                        {organization.fundSize}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2.5 self-start md:self-end">
              <button
                onClick={() => {
                  setIsConnected(!isConnected);
                  showToast(
                    isConnected
                      ? 'Disconnected from organization'
                      : 'Pitch connection request dispatched to team',
                    'success'
                  );
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  isConnected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] hover:opacity-90 active:scale-98'
                }`}
              >
                {isConnected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Pitch</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab('connect')}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer"
              >
                Book Call
              </button>
            </div>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] mt-4 leading-relaxed max-w-4xl">
            {organization.shortDescription}
          </p>

          {/* Links Row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[#565B59] dark:text-[#B6B8B7]">
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#101212] dark:hover:text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>{organization.website.replace('https://', '')}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {organization.officialEmail && (
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Contact:</span>
                <span>{organization.officialEmail}</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Top-Level 5-Tab Navigation Bar */}
        <div className="border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#121414] px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {navItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                      : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-[#202422]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Tab Contents */}
      <div className="animate-fade-slide">
        {/* ================= TAB 1: ABOUT ================= */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Overview & Thesis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: About & Mission */}
              <div className="md:col-span-2 space-y-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                    <span>About the Organization</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {organization.about.overview}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                    <span>Investment Thesis Summary</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {organization.about.thesis}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                    <span>Mission & Values</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {organization.about.mission}
                  </p>
                </div>
              </div>

              {/* Right Col: Institutional Stats & Capital Details */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
                    Institutional Profile
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Legal Entity Name
                      </span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {organization.legalName || organization.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Fund Size
                      </span>
                      <span className="font-bold text-[#71870A] dark:text-[#D9FF3F]">
                        {organization.fundSize || 'Private / Proprietary'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Assets Under Management (AUM)
                      </span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {organization.aum || 'Undisclosed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Active Deployment
                      </span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {organization.about.fundGeneration || 'Current Fund'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                        Geographic Presence
                      </span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {organization.about.geographicPresence ||
                          `${organization.headquarters.city}, ${organization.headquarters.country}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PUBLIC TEAM DISPLAY (Rule #20: Only isPublicTeam: true members appear here!) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                    <span>Investment Team & Partners</span>
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Publicly listed partners and key investment professionals
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white">
                  {teamMembers.length} Public Members
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#141615] flex items-center gap-3.5"
                  >
                    <img
                      src={
                        member.userAvatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={member.userName}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#101212] dark:text-white truncate">
                          {member.userName}
                        </span>
                        {member.isOwner && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D9FF3F] text-[#101212]">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#71870A] dark:text-[#D9FF3F] font-semibold truncate">
                        {member.title || member.role}
                      </p>
                      <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                        Joined {member.joinedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: INVESTMENT PROFILE ================= */}
        {activeTab === 'investment_profile' && (
          <div className="space-y-6">
            {/* 1. Investment Focus */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Investment Focus</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Cheque Size Range
                  </span>
                  <div className="text-base font-bold text-[#71870A] dark:text-[#D9FF3F]">
                    {organization.investmentFocus.ticketSize.formatted}
                  </div>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">
                    {organization.investmentFocus.leadInvestorPreference || 'Lead Check'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Target Stages
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {organization.investmentFocus.stages.map((stg) => (
                      <span
                        key={stg}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]"
                      >
                        {stg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Geographies
                  </span>
                  <p className="text-xs font-semibold text-[#101212] dark:text-white">
                    {organization.investmentFocus.geography.countries.join(', ')}
                  </p>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                    Hubs: {organization.investmentFocus.geography.regions.join(', ')}
                  </span>
                </div>
              </div>

              {/* Sectors Focus */}
              <div className="pt-2">
                <span className="text-xs font-bold text-[#101212] dark:text-white block mb-2">
                  Focus Sectors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {organization.investmentFocus.sectors.map((sec) => (
                    <span
                      key={sec}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Value Beyond Capital */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Value Beyond Capital</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                {organization.valueBeyondCapital.whatIBringToFounders}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {organization.valueBeyondCapital.supportAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#101212] dark:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Investment Criteria */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Investment Criteria & Diligence Highlights</span>
              </h3>
              <div className="space-y-2 pt-1">
                {organization.investmentCriteria.evaluationCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#71870A] dark:text-[#D9FF3F] mt-1.5 flex-shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Investment Process */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Investment Process & Timeline</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {organization.investmentProcess.stages.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]">
                        Step {step.stepNumber}
                      </span>
                      {step.estimatedTime && (
                        <span className="text-[10px] text-gray-400">{step.estimatedTime}</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PORTFOLIO & EXPERIENCE ================= */}
        {activeTab === 'portfolio_experience' && (
          <div className="space-y-6">
            {/* Experience Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center">
                <span className="text-2xl font-black font-sora text-[#101212] dark:text-white">
                  {organization.experienceStats.totalInvestments || 28}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase mt-0.5">
                  Total Deals
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center">
                <span className="text-2xl font-black font-sora text-[#71870A] dark:text-[#D9FF3F]">
                  {organization.experienceStats.activePortfolio || 22}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase mt-0.5">
                  Active Portcos
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center">
                <span className="text-2xl font-black font-sora text-emerald-500">
                  {organization.experienceStats.exits || 6}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase mt-0.5">
                  Exits
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center">
                <span className="text-2xl font-black font-sora text-blue-500">
                  {organization.experienceStats.followOnInvestments || 14}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase mt-0.5">
                  Follow-ons
                </span>
              </div>
            </div>

            {/* Portfolio Companies */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Institutional Portfolio Companies</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {organization.portfolio.map((portco) => (
                  <div
                    key={portco.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#141615] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={portco.logo}
                          alt={portco.name}
                          className="w-9 h-9 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                            {portco.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 block">{portco.sector}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#71870A] dark:text-[#D9FF3F]">
                        {portco.stageInvested}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      {portco.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-200/50 dark:border-gray-800 pt-2">
                      <span>Invested: {portco.investmentYear}</span>
                      <span className="font-semibold text-emerald-500">{portco.currentStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            {organization.testimonials.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                  <span>Founder Testimonials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organization.testimonials.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3"
                    >
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] italic leading-relaxed">
                        &ldquo;{test.testimonial}&rdquo;
                      </p>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={test.founderAvatar}
                          alt={test.founderName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#101212] dark:text-white block">
                            {test.founderName}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {test.founderRole} &bull; {test.startupName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: CONNECT ================= */}
        {activeTab === 'connect' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Send Pitch Form */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div>
                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                  <span>Submit Pitch to {organization.name}</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                  Submissions enter our centralized investment team review queue.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast('Your startup pitch was submitted to the investment team!', 'success');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Technologies"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                      Current Stage
                    </label>
                    <select className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]">
                      <option>Pre-Seed</option>
                      <option>Seed</option>
                      <option>Series A</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                      Funding Ask
                    </label>
                    <input
                      type="text"
                      placeholder="$1M or ₹5 Cr"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Executive Summary / Traction
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Briefly state your core problem, solution, ARR/revenue, and why your team has unfair distribution."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all cursor-pointer shadow-sm hover:opacity-90"
                >
                  Submit Pitch to Investment Committee
                </button>
              </form>
            </div>

            {/* Right Col: Connection Options */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Engagement Options
                </h4>

                <div className="space-y-2">
                  <button
                    onClick={() => showToast('Intro request sent to team!', 'info')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Request Partner Introduction</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
                  </button>

                  <button
                    onClick={() => showToast('Opening team calendar...', 'info')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] hover:bg-gray-100 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Schedule 1:1 Intro Call</span>
                    <Calendar className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <span className="font-bold text-gray-700 dark:text-gray-200 block">
                  Pitch Guidelines:
                </span>
                <p className="text-[11px] leading-relaxed">
                  {organization.connectionPreferences.guidelines ||
                    'Warm introductions via existing portfolio founders receive priority screening. Unsolicited pitches are evaluated weekly.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: CONTENT / ACTIVITIES ================= */}
        {activeTab === 'content_activities' && (
          <div className="space-y-6">
            {/* Content / Market Memos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Institutional Insights & Market Memos</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {organization.content.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold uppercase">
                        {item.type}
                      </span>
                      <span>&bull;</span>
                      <span>{item.readTime}</span>
                      <span>&bull;</span>
                      <span>{item.publishedAt}</span>
                    </div>

                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      {item.excerpt}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-1">
                      <span>❤️ {item.metrics.likes}</span>
                      <span>💬 {item.metrics.comments}</span>
                      <span>🔄 {item.metrics.shares}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Activities */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <span>Public Activities & Announcements</span>
              </h3>

              <div className="space-y-2.5">
                {organization.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#141615] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#101212] dark:text-white">
                          {act.title}
                        </span>
                        {act.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D9FF3F]/20 text-[#71870A] dark:text-[#D9FF3F]">
                            {act.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                        {act.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
