'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
  CheckCircle2,
  Share2,
  X,
  Save,
} from 'lucide-react';
import { initialStartupPosts, StartupPost } from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';

export const StartupContentManager: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'featured'>('published');
  const [posts, setPosts] = useState<StartupPost[]>(initialStartupPosts);

  // Composer modal state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerPost, setComposerPost] = useState({
    title: '',
    type: 'Company Update' as StartupPost['type'],
    content: '',
    status: 'Published' as 'Published' | 'Draft',
    isFeatured: false,
  });

  const postTypes: StartupPost['type'][] = [
    'Company Update',
    'Product Update',
    'Milestone',
    'Hiring',
    'Funding',
    'Partnership',
    'Event',
    'Article',
  ];

  const handleToggleFeature = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    const currentFeaturedCount = posts.filter((p) => p.isFeatured).length;
    if (!post.isFeatured && currentFeaturedCount >= 3) {
      showToast('Maximum of 3 posts can be featured on your Public Profile', 'error');
      return;
    }

    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
    );
    showToast(
      !post.isFeatured
        ? 'Post pinned to Public Profile featured section'
        : 'Post unpinned from featured section',
      'info'
    );
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
    showToast('Post removed', 'info');
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerPost.title || !composerPost.content) {
      showToast('Please provide a title and content', 'error');
      return;
    }

    const created: StartupPost = {
      id: `post_${Date.now()}`,
      title: composerPost.title,
      type: composerPost.type,
      content: composerPost.content,
      date: 'Just now',
      status: composerPost.status,
      isFeatured: composerPost.isFeatured,
      viewsCount: 0,
      likesCount: 0,
    };

    setPosts([created, ...posts]);
    setIsComposerOpen(false);
    setComposerPost({
      title: '',
      type: 'Company Update',
      content: '',
      status: 'Published',
      isFeatured: false,
    });
    showToast(
      composerPost.status === 'Published'
        ? 'Post published to Xentro feed & public profile!'
        : 'Draft saved to drafts folder',
      'success'
    );
  };

  const displayedPosts = posts.filter((p) => {
    if (activeTab === 'featured') return p.isFeatured;
    if (activeTab === 'drafts') return p.status === 'Draft';
    return p.status === 'Published';
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Company Updates & Content Hub
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Auto-Synced to Feed
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Publish milestone announcements, product releases, hiring spotlights, and pin up to 3 featured articles.
          </p>
        </div>

        <button
          onClick={() => setIsComposerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'published'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          Published ({posts.filter((p) => p.status === 'Published').length})
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'featured'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          <span>Featured ({posts.filter((p) => p.isFeatured).length}/3)</span>
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'drafts'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          Drafts ({posts.filter((p) => p.status === 'Draft').length})
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4 animate-fade-slide">
        {displayedPosts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] text-xs">
            No posts found in this section.
          </div>
        ) : (
          displayedPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-[#D9FF3F]/40 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {post.type}
                  </span>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    &bull; {post.date}
                  </span>
                  {post.isFeatured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5 fill-current" /> Featured on Profile
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                  {post.title}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {post.content}
                </p>

                {/* Engagement telemetry */}
                {post.status === 'Published' && (
                  <div className="flex items-center gap-4 pt-2 text-[11px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.viewsCount} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {post.likesCount} reactions
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-start">
                <button
                  onClick={() => handleToggleFeature(post.id)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    post.isFeatured
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-[#202422] text-gray-400 hover:text-amber-500'
                  }`}
                  title={post.isFeatured ? 'Unpin from Featured' : 'Pin to Profile Top (Max 3)'}
                >
                  <Pin className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Compose Startup Announcement
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Broadcasting will update your Public Profile and the main Xentro ecosystem feed.
                </p>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Content Type
                </label>
                <select
                  value={composerPost.type}
                  onChange={(e) => setComposerPost({ ...composerPost, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium"
                >
                  {postTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Xentro launches Enterprise Orchestration Runtime v2.1"
                  value={composerPost.title}
                  onChange={(e) => setComposerPost({ ...composerPost, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Post Content
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details, metrics, links, or what you are looking for..."
                  value={composerPost.content}
                  onChange={(e) => setComposerPost({ ...composerPost, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composerPost.isFeatured}
                    onChange={(e) => setComposerPost({ ...composerPost, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F]"
                  />
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Feature at top of Public Profile
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setComposerPost({ ...composerPost, status: 'Draft' });
                    handleSavePost({ preventDefault: () => {} } as any);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202422]"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setComposerPost({ ...composerPost, status: 'Published' })}
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
