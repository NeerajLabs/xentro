'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  Search,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { mockESPEvents } from '@/data/espWorkspaceData';
import { ESPEvent } from '@/types/esp';

interface ESPEventsManagerProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ESPEventsManager: React.FC<ESPEventsManagerProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<ESPEvent[]>(mockESPEvents);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Upcoming' | 'Live' | 'Completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ESPEvent['type']>('Demo Day');
  const [date, setDate] = useState('Nov 20, 2026');
  const [time, setTime] = useState('10:00 AM - 4:00 PM IST');
  const [location, setLocation] = useState('Main Auditorium & Virtual Stream');
  const [format, setFormat] = useState<ESPEvent['format']>('Hybrid');
  const [maxCapacity, setMaxCapacity] = useState(250);
  const [description, setDescription] = useState('');
  const [speakers, setSpeakers] = useState('Director of Incubation, Keynote Investors');

  const filteredEvents = events.filter((evt) => {
    if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.type.toLowerCase().includes(q) ||
      evt.location.toLowerCase().includes(q)
    );
  });

  const handleScheduleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newEvt: ESPEvent = {
      id: `evt_created_${Date.now()}`,
      title,
      type,
      date,
      time,
      location,
      format,
      rsvpsCount: 0,
      maxCapacity,
      status: 'Upcoming',
      description: description || 'Institutional event organized by incubator leadership.',
      speakers: speakers.split(',').map((s) => s.trim()),
    };

    setEvents([newEvt, ...events]);
    setIsScheduleModalOpen(false);
    showToast(`Scheduled event "${title}" on institutional calendar!`, 'success');

    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Events & Ecosystem Activities
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {events.length} Events Scheduled
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Host flagship demo days, masterclasses, networking sessions, and university hackathons.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Event</span>
        </button>
      </div>

      {/* 1. Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events or speakers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['all', 'Upcoming', 'Live', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212]'
                  : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              {st === 'all' ? 'All Activities' : st}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  evt.status === 'Upcoming'
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                    : evt.status === 'Live'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                }`}>
                  {evt.status}
                </span>
                <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                  {evt.type} • {evt.format}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  {evt.title}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 line-clamp-2">
                  {evt.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs">
                <div className="flex items-center gap-2 text-[#101212] dark:text-white">
                  <Calendar className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span className="font-semibold">{evt.date} • {evt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-[#565B59] dark:text-[#B6B8B7]">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </div>
              </div>

              {evt.speakers && evt.speakers.length > 0 && (
                <div className="pt-2 text-xs">
                  <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Featured Speakers:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {evt.speakers.map((spk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                      >
                        {spk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  <span>RSVP Registrations:</span>
                  <span className="font-bold text-[#101212] dark:text-white">
                    {evt.rsvpsCount} / {evt.maxCapacity} ({Math.round((evt.rsvpsCount / evt.maxCapacity) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#202422] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D9FF3F] h-full rounded-full"
                    style={{ width: `${Math.min(100, (evt.rsvpsCount / evt.maxCapacity) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#565B59] dark:text-[#B6B8B7]">
                Attendee List Ready
              </span>
              <button
                onClick={() => showToast(`Exporting attendee roster for ${evt.title}...`, 'success')}
                className="px-3.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#202422] hover:bg-[#D9FF3F] hover:text-[#101212] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Export RSVPs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SCHEDULE EVENT MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">Schedule Ecosystem Event</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeepTech Masterclass on Patents & IP Commercialization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Activity Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Demo Day">Demo Day</option>
                    <option value="Masterclass">Masterclass</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Pitch Night">Pitch Night</option>
                    <option value="Networking">Networking</option>
                    <option value="Hackathon">Hackathon</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Venue / Room / Link</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Max Capacity</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Keynote Speakers (Comma-separated)</label>
                <input
                  type="text"
                  value={speakers}
                  onChange={(e) => setSpeakers(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Event Agenda & Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe workshop itinerary, breakout sessions, and networking schedule..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
