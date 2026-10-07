'use client';

import React from 'react';
import { Rocket, GraduationCap, TrendingUp, Grid2X2, Compass, RotateCcw } from 'lucide-react';
import { UserRole } from '@/lib/userProfile';
import { isDevToolsEnabled, resetHubData, buildDevQuickProfile } from '@/lib/devTools';
import { saveUserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

interface DevQuickAccessProps {
  onProfileChanged?: () => void;
}

const QUICK_ROLES: Array<{ role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { role: 'startup', label: 'Test as Startup', icon: Rocket },
  { role: 'mentor', label: 'Test as Mentor', icon: GraduationCap },
  { role: 'investor', label: 'Test as Investor', icon: TrendingUp },
  { role: 'esp', label: 'Test as ESP', icon: Grid2X2 },
  { role: 'explorer', label: 'Test as Explorer', icon: Compass },
];

/**
 * Dev-only quick access bar: one-click role test logins + a hub data reset.
 * Rendered only when dev tools are enabled (`?dev=1` or env flag).
 */
export const DevQuickAccess: React.FC<DevQuickAccessProps> = ({ onProfileChanged }) => {
  const { showToast } = useToast();
  if (!isDevToolsEnabled()) return null;

  const handleQuickLogin = (role: UserRole) => {
    try {
      const shell = buildDevQuickProfile(role) as Record<string, string>;
      const profile = {
        id: String(shell.id),
        name: String(shell.name),
        email: '',
        role,
        roleTitle: role === 'explorer' ? 'Ecosystem Explorer' : '',
        organization: role === 'explorer' ? 'Xentro Ecosystem' : '',
        sector: '',
        stageOrFocus: role === 'explorer' ? 'Exploring' : '',
        avatar: '/xentro-logo.png',
        location: '',
        isGuest: role === 'explorer',
        joinedAt: String(shell.joinedAt),
      };
      saveUserProfile(profile as never);
      showToast(`Dev quick login as ${role.toUpperCase()} (${profile.name})`, 'success');
      if (onProfileChanged) onProfileChanged();
    } catch {
      showToast('Dev quick login failed', 'error');
    }
  };

  return (
    <div className="w-full p-3 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/10 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-[#101212] dark:text-white uppercase tracking-wider">
        Dev quick access
      </span>
      {QUICK_ROLES.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.role}
            type="button"
            onClick={() => handleQuickLogin(item.role)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#101212] dark:hover:border-white"
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => {
          resetHubData();
          showToast('Hub demo data cleared. Reload to see empty states.', 'info');
          if (onProfileChanged) onProfileChanged();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/40"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset hub data</span>
      </button>
    </div>
  );
};
