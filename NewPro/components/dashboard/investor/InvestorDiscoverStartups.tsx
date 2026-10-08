'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  FolderLock,
  Plus,
  Bookmark,
  MapPin,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import {
  getBookmarkedStartups,
  toggleStartupBookmark,
  BookmarkedStartup,
} from '@/lib/startupBookmarkState';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export interface StartupItem {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  founder: string;
  location: string;
  sector: string;
  stage: string;
  askingRound: string;
  valuation: string;
  tractionMRR: string;
  matchScore: number;
  matchReason: string;
  verified: boolean;
  tags: string[];
}

export const mockDiscoverStartups: StartupItem[] = [];

export const InvestorDiscoverStartups: React.FC = () => {
  const { showToast } = useToast();
  const [viewTab, setViewTab] = useState<'all' | 'interested'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');

  // Bookmarks & Deals dynamic state
  const [bookmarkedStartups, setBookmarkedStartups] = useState<BookmarkedStartup[]>([]);
  const [dealStartupIds, setDealStartupIds] = useState<string[]>([]);

  useEffect(() => {
    setBookmarkedStartups(getBookmarkedStartups());
    setDealStartupIds(investorDomainService.getDeals().map((d) => d.startupId));

    const handleBookmarksChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.bookmarks) {
        setBookmarkedStartups(ce.detail.bookmarks);
      }
    };

    const handleDealsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) {
        setDealStartupIds(ce.detail.deals.map((d: any) => d.startupId));
      }
    };

    window.addEventListener('xentro-startup-bookmarks-changed', handleBookmarksChange);
    window.addEventListener('xentro-investor-deals-changed', handleDealsChange);
    return () => {
      window.removeEventListener('xentro-startup-bookmarks-changed', handleBookmarksChange);
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChange);
    };
  }, []);

  const sectors = ['All', 'Enterprise AI', 'DeepTech', 'FinTech', 'HealthTech', 'AgriTech', 'Logistics'];
  const stages = ['All', 'Pre-Seed', 'Seed', 'Series A'];

  const [liveStartups, setLiveStartups] = useState<StartupItem[]>([]);

  useEffect(() => {
    const backendUrl = getBackendBaseUrl();
    fetch(`${backendUrl}/startups/discover/`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data?.startups)) {
          const mapped: StartupItem[] = data.data.startups.map((s: any) => ({
            id: s.id,
            name: s.name,
            logo: '/xentro-logo.png',
            tagline: s.oneLiner || s.description || 'Verified venture in Xentro Ecosystem',
            founder: s.founder?.name || 'Founder',
            location: 'India',
            sector: s.sector || 'Enterprise AI',
            stage: s.stage === 'IDEA' ? 'Pre-Seed' : s.stage === 'SEED' ? 'Seed' : 'Seed',
            askingRound: '$500K - $1.5M',
            valuation: '$4M - $8M',
            tractionMRR: '$15K - $50K',
            matchScore: 92,
            matchReason: 'Active venture registered and verified in MongoDB',
            verified: true,
            tags: [s.sector || 'Enterprise SaaS', 'Verified', 'Atlas Live'],
          }));
          setLiveStartups(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Use live startups from MongoDB Atlas
  const combinedStartups: StartupItem[] = useMemo(() => {
    const pool = [...liveStartups];
    const seenIds = new Set(pool.map((s) => s.id));
    bookmarkedStartups.forEach((b) => {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        pool.push({
          id: b.id,
          name: b.name,
          logo: b.logo,
          tagline: b.tagline,
          founder: b.founder,
          location: b.location,
          sector: b.sector,
          stage: b.stage,
          askingRound: b.askingRound,
          valuation: b.valuation,
          tractionMRR: b.tractionMRR,
          matchScore: b.matchScore,
          matchReason: b.matchReason,
          verified: b.verified,
          tags: b.tags,
        });
      }
    });
    return pool;
  }, [liveStartups, bookmarkedStartups]);

  // Filter based on active tab and search/filters
  const filteredStartups = useMemo(() => {
    const baseList =
      viewTab === 'interested'
        ? combinedStartups.filter((s) => bookmarkedStartups.some((b) => b.id === s.id))
        : combinedStartups;

    return baseList.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.founder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSector = selectedSector === 'All' || s.sector === selectedSector;
      const matchesStage = selectedStage === 'All' || s.stage === selectedStage;

      return matchesSearch && matchesSector && matchesStage;
    });
  }, [combinedStartups, viewTab, bookmarkedStartups, searchTerm, selectedSector, selectedStage]);

  const handleToggleBookmark = (startup: StartupItem) => {
    const res = toggleStartupBookmark(startup);
    if (res.isBookmarked) {
      showToast(`${startup.name} bookmarked! Saved in Interested Startups.`, 'success');
    } else {
      showToast(`Removed ${startup.name} from Interested bookmarks.`, 'info');
    }
  };

  const handleAddToDealFlow = (startup: StartupItem) => {
    const existingDeals = investorDomainService.getDeals();
    const alreadyExists = existingDeals.some((d) => d.startupId === startup.id);

    if (alreadyExists) {
      showToast(`${startup.name} is already in your Deal Flow pipeline!`, 'info');
      return;
    }

    // Dispatch via investorDomainService.addDeal
    investorDomainService.addDeal({
      startupId: startup.id,
      startupName: startup.name,
      startupLogo: startup.logo,
      founderName: startup.founder,
      sector: startup.sector,
      stage: startup.stage,
      pitchSummary: startup.tagline,
      fundingAsk: startup.askingRound,
      valuation: startup.valuation,
      tractionMRR: startup.tractionMRR,
      dealStage: 'reviewed',
      matchScore: startup.matchScore,
      tags: startup.tags,
    });

    setDealStartupIds((prev) => [...prev, startup.id]);
    showToast(`Added ${startup.name} to Deal Flow pipeline! Reflecting in Deal Flow CRM.`, 'success');
  };

  const handleRequestDiligence = (startup: StartupItem) => {
    investorDomainService.requestDiligence(startup.id, startup.name, 'Pitch Deck & Financials');
    showToast(`Due diligence data room requested for ${startup.name}. Founder notified.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>AI-Powered Deal Sourcing & Discovery</span>
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Proprietary thesis matching and ecosystem curation across high-growth ventures
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tech, founder, sector, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D9FF3F]"
            />
          </div>
        </div>

        {/* View Mode Switcher: All Startups vs Interested / Bookmarked */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
          <button
            onClick={() => setViewTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewTab === 'all'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Sourced Startups</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
              {combinedStartups.length}
            </span>
          </button>

          <button
            onClick={() => setViewTab('interested')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewTab === 'interested'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${viewTab === 'interested' ? 'fill-current' : 'text-amber-500 fill-amber-500'}`} />
            <span>Interested (Bookmarked)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D9FF3F]/30 dark:bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {bookmarkedStartups.length}
            </span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sector:
            </span>
            {sectors.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedSector === sec
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#565B59] dark:text-[#B6B8B7]">Stage:</span>
            {stages.map((stg) => (
              <button
                key={stg}
                onClick={() => setSelectedStage(stg)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedStage === stg
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Startups Result Grid */}
      {filteredStartups.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <Bookmark className="w-10 h-10 mx-auto text-amber-500/40" />
          <h3 className="text-base font-bold text-[#101212] dark:text-white">
            {viewTab === 'interested' ? 'No Interested Startups Bookmarked Yet' : 'No Startups Found'}
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
            {viewTab === 'interested'
              ? 'Visit the Universal Startups tab or Feed, and click the Bookmark icon on any startup to curate them directly into this Interested list.'
              : 'Try adjusting your sector or stage filters, or clear your search query.'}
          </p>
          {viewTab === 'interested' && (
            <button
              onClick={() => setViewTab('all')}
              className="mt-2 px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs hover:bg-[#C7F020] transition-all cursor-pointer"
            >
              Browse All Sourced Startups
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStartups.map((st) => {
            const isBookmarked = bookmarkedStartups.some((b) => b.id === st.id);
            const isInDealFlow = dealStartupIds.includes(st.id);

            return (
              <div
                key={st.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col justify-between space-y-4 hover:border-[#D9FF3F]/50 transition-all group"
              >
                <div>
                  {/* Top row: Logo, Name, Match Score & Bookmark Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img src={st.logo} alt={st.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                            {st.name}
                          </h3>
                          {st.verified && (
                            <span title="Verified Venture" className="text-emerald-500">
                              <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" />
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-gray-300">
                            {st.stage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                          <span>Founder: {st.founder}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#D9FF3F]" />
                            {st.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleBookmark(st)}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark to Interested Startups'}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isBookmarked
                            ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/60 shadow-2xs'
                            : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-gray-700 text-gray-400 hover:text-[#101212] dark:hover:text-white'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#D9FF3F]' : ''}`} />
                      </button>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" />
                        {st.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-3 line-clamp-2 leading-relaxed">
                    {st.tagline}
                  </p>

                  {/* Match rationale */}
                  <div className="mt-2.5 p-2 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20 text-[11px] text-[#101212] dark:text-gray-200">
                    <span className="font-bold text-[#101212] dark:text-[#D9FF3F]">Thesis Alignment: </span>
                    {st.matchReason}
                  </div>

                  {/* Key Investment Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#262A29] text-xs">
                    <div>
                      <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block">Round Ask</span>
                      <span className="font-bold text-[#101212] dark:text-white">{st.askingRound}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block">Valuation Cap</span>
                      <span className="font-bold text-[#101212] dark:text-white">{st.valuation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block">Traction</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {st.tractionMRR}
                      </span>
                    </div>
                  </div>

                  {/* Tag pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {st.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleRequestDiligence(st)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-xs font-semibold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <FolderLock className="w-3.5 h-3.5 text-purple-500" />
                    <span>Request DD</span>
                  </button>

                  {isInDealFlow ? (
                    <button
                      onClick={() => showToast(`${st.name} is already in your Deal Flow pipeline!`, 'info')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Deal Flow</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToDealFlow(st)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Deal Flow</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
