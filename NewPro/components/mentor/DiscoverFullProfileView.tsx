'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Building2,
  MapPin,
  Sparkles,
  Check,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Calendar,
  MessageSquare,
  ExternalLink,
  Users,
  Award,
  BookOpen,
  Briefcase,
  School,
  Layers,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { messagingService } from '@/lib/messagingService';
import {
  StartupRecommendation,
  MentorRecommendation,
  InvestorRecommendation,
  UniversityRecommendation,
} from '@/types/discover';

export type DiscoverProfileItem =
  | { type: 'startup'; data: StartupRecommendation }
  | { type: 'mentor'; data: MentorRecommendation }
  | { type: 'investor'; data: InvestorRecommendation }
  | { type: 'university'; data: UniversityRecommendation };

interface DiscoverFullProfileViewProps {
  item: DiscoverProfileItem;
  onBack: () => void;
  onConnectToggle?: (id: string, name: string) => void;
  isConnected?: boolean;
}

export const DiscoverFullProfileView: React.FC<DiscoverFullProfileViewProps> = ({
  item,
  onBack,
  onConnectToggle,
  isConnected = false,
}) => {
  const { showToast } = useToast();
  const [localConnected, setLocalConnected] = useState(isConnected);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'ecosystem'>('overview');

  const handleConnect = () => {
    const nextState = !localConnected;
    setLocalConnected(nextState);
    const itemName = item.data.name;
    if (onConnectToggle) {
      onConnectToggle(item.data.id, itemName);
    } else {
      if (nextState) {
        showToast(`Connected with ${itemName}!`, 'success');
      } else {
        showToast(`Disconnected from ${itemName}.`, 'info');
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Profile link copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-fade-slide">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] hover:text-[#9EBE12] dark:hover:text-[#D9FF3F] transition-all shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Discover</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all shadow-2xs cursor-pointer"
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleConnect}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
              localConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
            }`}
          >
            {localConnected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Connect</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Profile Header Card (Banner + Avatar + Title info) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden shadow-subtle">
        {/* Banner with organic gradient */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-[#181B1A] via-[#202422] to-[#181B1A] relative overflow-hidden border-b border-[#E5E7EB] dark:border-[#262A29]">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D9FF3F_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#D9FF3F]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#D9FF3F]/10 blur-3xl pointer-events-none" />

          {/* Badge indicator on top banner */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
              {item.type === 'university'
                ? 'Academic Institution'
                : item.type}
            </span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Logo / Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-[#181B1A] bg-white dark:bg-[#202422] shadow-md flex-shrink-0 relative">
              <img
                src={
                  (item.data as any).avatar ||
                  (item.data as any).logo ||
                  '/images/profile_avatar.webp'
                }
                alt={item.data.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 sm:self-end">
              <button
                onClick={() => {
                  messagingService.startOrOpenConversation({
                    id: item.data.id,
                    name: item.data.name,
                    role: (item.data as any).industry || (item.data as any).title || (item.data as any).fundType || 'Partner',
                    avatar: (item.data as any).logo || (item.data as any).avatar || '/xentro-logo.png'
                  });
                  showToast(`Opening chat conversation with ${item.data.name}...`, 'success');
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
              <button
                onClick={handleConnect}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                  localConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                }`}
              >
                {localConnected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#101212] dark:text-white font-heading">
                {item.data.name}
              </h1>
              {((item.data as any).verified !== false) && (
                <CheckCircle2 className="w-5 h-5 text-[#101212] dark:text-[#D9FF3F] fill-[#D9FF3F] flex-shrink-0" />
              )}
            </div>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-[#101212] dark:text-[#D9FF3F] font-semibold">
              {(item.data as any).industry ||
                (item.data as any).title ||
                (item.data as any).investorType ||
                (item.data as any).institutionType}
            </p>

            {/* Quick Metadata tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.data.location}</span>
              </div>

              {item.type === 'startup' && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.data.fundingRaised}
                  </span>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] font-medium text-[#101212] dark:text-white">
                    {item.data.stage}
                  </span>
                </>
              )}

              {item.type === 'mentor' && (
                <>
                  <span>·</span>
                  <span className="font-medium text-[#101212] dark:text-white">
                    {item.data.experienceYears}
                  </span>
                  {item.data.availabilityStatus && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {item.data.availabilityStatus}
                      </span>
                    </>
                  )}
                </>
              )}

              {item.type === 'investor' && item.data.ticketSize && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Ticket: {item.data.ticketSize}
                  </span>
                </>
              )}

              {item.type === 'university' && item.data.incubationStats && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.data.incubationStats.incubatedCount}+ Startups Incubated
                  </span>
                  <span>·</span>
                  <span>{item.data.incubationStats.fundingFacilitated} Facilitated</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: In-depth Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
            <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>About & Mission</span>
            </h3>
            <p className="text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              {(item.data as any).description || (item.data as any).bio}
            </p>
          </div>

          {/* Type-Specific Detailed Cards */}
          {item.type === 'startup' && (
            <>
              {/* Founder Dossier */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Founding Team</span>
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img
                      src={item.data.founder.avatar}
                      alt={item.data.founder.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                      {item.data.founder.name}
                    </h4>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                      {item.data.founder.role}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                      Leading product architecture, fundraising strategy, and enterprise pilots.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mentorship Needs */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Mentorship & Advisory Requirements</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  This venture is currently looking for active guidance in the following strategic areas:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.data.needsHelpWith.map((need, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {item.type === 'mentor' && (
            <>
              {/* Mentorship Focus Areas */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Core Expertise & Focus Domains</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.data.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      {exp}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider mb-2">
                    Mentorship Advisory Capabilities:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {item.data.mentorshipAreas.map((area, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2 text-xs font-semibold text-[#101212] dark:text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {item.type === 'investor' && (
            <>
              {/* Investment Thesis & Portfolio */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Investment Focus & Thesis</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider mb-2">
                      Target Sectors:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.data.focusIndustries.map((foc, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                        >
                          {foc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.data.portfolioHighlights && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider mb-2">
                        Key Portfolio Companies:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.data.portfolioHighlights.map((port, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                          >
                            {port}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {item.type === 'university' && (
            <>
              {/* University Ecosystem Programs */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <School className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Incubation Programs & Ecosystem Initiatives</span>
                </h3>

                <div className="space-y-2.5">
                  {item.data.ecosystemPrograms.map((prog, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#D9FF3F]" />
                        <span className="text-xs font-bold text-[#101212] dark:text-white">
                          {prog}
                        </span>
                      </div>
                      <button
                        onClick={() => showToast(`Inquiring into ${prog}`, 'info')}
                        className="text-xs font-bold text-[#9EBE12] dark:text-[#D9FF3F] hover:underline"
                      >
                        Explore Program →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right 1 Column: Quick Action & Highlights Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              Ecosystem Snapshot
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-[#262A29] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Location</span>
                <span className="font-semibold text-[#101212] dark:text-white">
                  {item.data.location}
                </span>
              </div>

              {item.type === 'startup' && (
                <>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Stage</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {item.data.stage}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Total Funding</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.data.fundingRaised}
                    </span>
                  </div>
                  {item.data.metrics && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">Traction</span>
                      <span className="font-semibold text-[#101212] dark:text-white">
                        {item.data.metrics}
                      </span>
                    </div>
                  )}
                </>
              )}

              {item.type === 'mentor' && (
                <>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Experience</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {item.data.experienceYears}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.data.availabilityStatus || 'Active'}
                    </span>
                  </div>
                </>
              )}

              {item.type === 'investor' && (
                <>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Firm Type</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {item.data.investorType}
                    </span>
                  </div>
                  {item.data.ticketSize && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">Check Size</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.data.ticketSize}
                      </span>
                    </div>
                  )}
                </>
              )}

              {item.type === 'university' && item.data.incubationStats && (
                <>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Incubated Startups</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {item.data.incubationStats.incubatedCount}+
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Funding Raised</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.data.incubationStats.fundingFacilitated}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Active Labs</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {item.data.incubationStats.activeLabs} Labs
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleConnect}
                className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
                  localConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]'
                }`}
              >
                {localConnected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Connected on XENTRO</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Connect with {item.data.name}</span>
                  </>
                )}
              </button>

              {localConnected && (
                <button
                  onClick={() => {
                    messagingService.startOrOpenConversation({
                      id: item.data.id,
                      name: item.data.name,
                      role: (item.data as any).industry || (item.data as any).title || (item.data as any).fundType || 'Partner',
                      avatar: (item.data as any).logo || (item.data as any).avatar || '/xentro-logo.png'
                    });
                    showToast(`Opening chat conversation with ${item.data.name}...`, 'success');
                  }}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Direct Message</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
