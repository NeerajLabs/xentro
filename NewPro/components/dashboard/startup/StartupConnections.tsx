'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Calendar,
  Lock,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Grid2X2,
  Rocket,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { initialConnectionsData, EcosystemConnection } from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';
import { messagingService } from '@/lib/messagingService';
import { connectionService } from '@/lib/connectionService';

interface StartupConnectionsProps {
  onMessageClick?: (conn: EcosystemConnection) => void;
}

export const StartupConnections: React.FC<StartupConnectionsProps> = ({ onMessageClick }) => {
  const { showToast } = useToast();
  
  const mapPartnerToConn = (p: any): EcosystemConnection => ({
    id: p.id,
    name: p.name,
    role: p.role || 'Member',
    organization: 'Verified Network',
    avatar: p.avatar,
    category: (p.role?.toLowerCase().includes('mentor') ? 'Mentor' : p.role?.toLowerCase().includes('investor') ? 'Investor' : 'Startup') as any,
    status: 'Connected',
    connectedSince: p.connectedAt ? new Date(p.connectedAt).toLocaleDateString() : 'Recent',
    isVerified: true,
    lastActive: 'Active now',
    engagementCount: 1,
    relationshipStrength: 'Verified Connection',
  });

  const [connections, setConnections] = useState<EcosystemConnection[]>(() => {
    const real = connectionService.getConnectedPartners().map(mapPartnerToConn);
    return [...real, ...initialConnectionsData];
  });

  React.useEffect(() => {
    const refresh = () => {
      const real = connectionService.getConnectedPartners().map(mapPartnerToConn);
      setConnections([...real, ...initialConnectionsData]);
    };
    window.addEventListener('xentro-connections-updated', refresh);
    window.addEventListener('xentro-connection-event', refresh);
    return () => {
      window.removeEventListener('xentro-connections-updated', refresh);
      window.removeEventListener('xentro-connection-event', refresh);
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState<'All' | 'Investor' | 'Mentor' | 'Startup' | 'ESP'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Private note editing modal state
  const [editingNoteConn, setEditingNoteConn] = useState<EcosystemConnection | null>(null);
  const [noteText, setNoteText] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [relStatus, setRelStatus] = useState('');

  const openNoteEditor = (conn: EcosystemConnection) => {
    setEditingNoteConn(conn);
    setNoteText(conn.founderNotes?.notes || '');
    setNextFollowUp(conn.founderNotes?.nextFollowUpDate || '');
    setRelStatus(conn.founderNotes?.relationshipStatus || 'In Discussion');
  };

  const savePrivateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteConn) return;

    setConnections((prev) =>
      prev.map((c) => {
        if (c.id === editingNoteConn.id) {
          return {
            ...c,
            founderNotes: {
              notes: noteText,
              nextFollowUpDate: nextFollowUp,
              relationshipStatus: relStatus,
            },
          };
        }
        return c;
      })
    );

    showToast(`Private founder notes saved for ${editingNoteConn.name}`, 'success');
    setEditingNoteConn(null);
  };

  const handleStageChange = (connId: string, newStage: string, type: 'investor' | 'mentor') => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id === connId) {
          if (type === 'investor') {
            return { ...c, investorStage: newStage as any };
          } else {
            return { ...c, mentorStage: newStage as any };
          }
        }
        return c;
      })
    );
    showToast(`Pipeline stage updated to: ${newStage}`, 'info');
  };

  const filteredConnections = connections.filter((c) => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="startup-connections-section" className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Ecosystem CRM & Stakeholder Pipeline
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Founder Private Notes Protected
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Track investor due diligence stages, mentor advisory sessions, and private follow-up dates.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
          {(['All', 'Investor', 'Mentor', 'Startup', 'ESP'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              {cat === 'All' ? 'All' : `${cat}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Stats */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search connections by name or fund..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#565B59] dark:text-[#B6B8B7]">
          <span>Showing <strong className="text-[#101212] dark:text-white">{filteredConnections.length}</strong> active connections</span>
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-4 animate-fade-slide">
        {filteredConnections.map((conn) => (
          <div
            key={conn.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
          >
            {/* Left Info */}
            <div className="flex items-start gap-4">
              <img
                src={conn.avatar}
                alt={conn.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-white dark:border-[#262A29] shadow-xs flex-shrink-0"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                    {conn.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      conn.category === 'Investor'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : conn.category === 'Mentor'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : conn.category === 'ESP'
                        ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white'
                    }`}
                  >
                    {conn.category}
                  </span>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    &bull; Active {conn.lastInteraction}
                  </span>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  <span className="font-semibold text-[#101212] dark:text-white">{conn.role}</span> &bull; {conn.organization}
                </p>

                {/* Pipeline Stage Selectors */}
                {conn.category === 'Investor' && conn.investorStage && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Pipeline Stage:</span>
                    <select
                      value={conn.investorStage}
                      onChange={(e) => handleStageChange(conn.id, e.target.value, 'investor')}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[11px] font-bold text-purple-600 dark:text-purple-400 cursor-pointer"
                    >
                      <option value="Connected">Connected</option>
                      <option value="Pitch Shared">Pitch Shared</option>
                      <option value="Interested">Interested</option>
                      <option value="DD Requested">DD Requested</option>
                      <option value="DD Granted">DD Granted</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                    </select>
                  </div>
                )}

                {conn.category === 'Mentor' && conn.mentorStage && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Mentorship Stage:</span>
                    <select
                      value={conn.mentorStage}
                      onChange={(e) => handleStageChange(conn.id, e.target.value, 'mentor')}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[11px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                    >
                      <option value="Mentorship Requested">Mentorship Requested</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Session Scheduled">Session Scheduled</option>
                      <option value="Active Mentor">Active Mentor</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Private Founder Note preview */}
            <div className="lg:max-w-xs w-full p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private Founder Note
                </span>
                <button
                  onClick={() => openNoteEditor(conn)}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
              <p className="text-xs text-[#101212] dark:text-gray-300 line-clamp-2 italic">
                {conn.founderNotes?.notes || 'No private notes logged yet.'}
              </p>
              {conn.founderNotes?.nextFollowUpDate && (
                <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7] block pt-0.5">
                  Next Follow-up: {conn.founderNotes.nextFollowUpDate}
                </span>
              )}
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <button
                onClick={() => {
                  if (onMessageClick) {
                    onMessageClick(conn);
                  } else {
                    messagingService.startOrOpenConversation({
                      id: conn.id,
                      name: conn.name,
                      role: conn.role,
                      avatar: conn.avatar,
                      company: conn.organization
                    });
                    showToast(`Opening chat conversation with ${conn.name}...`, 'success');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              <button
                onClick={() => showToast(`Scheduling session calendar with ${conn.name}`, 'info')}
                className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Private Founder Note Modal */}
      {editingNoteConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Private Founder Note: {editingNoteConn.name}</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {editingNoteConn.organization} &bull; Confidential (Visible only to your founding team)
                </p>
              </div>
              <button
                onClick={() => setEditingNoteConn(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={savePrivateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Internal Discussion & Deal Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record insights from calls, terms discussed, diligence questions, or chemistry..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Relationship Priority
                  </label>
                  <select
                    value={relStatus}
                    onChange={(e) => setRelStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  >
                    <option value="High Priority Prospect">High Priority Prospect</option>
                    <option value="Active Technical Advisor">Active Technical Advisor</option>
                    <option value="Introductory Stage">Introductory Stage</option>
                    <option value="Institutional Sponsor">Institutional Sponsor</option>
                    <option value="Follow-up Later">Follow-up Later</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteConn(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
