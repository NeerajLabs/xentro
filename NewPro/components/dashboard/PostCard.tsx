'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Flag,
  MoreHorizontal,
  Bookmark,
  Send,
  Check,
} from 'lucide-react';
import { Post, PostComment } from '@/types';
import { currentUser } from '@/data/mockData';
import { useToast } from '@/components/ui/Toast';
import { toggleStartupBookmark } from '@/lib/startupBookmarkState';
import { getUserProfile, GUEST_AVATAR } from '@/lib/userProfile';
import { feedService } from '@/lib/feedService';
import { followService, FOLLOWS_UPDATED_EVENT } from '@/lib/followService';

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle }) => {
  const author = post.author || {
    id: (post as any).authorId || post.id,
    name: (post as any).authorName || 'Ecosystem Member',
    username: `@${((post as any).authorName || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    role: (post as any).authorRole || 'Founder & Innovator',
    company: (post as any).authorCompany,
    avatar: (post as any).authorAvatar || '/xentro-logo.png',
    verified: true,
  };

  const myProfile = getUserProfile();
  const isMe = myProfile.id === author.id;

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likeCount, setLikeCount] = useState(post.metrics?.likes ?? (post as any).likes ?? 0);
  const [isFollowing, setIsFollowing] = useState(
    followService.isFollowing(author.id) || Boolean(post.isFollowing)
  );
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.commentsList || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setComments(post.commentsList || []);
    setLikeCount(post.metrics?.likes ?? (post as any).likes ?? 0);
    setIsLiked(Boolean(post.isLiked));
    setIsFollowing(followService.isFollowing(author.id) || Boolean(post.isFollowing));
    setIsSaved(Boolean(post.isSaved));

    const handleFollowsUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.targetUserId === author.id) {
        setIsFollowing(Boolean(ce.detail.following));
      }
    };

    window.addEventListener(FOLLOWS_UPDATED_EVENT, handleFollowsUpdated);
    return () => {
      window.removeEventListener(FOLLOWS_UPDATED_EVENT, handleFollowsUpdated);
    };
  }, [post, author.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      showToast('Liked post');
    }
    if (onLikeToggle) {
      onLikeToggle(post.id);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await followService.toggleFollow(author.id, author);
      setIsFollowing(res.following);
      showToast(
        res.following
          ? `You are now following ${author.name}`
          : `Unfollowed ${author.name}`,
        'success'
      );
    } catch {
      showToast('Failed to update follow status.', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Post link copied to clipboard!');
  };

  const handleReport = () => {
    showToast('Report submitted. Thank you for keeping XENTRO safe.', 'info');
    setShowMenu(false);
  };

  const handleSave = () => {
    const next = !isSaved;
    setIsSaved(next);

    const isFounderOrStartup =
      author.role?.toLowerCase().includes('founder') ||
      author.role?.toLowerCase().includes('startup') ||
      author.role?.toLowerCase().includes('ceo');

    if (isFounderOrStartup) {
      toggleStartupBookmark({
        id: `st_${author.id}`,
        name: author.company || author.name,
        logo: author.avatar,
        tagline: post.content.slice(0, 140),
        founder: author.name,
        sector: 'Tech & Innovation',
        stage: 'Seed',
      });
    }

    showToast(next ? 'Saved to bookmarks' : 'Removed from bookmarks');
    setShowMenu(false);
  };

  const handleOpenAuthorProfile = () => {
    // Determine profile type
    const role = (post.authorRoleType || author.role || '').toLowerCase();
    let type: 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer' = 'startup';
    if (role.includes('explorer') || role.includes('member') || role.includes('guest')) {
      type = 'explorer';
    } else if (role.includes('mentor') || role.includes('advisor')) {
      type = 'mentor';
    } else if (role.includes('investor') || role.includes('partner') || role.includes('capital') || role.includes('fund') || role.includes('angel')) {
      type = 'investor';
    } else if (role.includes('esp') || role.includes('incubator') || role.includes('accelerator')) {
      type = 'esp';
    } else {
      type = 'startup';
    }

    if (typeof window !== 'undefined') {
      const authorName = author.name || 'Ecosystem Member';
      const companyName = author.company || `${authorName}'s Venture`;
      const authorAvatar = author.avatar || '/xentro-logo.png';
      const authorRole = author.role || (type === 'mentor' ? 'Verified Mentor' : 'Founder');

      let profileData: any = undefined;
      if (type === 'startup') {
        profileData = {
          id: author.id,
          identity: {
            name: companyName,
            logo: authorAvatar,
            tagline: `${authorRole} & Venture by ${authorName}`,
            stage: 'Seed',
            industry: 'Technology & Innovation',
            subSector: 'Ecosystem Venture',
            businessModelType: 'B2B',
            operatingGeography: ['India'],
            foundedYear: 2024,
            website: '',
            linkedin: '',
            founderName: authorName,
            contactEmail: `${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@xentro.network`,
            city: 'Hyderabad',
            country: 'India',
            companyRegistrationType: 'Private Limited (Pvt Ltd)',
            cinNumber: 'U72900TG2024PTC188299',
          },
          basicInfo: {
            description: `Active venture led by ${authorName}. Driving collaborative digital innovation.`,
            vision: 'Accelerating cross-entity ecosystem development.',
            mission: 'Deliver high-quality scalable digital technology.',
            problem: 'Fragmented deal flow and network access.',
            solution: 'Unified interaction and direct stakeholder connections.',
            targetAudience: 'Ecosystem Startups & Enterprise Partners',
            businessModel: 'B2B Subscription & Services',
            revenueModel: 'Direct & Platform Fee',
          },
          teamMembers: [
            {
              id: `tm_${author.id}`,
              name: authorName,
              role: authorRole,
              avatar: authorAvatar,
              isFounder: true,
            }
          ],
        };
      } else if (type === 'mentor') {
        profileData = {
          id: author.id,
          name: authorName,
          title: authorRole,
          organization: companyName,
          avatar: authorAvatar,
          industry: 'Advisory & Strategy',
          location: 'Global / Remote',
          bio: `Experienced ecosystem mentor and advisor assisting high-growth founders.`,
          skills: ['Fundraising', 'Growth', 'Product Architecture'],
          verified: true,
          sessionsCompleted: 12,
          rating: 4.9,
        };
      } else if (type === 'explorer') {
        profileData = {
          id: author.id,
          name: authorName,
          role: authorRole,
          organization: companyName,
          avatar: authorAvatar,
          bio: `Active ecosystem member exploring innovation and collaborative partnerships.`,
        };
      }

      window.dispatchEvent(
        new CustomEvent('xentro-open-profile', {
          detail: {
            type,
            id: author.id,
            data: profileData,
          },
        })
      );
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    // Comment authorship is ALWAYS the signed-in profile (never the mock "Profile" user)
    const profile = getUserProfile();
    const newComment: PostComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      author: {
        id: profile.id,
        name: profile.name || 'Xentro User',
        username: (profile.name || 'xentro').toLowerCase().replace(/[^a-z0-9]/g, ''),
        role: profile.roleTitle || profile.role,
        company: profile.organization || undefined,
        avatar: profile.avatar || GUEST_AVATAR,
        verified: false,
      },
      content: newCommentText.trim(),
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    // Persist through the feed service so comments survive a page refresh
    const updated = feedService.addComment(post.id, newComment);
    const refreshed = updated.find((p) => p.id === post.id);
    setComments(refreshed?.commentsList || [...comments, newComment]);
    setNewCommentText('');
    showToast('Comment added');
  };

  return (
    <article className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 sm:p-6 shadow-subtle mb-4 transition-all">
      {/* Post Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            onClick={handleOpenAuthorProfile}
            className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-[#D9FF3F] transition-all"
            title={`View ${author.name}'s Profile`}
          >
            <img
              src={author.avatar}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={handleOpenAuthorProfile}
                className="font-bold text-sm text-[#101212] dark:text-white hover:text-[#9EBE12] dark:hover:text-[#D9FF3F] cursor-pointer transition-colors font-heading"
                title={`View ${author.name}'s Profile`}
              >
                {author.name}
              </span>
              {author.verified && (
                <span
                  title="Verified Organization"
                  className="w-4 h-4 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center text-[9px] font-black shadow-2xs"
                >
                  ✓
                </span>
              )}
              {post.postType && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7] border border-gray-200 dark:border-[#383D3B]">
                  {post.postType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7] flex-wrap">
              <span>{post.timestamp}</span>
              <span>•</span>
              <span className="truncate max-w-[200px] sm:max-w-xs">{author.role}</span>
              {author.company && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-[#101212] dark:text-white truncate max-w-[140px]">
                    {author.company}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 relative">
          {!isMe && (
            <button
              onClick={handleFollow}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                isFollowing
                  ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40'
                  : 'text-[#101212] dark:text-white border-[#E5E7EB] dark:border-[#262A29] hover:bg-[#D9FF3F] hover:text-[#101212] hover:border-[#D9FF3F] active:scale-95'
              }`}
            >
              {isFollowing ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#9EBE12]" /> Following
                </span>
              ) : (
                '+ Follow'
              )}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#565B59] dark:text-[#B6B8B7] transition-colors active:scale-90"
              aria-label="Post actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#181B1A] rounded-xl shadow-dropdown border border-[#E5E7EB] dark:border-[#262A29] py-1.5 z-20 text-xs animate-fade-slide">
                <button
                  onClick={handleSave}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#0D0F0F] flex items-center gap-2 text-[#101212] dark:text-gray-300 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {isSaved ? 'Unsave post' : 'Save post'}
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#0D0F0F] flex items-center gap-2 text-[#101212] dark:text-gray-300 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Copy post link
                </button>
                <button
                  onClick={handleReport}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#0D0F0F] flex items-center gap-2 text-red-600 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mt-3.5 text-sm leading-relaxed text-[#101212] dark:text-gray-100 whitespace-pre-line">
        {post.content}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-[#D9FF3F] bg-gray-100 dark:bg-[#0D0F0F] px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Media Rendering */}
      {post.media && (
        <div className="mt-3.5 rounded-xl overflow-hidden border border-gray-100 dark:border-[#262A29] bg-gray-900 relative">
          {post.media.caption === 'AI for a more open future' ? (
            /* Custom Hero AI graphic matching brand guidelines */
            <div className="w-full aspect-[2.4/1] bg-gradient-to-r from-[#0D0F0F] via-[#181B1A] to-[#121614] relative flex items-center justify-center p-6 overflow-hidden select-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(217,255,63,0.22),transparent_60%)]" />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-60 bg-gradient-to-l from-[#D9FF3F]/15 to-transparent blur-2xl" />
              <div className="relative z-10 text-center flex flex-col items-center">
                <span className="font-sora text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                  AI
                </span>
                <span className="text-sm sm:text-base font-medium text-[#D9FF3F] mt-1">
                  for a more open future
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full relative max-h-[420px] overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <img
                src={post.media.url}
                alt={post.media.alt}
                loading="lazy"
                className="w-full h-full object-cover max-h-[420px] transition-opacity duration-300"
              />
              {post.media.caption && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white font-medium">
                  {post.media.caption}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Metrics & Interaction Bar */}
      <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#262A29] flex items-center justify-between text-xs text-[#565B59] dark:text-[#B6B8B7]">
        {/* Left Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 font-medium transition-colors active:scale-90 ${
              isLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                isLiked ? 'fill-red-500 scale-110 animate-pop' : 'hover:scale-110'
              }`}
            />
            <span>{likeCount.toLocaleString()}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>{post.metrics?.shares || 0}</span>
          </button>

          {/* Report */}
          <button
            onClick={handleReport}
            className="flex items-center gap-1.5 hover:text-amber-600 transition-colors hidden xs:flex"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>

        {/* Bookmark Save */}
        <button
          onClick={handleSave}
          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isSaved ? 'text-[#101212] dark:text-[#D9FF3F]' : ''
          }`}
          aria-label="Save post"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#D9FF3F] text-[#9EBE12]' : ''}`} />
        </button>
      </div>

      {/* Expandable Comments Tray */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#262A29] space-y-3 animate-in fade-in duration-200">
          {/* Add comment input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={getUserProfile().avatar || currentUser.avatar}
                alt={getUserProfile().name || currentUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex items-center bg-[#F8FAFC] dark:bg-[#0D0F0F] rounded-full px-3.5 py-1.5 border border-transparent focus-within:border-[#D9FF3F]">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a constructive comment..."
                className="w-full bg-transparent text-xs text-[#101212] dark:text-white outline-none"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="text-[#101212] dark:text-[#D9FF3F] disabled:text-gray-300 p-1 font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Existing comments list */}
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5 pt-2">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 bg-[#F8FAFC] dark:bg-[#0D0F0F] rounded-xl p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#101212] dark:text-white font-heading">
                    {comment.author.name}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">{comment.timestamp}</span>
                </div>
                <p className="mt-1 text-[#565B59] dark:text-gray-300">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
