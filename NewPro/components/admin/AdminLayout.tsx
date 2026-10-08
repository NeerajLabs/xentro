'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Bell,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  FileCheck,
  LifeBuoy,
  Database,
  Lock,
  User,
  Building,
  MessageSquare,
} from 'lucide-react';
import { AdminSession } from '@/types/admin';
import { clearAdminSession, getAdminSession, createDefaultAdminSession } from '@/lib/adminAuth';

export type AdminTab =
  | 'overview'
  | 'personal-accounts'
  | 'entity-accounts'
  | 'workspaces'
  | 'startups'
  | 'mentors'
  | 'investors'
  | 'esps'
  | 'verification'
  | 'memberships'
  | 'relationships'
  | 'opportunities'
  | 'complaints'
  | 'feed'
  | 'moderation'
  | 'finance'
  | 'documents'
  | 'analytics'
  | 'system'
  | 'users'; // Backwards compatibility alias

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  useEffect(() => {
    const sess = getAdminSession();
    if (!sess) {
      router.replace('/admin/login');
      return;
    }
    setSession(sess);
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateTheme = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      updateTheme();
      window.addEventListener('storage', updateTheme);
      window.addEventListener('xentro-theme-changed', updateTheme);
      const handleSessionChange = (e: any) => {
        if (e.detail) setSession(e.detail);
      };
      window.addEventListener('xentro-admin-session-changed', handleSessionChange);
      return () => {
        window.removeEventListener('storage', updateTheme);
        window.removeEventListener('xentro-theme-changed', updateTheme);
        window.removeEventListener('xentro-admin-session-changed', handleSessionChange);
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

  const handleLogout = () => {
    clearAdminSession();
    router.replace('/admin/login');
  };

  const navSections = [
    {
      group: 'Command Centre',
      items: [
        { id: 'overview' as AdminTab, label: 'Mission Overview', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      group: 'Accounts',
      items: [
        { id: 'personal-accounts' as AdminTab, label: 'Personal Accounts', icon: User, badge: null },
        { id: 'entity-accounts' as AdminTab, label: 'Entity Accounts', icon: Building, badge: null },
        { id: 'workspaces' as AdminTab, label: 'Workspaces', icon: Database, badge: null },
      ],
    },
    {
      group: 'Ecosystem',
      items: [
        { id: 'startups' as AdminTab, label: 'Startups Operations', icon: Users, badge: null },
        { id: 'mentors' as AdminTab, label: 'Mentor Operations', icon: LifeBuoy, badge: null },
        { id: 'investors' as AdminTab, label: 'Investor Operations', icon: Briefcase, badge: null },
        { id: 'esps' as AdminTab, label: 'ESPs & Institutions', icon: FileCheck, badge: null },
      ],
    },
    {
      group: 'Access & Trust',
      items: [
        { id: 'verification' as AdminTab, label: 'Verification Centre', icon: ShieldCheck, badge: null },
        { id: 'memberships' as AdminTab, label: 'Memberships & Ownership', icon: Lock, badge: null },
      ],
    },
    {
      group: 'Relationships',
      items: [
        { id: 'relationships' as AdminTab, label: 'Topology & Mentorships', icon: Database, badge: null },
      ],
    },
    {
      group: 'Ecosystem Operations',
      items: [
        { id: 'opportunities' as AdminTab, label: 'Opportunities & Grants', icon: Briefcase, badge: null },
      ],
    },
    {
      group: 'Content & Communication',
      items: [
        { id: 'complaints' as AdminTab, label: 'Complaints & Support', icon: LifeBuoy, badge: null },
        { id: 'feed' as AdminTab, label: 'Ecosystem Feed Ops', icon: MessageSquare, badge: null },
        { id: 'moderation' as AdminTab, label: 'Moderation & Safety', icon: AlertTriangle, badge: null },
      ],
    },
    {
      group: 'Billing & Finance',
      items: [
        { id: 'finance' as AdminTab, label: 'Finance & Entitlements', icon: Database, badge: null },
      ],
    },
    {
      group: 'Documents & Data',
      items: [
        { id: 'documents' as AdminTab, label: 'DD Locker & Storage', icon: FileCheck, badge: null },
      ],
    },
    {
      group: 'Intelligence',
      items: [
        { id: 'analytics' as AdminTab, label: 'Platform Analytics', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      group: 'Platform Control',
      items: [
        { id: 'system' as AdminTab, label: 'System & Governance', icon: Settings, badge: null },
      ],
    },
  ];

  const getPageTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Command Centre & Attention Queue', subtitle: 'Platform-wide telemetry, health indicators, and operational pulse' };
      case 'personal-accounts':
      case 'users':
        return { title: 'Personal Accounts Registry', subtitle: 'Human identities participating as Founders, Mentors, Investors, and Members' };
      case 'entity-accounts':
        return { title: 'Entity Accounts Governance', subtitle: 'Institutional entities across Startups, Investor Organizations, and ESPs' };
      case 'workspaces':
        return { title: 'Workspaces Context Isolation', subtitle: 'Execution environments sandboxing personal, startup, and fund activities' };
      case 'startups':
        return { title: 'Startup Operations & Visibility', subtitle: 'Venture lifecycles, Ghost Mode diagnostics, virtual DD, and endorsements' };
      case 'mentors':
        return { title: 'Mentor Operations & Advisory', subtitle: 'Advisory offerings, long-term mentorship contracts, and 8% commission ledger' };
      case 'investors':
        return { title: 'Investor Operations & Funds', subtitle: 'Individual Angel roles vs multi-seat institutional Investor Organizations' };
      case 'esps':
        return { title: 'Ecosystem Service Providers (ESPs)', subtitle: 'University incubators, state missions, and authorized representative verification' };
      case 'verification':
        return { title: 'Verification Centre (8 Queues)', subtitle: 'Restricted regulatory KYC review, safe badges, and shielded identity proofs' };
      case 'memberships':
        return { title: 'Memberships, Ownership & Invites', subtitle: 'Cross-entity team seats, primary ownership transfers, and invitation audit' };
      case 'relationships':
        return { title: 'Relationships, Mentorships & Endorsements', subtitle: '11 granular relationship types, structured contracts, and endorsement broker' };
      case 'opportunities':
        return { title: 'Opportunities & AI Hub', subtitle: 'Grants, incubation cohorts, accelerators, and automated discovery pipeline' };
      case 'complaints':
        return { title: 'User Complaints & Support Centre', subtitle: 'Review user grievance submissions, account complaints, and issue status progression' };
      case 'feed':
        return { title: 'Ecosystem Feed Operations', subtitle: 'Authoritative post inspection, engagement metrics, media content, and moderation control' };
      case 'moderation':
        return { title: 'Trust, Safety & Moderation', subtitle: 'Feed report queues, imposter defense, harassment cases, and support tickets' };
      case 'finance':
        return { title: 'Billing, Finance & Entitlements Engine', subtitle: 'Commercial MRR, ARR, Subscriptions, Entitlement Engine, and tokenized payments' };
      case 'documents':
        return { title: 'Documents, DD Locker & Storage', subtitle: 'Virtual data room telemetry, dynamic watermarking compliance, and cloud storage' };
      case 'analytics':
        return { title: 'Platform & Ecosystem Intelligence', subtitle: 'Cross-ecosystem growth curves, ARR trajectories, and endorsement conversion funnels' };
      case 'system':
        return { title: 'System & Platform Governance', subtitle: '16 Admin Roles, 36 Granular Permissions, Immutable Audit Logs, and Feature Flags' };
      default:
        return { title: 'Admin Console', subtitle: 'Xentro Operational Control Plane' };
    }
  };

  const activeHeader = getPageTitle(currentTab);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#D9FF3F] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-white/60">Authorizing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white flex font-sans antialiased transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#181B1A] border-r border-[#E5E7EB] dark:border-[#262A29] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-[74px] px-6 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs flex-shrink-0">
              <img src="/xentro-logo.png" alt="Xentro Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sora text-lg font-bold tracking-tight text-[#101212] dark:text-white">
                  xentro
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212]">
                  Admin
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#666D6A] dark:text-[#8E9390] uppercase tracking-wider">
                Ecosystem Ops
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#202422]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#8E9390] dark:text-[#6E7370]">
                {sec.group}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#D9FF3F] text-[#101212] font-semibold shadow-xs'
                        : 'text-[#4A504D] dark:text-[#B6B8B7] hover:bg-black/5 dark:hover:bg-[#202422] hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-[#101212]' : 'text-[#6E7370] dark:text-[#8E9390]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          isActive
                            ? 'bg-[#101212] text-[#D9FF3F]'
                            : 'badgeAlert' in item && item.badgeAlert
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-black/5 dark:bg-[#262A29] text-[#6E7370] dark:text-[#A0A4A2]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick Platform Switch */}
          <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#262A29] space-y-1">
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white hover:bg-black/5 dark:hover:bg-[#202422] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open User App</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer / Admin Identity */}
        <div className="p-3 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#141615] space-y-2">
          {/* Admin Identity Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1C201E] border border-[#E5E7EB] dark:border-[#262A29]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-[#262A29]">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.name)}`}
                  alt={session.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#101212] dark:text-white truncate">
                  {session.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] font-mono text-[#6E7370] dark:text-[#8E9390]">
                    ID: {session.employeeId}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#6E7370] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Switcher in sidebar */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">Appearance</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[11px] font-medium text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all"
            >
              {isDark ? (
                <>
                  <Sun className="w-3 h-3 text-[#D9FF3F]" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-gray-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Operational Header */}
        <header className="sticky top-0 z-30 h-[74px] bg-white/95 dark:bg-[#181B1A]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#262A29] px-6 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold font-sora text-[#101212] dark:text-white leading-tight">
                {activeHeader.title}
              </h1>
              <p className="hidden sm:block text-xs text-[#6E7370] dark:text-[#8E9390]">
                {activeHeader.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search startups, mentors, investors, IDs..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-100 dark:bg-[#202422] border border-transparent focus:border-[#D9FF3F] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] outline-hidden transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 text-gray-500">
                ⌘K
              </span>
            </div>

            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production Live</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-transparent hover:border-[#D9FF3F] text-[#4A504D] dark:text-[#B6B8B7] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            </button>

            {/* Top Admin Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] transition-all"
              >
                <div className="w-6 h-6 rounded-md bg-[#D9FF3F] text-[#101212] font-bold text-[11px] flex items-center justify-center">
                  K
                </div>
                <span className="text-xs font-semibold hidden md:inline text-[#101212] dark:text-white">
                  {session.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-[#181B1A] text-gray-500 dark:text-gray-400">
                  {session.role}
                </span>
              </button>

              {adminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-[#262A29]">
                    <p className="text-xs font-bold text-[#101212] dark:text-white">{session.name}</p>
                    <p className="text-[11px] text-[#8E9390] font-mono">Emp #{session.employeeId}</p>
                    <p className="text-[10px] text-emerald-700 dark:text-[#D9FF3F] font-semibold mt-0.5">{session.department}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onTabChange('system');
                        setAdminDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[#4A504D] dark:text-[#B6B8B7] hover:bg-black/5 dark:hover:bg-[#202422] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Security & Permissions</span>
                    </button>
                    <Link
                      href="/"
                      target="_blank"
                      className="w-full text-left px-4 py-2 text-xs text-[#4A504D] dark:text-[#B6B8B7] hover:bg-black/5 dark:hover:bg-[#202422] flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Switch to User View</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-[#262A29] pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>End Admin Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
