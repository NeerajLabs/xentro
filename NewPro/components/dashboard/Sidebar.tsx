'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  MessageCircle,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Grid2X2,
  Bell,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  UserCheck,
  Calendar,
  Compass,
  Sparkles,
  Radio,
  User,
  Settings,
  Sun,
  Moon,
  Rocket,
  LayoutDashboard,
  UserPlus,
  Eye,
  LogOut,
  LifeBuoy,
  ShieldCheck,
} from 'lucide-react';
import { logoutFromNewPro } from '@/lib/authGuard';
import { UserProfile, getUserProfile, GUEST_AVATAR } from '@/lib/userProfile';
import { isDevToolsEnabled } from '@/lib/devTools';
import { notificationService, NOTIFICATIONS_UPDATED_EVENT } from '@/lib/notificationService';
import { messagingService, CONVERSATIONS_UPDATED_EVENT } from '@/lib/messagingService';
import { CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import {
  entityContextService,
  LinkedEntity,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: 'blue' | 'red';
  hasDot?: boolean;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenMessages?: () => void;
  persona?: 'startup' | 'mentor';
  onSwitchPersona?: () => void;
  onSignupNewRole?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMessages,
  persona = 'startup',
  onSwitchPersona,
  onSignupNewRole,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isExpanded = isHovered || isPinned;

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    collapseTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const [isDark, setIsDark] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );

  useEffect(() => {
    const handleRoleChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.profile) {
        setProfile(ce.detail.profile);
      } else {
        setProfile(getUserProfile());
      }
    };
    const handleEntitySwitch = (e: Event) => {
      const ce = e as CustomEvent;
      setActiveEntity(ce.detail?.entity || entityContextService.getActiveEntity());
    };
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    window.addEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    return () => {
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
      window.removeEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntitySwitch);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateTheme = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      updateTheme();
      window.addEventListener('storage', updateTheme);
      window.addEventListener('xentro-theme-changed', updateTheme);
      return () => {
        window.removeEventListener('storage', updateTheme);
        window.removeEventListener('xentro-theme-changed', updateTheme);
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
  };

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() =>
    notificationService.getUnreadCount()
  );
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(() =>
    messagingService.getUnreadCount()
  );

  useEffect(() => {
    const refresh = () => {
      setUnreadNotifCount(notificationService.getUnreadCount());
      setUnreadMsgCount(messagingService.getUnreadCount());
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, refresh);
    window.addEventListener('xentro-role-changed', refresh);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, refresh);
      window.removeEventListener('xentro-role-changed', refresh);
    };
  }, []);

  const isExplorer = profile.role === 'explorer';
  const navItems: NavItem[] = [
    ...(isExplorer ? [] : [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]),
    { id: 'feed', label: 'Feed / Role', icon: Home },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      hasDot: unreadMsgCount > 0,
      badge: unreadMsgCount > 0 ? unreadMsgCount : undefined,
    },
    { id: 'opportunity', label: 'Opportunity', icon: Briefcase },
    { id: 'startup', label: 'Startup', icon: Rocket },
    { id: 'mentor', label: 'Mentor', icon: GraduationCap },
    { id: 'investor', label: 'Investor', icon: TrendingUp },
    { id: 'esp', label: 'ESP', icon: Grid2X2 },
    ...(!isExplorer ? [{ id: 'roles', label: 'Accounts & Roles', icon: ShieldCheck }] : []),
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      hasDot: unreadNotifCount > 0,
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
      badgeColor: 'red',
    },
    {
      id: 'support',
      label: 'Support',
      icon: LifeBuoy,
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleMouseEnter}
      onBlurCapture={handleMouseLeave}
      aria-label="Main Navigation"
      className={`fixed top-0 left-0 h-screen z-40 bg-white dark:bg-[#181B1A] flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] gpu-accel will-change-[width] select-none ${
        isExpanded
          ? 'w-[264px] shadow-floating rounded-r-[18px] border-r border-[#E5E7EB] dark:border-[#262A29]'
          : 'w-[60px] border-r-0'
      }`}
    >
      {/* Top Header / Logo (Top) */}
      <div
        className={`h-[70px] flex-shrink-0 flex items-center border-b border-transparent transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          isExpanded ? 'px-[22px]' : 'justify-center'
        }`}
      >
        <div
          className={`flex items-center cursor-pointer group transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            isExpanded ? 'gap-3' : 'justify-center'
          }`}
          onClick={() => onSelectTab('feed')}
          title="XENTRO"
        >
          {/* Official XENTRO Logo Mark (Anchored in front) */}
          <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center relative z-10 transition-transform duration-300 ease-out group-hover:scale-105 shadow-2xs">
            <img
              src="/xentro-logo.png"
              alt="XENTRO Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Animated Name XENTRO - Emerging smoothly from the logo mark */}
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded
                ? 'opacity-100 max-w-[160px] translate-x-0'
                : 'opacity-0 max-w-0 -translate-x-8 pointer-events-none'
            }`}
          >
            <span className="font-sora text-[21px] font-semibold tracking-tight text-[#101212] dark:text-white leading-none block group-hover:text-[#9EBE12] transition-colors">
              xentro
            </span>
            <span className="text-[7.5px] font-bold tracking-wider text-[#565B59] dark:text-[#B6B8B7] uppercase block mt-1">
              CONNECT &bull; CREATE
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List - Exactly in the middle between Logo and My Profile */}
      <div className="flex-1 flex flex-col justify-center my-auto py-1">
        <nav
          className={`space-y-1.5 ${
            isExpanded ? 'px-3' : 'flex flex-col items-center px-0'
          }`}
          role="navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const activeColor = 'text-[#101212] dark:text-white scale-110 font-bold';
            const activeIndicatorBg = 'bg-[#D9FF3F]';
            const hoverColor = 'group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F]';

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center h-11 sm:h-12 rounded-xl transition-all duration-200 relative group text-left hover:scale-105 active:scale-95 ${
                  isExpanded ? 'w-full px-2.5' : 'w-10 justify-center mx-auto'
                } ${
                  isActive
                    ? 'bg-gray-100/90 dark:bg-[#202422] text-[#101212] dark:text-white font-bold shadow-xs'
                    : 'bg-transparent text-[#565B59] hover:bg-gray-100/60 dark:hover:bg-[#202422]/60 hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F]'
                }`}
                title={!isExpanded ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Indicator on Far Left */}
                {isActive && !isExpanded && (
                  <span className={`absolute left-0 top-2 bottom-2 w-1 ${activeIndicatorBg} rounded-r-full`} />
                )}
                {isActive && isExpanded && (
                  <span className={`absolute left-0 top-1.5 bottom-1.5 w-1.5 ${activeIndicatorBg} rounded-r-full`} />
                )}

                {/* Icon wrapper */}
                <div
                  className={`flex items-center justify-center flex-shrink-0 relative ${
                    isExpanded ? 'w-[36px]' : 'w-full h-full'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-all duration-200 ease-out group-hover:scale-115 ${
                      isActive
                        ? activeColor
                        : `text-[#565B59] dark:text-[#B6B8B7] ${hoverColor}`
                    }`}
                  />
                  {/* Dot indicator (Messages) */}
                  {item.hasDot && (
                    <span
                      className={`absolute w-2 h-2 rounded-full ${activeIndicatorBg} ring-2 ring-white dark:ring-[#181B1A] ${
                        isExpanded ? 'top-1.5 right-1.5' : 'top-1.5 right-1.5'
                      }`}
                    />
                  )}
                  {/* Badge for collapsed mode */}
                  {item.badge && !isExpanded && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#181B1A]">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label & Expanded Badges */}
                <div
                  className={`flex items-center justify-between flex-1 pr-1 overflow-hidden transition-all duration-200 whitespace-nowrap ${
                    isExpanded ? 'opacity-100 max-w-[180px] ml-1' : 'opacity-0 max-w-0 pointer-events-none'
                  }`}
                >
                  <span className={`text-[13px] font-medium transition-colors duration-200 ${isActive ? 'text-[#101212] dark:text-white font-bold' : hoverColor}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.hasDot && !item.badge && (
                    <span className={`w-1.5 h-1.5 rounded-full ${activeIndicatorBg}`} />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Controls */}
      <div
        className={`flex-shrink-0 p-3 border-t border-[#E5E7EB] dark:border-[#262A29] space-y-2 ${
          isExpanded ? '' : 'flex flex-col items-center py-2 px-0'
        }`}
      >
        {/* Action 1: + Signup New Role - dev-only (it wrote demo preset data into real profiles) */}
        {isDevToolsEnabled() && (
        <button
          onClick={() => {
            if (onSignupNewRole) {
              onSignupNewRole();
            } else if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('xentro-open-signup'));
            }
          }}
          className={`w-full flex items-center rounded-xl transition-all duration-200 text-left group hover:scale-105 active:scale-95 cursor-pointer ${
            isExpanded ? 'h-11 px-2.5 bg-gray-100/90 dark:bg-[#202422] text-[#101212] dark:text-white' : 'h-11 w-11 justify-center p-0 mx-auto bg-gray-100/90 dark:bg-[#202422] text-[#101212] dark:text-white'
          }`}
          title={!isExpanded ? '+ Signup New Role' : undefined}
          aria-label="Signup New Role"
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 ${
              isExpanded ? 'w-[36px]' : 'w-full'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
              <UserPlus className="w-4 h-4 text-[#101212]" />
            </div>
          </div>
          <div
            className={`flex items-center justify-between flex-1 pr-1 overflow-hidden transition-all duration-200 whitespace-nowrap ${
              isExpanded ? 'opacity-100 max-w-[180px] ml-2' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <span className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
              + Signup New Role
            </span>
          </div>
        </button>
        )}

        {/* Action 2: Personal Profile (Directly Below Navigation) */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`w-full flex items-center rounded-xl transition-all duration-200 text-left group hover:scale-105 active:scale-95 cursor-pointer ${
            isExpanded ? 'h-12 p-1.5' : 'h-11 w-11 justify-center p-0 mx-auto'
          } ${
            activeTab === 'profile'
              ? 'bg-gray-100/90 dark:bg-[#202422] text-[#101212] dark:text-white ring-1 ring-[#D9FF3F]'
              : 'bg-transparent text-[#565B59] hover:bg-gray-100/60 dark:hover:bg-[#202422]/60'
          }`}
          title={!isExpanded ? (isExplorer ? 'Personal Profile' : 'Preview Profile') : undefined}
          aria-label="Profile"
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 ${
              isExpanded ? 'w-[40px]' : 'w-full'
            }`}
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 group-hover:scale-110 group-hover:ring-2 group-hover:ring-[#D9FF3F] ${activeTab === 'profile' ? 'ring-2 ring-[#D9FF3F]' : ''}`}>
              <img
                src={profile.avatar || GUEST_AVATAR}
                alt={profile.name || 'User Profile'}
                className="w-full h-full object-cover object-top transition-transform"
              />
            </div>
          </div>
          <div
            className={`flex items-center justify-between flex-1 pr-1 overflow-hidden transition-all duration-200 whitespace-nowrap ${
              isExpanded ? 'opacity-100 max-w-[180px] ml-2' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#101212] dark:text-white transition-colors duration-200 leading-tight group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] truncate">
                {activeEntity ? activeEntity.name : isExplorer ? 'Personal Profile' : 'Preview Profile'}
              </span>
              <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] transition-colors duration-200 capitalize truncate">
                {activeEntity ? `${activeEntity.entityType} Workspace` : `${profile.role} Identity`}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F]" />
          </div>
        </button>


        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center rounded-xl transition-all duration-200 text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] bg-transparent text-xs font-medium group hover:scale-105 active:scale-95 cursor-pointer ${
            isExpanded ? 'h-10 px-1' : 'h-10 w-12 justify-center p-0 mx-auto'
          }`}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 ${
              isExpanded ? 'w-[48px]' : 'w-full'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#D9FF3F] transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7] group-hover:text-[#101212] transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </div>
          <div
            className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${
              isExpanded ? 'opacity-100 max-w-[160px] ml-2' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <span className="transition-colors duration-200 group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F]">
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </span>
          </div>
        </button>

        {/* Sign Out / Log Out Button */}
        <button
          onClick={logoutFromNewPro}
          className={`w-full flex items-center rounded-xl transition-all duration-200 text-[#565B59] hover:text-red-500 dark:text-[#B6B8B7] dark:hover:text-red-400 bg-transparent text-xs font-medium group hover:scale-105 active:scale-95 cursor-pointer ${
            isExpanded ? 'h-10 px-1' : 'h-10 w-12 justify-center p-0 mx-auto'
          }`}
          aria-label="Sign Out"
          title="Sign Out"
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 ${
              isExpanded ? 'w-[48px]' : 'w-full'
            }`}
          >
            <LogOut className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7] group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
          </div>
          <div
            className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${
              isExpanded ? 'opacity-100 max-w-[160px] ml-2' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <span className="transition-colors duration-200 group-hover:text-red-500 dark:group-hover:text-red-400 font-semibold">
              Sign Out
            </span>
          </div>
        </button>

        {/* Manual Collapse / Pin Toggle Button */}
        <button
          onClick={() => {
            setIsPinned(!isPinned);
            if (isPinned) setIsHovered(false);
          }}
          className={`w-full flex items-center rounded-xl transition-all duration-200 text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F] bg-transparent text-xs font-medium group hover:scale-105 active:scale-95 ${
            isExpanded ? 'h-10 px-1' : 'h-10 w-12 justify-center p-0 mx-auto'
          }`}
          aria-label={isPinned ? 'Unpin Sidebar' : 'Collapse Sidebar'}
          title={isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 ${
              isExpanded ? 'w-[48px]' : 'w-full'
            }`}
          >
            {isPinned ? (
              <PanelLeft className="w-4 h-4 text-[#101212] dark:text-[#D9FF3F] transition-transform duration-200 group-hover:scale-115" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7] group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-all duration-200 group-hover:scale-115" />
            )}
          </div>
          <div
            className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${
              isExpanded ? 'opacity-100 max-w-[160px] ml-2' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <span className="transition-colors duration-200 group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F]">
              {isPinned ? 'Pinned Open' : 'Collapse'}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
