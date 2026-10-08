'use client';

import React, { useState, useEffect } from "react";
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
  FolderLock,
  Play,
  Heart,
  Search,
  Filter,
  Lightbulb,
  Cpu,
  GraduationCap,
  Building,
  LayoutDashboard,
  Mail,
  Network,
  BadgeCheck,
  Phone,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  FullESPProfile,
  ESPProgram,
  ESPService,
  ESPPortfolioStartup,
  ESPContentItem,
} from "@/types/esp";
import { getESPProfileById } from "@/data/espProfilesData";
import { getUserProfile } from "@/lib/userProfile";
import { connectionService, CONNECTIONS_UPDATED_EVENT } from "@/lib/connectionService";
import {
  espPublicTeamService,
  ESP_PUBLIC_TEAM_EVENT,
} from "@/lib/espPublicTeamService";

/**
 * Own-profile shell for the signed-in ESP applicant: identity from what they
 * actually entered during onboarding, everything else empty (no T-Hub demo data).
 * Demo institutions remain available when browsing OTHER profiles.
 */
function buildOwnEspProfile(): FullESPProfile {
  const viewer = getUserProfile();
  return {
    id: "esp_own",
    identity: {
      name: viewer.organization || "",
      logo: viewer.avatar || "/xentro-logo.png",
      type: "Ecosystem Organization",
      foundedYear: 0,
      headquarters: viewer.location || "",
      website: "",
      linkedin: "",
      contactEmail: viewer.email || "",
      isVerified: false,
      primarySectors: viewer.sector ? [viewer.sector] : [],
      stagesSupported: [],
      tagline: viewer.bio || "",
      shortDescription: viewer.bio || "",
      coreMission: "",
      geographicFocus: [],
      supportAreas: [],
    },
    programs: [],
    services: [],
    portfolio: [],
    impact: {
      stats: {
        startupsSupported: 0,
        activeStartups: 0,
        alumniStartups: 0,
        fundingRaised: "$0",
        grantsSecured: "$0",
        patentsFiled: 0,
        jobsCreated: "0",
        womenLedCount: 0,
        corporatePilots: 0,
        governmentPartnerships: 0,
        cohortsCompleted: 0,
        mentorshipHours: "0",
      },
      programOutcomes: [],
      sdgs: [],
    },
    teamAndEcosystem: {
      team: [],
      associatedMentors: [],
      associatedInvestors: [],
      partners: [],
    },
    content: [],
  };
}

export type ESPTabType =
  | "about"
  | "programs"
  | "services"
  | "portfolio"
  | "impact"
  | "team"
  | "content";

interface ESPProfileViewProps {
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
  espData?: FullESPProfile;
  espId?: string;
  isOwnProfile?: boolean;
  onOpenStartupProfile?: (startupId: string) => void;
  onOpenMentorProfile?: (mentorId: string) => void;
  onOpenInvestorProfile?: (investorId: string) => void;
  onOpenDashboard?: () => void;
}

export const ESPProfileView: React.FC<ESPProfileViewProps> = ({
  onBackToFeed,
  onBackToDiscover,
  espData,
  espId,
  isOwnProfile = false,
  onOpenStartupProfile,
  onOpenMentorProfile,
  onOpenInvestorProfile,
  onOpenDashboard,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ESPTabType>("about");

  // Load ESP data dynamically: own profile = empty shell with YOUR institution identity;
  // other profiles = demo institution records (kept for browsing/discovery)
  const esp: FullESPProfile =
    espData || (isOwnProfile && !espId ? buildOwnEspProfile() : getESPProfileById(espId || "uni_9"));

  // Dynamic Public Team & Ecosystem view data
  const [publicTeamView, setPublicTeamView] = useState(() =>
    espPublicTeamService.getPublicViewData(esp.id || "uni_9")
  );

  useEffect(() => {
    const handleUpdate = () => {
      setPublicTeamView(espPublicTeamService.getPublicViewData(esp.id || "uni_9"));
    };
    window.addEventListener(ESP_PUBLIC_TEAM_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ESP_PUBLIC_TEAM_EVENT, handleUpdate);
    };
  }, [esp.id]);

  // Interactive connection state
  const [connStatus, setConnStatus] = useState<'none' | 'pending' | 'received' | 'connected'>(() =>
    connectionService.getConnectionStatus(esp.id)
  );
  const isConnected = connStatus === 'connected';
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const handleConnectionsChange = () => {
      setConnStatus(connectionService.getConnectionStatus(esp.id));
    };
    handleConnectionsChange();
    connectionService.syncFromServer().then(() => handleConnectionsChange()).catch(() => {});
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
    window.addEventListener('xentro-connection-event', handleConnectionsChange);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsChange);
      window.removeEventListener('xentro-connection-event', handleConnectionsChange);
    };
  }, [esp.id]);

  // Sub-filters
  const [programCategory, setProgramCategory] = useState<"all" | "active" | "upcoming" | "past">("all");
  const [serviceCategory, setServiceCategory] = useState<string>("all");
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [contentFilter, setContentFilter] = useState<string>("all");

  // Modals
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<ESPProgram | null>(null);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ESPService | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<ESPContentItem | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Handlers
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast("Institution profile link copied to clipboard!", "success");
  };

  const handleToggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    showToast(
      next
        ? `${esp.identity.name} saved to your bookmarks`
        : `Removed ${esp.identity.name} from bookmarks`,
      "info"
    );
  };

  const handleProgramApply = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Application submitted for "${selectedProgramForModal?.name}"!`, "success");
    setSelectedProgramForModal(null);
  };

  const handleServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Support request dispatched to ${esp.identity.name} innovation desk.`, "success");
    setSelectedServiceForModal(null);
  };

  const handleEventRegister = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Registration confirmed for "${selectedEventForModal?.title}"!`, "success");
    setSelectedEventForModal(null);
  };

  const handleSendConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    await connectionService.requestConnection({
      id: esp.id,
      name: esp.identity.name,
      role: 'ESP',
      avatar: esp.identity.logo,
    });
    setConnStatus('pending');
    showToast(`Partnership connection request sent to ${esp.identity.name}!`, "success");
    setIsConnectModalOpen(false);
  };

  // Canonical 7 tabs
  const tabs = [
    { id: "about" as const, label: "About", icon: Building2 },
    { id: "programs" as const, label: "Programs", icon: Target },
    { id: "services" as const, label: "Services", icon: Layers },
    { id: "portfolio" as const, label: "Portfolio", icon: Award },
    { id: "impact" as const, label: "Impact", icon: TrendingUp },
    { id: "team" as const, label: "Team & Ecosystem", icon: Users },
    { id: "content" as const, label: "Content & Activities", icon: FileText },
  ];

  // Filtered Programs
  const filteredPrograms = esp.programs.filter((prog) => {
    if (programCategory === "all") return true;
    return prog.category === programCategory;
  });

  // Filtered Services
  const filteredServices = esp.services.filter((serv) => {
    if (serviceCategory === "all") return true;
    return serv.category === serviceCategory;
  });

  // Filtered Portfolio
  const filteredPortfolio = esp.portfolio.filter((port) => {
    if (portfolioFilter === "all") return true;
    if (portfolioFilter === "Endorsed") return Boolean(port.isEndorsed);
    if (port.relationshipType && port.relationshipType.toLowerCase() === portfolioFilter.toLowerCase()) return true;
    return port.currentStatus.toLowerCase() === portfolioFilter.toLowerCase();
  });

  // Filtered Content
  const filteredContent = esp.content.filter((item) => {
    if (contentFilter === "all") return true;
    return item.type.toLowerCase().includes(contentFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-slide">
      {/* 0. Top Bar / Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToDiscover && (
            <button
              onClick={onBackToDiscover}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] hover:text-[#D9FF3F] dark:hover:text-[#D9FF3F] transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Discover</span>
            </button>
          )}
          {onBackToFeed && !onBackToDiscover && (
            <button
              onClick={onBackToFeed}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] hover:text-[#D9FF3F] dark:hover:text-[#D9FF3F] transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feed</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSave}
            className={`p-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs transition-all cursor-pointer ${
              isSaved
                ? "text-[#D9FF3F] border-[#D9FF3F]/60"
                : "text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
            }`}
            title={isSaved ? "Saved" : "Save Institution"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white text-xs transition-all cursor-pointer"
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Global ESP Profile Header */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden shadow-subtle">
        {/* Ambient Banner */}
        <div className="min-h-36 sm:min-h-44 bg-gradient-to-r from-emerald-950/40 via-[#181B1A] to-lime-950/30 relative p-4 sm:p-5 flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#D9FF3F_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified ESP</span>
              </span>
              {esp.identity.parentInstitution && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Institution Verified</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5 backdrop-blur-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Domain Verified</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 dark:bg-black/30 border border-white/20 text-[#101212] dark:text-gray-200 backdrop-blur-xs">
                Authorized Rep. Verified
              </span>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D9FF3F]/25 text-[#101212] dark:text-[#D9FF3F] backdrop-blur-xs border border-[#D9FF3F]/40">
              {esp.identity.organizationTypeDetails || esp.identity.type}
            </span>
          </div>
        </div>

        {/* Header Main Content */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-12 sm:-mt-14 mb-4">
            {/* Logo and Identity */}
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#202422] border-4 border-white dark:border-[#181B1A] shadow-md overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={esp.identity.logo}
                  alt={esp.identity.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=150";
                  }}
                />
              </div>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#101212] dark:text-white font-heading tracking-tight">
                    {esp.identity.name}
                  </h1>
                  {esp.identity.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">
                    Est. {esp.identity.foundedYear}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] font-medium max-w-2xl leading-snug">
                  {esp.identity.tagline}
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap pt-2 md:pt-0">
              {/* Manage in Dashboard (if viewing own profile) */}
              {isOwnProfile && onOpenDashboard && (
                <button
                  onClick={onOpenDashboard}
                  className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold hover:bg-[#D9FF3F] hover:text-[#101212] dark:hover:bg-[#D9FF3F] dark:hover:text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle active:scale-95"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Manage in Dashboard</span>
                </button>
              )}

              {/* Connect Action */}
              <button
                onClick={() => {
                  if (connStatus === 'received') {
                    connectionService.acceptConnection(esp.id);
                    setConnStatus('connected');
                    showToast(`Accepted connection with ${esp.identity.name}!`, 'success');
                  } else if (connStatus === 'none') {
                    setIsConnectModalOpen(true);
                  }
                }}
                disabled={connStatus === 'pending'}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  connStatus === 'connected'
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : connStatus === 'pending'
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 cursor-not-allowed opacity-90"
                    : connStatus === 'received'
                    ? "bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]"
                    : "bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95"
                }`}
              >
                {connStatus === 'connected' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </>
                ) : connStatus === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Pending</span>
                  </>
                ) : connStatus === 'received' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Request</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>

              {/* View Programs Action */}
              <button
                onClick={() => {
                  setActiveTab("programs");
                  showToast("Navigated to active incubation & acceleration programs.", "info");
                }}
                className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
              >
                <Target className="w-3.5 h-3.5" />
                <span>View Programs</span>
              </button>
            </div>
          </div>

          {/* Quick Meta Row */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-semibold text-[#101212] dark:text-white">
                {esp.identity.headquarters}
              </span>
            </div>

            {esp.identity.website && (
              <a
                href={esp.identity.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            {esp.identity.linkedin && (
              <a
                href={esp.identity.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>{esp.identity.stagesSupported.length} Stages Supported</span>
            </div>
          </div>

          {/* Sectors and Stages Chips */}
          <div className="pt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] mr-1">
              Focus Sectors:
            </span>
            {esp.identity.primarySectors.map((sec, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
              >
                {sec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Profile Navigation (7 Canonical Tabs) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-1.5 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs"
                    : "text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ABOUT                                              */}
      {/* ========================================================= */}
      {activeTab === "about" && (
        <div className="space-y-6">
          {/* Basic Information Grid */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D9FF3F]" />
              <span>Institutional Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Organization Classification
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {esp.identity.organizationTypeDetails || esp.identity.type}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Official Inbound Email
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span>{esp.identity.officialEmail || esp.identity.contactEmail}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Year Established
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {esp.identity.foundedYear}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Headquarters Campus
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {esp.identity.headquarters}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Geographic Coverage
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {esp.identity.geographicFocus.map((geo, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                    >
                      {geo}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Verification & Compliance
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Government & Ecosystem Accredited</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Institution & Institutional Hierarchy Card */}
          {esp.identity.parentInstitution && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-500" />
                <span>Parent Hierarchy & Governance Structure</span>
              </h3>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Parent Institution / Sponsor Entity
                  </span>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    {esp.identity.parentInstitution}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Operating Relationship: <span className="font-semibold text-[#101212] dark:text-[#D9FF3F]">{esp.identity.entityRelationshipType || 'Autonomous Entity'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Institution Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* Institutional Campuses & Center Locations */}
          {esp.identity.locations && esp.identity.locations.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Campuses & Innovation Centers</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {esp.identity.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {loc.name}
                      </h4>
                      {loc.isPrimaryCampus && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-[#D9FF3F] text-[#101212]">
                          Primary Campus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      {loc.address}, {loc.city}, {loc.state} {loc.postalCode}
                    </p>
                    <div className="text-[11px] font-semibold text-[#101212] dark:text-gray-300">
                      Type: <span className="text-[#565B59] dark:text-[#B6B8B7]">{loc.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About the Organization (Mission & Overview) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
              <span>About the Organization</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  What the Organization Does
                </span>
                <p className="text-xs text-[#101212] dark:text-[#B6B8B7] leading-relaxed">
                  {esp.identity.shortDescription}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Core Institutional Mission
                </span>
                <p className="text-xs font-semibold text-emerald-600 dark:text-[#D9FF3F] leading-relaxed">
                  {esp.identity.coreMission}
                </p>
              </div>
            </div>
          </div>

          {/* Focus Areas & Startup Stages Supported */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Primary Sector Focus</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {esp.identity.primarySectors.map((sec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#D9FF3F]" />
                <span>Startup Stages Supported</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {esp.identity.stagesSupported.map((stage, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F]"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Support Capabilities Grid */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Ecosystem Support Capabilities</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {esp.identity.supportAreas.map((area, aIdx) => (
                <div
                  key={aIdx}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2 text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <Check className="w-3.5 h-3.5 text-[#D9FF3F] shrink-0" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PROGRAMS (HIGH VISUAL PROMINENCE)                   */}
      {/* ========================================================= */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          {/* Subcategory Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
              {(["all", "active", "upcoming", "past"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProgramCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    programCategory === cat
                      ? "bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs"
                      : "text-[#565B59] dark:text-[#B6B8B7]"
                  }`}
                >
                  {cat === "all" ? "All Programs" : `${cat} Programs`}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Showing {filteredPrograms.length} Cohort{filteredPrograms.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all space-y-4 shadow-subtle flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      prog.status === "Open"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : prog.status === "Upcoming"
                        ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                        : prog.status === "Rolling"
                        ? "bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                        : "bg-gray-200 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]"
                    }`}>
                      {prog.status}
                    </span>
                    <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                      {prog.type} · {prog.locationMode}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-[#101212] dark:text-white">
                      {prog.name}
                    </h4>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 leading-relaxed">
                      {prog.shortDescription}
                    </p>
                  </div>

                  {/* Program Meta Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                      <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                        Funding / Grant
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {prog.fundingGrantAvailable}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                      <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                        Equity Requirement
                      </span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {prog.equityRequirement}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                      <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                        Duration & Cohort
                      </span>
                      <span className="font-medium text-[#101212] dark:text-white">
                        {prog.duration} ({prog.cohortSize})
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                      <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                        Deadline
                      </span>
                      <span className="font-bold text-[#D9FF3F]">
                        {prog.applicationDeadline}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prog.sectors.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29]">
                  <button
                    onClick={() => setSelectedProgramForModal(prog)}
                    className="w-full py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>View Program & Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SERVICES & SUPPORT                                 */}
      {/* ========================================================= */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["all", "Mentorship", "Funding Support", "Business Support", "Growth Support", "Infrastructure"].map((cat) => (
              <button
                key={cat}
                onClick={() => setServiceCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  serviceCategory === cat
                    ? "bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs"
                    : "bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]"
                }`}
              >
                {cat === "all" ? "All Services" : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((serv) => (
              <div
                key={serv.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] transition-all space-y-3 shadow-subtle flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                      {serv.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      serv.costModel === "Free"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : serv.costModel === "Subsidized"
                        ? "bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}>
                      {serv.costModel}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    {serv.name}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {serv.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Availability:</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{serv.availability}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Delivery:</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{serv.deliveryMode}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <button
                    onClick={() => setSelectedServiceForModal(serv)}
                    className="w-full py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white hover:text-[#D9FF3F] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Request Support</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PORTFOLIO                                          */}
      {/* ========================================================= */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {/* Summary Metrics Strip */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Total Startups
                </span>
                <p className="text-base font-black text-[#101212] dark:text-white">
                  {esp.impact.stats.startupsSupported}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Active Startups
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {esp.impact.stats.activeStartups}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Alumni Startups
                </span>
                <p className="text-base font-black text-[#101212] dark:text-white">
                  {esp.impact.stats.alumniStartups}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Capital Raised
                </span>
                <p className="text-base font-black text-[#D9FF3F]">
                  {esp.impact.stats.fundingRaised}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Patents Filed
                </span>
                <p className="text-base font-black text-cyan-500">
                  {esp.impact.stats.patentsFiled}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
                  Women-Led
                </span>
                <p className="text-base font-black text-purple-500">
                  {esp.impact.stats.womenLedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Category & Relationship Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] overflow-x-auto no-scrollbar">
              {["all", "Active", "Pre-Incubated", "Incubated", "Accelerated", "Portfolio Startup", "Alumni", "Endorsed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setPortfolioFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                    portfolioFilter === status
                      ? "bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs"
                      : "text-[#565B59] dark:text-[#B6B8B7]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Showing {filteredPortfolio.length} startups &bull; Click to open profile
            </span>
          </div>

          {/* Startup Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPortfolio.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  if (st.xentroStartupId && onOpenStartupProfile) {
                    onOpenStartupProfile(st.xentroStartupId);
                  } else {
                    showToast(`Opening ${st.name} profile...`, "info");
                  }
                }}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] transition-all space-y-3 shadow-subtle cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={st.logo}
                      alt={st.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = "/images/profile_avatar.webp";
                      }}
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#D9FF3F] transition-colors">
                          {st.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                          {st.currentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] truncate">
                        {st.industry}
                      </p>
                    </div>
                  </div>

                  {/* Relationship & Endorsement Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30">
                      {st.relationshipType || 'Incubated'}
                    </span>
                    {st.isEndorsed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified ESP Endorsement</span>
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Cohort:</span>
                      <span className="font-semibold text-[#101212] dark:text-white truncate max-w-[170px]">{st.cohortProgram} ({st.year})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Founders:</span>
                      <span className="font-semibold text-[#101212] dark:text-white truncate max-w-[160px]">{st.founders}</span>
                    </div>
                    {st.fundingRaised && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">Raised:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{st.fundingRaised}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <span>Stage: {st.stage}</span>
                  <span className="text-[#D9FF3F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Startup <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: IMPACT                                             */}
      {/* ========================================================= */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          {/* Visual Impact Dashboard */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D9FF3F]" />
              <span>Cumulative Ecosystem Impact</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Startups Incubated
                </span>
                <p className="text-xl font-black text-[#101212] dark:text-white">
                  {esp.impact.stats.startupsSupported}+
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Capital Facilitated
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {esp.impact.stats.fundingRaised}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  High-Skill Jobs Created
                </span>
                <p className="text-xl font-black text-cyan-500">
                  {esp.impact.stats.jobsCreated}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Patents & IP Commercialized
                </span>
                <p className="text-xl font-black text-[#D9FF3F]">
                  {esp.impact.stats.patentsFiled}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Corporate Pilots Executed
                </span>
                <p className="text-xl font-black text-purple-500">
                  {esp.impact.stats.corporatePilots}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Government Grants Disbursed
                </span>
                <p className="text-xl font-black text-amber-500">
                  {esp.impact.stats.grantsSecured}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Mentorship Hours Logged
                </span>
                <p className="text-xl font-black text-[#101212] dark:text-white">
                  {esp.impact.stats.mentorshipHours}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Active Cohorts Completed
                </span>
                <p className="text-xl font-black text-emerald-500">
                  {esp.impact.stats.cohortsCompleted}
                </p>
              </div>
            </div>
          </div>

          {/* Program Outcomes Breakdown */}
          {esp.impact.programOutcomes && esp.impact.programOutcomes.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-500" />
                <span>Cohort Performance Outcomes</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {esp.impact.programOutcomes.map((out) => (
                  <div
                    key={out.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {out.programName}
                      </h4>
                      <span className="text-[10px] font-bold bg-[#D9FF3F]/15 px-2 py-0.5 rounded text-[#101212] dark:text-[#D9FF3F]">
                        {out.cohortYear}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      <div className="flex justify-between">
                        <span>Selected / Graduated:</span>
                        <span className="font-bold text-[#101212] dark:text-white">{out.startupsSelected} / {out.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Funded Startups:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{out.fundedCount} Startups</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cumulative Capital:</span>
                        <span className="font-bold text-[#D9FF3F]">{out.cumulativeFunding}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enterprise Pilots:</span>
                        <span className="font-bold text-[#101212] dark:text-white">{out.corporatePilots}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SDG Impact */}
          {esp.impact.sdgs && esp.impact.sdgs.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>UN Sustainable Development Goals (SDG Alignment)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {esp.impact.sdgs.map((sdg, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                        {sdg.goalNumber}
                      </span>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {sdg.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {sdg.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: TEAM & ECOSYSTEM                                   */}
      {/* ========================================================= */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {publicTeamView.totalPublishedCount === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <Users className="w-10 h-10 text-gray-400 mx-auto opacity-40" />
              <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                Team information has not been published yet.
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                Institutional leadership, mentors, and strategic partner organizations will appear here once approved and published by the administration.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Featured Leadership (Prominent Top Presentation) */}
              {publicTeamView.featuredLeadership.length > 0 && (
                <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#D9FF3F]/30 dark:border-[#D9FF3F]/20 p-6 shadow-subtle space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>Featured Institutional Leadership</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Directorate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {publicTeamView.featuredLeadership.map((member) => (
                      <div
                        key={member.id}
                        className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-[#202422] dark:to-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-start gap-4 shadow-subtle hover:border-[#D9FF3F] transition-all"
                      >
                        {member.fieldVisibility?.photo !== false && (
                          <img
                            src={member.avatar || "/images/profile_avatar.webp"}
                            alt={member.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                          />
                        )}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                              {member.name}
                            </h4>
                            {member.fieldVisibility?.linkedin && member.linkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:opacity-80 p-1"
                                title="LinkedIn Profile"
                              >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
                                </svg>
                              </a>
                            )}
                          </div>
                          {member.fieldVisibility?.designation !== false && (
                            <p className="text-xs font-semibold text-[#D9FF3F]">
                              {member.publicDesignation}
                            </p>
                          )}
                          {member.fieldVisibility?.department !== false && member.department && (
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                              {member.department}
                            </p>
                          )}
                          {member.fieldVisibility?.bio !== false && member.publicBio && (
                            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-3 leading-relaxed pt-0.5">
                              {member.publicBio}
                            </p>
                          )}

                          {member.fieldVisibility?.expertise !== false && member.expertise && member.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {member.expertise.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Contact details if explicitly authorized */}
                          {(member.fieldVisibility?.email && member.email) ||
                          (member.fieldVisibility?.phone && member.phone) ? (
                            <div className="flex items-center gap-3 pt-2 text-[11px] text-gray-500">
                              {member.fieldVisibility?.email && member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="flex items-center gap-1 hover:text-[#D9FF3F]"
                                >
                                  <Mail className="w-3 h-3 text-red-500" />
                                  <span>{member.email}</span>
                                </a>
                              )}
                              {member.fieldVisibility?.phone && member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="flex items-center gap-1 hover:text-[#D9FF3F]"
                                >
                                  <Phone className="w-3 h-3 text-red-500" />
                                  <span>{member.phone}</span>
                                </a>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Categorized Sections (Only sections with published items) */}
              {publicTeamView.sections.map((section) => {
                if (!section.hasContent) return null;

                // SPECIAL RENDERING: Ecosystem Partners (Orgs + Person Alliances)
                if (section.id === "ecosystem_partners") {
                  return (
                    <div
                      key={section.id}
                      className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4"
                    >
                      <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-500" />
                        <span>{section.title}</span>
                      </h3>

                      {/* Org Partners Grid */}
                      {section.orgPartners && section.orgPartners.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {section.orgPartners.map((p) => (
                            <div
                              key={p.id}
                              className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col items-center justify-between text-center gap-2 group hover:border-[#D9FF3F] transition-all"
                            >
                              <img
                                src={p.logo || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120"}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                              />
                              <div>
                                <p className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors line-clamp-1">
                                  {p.name}
                                </p>
                                <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                                  {p.category}
                                </span>
                              </div>
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-gray-400 hover:text-[#D9FF3F] inline-flex items-center gap-1"
                                >
                                  <span>Website</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Person Ecosystem Partners */}
                      {section.personPartners && section.personPartners.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {section.personPartners.map((member) => (
                            <div
                              key={member.id}
                              className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3.5"
                            >
                              <img
                                src={member.avatar || "/images/profile_avatar.webp"}
                                alt={member.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div className="space-y-1 flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                                  {member.name}
                                </h4>
                                <p className="text-[11px] font-semibold text-[#D9FF3F]">
                                  {member.publicDesignation}
                                </p>
                                {member.organization && (
                                  <p className="text-[10px] text-gray-400">
                                    {member.organization}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // SPECIAL RENDERING: Investment Partners
                if (section.id === "investment_partners") {
                  return (
                    <div
                      key={section.id}
                      className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4"
                    >
                      <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>{section.title}</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {section.members && section.members.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              if (inv.xentroInvestorId && onOpenInvestorProfile) {
                                onOpenInvestorProfile(inv.xentroInvestorId);
                              } else {
                                showToast(`Opening investor profile for ${inv.name}...`, "info");
                              }
                            }}
                            className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] hover:border-[#D9FF3F] transition-all space-y-2 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={inv.avatar || "/images/profile_avatar.webp"}
                                alt={inv.name}
                                className="w-10 h-10 rounded-xl object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors truncate">
                                  {inv.name}
                                </h4>
                                <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate block">
                                  {inv.publicDesignation}
                                </span>
                              </div>
                            </div>

                            {inv.investmentTicketSize && (
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Check: {inv.investmentTicketSize}
                              </p>
                            )}

                            {inv.expertise && inv.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {inv.expertise.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.2 rounded-sm text-[9px] font-semibold bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-white"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // SPECIAL RENDERING: Associated Mentors
                if (section.id === "mentors_advisors") {
                  return (
                    <div
                      key={section.id}
                      className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4"
                    >
                      <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-cyan-500" />
                        <span>{section.title}</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.members && section.members.map((mentor) => (
                          <div
                            key={mentor.id}
                            onClick={() => {
                              if (mentor.xentroMentorId && onOpenMentorProfile) {
                                onOpenMentorProfile(mentor.xentroMentorId);
                              } else {
                                showToast(`Opening mentor profile for ${mentor.name}...`, "info");
                              }
                            }}
                            className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] hover:border-[#D9FF3F] transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={mentor.avatar || "/images/profile_avatar.webp"}
                                alt={mentor.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors truncate">
                                  {mentor.name}
                                </h4>
                                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                                  {mentor.publicDesignation} {mentor.organization ? `· ${mentor.organization}` : ""}
                                </p>
                                {mentor.expertise && mentor.expertise.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {mentor.expertise.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.2 rounded-sm text-[9px] font-semibold bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-white"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#D9FF3F] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // GENERAL RENDERING: Leadership, Core Team, Faculty Coordinators
                return (
                  <div
                    key={section.id}
                    className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4"
                  >
                    <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D9FF3F]" />
                      <span>{section.title}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.members && section.members.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3.5 hover:border-[#D9FF3F] transition-all"
                        >
                          {member.fieldVisibility?.photo !== false && (
                            <img
                              src={member.avatar || "/images/profile_avatar.webp"}
                              alt={member.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                            />
                          )}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                                {member.name}
                              </h4>
                              {member.fieldVisibility?.linkedin && member.linkedin && (
                                <a
                                  href={member.linkedin}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:opacity-80 p-0.5"
                                  title="LinkedIn"
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
                                  </svg>
                                </a>
                              )}
                            </div>
                            {member.fieldVisibility?.designation !== false && (
                              <p className="text-[11px] font-semibold text-[#D9FF3F] truncate">
                                {member.publicDesignation}
                              </p>
                            )}
                            {member.fieldVisibility?.department !== false && member.department && (
                              <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                                {member.department}
                              </p>
                            )}
                            {member.fieldVisibility?.bio !== false && member.publicBio && (
                              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 pt-0.5">
                                {member.publicBio}
                              </p>
                            )}

                            {member.fieldVisibility?.expertise !== false && member.expertise && member.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {member.expertise.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.2 rounded-sm text-[9px] font-semibold bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-white"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Contact icons if explicitly allowed */}
                            {(member.fieldVisibility?.email && member.email) ||
                            (member.fieldVisibility?.phone && member.phone) ? (
                              <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-500">
                                {member.fieldVisibility?.email && member.email && (
                                  <a
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-1 hover:text-[#D9FF3F]"
                                  >
                                    <Mail className="w-3 h-3 text-red-500" />
                                    <span>{member.email}</span>
                                  </a>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Student Privacy & Campus Protection Notice */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-[#101212] dark:text-white">
                Campus Ecosystem Privacy Architecture
              </h5>
              <p className="text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Student innovators, staff members, and internal campus accounts are isolated within the private Institutional Workspace. In accordance with platform privacy and safeguarding guidelines, student records and personal direct contacts are never exposed on public-facing directory profiles without administrative authorization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: CONTENT & ACTIVITIES                               */}
      {/* ========================================================= */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["all", "Event", "Announcement", "Founder Story"].map((cat) => (
              <button
                key={cat}
                onClick={() => setContentFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  contentFilter === cat
                    ? "bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs"
                    : "bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]"
                }`}
              >
                {cat === "all" ? "All Activity" : `${cat}s`}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3 shadow-subtle"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.author.avatar}
                      alt={item.author.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {item.author.name}
                      </h4>
                      <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                        {item.author.role} · {item.date}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                    {item.type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {item.content}
                </p>

                {item.mediaUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video max-h-72 bg-black">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Event specific details and Register CTA */}
                {item.eventDetails && (
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-4">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-[#101212] dark:text-white">
                        {item.eventDetails.date} ({item.eventDetails.mode})
                      </p>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {item.eventDetails.location}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedEventForModal(item)}
                      className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      Register for Event
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  <button
                    onClick={() => showToast("Liked post!", "info")}
                    className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                  >
                    {item.likesCount} Likes
                  </button>
                  <button
                    onClick={() => showToast("Opening comments...", "info")}
                    className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                  >
                    {item.commentsCount} Comments
                  </button>
                  <button
                    onClick={() => showToast("Post shared!", "success")}
                    className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                  >
                    {item.sharesCount} Shares
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PROGRAM DETAILS & APPLY MODAL                    */}
      {/* ========================================================= */}
      {selectedProgramForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] px-2 py-0.5 rounded">
                  {selectedProgramForModal.type}
                </span>
                <h3 className="text-base font-bold text-[#101212] dark:text-white mt-1">
                  {selectedProgramForModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProgramForModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              {selectedProgramForModal.fullDetails || selectedProgramForModal.shortDescription}
            </p>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Funding:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedProgramForModal.fundingGrantAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Equity:</span>
                <span className="font-bold text-[#101212] dark:text-white">{selectedProgramForModal.equityRequirement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Deadline:</span>
                <span className="font-bold text-[#D9FF3F]">{selectedProgramForModal.applicationDeadline}</span>
              </div>
            </div>

            <form onSubmit={handleProgramApply} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Startup Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme AI"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Pitch Deck URL / Website
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Why do you want to join this cohort?
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Briefly state your current traction and goals..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProgramForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REQUEST SUPPORT / SERVICE MODAL                  */}
      {/* ========================================================= */}
      {selectedServiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                Request Service: {selectedServiceForModal.name}
              </h3>
              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Submit your request to the incubation office. Response turnaround is typically 2 business days.
            </p>

            <form onSubmit={handleServiceRequest} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Startup / Founder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Founder Name, Company"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Requirement Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what specific assistance or hours you need..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REGISTER FOR EVENT MODAL                        */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                Register: {selectedEventForModal.title}
              </h3>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedEventForModal.eventDetails && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-xs space-y-1">
                <p className="font-bold text-[#101212] dark:text-white">
                  {selectedEventForModal.eventDetails.date}
                </p>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  {selectedEventForModal.eventDetails.location} ({selectedEventForModal.eventDetails.mode})
                </p>
              </div>
            )}

            <form onSubmit={handleEventRegister} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CONNECT / PARTNERSHIP MODAL                     */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
                <span>Connect with {esp.identity.name}</span>
              </h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Inquire about incubation, corporate partnerships, mentor alliances, or investment syndication.
            </p>

            <form onSubmit={handleSendConnect} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Inquiry Purpose
                </label>
                <select className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]">
                  <option>Startup Incubation / Acceleration</option>
                  <option>Corporate Co-Creation & Pilots</option>
                  <option>Mentor / Advisory Network Onboarding</option>
                  <option>Investment Syndicate / LP Participation</option>
                  <option>Academic Research Commercialization</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce yourself and your organization..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
