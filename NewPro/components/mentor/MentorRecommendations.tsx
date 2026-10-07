'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  ArrowRight,
  Check,
  Award,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { DiscoverStartup, MentorOpportunityItem, FounderInfo } from '@/types/mentor';
import { useToast } from '@/components/ui/Toast';
import { FounderProfileModal } from './FounderProfileModal';
import { messagingService } from '@/lib/messagingService';

interface MentorRecommendationsProps {
  recommendedStartups: DiscoverStartup[];
  recommendedOpportunities: MentorOpportunityItem[];
  onNavigateOpportunities?: () => void;
  onNavigateDiscover?: () => void;
}

export const MentorRecommendations: React.FC<MentorRecommendationsProps> = ({
  recommendedStartups,
  recommendedOpportunities,
  onNavigateOpportunities,
  onNavigateDiscover,
}) => {
  const { showToast } = useToast();
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({});
  const [selectedFounder, setSelectedFounder] = useState<FounderInfo | null>(null);

  const handleConnect = (st: DiscoverStartup) => {
    setConnectedMap((prev) => ({ ...prev, [st.id]: !prev[st.id] }));
    if (!connectedMap[st.id]) {
      showToast(`Connection request sent to ${st.name}!`, 'success');
    } else {
      showToast(`Cancelled connection to ${st.name}.`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Recommended Startups Section */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101212] dark:text-[#D9FF3F] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Tailored for your AI & GTM Expertise</span>
            </div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Recommended Startups
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Startups that may benefit from your expertise in scalable architectures and technical diligence.
            </p>
          </div>

          {onNavigateDiscover && (
            <button
              onClick={onNavigateDiscover}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>Explore All Startups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedStartups.slice(0, 3).map((st) => {
            const isConnected = connectedMap[st.id];
            return (
              <div
                key={st.id}
                className="recommendation-profile-card p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      <img src={st.logo} alt={st.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white leading-tight">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-[#101212] dark:text-[#D9FF3F] font-semibold">{st.industry}</p>
                      <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">{st.stage} · {st.location}</p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#565B59] dark:text-[#B6B8B7]">Looking for:</span>
                    <p className="text-xs text-[#101212] dark:text-gray-300 font-semibold">
                      {st.needsHelpWith.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#262A29] gap-2">
                  <button
                    onClick={() =>
                      setSelectedFounder({
                        id: `f_${st.id}`,
                        name: st.founder.name,
                        avatar: st.founder.avatar,
                        title: st.founder.role,
                        startupName: st.name,
                        startupStage: st.stage,
                        startupSector: st.industry,
                        location: st.location,
                        bio: st.description,
                        raised: st.fundingRaised,
                        traction: st.metrics,
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-colors"
                  >
                    View Startup
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleConnect(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40'
                          : 'bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-2xs'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <span>Connect</span>
                      )}
                    </button>

                    {isConnected && (
                      <button
                        onClick={() =>
                          messagingService.startOrOpenConversation({
                            id: st.id,
                            name: st.name,
                            role: st.industry || 'Startup',
                            avatar: st.logo || '/xentro-logo.png',
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={`Message ${st.name}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Message</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Recommended Opportunities Section */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101212] dark:text-[#D9FF3F] uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Strategic Engagements</span>
            </div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Recommended Opportunities for You
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Advisory board seats, accelerator cohorts, judging panels, and keynotes.
            </p>
          </div>

          {onNavigateOpportunities && (
            <button
              onClick={onNavigateOpportunities}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>View All Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedOpportunities.slice(0, 2).map((op) => (
            <div
              key={op.id}
              className="recommendation-profile-card p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {op.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">
                    {op.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#101212] dark:text-white leading-snug">
                  {op.title}
                </h4>
                <p className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F]">{op.organization}</p>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                  {op.description}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {op.type}
                </span>
                <button
                  onClick={() => showToast(`Opening opportunity details: ${op.title}`)}
                  className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                >
                  <span>View Opportunity</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Founder Modal */}
      <FounderProfileModal
        founder={selectedFounder}
        isOpen={Boolean(selectedFounder)}
        onClose={() => setSelectedFounder(null)}
      />
    </div>
  );
};
