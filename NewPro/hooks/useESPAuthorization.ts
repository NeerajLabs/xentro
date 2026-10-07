'use client';

import { useState, useEffect, useCallback } from 'react';
import { ESPMemberRole } from '@/types/esp';
import {
  hasPermission,
  checkModuleAuthorization,
  ESP_SYSTEM_ROLES,
  logAuditEvent,
} from '@/lib/espDomainService';

const ACTIVE_ROLE_KEY = 'xentro_esp_simulated_role';

export function useESPAuthorization() {
  const [currentRole, setCurrentRoleState] = useState<ESPMemberRole>('Primary Admin / Owner');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as ESPMemberRole | null;
      if (stored && ESP_SYSTEM_ROLES.includes(stored)) {
        setCurrentRoleState(stored);
      }
    } catch {
      // fallback
    }

    const handleRoleChanged = (e: Event) => {
      const custom = e as CustomEvent<{ role: ESPMemberRole }>;
      if (custom.detail?.role) {
        setCurrentRoleState(custom.detail.role);
      }
    };

    window.addEventListener('xentro-esp-role-changed', handleRoleChanged);
    return () => window.removeEventListener('xentro-esp-role-changed', handleRoleChanged);
  }, []);

  const switchRole = useCallback((role: ESPMemberRole) => {
    setCurrentRoleState(role);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACTIVE_ROLE_KEY, role);
        window.dispatchEvent(new CustomEvent('xentro-esp-role-changed', { detail: { role } }));
        logAuditEvent('Role Switched', 'Roles', 'System Demo Switcher', role, `Switched preview context to ${role}`);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const canAccessModule = useCallback(
    (moduleId: string) => checkModuleAuthorization(currentRole, moduleId),
    [currentRole]
  );

  const checkPermission = useCallback(
    (permissionId: string) => hasPermission(currentRole, permissionId),
    [currentRole]
  );

  return {
    currentRole,
    switchRole,
    availableRoles: ESP_SYSTEM_ROLES,
    canAccessModule,
    hasPermission: checkPermission,
    isPrimaryAdmin: currentRole === 'Primary Admin / Owner',
    canManageBilling: checkPermission('manage_billing'),
    canViewInvoices: checkPermission('view_invoices'),
    canDownloadInvoices: checkPermission('download_invoices'),
    canManageMembers: checkPermission('invite_members') || checkPermission('manage_roles'),
    canEndorse: checkPermission('endorse_startup'),
    canManageSettings: checkPermission('manage_entity_settings'),
  };
}
