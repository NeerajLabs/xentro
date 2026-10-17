'use client';

export interface MilestoneItem {
  id: string;
  startupEntityId: string;
  title: string;
  category: 'company' | 'product' | 'market' | 'funding';
  status: 'not_started' | 'in_progress' | 'completed';
  targetDate?: string;
  completedDate?: string;
  description?: string;
  ownerRole?: string;
  evidenceUrl?: string;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneCategoryMetrics {
  total: number;
  completed: number;
}

export interface MilestoneMetrics {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  overallProgressPct: number;
  phase: string;
  categories: {
    company: MilestoneCategoryMetrics;
    product: MilestoneCategoryMetrics;
    market: MilestoneCategoryMetrics;
    funding: MilestoneCategoryMetrics;
  };
}

export const MILESTONES_UPDATED_EVENT = 'xentro-milestones-updated';

class StartupMilestoneService {
  private cache: Map<string, { milestones: MilestoneItem[]; metrics: MilestoneMetrics }> = new Map();

  /**
   * Fetches real milestone progress from backend API.
   */
  async fetchMilestones(entityId: string): Promise<{ milestones: MilestoneItem[]; metrics: MilestoneMetrics }> {
    if (!entityId) {
      return this.getEmptyFallback();
    }

    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/milestones`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.warn(`[StartupMilestoneService] HTTP ${res.status} fetching milestones`);
        return this.cache.get(entityId) || this.getEmptyFallback();
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.cache.set(entityId, json.data);
        return json.data;
      }
    } catch (err) {
      console.warn('[StartupMilestoneService] Network error fetching milestones:', err);
    }

    return this.cache.get(entityId) || this.getEmptyFallback();
  }

  /**
   * Adds a new custom milestone.
   */
  async addMilestone(
    entityId: string,
    data: { title: string; category: 'company' | 'product' | 'market' | 'funding'; targetDate?: string; description?: string }
  ): Promise<{ success: boolean; message?: string; data?: MilestoneItem }> {
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        await this.fetchMilestones(entityId);
        window.dispatchEvent(new CustomEvent(MILESTONES_UPDATED_EVENT, { detail: { entityId } }));
        return { success: true, data: json.data };
      }
      return { success: false, message: json.message || 'Failed to add milestone' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error adding milestone' };
    }
  }

  /**
   * Updates milestone status or progress.
   */
  async updateMilestoneStatus(
    entityId: string,
    milestoneId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    evidenceUrl?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, status, evidenceUrl }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        await this.fetchMilestones(entityId);
        window.dispatchEvent(new CustomEvent(MILESTONES_UPDATED_EVENT, { detail: { entityId } }));
        return { success: true };
      }
      return { success: false, message: json.message || 'Failed to update milestone' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error updating milestone' };
    }
  }

  /**
   * Deletes a custom milestone.
   */
  async deleteMilestone(entityId: string, milestoneId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/milestones?milestoneId=${encodeURIComponent(milestoneId)}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (res.ok && json.success) {
        await this.fetchMilestones(entityId);
        window.dispatchEvent(new CustomEvent(MILESTONES_UPDATED_EVENT, { detail: { entityId } }));
        return { success: true };
      }
      return { success: false, message: json.message || 'Failed to delete milestone' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error deleting milestone' };
    }
  }

  private getEmptyFallback(): { milestones: MilestoneItem[]; metrics: MilestoneMetrics } {
    return {
      milestones: [],
      metrics: {
        totalCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        overallProgressPct: 0,
        phase: 'Concept Validation',
        categories: {
          company: { total: 0, completed: 0 },
          product: { total: 0, completed: 0 },
          market: { total: 0, completed: 0 },
          funding: { total: 0, completed: 0 },
        },
      },
    };
  }
}

export const startupMilestoneService = new StartupMilestoneService();
