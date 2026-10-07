'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Building2,
  MapPin,
  ExternalLink,
  Plus,
  X,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { connectionService } from '@/lib/connectionService';
import { messagingService } from '@/lib/messagingService';

type ConnectionCategory = 'founders' | 'co_investors' | 'mentors' | 'esps';

interface ConnectionItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  avatar: string;
  category: ConnectionCategory;
  location: string;
  connectedDate: string;
  verified: boolean;
  mutualDeals?: number;
  notes?: string;
}

const mockConnections: ConnectionItem[] = [];

export interface InvestorConnectionsProps {
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
}

export const InvestorConnections: React.FC<InvestorConnectionsProps> = ({
  showFilters = false,
  title,
  subtitle,
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ConnectionCategory>('founders');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMessageConn, setActiveMessageConn] = useState<ConnectionItem | null>(null);
  const [messageText, setMessageText] = useState('');

  const realPartners = connectionService.getConnectedPartners();
  const allConnections: ConnectionItem[] = [
    ...realPartners.map((p) => ({
      id: p.id,
      name: p.name,
      title: p.role,
      organization: 'Verified Network',
      avatar: p.avatar,
      category: 'founders' as ConnectionCategory,
      location: 'India',
      connectedDate: 'Active',
      verified: true,
      notes: 'Connected on Xentro (MongoDB)',
    })),
    ...mockConnections,
  ];

  const filteredConnections = allConnections.filter((c) => {
    const matchesCategory = showFilters ? c.category === selectedCategory : true;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = {
    founders: allConnections.filter((c) => c.category === 'founders').length,
    co_investors: allConnections.filter((c) => c.category === 'co_investors').length,
    mentors: allConnections.filter((c) => c.category === 'mentors').length,
    esps: allConnections.filter((c) => c.category === 'esps').length,
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessageConn) return;
    messagingService.startOrOpenConversation({
      id: activeMessageConn.id,
      name: activeMessageConn.name,
      role: activeMessageConn.title,
      avatar: activeMessageConn.avatar,
      initialMessage: messageText || undefined,
    });
    showToast(`Opening conversation with ${activeMessageConn.name}!`, 'success');
    setActiveMessageConn(null);
    setMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>{title || 'Venture Network & Relationships'}</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            {subtitle || 'Institutional relationship directory and verified network across Xentro'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
          />
        </div>
      </div>

      {/* 2. Category Selector Pills (only when showFilters is true) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedCategory('founders')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'founders'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            <span>Founders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
              {categoryCounts.founders}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('co_investors')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'co_investors'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            <span>Co-Investors & Syndicates</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
              {categoryCounts.co_investors}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('mentors')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'mentors'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            <span>Mentors & Advisors</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
              {categoryCounts.mentors}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('esps')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === 'esps'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            <span>ESPs & Incubators</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
              {categoryCounts.esps}
            </span>
          </button>
        </div>
      )}

      {/* 3. Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnections.map((conn) => (
          <div
            key={conn.id}
            className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col justify-between space-y-3 hover:border-[#D9FF3F]/50 transition-all"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <img src={conn.avatar} alt={conn.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {conn.name}
                    </h4>
                    {conn.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    {conn.title}
                  </p>
                  <p className="text-[11px] font-semibold text-[#101212] dark:text-[#D9FF3F]">
                    {conn.organization}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-gray-400 flex items-center justify-between">
                <span>{conn.location}</span>
                <span>Connected: {conn.connectedDate}</span>
              </div>

              {conn.notes && (
                <div className="mt-2 p-2 rounded-xl bg-gray-50 dark:bg-[#202422] text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  {conn.notes}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveMessageConn(conn)}
                className="flex-1 py-1.5 rounded-xl bg-[#D9FF3F]/15 hover:bg-[#D9FF3F]/30 text-xs font-bold text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>

              <button
                onClick={() => showToast(`Schedule meeting requested with ${conn.name}`, 'info')}
                className="p-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-gray-500 hover:text-white hover:border-[#D9FF3F] transition-colors cursor-pointer"
                title="Schedule Sync"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message Modal */}
      {activeMessageConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Message {activeMessageConn.name}
              </h3>
              <button onClick={() => setActiveMessageConn(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
              <p className="text-gray-400">
                To: <strong className="text-white">{activeMessageConn.name}</strong> ({activeMessageConn.organization})
              </p>

              <textarea
                rows={4}
                required
                placeholder="Write your note or question..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
              />

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMessageConn(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
