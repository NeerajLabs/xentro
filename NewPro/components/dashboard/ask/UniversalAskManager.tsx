'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  Eye,
  Edit2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Trash2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Send,
  Search,
  Filter,
  Shield,
  Layers,
  Award,
  Briefcase,
} from 'lucide-react';
import { UserRole, getUserProfile } from '@/lib/userProfile';
import { EcosystemAsk, ASK_ROLE_CONFIGS } from '@/lib/askConfig';
import { askService } from '@/lib/askService';
import { initialAskResponses, AskResponseItem, initialStartupWorkspaceData } from '@/data/startupWorkspaceData';
import { DynamicAskModal } from './DynamicAskModal';
import { UniversalAskCard } from './UniversalAskCard';
import { useToast } from '@/components/ui/Toast';

interface UniversalAskManagerProps {
  role?: UserRole;
  defaultTab?: 'overview' | 'asks' | 'drafts' | 'responses';
}

export const UniversalAskManager: React.FC<UniversalAskManagerProps> = ({
  role: propRole,
  defaultTab,
}) => {
  const { showToast } = useToast();

  // Active role detection
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (propRole) return propRole;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xentro_active_role') as UserRole;
      if (stored && ASK_ROLE_CONFIGS[stored]) return stored;
    }
    return (getUserProfile().role as UserRole) || 'startup';
  });

  // Listen to role changes
  useEffect(() => {
    if (propRole) {
      setActiveRole(propRole);
      return;
    }
    const handleRoleChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.role && ASK_ROLE_CONFIGS[ce.detail.role as UserRole]) {
        setActiveRole(ce.detail.role as UserRole);
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('xentro_active_role') as UserRole;
        if (stored && ASK_ROLE_CONFIGS[stored]) setActiveRole(stored);
      }
    };
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    return () => window.removeEventListener('xentro-role-changed', handleRoleChanged);
  }, [propRole]);

  const roleConfig = ASK_ROLE_CONFIGS[activeRole] || ASK_ROLE_CONFIGS.startup;

  // Active subtab
  const initialTabState = defaultTab || (activeRole === 'startup' ? 'overview' : 'asks');
  const [activeTab, setActiveTab] = useState<'overview' | 'asks' | 'drafts' | 'responses'>(initialTabState);

  // Asks list & responses state
  const [asks, setAsks] = useState<EcosystemAsk[]>([]);
  const [responses, setResponses] = useState<AskResponseItem[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsk, setEditingAsk] = useState<EcosystemAsk | null>(null);

  // Load asks and responses for active role
  const loadData = () => {
    const roleAsks = askService.getAsks(activeRole);
    setAsks(roleAsks);
    const resps = askService.getResponses();
    setResponses(resps);
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => loadData();
    window.addEventListener('xentro-asks-updated', handleUpdated);
    return () => window.removeEventListener('xentro-asks-updated', handleUpdated);
  }, [activeRole]);

  // Derived datasets
  const publishedAsks = useMemo(
    () => asks.filter((a) => a.status === 'published' || a.status === 'Active' || a.status === 'Paused'),
    [asks]
  );

  const draftAsks = useMemo(
    () => asks.filter((a) => a.status === 'draft' || a.status === 'Draft'),
    [asks]
  );

  const filteredPublishedAsks = useMemo(() => {
    return publishedAsks.filter((a) => {
      const matchesSearch =
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.shortSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [publishedAsks, searchQuery, categoryFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingAsk(null);
    setIsModalOpen(true);
  };

  const handleEditAsk = (ask: EcosystemAsk) => {
    setEditingAsk(ask);
    setIsModalOpen(true);
  };

  const handleDeleteAsk = (id: string) => {
    askService.deleteAsk(id);
    setAsks((prev) => prev.filter((a) => a.id !== id));
    showToast('Ask deleted from ecosystem', 'info');
  };

  const handleToggleStatus = (id: string) => {
    const updated = askService.toggleAskStatus(id);
    if (updated) {
      setAsks((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Ask status updated to ${updated.status}`, 'info');
    }
  };

  const handleResponseAction = (respId: string, action: 'Accepted' | 'Declined') => {
    askService.updateResponseStatus(respId, action);
    setResponses((prev) =>
      prev.map((r) => (r.id === respId ? { ...r, status: action } : r))
    );
    showToast(`Response ${action.toLowerCase()}!`, action === 'Accepted' ? 'success' : 'info');
  };

  // Header Title & Tagline per persona
  const headerContent = useMemo(() => {
    switch (activeRole) {
      case 'investor':
        return {
          title: 'Investor Asks & Sourcing Thesis Engine',
          badge: 'Capital Formation & Sourcing',
          description:
            'Broadcast your investment thesis, syndicate co-investments, find due diligence experts, and connect portfolio startups to market access.',
        };
      case 'mentor':
        return {
          title: 'Mentor Asks & Advisory Matching Engine',
          badge: 'Advisory & Knowledge Transfer',
          description:
            'Publish advisory seats, open structured 1-on-1 mentorship cohorts, offer technical workshops, and collaborate on venture research.',
        };
      case 'esp':
        return {
          title: 'ESP Asks & Program Applications Manager',
          badge: 'Incubation & Cohort Management',
          description:
            'Broadcast application calls for cohorts, recruit specialized domain mentors, invite investors to demo days, and secure corporate sponsors.',
        };
      default:
        return {
          title: 'Ecosystem Ask & Capital Formation Manager',
          badge: 'Direct Ecosystem Matching',
          description:
            'Broadcast investment rounds, mentorship queries, partnership proposals, corporate pilots, and institutional research requests.',
        };
    }
  }, [activeRole]);

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {headerContent.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {headerContent.badge}
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-3xl leading-relaxed">
            {headerContent.description}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Ecosystem Ask</span>
        </button>
      </div>

      {/* Navigation Subtabs Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {activeRole === 'startup' && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Fundraising Round Overview</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('asks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'asks'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Active Asks ({publishedAsks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'drafts'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Drafts ({draftAsks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'responses'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Responses Received ({responses.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STARTUP INVESTMENT OVERVIEW                                         */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && activeRole === 'startup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-xs font-bold text-[#D9FF3F] bg-[#D9FF3F]/10 px-2.5 py-0.5 rounded-full mb-1 inline-block">
                  Active Capital Formation
                </span>
                <h3 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  {initialStartupWorkspaceData.currentAsk.title}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Instrument: {initialStartupWorkspaceData.currentAsk.instrument} • Valuation Cap:{' '}
                  {initialStartupWorkspaceData.currentAsk.valuationCap}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Round Terms</span>
                </button>
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Target Round Size
                </span>
                <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
                  {initialStartupWorkspaceData.currentAsk.targetAmount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">
                  Committed Capital
                </span>
                <span className="text-xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
                  {initialStartupWorkspaceData.currentAsk.committedAmount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20">
                <span className="text-[11px] text-[#101212] dark:text-[#D9FF3F] block mb-1">
                  Remaining Allocation
                </span>
                <span className="text-xl font-bold font-sora text-[#101212] dark:text-[#D9FF3F]">
                  {initialStartupWorkspaceData.currentAsk.remainingAmount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Target Closing Date
                </span>
                <span className="text-sm font-bold text-[#101212] dark:text-white block mt-1">
                  {initialStartupWorkspaceData.currentAsk.closingDate}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Round Allocation Progress</span>
                <span className="text-[#101212] dark:text-[#D9FF3F]">
                  {initialStartupWorkspaceData.currentAsk.percentComplete}% Committed
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-[#202422] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 to-[#D9FF3F] transition-all duration-500"
                  style={{ width: `${initialStartupWorkspaceData.currentAsk.percentComplete}%` }}
                />
              </div>
            </div>

            {/* Use of Funds Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                Intended Capital Deployment Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {initialStartupWorkspaceData.currentAsk.useOfFunds.map((u, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] space-y-1">
                    <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] block truncate">
                      {u.category}
                    </span>
                    <span className="text-lg font-bold font-sora text-[#101212] dark:text-white">
                      {u.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE ASKS LIST                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'asks' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search asks by title or terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] shrink-0 font-medium">
                Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
              >
                <option value="all">All Categories ({publishedAsks.length})</option>
                {roleConfig.categoryOrder.map((catKey) => {
                  const cfg = roleConfig.categories[catKey];
                  const count = publishedAsks.filter((a) => a.category === catKey).length;
                  return (
                    <option key={catKey} value={catKey}>
                      {cfg.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredPublishedAsks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#101212] dark:text-white">
                No active Asks matching criteria
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                Publish a structured request to broadcast your requirements to ecosystem partners.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-xs font-bold text-[#101212] cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Ask</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPublishedAsks.map((ask) => (
                <UniversalAskCard
                  key={ask.id}
                  ask={ask}
                  isOwner={true}
                  onEdit={handleEditAsk}
                  onDelete={handleDeleteAsk}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DRAFTS LIST                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {draftAsks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#101212] dark:text-white">
                No draft Asks saved
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                When creating an Ask, you can click "Save Draft" to preserve unfinished parameters without broadcasting.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftAsks.map((ask) => (
                <div
                  key={ask.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-amber-500/20 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Draft
                      </span>
                      <span className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                        Category: {ask.category}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#101212] dark:text-white">
                      {ask.title || 'Untitled Draft Ask'}
                    </h4>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">
                      {ask.shortSummary || 'No summary entered yet'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleEditAsk(ask)}
                      className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-xs font-bold text-[#101212] cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Resume & Publish</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAsk(ask.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RESPONSES RECEIVED                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {responses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#101212] dark:text-white">
                No responses yet
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                When angels, funds, mentors, or institutional partners respond to your Asks, their inquiries will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((resp) => (
                <div
                  key={resp.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={resp.responderAvatar}
                      alt=""
                      className="w-10 h-10 rounded-2xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#101212] dark:text-white">
                          {resp.responderName}
                        </span>
                        <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                          • {resp.responderRole} at {resp.responderOrg}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {resp.userType}
                        </span>
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-2xl">
                        "{resp.message}"
                      </p>
                      <span className="text-[10px] text-gray-400 block pt-1">
                        Received {resp.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {resp.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleResponseAction(resp.id, 'Declined')}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleResponseAction(resp.id, 'Accepted')}
                          className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-xs font-bold text-[#101212] shadow-2xs hover:bg-[#C7F020]"
                        >
                          Accept & Connect
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          resp.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                        }`}
                      >
                        {resp.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Create / Edit Ask Modal */}
      <DynamicAskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialAsk={editingAsk}
        activeRole={activeRole}
        onSaved={() => loadData()}
      />
    </div>
  );
};
