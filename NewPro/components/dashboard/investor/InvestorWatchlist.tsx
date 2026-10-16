'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Filter,
  Layers,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderLock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  MapPin,
  Building2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  WatchlistStartup,
  WatchlistStatus,
  fetchAuthoritativeWatchlist,
  removeStartupFromWatchlist,
  getCachedWatchlist,
  WATCHLIST_CHANGED_EVENT,
  getWatchlistContext,
} from '@/lib/investorWatchlistService';
import { investorDomainService } from '@/lib/investorDomainService';

interface InvestorWatchlistProps {
  onNavigateTab?: (tab: string) => void;
}

export const InvestorWatchlist: React.FC<InvestorWatchlistProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [watchlistState, setWatchlistState] = useState<WatchlistStatus>(getCachedWatchlist());
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [dealStartupIds, setDealStartupIds] = useState<string[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setSyncError(null);
    const res = await fetchAuthoritativeWatchlist();
    if (res.success) {
      setWatchlistState(res.data);
    } else {
      setSyncError(res.message || 'Failed to sync with server.');
      setWatchlistState(getCachedWatchlist());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    setDealStartupIds(investorDomainService.getDeals().map((d) => d.startupId));

    const handleWatchlistChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) {
        setWatchlistState(ce.detail);
      }
    };

    const handleDealsChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) {
        setDealStartupIds(ce.detail.deals.map((d: any) => d.startupId));
      }
    };

    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);
    window.addEventListener('xentro-investor-deals-changed', handleDealsChanged);
    return () => {
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChanged);
    };
  }, []);

  const handleRemove = async (startupId: string, name: string) => {
    const res = await removeStartupFromWatchlist(startupId);
    if (res.success) {
      showToast(`${name} removed from Watchlist.`, 'info');
      if (res.data) setWatchlistState(res.data);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleAddToDealFlow = (startup: WatchlistStartup) => {
    if (dealStartupIds.includes(startup.startupId)) {
      showToast(`${startup.name} is already in your Deal Flow CRM.`, 'info');
      return;
    }

    investorDomainService.addDeal({
      startupId: startup.startupId,
      startupName: startup.name,
      stage: 'Initial Review',
      fundingAsk: startup.askingRound || '$1M',
      valuation: startup.valuation || '$8M',
      matchScore: startup.matchScore || 88,
      sector: startup.sector || 'Technology',
      founderName: startup.founder || 'Founding Team',
      pitchSummary: 'Added from Watchlist',
      dealStage: 'reviewed',
    });

    setDealStartupIds([...dealStartupIds, startup.startupId]);
    showToast(`Added ${startup.name} to Deal Flow CRM!`, 'success');
  };

  const startups = watchlistState.startups || [];
  const activeCount = watchlistState.activeCount || startups.length;
  const capacityLimit = watchlistState.capacityLimit || (watchlistState.ownerType === 'organization' ? 30 : 10);
  const remaining = Math.max(0, capacityLimit - activeCount);
  const isFull = activeCount >= capacityLimit;
  const progressPercent = Math.min(100, Math.round((activeCount / capacityLimit) * 100));

  const filteredStartups = startups.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tagline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.founder || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'All' || item.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const sectors = [
    'All',
    ...Array.from(new Set(startups.map((s) => s.sector).filter((sec): sec is string => Boolean(sec)))),
  ];

  return (
    <div className="space-y-6">
      {/* 1. Watchlist Header & Authoritative Capacity Progress */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                Saved Startups / Watchlist
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                {watchlistState.ownerType === 'organization' ? 'Firm Shared' : 'Personal Angel'}
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Curate and track high-potential ventures saved from the Ecosystem Discovery Layer before committing to full Deal Flow CRM pipeline.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 text-[#565B59] dark:text-[#B6B8B7] cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Capacity Meter */}
        <div className="p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
              <span>Watchlist Capacity:</span>
              <span className={`font-bold ${isFull ? 'text-amber-600 dark:text-amber-400' : 'text-[#101212] dark:text-[#D9FF3F]'}`}>
                {activeCount} / {capacityLimit} Startups
              </span>
            </span>
            <span className="text-[#565B59] dark:text-[#7A807D]">
              {remaining > 0 ? `${remaining} slot${remaining === 1 ? '' : 's'} available` : 'Capacity limit reached'}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-[#181B1A] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isFull
                  ? 'bg-amber-500'
                  : progressPercent > 70
                  ? 'bg-[#9EBE12] dark:bg-[#D9FF3F]'
                  : 'bg-[#D9FF3F]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isFull && (
            <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 pt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Capacity full ({capacityLimit} startups). To save new ventures from Ecosystem Discovery, remove inactive entries or advance them to Deal Flow.
              </span>
            </div>
          )}
        </div>

        {syncError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Showing offline cached watchlist. Server sync paused: {syncError}</span>
            </div>
            <button onClick={loadData} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved startups by name, sector or founder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D9FF3F]"
          />
        </div>

        {sectors.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-[#565B59] dark:text-[#7A807D] flex items-center gap-1 font-semibold">
              <Filter className="w-3.5 h-3.5" /> Sector:
            </span>
            {sectors.map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sectorFilter === sec
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                    : 'bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Watchlist Grid */}
      {filteredStartups.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] flex items-center justify-center mx-auto text-gray-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#101212] dark:text-white">
            {searchTerm || sectorFilter !== 'All' ? 'No matching saved startups' : 'Your Watchlist is empty'}
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
            {searchTerm || sectorFilter !== 'All'
              ? 'Try adjusting your search query or filters to find saved startups.'
              : 'Discover vetted ventures across the Ecosystem Discovery Layer and click the bookmark icon to save up to ' +
                capacityLimit +
                ' startups to this Watchlist.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStartups.map((startup) => {
            const inDealFlow = dealStartupIds.includes(startup.startupId);
            return (
              <div
                key={startup.startupId}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col justify-between space-y-4 hover:border-[#D9FF3F]/50 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                        {startup.logo && !startup.logo.includes('placeholder') ? (
                          <img src={startup.logo} alt={startup.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate">
                          {startup.name}
                        </h4>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                          {startup.founder || 'Founding Team'} &bull; {startup.location || 'India'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(startup.startupId, startup.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                    {startup.tagline || 'Pioneering startup in Xentro Ecosystem.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#262A29] text-[11px]">
                    <div>
                      <span className="text-[#565B59] dark:text-[#7A807D] block">Sector</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{startup.sector || 'DeepTech'}</span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#7A807D] block">Stage & Asking</span>
                      <span className="font-semibold text-[#101212] dark:text-white">
                        {startup.stage || 'Seed'} &bull; {startup.askingRound || '$1M'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#7A807D] block">Valuation</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{startup.valuation || '$8M'}</span>
                    </div>
                    <div>
                      <span className="text-[#565B59] dark:text-[#7A807D] block">MRR / Metric</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{startup.tractionMRR || '$25k'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center gap-2">
                  <button
                    onClick={() => handleAddToDealFlow(startup)}
                    disabled={inDealFlow}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      inDealFlow
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] hover:opacity-90 active:scale-95'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{inDealFlow ? 'In Deal Flow CRM' : 'Add to Deal Flow'}</span>
                  </button>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('diligence_locker')}
                      className="p-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-all cursor-pointer"
                      title="View Diligence Locker"
                    >
                      <FolderLock className="w-4 h-4" />
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
