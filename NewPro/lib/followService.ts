'use client';

import { getUserProfile } from './userProfile';

export const FOLLOWS_UPDATED_EVENT = 'xentro-follows-updated';

export interface FollowUserSummary {
  id: string;
  name: string;
  role: string;
  avatar: string;
  company?: string;
}

export interface FollowStats {
  targetUserId: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  followers: FollowUserSummary[];
  following: FollowUserSummary[];
}

const STORAGE_KEY_FOLLOWS = 'xentro_user_follows_state';

class FollowService {
  private localState: Record<string, { isFollowing: boolean; followersCount: number; followingCount: number }> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_FOLLOWS);
        if (stored) {
          this.localState = JSON.parse(stored);
        }
      } catch (_) {}
    }
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_FOLLOWS, JSON.stringify(this.localState));
      } catch (_) {}
    }
  }

  public isFollowing(targetUserId: string): boolean {
    return Boolean(this.localState[targetUserId]?.isFollowing);
  }

  public async getFollowStats(userId: string): Promise<FollowStats> {
    const currentProfile = getUserProfile();
    const currentUserId = currentProfile?.id || '';

    try {
      const res = await fetch(`/api/follows?userId=${encodeURIComponent(userId)}&currentUserId=${encodeURIComponent(currentUserId)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const stats: FollowStats = {
            targetUserId: userId,
            followersCount: data.followersCount ?? 0,
            followingCount: data.followingCount ?? 0,
            isFollowing: Boolean(data.isFollowing),
            followers: data.followers || [],
            following: data.following || [],
          };

          this.localState[userId] = {
            isFollowing: stats.isFollowing,
            followersCount: stats.followersCount,
            followingCount: stats.followingCount,
          };
          this.saveState();

          return stats;
        }
      }
    } catch (err) {
      console.warn('Failed to load follow stats from backend:', err);
    }

    // Fallback to local state
    const cached = this.localState[userId] || { isFollowing: false, followersCount: 0, followingCount: 0 };
    return {
      targetUserId: userId,
      followersCount: cached.followersCount,
      followingCount: cached.followingCount,
      isFollowing: cached.isFollowing,
      followers: [],
      following: [],
    };
  }

  public async toggleFollow(targetUserId: string, targetUserData?: any): Promise<{
    following: boolean;
    followersCount: number;
    followingCount: number;
  }> {
    const currentProfile = getUserProfile();
    const currentUserId = currentProfile?.id || 'XU-834524';

    // Optimistic update
    const currentStatus = this.isFollowing(targetUserId);
    const nextStatus = !currentStatus;
    const currentCount = this.localState[targetUserId]?.followersCount ?? 0;
    const nextCount = nextStatus ? currentCount + 1 : Math.max(0, currentCount - 1);

    this.localState[targetUserId] = {
      isFollowing: nextStatus,
      followersCount: nextCount,
      followingCount: this.localState[targetUserId]?.followingCount ?? 0,
    };
    this.saveState();

    let serverFollowing = nextStatus;
    let serverFollowersCount = nextCount;
    let serverFollowingCount = 0;

    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          currentUserId,
          followerId: currentUserId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          serverFollowing = data.following;
          serverFollowersCount = data.followersCount ?? nextCount;
          serverFollowingCount = data.followingCount ?? 0;

          this.localState[targetUserId] = {
            isFollowing: serverFollowing,
            followersCount: serverFollowersCount,
            followingCount: serverFollowingCount,
          };
          this.saveState();
        }
      }
    } catch (err) {
      console.warn('Failed to toggle follow on backend:', err);
    }

    // Broadcast update across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(FOLLOWS_UPDATED_EVENT, {
          detail: {
            targetUserId,
            following: serverFollowing,
            followersCount: serverFollowersCount,
            followingCount: serverFollowingCount,
            targetUserData,
          },
        })
      );
    }

    return {
      following: serverFollowing,
      followersCount: serverFollowersCount,
      followingCount: serverFollowingCount,
    };
  }
}

export const followService = new FollowService();
