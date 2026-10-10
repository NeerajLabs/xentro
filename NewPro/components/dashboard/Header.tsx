'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, Eye, Sun, Moon, LogOut, User as UserIcon, Sparkles, Rocket, TrendingUp, GraduationCap, Grid2X2, RotateCcw, Trash2, LifeBuoy } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile, UserRole, setActiveRole, GUEST_AVATAR, resetDemoData, getUserRegisteredRoles } from '@/lib/userProfile';
import { logoutFromNewPro } from '@/lib/authGuard';
import { isDevToolsEnabled } from '@/lib/devTools';
import { notificationService, NOTIFICATIONS_UPDATED_EVENT, NotificationItem } from '@/lib/notificationService';
import { CONVERSATIONS_UPDATED_EVENT } from '@/lib/messagingService';
import { EntityAccountSwitcher } from './EntityAccountSwitcher';
import {
  entityContextService,
  LinkedEntity,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProfile?: () => void;
  onSelectNotifications?: () => void;
  onSelectMessages?: () => void;
  onSelectSupport?: () => void;
  persona?: string;
  onViewPublicProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSelectProfile,
  onSelectNotifications,
  onSelectMessages,
  onSelectSupport,
  persona = 'startup',
  onViewPublicProfile,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );
  const [isDark, setIsDark] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('xentro_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'xentro_theme') {
          const dark = e.newValue === 'dark';
          setIsDark(dark);
          if (dark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };

      const handleCustomThemeChange = () => {
        const dark = document.documentElement.classList.contains('dark');
        setIsDark(dark);
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('xentro-theme-changed', handleCustomThemeChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('xentro-theme-changed', handleCustomThemeChange);
      };
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('xentro_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('xentro_theme', 'light');
      }
      window.dispatchEvent(new Event('xentro-theme-changed'));
    }
    showToast(nextDark ? '🌙 Dark mode activated' : '☀️ Light mode activated');
  };

  useEffect(() => {
    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.profile) {
        setUserProfile(customEvent.detail.profile);
      } else {
        setUserProfile(getUserProfile());
      }
    };
    const handleEntitySwitch = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveEntity(customEvent.detail?.entity || entityContextService.getActiveEntity());
    };
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    window.addEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    return () => {
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
      window.removeEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications, showUserMenu]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    notificationService.getNotifications()
  );

  const handleClearNotifications = async () => {
    // Instantly wipe from React state in 0ms so UI clears before user eyes
    setNotifications([]);
    showToast('All notifications cleared', 'success');
    try {
      await notificationService.clearAllNotifications();
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  useEffect(() => {
    const refresh = () => setNotifications(notificationService.getNotifications());
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
    window.addEventListener('xentro-role-changed', refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener('xentro-role-changed', refresh);
    };
  }, []);

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-[70px] bg-white/95 dark:bg-[#181B1A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#262A29] px-6 flex items-center justify-between transition-colors">
      {/* Left: Welcome / Brand Greeting */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-semibold text-[#101212] dark:text-white font-heading">
            {userProfile?.name?.trim() ? `Welcome ${userProfile.name.trim()}` : 'Welcome to XENTRO'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D9FF3F] text-[#101212] font-bold shadow-2xs">
            Pro
          </span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-[580px] mx-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-[#565B59] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people, opportunities, posts..."
            className="w-full h-11 pl-11 pr-4 rounded-full bg-[#F3F4F6] dark:bg-[#0D0F0F] text-sm text-[#101212] dark:text-white placeholder-[#565B59] dark:placeholder-[#B6B8B7] border border-transparent focus:border-[#D9FF3F] focus:bg-white dark:focus:bg-[#181B1A] focus:ring-2 focus:ring-[#D9FF3F]/30 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors active:scale-95"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Support & Help Center Button */}
        <button
          onClick={() => {
            if (onSelectSupport) {
              onSelectSupport();
            } else if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('xentro-navigate-tab', { detail: { tab: 'support' } }));
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-[#101212] dark:text-[#D9FF3F] hover:bg-[#D9FF3F]/15 dark:hover:bg-[#D9FF3F]/20 hover:border-emerald-600 dark:hover:border-[#D9FF3F]/50 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer group"
          aria-label="Support & Help Center"
          title="Open Support & Help Center"
        >
          <LifeBuoy className="w-4 h-4 text-emerald-700 dark:text-[#D9FF3F] transition-transform duration-200 group-hover:rotate-12" />
          <span className="hidden sm:inline font-medium">Support</span>
        </button>

        {/* Entity Account & Workspace Switcher */}
        <EntityAccountSwitcher />

        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-[#101212] dark:text-[#D9FF3F] hover:bg-[#D9FF3F]/20 dark:hover:bg-[#D9FF3F]/20 hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F]/50 transition-all duration-200 active:scale-95 shadow-2xs relative flex items-center justify-center group cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D9FF3F] transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-[#565B59] group-hover:text-[#101212] transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full text-[#565B59] hover:text-[#101212] hover:bg-[#F3F4F6] dark:text-[#B6B8B7] dark:hover:text-white dark:hover:bg-[#0D0F0F] transition-all duration-200 active:scale-90 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#181B1A]">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-88 bg-white dark:bg-[#181B1A] rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-4 z-50 animate-fade-slide">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
                <h3 className="font-bold text-sm text-[#101212] dark:text-white font-heading">
                  Notifications {unreadNotifCount > 0 && `(${unreadNotifCount})`}
                </h3>
                <div className="flex items-center gap-2.5">
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={() => {
                        notificationService.markAllAsRead();
                        showToast('All notifications marked as read', 'success');
                      }}
                      className="text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:underline font-medium cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Clear Notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Red line bar for Clear Notifications */}
              {notifications.length > 0 && (
                <div className="mt-2 mb-1 p-1.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-between px-2.5">
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">Remove all alerts</span>
                  <button
                    onClick={handleClearNotifications}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Clear Notifications</span>
                  </button>
                </div>
              )}

              <div className="divide-y divide-gray-100 dark:divide-[#262A29] my-1 max-h-[320px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        notificationService.markAsRead(n.id);
                        setShowNotifications(false);
                        if (n.targetTab === 'messages' && onSelectMessages) {
                          onSelectMessages();
                        } else if (onSelectNotifications) {
                          onSelectNotifications();
                        }
                      }}
                      className="py-3 px-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0D0F0F]/60 rounded-lg transition-colors flex items-start gap-2.5 group"
                    >
                      {n.unread ? (
                        <span className="w-2 h-2 rounded-full bg-[#9EBE12] mt-1.5 flex-shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-transparent mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#101212] dark:text-white group-hover:text-[#9EBE12] transition-colors truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 mt-0.5">
                          {n.description}
                        </p>
                        <span className="text-[10px] text-[#8E9290] mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-[#8E9290]">
                    <Bell className="w-6 h-6 mx-auto mb-2 text-[#8E9290]/40" />
                    <p>No notifications yet.</p>
                    <p className="text-[11px] text-[#8E9290]/70 mt-0.5">
                      Messages and mentorship activity will appear here.
                    </p>
                  </div>
                )}
              </div>

              {onSelectNotifications && (
                <div className="pt-2 mt-1 border-t border-gray-100 dark:border-[#262A29] text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectNotifications();
                    }}
                    className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline w-full py-1 cursor-pointer"
                  >
                    View all activity &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#D9FF3F]/60 transition-all active:scale-95 ml-1 cursor-pointer"
            aria-label="User Account Menu"
            title={`${activeEntity ? activeEntity.name : userProfile.name} (${(activeEntity ? activeEntity.entityType : userProfile.role).toUpperCase()})`}
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#E5E7EB] dark:border-gray-700">
              <img
                src={activeEntity?.logo || userProfile.avatar || GUEST_AVATAR}
                alt={activeEntity ? activeEntity.name : userProfile.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#181B1A] rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-3 z-50 animate-fade-slide">
              {/* Profile Summary Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]/60 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <img
                    src={activeEntity?.logo || userProfile.avatar || GUEST_AVATAR}
                    alt={activeEntity ? activeEntity.name : userProfile.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                      {activeEntity ? activeEntity.name : userProfile.name}
                    </h4>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#D9FF3F] text-[#101212] font-mono">
                      {activeEntity ? activeEntity.entityType : userProfile.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                    {activeEntity ? (activeEntity.role || 'Entity Member') : (userProfile.organization || userProfile.roleTitle)}
                  </p>
                  <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                    {activeEntity?.officialEmail || userProfile.email}
                  </p>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onSelectProfile) onSelectProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer text-left"
                >
                  <UserIcon className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7]" />
                  <span>View / Edit Profile</span>
                </button>

                {/* Dev-only: local hub signup used to overwrite real profiles with demo presets */}
                {isDevToolsEnabled() && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    window.dispatchEvent(new CustomEvent('xentro-open-signup'));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer text-left"
                >
                  <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
                  <span>+ Signup New Role</span>
                </button>
                )}

                {/* Switch Persona: visible ONLY if dev tools enabled (?dev=1) OR user has multiple registered roles */}
                {(isDevToolsEnabled() || getUserRegisteredRoles().length > 1) && (
                  <div className="pt-2 pb-1 border-t border-gray-100 dark:border-[#262A29]">
                    <div className="flex items-center justify-between px-1 mb-1.5">
                      <span className="text-[10px] font-bold text-[#565B59] dark:text-[#7A807D] uppercase tracking-wider font-sora">
                        Switch Persona
                      </span>
                      {isDevToolsEnabled() && (
                        <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded font-mono font-medium">
                          TEST MODE
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { role: 'startup' as UserRole, label: 'Startup', icon: Rocket },
                        { role: 'investor' as UserRole, label: 'Investor', icon: TrendingUp },
                        { role: 'mentor' as UserRole, label: 'Mentor', icon: GraduationCap },
                        { role: 'esp' as UserRole, label: 'ESP', icon: Grid2X2 },
                      ]
                        .filter((item) => isDevToolsEnabled() || getUserRegisteredRoles().includes(item.role))
                        .map((item) => {
                          const isActive = userProfile.role === item.role;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.role}
                              onClick={() => {
                                if (!isActive) {
                                  const newProf = setActiveRole(item.role);
                                  setUserProfile(newProf);
                                  showToast(`Switched active persona to ${item.label}`, 'info');
                                }
                                setShowUserMenu(false);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-2xs'
                                  : 'bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262A29]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="my-1 border-t border-gray-100 dark:border-[#262A29]" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    resetDemoData();
                    setUserProfile(getUserProfile());
                    showToast('Reset local and demo state to clean defaults', 'info');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer text-left"
                >
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <span>Reset Demo / Local State</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logoutFromNewPro();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out / Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
