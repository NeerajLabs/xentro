'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Share2,
  Search,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { espProfilesData } from '@/data/espProfilesData';
import { ESPContentItem } from '@/types/esp';

interface ESPContentManagerProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ESPContentManager: React.FC<ESPContentManagerProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const esp = espProfilesData['uni_9'];
  const [contentList, setContentList] = useState<ESPContentItem[]>(esp.content);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Announcement' | 'Article' | 'Success Story'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ESPContentItem['type']>('Announcement');
  const [content, setContent] = useState('');

  const filteredContent = contentList.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
    );
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newPost: ESPContentItem = {
      id: `cnt_${Date.now()}`,
      type,
      title,
      date: 'Just now',
      content,
      author: {
        name: 'Incubation Communications',
        avatar: esp.identity.logo,
        role: 'Communications Lead',
      },
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    };

    setContentList([newPost, ...contentList]);
    setIsCreateModalOpen(false);
    showToast(`Published post "${title}" to the ecosystem!`, 'success');

    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Content & Thought Leadership
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {contentList.length} Publications
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Publish institutional press releases, founder success stories, cohort highlights, and research insights.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish Article / Update</span>
        </button>
      </div>

      {/* 1. Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['all', 'Announcement', 'Article', 'Success Story'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212]'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              {t === 'all' ? 'All Content' : t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Content Feed */}
      <div className="space-y-4">
        {filteredContent.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  {item.type}
                </span>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">• {item.date}</span>
              </div>
              <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                By {item.author.name}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                {item.title}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1.5 leading-relaxed">
                {item.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span>{item.likesCount || 0} Likes</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{item.commentsCount || 0} Comments</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>{item.sharesCount || 0} Shares</span>
                </span>
              </div>

              <button
                onClick={() => showToast(`Sharing ${item.title} link...`, 'info')}
                className="hover:text-[#101212] dark:hover:text-[#D9FF3F] font-bold cursor-pointer transition-colors"
              >
                Share Article
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                Create Publication Post
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Announcing 14 Startups Selected for Global Acceleration Track"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Publication Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Article">Article / Insight</option>
                  <option value="Success Story">Founder Success Story</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Body Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the full publication announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
