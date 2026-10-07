'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  ArrowRight,
  Check,
  X,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { MentorMeeting, MentorAvailabilityConfig, FounderInfo } from '@/types/mentor';
import { useToast } from '@/components/ui/Toast';
import { MentorAvailability } from './MentorAvailability';
import { FounderProfileModal } from './FounderProfileModal';

interface MentorMeetingsProps {
  meetings: MentorMeeting[];
  availabilityConfig: MentorAvailabilityConfig;
  defaultTab?: 'calendar' | 'upcoming' | 'availability';
}

export const MentorMeetings: React.FC<MentorMeetingsProps> = ({
  meetings: initialMeetings,
  availabilityConfig,
  defaultTab = 'calendar',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'availability'>(defaultTab);
  const [meetings, setMeetings] = useState<MentorMeeting[]>(initialMeetings);
  const [selectedFounder, setSelectedFounder] = useState<FounderInfo | null>(null);

  // Quick action: reschedule
  const handleReschedule = (meeting: MentorMeeting) => {
    showToast(`Reschedule request sent to ${meeting.founder.name}.`, 'info');
  };

  // Quick action: cancel
  const handleCancel = (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    showToast('Meeting cancelled and slots released.', 'info');
  };

  const tabs: { id: 'calendar' | 'upcoming' | 'availability'; label: string; count?: number }[] = [
    { id: 'calendar', label: 'Calendar View' },
    { id: 'upcoming', label: 'Upcoming Meetings', count: meetings.length },
    { id: 'availability', label: 'Availability Preferences' },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-2 shadow-subtle flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs transition-all duration-200 relative whitespace-nowrap flex items-center gap-2 group hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-transparent text-[#101212] dark:text-[#D9FF3F] font-bold scale-105'
                    : 'bg-transparent text-[#565B59] font-medium hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-[#D9FF3F]'
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D9FF3F] rounded-full" />
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setActiveTab('availability')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-all flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
            <span>Slots</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CALENDAR VIEW                                          */}
      {/* ========================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Calendar Week Ribbon */}
          <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>This Week's Mentorship Schedule</span>
              </h3>
              <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] font-mono">
                Sep 21 — Sep 27, 2026
              </span>
            </div>

            {/* Days grid strip */}
            <div className="grid grid-cols-7 gap-2">
              {[
                { day: 'Mon', date: '21', active: true, count: 1 },
                { day: 'Tue', date: '22', active: true, count: 1 },
                { day: 'Wed', date: '23', active: true, count: 1 },
                { day: 'Thu', date: '24', active: true, count: 1 },
                { day: 'Fri', date: '25', active: false, count: 0 },
                { day: 'Sat', date: '26', active: false, count: 0 },
                { day: 'Sun', date: '27', active: false, count: 0 },
              ].map((d, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    d.count > 0
                      ? 'border-[#D9FF3F]/50 bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 shadow-xs'
                      : 'border-gray-100 dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422]'
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold text-[#565B59]">{d.day}</p>
                  <p className={`text-base font-black mt-0.5 ${d.count > 0 ? 'text-[#101212] dark:text-[#D9FF3F]' : 'text-gray-700 dark:text-gray-300'}`}>{d.date}</p>
                  {d.count > 0 && (
                    <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chronological Meeting Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
              Upcoming Scheduled Sessions ({meetings.length})
            </h4>

            {meetings.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29]">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">No Scheduled Sessions</h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">You have no upcoming mentorship calls or meetings scheduled at this time.</p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#D9FF3F]/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => setSelectedFounder(m.founder)}
                      className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 cursor-pointer group"
                    >
                      <img
                        src={m.founder.avatar}
                        alt={m.founder.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#101212] dark:text-white">
                          {m.founder.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {m.founder.startupName}
                        </span>
                        {m.isMentee && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                            Active Mentee
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {m.title}
                      </p>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-xl">
                        Agenda: {m.agenda}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1">
                        <span className="flex items-center gap-1 font-bold text-[#101212] dark:text-white">
                          <Clock className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                          {m.date} · {m.time} ({m.duration})
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-emerald-500" />
                          {m.mode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleReschedule(m)}
                      className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold transition-colors"
                      title="Reschedule Session"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancel(m.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-colors"
                      title="Cancel Meeting"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. UPCOMING LIST TAB                                      */}
      {/* ========================================================= */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4 animate-fade-slide">
          {meetings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29]">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-[#101212] dark:text-white">No Upcoming Meetings</h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">Confirmed mentorship sessions and meetings will appear here once booked.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] bg-[#D9FF3F]/20 px-2.5 py-0.5 rounded-full">
                        {m.date} · {m.time}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#202422] text-gray-600 dark:text-gray-300">
                        {m.duration}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#101212] dark:text-white leading-snug">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      {m.agenda}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                      <img
                        src={m.founder.avatar}
                        alt={m.founder.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#101212] dark:text-white">{m.founder.name}</span>
                        <span className="text-[#565B59] dark:text-[#B6B8B7]"> ({m.founder.startupName})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#262A29]">
                    <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{m.mode}</span>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#C7F020] transition-all"
                      >
                        <Video className="w-3 h-3" />
                        <span>Join</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. AVAILABILITY PREFERENCES TAB                           */}
      {/* ========================================================= */}
      {activeTab === 'availability' && (
        <div className="animate-fade-slide">
          <MentorAvailability initialConfig={availabilityConfig} />
        </div>
      )}

      {/* Founder Profile Modal */}
      <FounderProfileModal
        founder={selectedFounder}
        isOpen={Boolean(selectedFounder)}
        onClose={() => setSelectedFounder(null)}
      />
    </div>
  );
};
