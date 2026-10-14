/**
 * XENTRO V1 — Tab-Scoped Entity Context Service & Multi-Entity Switcher
 *
 * Implements strict tab-scoped isolation for:
 * 1. PERSONAL (persists across sessions)
 * 2. ENTITY_MASTER (tab-scoped: dies when browser tab closes, survives page refresh)
 * 3. ENTITY_WORKSPACE (tab-scoped: dies when browser tab closes, survives page refresh)
 *
 * Preserves full multi-entity linked workspaces, backend authorization checks,
 * and persona switching capabilities.
 */

export type AuthContextType = 'PERSONAL' | 'ENTITY_MASTER' | 'ENTITY_WORKSPACE';

export interface TabEntityContext {
  contextType: AuthContextType;
  token: string | null;
  sessionId: string | null;
  entityId: string | null;
  entityData: any | null;
  isHead: boolean;
}

export interface LinkedEntity {
  id: string;
  name: string;
  entityType: 'startup' | 'esp' | 'investor_org' | 'institution' | string;
  accountType?: string;
  sector?: string;
  stage?: string;
  membershipStatus?: string;
  role?: string;
  logo?: string | null;
  banner?: string | null;
  pitch?: string;
  website?: string;
  primaryOwnerName?: string;
  primaryOwnerId?: string;
  officialEmail?: string;
  verificationStatus?: string;
  activationStatus?: string;
  permissions?: string[];
  dashboardUrl?: string;
  profileUrl?: string;
  createdAt?: string;
  details?: Record<string, any>;
  [key: string]: any;
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

const TAB_CONTEXT_KEY = 'xentro_tab_entity_context';
const TAB_TOKEN_KEY = 'xentro_tab_entity_token';
const TAB_SESSION_ID_KEY = 'xentro_tab_entity_session_id';
const TAB_ENTITY_ID_KEY = 'xentro_tab_entity_id';
const TAB_ENTITY_DATA_KEY = 'xentro_tab_entity_data';

const ENTITIES_KEY = 'xentro_user_linked_entities';
const ACTIVE_ENTITY_KEY = 'xentro_active_entity_id';

// In-memory fallback for SSR / test environments
const memoryTabStore: Record<string, string> = {};

function getTabItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return memoryTabStore[key] || null;
    }
  }
  return memoryTabStore[key] || null;
}

function setTabItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  }
  memoryTabStore[key] = value;
}

function removeTabItem(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
  delete memoryTabStore[key];
}

class EntityContextService {
  /**
   * Reads current tab's active authentication context.
   */
  getTabContext(): TabEntityContext {
    const rawContext = getTabItem(TAB_CONTEXT_KEY);
    const token = getTabItem(TAB_TOKEN_KEY);
    const sessionId = getTabItem(TAB_SESSION_ID_KEY);
    const entityId = getTabItem(TAB_ENTITY_ID_KEY);
    const rawData = getTabItem(TAB_ENTITY_DATA_KEY);

    let entityData: any = null;
    if (rawData) {
      try {
        entityData = JSON.parse(rawData);
      } catch {}
    }

    if (rawContext === 'ENTITY_MASTER' && token && sessionId) {
      return {
        contextType: 'ENTITY_MASTER',
        token,
        sessionId,
        entityId,
        entityData,
        isHead: true,
      };
    }

    if (rawContext === 'ENTITY_WORKSPACE' && token && sessionId) {
      return {
        contextType: 'ENTITY_WORKSPACE',
        token,
        sessionId,
        entityId,
        entityData,
        isHead: false,
      };
    }

    return {
      contextType: 'PERSONAL',
      token: null,
      sessionId: null,
      entityId: null,
      entityData: null,
      isHead: false,
    };
  }

  /**
   * Establishes ENTITY_MASTER session in active tab (sessionStorage).
   */
  setMasterContext(token: string, sessionId: string, entity: any): void {
    setTabItem(TAB_CONTEXT_KEY, 'ENTITY_MASTER');
    setTabItem(TAB_TOKEN_KEY, token);
    setTabItem(TAB_SESSION_ID_KEY, sessionId);
    setTabItem(TAB_ENTITY_ID_KEY, entity.id);
    setTabItem(TAB_ENTITY_DATA_KEY, JSON.stringify(entity));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xentro-tab-context-changed', {
          detail: { contextType: 'ENTITY_MASTER', entityId: entity.id, sessionId },
        })
      );
      window.dispatchEvent(
        new CustomEvent(ENTITY_CONTEXT_CHANGED_EVENT, {
          detail: { entityId: entity.id, entity },
        })
      );
    }
  }

  /**
   * Establishes ENTITY_WORKSPACE session in active tab (sessionStorage).
   */
  setWorkspaceContext(token: string, sessionId: string, entity: any): void {
    setTabItem(TAB_CONTEXT_KEY, 'ENTITY_WORKSPACE');
    setTabItem(TAB_TOKEN_KEY, token);
    setTabItem(TAB_SESSION_ID_KEY, sessionId);
    setTabItem(TAB_ENTITY_ID_KEY, entity.id);
    setTabItem(TAB_ENTITY_DATA_KEY, JSON.stringify(entity));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xentro-tab-context-changed', {
          detail: { contextType: 'ENTITY_WORKSPACE', entityId: entity.id, sessionId },
        })
      );
      window.dispatchEvent(
        new CustomEvent(ENTITY_CONTEXT_CHANGED_EVENT, {
          detail: { entityId: entity.id, entity },
        })
      );
    }
  }

  /**
   * Clears tab-scoped entity context, reverting tab to PERSONAL context.
   */
  clearTabContext(): void {
    removeTabItem(TAB_CONTEXT_KEY);
    removeTabItem(TAB_TOKEN_KEY);
    removeTabItem(TAB_SESSION_ID_KEY);
    removeTabItem(TAB_ENTITY_ID_KEY);
    removeTabItem(TAB_ENTITY_DATA_KEY);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xentro-tab-context-changed', {
          detail: { contextType: 'PERSONAL' },
        })
      );
      window.dispatchEvent(
        new CustomEvent(ENTITY_CONTEXT_CHANGED_EVENT, {
          detail: { entityId: null, entity: null },
        })
      );
    }
  }

  isEntityMaster(): boolean {
    return this.getTabContext().contextType === 'ENTITY_MASTER';
  }

  isEntityWorkspace(): boolean {
    return this.getTabContext().contextType === 'ENTITY_WORKSPACE';
  }

  isPersonal(): boolean {
    return this.getTabContext().contextType === 'PERSONAL';
  }

  /**
   * Attaches the correct tab-scoped authorization header.
   */
  getAuthHeaders(baseHeaders: Record<string, string> = {}): Record<string, string> {
    const tab = this.getTabContext();
    const headers = { ...baseHeaders };

    if (tab.token) {
      headers['Authorization'] = `Bearer ${tab.token}`;
      headers['X-Xentro-Context'] = tab.contextType;
      if (tab.entityId) headers['X-Entity-Id'] = tab.entityId;
      if (tab.sessionId) headers['X-Session-Id'] = tab.sessionId;
      return headers;
    }

    if (typeof window !== 'undefined') {
      const personalToken =
        localStorage.getItem('xentro_access_token') ||
        sessionStorage.getItem('xentro_access_token') ||
        sessionStorage.getItem('xentro_tab_entity_token') ||
        localStorage.getItem('xentro_token');
      if (personalToken) {
        headers['Authorization'] = `Bearer ${personalToken}`;
        headers['X-Xentro-Context'] = 'PERSONAL';
      }
    }

    return headers;
  }

  getLinkedEntities(): LinkedEntity[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ENTITIES_KEY);
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
      localStorage.setItem(ENTITIES_KEY, JSON.stringify(entities));
      window.dispatchEvent(
        new CustomEvent('xentro-linked-entities-updated', { detail: { entities } })
      );
    } catch (err) {
      console.error('[EntityContextService] Failed to save linked entities:', err);
    }
  }

  getActiveEntityId(): string | null {
    const tab = this.getTabContext();
    if (tab.entityId) return tab.entityId;

    if (typeof window === 'undefined') return null;
    try {
      const id = localStorage.getItem(ACTIVE_ENTITY_KEY);
      return id && id.trim() ? id.trim() : null;
    } catch {
      return null;
    }
  }

  getActiveEntity(): LinkedEntity | null {
    const tab = this.getTabContext();
    if (tab.entityData) {
      return tab.entityData as LinkedEntity;
    }

    const activeId = this.getActiveEntityId();
    if (!activeId) return null;
    const all = this.getLinkedEntities();
    return all.find((e) => e.id === activeId) || null;
  }

  setActiveEntityId(entityId: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (entityId && entityId.trim()) {
        localStorage.setItem(ACTIVE_ENTITY_KEY, entityId.trim());
      } else {
        localStorage.removeItem(ACTIVE_ENTITY_KEY);
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
   * Authoritatively fetch eligible entity memberships from MongoDB backend.
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
        headers: this.getAuthHeaders({ 'X-User-Id': userId }),
        credentials: 'include',
      });
      if (!res.ok) {
        return {
          personalAccount: null,
          eligibleEntities: this.getLinkedEntities(),
        };
      }

      const body = await res.json();
      if (body?.success && body?.data) {
        const serverEntities: LinkedEntity[] = (body.data.eligibleEntities || []).map((e: any) => ({
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

        const localEntities = this.getLinkedEntities();
        const entityMap = new Map<string, LinkedEntity>();

        localEntities.forEach((le) => {
          if (le && le.id) entityMap.set(le.id, le);
        });

        serverEntities.forEach((se) => {
          if (se && se.id) {
            const existing = entityMap.get(se.id);
            entityMap.set(se.id, { ...existing, ...se });
          }
        });

        const mergedEntities = Array.from(entityMap.values());
        this.saveLinkedEntities(mergedEntities);

        const activeId = this.getActiveEntityId();
        if (activeId && !mergedEntities.some((e) => e.id === activeId)) {
          this.setActiveEntityId(null);
        }

        return {
          personalAccount: body.data.personalAccount || null,
          eligibleEntities: mergedEntities,
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

  /**
   * Execute backend verified persona switch.
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
        headers: this.getAuthHeaders({
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        }),
        credentials: 'include',
        body: JSON.stringify({
          userId,
          targetContext: targetEntityId ? 'ENTITY_WORKSPACE' : 'PERSONAL',
          targetEntityId,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || 'Persona switch rejected by authorization policy.');
      }

      if (targetEntityId && body.data) {
        if (body.data.token && body.data.sessionId) {
          this.setWorkspaceContext(body.data.token, body.data.sessionId, body.data.entity);
        }
        this.setActiveEntityId(targetEntityId);
        const entity = this.getActiveEntity();
        return {
          success: true,
          destinationTab: 'dashboard',
          message: body.message,
          entity,
        };
      } else {
        this.clearTabContext();
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

  clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACTIVE_ENTITY_KEY);
      localStorage.removeItem(ENTITIES_KEY);
      this.clearTabContext();
      window.dispatchEvent(
        new CustomEvent(ENTITY_CONTEXT_CHANGED_EVENT, {
          detail: { entityId: null, entity: null },
        })
      );
    } catch (err) {
      console.error('[EntityContextService] Failed to clear session:', err);
    }
  }

  async exitWorkspaceToPersonal(): Promise<boolean> {
    const tab = this.getTabContext();
    try {
      if (tab.sessionId) {
        await fetch('/api/auth/workspaces/exit', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ sessionId: tab.sessionId }),
        });
      }
    } catch (err) {
      console.warn('Server workspace exit notification failed:', err);
    } finally {
      this.clearTabContext();
    }
    return true;
  }

  async logoutMaster(): Promise<boolean> {
    const tab = this.getTabContext();
    try {
      if (tab.sessionId) {
        await fetch('/api/auth/entity/logout', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ sessionId: tab.sessionId }),
        });
      }
    } catch (err) {
      console.warn('Server master logout notification failed:', err);
    } finally {
      this.clearTabContext();
    }
    return true;
  }
}

export const entityContextService = new EntityContextService();
