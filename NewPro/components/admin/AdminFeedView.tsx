'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Heart,
  Share2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  ExternalLink,
  Tag,
  User,
  Building,
  Clock,
  Sparkles,
  ShieldAlert,
  X,
} from 'lucide-react';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getAdminSession } from '@/lib/adminAuth';
import { logAdminAudit } from '@/lib/adminDomainService';

interface AdminFeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorCompany?: string;
  authorAvatar?: string;
  authorRoleType?: string;
  content: string;
  postType?: string;
  mediaUrls?: string[];
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  commentsList?: any[];
  createdAt: string;
}

export const AdminFeedView: React.FC = () => {
  const [posts, setPosts] = useState<AdminFeedPost[]>([]);
  const [totalPlatformPosts, setTotalPlatformPosts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<AdminFeedPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const resp = await fetch(`${backendUrl}/admin/feed/?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        }
      });

      if (resp.ok) {
        const d = await resp.json();
        const data = d?.data || d;
        setPosts(data.posts || []);
        setTotalPlatformPosts(data.totalPlatformPosts || (data.posts || []).length);
      } else {
        // Fallback to standard feed endpoint
        const fb = await fetch(`${backendUrl}/feed/posts/`);
        if (fb.ok) {
          const fbd = await fb.json();
          const p = fbd?.data?.posts || [];
          setPosts(p);
          setTotalPlatformPosts(p.length);
        }
      }
    } catch (e) {
      console.warn('Could not load admin feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeed();
  };

  const handleDeletePost = async (post: AdminFeedPost) => {
    if (!confirm(`Are you sure you want to remove post #${post.id} by ${post.authorName}? This will moderate the post out of the public ecosystem feed.`)) {
      return;
    }

    try {
      setDeletingPostId(post.id);
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();

      const resp = await fetch(`${backendUrl}/admin/feed/${post.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ reason: 'Moderated by administrative staff for platform compliance.' })
      });

      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Post #${post.id} moderated and removed successfully.`);
        logAdminAudit(
          'FEED_POST_DELETED',
          'FEED_POST',
          post.id,
          `Post by ${post.authorName} removed by administrative intervention.`
        );
        if (selectedPost?.id === post.id) {
          setSelectedPost(null);
        }
        loadFeed();
      } else {
        showToast(data?.message || 'Failed to remove post.');
      }
    } catch {
      showToast('Network error while removing post.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (roleFilter !== 'ALL') {
      const r = (p.authorRole || '').toLowerCase();
      if (roleFilter === 'STARTUP' && !r.includes('startup') && !r.includes('founder')) return false;
      if (roleFilter === 'MENTOR' && !r.includes('mentor') && !r.includes('advisor')) return false;
      if (roleFilter === 'INVESTOR' && !r.includes('investor') && !r.includes('angel')) return false;
      if (roleFilter === 'ESP' && !r.includes('esp') && !r.includes('incubator')) return false;
    }
    return true;
  });

  const totalLikes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#101212] text-white dark:bg-white dark:text-[#101212] text-xs font-bold shadow-floating flex items-center gap-2 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Ecosystem Feed Operations & Moderation
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            Live Ecosystem Feed Oversight
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1">
            Authoritative visibility into published posts, engagement metrics, media content, and compliance moderation across all member roles.
          </p>
        </div>

        <button
          onClick={loadFeed}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#101212] dark:text-white transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">Active Posts</span>
          <span className="text-2xl font-bold font-mono text-[#101212] dark:text-white mt-1 block">
            {posts.length}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">Total Likes</span>
          <span className="text-2xl font-bold font-mono text-red-700 dark:text-red-400 mt-1 block">
            {totalLikes}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">Total Comments</span>
          <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1 block">
            {totalComments}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
          <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] block">Moderation Status</span>
          <span className="text-sm font-bold font-mono text-emerald-800 dark:text-[#D9FF3F] mt-2 block flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Live Protected
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts by author name, content keywords, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9290] focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#565B59] dark:text-[#A0A4A2]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          >
            <option value="ALL">All Author Roles</option>
            <option value="STARTUP">Founders / Startups</option>
            <option value="MENTOR">Mentors</option>
            <option value="INVESTOR">Investors</option>
            <option value="ESP">ESPs / Incubators</option>
          </select>
        </div>
      </div>

      {/* Feed Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#8E9290] bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-[#8E9290]/40" />
            <p className="font-semibold text-[#101212] dark:text-white">No feed posts found</p>
            <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
              No posts match the current filter or search criteria.
            </p>
          </div>
        ) : (
          filteredPosts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs flex flex-col justify-between space-y-3.5 group hover:border-[#D9FF3F]/60 transition-all"
            >
              {/* Author Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${p.authorName}`}
                    alt={p.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB] dark:border-gray-700 bg-gray-100"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#101212] dark:text-white font-sora">
                        {p.authorName}
                      </span>
                      {p.postType && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-200 dark:border-[#D9FF3F]/20">
                          {p.postType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#565B59] dark:text-[#A0A4A2] mt-0.5 font-mono">
                      <span>{p.authorRole}</span>
                      {p.authorCompany && (
                        <>
                          <span>&bull;</span>
                          <span>{p.authorCompany}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span className="font-mono text-[10px] text-[#8E9290]">
                  #{p.id}
                </span>
              </div>

              {/* Post Content */}
              <p className="text-xs text-[#101212] dark:text-white leading-relaxed line-clamp-4">
                {p.content}
              </p>

              {/* Media Attachments */}
              {p.mediaUrls && p.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {p.mediaUrls.slice(0, 2).map((m, idx) => (
                    <img
                      key={idx}
                      src={m}
                      alt="Post Attachment"
                      className="w-full h-28 object-cover rounded-xl border border-[#E5E7EB] dark:border-[#262A29]"
                    />
                  ))}
                </div>
              )}

              {/* Tags */}
              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Metrics & Actions Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-[#565B59] dark:text-[#A0A4A2]">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>{p.likesCount || 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>{p.commentsCount || 0}</span>
                  </span>
                  <span className="text-[10px] text-[#8E9290]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPost(p)}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-colors cursor-pointer"
                    title="View details & comments"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(p)}
                    disabled={deletingPostId === p.id}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Moderate / Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-floating overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-[#D9FF3F]">
                  #{selectedPost.id}
                </span>
                <span className="text-xs text-[#565B59] dark:text-[#A0A4A2]">&bull; Post Telemetry</span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262A29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
                <img
                  src={selectedPost.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedPost.authorName}`}
                  alt={selectedPost.authorName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#101212] dark:text-white font-sora">
                    {selectedPost.authorName}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] font-mono">
                    ID: {selectedPost.authorId || 'N/A'} &bull; {selectedPost.authorRole}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block mb-1">
                  Full Content
                </span>
                <p className="text-xs text-[#101212] dark:text-white leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-[#202422] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29]">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.commentsList && selectedPost.commentsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#A0A4A2] uppercase tracking-wider block">
                    Comments ({selectedPost.commentsList.length})
                  </span>
                  <div className="divide-y divide-gray-100 dark:divide-[#262A29] max-h-48 overflow-y-auto bg-gray-50 dark:bg-[#202422] rounded-xl p-3 border border-[#E5E7EB] dark:border-[#262A29]">
                    {selectedPost.commentsList.map((c: any, idx: number) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 text-xs">
                        <span className="font-bold text-[#101212] dark:text-white">
                          {(c.author && c.author.name) || 'Member'}:
                        </span>
                        <span className="ml-1.5 text-[#565B59] dark:text-[#B6B8B7]">
                          {c.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#1C201F]/50">
              <span className="text-[11px] text-[#8E9290]">
                Published {new Date(selectedPost.createdAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePost(selectedPost)}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Moderate / Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
