'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Users,
  Rocket,
  GraduationCap,
  TrendingUp,
  Building2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Send,
  MessageSquare
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { connectionService, ConnectionRecord } from '@/lib/connectionService';
import { messagingService } from '@/lib/messagingService';
import { resolveAvatarUrl } from '@/lib/auth/authService';
import { useToast } from '@/components/ui/Toast';
import { RoleRequestModal } from '../RoleRequestModal';
import { CreateEntityModal } from '../CreateEntityModal';
import { AccountsAndRolesManager } from '../AccountsAndRolesManager';

export type ExplorerTab = 'overview' | 'explore' | 'connections' | 'upgrade' | 'accounts';

interface ExplorerDashboardProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
}

export const ExplorerDashboard: React.FC<ExplorerDashboardProps> = ({ profile, onNavigateTab }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ExplorerTab>('overview');
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [connectedPartners, setConnectedPartners] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ activeConnections: 0, pendingReceived: 0, pendingSent: 0, activeUsers: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<any[]>([]);

  const loadRoleRequests = async () => {
    try {
      const myId = profile.id || '';
      const params = new URLSearchParams();
      if (myId) params.set('userId', myId);
      if (profile.email) params.set('email', profile.email);
      const res = await fetch(`/api/roles/request?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRoleRequests(json?.data?.requests || json?.requests || []);
      }
    } catch (_) {}
  };

  const loadWorkspaces = async () => {
    try {
      const myId = profile.id || '';
      const params = new URLSearchParams();
      if (myId) params.set('userId', myId);
      if (profile.email) params.set('email', profile.email);
      const res = await fetch(`/api/auth/workspaces?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setWorkspaces(json?.data?.workspaces || []);
      }
    } catch (_) {}
  };

  const loadEntities = async () => {
    try {
      const myId = profile.id || '';
      const res = await fetch(`/api/entities?userId=${encodeURIComponent(myId)}`);
      if (res.ok) {
        const json = await res.json();
        setLinkedEntities(json?.data?.entities || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadConnections();
    loadRecommendations();
    loadRoleRequests();
    loadWorkspaces();
    loadEntities();

    const handleReqUpdated = () => {
      loadRoleRequests();
      loadWorkspaces();
    };
    const handleEntUpdated = () => {
      loadEntities();
      loadWorkspaces();
    };

    window.addEventListener('xentro-role-requests-updated', handleReqUpdated);
    window.addEventListener('xentro-entities-updated', handleEntUpdated);
    window.addEventListener('xentro-workspaces-updated', handleReqUpdated);
    return () => {
      window.removeEventListener('xentro-role-requests-updated', handleReqUpdated);
      window.removeEventListener('xentro-entities-updated', handleEntUpdated);
      window.removeEventListener('xentro-workspaces-updated', handleReqUpdated);
    };
  }, [profile.id, profile.email]);

  const loadRecommendations = async () => {
    try {
      const myId = profile.id || '';
      const params = new URLSearchParams();
      if (myId) params.set('excludeUserId', myId);
      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const recData = data?.data;
        if (recData) {
          const allItems: any[] = [];
          if (Array.isArray(recData.people)) allItems.push(...recData.people);
          if (Array.isArray(recData.mentors)) allItems.push(...recData.mentors);
          if (Array.isArray(recData.investors)) allItems.push(...recData.investors);
          setRecommendations(allItems.slice(0, 4));
        }
      }
    } catch (err) {
      console.debug('Failed to load explorer recommendations:', err);
    }
  };

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const data = await connectionService.syncFromServer();
      setConnections(data.connections || []);
      setConnectedPartners(data.connectedPartners || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      console.warn('Failed to load explorer connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendConnection = async (partnerId: string, partnerName: string, partnerRole: string) => {
    try {
      const res = await connectionService.requestConnection({
        id: partnerId,
        name: partnerName,
        role: partnerRole,
      });
      if (res?.id) {
        showToast(`Connection request sent to ${partnerName}!`, 'success');
        loadConnections();
      } else {
        showToast('Could not send connection request.', 'error');
      }
    } catch {
      showToast('Error sending connection request.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#262A29] pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Ecosystem Hub</span>
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explore Directory</span>
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'connections'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>My Network ({metrics.activeConnections})</span>
        </button>
        <button
          onClick={() => setActiveTab('upgrade')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'upgrade'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Role Upgrades</span>
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>My Accounts &amp; Roles</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Welcome Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-neutral-900 to-black text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D9FF3F]/15 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D9FF3F]/20 text-[#D9FF3F] border border-[#D9FF3F]/30">
                <Compass className="w-3.5 h-3.5" />
                Explorer Account Active
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-sora tracking-tight">
                Welcome to Xentro, {profile.name}!
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                As an Explorer, you have full access to discover emerging startups, connect with verified mentors, track institutional investors, and collaborate with ecosystem enablers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#c7ee26] active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Discover Opportunities</span>
                </button>
                <button
                  onClick={() => setActiveTab('upgrade')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span>Upgrade to Founder / Mentor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Active Connections</span>
              <p className="text-2xl font-bold font-sora text-[#101212] dark:text-white mt-1">
                {metrics.activeConnections}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Pending Requests</span>
              <p className="text-2xl font-bold font-sora text-[#101212] dark:text-white mt-1">
                {metrics.pendingSent + metrics.pendingReceived}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Ecosystem Members</span>
              <p className="text-2xl font-bold font-sora text-[#101212] dark:text-white mt-1">
                {metrics.activeUsers || '120+'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle">
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Account Type</span>
              <p className="text-2xl font-bold font-sora text-emerald-500 mt-1">
                Explorer
              </p>
            </div>
          </div>

          {/* Recommended Connections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Featured Ecosystem Members
              </h3>
              <button
                onClick={() => setActiveTab('explore')}
                className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                <Users className="w-8 h-8 text-gray-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">No ecosystem members found yet</h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">New startups, mentors, and investors will appear here once registered.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((item) => {
                  const isConnected = connectedPartners.some((p) => p.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatar || '/images/profile_avatar.webp'}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                              {item.name}
                            </h4>
                            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] capitalize">
                              {item.role || 'Member'} &bull; {item.title || item.organization || ''}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                          {item.stage || item.experience || 'Verified'}
                        </span>
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed line-clamp-2">
                        {item.bio || item.description || 'Verified ecosystem participant on Xentro.'}
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-[#262A29]">
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-500" /> Verified Member
                        </span>
                        {isConnected ? (
                          <button
                            onClick={() => onNavigateTab && onNavigateTab('messages')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendConnection(item.id, item.name, item.role || 'Member')}
                            className="px-3 py-1.5 rounded-lg bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                          >
                            <Send className="w-3 h-3" />
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPLORE DIRECTORY TAB */}
      {activeTab === 'explore' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              Ecosystem Tracks & Directory
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Browse live participants across the five core pillars of the Xentro network.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div
                onClick={() => onNavigateTab && onNavigateTab('feed')}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-3">
                  <Rocket className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-blue-500 transition-colors">
                  Startups & Ventures
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Discover pre-seed to Series A ventures building deep tech, SaaS, and hardware.
                </p>
              </div>

              <div
                onClick={() => onNavigateTab && onNavigateTab('mentorship')}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center mb-3">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-purple-500 transition-colors">
                  Mentors & Advisors
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Book 1-on-1 advisory sessions with seasoned operators, engineers, and executives.
                </p>
              </div>

              <div
                onClick={() => onNavigateTab && onNavigateTab('diligence')}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-emerald-500 transition-colors">
                  Investors & Angels
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Connect with active angel syndicates and venture capital investment funds.
                </p>
              </div>

              <div
                onClick={() => onNavigateTab && onNavigateTab('feed')}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] dark:hover:border-[#D9FF3F] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-amber-500 transition-colors">
                  ESPs & Incubators
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                  Apply to university cohorts, government grants, and acceleration labs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTIONS TAB */}
      {activeTab === 'connections' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Active Connections ({connectedPartners.length})
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Users with accepted connections in MongoDB Atlas. Messaging is unlocked.
                </p>
              </div>
              <button
                onClick={loadConnections}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {connectedPartners.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-gray-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                  No active connections yet
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                  Send connection requests to startups, mentors, or investors from the directory to unlock 1-on-1 chat.
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#c7ee26] cursor-pointer inline-flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Members to Connect</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {connectedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAvatarUrl(partner.avatar, partner.name)}
                        alt={partner.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                          {partner.name}
                        </h4>
                        <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                          {partner.role || 'Member'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        messagingService.startOrOpenConversation({
                          id: partner.id,
                          name: partner.name,
                          role: partner.role,
                          avatar: partner.avatar,
                        });
                        if (onNavigateTab) onNavigateTab('messages');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPGRADE ROLE TAB */}
      {activeTab === 'upgrade' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Active Pending Role Request Banner */}
          {roleRequests.some((r) => r.status === 'PENDING') && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse text-amber-600 dark:text-amber-400" />
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm">Role Application Under Review</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Pending Admin Review
                  </span>
                </div>
                <p>
                  You submitted a request for{' '}
                  <strong>{roleRequests.find((r) => r.status === 'PENDING')?.requestedRole}</strong>.
                  Our operations team is reviewing your profile and credentials. You will be notified by email upon review.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="mt-2 text-xs font-bold underline cursor-pointer hover:text-amber-900 dark:hover:text-amber-100"
                >
                  View Application Details &bull; #
                  {roleRequests.find((r) => r.status === 'PENDING')?.requestId ||
                    roleRequests.find((r) => r.status === 'PENDING')?.id}
                </button>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Upgrade or Activate Additional Roles
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Your personal account can register startup entities, activate advisory mentorship, or submit institutional enabler applications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] transition-colors cursor-pointer shrink-0"
              >
                Request Role
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl border border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Register a Startup Entity
                  </h4>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Create a dedicated startup identity with Diligence Locker, Cap Table logs, Pitch Deck showcase, and investor deal-rooms.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>Request Startup Founder Role</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Activate Mentor Profile
                  </h4>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Offer office hours, advisory packages, and review founder pitch decks with verified credentials.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  <span>Request Advisory Mentor Role</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Become an Angel / VC Investor
                  </h4>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Access confidential diligence lockers, review startup financials, and syndicate deals with verified accreditation.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <span>Request Investor Role</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-xl border border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    Request ESP / Incubator Affiliation
                  </h4>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Submit an institutional application for universities, incubators, or government innovation hubs.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                >
                  <span>Submit ESP Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MY ACCOUNTS & ROLES TAB */}
      {activeTab === 'accounts' && (
        <AccountsAndRolesManager
          onSelectTab={onNavigateTab}
          onOpenProfile={() => onNavigateTab && onNavigateTab('profile')}
        />
      )}

      {/* Role Request Modal */}
      <RoleRequestModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUserProfile={profile}
        onRequestSubmitted={loadRoleRequests}
      />

      {/* Create Entity Modal */}
      <CreateEntityModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        currentUserProfile={profile}
        onEntityCreated={loadEntities}
      />
    </div>
  );
};
