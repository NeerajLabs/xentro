'use client';

import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Plus,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ContentPost {
  id: string;
  type: 'memo' | 'article' | 'advice';
  title: string;
  excerpt: string;
  publishedDate: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
}

interface ActivityEvent {
  id: string;
  type: 'investment' | 'syndicate' | 'memo' | 'session';
  title: string;
  date: string;
  description: string;
}

const initialPosts: ContentPost[] = [];

const initialActivities: ActivityEvent[] = [];

export const InvestorContentActivities: React.FC = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<ContentPost[]>(initialPosts);
  const [activities] = useState<ActivityEvent[]>(initialActivities);
  const [activeTab, setActiveTab] = useState<'content' | 'activity'>('content');

  // New Post Modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postType, setPostType] = useState<'memo' | 'article' | 'advice'>('memo');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postTags, setPostTags] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: ContentPost = {
      id: `post_${Date.now()}`,
      type: postType,
      title: postTitle,
      excerpt: postExcerpt,
      publishedDate: 'Just now',
      readTime: '4 min read',
      views: 0,
      likes: 0,
      comments: 0,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setPosts([newPost, ...posts]);
    showToast('Market Perspective published to Xentro feed & investor profile!', 'success');
    setIsNewPostOpen(false);
    setPostTitle('');
    setPostExcerpt('');
    setPostTags('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Content, Thought Leadership & Activity Log</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Attract top 1% founders through published theses, market memos, and ecosystem participation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Published Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Activity Feed ({activities.length})
            </button>
          </div>

          <button
            onClick={() => setIsNewPostOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Memo</span>
          </button>
        </div>
      </div>

      {/* 2. Content Posts Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
              <FileText className="w-10 h-10 mx-auto text-gray-400 opacity-50" />
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">No Thought Leadership Posts Published Yet</h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                Publish investment theses, market memos, or founder advice to attract high-conviction deal flow.
              </p>
            </div>
          ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 hover:border-[#D9FF3F]/50 transition-all"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {post.type}
                  </span>
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {post.publishedDate} &bull; {post.readTime}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  {post.title}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => showToast('Post link copied to clipboard!', 'info')}
                  className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Perspective</span>
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {/* 3. Activity Feed Tab */}
      {activeTab === 'activity' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Activity className="w-10 h-10 mx-auto text-gray-400 opacity-50" />
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">No Activity Events Logged Yet</h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                  Investments made, syndicates organized, and keynote sessions will automatically be tracked here.
                </p>
              </div>
            ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex-shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-[#101212] dark:text-white">
                      {act.title}
                    </h4>
                    <span className="text-[10px] text-gray-400">{act.date}</span>
                  </div>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {act.description}
                  </p>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* Create New Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Publish Market Thesis or Founder Advice
              </h3>
              <button onClick={() => setIsNewPostOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Content Type:</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  <option value="memo">Market Thesis / Investment Memo</option>
                  <option value="advice">Founder Advisory & Guidance</option>
                  <option value="article">Industry Analysis</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Enterprise AI Architectures"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Excerpt / Abstract:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Key takeaways and summary for founders..."
                  value={postExcerpt}
                  onChange={(e) => setPostExcerpt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Tags (comma-separated):</label>
                <input
                  type="text"
                  placeholder="AI Agents, Enterprise, Seed, Valuation"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Publish to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
