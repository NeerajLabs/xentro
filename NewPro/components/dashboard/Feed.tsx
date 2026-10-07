'use client';

import React, { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { Post } from '@/types';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { feedService, fetchInitialServerFeed } from '@/lib/feedService';
import { CreatePostTrigger } from './feed/CreatePostTrigger';
import { CreatePostModal } from './feed/CreatePostModal';
import { Sparkles, Plus } from 'lucide-react';

interface FeedProps {
  searchQuery?: string;
  onPostCreated?: (post: Post) => void;
}

export const Feed: React.FC<FeedProps> = ({ searchQuery = '', onPostCreated }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialIntent, setModalInitialIntent] = useState<string | undefined>(undefined);
  const [modalInitialImageUrl, setModalInitialImageUrl] = useState<string | undefined>(undefined);

  // Load posts and subscribe to feed & role updates
  useEffect(() => {
    // Initial fetch from memory / storage and sync from authoritative server
    setPosts(feedService.getPosts());
    setUserProfile(getUserProfile());
    fetchInitialServerFeed();

    const handleFeedUpdate = () => {
      setPosts(feedService.getPosts());
    };

    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.profile) {
        setUserProfile(customEvent.detail.profile);
      } else {
        setUserProfile(getUserProfile());
      }
    };

    window.addEventListener('xentro-feed-updated', handleFeedUpdate);
    window.addEventListener('xentro-role-changed', handleRoleChanged);

    return () => {
      window.removeEventListener('xentro-feed-updated', handleFeedUpdate);
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
    };
  }, []);

  const handleLikeToggle = (postId: string) => {
    const updated = feedService.toggleLike(postId);
    setPosts(updated);
  };

  const handleOpenCreateModal = (intent?: string, imageUrl?: string) => {
    setModalInitialIntent(intent);
    setModalInitialImageUrl(imageUrl);
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(feedService.getPosts());
    if (onPostCreated) {
      onPostCreated(newPost);
    }
  };

  // Filter posts only based on optional search query (filter tabs removed per request)
  const filteredPosts = posts.filter((post) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesContent = post.content.toLowerCase().includes(q);
      const matchesAuthor = post.author.name.toLowerCase().includes(q);
      const matchesRole = post.author.role.toLowerCase().includes(q);
      const matchesCompany = (post.author.company || '').toLowerCase().includes(q);
      const matchesTags = post.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesPostType = (post.postType || '').toLowerCase().includes(q);

      if (!matchesContent && !matchesAuthor && !matchesRole && !matchesCompany && !matchesTags && !matchesPostType) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="w-full flex-1 max-w-[640px] mx-auto">
      {/* 1. Create a Post Trigger Box - hidden for read-only guest/explorer sessions */}
      {userProfile.role !== 'explorer' && (
        <CreatePostTrigger
          userProfile={userProfile}
          onOpenModal={handleOpenCreateModal}
        />
      )}

      {/* 2. Social Posts List */}
      <div className="space-y-4 animate-fade-slide">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
          ))
        ) : (
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-8 text-center animate-fade-slide space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#101212] dark:text-white">
                No posts found
              </p>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                {searchQuery.trim()
                  ? `No posts matched "${searchQuery}". Try adjusting your search query.`
                  : 'Be the first to share an update or milestone with the ecosystem!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Post Now</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Rich Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserProfile={userProfile}
        initialIntent={modalInitialIntent}
        initialImageUrl={modalInitialImageUrl}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};
