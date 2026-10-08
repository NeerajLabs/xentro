'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  Bookmark,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { messagingService } from '@/lib/messagingService';
import { toggleStartupBookmark, getBookmarkedStartups } from '@/lib/startupBookmarkState';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import {
  DiscoverCategory,
  StartupRecommendation,
  MentorRecommendation,
  InvestorRecommendation,
  UniversityRecommendation,
} from '@/types/discover';
import {
  mockRecommendedStartups,
  mockRecommendedMentors,
  mockRecommendedInvestors,
  mockRecommendedUniversities,
} from '@/data/discoverData';
import {
  DiscoverFullProfileView,
  DiscoverProfileItem,
} from './DiscoverFullProfileView';
import { MentorProfileView } from '@/components/dashboard/MentorProfileView';
import { getMentorProfileById } from '@/data/mentorProfilesData';
import { InvestorProfileView } from '@/components/dashboard/InvestorProfileView';
import { getInvestorProfileById } from '@/data/investorProfilesData';
import { StartupProfileView } from '@/components/dashboard/StartupProfileView';
import { getStartupProfileById } from '@/data/startupProfilesData';
import { ESPProfileView } from '@/components/dashboard/ESPProfileView';
import { getESPProfileById } from '@/data/espProfilesData';
import { getStartupGhostMode, getStartupOverallVisibility, StartupOverallVisibility } from '@/lib/startupProfileState';

interface MentorDiscoverProps {
  startups?: any[];
  defaultCategory?: DiscoverCategory;
  onCategoryChange?: (category: DiscoverCategory) => void;
}

export const MentorDiscover: React.FC<MentorDiscoverProps> = ({
  defaultCategory = 'startups',
  onCategoryChange,
}) => {
  const { showToast } = useToast();
  const [category, setCategory] = useState<DiscoverCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Universal connection state across all items: id -> boolean
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedStartupIds, setBookmarkedStartupIds] = useState<string[]>([]);

  // Full page profile view state
  const [selectedProfileItem, setSelectedProfileItem] =
    useState<DiscoverProfileItem | null>(null);

  // Visibility state tracking to filter out hidden startups from discovery & search
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [overallVisibility, setOverallVisibility] = useState<StartupOverallVisibility>('Public');

  React.useEffect(() => {
    setIsGhostMode(getStartupGhostMode());
    setOverallVisibility(getStartupOverallVisibility());
    setBookmarkedStartupIds(getBookmarkedStartups().map((b) => b.id));

    const handleGhostChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.isGhostMode !== undefined) {
        setIsGhostMode(ce.detail.isGhostMode);
      }
    };
    const handleVisibilityChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.visibility) {
        setOverallVisibility(ce.detail.visibility);
        setIsGhostMode(ce.detail.visibility === 'Ghost Mode');
      }
    };
    const handleBookmarksChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.bookmarks) {
        setBookmarkedStartupIds(ce.detail.bookmarks.map((b: any) => b.id));
      }
    };

    window.addEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    window.addEventListener('xentro-visibility-changed', handleVisibilityChanged);
    window.addEventListener('xentro-startup-bookmarks-changed', handleBookmarksChanged);
    return () => {
      window.removeEventListener('xentro-ghost-mode-changed', handleGhostChanged);
      window.removeEventListener('xentro-visibility-changed', handleVisibilityChanged);
      window.removeEventListener('xentro-startup-bookmarks-changed', handleBookmarksChanged);
    };
  }, []);

  // Sync with defaultCategory if changed from external sidebar navigation
  React.useEffect(() => {
    if (defaultCategory && defaultCategory !== category) {
      setCategory(defaultCategory);
      setSearchQuery('');
      setSelectedProfileItem(null); // Reset detail page when changing sidebar tab
    }
  }, [defaultCategory]);

  // Dynamic Titles & Subtitles per Category
  const headerContent = useMemo(() => {
    switch (category) {
      case 'startups':
        return {
          title: 'Recommended Startups',
          subtitle:
            'Discover startups that match your interests, expertise, and ecosystem activity.',
          searchPlaceholder:
            'Search startups by name, industry, or mentorship need...',
        };
      case 'mentors':
        return {
          title: 'Recommended Mentors',
          subtitle:
            'Connect with mentors who match your goals, industry, and areas of interest.',
          searchPlaceholder:
            'Search mentors by expertise, industry, or name...',
        };
      case 'investors':
        return {
          title: 'Recommended Investors',
          subtitle:
            'Discover investors aligned with your industry, stage, and funding goals.',
          searchPlaceholder:
            'Search investors by firm, industry, or investment focus...',
        };
      case 'esps':
        return {
          title: 'Recommended Universities',
          subtitle:
            'Discover universities and institutions connected to the XENTRO ecosystem.',
          searchPlaceholder:
            'Search universities or institutions by name, location, or area...',
        };
    }
  }, [category]);

  // Dynamic registered startups from Backend & LocalStorage
  const [dynamicStartups, setDynamicStartups] = useState<StartupRecommendation[]>([]);

  // Dynamic mentors, investors, and ESPs from the same /api/recommendations source as the feed sidebar
  const [dynamicMentors, setDynamicMentors] = useState<MentorRecommendation[]>([]);
  const [dynamicInvestors, setDynamicInvestors] = useState<InvestorRecommendation[]>([]);
  const [dynamicESPs, setDynamicESPs] = useState<UniversityRecommendation[]>([]);

  // Fetch mentors, investors, ESPs from the same live recommendations API the feed uses
  useEffect(() => {
    let cancelled = false;
    fetch('/api/recommendations')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const recData = data?.data;
        if (!recData) return;

        if (Array.isArray(recData.mentors) && recData.mentors.length > 0) {
          setDynamicMentors(
            recData.mentors.map((m: any): MentorRecommendation => ({
              id: m.userId || m.id,
              name: m.name,
              avatar: m.avatar || '/xentro-logo.png',
              title: m.title || 'Growth & Advisory Mentor',
              expertise: Array.isArray(m.expertise) ? m.expertise : ['Strategy', 'Leadership'],
              industry: m.context || 'Advisory & Mentorship',
              location: m.location || 'Global / Remote',
              experienceYears: '5+ years',
              mentorshipAreas: ['Strategy', 'Growth', 'Fundraising'],
              availabilityStatus: 'Accepting Mentees',
              bio: `${m.name} is a verified ecosystem mentor on Xentro. ${m.context || ''}.`.trim(),
              verified: true,
            }))
          );
        }

        if (Array.isArray(recData.investors) && recData.investors.length > 0) {
          setDynamicInvestors(
            recData.investors.map((inv: any): InvestorRecommendation => ({
              id: inv.userId || inv.id,
              name: inv.name,
              logo: inv.avatar || '/xentro-logo.png',
              investorType: 'Angel Network',
              location: inv.location || 'India',
              stages: ['Pre-Seed', 'Seed', 'Early Stage'],
              focusIndustries: ['Technology', 'SaaS', 'Deep Tech'],
              ticketSize: '₹25L–₹2Cr',
              portfolioHighlights: [],
              description: `${inv.name} is an active investment partner on Xentro. ${inv.context || ''}.`.trim(),
              verified: true,
            }))
          );
        }

        if (Array.isArray(recData.esps) && recData.esps.length > 0) {
          setDynamicESPs(
            recData.esps.map((esp: any): UniversityRecommendation => ({
              id: esp.userId || esp.id,
              name: esp.name,
              logo: esp.avatar || '/xentro-logo.png',
              location: esp.context || 'India',
              institutionType: 'University',
              strengths: ['Innovation', 'Incubation', 'Entrepreneurship'],
              ecosystemPrograms: ['Incubation', 'Mentorship', 'Grants'],
              description: `${esp.name} is an ecosystem support provider on Xentro.`,
            }))
          );
        }
      })
      .catch((err) => console.debug('[MentorDiscover] Failed to load dynamic recommendations:', err));
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    const localList: StartupRecommendation[] = [];
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('xentro_startup_entities') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((st: any) => {
            if (st.startupName) {
              localList.push({
                id: st.id || `st_local_${Date.now()}`,
                name: st.startupName,
                logo: '/xentro-logo.png',
                industry: st.industry || 'Enterprise SaaS / AI',
                stage: (st.stage as any) || 'Seed',
                location: st.location || 'India',
                fundingRaised: 'Active Round',
                description: st.description || 'Next-generation venture connected via Xentro ecosystem.',
                needsHelpWith: ['System Architecture', 'Scale Infrastructure', 'Institutional Advisory'],
                tags: [st.industry || 'DeepTech', 'Innovation', 'Platform'],
                founder: {
                  name: st.founderName || 'Founder',
                  avatar: '/xentro-logo.png',
                  role: `Founder & CEO (${st.officialEmail || 'founder@startup.com'})`,
                },
                metrics: 'Verified Venture · Xentro Registry',
              });
            }
          });
        }
      }
    } catch (err) {
      console.debug('Failed to read local startups', err);
    }

    // Query Django Backend for live registered startups
    const backendUrl = getBackendBaseUrl();
    fetch(`${backendUrl}/startups/discover/`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data?.startups)) {
          const apiStartups: StartupRecommendation[] = data.data.startups.map((s: any) => ({
            id: s.id,
            name: s.name,
            logo: '/xentro-logo.png',
            industry: s.sector || 'Enterprise SaaS / Platform',
            stage: (s.stage === 'IDEA' ? 'Pre-Seed' : s.stage === 'SEED' ? 'Seed' : 'Early Stage') as any,
            location: 'India',
            fundingRaised: 'Active Seed Round',
            description: s.oneLiner || 'Autonomous Venture connected via Xentro ecosystem.',
            needsHelpWith: ['System Architecture', 'Scale Infrastructure', 'Institutional Advisory'],
            tags: ['Enterprise SaaS', 'Platform', 'AI Ecosystem'],
            founder: {
              name: s.founder?.name || 'Founder',
              avatar: '/xentro-logo.png',
              role: `Founder & CEO (${s.founder?.email || ''})`,
            },
            metrics: 'Live Monolith · Atlas Cloud Verified',
          }));

          const combined = [...localList];
          apiStartups.forEach((as) => {
            if (!combined.some((c) => c.name.toLowerCase().trim() === as.name.toLowerCase().trim())) {
              combined.push(as);
            }
          });
          setDynamicStartups(combined);
        } else if (localList.length > 0) {
          setDynamicStartups(localList);
        }
      })
      .catch(() => {
        if (localList.length > 0) {
          setDynamicStartups(localList);
        }
      });
  }, []);

  // Filtered datasets based on active search
  const filteredStartups = useMemo(() => {
    // If ghost mode or private mode is active for the startup, omit st_1 from discovery & search recommendations
    const isHiddenFromDiscovery = isGhostMode || overallVisibility === 'Ghost Mode' || overallVisibility === 'Private';

    // Strict deduplication by normalized name so duplicate cards never appear:
    const seenNames = new Set<string>();
    const allStartupsPool: StartupRecommendation[] = [];

    dynamicStartups.forEach((st) => {
      const norm = st.name.toLowerCase().trim();
      if (!seenNames.has(norm)) {
        seenNames.add(norm);
        allStartupsPool.push(st);
      }
    });

    mockRecommendedStartups.forEach((st) => {
      const norm = st.name.toLowerCase().trim();
      if (!seenNames.has(norm)) {
        seenNames.add(norm);
        allStartupsPool.push(st);
      }
    });

    const baseStartups = isHiddenFromDiscovery
      ? allStartupsPool.filter((st) => st.id !== 'st_1')
      : allStartupsPool;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return baseStartups;
    return baseStartups.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.industry.toLowerCase().includes(q) ||
        st.location.toLowerCase().includes(q) ||
        st.description.toLowerCase().includes(q) ||
        st.needsHelpWith.some((n) => n.toLowerCase().includes(q)) ||
        st.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery, isGhostMode, overallVisibility, dynamicStartups]);

  const filteredMentors = useMemo(() => {
    // Prefer live backend data; fall back to mocks only if backend is empty
    const allMentors = dynamicMentors.length > 0 ? dynamicMentors : mockRecommendedMentors;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allMentors;
    return allMentors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.industry.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q)) ||
        m.mentorshipAreas.some((a) => a.toLowerCase().includes(q))
    );
  }, [searchQuery, dynamicMentors]);

  const filteredInvestors = useMemo(() => {
    // Prefer live backend data; fall back to mocks only if backend is empty
    const allInvestors = dynamicInvestors.length > 0 ? dynamicInvestors : mockRecommendedInvestors;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allInvestors;
    return allInvestors.filter(
      (inv) =>
        inv.name.toLowerCase().includes(q) ||
        inv.investorType.toLowerCase().includes(q) ||
        inv.location.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        inv.focusIndustries.some((f) => f.toLowerCase().includes(q)) ||
        inv.stages.some((s) => s.toLowerCase().includes(q))
    );
  }, [searchQuery, dynamicInvestors]);

  const filteredUniversities = useMemo(() => {
    // Prefer live backend data; fall back to mocks only if backend is empty
    const allESPs = dynamicESPs.length > 0 ? dynamicESPs : mockRecommendedUniversities;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allESPs;
    return allESPs.filter(
      (uni) =>
        uni.name.toLowerCase().includes(q) ||
        uni.location.toLowerCase().includes(q) ||
        uni.institutionType.toLowerCase().includes(q) ||
        uni.description.toLowerCase().includes(q) ||
        uni.strengths.some((s) => s.toLowerCase().includes(q)) ||
        uni.ecosystemPrograms.some((p) => p.toLowerCase().includes(q))
    );
  }, [searchQuery, dynamicESPs]);

  // Universal connect toggle handler
  const handleToggleConnect = (id: string, name: string) => {
    const nextState = !connectedMap[id];
    setConnectedMap((prev) => ({ ...prev, [id]: nextState }));
    if (nextState) {
      showToast(`Connected with ${name}!`, 'success');
    } else {
      showToast(`Disconnected from ${name}.`, 'info');
    }
  };

  // Universal startup bookmark toggle handler (syncs directly to Investor Discovery)
  const handleToggleBookmark = (st: StartupRecommendation) => {
    const res = toggleStartupBookmark({
      id: st.id,
      name: st.name,
      logo: st.logo,
      tagline: st.description,
      description: st.description,
      founder: st.founder,
      location: st.location,
      industry: st.industry,
      sector: st.industry,
      stage: st.stage,
      fundingRaised: st.fundingRaised,
      metrics: st.metrics,
      tags: st.tags,
    });
    if (res.isBookmarked) {
      showToast(`${st.name} bookmarked! Listed in Interested Startups in Investor Discovery.`, 'success');
    } else {
      showToast(`Removed ${st.name} from bookmarks.`, 'info');
    }
  };

  // If a full profile is opened, render it like a dedicated new page
  if (selectedProfileItem) {
    if (selectedProfileItem.type === 'mentor') {
      const fullMentor = getMentorProfileById(selectedProfileItem.data.id);
      return (
        <MentorProfileView
          mentorData={fullMentor}
          mentorId={selectedProfileItem.data.id}
          onBackToDiscover={() => setSelectedProfileItem(null)}
        />
      );
    }
    if (selectedProfileItem.type === 'investor') {
      const fullInvestor = getInvestorProfileById(selectedProfileItem.data.id);
      return (
        <InvestorProfileView
          investorData={fullInvestor}
          investorId={selectedProfileItem.data.id}
          onBackToDiscover={() => setSelectedProfileItem(null)}
          onOpenStartupProfile={(startupId) => {
            const found = mockRecommendedStartups.find((st) => st.id === startupId);
            if (found) {
              setSelectedProfileItem({
                type: 'startup',
                data: found,
              });
            } else {
              showToast('Opening Startup Profile...', 'info');
            }
          }}
        />
      );
    }
    if (selectedProfileItem.type === 'startup') {
      const fullStartup = getStartupProfileById(selectedProfileItem.data.id);
      return (
        <StartupProfileView
          startupData={fullStartup}
          startupId={selectedProfileItem.data.id}
          onBackToDiscover={() => setSelectedProfileItem(null)}
        />
      );
    }
    if (selectedProfileItem.type === 'university') {
      const fullESP = getESPProfileById(selectedProfileItem.data.id);
      return (
        <ESPProfileView
          espData={fullESP}
          espId={selectedProfileItem.data.id}
          onBackToDiscover={() => setSelectedProfileItem(null)}
          onOpenStartupProfile={(startupId) => {
            const found = mockRecommendedStartups.find((st) => st.id === startupId);
            if (found) {
              setSelectedProfileItem({
                type: 'startup',
                data: found,
              });
            } else {
              showToast('Opening Startup Profile...', 'info');
            }
          }}
          onOpenMentorProfile={(mentorId) => {
            const found = mockRecommendedMentors.find((m) => m.id === mentorId);
            if (found) {
              setSelectedProfileItem({
                type: 'mentor',
                data: found,
              });
            } else {
              showToast('Opening Mentor Profile...', 'info');
            }
          }}
          onOpenInvestorProfile={(investorId) => {
            const found = mockRecommendedInvestors.find((inv) => inv.id === investorId);
            if (found) {
              setSelectedProfileItem({
                type: 'investor',
                data: found,
              });
            } else {
              showToast('Opening Investor Profile...', 'info');
            }
          }}
        />
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Card (Title, Subtitle & Search - Category pills removed as requested) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#101212] dark:text-white font-heading">
              {headerContent.title}
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
              {headerContent.subtitle}
            </p>
          </div>

          {/* Category Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar self-start sm:self-auto">
            {[
              { id: 'startups', label: 'Startups' },
              { id: 'mentors', label: 'Mentors' },
              { id: 'investors', label: 'Investors' },
              { id: 'esps', label: 'ESPs' },
            ].map((catItem) => {
              const isSelected = category === catItem.id;
              return (
                <button
                  key={catItem.id}
                  onClick={() => {
                    setCategory(catItem.id as DiscoverCategory);
                    if (onCategoryChange) {
                      onCategoryChange(catItem.id as DiscoverCategory);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                      : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  {catItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category-Aware Search Bar */}
        <div className="pt-2 border-t border-gray-100 dark:border-[#262A29]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder={headerContent.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30 transition-all placeholder-[#565B59] dark:placeholder-[#B6B8B7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 rounded-md text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Three-Column Card Grid (Desktop: 3, Tablet: 2, Mobile: 1) */}
      <div key={category} className="animate-fade-slide">
        {/* ========================================================= */}
        {/* CATEGORY 1: STARTUPS                                      */}
        {/* ========================================================= */}
        {category === 'startups' && filteredStartups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStartups.map((st) => {
                const isConnected = connectedMap[st.id];
                return (
                  <div
                    key={st.id}
                    className="recommendation-profile-card p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between group"
                  >
                  <div className="space-y-3">
                    {/* Header: Logo, Name & Top-Right Connect Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#202422]">
                          <img
                            src={st.logo}
                            alt={st.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                            {st.name}
                          </h4>
                          <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold truncate">
                            {st.industry}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-[#202422] font-medium">
                              {st.stage}
                            </span>
                            <span>·</span>
                            <span className="truncate">{st.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Actions: Bookmark & Connect */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleBookmark(st)}
                          title={bookmarkedStartupIds.includes(st.id) ? "Remove bookmark" : "Bookmark startup (saves to Investor Discovery)"}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                            bookmarkedStartupIds.includes(st.id)
                              ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/60 shadow-2xs'
                              : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-gray-700 text-gray-400 hover:text-[#101212] dark:hover:text-white'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${bookmarkedStartupIds.includes(st.id) ? 'fill-[#D9FF3F]' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleToggleConnect(st.id, st.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95'
                          }`}
                        >
                          {isConnected ? (
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

                        {isConnected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              messagingService.startOrOpenConversation({
                                id: st.id,
                                name: st.name,
                                role: st.industry || 'Startup',
                                avatar: st.logo || '/xentro-logo.png',
                              });
                              showToast(`Opening chat with ${st.name}...`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Funding raised callout */}
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {st.fundingRaised} Raised
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {st.description}
                    </p>

                    {/* Needs Mentorship With tags */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block">
                        Needs Mentorship With:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {st.needsHelpWith.map((need, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: View Details opens full profile */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29] mt-2">
                    <button
                      onClick={() =>
                        setSelectedProfileItem({
                          type: 'startup',
                          data: st,
                        })
                      }
                      className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] transition-colors flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    {st.metrics && (
                      <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {st.metrics}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 2: MENTORS                                       */}
        {/* ========================================================= */}
        {category === 'mentors' && filteredMentors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMentors.map((mentor) => {
                const isConnected = connectedMap[mentor.id];
                return (
                  <div
                    key={mentor.id}
                    className="recommendation-profile-card p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between group"
                  >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name & Top-Right Connect Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-xs">
                          <img
                            src={mentor.avatar}
                            alt={mentor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                              {mentor.name}
                            </h4>
                            {mentor.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F] fill-[#D9FF3F] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold truncate">
                            {mentor.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5 truncate">
                            <span>{mentor.location}</span>
                            <span>·</span>
                            <span className="font-medium text-[#101212] dark:text-white">
                              {mentor.experienceYears}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Connect and Message Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleConnect(mentor.id, mentor.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95'
                          }`}
                        >
                          {isConnected ? (
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

                        {isConnected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              messagingService.startOrOpenConversation({
                                id: mentor.id,
                                name: mentor.name,
                                role: mentor.title || 'Mentor',
                                avatar: mentor.avatar || '/xentro-logo.png',
                              });
                              showToast(`Opening chat with ${mentor.name}...`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bio / Industry */}
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {mentor.bio}
                    </p>

                    {/* Expertise Areas */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider">
                        <span>Expertise:</span>
                        {mentor.availabilityStatus && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 capitalize font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {mentor.availabilityStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.map((exp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: View Profile opens full profile */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29] mt-2">
                    <button
                      onClick={() =>
                        setSelectedProfileItem({
                          type: 'mentor',
                          data: mentor,
                        })
                      }
                      className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] transition-colors flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {mentor.industry}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 3: INVESTORS                                     */}
        {/* ========================================================= */}
        {category === 'investors' && filteredInvestors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInvestors.map((inv) => {
                const isConnected = connectedMap[inv.id];
                return (
                  <div
                    key={inv.id}
                    className="recommendation-profile-card p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between group"
                  >
                  <div className="space-y-3">
                    {/* Header: Firm Logo & Top-Right Connect Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#202422]">
                          <img
                            src={inv.logo}
                            alt={inv.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                              {inv.name}
                            </h4>
                            {inv.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F] fill-[#D9FF3F] flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold truncate">
                            {inv.investorType}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5 truncate">
                            <span>{inv.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Connect and Message Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleConnect(inv.id, inv.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95'
                          }`}
                        >
                          {isConnected ? (
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

                        {isConnected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              messagingService.startOrOpenConversation({
                                id: inv.id,
                                name: inv.name,
                                role: inv.investorType || 'Investor',
                                avatar: inv.logo || '/xentro-logo.png',
                              });
                              showToast(`Opening chat with ${inv.name}...`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {inv.ticketSize && (
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Check: {inv.ticketSize}
                      </div>
                    )}

                    {/* Firm Bio */}
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {inv.description}
                    </p>

                    {/* Focus Sectors & Stages */}
                    <div className="space-y-2 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block mb-1">
                          Focus Sectors:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {inv.focusIndustries.map((foc, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                            >
                              {foc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block mb-1">
                          Stages:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {inv.stages.map((stg, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]"
                            >
                              {stg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: View Profile opens full profile */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29] mt-2">
                    <button
                      onClick={() =>
                        setSelectedProfileItem({
                          type: 'investor',
                          data: inv,
                        })
                      }
                      className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] transition-colors flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    {inv.portfolioHighlights && (
                      <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate max-w-[140px]">
                        {inv.portfolioHighlights[0]}, {inv.portfolioHighlights[1]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* CATEGORY 4: ESPs (UNIVERSITIES & INSTITUTIONS)            */}
        {/* ========================================================= */}
        {category === 'esps' && filteredUniversities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUniversities.map((uni) => {
                const isConnected = connectedMap[uni.id];
                return (
                  <div
                    key={uni.id}
                    className="recommendation-profile-card p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between group"
                  >
                  <div className="space-y-3">
                    {/* Header: University Logo & Top-Right Connect Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#202422]">
                          <img
                            src={uni.logo}
                            alt={uni.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                            {uni.name}
                          </h4>
                          <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold truncate">
                            {uni.institutionType}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{uni.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Connect and Message Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleConnect(uni.id, uni.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95'
                          }`}
                        >
                          {isConnected ? (
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

                        {isConnected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              messagingService.startOrOpenConversation({
                                id: uni.id,
                                name: uni.name,
                                role: uni.institutionType || 'Institution',
                                avatar: uni.logo || '/xentro-logo.png',
                              });
                              showToast(`Opening chat with ${uni.name}...`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {uni.description}
                    </p>

                    {/* Strengths / Programs */}
                    <div className="space-y-2 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] tracking-wider block mb-1">
                          Key Strengths:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {uni.strengths.map((str, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                            >
                              {str}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Incubation impact badge */}
                      {uni.incubationStats && (
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-[11px]">
                          <span className="text-[#565B59] dark:text-[#B6B8B7]">Incubation:</span>
                          <span className="font-bold text-[#101212] dark:text-white">
                            {uni.incubationStats.incubatedCount}+ Startups
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action: View Details opens full profile */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29] mt-2">
                    <button
                      onClick={() =>
                        setSelectedProfileItem({
                          type: 'university',
                          data: uni,
                        })
                      }
                      className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] transition-colors flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <span>View Institution</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                    {uni.incubationStats && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {uni.incubationStats.fundingFacilitated} Facilitated
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state when search produces 0 results */}
        {((category === 'startups' && filteredStartups.length === 0) ||
          (category === 'mentors' && filteredMentors.length === 0) ||
          (category === 'investors' && filteredInvestors.length === 0) ||
          (category === 'esps' && filteredUniversities.length === 0)) && (
          <div className="p-12 text-center bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
              No matching {category} found
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
              We couldn&apos;t find any results for &quot;{searchQuery}&quot;. Try adjusting your keywords or clearing the search filter.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold active:scale-95 shadow-xs cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
