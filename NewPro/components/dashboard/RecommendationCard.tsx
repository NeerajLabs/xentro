'use client';

import React, { useState, useEffect } from 'react';
import { Recommendation } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Check } from 'lucide-react';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';

interface RecommendationCardProps {
  item: Recommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ item }) => {
  const { showToast } = useToast();
  const targetUserId = item.userId || item.id;
  const profileType: 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer' =
    item.type ||
    (item.category === 'mentors'
      ? 'mentor'
      : item.category === 'investors'
      ? 'investor'
      : item.category === 'people'
      ? 'explorer'
      : 'startup');

  const [connStatus, setConnStatus] = useState<'none' | 'pending' | 'received' | 'connected'>(() =>
    connectionService.getConnectionStatus(targetUserId)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setConnStatus(connectionService.getConnectionStatus(targetUserId));
    };
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('xentro-connection-event', handleUpdate);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('xentro-connection-event', handleUpdate);
    };
  }, [targetUserId]);

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connStatus === 'none') {
      setConnStatus('pending');
      await connectionService.requestConnection({
        id: targetUserId,
        name: item.name,
        role: item.title,
        avatar: item.avatar || '/xentro-logo.png',
      });
      showToast(`Connection request sent to ${item.name}`, 'success');
    } else if (connStatus === 'pending') {
      connectionService.cancelConnection(targetUserId);
      setConnStatus('none');
      showToast(`Cancelled request to ${item.name}`, 'info');
    } else if (connStatus === 'received') {
      setConnStatus('connected');
      await connectionService.acceptConnection(targetUserId);
      showToast(`Accepted connection with ${item.name}!`, 'success');
    }
  };

  const handleOpenProfile = () => {
    if (typeof window !== 'undefined') {
      let profileData: any = undefined;
      if (profileType === 'startup') {
        profileData = {
          id: targetUserId,
          identity: {
            name: item.name,
            logo: item.avatar || '/xentro-logo.png',
            tagline: item.title,
            stage: 'Seed',
            industry: item.context || 'Technology',
            subSector: 'Ecosystem Venture',
            businessModelType: 'B2B',
            operatingGeography: ['India'],
            foundedYear: 2024,
            founderName: item.name,
            contactEmail: `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@xentro.network`,
          },
          basicInfo: {
            description: `${item.name} is an active venture on Xentro. ${item.title}.`,
            vision: 'Accelerating growth and innovation.',
            mission: 'Delivering exceptional customer value.',
            targetAudience: 'Ecosystem Partners',
          },
          teamMembers: [
            {
              id: `tm_${targetUserId}`,
              name: item.name,
              role: 'Founder & CEO',
              avatar: item.avatar || '/xentro-logo.png',
              isFounder: true,
            }
          ],
        };
      } else if (profileType === 'mentor') {
        profileData = {
          id: targetUserId,
          name: item.name,
          title: item.title,
          organization: item.context || 'Advisory Network',
          avatar: item.avatar || '/xentro-logo.png',
          industry: 'Mentorship & Advisory',
          location: 'Global / Remote',
          bio: `${item.name} is a verified ecosystem mentor specializing in ${item.title}.`,
          skills: ['Strategy', 'Leadership', 'Scaling'],
          verified: true,
          sessionsCompleted: 8,
          rating: 4.9,
        };
      } else if (profileType === 'investor') {
        profileData = {
          id: targetUserId,
          name: item.name,
          title: item.title,
          organization: item.context || 'Venture Partner',
          avatar: item.avatar || '/xentro-logo.png',
          bio: `${item.name} is an active investment partner on Xentro specializing in early stage ventures.`,
          checkSizeMin: 50000,
          checkSizeMax: 500000,
        };
      } else if (profileType === 'esp') {
        profileData = {
          id: targetUserId,
          name: item.name,
          title: item.title,
          organization: item.context || 'Incubator & Innovation Hub',
          avatar: item.avatar || '/xentro-logo.png',
          bio: `${item.name} is an active Ecosystem Support Provider fostering startup growth.`,
        };
      } else if (profileType === 'explorer') {
        profileData = {
          id: targetUserId,
          name: item.name,
          role: item.title,
          organization: item.company || item.context || 'Ecosystem Explorer',
          avatar: item.avatar || '/xentro-logo.png',
          bio: `${item.name} is an active ecosystem member exploring innovation and collaborative partnerships.`,
        };
      }

      window.dispatchEvent(
        new CustomEvent('xentro-open-profile', {
          detail: {
            type: profileType,
            id: targetUserId,
            data: profileData,
          },
        })
      );
    }
  };

  const isConnected = connStatus === 'connected';
  const isPending = connStatus === 'pending';
  const isReceived = connStatus === 'received';

  return (
    <div
      onClick={handleOpenProfile}
      className="recommendation-profile-card flex items-center justify-between gap-2.5 py-2 px-2.5 -mx-1 rounded-xl border border-transparent hover:bg-gray-50 dark:hover:bg-[#181B1A] group cursor-pointer transition-all"
    >
      {/* Avatar & Details */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-black flex items-center justify-center">
          <img
            src={item.avatar || '/xentro-logo.png'}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/xentro-logo.png';
            }}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-[13px] font-bold text-[#101212] dark:text-white truncate hover:text-[#9EBE12] cursor-pointer transition-colors font-heading">
            {item.name}
          </h4>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate leading-tight">
            {item.title}
          </p>
          <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate mt-0.5">
            {item.context}
          </p>
        </div>
      </div>

      {/* Connect Action Button */}
      <button
        type="button"
        onClick={handleConnect}
        className={`flex-shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
          isConnected
            ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40'
            : isPending
            ? 'bg-gray-100 text-[#565B59] border border-gray-200 dark:bg-[#0D0F0F] dark:text-[#B6B8B7] dark:border-[#262A29]'
            : isReceived
            ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-2xs'
            : 'bg-[#D9FF3F] hover:bg-[#C7F020] active:bg-[#9EBE12] text-[#101212] shadow-2xs active:scale-95'
        }`}
      >
        {isConnected ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-[#9EBE12]" /> Connected
          </span>
        ) : isPending ? (
          <span>Pending</span>
        ) : isReceived ? (
          <span>Accept</span>
        ) : (
          <span>Connect</span>
        )}
      </button>
    </div>
  );
};
