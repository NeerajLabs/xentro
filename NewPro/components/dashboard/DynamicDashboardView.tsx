'use client';

import React, { useState, useEffect } from 'react';
import {
  Rocket,
  GraduationCap,
  TrendingUp,
  Grid2X2,
  Sparkles,
  UserPlus,
  RefreshCw,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { UserRole, UserProfile, getUserProfile, setActiveRole, getActiveRole, getUserRegisteredRoles } from '@/lib/userProfile';
import { isDevToolsEnabled } from '@/lib/devTools';
import { StartupDashboard } from './roles/StartupDashboard';
import { MentorDashboard } from './roles/MentorDashboard';
import { InvestorDashboard } from './roles/InvestorDashboard';
import { ESPDashboard } from './roles/ESPDashboard';
import { ExplorerDashboard } from './roles/ExplorerDashboard';
import { SignupModal } from '@/components/auth/SignupModal';
import { useToast } from '@/components/ui/Toast';

interface DynamicDashboardViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const DynamicDashboardView: React.FC<DynamicDashboardViewProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  useEffect(() => {
    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.profile) {
        setProfile(customEvent.detail.profile);
      } else {
        setProfile(getUserProfile());
      }
    };

    window.addEventListener('xentro-role-changed', handleRoleChanged);
    return () => {
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
    };
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    const newProfile = setActiveRole(role);
    setProfile(newProfile);
    showToast(`Switched active profile to ${role.toUpperCase()} mode: ${newProfile.name}`, 'info');
  };

  const rolePills: Array<{ role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { role: 'startup', label: 'Startup', icon: Rocket },
    { role: 'mentor', label: 'Mentor', icon: GraduationCap },
    { role: 'investor', label: 'Investor', icon: TrendingUp },
    { role: 'esp', label: 'ESP / Incubator', icon: Grid2X2 },
    { role: 'explorer', label: 'Explorer', icon: Compass },
  ];

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-fade-slide">
      {/* 1. Header Banner with Profile Details & Instant Role Switcher */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white tracking-tight">
                Welcome back, {profile.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212] shadow-2xs">
                {profile.role}
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              <span className="font-semibold text-[#101212] dark:text-white">{profile.roleTitle}</span> &bull; {profile.organization} &bull; <span className="text-[#565B59]">{profile.sector}</span>
            </p>
          </div>

          {/* Action to Launch Full Signup / Profile Setup: Dev only */}
          {isDevToolsEnabled() && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setIsSignupOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                title="Create new profile via full onboarding signup"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Signup New Role</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Persona / Role Test Switcher Bar: visible only if ?dev=1 or multi-role registered */}
        {(isDevToolsEnabled() || getUserRegisteredRoles().length > 1) && (
          <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="font-semibold">Dynamic Role Preview:</span>
              {isDevToolsEnabled() && (
                <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1 py-0.2 rounded font-mono font-medium">TEST MODE</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
              {rolePills
                .filter((pill) => isDevToolsEnabled() || getUserRegisteredRoles().includes(pill.role))
                .map((pill) => {
                const Icon = pill.icon;
                const isSelected = profile.role === pill.role;
                return (
                  <button
                    key={pill.role}
                    onClick={() => handleSwitchRole(pill.role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs scale-102'
                        : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Render Corresponding Role Dashboard */}
      <div key={profile.role} className="animate-fade-slide">
        {profile.role === 'startup' && (
          <StartupDashboard profile={profile} onNavigateTab={onNavigateTab} />
        )}
        {profile.role === 'mentor' && (
          <MentorDashboard profile={profile} onNavigateTab={onNavigateTab} />
        )}
        {profile.role === 'investor' && (
          <InvestorDashboard profile={profile} onNavigateTab={onNavigateTab} />
        )}
        {profile.role === 'esp' && (
          <ESPDashboard profile={profile} onNavigateTab={onNavigateTab} />
        )}
        {profile.role === 'explorer' && (
          <ExplorerDashboard profile={profile} onNavigateTab={onNavigateTab} />
        )}
      </div>

      {/* Signup & Onboarding Modal */}
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        initialRole={profile.role}
        onComplete={(newRole) => {
          setProfile(getUserProfile());
        }}
      />
    </div>
  );
};
