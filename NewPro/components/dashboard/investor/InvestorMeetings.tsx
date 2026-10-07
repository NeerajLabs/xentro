'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import { getUserProfile } from '@/lib/userProfile';
import { InvestorMeeting, InvestorDealStage } from '@/types/investor';

export const InvestorMeetings: React.FC = () => {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<InvestorMeeting[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  // Log Outcome Modal
  const [activeOutcomeMeeting, setActiveOutcomeMeeting] = useState<InvestorMeeting | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [outcomeStage, setOutcomeStage] = useState<InvestorDealStage>('due_diligence');

  // Schedule New Meeting Modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFounder, setNewFounder] = useState('');
  const [newDate, setNewDate] = useState('2026-03-30');
  const [newTime, setNewTime] = useState('02:00 PM IST');
  const [newDuration, setNewDuration] = useState('45 mins');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setMeetings(investorDomainService.getMeetings());

    const handleMeetingsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.meetings) {
        setMeetings(ce.detail.meetings);
      }
    };
    window.addEventListener('xentro-investor-meetings-changed', handleMeetingsChange);
    return () => {
      window.removeEventListener('xentro-investor-meetings-changed', handleMeetingsChange);
    };
  }, []);

  const filteredMeetings = meetings.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const handleExecuteOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutcomeMeeting) return;

    investorDomainService.logMeetingOutcome(activeOutcomeMeeting.id, outcomeStage, outcomeNotes);
    showToast(`Meeting logged! Deal stage updated to ${outcomeStage.replace('_', ' ').toUpperCase()}`, 'success');
    setActiveOutcomeMeeting(null);
    setOutcomeNotes('');
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeet = investorDomainService.scheduleMeeting({
      title: newTitle,
      founderName: newFounder,
      date: newDate,
      time: newTime,
      duration: newDuration,
      status: 'scheduled',
      meetingLink: 'https://meet.google.com/xnt-apex-session',
      attendees: [getUserProfile().name || 'Investor', newFounder],
      notes: newNotes,
    });
    showToast(`Pitch session scheduled with ${newFounder}!`, 'success');
    setIsScheduleOpen(false);
    setNewTitle('');
    setNewFounder('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Pitch Meetings & Partner Syncs</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Meeting outcomes automatically propagate into Deal Flow pipeline stages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                filter === 'scheduled'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* 2. Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.map((meet) => (
          <div
            key={meet.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#D9FF3F]/50 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    meet.status === 'scheduled'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {meet.status}
                </span>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  {meet.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  {meet.date} &bull; {meet.time} ({meet.duration})
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Founder: <strong className="text-[#101212] dark:text-white">{meet.founderName}</strong>
                </span>
              </div>

              {meet.notes && (
                <p className="text-xs text-[#565B59] dark:text-[#8E9390] p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422]">
                  {meet.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
              {meet.status === 'scheduled' && meet.meetingLink && (
                <a
                  href={meet.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] flex items-center gap-1.5 transition-all"
                >
                  <Video className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Join Call</span>
                </a>
              )}

              {meet.status === 'scheduled' ? (
                <button
                  onClick={() => {
                    setActiveOutcomeMeeting(meet);
                    setOutcomeNotes(meet.notes || '');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Outcome</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed & Logged</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Log Outcome Modal */}
      {activeOutcomeMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Log Meeting Outcome
              </h3>
              <button onClick={() => setActiveOutcomeMeeting(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteOutcome} className="space-y-3.5 text-xs">
              <p className="text-gray-400">
                Logging sync with <strong className="text-white">{activeOutcomeMeeting.founderName}</strong> ({activeOutcomeMeeting.title}).
              </p>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">
                  Update Deal Flow Pipeline Stage:
                </label>
                <select
                  value={outcomeStage}
                  onChange={(e) => setOutcomeStage(e.target.value as InvestorDealStage)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  <option value="due_diligence">Advance to Due Diligence</option>
                  <option value="evaluation">Advance to Partner Evaluation</option>
                  <option value="term_discussion">Advance to Term Sheet Discussion</option>
                  <option value="passed">Pass on Opportunity</option>
                </select>
                <p className="text-[10px] text-gray-500">
                  This will automatically transition the startup’s stage across your firm CRM.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Partner Meeting Notes & IC Synthesis:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summary of founder responses, traction validation, and next diligence steps..."
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOutcomeMeeting(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Complete & Update Deal Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Schedule Pitch Call
              </h3>
              <button onClick={() => setIsScheduleOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Session Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Diligence Deep Dive"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Founder Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Founder Name"
                  value={newFounder}
                  onChange={(e) => setNewFounder(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#101212] dark:text-white">Date:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#101212] dark:text-white">Time:</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Call Agenda & Context:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Review customer CAC, pipeline conversion, and US expansion plans."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Schedule Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
