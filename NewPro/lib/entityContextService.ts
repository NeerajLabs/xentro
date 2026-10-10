'use client';

export interface LinkedEntity {
  id: string;
  name: string;
  entityType: 'STARTUP' | 'INVESTOR_ORG' | 'ESP' | 'INSTITUTION';
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
  createdAt?: string;
  details?: Record<string, any>;
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

  async fetchLinkedEntities(userId: string): Promise<LinkedEntity[]> {
    if (!userId || typeof window === 'undefined') return this.getLinkedEntities();
    try {
      const res = await fetch(`/api/entities?userId=${encodeURIComponent(userId)}`, { credentials: 'omit' });
      if (!res.ok) return this.getLinkedEntities();
      const body = await res.json();
      if (body?.success && Array.isArray(body?.data?.entities)) {
        const remoteEntities: LinkedEntity[] = body.data.entities.map((e: any) => ({
          id: e.id,
          name: e.name,
          entityType: e.entityType || 'STARTUP',
          accountType: e.accountType || (e.entityType === 'INVESTOR_ORG' ? 'Investor Organization' : 'Startup'),
          username: e.username,
          sector: e.details?.sector || e.industry || '',
          stage: e.details?.stage || e.stage || '',
          pitch: e.details?.pitch || e.description || '',
          website: e.details?.website || e.website || '',
          officialEmail: e.officialEmail,
          primaryOwnerId: e.primaryOwnerId,
          primaryOwnerName: e.primaryOwnerName,
          verificationStatus: e.verificationStatus || 'PENDING',
          activationStatus: e.activationStatus || 'ACTIVE',
          createdAt: e.createdAt,
          details: e.details,
        }));

        // Merge existing local entities to not lose recently added items
        const current = this.getLinkedEntities();
        const mergedMap = new Map<string, LinkedEntity>();
        current.forEach((item) => mergedMap.set(item.id, item));
        remoteEntities.forEach((item) => mergedMap.set(item.id, item));

        const mergedList = Array.from(mergedMap.values());
        this.saveLinkedEntities(mergedList);
        return mergedList;
      }
      return this.getLinkedEntities();
    } catch (err) {
      console.warn('[EntityContextService] Failed to fetch remote entities:', err);
      return this.getLinkedEntities();
    }
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
