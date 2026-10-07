'use client';

import React, { useState } from 'react';
import { X, Users, Search, Check } from 'lucide-react';
import { FollowUserSummary, followService } from '@/lib/followService';
import { getUserProfile } from '@/lib/userProfile';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialTab?: 'followers' | 'following';
  followers: FollowUserSummary[];
  following: FollowUserSummary[];
  onOpenProfile?: (userId: string, userName: string) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  title,
  initialTab = 'followers',
  followers = [],
  following = [],
  onOpenProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');
  const myProfile = getUserProfile();

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(search.toLowerCase())) ||
      (u.company && u.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-sora">
                {title}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Community & Ecosystem Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 dark:border-[#262A29] px-5 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('followers')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'followers'
                ? 'text-[#101212] dark:text-[#D9FF3F]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Followers ({followers.length})
            {activeTab === 'followers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9FF3F]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'following'
                ? 'text-[#101212] dark:text-[#D9FF3F]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Following ({following.length})
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9FF3F]" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-[#262A29]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-gray-50 dark:divide-[#202422]">
          {filteredList.length > 0 ? (
            filteredList.map((user) => {
              const isFollowing = followService.isFollowing(user.id);
              const isMe = user.id === myProfile.id;

              return (
                <div
                  key={user.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-[#202422]/30 p-1.5 rounded-xl transition-colors"
                >
                  <div
                    onClick={() => {
                      if (onOpenProfile) onOpenProfile(user.id, user.name);
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-[#202422] shrink-0 border border-gray-200 dark:border-[#262A29]">
                      <img
                        src={user.avatar || '/xentro-logo.png'}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/xentro-logo.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                        {user.role} {user.company ? `• ${user.company}` : ''}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={async () => {
                        await followService.toggleFollow(user.id, user);
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all border shrink-0 cursor-pointer ${
                        isFollowing
                          ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40'
                          : 'text-[#101212] dark:text-white border-[#E5E7EB] dark:border-[#262A29] hover:bg-[#D9FF3F] hover:text-[#101212]'
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
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {search.trim() ? 'No members found matching search.' : `No ${activeTab} yet.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
