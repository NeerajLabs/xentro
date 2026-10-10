'use client';

export interface LinkedEntity {
  id: string;
  name: string;
  entityType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' | string;
  accountType?: string;
  username?: string;
  sector?: string;
  stage?: string;
  pitch?: string;
  website?: string;
  officialEmail?: string;
  primaryOwnerId?: string;
  primaryOwnerName?: string;
  verificationStatus?: string;
  activationStatus?: string;
  membershipStatus?: string;
  role?: string;
  logo?: string | null;
  permissions?: string[];
  dashboardUrl?: string;
  profileUrl?: string;
  createdAt?: string;
  details?: Record<string, any>;
}

export interface PersonalAccountContext {
  userId: string;
  name: string;
  email: string;
  role: 'Explorer' | 'Mentor' | 'Individual Investor';
  destination: 'feed' | 'dashboard';
  avatar?: string | null;
  isPersonal: true;
}

export const ENTITY_CONTEXT_CHANGED_EVENT = 'xentro-entity-switched';

class EntityContextService {
  private readonly ENTITIES_KEY = 'xentro_user_linked_entities';
  private readonly ACTIVE_ENTITY_KEY = 'xentro_active_entity_id';

  getLinkedEntities(): LinkedEntity[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.ENTITIES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveLinkedEntities(entities: LinkedEntity[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.ENTITIES_KEY, JSON.stringify(entities));
      window.dispatchEvent(
        new CustomEvent('xentro-linked-entities-updated', { detail: { entities } })
      );
    } catch (err) {
      console.error('[EntityContextService] Failed to save linked entities:', err);
    }
  }

  /**
   * Authoritatively fetch eligible entity memberships from MongoDB backend.
   * Excludes suspended/revoked memberships and prohibited combinations (e.g. Mentor -> Investor Org).
   */
  async fetchEligibleWorkspaces(userId: string): Promise<{
    personalAccount: PersonalAccountContext | null;
    eligibleEntities: LinkedEntity[];
  }> {
    if (!userId || typeof window === 'undefined') {
      return {
        personalAccount: null,
        eligibleEntities: this.getLinkedEntities(),
      };
    }

    try {
      const res = await fetch(`/api/auth/workspaces?userId=${encodeURIComponent(userId)}`, {
        credentials: 'omit',
      });
      if (!res.ok) {
        return {
          personalAccount: null,
          eligibleEntities: this.getLinkedEntities(),
        };
      }

      const body = await res.json();
      if (body?.success && body?.data) {
        const entities: LinkedEntity[] = (body.data.eligibleEntities || []).map((e: any) => ({
          id: e.entityId,
          name: e.name,
          entityType: e.entityType,
          accountType: e.entityType,
          role: e.role,
          membershipStatus: e.membershipStatus,
          logo: e.logo,
          sector: e.sector,
          stage: e.stage,
          permissions: e.permissions,
          dashboardUrl: e.dashboardUrl,
          profileUrl: e.profileUrl,
        }));

        this.saveLinkedEntities(entities);

        // If the currently active entity is no longer eligible (e.g. revoked), revert to personal account
        const activeId = this.getActiveEntityId();
        if (activeId && !entities.some((e) => e.id === activeId)) {
          this.setActiveEntityId(null);
        }

        return {
          personalAccount: body.data.personalAccount || null,
          eligibleEntities: entities,
        };
      }

      return {
        personalAccount: null,
        eligibleEntities: this.getLinkedEntities(),
      };
    } catch (err) {
      console.warn('[EntityContextService] Failed to fetch authoritative workspaces:', err);
      return {
        personalAccount: null,
        eligibleEntities: this.getLinkedEntities(),
      };
    }
  }

  async fetchLinkedEntities(userId: string): Promise<LinkedEntity[]> {
    const res = await this.fetchEligibleWorkspaces(userId);
    return res.eligibleEntities;
  }


  getActiveEntityId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const id = localStorage.getItem(this.ACTIVE_ENTITY_KEY);
      return id && id.trim() ? id.trim() : null;
    } catch {
      return null;
    }
  }

  getActiveEntity(): LinkedEntity | null {
    const activeId = this.getActiveEntityId();
    if (!activeId) return null;
    const all = this.getLinkedEntities();
    return all.find((e) => e.id === activeId) || null;
  }

  setActiveEntityId(entityId: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (entityId && entityId.trim()) {
        localStorage.setItem(this.ACTIVE_ENTITY_KEY, entityId.trim());
      } else {
        localStorage.removeItem(this.ACTIVE_ENTITY_KEY);
      }
      const activeEntity = this.getActiveEntity();
      window.dispatchEvent(
        new CustomEvent(ENTITY_CONTEXT_CHANGED_EVENT, {
          detail: { entityId, entity: activeEntity },
        })
      );
    } catch (err) {
      console.error('[EntityContextService] Failed to set active entity:', err);
    }
  }

  /**
   * Execute backend verified persona switch.
   * Enforces authoritative RBAC, active membership checks, and mentor-investor isolation.
   */
  async switchPersona(
    userId: string,
    targetEntityId: string | null
  ): Promise<{
    success: boolean;
    destinationTab: 'feed' | 'dashboard' | 'profile';
    message: string;
    entity?: LinkedEntity | null;
  }> {
    try {
      const res = await fetch('/api/auth/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetContext: targetEntityId ? 'ENTITY' : 'PERSONAL',
          targetEntityId,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || 'Persona switch rejected by authorization policy.');
      }

      if (targetEntityId) {
        this.setActiveEntityId(targetEntityId);
        const entity = this.getActiveEntity();
        return {
          success: true,
          destinationTab: 'dashboard',
          message: body.message,
          entity,
        };
      } else {
        this.setActiveEntityId(null);
        const destinationTab = body.data?.destinationTab || 'feed';
        return {
          success: true,
          destinationTab,
          message: body.message,
          entity: null,
        };
      }
    } catch (err: any) {
      console.error('[EntityContextService] Switch persona failed:', err);
      throw err;
    }
  }

  linkEntity(newEntity: LinkedEntity): void {
    const list = this.getLinkedEntities();
    const existingIndex = list.findIndex((e) => e.id === newEntity.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newEntity };
    } else {
      list.push(newEntity);
    }
    this.saveLinkedEntities(list);
    this.setActiveEntityId(newEntity.id);
  }

  unlinkEntity(entityId: string): void {
    const list = this.getLinkedEntities().filter((e) => e.id !== entityId);
    this.saveLinkedEntities(list);
    if (this.getActiveEntityId() === entityId) {
      this.setActiveEntityId(null);
    }
  }
}

export const entityContextService = new EntityContextService();
