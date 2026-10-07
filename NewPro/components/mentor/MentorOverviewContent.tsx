'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Star,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  getActiveMentorships,
  getMentorshipRequests,
  acceptMentorshipRequest,
  declineMentorshipRequest,
} from '@/lib/mentorshipService';
import { connectionService, normalizeUserId, ConnectionRecord } from '@/lib/connectionService';
import { getUserProfile } from '@/lib/userProfile';
import { MENTORSHIP, MENTORSHIP_REQUEST } from '@/types/mentor';

interface MentorOverviewContentProps {
  onNavigateModule?: (moduleId: string) => void;
}

export const MentorOverviewContent: React.FC<MentorOverviewContentProps> = ({
  onNavigateModule,
}) => {
  const { showToast } = useToast();
  const [connections, setConnections] = useState<ConnectionRecord[]>(() => connectionService.getRawConnections());
  const [activeMentees, setActiveMentees] = useState<MENTORSHIP[]>(() => getActiveMentorships());
  const [mentorshipRequests, setMentorshipRequests] = useState<MENTORSHIP_REQUEST[]>(() => getMentorshipRequests());

  const refreshData = () => {
    setConnections(connectionService.getRawConnections());
    setActiveMentees(getActiveMentorships());
    setMentorshipRequests(getMentorshipRequests());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xentro-connections-updated', refreshData);
    window.addEventListener('xentro-connection-event', refreshData);
    window.addEventListener('xentro-mentorship-changed', refreshData);
    window.addEventListener('xentro-role-changed', refreshData);
    return () => {
      window.removeEventListener('xentro-connections-updated', refreshData);
      window.removeEventListener('xentro-connection-event', refreshData);
      window.removeEventListener('xentro-mentorship-changed', refreshData);
      window.removeEventListener('xentro-role-changed', refreshData);
    };
  }, []);

  const currentUser = getUserProfile();
  const currentNorm = normalizeUserId(currentUser.id);

  // Incoming pending connection requests sent to this mentor
  const incomingConnectionRequests = connections.filter(
    (c) => normalizeUserId(c.recipientId) === currentNorm && c.status === 'pending'
  );

  // Incoming structured mentorship requests
  const pendingMentorshipRequests = mentorshipRequests.filter(
    (r) => r.status === 'REQUESTED'
  );

  const totalPending = incomingConnectionRequests.length + pendingMentorshipRequests.length;

  const handleConnectionAction = async (partnerId: string, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      await connectionService.acceptConnection(partnerId);
      showToast('Connection accepted! Kickoff chat initialized.', 'success');
    } else {
      await connectionService.declineConnection(partnerId);
      showToast('Connection declined.', 'info');
    }
    refreshData();
  };

  const handleMentorshipAction = (requestId: string, action: 'accept' | 'decline', startupName: string) => {
    if (action === 'accept') {
      acceptMentorshipRequest(requestId);
      showToast(`Advisory session accepted with ${startupName}! Meeting link generated.`, 'success');
    } else {
      declineMentorshipRequest(requestId);
      showToast(`Declined request from ${startupName}.`, 'info');
    }
    refreshData();
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top 4 Mentor KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Active Mentees</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {activeMentees.length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Startups Guided
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Across AI, FinTech & BioTech
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Connections</span>
            <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {connectionService.getConnectedCount()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Network
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Active platform contacts
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Founder Rating</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              5.0
            </span>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">/ 5.0</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            Top Rated Advisor
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Pending Requests</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
              {totalPending}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              Awaiting Review
            </span>
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {totalPending > 0 ? `${totalPending} new inbound request(s)` : 'All caught up'}
          </p>
        </div>
      </div>

      {/* Middle Grid: Pending Requests & Scheduled Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Queue (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Incoming Mentorship & Advisory Requests
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Startups requesting 1-on-1 strategic guidance, connection, and architecture review
              </p>
            </div>
            <button
              onClick={() => onNavigateModule?.('mentorship')}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {totalPending > 0 ? (
              <>
                {/* 1. Inbound Connection Requests */}
                {incomingConnectionRequests.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 hover:border-[#D9FF3F]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={conn.senderAvatar || '/xentro-logo.png'}
                          alt={conn.senderName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                              {conn.senderName}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                              Connection Request
                            </span>
                          </div>
                          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                            {conn.senderRole}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#8E9390]">
                        Just now
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-xs">
                      <span className="font-bold text-[#101212] dark:text-white mr-1.5">Note:</span>
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">
                        Looking to connect and establish structured advisory synergy on Xentro platform.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleConnectionAction(conn.senderId, 'decline')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleConnectionAction(conn.senderId, 'accept')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Connection</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Inbound Structured Mentorship Requests */}
                {pendingMentorshipRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 hover:border-[#D9FF3F]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img src={req.founder.avatar} alt={req.founder.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                              {req.startup.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                              {req.startup.stage}
                            </span>
                          </div>
                          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                            Founder: {req.founder.name} &bull; {req.startup.industry}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#8E9390]">
                        {req.requestDate}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-xs">
                      <span className="font-bold text-[#101212] dark:text-white mr-1.5">Topic:</span>
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">{req.reasonForRequest}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleMentorshipAction(req.id, 'decline', req.startup.name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleMentorshipAction(req.id, 'accept', req.startup.name)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Schedule</span>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] text-xs">
                All requests reviewed! You're completely up to date. New connection requests from startups will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Sessions (1 Column) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Upcoming Calls
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D9FF3F] text-[#101212]">
              Live
            </span>
          </div>

          <div className="space-y-3">
            {activeMentees.length > 0 ? (
              activeMentees.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#565B59] dark:text-[#D9FF3F]" />
                      {m.nextMeeting || 'This Week · 11:00 AM'}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      1-on-1 Call
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <img src={m.founder.avatar} alt={m.founder.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                        {m.startupName}
                      </h5>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                        Founder: {m.founder.name}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast(`Launching meeting for ${m.startupName}`, 'success')}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Launch Google Meet</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center rounded-xl bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] text-xs space-y-2">
                <Clock className="w-6 h-6 mx-auto text-[#565B59] opacity-60" />
                <p>No upcoming calls scheduled.</p>
                <p className="text-[11px] opacity-75">Confirmed sessions with founders will appear here with launch links.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Active Mentee Portfolio */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Active Mentee Portfolio & Progress
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Founders and companies currently receiving your advisory support
            </p>
          </div>
          <button
            onClick={() => onNavigateModule?.('mentorship')}
            className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Structured Mentorship</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeMentees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeMentees.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2 group hover:border-[#D9FF3F]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                    {m.startupName}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[#565B59] dark:text-gray-300 font-semibold">
                    {m.startupSector}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Founder: {m.founder.name}
                </p>
                <div className="p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-xs">
                  <span className="font-bold text-[#101212] dark:text-white block text-[10px] uppercase tracking-wider text-[#565B59] mb-0.5">
                    Focus:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {m.mentorshipFocus?.join(' · ') || 'Active engagement'}
                  </span>
                </div>
                <div className="text-[10px] text-[#565B59] dark:text-[#8E9390] pt-1">
                  Started: {m.startDate} &bull; {m.timeRemaining}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] text-xs">
            No active mentorship engagements yet. Incoming requests accepted will show here with their milestone tracking.
          </div>
        )}
      </div>
    </div>
  );
};
