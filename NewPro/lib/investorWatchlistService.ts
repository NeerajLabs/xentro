'use client';

import { investorOrganizationService } from './investorOrganizationService';
import { getUserProfile } from './userProfile';
import { entityContextService } from './entityContextService';

export interface WatchlistStartup {
  startupId: string;
  name: string;
  logo?: string;
  tagline?: string;
  founder?: string;
  location?: string;
  sector?: string;
  stage?: string;
  askingRound?: string;
  valuation?: string;
  tractionMRR?: string;
  matchScore?: number;
  tags?: string[];
  addedAt: string;
  addedByUserId?: string;
}

export interface WatchlistStatus {
  ownerType: 'personal' | 'organization';
  ownerId: string;
  capacityLimit: number;
  activeCount: number;
  remainingSlots: number;
  isAtCapacity: boolean;
  startups: WatchlistStartup[];
  lastSyncedAt?: string;
  isOfflineFallback?: boolean;
}

const PERSONAL_CACHE_KEY = 'xentro_investor_watchlist_personal_cache';
const ORG_CACHE_KEY_PREFIX = 'xentro_investor_watchlist_org_cache_';
export const WATCHLIST_CHANGED_EVENT = 'xentro-investor-watchlist-changed';

export function getWatchlistContext(): {
  ownerType: 'personal' | 'organization';
  ownerId: string;
  capacityLimit: number;
} {
  const isOrg = investorOrganizationService.isOrganizationContext();
  if (isOrg) {
    const org = investorOrganizationService.getActiveOrganization();
    return {
      ownerType: 'organization',
      ownerId: org?.id || 'org_active',
      capacityLimit: 30,
    };
  }

  const profile = getUserProfile();
  return {
    ownerType: 'personal',
    ownerId: profile?.id || 'inv_personal',
    capacityLimit: 10,
  };
}

function getCacheKey(ownerType: 'personal' | 'organization', ownerId: string): string {
  return ownerType === 'organization' ? `${ORG_CACHE_KEY_PREFIX}${ownerId}` : PERSONAL_CACHE_KEY;
}

export function getCachedWatchlist(): WatchlistStatus {
  const ctx = getWatchlistContext();
  if (typeof window === 'undefined') {
    return {
      ...ctx,
      activeCount: 0,
      remainingSlots: ctx.capacityLimit,
      isAtCapacity: false,
      startups: [],
    };
  }

  try {
    const raw = localStorage.getItem(getCacheKey(ctx.ownerType, ctx.ownerId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return {
          ...ctx,
          activeCount: parsed.length,
          remainingSlots: Math.max(0, ctx.capacityLimit - parsed.length),
          isAtCapacity: parsed.length >= ctx.capacityLimit,
          startups: parsed,
          isOfflineFallback: true,
        };
      }
    }
  } catch {}

  return {
    ...ctx,
    activeCount: 0,
    remainingSlots: ctx.capacityLimit,
    isAtCapacity: false,
    startups: [],
  };
}

export async function fetchAuthoritativeWatchlist(): Promise<{
  success: boolean;
  data: WatchlistStatus;
  message?: string;
}> {
  const ctx = getWatchlistContext();
  try {
    const headers = entityContextService.getAuthHeaders();
    const res = await fetch(`/api/investor/watchlist?ownerType=${ctx.ownerType}&ownerId=${encodeURIComponent(ctx.ownerId)}`, {
      headers,
    });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      const data: WatchlistStatus = {
        ownerType: json.data.ownerType,
        ownerId: json.data.ownerId,
        capacityLimit: json.data.capacityLimit,
        activeCount: json.data.activeCount,
        remainingSlots: json.data.remainingSlots,
        isAtCapacity: json.data.isAtCapacity,
        startups: json.data.startups || [],
        lastSyncedAt: new Date().toISOString(),
        isOfflineFallback: false,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(getCacheKey(ctx.ownerType, ctx.ownerId), JSON.stringify(data.startups));
        window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT, { detail: data }));
      }

      return { success: true, data };
    }

    return {
      success: false,
      data: getCachedWatchlist(),
      message: json.message || 'Failed to fetch watchlist from server',
    };
  } catch (err: any) {
    return {
      success: false,
      data: getCachedWatchlist(),
      message: err.message || 'Network error fetching authoritative watchlist',
    };
  }
}

export async function addStartupToWatchlist(startup: {
  id?: string;
  startupId?: string;
  name: string;
  logo?: string;
  tagline?: string;
  description?: string;
  founder?: any;
  location?: string;
  sector?: string;
  stage?: string;
  askingRound?: string;
  valuation?: string;
  tractionMRR?: string;
  matchScore?: number;
  tags?: string[];
}): Promise<{
  success: boolean;
  message: string;
  data?: WatchlistStatus;
  isAtCapacity?: boolean;
}> {
  const ctx = getWatchlistContext();
  const sid = startup.startupId || startup.id;
  if (!sid) {
    return { success: false, message: 'Startup ID is missing.' };
  }

  const founderStr =
    typeof startup.founder === 'string'
      ? startup.founder
      : startup.founder?.name || 'Founding Team';

  try {
    const headers = entityContextService.getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const res = await fetch('/api/investor/watchlist', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'ADD',
        ownerType: ctx.ownerType,
        ownerId: ctx.ownerId,
        startup: {
          startupId: sid,
          name: startup.name,
          logo: startup.logo,
          tagline: startup.tagline || startup.description,
          founder: founderStr,
          location: startup.location,
          sector: startup.sector,
          stage: startup.stage,
          askingRound: startup.askingRound,
          valuation: startup.valuation,
          tractionMRR: startup.tractionMRR,
          matchScore: startup.matchScore,
          tags: startup.tags,
        },
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        message: json.message || 'Could not save startup to Watchlist.',
        isAtCapacity: json.isAtCapacity || false,
      };
    }

    const updatedData: WatchlistStatus = {
      ownerType: json.data.ownerType,
      ownerId: json.data.ownerId,
      capacityLimit: json.data.capacityLimit,
      activeCount: json.data.activeCount,
      remainingSlots: json.data.remainingSlots,
      isAtCapacity: json.data.isAtCapacity,
      startups: json.data.startups,
      lastSyncedAt: new Date().toISOString(),
      isOfflineFallback: false,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(getCacheKey(ctx.ownerType, ctx.ownerId), JSON.stringify(updatedData.startups));
      window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT, { detail: updatedData }));
    }

    return {
      success: true,
      message: json.message,
      data: updatedData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error adding startup to watchlist.',
    };
  }
}

export async function removeStartupFromWatchlist(startupId: string): Promise<{
  success: boolean;
  message: string;
  data?: WatchlistStatus;
}> {
  const ctx = getWatchlistContext();

  try {
    const headers = entityContextService.getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const res = await fetch('/api/investor/watchlist', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'REMOVE',
        ownerType: ctx.ownerType,
        ownerId: ctx.ownerId,
        startupId,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        message: json.message || 'Could not remove startup from Watchlist.',
      };
    }

    const updatedData: WatchlistStatus = {
      ownerType: json.data.ownerType,
      ownerId: json.data.ownerId,
      capacityLimit: json.data.capacityLimit,
      activeCount: json.data.activeCount,
      remainingSlots: json.data.remainingSlots,
      isAtCapacity: json.data.isAtCapacity,
      startups: json.data.startups,
      lastSyncedAt: new Date().toISOString(),
      isOfflineFallback: false,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(getCacheKey(ctx.ownerType, ctx.ownerId), JSON.stringify(updatedData.startups));
      window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT, { detail: updatedData }));
    }

    return {
      success: true,
      message: json.message,
      data: updatedData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error removing startup from watchlist.',
    };
  }
}

export async function reconcileLocalWatchlistWithServer(startups?: WatchlistStartup[]): Promise<{
  success: boolean;
  message: string;
  data?: WatchlistStatus;
}> {
  const ctx = getWatchlistContext();
  const items = startups || getCachedWatchlist().startups;

  try {
    const headers = entityContextService.getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const res = await fetch('/api/investor/watchlist', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'RECONCILE',
        ownerType: ctx.ownerType,
        ownerId: ctx.ownerId,
        startups: items,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        message: json.message || 'Could not reconcile Watchlist with server.',
      };
    }

    const updatedData: WatchlistStatus = {
      ownerType: json.data.ownerType,
      ownerId: json.data.ownerId,
      capacityLimit: json.data.capacityLimit,
      activeCount: json.data.activeCount,
      remainingSlots: json.data.remainingSlots,
      isAtCapacity: json.data.isAtCapacity,
      startups: json.data.startups,
      lastSyncedAt: new Date().toISOString(),
      isOfflineFallback: false,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(getCacheKey(ctx.ownerType, ctx.ownerId), JSON.stringify(updatedData.startups));
      window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED_EVENT, { detail: updatedData }));
    }

    return {
      success: true,
      message: json.message,
      data: updatedData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error reconciling watchlist.',
    };
  }
}

export function isStartupInWatchlist(startupId: string): boolean {
  const cached = getCachedWatchlist();
  return cached.startups.some((s) => s.startupId === startupId);
}
