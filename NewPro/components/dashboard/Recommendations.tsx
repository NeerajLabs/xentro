'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RecommendationCategory, Recommendation } from '@/types';
import { RecommendationCard } from './RecommendationCard';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';

export const Recommendations: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<RecommendationCategory>('people');
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [backendItems, setBackendItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    setUserProfile(getUserProfile());
    const handleRoleChanged = () => setUserProfile(getUserProfile());
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    return () => window.removeEventListener('xentro-role-changed', handleRoleChanged);
  }, []);

  // Fetch real ecosystem users from MongoDB Atlas backend API
  useEffect(() => {
    let isCancelled = false;
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const myId = userProfile.id || '';
        const myEmail = userProfile.email || '';
        const params = new URLSearchParams();
        if (myId) params.set('excludeUserId', myId);
        if (myEmail) params.set('excludeEmail', myEmail);

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const recData = data?.data;
          if (recData && !isCancelled) {
            const allItems: Recommendation[] = [];
            if (Array.isArray(recData.people)) allItems.push(...recData.people);
            if (Array.isArray(recData.mentors)) allItems.push(...recData.mentors);
            if (Array.isArray(recData.investors)) allItems.push(...recData.investors);
            if (Array.isArray(recData.opportunities)) allItems.push(...recData.opportunities);
            setBackendItems(allItems);
          }
        }
      } catch (err) {
        console.debug('Failed to load real recommendations:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      isCancelled = true;
    };
  }, [userProfile.id, userProfile.email]);

  const categories: { id: RecommendationCategory; label: string }[] = [
    { id: 'people', label: 'People' },
    { id: 'mentors', label: 'Mentors' },
    { id: 'investors', label: 'Investors' },
    { id: 'opportunities', label: 'Opportunities' },
  ];

  // Dynamically tailor real recommendations excluding the logged-in user
  const tailoredItems: Recommendation[] = useMemo(() => {
    const myEmail = userProfile.email?.toLowerCase().trim() || '';
    const myName = userProfile.name?.toLowerCase().trim() || '';
    const myId = (userProfile.id || '').toLowerCase().trim();

    return backendItems.filter((item) => {
      const itemUser = (item.userId || item.id || '').toLowerCase().trim();
      const itemName = (item.name || '').toLowerCase().trim();
      if (myId && itemUser === myId) return false;
      if (myEmail && (itemUser === myEmail || itemUser.includes(myEmail))) return false;
      if (myName && itemName === myName) return false;
      return true;
    });
  }, [backendItems, userProfile]);

  const filteredItems = tailoredItems.filter(
    (item) => item.category === activeCategory
  );

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-3.5 sm:p-4 shadow-subtle mb-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm sm:text-[15px] font-bold text-[#101212] dark:text-white font-heading">
            Recommendations
          </h3>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">
            {filteredItems.length}
          </span>
        </div>
        <button
          onClick={() => showToast(`Displaying ${filteredItems.length} ecosystem recommendations`)}
          className="text-[11px] font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-100 dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 active:scale-95 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#D9FF3F] text-[#101212] shadow-2xs'
                  : 'text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Recommendations List: Shows at most 5 items vertically, with a smooth scroller for the rest */}
      <div
        key={activeCategory}
        className="max-h-[305px] overflow-y-auto pr-1 space-y-0.5 divide-y divide-gray-50 dark:divide-gray-800/60 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 animate-fade-slide"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <RecommendationCard key={item.id} item={item} />
          ))
        ) : (
          <div className="py-6 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#D9FF3F] border-t-transparent rounded-full animate-spin" />
                <span>Loading recommendations...</span>
              </div>
            ) : (
              `No other ${activeCategory} found.`
            )}
          </div>
        )}
      </div>
    </div>
  );
};
