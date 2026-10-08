'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Briefcase,
  BarChart2,
  FileText,
} from 'lucide-react';
import { Post, User } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { authService } from '@/lib/auth/authService';
import { getUserProfile } from '@/lib/userProfile';

interface PostComposerProps {
  onAddPost: (newPost: Post) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onAddPost }) => {
  const [content, setContent] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [durableImageUrl, setDurableImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userState, setUserState] = useState<{ name: string; avatar: string; role: string; company?: string; id: string }>({
    id: 'user_active',
    name: 'Ecosystem Member',
    avatar: '/xentro-logo.png',
    role: 'Member',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const active = authService.getCurrentUser();
    const prof = authService.getPersonalProfile();
    const up = getUserProfile();

    const name = prof?.fullName || active?.fullName || up?.name || 'Ecosystem Member';
    const avatar = (prof?.photoUrl || (active as any)?.avatar || up?.avatar || '/xentro-logo.png') as string;
    const role = prof?.currentRole || (active as any)?.primaryRole || active?.activeRoles?.[0] || up?.roleTitle || 'Ecosystem Member';
    const company = prof?.currentOrganization || up?.organization || '';
    const id = active?.id || up?.id || 'usr_active';

    setUserState({ id, name, avatar, role, company });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      setSelectedFile(file);
      setImageFileName(file.name);

      // Instant local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        showToast('Image attached to post');
      };
      reader.readAsDataURL(file);

      // Upload in background to MongoDB Atlas media storage
      const fd = new FormData();
      fd.append('file', file);
      fetch('/api/upload', { method: 'POST', body: fd })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.url) {
            setDurableImageUrl(data.url);
          }
        })
        .catch((err) => console.warn('Background upload failed:', err));
    }
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() && !imagePreview) {
      showToast('Please type your thoughts or attach an image before posting', 'info');
      return;
    }

    let finalMediaUrl = durableImageUrl || imagePreview;

    // If still in data URL format, convert durably
    if (finalMediaUrl && finalMediaUrl.startsWith('data:')) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: finalMediaUrl }),
        });
        const data = await res.json();
        if (data?.success && data?.url) {
          finalMediaUrl = data.url;
        }
      } catch (_) {}
    }

    const postAuthor: User = {
      id: userState.id,
      name: userState.name,
      username: `@${userState.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      role: userState.role,
      company: userState.company,
      avatar: userState.avatar,
      verified: true,
    };

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: postAuthor,
      timestamp: 'Just now',
      category: activeType === 'Opportunity' ? 'opportunities' : 'all',
      content: content.trim(),
      tags: activeType ? [activeType, 'Innovation'] : ['Innovation', 'Tech'],
      media: finalMediaUrl
        ? {
            type: 'image',
            url: finalMediaUrl,
            alt: imageFileName || 'Post image',
            caption: imageFileName.replace(/\.[^/.]+$/, '') || undefined,
          }
        : undefined,
      metrics: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      commentsList: [],
    };

    onAddPost(newPost);
    setContent('');
    setActiveType(null);
    setImagePreview(null);
    setImageFileName('');
    setDurableImageUrl(null);
    setSelectedFile(null);
    showToast('Post published successfully!');
  };

  const handleActionClick = (type: string) => {
    if (type === 'Photo/Video' || type === 'Upload Image') {
      fileInputRef.current?.click();
      return;
    }
    if (activeType === type) {
      setActiveType(null);
    } else {
      setActiveType(type);
      showToast(`${type} mode selected`);
    }
  };

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-4 sm:p-5 shadow-subtle transition-all">
      {/* Top Row: Avatar + Rounded Input */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <img
            src={userState.avatar}
            alt={userState.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="flex-1 min-h-[44px] bg-[#F8FAFC] dark:bg-[#0D0F0F] rounded-full px-5 flex items-center border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-700 focus-within:bg-white dark:focus-within:bg-[#181B1A] transition-all">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-sm text-[#101212] dark:text-white placeholder-[#565B59] dark:placeholder-[#B6B8B7] outline-none"
          />
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Image Preview Card */}
      {imagePreview && (
        <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#101212] p-2.5 animate-fade-slide">
          <div className="relative max-h-56 rounded-lg overflow-hidden bg-black/5">
            <img
              src={imagePreview}
              alt="Attachment preview"
              className="w-full h-44 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setImageFileName('');
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs cursor-pointer shadow-md transition-all"
              title="Remove image"
            >
              ✕
            </button>
          </div>
          {imageFileName && (
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1.5 px-1 truncate">
              {imageFileName}
            </p>
          )}
        </div>
      )}

      {/* Active Type Indicator Badge (if any) */}
      {activeType && (
        <div className="mt-2.5 px-1 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#565B59]">Attached:</span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/50">
            {activeType}
          </span>
          <button
            onClick={() => setActiveType(null)}
            className="text-[10px] text-gray-400 hover:text-gray-600 underline"
          >
            remove
          </button>
        </div>
      )}

      {/* Action Row */}
      <div className="mt-3.5 pt-3 border-t border-[#F1F5F9] dark:border-[#262A29] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Upload Image / Photo */}
          <button
            type="button"
            onClick={() => handleActionClick('Upload Image')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              imagePreview
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Upload Image</span>
          </button>

          {/* Opportunity */}
          <button
            type="button"
            onClick={() => handleActionClick('Opportunity')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeType === 'Opportunity'
                ? 'bg-[#D9FF3F]/40 text-[#101212] dark:text-white font-bold'
                : 'hover:bg-[#D9FF3F]/20 text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212]'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#9EBE12]" />
            <span className="hidden sm:inline">Opportunity</span>
          </button>

          {/* Poll */}
          <button
            type="button"
            onClick={() => handleActionClick('Poll')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeType === 'Poll'
                ? 'bg-gray-200 text-[#101212] dark:bg-gray-800 dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-[#565B59] dark:text-[#B6B8B7]" />
            <span className="hidden sm:inline">Poll</span>
          </button>

          {/* Write Article */}
          <button
            type="button"
            onClick={() => handleActionClick('Article')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeType === 'Article'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Write article</span>
          </button>
        </div>

        {/* Primary Post Button */}
        <button
          type="button"
          onClick={handlePost}
          className="px-6 py-2 rounded-full bg-[#D9FF3F] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-95 text-[#101212] text-xs font-bold shadow-xs transition-all ml-auto"
        >
          Post
        </button>
      </div>
    </div>
  );
};
