'use client';

export interface BookmarkedStartup {
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
  bookmarkedAt: string;
}

const STORAGE_KEY = 'xentro_investor_bookmarked_startups_v1';

export const initialBookmarkedStartups: BookmarkedStartup[] = [];

export function getBookmarkedStartups(): BookmarkedStartup[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.some((b: BookmarkedStartup) => b.id === 'st_1' || b.name === 'Kinetix AI' || b.founder === 'Vikram Malhotra')) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isStartupBookmarked(startupId: string): boolean {
  const bookmarks = getBookmarkedStartups();
  return bookmarks.some((b) => b.id === startupId);
}

export function toggleStartupBookmark(startup: {
  id: string;
  name: string;
  logo?: string;
  tagline?: string;
  description?: string;
  founder?: string | { name: string };
  location?: string;
  sector?: string;
  industry?: string;
  stage?: string;
  askingRound?: string;
  fundingRaised?: string;
  valuation?: string;
  tractionMRR?: string;
  metrics?: string;
  matchScore?: number;
  matchReason?: string;
  verified?: boolean;
  tags?: string[];
}): { isBookmarked: boolean; count: number } {
  const bookmarks = getBookmarkedStartups();
  const existsIndex = bookmarks.findIndex((b) => b.id === startup.id);

  let updated: BookmarkedStartup[];
  let isBookmarked: boolean;

  if (existsIndex >= 0) {
    updated = bookmarks.filter((b) => b.id !== startup.id);
    isBookmarked = false;
  } else {
    const founderName =
      typeof startup.founder === 'string'
        ? startup.founder
        : startup.founder?.name || 'Founding Team';

    const newBookmark: BookmarkedStartup = {
      id: startup.id,
      name: startup.name,
      logo:
        startup.logo ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      tagline: startup.tagline || startup.description || 'Pioneering venture on Xentro.',
      founder: founderName,
      location: startup.location || 'India',
      sector: startup.sector || startup.industry || 'Technology',
      stage: startup.stage || 'Seed',
      askingRound: startup.askingRound || startup.fundingRaised || '$1M',
      valuation: startup.valuation || '$8M',
      tractionMRR: startup.tractionMRR || startup.metrics || '$25k MRR',
      matchScore: startup.matchScore || 88,
      matchReason: startup.matchReason || 'Curated from Universal Ecosystem discovery.',
      verified: startup.verified ?? true,
      tags: startup.tags || ['DeepTech', 'Growth'],
      bookmarkedAt: new Date().toISOString().split('T')[0],
    };

    updated = [newBookmark, ...bookmarks];
    isBookmarked = true;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-bookmarks-changed', {
        detail: { bookmarks: updated, startupId: startup.id, isBookmarked },
      })
    );
  }

  return { isBookmarked, count: updated.length };
}
