'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { MentorMeeting, MentorshipRequest } from '@/types/mentor';

interface UpcomingSectionProps {
  meetings: MentorMeeting[];
  pendingRequests: MentorshipRequest[];
  onNavigateTab: (tabId: string) => void;
  onSelectFounder?: (founderId: string) => void;
}

export const UpcomingSection: React.FC<UpcomingSectionProps> = ({
  meetings,
  pendingRequests,
  onNavigateTab,
}) => {
  const upcomingMeetings = meetings.slice(0, 3);
  const pendingCount = pendingRequests.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left 2 Cols: Upcoming Meetings Schedule */}
      <div className="lg:col-span-2 bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white leading-tight">
                Upcoming Mentorship Sessions
              </h3>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Next confirmed meetings on your calendar
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('meetings')}
            className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
          >
            <span>Full Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Meeting Items */}
        <div className="space-y-2.5">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] hover:border-[#D9FF3F]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 mt-0.5">
                    <img
                      src={m.founder.avatar}
                      alt={m.founder.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        {m.founder.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                        {m.founder.startupName}
                      </span>
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">
                      {m.title}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-[#101212] dark:text-white">
                        <Clock className="w-3 h-3 text-[#9EBE12] dark:text-[#D9FF3F]" />
                        {m.date} · {m.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3 text-emerald-500" />
                        {m.mode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {m.meetingLink && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join Call</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
              No meetings scheduled for today.
            </div>
          )}
        </div>
      </div>

      {/* Right 1 Col: Pending Attention & Urgent Actions */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white leading-tight">
                  Attention Required
                </h3>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Pending founder requests
                </p>
              </div>
            </div>
          </div>

          {/* Pending requests card alert */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#101212] dark:text-white leading-snug">
                  {pendingCount} {pendingCount === 1 ? 'founder is' : 'founders are'} waiting for your response.
                </p>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Review new requests for Seed fundraising, GTM positioning, and AI system design.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('mentorship')}
              className="w-full py-2 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
            >
              <span>Review Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Availability Status Mini-Widget */}
          <div className="p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#101212] dark:text-white">
                Active Office Hours
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30">
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
              Mon · Tue · Thu (10:00 AM – 5:00 PM)
            </p>
            <button
              onClick={() => onNavigateTab('meetings')}
              className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold hover:underline"
            >
              Edit availability slots →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
