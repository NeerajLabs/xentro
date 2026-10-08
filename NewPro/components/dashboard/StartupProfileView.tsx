'use client';

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Lock,
  FolderLock,
  Play,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PieChart,
  Info,
  SlidersHorizontal,
  EyeOff,
  LayoutDashboard,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { connectionService, CONNECTIONS_UPDATED_EVENT } from "@/lib/connectionService";
import { messagingService } from "@/lib/messagingService";
import {
  FullStartupProfile,
  StartupAskItem,
  StartupOpenRole,
  PitchDeckDoc,
  ElevatorPitchVideo,
  StartupTeamMember,
  StartupProblem,
  StartupSolution,
  StartupProduct,
  StartupCompanyInfo,
  StartupMarket,
  StartupBusinessModel,
  StartupTalentAsk,
} from "@/types/startup";
import { getPublicTalentAsks } from "@/lib/startupTeamService";
import { getStartupProfileById } from "@/data/startupProfilesData";
import {
  getStartupGhostMode,
  setStartupGhostMode,
  getStartupPrivacySettings,
  StartupPrivacySettings,
  getStartupBanner,
  getStartupAvatar,
  getStartupOverallVisibility,
  setStartupOverallVisibility,
  StartupOverallVisibility,
  getStartupPitchVideo,
  getStartupPitchDeck,
  getStartupTeamMembers,
  categorizeTeamMembers,
  getStartupProblem,
  getStartupSolution,
  getStartupProduct,
  getStartupCompanyInfo,
  getStartupMarket,
  getStartupBusinessModel,
  getStartupBasicInfo,
  StartupBasicInfo,
} from "@/lib/startupProfileState";
import { getUserProfile } from "@/lib/userProfile";
import { toggleStartupBookmark, isStartupBookmarked } from "@/lib/startupBookmarkState";

export type StartupTabType =
  | "basic"
  | "pitch"
  | "team"
  | "finance"
  | "ask"
  | "content"
  | "dd_locker";

interface StartupProfileViewProps {
  onBackToFeed?: () => void;
  onBackToDiscover?: () => void;
  onManageInDashboard?: () => void;
  startupData?: FullStartupProfile;
  startupId?: string;
  isOwnProfile?: boolean;
}

export const StartupProfileView: React.FC<StartupProfileViewProps> = ({
  onBackToFeed,
  onBackToDiscover,
  onManageInDashboard,
  startupData,
  startupId,
  isOwnProfile,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<StartupTabType>("basic");

  const userProfile = getUserProfile();
  const isOwner = isOwnProfile !== undefined
    ? isOwnProfile
    : (!startupId && userProfile.role === "startup");

  const [overallVisibility, setOverallVisibility] = useState<StartupOverallVisibility>(getStartupOverallVisibility());
  const [isGhostMode, setIsGhostMode] = useState<boolean>(getStartupGhostMode());
  const [privacySettings, setPrivacySettings] = useState<StartupPrivacySettings>(getStartupPrivacySettings());
  const [previewAsPublic, setPreviewAsPublic] = useState(false);
  const [isGhostConfirmOpen, setIsGhostConfirmOpen] = useState(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  const [customBanner, setCustomBanner] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [pitchVideoOverride, setPitchVideoOverride] = useState<ElevatorPitchVideo | null | undefined>(undefined);
  const [pitchDeckOverride, setPitchDeckOverride] = useState<PitchDeckDoc | null | undefined>(undefined);
  const [teamMembersOverride, setTeamMembersOverride] = useState<StartupTeamMember[] | undefined>(undefined);
  const [talentAsksOverride, setTalentAsksOverride] = useState<StartupTalentAsk[] | undefined>(undefined);
  const [problemOverride, setProblemOverride] = useState<StartupProblem | undefined>(undefined);
  const [solutionOverride, setSolutionOverride] = useState<StartupSolution | undefined>(undefined);
  const [productOverride, setProductOverride] = useState<StartupProduct | undefined>(undefined);
  const [companyInfoOverride, setCompanyInfoOverride] = useState<StartupCompanyInfo | undefined>(undefined);
  const [marketOverride, setMarketOverride] = useState<StartupMarket | undefined>(undefined);
  const [businessModelOverride, setBusinessModelOverride] = useState<StartupBusinessModel | undefined>(undefined);
  const [basicInfoOverride, setBasicInfoOverride] = useState<StartupBasicInfo | undefined>(undefined);

  React.useEffect(() => {
    setCustomBanner(getStartupBanner());
    setCustomAvatar(getStartupAvatar());
    setOverallVisibility(getStartupOverallVisibility());
    setPitchVideoOverride(getStartupPitchVideo());
    setPitchDeckOverride(getStartupPitchDeck());
    setTeamMembersOverride(getStartupTeamMembers());
    setTalentAsksOverride(getPublicTalentAsks());
    setProblemOverride(getStartupProblem());
    setSolutionOverride(getStartupSolution());
    setProductOverride(getStartupProduct());
    setCompanyInfoOverride(getStartupCompanyInfo());
    setMarketOverride(getStartupMarket());
    setBusinessModelOverride(getStartupBusinessModel());
    setBasicInfoOverride(getStartupBasicInfo());

    const handleGhostChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.isGhostMode !== undefined) {
        setIsGhostMode(ce.detail.isGhostMode);
        if (ce.detail.isGhostMode) {
          setOverallVisibility('Ghost Mode');
        }
      }
    };
    const handleVisibilityChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.visibility) {
        setOverallVisibility(ce.detail.visibility);
        setIsGhostMode(ce.detail.visibility === 'Ghost Mode');
      }
    };
    const handlePrivacyChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.settings) {
        setPrivacySettings(ce.detail.settings);
        if (ce.detail.settings.isGhostMode !== undefined) {
          setIsGhostMode(ce.detail.settings.isGhostMode);
        }
        if (ce.detail.settings.visibility) {
          setOverallVisibility(ce.detail.settings.visibility);
        }
      }
    };
    const handleBannerChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setCustomBanner(ce.detail?.banner || null);
    };
    const handleAvatarChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setCustomAvatar(ce.detail?.avatar || null);
    };
    const handlePitchVideoChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setPitchVideoOverride(ce.detail?.video !== undefined ? ce.detail.video : getStartupPitchVideo());
    };
    const handlePitchDeckChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setPitchDeckOverride(ce.detail?.deck !== undefined ? ce.detail.deck : getStartupPitchDeck());
    };
    const handleStartupTeamChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setTeamMembersOverride(ce.detail?.members || getStartupTeamMembers());
    };
    const handleTalentChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setTalentAsksOverride(
        ce.detail?.asks
          ? ce.detail.asks.filter(
              (a: any) =>
                a.status === 'Open' &&
                (a.visibility === 'Public' || a.visibility === 'Xentro Users')
            )
          : getPublicTalentAsks()
      );
    };
    const handleProblemChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setProblemOverride(ce.detail?.problem || getStartupProblem());
    };
    const handleSolutionChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setSolutionOverride(ce.detail?.solution || getStartupSolution());
    };
    const handleProductChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setProductOverride(ce.detail?.product || getStartupProduct());
    };
    const handleCompanyInfoChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setCompanyInfoOverride(ce.detail?.companyInfo || getStartupCompanyInfo());
    };
    const handleMarketChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setMarketOverride(ce.detail?.market || getStartupMarket());
    };
    const handleBusinessModelChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setBusinessModelOverride(ce.detail?.businessModel || getStartupBusinessModel());
    };
    const handleBasicInfoChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setBasicInfoOverride(ce.detail?.basicInfo || getStartupBasicInfo());
    };

    window.addEventListener("xentro-ghost-mode-changed", handleGhostChanged);
    window.addEventListener("xentro-visibility-changed", handleVisibilityChanged);
    window.addEventListener("xentro-privacy-settings-changed", handlePrivacyChanged);
    window.addEventListener("xentro-startup-banner-changed", handleBannerChanged);
    window.addEventListener("xentro-startup-avatar-changed", handleAvatarChanged);
    window.addEventListener("xentro-pitch-video-changed", handlePitchVideoChanged);
    window.addEventListener("xentro-pitch-deck-changed", handlePitchDeckChanged);
    window.addEventListener("xentro-startup-team-changed", handleStartupTeamChanged);
    window.addEventListener("xentro-startup-talent-changed", handleTalentChanged);
    window.addEventListener("xentro-startup-problem-changed", handleProblemChanged);
    window.addEventListener("xentro-startup-solution-changed", handleSolutionChanged);
    window.addEventListener("xentro-startup-product-changed", handleProductChanged);
    window.addEventListener("xentro-startup-company-info-changed", handleCompanyInfoChanged);
    window.addEventListener("xentro-startup-market-changed", handleMarketChanged);
    window.addEventListener("xentro-startup-business-model-changed", handleBusinessModelChanged);
    window.addEventListener("xentro-startup-basic-info-changed", handleBasicInfoChanged);
    return () => {
      window.removeEventListener("xentro-ghost-mode-changed", handleGhostChanged);
      window.removeEventListener("xentro-visibility-changed", handleVisibilityChanged);
      window.removeEventListener("xentro-privacy-settings-changed", handlePrivacyChanged);
      window.removeEventListener("xentro-startup-banner-changed", handleBannerChanged);
      window.removeEventListener("xentro-startup-avatar-changed", handleAvatarChanged);
      window.removeEventListener("xentro-pitch-video-changed", handlePitchVideoChanged);
      window.removeEventListener("xentro-pitch-deck-changed", handlePitchDeckChanged);
      window.removeEventListener("xentro-startup-team-changed", handleStartupTeamChanged);
      window.removeEventListener("xentro-startup-talent-changed", handleTalentChanged);
      window.removeEventListener("xentro-startup-problem-changed", handleProblemChanged);
      window.removeEventListener("xentro-startup-solution-changed", handleSolutionChanged);
      window.removeEventListener("xentro-startup-product-changed", handleProductChanged);
      window.removeEventListener("xentro-startup-company-info-changed", handleCompanyInfoChanged);
      window.removeEventListener("xentro-startup-market-changed", handleMarketChanged);
      window.removeEventListener("xentro-startup-business-model-changed", handleBusinessModelChanged);
      window.removeEventListener("xentro-startup-basic-info-changed", handleBasicInfoChanged);
    };
  }, []);

  // Load startup data dynamically with full schema safety
  const defaultTemplate = getStartupProfileById(startupId || "st_1") || getStartupProfileById("st_1") || {} as any;
  const baseStartup: FullStartupProfile = {
    ...defaultTemplate,
    ...(startupData || {}),
    identity: {
      ...(defaultTemplate?.identity || {}),
      ...(startupData?.identity || {}),
    },
    overview: {
      ...(defaultTemplate?.overview || {}),
      ...(startupData?.overview || {}),
    },
    team: {
      ...(defaultTemplate?.team || { founders: [], leadership: [], core: [], advisors: [], openRoles: [] }),
      ...(startupData?.team || {}),
    },
  };

  // Own profile = YOUR data; others = selected profile data
  const isOwnStartup = Boolean(isOwnProfile) || (isOwnProfile === undefined && !startupId);

  const parsedFoundedYear = basicInfoOverride?.foundedYear
    ? parseInt(basicInfoOverride.foundedYear, 10) || (isOwnStartup ? 0 : baseStartup.identity.foundedYear)
    : isOwnStartup && !basicInfoOverride?.foundedYear
      ? 0
      : baseStartup.identity.foundedYear;

  const parsedOperatingGeo = basicInfoOverride?.operatingGeography
    ? basicInfoOverride.operatingGeography.split(',').map((g) => g.trim()).filter(Boolean)
    : baseStartup.identity.operatingGeography;

  const parsedUNSDGs = basicInfoOverride?.unsdgs
    ? basicInfoOverride.unsdgs.split(',').map((sdgText, idx) => {
        const cleaned = sdgText.trim();
        const goalMatch = cleaned.match(/goal\s*(\d+)[:\s-]*(.*)/i);
        return {
          goalNumber: goalMatch ? parseInt(goalMatch[1], 10) : idx + 1,
          title: goalMatch && goalMatch[2] ? goalMatch[2].trim() : cleaned,
          description: undefined,
          tags: basicInfoOverride.impactAreas
            ? basicInfoOverride.impactAreas.split(',').map((t) => t.trim()).filter(Boolean)
            : undefined,
        };
      }).filter((s) => s.title)
    : baseStartup.unsdg;

  const startup: FullStartupProfile = {
    ...baseStartup,
    identity: isOwnStartup
      ? {
          ...baseStartup.identity,
          name: basicInfoOverride?.startupName || userProfile.organization || (userProfile.name ? `${userProfile.name}'s Startup` : 'Your Startup'),
          tagline: basicInfoOverride?.tagline || '',
          stage: basicInfoOverride?.stage || userProfile.stageOrFocus || '',
          industry: basicInfoOverride?.industry || userProfile.sector || '',
          subSector: basicInfoOverride?.subSector || '',
          businessModelType: (basicInfoOverride?.businessModel as any) || baseStartup.identity.businessModelType,
          foundedYear: parsedFoundedYear,
          location: basicInfoOverride?.headquarters || userProfile.location || '',
          operatingGeography: parsedOperatingGeo.length > 0 ? parsedOperatingGeo : [],
          website: basicInfoOverride?.website || '',
          linkedin: basicInfoOverride?.linkedin || '',
          logo: basicInfoOverride?.logo || userProfile.avatar || '/xentro-logo.png',
        }
      : baseStartup.identity,
    overview: isOwnStartup
      ? {
          ...baseStartup.overview,
          whatItDoes: basicInfoOverride?.overview || '',
          whoItServes: '',
          coreValueProp: basicInfoOverride?.tagline || '',
          currentStage: basicInfoOverride?.stage || userProfile.stageOrFocus || '',
        }
      : baseStartup.overview,
    unsdg: isOwnStartup && parsedUNSDGs && parsedUNSDGs.length > 0
      ? parsedUNSDGs
      : isOwnStartup
        ? []
        : baseStartup.unsdg,
    pitchVideo: isOwner && pitchVideoOverride !== undefined
      ? (pitchVideoOverride || undefined)
      : baseStartup.pitchVideo,
    pitchDeck: isOwner && pitchDeckOverride !== undefined
      ? (pitchDeckOverride || undefined)
      : baseStartup.pitchDeck,
    team: (() => {
      const founders = baseStartup.team?.founders || [];
      const leadership = baseStartup.team?.leadership || [];
      const core = baseStartup.team?.core || [];
      const advisors = baseStartup.team?.advisors || [];
      const fallbackList = founders.concat(leadership, core, advisors);
      const activeMembers = isOwner && teamMembersOverride
        ? teamMembersOverride
        : ((startupData as any)?.teamMembers && Array.isArray((startupData as any).teamMembers) && (startupData as any).teamMembers.length > 0)
          ? (startupData as any).teamMembers
          : fallbackList;
      const categorized = categorizeTeamMembers(activeMembers);
      const publicAsks = isOwner && talentAsksOverride !== undefined
        ? talentAsksOverride
        : getPublicTalentAsks();
      const mappedRoles: StartupOpenRole[] = (publicAsks && publicAsks.length > 0)
        ? publicAsks.map((a) => ({
            id: a.id,
            title: a.positionTitle,
            type: (a.roleType === 'Co-Founder' ? 'Co-founder' : a.roleType === 'Advisor' ? 'Advisor' : a.roleType === 'Internship' ? 'Intern' : 'Developer') as any,
            department: a.department,
            location: `${a.location} (${a.workMode})`,
            description: a.description,
            requirements: a.requiredSkills,
          }))
        : baseStartup.team?.openRoles || [];
      return {
        ...(baseStartup.team || {}),
        ...categorized,
        openRoles: mappedRoles,
      };
    })(),
    problem: isOwner && problemOverride !== undefined
      ? problemOverride
      : baseStartup.problem,
    solution: isOwner && solutionOverride !== undefined
      ? solutionOverride
      : baseStartup.solution,
    product: isOwner && productOverride !== undefined
      ? productOverride
      : baseStartup.product,
    companyInfo: isOwner && companyInfoOverride !== undefined
      ? companyInfoOverride
      : baseStartup.companyInfo,
    market: isOwner && marketOverride !== undefined
      ? marketOverride
      : baseStartup.market,
    businessModel: isOwner && businessModelOverride !== undefined
      ? businessModelOverride
      : baseStartup.businessModel,
  };

  // Interactive local states
  const isOwnerProfile = isOwnStartup || isOwner;
  const partnerId = startupId || startup.id || 'XU-902411';
  const targetCountId = isOwnerProfile ? undefined : ((startupData as any)?.userId || (startup as any).userId || (startup as any).ownerId || startupId || startup.id);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'received' | 'connected'>(() =>
    connectionService.getConnectionStatus(partnerId)
  );
  const isConnected = connectionStatus === 'connected';
  const [isSaved, setIsSaved] = useState(false);
  const [financePeriod, setFinancePeriod] = useState<"monthly" | "quarterly">("monthly");

  const [liveConnectionsCount, setLiveConnectionsCount] = useState<number>(() => {
    return connectionService.getConnectedCount(targetCountId);
  });

  useEffect(() => {
    const handleConnectionsChange = () => {
      setConnectionStatus(connectionService.getConnectionStatus(partnerId));
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

  // Modals state
  const [isPitchVideoModalOpen, setIsPitchVideoModalOpen] = useState(false);
  const [isDeckViewerOpen, setIsDeckViewerOpen] = useState(false);
  const [currentDeckSlide, setCurrentDeckSlide] = useState(0);
  const [isDeckRequestModalOpen, setIsDeckRequestModalOpen] = useState(false);

  // Selected Ask for Respond Modal
  const [selectedAskForModal, setSelectedAskForModal] = useState<StartupAskItem | null>(null);
  const [respondAskMessage, setRespondAskMessage] = useState("");

  // Selected Role for Express Interest Modal
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<StartupOpenRole | null>(null);
  const [roleApplicantPitch, setRoleApplicantPitch] = useState("");

  // Access Modals
  const [isFinancialAccessModalOpen, setIsFinancialAccessModalOpen] = useState(false);
  const [isDDLockerModalOpen, setIsDDLockerModalOpen] = useState(false);
  const [ddLockerGranted, setDdLockerGranted] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const sid = startupId || startup.id || 'st_1';
    setIsSaved(isStartupBookmarked(sid));
    const handleBookmarksChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.bookmarks) {
        setIsSaved(ce.detail.bookmarks.some((b: any) => b.id === sid));
      }
    };
    window.addEventListener('xentro-startup-bookmarks-changed', handleBookmarksChanged);
    return () => {
      window.removeEventListener('xentro-startup-bookmarks-changed', handleBookmarksChanged);
    };
  }, [startup.id, startupId]);

  useEffect(() => {
    if (
      isPitchVideoModalOpen ||
      isDeckViewerOpen ||
      isDeckRequestModalOpen ||
      !!selectedAskForModal ||
      !!selectedRoleForModal ||
      isFinancialAccessModalOpen ||
      isDDLockerModalOpen ||
      isGhostConfirmOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isPitchVideoModalOpen,
    isDeckViewerOpen,
    isDeckRequestModalOpen,
    selectedAskForModal,
    selectedRoleForModal,
    isFinancialAccessModalOpen,
    isDDLockerModalOpen,
    isGhostConfirmOpen,
  ]);

  // Handlers
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast("Startup profile link copied to clipboard!", "success");
  };

  const handleToggleConnect = async () => {
    if (connectionStatus === 'connected') {
      showToast(`You are already connected with ${startup.identity.name}.`, "info");
      return;
    }

    if (connectionStatus === 'pending') {
      showToast(`Your connection request is pending ${startup.identity.name}'s approval.`, "info");
      return;
    }

    if (connectionStatus === 'received') {
      await connectionService.acceptConnection(partnerId);
      setConnectionStatus('connected');
      showToast(`Connection accepted! You and ${startup.identity.name} are now connected.`, "success");
      return;
    }

    await connectionService.requestConnection({
      id: partnerId,
      name: startup.identity.name,
      role: 'Enterprise SaaS & Venture Platform',
      avatar: startup.identity.logo || '/xentro-logo.png',
    });
    setConnectionStatus('pending');
    showToast(`Connection request sent to ${startup.identity.name}! Status: Pending Approval`, "success");
  };

  const handleToggleSave = () => {
    const sid = startupId || startup.id || 'st_1';
    const primaryFounder = startup.team?.founders?.[0]?.name || 'Founding Team';
    const res = toggleStartupBookmark({
      id: sid,
      name: startup.identity.name,
      logo: startup.identity.logo,
      tagline: startup.identity.tagline,
      description: startup.overview?.whatItDoes || startup.identity.tagline,
      founder: primaryFounder,
      location: startup.identity.location,
      sector: startup.identity.industry,
      industry: startup.identity.industry,
      stage: startup.identity.stage,
      askingRound: startup.investmentAsk?.totalAmountRaising || '$1.2M',
      valuation: startup.investmentAsk?.valuationCap || startup.financials?.currentValuation || '$8M',
      tractionMRR: startup.financials?.runway || '$28k MRR',
      tags: [startup.identity.industry, startup.identity.stage, startup.identity.businessModelType],
    });
    setIsSaved(res.isBookmarked);
    showToast(
      res.isBookmarked
        ? `${startup.identity.name} saved to bookmarks! Listed in Investor Discovery.`
        : `Removed ${startup.identity.name} from bookmarks`,
      res.isBookmarked ? "success" : "info"
    );
  };

  const handleSendAskResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondAskMessage.trim()) {
      showToast("Please enter a message detailing your offer or support.", "error");
      return;
    }
    showToast(`Response sent to ${startup.identity.name} regarding "${selectedAskForModal?.title}"!`, "success");
    setSelectedAskForModal(null);
    setRespondAskMessage("");
  };

  const handleSendRoleInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleApplicantPitch.trim()) {
      showToast("Please enter a short summary of your background and fit.", "error");
      return;
    }
    showToast(`Application submitted for "${selectedRoleForModal?.title}"!`, "success");
    setSelectedRoleForModal(null);
    setRoleApplicantPitch("");
  };

  const handleRequestFinancialAccess = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Financial documents access request submitted for founder review.", "success");
    setIsFinancialAccessModalOpen(false);
  };

  const handleRequestDDAccess = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Due Diligence Locker access request submitted under mutual NDA.", "success");
    setIsDDLockerModalOpen(false);
    setDdLockerGranted(true);
  };

  const handleDeckRequest = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Pitch deck access request submitted to the founders.", "success");
    setIsDeckRequestModalOpen(false);
  };

  // Canonical 7 tabs
  const tabs = [
    { id: "basic" as const, label: "Basic Info", icon: Building2 },
    { id: "pitch" as const, label: "Pitch Deck", icon: Play },
    { id: "team" as const, label: "Team", icon: Users },
    { id: "finance" as const, label: "Finances", icon: DollarSign },
    { id: "ask" as const, label: "Ask", icon: Target },
    { id: "content" as const, label: "Content", icon: FileText },
    { id: "dd_locker" as const, label: "DD Locker", icon: FolderLock },
  ];

  // If Ghost Mode is active on the target profile
  const isProfileGhosted = (isOwner || previewAsPublic)
    ? (overallVisibility === 'Ghost Mode' || isGhostMode)
    : ((startupData as any)?.visibility === 'Ghost Mode' || (startup as any)?.visibility === 'Ghost Mode');

  if (isProfileGhosted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 animate-fade-slide">
        {/* If owner previewing, offer button to return */}
        {isOwner && previewAsPublic && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-amber-700 dark:text-amber-400">
              Public Preview Mode: Ghost Mode is active on your profile. External visitors see this screen:
            </span>
            <button
              onClick={() => setPreviewAsPublic(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold text-xs cursor-pointer shadow-2xs"
            >
              Exit Public Preview
            </button>
          </div>
        )}

        <div className="p-12 sm:p-16 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-[#202422] flex items-center justify-center text-gray-400">
            <EyeOff className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              This profile is currently unavailable.
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto leading-relaxed">
              The startup founder has temporarily restricted public visibility on Xentro. Please check back later or contact the founding team via mutual connections.
            </p>
          </div>

          <div className="pt-2">
            {(onBackToDiscover || onBackToFeed) && (
              <button
                onClick={onBackToDiscover || onBackToFeed}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Browse</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If Private Mode is active and viewed as external user
  if ((!isOwner || previewAsPublic) && overallVisibility === 'Private') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 animate-fade-slide">
        {isOwner && previewAsPublic && (
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-400">
              Public Preview Mode: Profile visibility is set to Private. External visitors see this screen:
            </span>
            <button
              onClick={() => setPreviewAsPublic(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold text-xs cursor-pointer shadow-2xs"
            >
              Exit Public Preview
            </button>
          </div>
        )}

        <div className="p-12 sm:p-16 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              This startup profile is private.
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto leading-relaxed">
              Access to this startup profile is restricted to authorized ecosystem partners, approved investors, and verified connections.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={handleToggleConnect}
              className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] inline-flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Connect to Request Access</span>
            </button>
            {(onBackToDiscover || onBackToFeed) && (
              <button
                onClick={onBackToDiscover || onBackToFeed}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Browse</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-slide">
      {/* Public Preview Indicator for Owner */}
      {isOwner && previewAsPublic && (
        <div className="sticky top-20 z-40 p-3 rounded-2xl bg-[#101212] text-white border border-[#262A29] shadow-xl flex items-center justify-between gap-3 text-xs animate-fade-slide">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#D9FF3F]">
              <Eye className="w-4 h-4" />
            </div>
            <span>
              <strong className="text-[#D9FF3F]">Public Preview Mode:</strong> Viewing profile exactly as external visitors see it.
            </span>
          </div>
          <button
            onClick={() => setPreviewAsPublic(false)}
            className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] font-bold text-xs cursor-pointer shadow-2xs hover:bg-[#C7F020]"
          >
            Exit Public Preview
          </button>
        </div>
      )}

      {/* Ghost Mode Active Warning Banner for Owner */}
      {isOwner && !previewAsPublic && isGhostMode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                Ghost Mode Active
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-tight">
                Your Startup Profile is currently hidden from discovery (Search, Explore, Recommendations). You can still use your Dashboard, Messages, and Opportunities normally.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStartupGhostMode(false);
              setIsGhostMode(false);
              showToast("Ghost Mode disabled. Startup Profile is now Public on Xentro.", "success");
            }}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            Make Profile Public
          </button>
        </div>
      )}

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
            title={isSaved ? "Saved" : "Save Startup"}
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

      {/* 1. Global Startup Profile Header */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden shadow-subtle">
        {/* Subtle Ambient Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-emerald-950/30 via-[#181B1A] to-lime-950/20 relative overflow-hidden">
          {isOwner && customBanner ? (
            <img
              src={customBanner}
              alt="Startup Cover Banner"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(#D9FF3F_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Startup</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] backdrop-blur-xs">
              {startup.identity.stage} Stage
            </span>
          </div>
        </div>

        {/* Header Main Content */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-10 sm:-mt-12 mb-4">
            {/* Logo and Identity */}
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-[#202422] border-4 border-white dark:border-[#181B1A] shadow-md overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={(isOwner && customAvatar) ? customAvatar : startup.identity.logo}
                  alt={startup.identity.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/xentro-logo.png";
                  }}
                />
              </div>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#101212] dark:text-white font-heading tracking-tight">
                    {startup.identity.name}
                  </h1>
                  {startup.identity.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                  )}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">
                    {startup.identity.businessModelType}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] font-medium max-w-2xl leading-snug">
                  {startup.identity.tagline}
                </p>

                {/* Connections Counter */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>{liveConnectionsCount} Connections</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap pt-2 md:pt-0">
              {isOwner && !previewAsPublic ? (
                <>
                  {/* Visibility Status Dropdown (Public / Limited / Private / Ghost Mode) */}
                  <div className="relative">
                    <button
                      onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        overallVisibility === "Ghost Mode"
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
                          : overallVisibility === "Private"
                          ? "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300"
                          : overallVisibility === "Limited"
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300"
                          : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        overallVisibility === 'Ghost Mode'
                          ? 'bg-amber-500'
                          : overallVisibility === 'Private'
                          ? 'bg-purple-500'
                          : overallVisibility === 'Limited'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`} />
                      <span>{overallVisibility} ▼</span>
                    </button>

                    {isVisibilityDropdownOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-xl p-1.5 z-50 space-y-1 animate-fade-in">
                        {(['Public', 'Limited', 'Private', 'Ghost Mode'] as StartupOverallVisibility[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setIsVisibilityDropdownOpen(false);
                              if (mode === 'Ghost Mode') {
                                setIsGhostConfirmOpen(true);
                              } else {
                                setStartupOverallVisibility(mode);
                                setOverallVisibility(mode);
                                setIsGhostMode(false);
                                showToast(`Profile visibility updated to ${mode}`, 'success');
                              }
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left cursor-pointer ${
                              overallVisibility === mode ? 'bg-gray-100 dark:bg-[#202422] font-bold' : 'hover:bg-gray-50 dark:hover:bg-[#202422]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                mode === 'Ghost Mode' ? 'bg-amber-500' : mode === 'Private' ? 'bg-purple-500' : mode === 'Limited' ? 'bg-blue-500' : 'bg-emerald-500'
                              }`} />
                              <span className="text-[#101212] dark:text-white">{mode}</span>
                            </span>
                            {overallVisibility === mode && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Share Profile */}
                  <button
                    onClick={() => {
                      if (isGhostMode) {
                        showToast("Profile is currently in Ghost Mode. External visitors will see 'Profile Unavailable'.", "info");
                      } else {
                        handleShare();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-gray-300 text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Profile</span>
                  </button>

                  {/* Preview as Public */}
                  <button
                    onClick={() => {
                      setPreviewAsPublic(true);
                      showToast("Switched to Public Preview (Viewing as external visitor)", "info");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview as Public</span>
                  </button>

                  {/* Manage in Dashboard */}
                  <button
                    onClick={() => {
                      if (onManageInDashboard) {
                        onManageInDashboard();
                      } else {
                        window.dispatchEvent(new CustomEvent('xentro-navigate-tab', { detail: { tab: 'dashboard' } }));
                        if (onBackToFeed) onBackToFeed();
                      }
                      showToast("Redirecting to Startup Dashboard...", "info");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Manage in Dashboard</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Connect Action */}
                  <button
                    onClick={handleToggleConnect}
                    disabled={connectionStatus === 'pending'}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      connectionStatus === 'connected'
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : connectionStatus === 'pending'
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 cursor-not-allowed opacity-90"
                        : connectionStatus === 'received'
                        ? "bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212]"
                        : "bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95"
                    }`}
                  >
                    {connectionStatus === 'connected' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : connectionStatus === 'pending' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>Pending</span>
                      </>
                    ) : connectionStatus === 'received' ? (
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

                  {connectionStatus === 'connected' && (
                    <button
                      onClick={() => {
                        messagingService.startOrOpenConversation({
                          id: startup.id || partnerId,
                          name: startup.identity.name,
                          role: startup.identity.industry || 'Startup',
                          avatar: startup.identity.logo || '/xentro-logo.png',
                        });
                        showToast(`Opening direct chat with ${startup.identity.name}...`, 'success');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message Founder</span>
                    </button>
                  )}

                  {/* Watch Pitch Action */}
                  {startup.pitchVideo && (
                    <button
                      onClick={() => setIsPitchVideoModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Pitch</span>
                    </button>
                  )}

                  {/* Respond to Ask Action */}
                  {startup.currentAsks && startup.currentAsks.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab("ask");
                        showToast("Navigated to active asks below.", "info");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Respond to Ask</span>
                    </button>
                  )}

                  {/* Request DD Access Action */}
                  <button
                    onClick={() => setIsDDLockerModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
                  >
                    <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Request DD Access</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Meta Row */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-[#101212] dark:text-white">
                {startup.identity.industry}
              </span>
              <span className="opacity-40">·</span>
              <span>{startup.identity.subSector}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{startup.identity.location}</span>
            </div>

            {startup.identity.website && (
              <a
                href={startup.identity.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            {startup.identity.linkedin && (
              <a
                href={startup.identity.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Founded {startup.identity.foundedYear}</span>
            </div>
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
      {/* TAB 1: BASIC INFO                                         */}
      {/* ========================================================= */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          {/* A. Startup Identity */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D9FF3F]" />
              <span>Startup Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Business Model Type
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.identity.businessModelType}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Founded Year
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.identity.foundedYear}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Headquarters
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.identity.location}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Operating Geography
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {startup.identity.operatingGeography.map((geo, i) => (
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
                  Stage & Industry
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.identity.stage} · {startup.identity.industry}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Verification Status
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DPIIT & Ecosystem Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information (Statutory & Incorporation) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Company Information (Statutory & Incorporation)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Legal Entity Name
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.companyInfo.legalName}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Incorporation Date & Status
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.companyInfo.incorporationDate} ({startup.companyInfo.incorporationStatus})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  DPIIT Recognition
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DPIIT Recognised ✓</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  MSME / Udyam
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.companyInfo.isMSMERegistered ? "Registered MSME ✓" : "Not Registered"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Registered Location
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white line-clamp-1">
                  {startup.companyInfo.registeredLocation}
                </p>
              </div>

              {startup.companyInfo.incubatorAffiliation && (
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Incubator / Accelerator
                  </span>
                  <p className="text-xs font-bold text-[#101212] dark:text-white">
                    {startup.companyInfo.incubatorAffiliation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Startup Overview */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D9FF3F]" />
              <span>Startup Overview</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  What the Startup Does
                </span>
                <p className="text-xs text-[#101212] dark:text-[#B6B8B7] leading-relaxed">
                  {startup.overview.whatItDoes}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Who It Serves
                </span>
                <p className="text-xs text-[#101212] dark:text-[#B6B8B7] leading-relaxed">
                  {startup.overview.whoItServes}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Current Stage
                </span>
                <p className="text-xs text-[#101212] dark:text-[#B6B8B7] leading-relaxed">
                  {startup.overview.currentStage}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Core Value Proposition
                </span>
                <p className="text-xs font-semibold text-emerald-600 dark:text-[#D9FF3F] leading-relaxed">
                  {startup.overview.coreValueProp}
                </p>
              </div>
            </div>
          </div>

          {/* C. Impact / UNSDG (Hidden if no data exists) */}
          {startup.unsdg && startup.unsdg.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>UN Sustainable Development Goals (Impact)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {startup.unsdg.map((sdg, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                        {sdg.goalNumber}
                      </span>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {sdg.title}
                      </h4>
                    </div>
                    {sdg.description && (
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                        {sdg.description}
                      </p>
                    )}
                    {sdg.tags && sdg.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sdg.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
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
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PITCH DECK (EXACT CANONICAL ORDER A -> H)          */}
      {/* ========================================================= */}
      {activeTab === "pitch" && (
        <div className="space-y-6">
          {/* Elevator Pitch Video (FIRST ITEM) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-[#D9FF3F] fill-current" />
                <span>Elevator Pitch Video</span>
              </h3>
              {startup.pitchVideo && (
                <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Duration: {startup.pitchVideo.duration} (Max 3:00)
                </span>
              )}
            </div>

            {startup.pitchVideo ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                {/* Thumbnail container */}
                <div
                  onClick={() => setIsPitchVideoModalOpen(true)}
                  className="md:col-span-2 relative aspect-video rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#262A29] bg-black group cursor-pointer shadow-subtle"
                >
                  <img
                    src={startup.pitchVideo.thumbnailUrl}
                    alt="Pitch Video Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {startup.pitchVideo.presenterName} ({startup.pitchVideo.presenterRole})
                    </span>
                    <span className="font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {startup.pitchVideo.duration}
                    </span>
                  </div>
                </div>

                {/* Pitch Details & CTA */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      Presenter
                    </span>
                    <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                      {startup.pitchVideo.presenterName}
                    </h4>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      {startup.pitchVideo.presenterRole}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      Recommended Pitch Flow
                    </span>
                    <p className="text-[11px] text-[#101212] dark:text-white font-medium">
                      Problem → Solution → Product → Market → Progress → Ask
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPitchVideoModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Elevator Pitch</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-[#202422] rounded-xl border border-dashed border-gray-200 dark:border-[#262A29] space-y-2">
                <Play className="w-8 h-8 mx-auto text-gray-400" />
                <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                  No Elevator Pitch Video Uploaded
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                  The founder has not uploaded a video pitch for this venture yet.
                </p>
              </div>
            )}
          </div>

          {/* Pitch Deck Document */}
          {startup.pitchDeck ? (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Pitch Deck Document</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  startup.pitchDeck.visibility === "Public"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}>
                  Visibility: {startup.pitchDeck.visibility}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    {startup.pitchDeck.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7] flex-wrap">
                    <span>Version {startup.pitchDeck.version}</span>
                    <span>·</span>
                    <span>{startup.pitchDeck.slideCount || 16} Slides</span>
                    <span>·</span>
                    <span>Updated {startup.pitchDeck.lastUpdated}</span>
                    {startup.pitchDeck.fileSize && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{startup.pitchDeck.fileSize}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {startup.pitchDeck.visibility === "Public" ? (
                    <>
                      <button
                        onClick={() => setIsDeckViewerOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Deck</span>
                      </button>
                      {startup.pitchDeck.allowDownload && (
                        <button
                          onClick={() => showToast("Downloading pitch presentation PDF...", "success")}
                          className="px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-white hover:text-[#D9FF3F] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setIsDeckRequestModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Access</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Pitch Deck Document</span>
                </h3>
              </div>
              <div className="p-8 text-center bg-gray-50 dark:bg-[#202422] rounded-xl border border-dashed border-gray-200 dark:border-[#262A29] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-gray-400" />
                <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                  No Pitch Deck Document Uploaded
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  The startup founder has not published an active pitch presentation deck yet.
                </p>
              </div>
            </div>
          )}

          {/* Problem */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <span>Problem</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                  Problem Statement
                </span>
                <p className="text-xs sm:text-sm text-[#101212] dark:text-white font-medium leading-relaxed">
                  {startup.problem.problemStatement}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Target Users / Victims of Problem
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white font-medium">
                    {startup.problem.targetUsers}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Why It Matters
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white font-medium">
                    {startup.problem.whyItMatters}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Key Pain Points
                </span>
                <div className="space-y-2">
                  {startup.problem.painPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-2 text-xs text-[#101212] dark:text-[#B6B8B7]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {startup.problem.existingAlternatives && (
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Existing Alternatives & Flaws
                  </span>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {startup.problem.existingAlternatives}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Solution */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
              <span>Solution</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Solution Overview
                </span>
                <p className="text-xs sm:text-sm text-[#101212] dark:text-white font-medium leading-relaxed">
                  {startup.solution.overview}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    How It Solves the Problem
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed">
                    {startup.solution.howItSolves}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Core Value Proposition
                  </span>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-[#D9FF3F] leading-relaxed">
                    {startup.solution.coreValueProp}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Key Differentiators & Moats
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {startup.solution.keyDifferentiators.map((diff, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-2 text-xs text-[#101212] dark:text-white"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product / Service */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Product / Service</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                Status: {startup.product.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    {startup.product.name}
                  </h4>
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {startup.product.category}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {startup.product.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Key Features
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {startup.product.keyFeatures.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-2 text-xs text-[#101212] dark:text-white font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {startup.product.screenshots && startup.product.screenshots.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Product Screenshots
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {startup.product.screenshots.map((shot, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl overflow-hidden aspect-video border border-gray-200 dark:border-[#262A29] bg-black"
                      >
                        <img
                          src={shot}
                          alt="Screenshot"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                {startup.product.demoLink && (
                  <a
                    href={startup.product.demoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Try Interactive Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {startup.product.productWebsite && (
                  <a
                    href={startup.product.productWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-white hover:text-[#D9FF3F] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Product Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Market */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Market Opportunity</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Target Customer & Primary Segment
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white font-medium">
                    {startup.market.targetCustomer}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                    {startup.market.primarySegment}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Market Opportunity
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white font-medium leading-relaxed">
                    {startup.market.marketOpportunity}
                  </p>
                </div>
              </div>

              {/* TAM / SAM / SOM Metrics */}
              {(startup.market.tam || startup.market.sam || startup.market.som) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {startup.market.tam && (
                    <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                        Total Addressable Market (TAM)
                      </span>
                      <p className="text-base font-black text-[#101212] dark:text-white">
                        {startup.market.tam}
                      </p>
                    </div>
                  )}
                  {startup.market.sam && (
                    <div className="p-4 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 space-y-1 text-center">
                      <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                        Serviceable Addressable (SAM)
                      </span>
                      <p className="text-base font-black text-[#101212] dark:text-white">
                        {startup.market.sam}
                      </p>
                    </div>
                  )}
                  {startup.market.som && (
                    <div className="p-4 rounded-xl bg-lime-50/40 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-800/40 space-y-1 text-center">
                      <span className="text-[10px] uppercase font-bold text-lime-700 dark:text-[#D9FF3F]">
                        Serviceable Obtainable (SOM)
                      </span>
                      <p className="text-base font-black text-[#101212] dark:text-white">
                        {startup.market.som}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {startup.market.competitiveLandscape && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Competitive Landscape
                  </span>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {startup.market.competitiveLandscape}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Business Model */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D9FF3F]" />
              <span>Business Model</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Core Business Model
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.businessModel.businessModel}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Pricing Model
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.businessModel.pricingModel}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Revenue Streams
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {startup.businessModel.revenueStreams.map((stream, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-center gap-2 text-xs text-[#101212] dark:text-white"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
                      <span>{stream}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Customer Type
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.businessModel.customerType}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Sales Model
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.businessModel.salesModel}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TEAM                                               */}
      {/* ========================================================= */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* A. Founders (Visually Prominent) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D9FF3F]" />
                <span>Founders & Co-Founders</span>
              </h3>
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                {startup.team.founders.length} Founding Member{startup.team.founders.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {startup.team.founders.map((founder) => (
                <div
                  key={founder.id}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border-2 border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all space-y-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={founder.avatar}
                      alt={founder.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/images/profile_avatar.webp";
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                          {founder.name}
                        </h4>
                        {founder.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        {founder.isFullTime && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Full-time
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#D9FF3F] dark:text-[#D9FF3F]">
                        {founder.role}
                      </p>
                      {founder.experience && (
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {founder.experience}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {founder.bio}
                  </p>

                  {founder.expertise && founder.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {founder.expertise.map((exp, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-[#262A29] text-xs">
                    {founder.linkedin && (
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] flex items-center gap-1 font-semibold"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {founder.xentroProfile && (
                      <span className="text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1 font-semibold">
                        <span>Xentro Profile</span>
                        <Check className="w-3 h-3 text-emerald-500" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Leadership Team */}
          {startup.team.leadership && startup.team.leadership.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-500" />
                <span>Leadership Team</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {startup.team.leadership.map((leader) => (
                  <div
                    key={leader.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                          {leader.name}
                        </h4>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {leader.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      {leader.bio}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. Core Team */}
          {startup.team.core && startup.team.core.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Core Team</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {startup.team.core.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center gap-3"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {member.name}
                      </h4>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. Advisors & Mentors */}
          {startup.team.advisors && startup.team.advisors.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Advisors & Mentors</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.team.advisors.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={adv.avatar}
                        alt={adv.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                            {adv.name}
                          </h4>
                          {adv.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {adv.role}
                        </p>
                      </div>
                    </div>
                    {adv.relationshipToStartup && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {adv.relationshipToStartup}
                      </p>
                    )}
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      {adv.bio}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. Team Requirements (Open Roles with Express Interest) */}
          {startup.team.openRoles && startup.team.openRoles.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Team Requirements (We&apos;re Hiring)</span>
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-[#D9FF3F]">
                  {startup.team.openRoles.length} Open Positions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.team.openRoles.map((role) => (
                  <div
                    key={role.id}
                    className="p-5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                          {role.type}
                        </span>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {role.location}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                        {role.title}
                      </h4>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {role.description}
                      </p>
                      {role.requirements && role.requirements.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {role.requirements.map((req, rIdx) => (
                            <div
                              key={rIdx}
                              className="flex items-start gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7]"
                            >
                              <div className="w-1 h-1 rounded-full bg-[#D9FF3F] mt-1.5 shrink-0" />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-[#262A29]">
                      <button
                        onClick={() => setSelectedRoleForModal(role)}
                        className="w-full py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Express Interest</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FINANCES                                           */}
      {/* ========================================================= */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* A. Financial Snapshot */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#D9FF3F]" />
                <span>Financial Snapshot</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                startup.financials.revenueStatus === "pre-revenue"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              }`}>
                {startup.financials.revenueStatus === "pre-revenue" ? "Pre-Revenue" : "Revenue Generating"}
              </span>
            </div>

            {startup.financials.revenueStatus === "pre-revenue" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 space-y-1">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Pre-Revenue Validation Stage
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    This startup is currently in clinical/R&D validation and not generating commercial software revenues. Operating runway is secured via pre-seed funding and grants.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      Runway Secured
                    </span>
                    <p className="text-lg font-black text-[#101212] dark:text-white">
                      {startup.financials.runway || "12+ Months"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      Total Grants & Pre-Seed
                    </span>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {startup.financials.totalRaised || "$400K"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      Commercial Model
                    </span>
                    <p className="text-xs font-bold text-[#101212] dark:text-white">
                      Hardware Lease + Annual SaaS
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Monthly Recurring (MRR)
                  </span>
                  <p className="text-lg font-black text-[#101212] dark:text-white">
                    {startup.financials.mrr || "$32,000"}
                  </p>
                  {startup.financials.growthRate && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#D9FF3F]">
                      {startup.financials.growthRate}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Annual Run-Rate (ARR)
                  </span>
                  <p className="text-lg font-black text-[#101212] dark:text-white">
                    {startup.financials.arr || "$384,000"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Net Monthly Burn
                  </span>
                  <p className="text-lg font-black text-rose-500">
                    {startup.financials.burnRate || "$38,000"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Cash Runway
                  </span>
                  <p className="text-lg font-black text-cyan-500">
                    {startup.financials.runway || "18 Months"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* B. Revenue Model Summary */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <span>Revenue Model & Economics Summary</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Pricing Model
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.financials.revenueModelSummary.pricingModel}
                </p>
              </div>

              {startup.financials.revenueModelSummary.averageTicketSize && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Average Contract Value (ACV)
                  </span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {startup.financials.revenueModelSummary.averageTicketSize}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                  Target Customer Profile
                </span>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {startup.financials.revenueModelSummary.customerType}
                </p>
              </div>
            </div>
          </div>

          {/* C. Financial Performance (Monthly / Quarterly Toggle) */}
          {(startup.financials.monthlyPerformance || startup.financials.quarterlyPerformance) && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Financial Performance Track Record</span>
                </h3>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                  <button
                    onClick={() => setFinancePeriod("monthly")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      financePeriod === "monthly"
                        ? "bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs"
                        : "text-[#565B59] dark:text-[#B6B8B7]"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setFinancePeriod("quarterly")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      financePeriod === "quarterly"
                        ? "bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs"
                        : "text-[#565B59] dark:text-[#B6B8B7]"
                    }`}
                  >
                    Quarterly
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#262A29] text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Revenue</th>
                      <th className="py-2.5 px-3">Expenses</th>
                      <th className="py-2.5 px-3">Net Burn</th>
                      <th className="py-2.5 px-3">Cash Available</th>
                      <th className="py-2.5 px-3">Runway</th>
                      <th className="py-2.5 px-3">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                    {(financePeriod === "monthly"
                      ? startup.financials.monthlyPerformance || []
                      : startup.financials.quarterlyPerformance || []
                    ).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                        <td className="py-3 px-3 font-bold text-[#101212] dark:text-white">
                          {row.period}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {row.revenue}
                        </td>
                        <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                          {row.expenses}
                        </td>
                        <td className="py-3 px-3 text-rose-500 font-semibold">
                          {row.burn}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#101212] dark:text-white">
                          {row.cashAvailable}
                        </td>
                        <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                          {row.runway}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#D9FF3F]">
                          {row.growth || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. Detailed Financial Documents Callout */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-500" />
                <span>Audited Financials & Full Statements</span>
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Detailed financial documents are available through DD Locker.
              </p>
            </div>

            <button
              onClick={() => setIsFinancialAccessModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Request Financial Access</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ASK                                                */}
      {/* ========================================================= */}
      {activeTab === "ask" && (
        <div className="space-y-6">
          {/* A. Current Active Asks */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#D9FF3F]" />
                <span>Current Active Ecosystem Asks</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-[#D9FF3F]">
                {startup.currentAsks.length} Active Request{startup.currentAsks.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {startup.currentAsks.map((ask) => (
                <div
                  key={ask.id}
                  className="p-5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                        {ask.type}
                      </span>
                      {ask.deadline && (
                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          Deadline: {ask.deadline}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                      {ask.title}
                    </h4>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {ask.description}
                    </p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                        Requirement
                      </span>
                      <p className="text-[11px] font-medium text-[#101212] dark:text-white">
                        {ask.requirement}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedAskForModal(ask)}
                      className="w-full py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Respond to Ask</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Investment Ask (If fundraising) */}
          {startup.investmentAsk && startup.investmentAsk.isFundraising && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Active Investment Round</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {startup.investmentAsk.roundType}
                </span>
              </div>

              {/* Progress Indicator: Raised / Committed / Remaining */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">Target Raising: </span>
                    <span className="font-bold text-[#101212] dark:text-white">
                      {startup.investmentAsk.totalAmountRaising}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {startup.investmentAsk.amountCommitted} Committed ({startup.investmentAsk.percentageCommitted || 60}%)
                    </span>
                    <span className="text-[#565B59] dark:text-[#B6B8B7]"> · </span>
                    <span className="text-cyan-500 font-bold">
                      {startup.investmentAsk.amountRemaining} Remaining
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-[#181B1A] overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${startup.investmentAsk.percentageCommitted || 60}%` }}
                    title="Committed Capital"
                  />
                  <div
                    className="h-full bg-cyan-500/30 transition-all duration-500"
                    style={{ width: `${100 - (startup.investmentAsk.percentageCommitted || 60)}%` }}
                    title="Remaining Allocation"
                  />
                </div>
              </div>

              {/* Round Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Minimum Check
                  </span>
                  <p className="text-xs font-bold text-[#101212] dark:text-white">
                    {startup.investmentAsk.minimumInvestment || "$50,000"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Investment Instrument
                  </span>
                  <p className="text-xs font-bold text-[#101212] dark:text-white">
                    {startup.investmentAsk.instrument || "i-SAFE / CCPS"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Valuation Cap
                  </span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {startup.investmentAsk.valuationCap || "Confidential"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                    Expected Close
                  </span>
                  <p className="text-xs font-bold text-[#101212] dark:text-white">
                    {startup.investmentAsk.expectedClosingDate || "Q4 2026"}
                  </p>
                </div>
              </div>

              {/* C. Use of Funds */}
              {startup.investmentAsk.useOfFunds && startup.investmentAsk.useOfFunds.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
                    Use of Funds Breakdown
                  </h4>
                  <div className="space-y-2">
                    {startup.investmentAsk.useOfFunds.map((uof, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#101212] dark:text-white">
                            {uof.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {uof.amount && (
                            <span className="text-[#565B59] dark:text-[#B6B8B7]">
                              {uof.amount}
                            </span>
                          )}
                          <span className="font-bold text-[#D9FF3F] bg-black/40 px-2 py-0.5 rounded">
                            {uof.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* D. Previous Funding */}
              {startup.investmentAsk.previousFunding && startup.investmentAsk.previousFunding.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
                    Previous Funding Rounds
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {startup.investmentAsk.previousFunding.map((round, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-[#101212] dark:text-white">
                            {round.round}
                          </h5>
                          <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                            {round.date}
                          </span>
                        </div>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {round.amountRaised}
                        </p>
                        {round.investorName && (
                          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            Backed by: {round.investorName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. Non-Financial Asks */}
          {startup.nonFinancialAsks && startup.nonFinancialAsks.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>Non-Financial Requirements (Mentorship, Pilots, Partnerships)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.nonFinancialAsks.map((nfa) => (
                  <div
                    key={nfa.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                        {nfa.type}
                      </span>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {nfa.title}
                      </h4>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {nfa.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedAskForModal(nfa)}
                      className="py-1.5 px-3 rounded-lg border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white hover:text-[#D9FF3F] transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Respond to Ask</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: CONTENT                                            */}
      {/* ========================================================= */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Featured Content (Up to 3 Pinned Items) */}
          {startup.content.featured && startup.content.featured.length > 0 && (
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
                <span>Featured Highlights & Announcements</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.content.featured.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                          {item.type}
                        </span>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {item.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    {item.mediaUrl && (
                      <div className="rounded-xl overflow-hidden aspect-video bg-black mt-2">
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.author.avatar}
                          alt={item.author.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {item.author.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{item.likesCount} Likes</span>
                        <span>·</span>
                        <span>{item.commentsCount} Comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest Activity (Reusing Xentro feed post component structure) */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Latest Activity & Updates</span>
            </h3>

            <div className="space-y-4">
              {startup.content.latestActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={act.author.avatar}
                        alt={act.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-[#101212] dark:text-white">
                          {act.author.name}
                        </h5>
                        <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          {act.author.role} · {act.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#181B1A] px-2 py-0.5 rounded text-[#565B59] dark:text-[#B6B8B7]">
                      {act.type}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {act.content}
                  </p>

                  <div className="flex items-center gap-4 pt-2 text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    <button
                      onClick={() => showToast("Liked post!", "info")}
                      className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                    >
                      {act.likesCount} Likes
                    </button>
                    <button
                      onClick={() => showToast("Opening comments...", "info")}
                      className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                    >
                      {act.commentsCount} Comments
                    </button>
                    <button
                      onClick={() => showToast("Post shared!", "success")}
                      className="hover:text-[#D9FF3F] transition-colors cursor-pointer"
                    >
                      {act.sharesCount} Shares
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: DD LOCKER (DUE DILIGENCE LOCKER)                   */}
      {/* ========================================================= */}
      {activeTab === "dd_locker" && (
        <div className="space-y-6">
          {!ddLockerGranted ? (
            /* Restricted Access State */
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-8 sm:p-12 text-center shadow-subtle max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
                <FolderLock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Restricted Access Data Room
                </span>
                <h3 className="text-xl font-bold text-[#101212] dark:text-white font-heading">
                  Due Diligence Locker
                </h3>
                <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto leading-relaxed">
                  Confidential corporate, cap table, financial statements, and IP documentation are safeguarded in the Xentro DD Locker.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-around max-w-sm mx-auto text-xs">
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[10px] uppercase font-bold">
                    Documents
                  </span>
                  <span className="font-bold text-[#101212] dark:text-white">
                    {startup.ddLocker.totalDocumentCount} Files
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-300 dark:bg-[#262A29]" />
                <div>
                  <span className="text-[#565B59] dark:text-[#B6B8B7] block text-[10px] uppercase font-bold">
                    Last Updated
                  </span>
                  <span className="font-bold text-[#101212] dark:text-white">
                    {startup.ddLocker.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-400 max-w-md mx-auto">
                Security Notice: Source-code access is strictly prohibited through the DD Locker.
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsDDLockerModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Request DD Access</span>
                </button>
              </div>
            </div>
          ) : (
            /* Granted / Preview State */
            <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Access Granted (Confidential NDA Active)
                  </span>
                  <h3 className="text-lg font-bold text-[#101212] dark:text-white mt-1">
                    Due Diligence Data Room
                  </h3>
                </div>
                <button
                  onClick={() => setDdLockerGranted(false)}
                  className="text-xs text-[#565B59] hover:text-rose-500 font-semibold cursor-pointer"
                >
                  Lock Data Room
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {startup.ddLocker.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-2">
                        <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{cat.name}</span>
                      </h4>
                      <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7]">
                        {cat.documentCount} Items
                      </span>
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {cat.description}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {cat.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-semibold text-[#101212] dark:text-white line-clamp-1">
                              {doc.name}
                            </span>
                          </div>
                          <button
                            onClick={() => showToast(`Viewing ${doc.name} in secure previewer`, "info")}
                            className="px-2 py-1 rounded bg-[#D9FF3F] text-[#101212] text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: WATCH ELEVATOR PITCH MODAL                      */}
      {/* ========================================================= */}
      {isClient && isPitchVideoModalOpen && startup.pitchVideo && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-slide">
          <div className="bg-[#181B1A] border border-[#262A29] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#262A29]">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#D9FF3F] fill-current" />
                <h3 className="text-sm font-bold text-white">
                  {startup.identity.name} — Elevator Pitch
                </h3>
              </div>
              <button
                onClick={() => setIsPitchVideoModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video
                controls
                autoPlay
                src={startup.pitchVideo.videoUrl}
                poster={startup.pitchVideo.thumbnailUrl}
                className="w-full h-full object-contain"
              >
                Your browser does not support video playback.
              </video>
            </div>

            <div className="p-4 bg-[#202422] flex items-center justify-between text-xs text-[#B6B8B7]">
              <div>
                <span className="font-bold text-white">{startup.pitchVideo.presenterName}</span>
                <span> · {startup.pitchVideo.presenterRole}</span>
              </div>
              <span className="font-bold text-[#D9FF3F]">Duration: {startup.pitchVideo.duration}</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VIEW PITCH DECK CAROUSEL MODAL                  */}
      {/* ========================================================= */}
      {isClient && isDeckViewerOpen && startup.pitchDeck && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-slide">
          <div className="bg-[#181B1A] border border-[#262A29] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#262A29]">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {startup.pitchDeck.title}
                </h3>
                <p className="text-[11px] text-[#B6B8B7]">
                  Slide {currentDeckSlide + 1} of {(startup.pitchDeck.previewSlides?.length || 1)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {startup.pitchDeck.allowDownload && (
                  <button
                    onClick={() => showToast("Downloading Pitch Deck PDF...", "success")}
                    className="p-1.5 rounded-lg border border-[#262A29] bg-[#202422] text-xs font-bold text-white hover:text-[#D9FF3F] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}
                <button
                  onClick={() => setIsDeckViewerOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center relative p-4 min-h-[360px]">
              <img
                src={
                  startup.pitchDeck.previewSlides?.[currentDeckSlide] ||
                  startup.identity.logo
                }
                alt="Deck Slide"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />

              {startup.pitchDeck.previewSlides && startup.pitchDeck.previewSlides.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentDeckSlide((prev) =>
                        prev > 0 ? prev - 1 : (startup.pitchDeck?.previewSlides?.length || 1) - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-[#D9FF3F] hover:text-black transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDeckSlide((prev) =>
                        prev < (startup.pitchDeck?.previewSlides?.length || 1) - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-[#D9FF3F] hover:text-black transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="p-3 bg-[#202422] border-t border-[#262A29] flex items-center justify-between text-xs text-[#B6B8B7]">
              <span>Confidential & Proprietary · {startup.identity.name}</span>
              <span>Version {startup.pitchDeck.version}</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REQUEST PITCH DECK ACCESS MODAL                 */}
      {/* ========================================================= */}
      {isClient && isDeckRequestModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                Request Pitch Deck Access
              </h3>
              <button
                onClick={() => setIsDeckRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              The deck for {startup.identity.name} is marked as Restricted Access. Please state your interest and relationship.
            </p>

            <form onSubmit={handleDeckRequest} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Your Role / Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Partner at Venture Fund / Strategic Operator"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Reason for Request
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share a brief note with the founders..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeckRequestModalOpen(false)}
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
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RESPOND TO ASK MODAL                            */}
      {/* ========================================================= */}
      {isClient && selectedAskForModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] px-2 py-0.5 rounded">
                  {selectedAskForModal.type} Ask
                </span>
                <h3 className="text-base font-bold text-[#101212] dark:text-white mt-1">
                  Respond: {selectedAskForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAskForModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7]">
                Startup Requirement
              </span>
              <p className="text-[#101212] dark:text-white font-medium">
                {selectedAskForModal.requirement}
              </p>
            </div>

            <form onSubmit={handleSendAskResponse} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Your Offer / How You Can Help
                </label>
                <textarea
                  rows={4}
                  required
                  value={respondAskMessage}
                  onChange={(e) => setRespondAskMessage(e.target.value)}
                  placeholder="Describe your capabilities, network introductions, or terms..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAskForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 5: EXPRESS INTEREST IN OPEN ROLE MODAL             */}
      {/* ========================================================= */}
      {isClient && selectedRoleForModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                  {selectedRoleForModal.department}
                </span>
                <h3 className="text-base font-bold text-[#101212] dark:text-white mt-1">
                  Express Interest: {selectedRoleForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoleForModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRoleInterest} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Portfolio / GitHub / LinkedIn URL
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
                  Why you are a strong fit
                </label>
                <textarea
                  rows={4}
                  required
                  value={roleApplicantPitch}
                  onChange={(e) => setRoleApplicantPitch(e.target.value)}
                  placeholder="Highlight your relevant experience and why you want to build with this startup..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoleForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Interest</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 6: REQUEST FINANCIAL ACCESS MODAL                  */}
      {/* ========================================================= */}
      {isClient && isFinancialAccessModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Request Financial Access</span>
              </h3>
              <button
                onClick={() => setIsFinancialAccessModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              You are requesting access to confidential P&L, balance sheets, and forward financial projections for {startup.identity.name}.
            </p>

            <form onSubmit={handleRequestFinancialAccess} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Investor / Firm Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sequoia Capital / Blossom Syndicate"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Expected Check Size / Diligence Intent
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $250K - $1M lead check"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFinancialAccessModalOpen(false)}
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
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 7: REQUEST DD LOCKER ACCESS MODAL                  */}
      {/* ========================================================= */}
      {isClient && isDDLockerModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-slide">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-500" />
                <span>Request Due Diligence Locker Access</span>
              </h3>
              <button
                onClick={() => setIsDDLockerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Requesting access will dispatch an authorization request to the board of {startup.identity.name}. All document views are strictly watermarked and logged.
            </p>

            <form onSubmit={handleRequestDDAccess} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Entity / Fund Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peak XV Partners / Venture Fund"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Required DD Categories
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#101212] dark:text-white">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#D9FF3F]" />
                    <span>Corporate & Statutory</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#D9FF3F]" />
                    <span>Financial Statements</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#D9FF3F]" />
                    <span>Cap Table & Ownership</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#D9FF3F]" />
                    <span>Legal & Commercial</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[11px] text-[#565B59] dark:text-[#B6B8B7] space-y-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 accent-[#D9FF3F]" />
                  <span>
                    I confirm that our organization will adhere to the Xentro Mutual Non-Disclosure Agreement (M-NDA) and will not redistribute confidential documents.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDDLockerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Ghost Mode Confirmation Modal */}
      {isClient && isGhostConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">Enable Ghost Mode?</h3>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Temporary Discovery Protection</span>
              </div>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              Your Startup Profile will be hidden from Xentro Search, Explore, Recommendations, and discovery features. You will still be able to use your Dashboard, Messages, Opportunities, and other Xentro features.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGhostConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStartupGhostMode(true);
                  setIsGhostMode(true);
                  setIsGhostConfirmOpen(false);
                  showToast("Ghost Mode enabled. Your profile is now hidden from discovery.", "info");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                Enable Ghost Mode
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
