'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
} from 'lucide-react';
import { MentorAvailabilityConfig } from '@/types/mentor';
import { useToast } from '@/components/ui/Toast';

interface MentorAvailabilityProps {
  initialConfig: MentorAvailabilityConfig;
}

export const MentorAvailability: React.FC<MentorAvailabilityProps> = ({ initialConfig }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<MentorAvailabilityConfig>(initialConfig);
  const [isSaved, setIsSaved] = useState(false);

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const durations = [15, 30, 45, 60];
  const modes = ['Video (Google Meet)', 'Video (Zoom)', 'Audio Call', 'In-person'];
  const buffers = [5, 10, 15, 30];

  const toggleDay = (day: string) => {
    setConfig((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
    setIsSaved(false);
  };

  const toggleMode = (mode: string) => {
    setConfig((prev) => ({
      ...prev,
      meetingModes: prev.meetingModes.includes(mode)
        ? prev.meetingModes.filter((m) => m !== mode)
        : [...prev.meetingModes, mode],
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    showToast('✨ Mentor availability preferences updated successfully!', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setIsSaved(false);
    showToast('Reset to default availability settings.', 'info');
  };

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white leading-snug">
            Configure Mentor Availability
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Set your weekly office hours, meeting mode, and session durations for founders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved!' : 'Save Availability'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Available Days */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
            Available Days of the Week
          </label>
          <div className="flex flex-wrap gap-2">
            {daysList.map((day) => {
              const isSelected = config.availableDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-11 h-11 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#D9FF3F] text-[#101212] shadow-xs scale-105'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Selected: <span className="font-semibold text-[#101212] dark:text-white">{config.availableDays.join(', ')}</span>
          </p>
        </div>

        {/* 2. Available Hours */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
            Available Daily Time Window
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-[#565B59] uppercase">Start Time</span>
              <input
                type="text"
                value={config.startTime}
                onChange={(e) => {
                  setConfig({ ...config, startTime: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#565B59] uppercase">End Time</span>
              <input
                type="text"
                value={config.endTime}
                onChange={(e) => {
                  setConfig({ ...config, endTime: e.target.value });
                  setIsSaved(false);
                }}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30"
              />
            </div>
          </div>
        </div>

        {/* 3. Session Duration */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
            Default Session Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setConfig({ ...config, sessionDuration: d });
                  setIsSaved(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  config.sessionDuration === d
                    ? 'bg-[#D9FF3F] text-[#101212] shadow-xs'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {d} mins
              </button>
            ))}
          </div>
        </div>

        {/* 4. Buffer Time */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
            Buffer Time Between Sessions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {buffers.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setConfig({ ...config, bufferTime: b });
                  setIsSaved(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  config.bufferTime === b
                    ? 'bg-[#D9FF3F] text-[#101212] shadow-xs'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {b} mins
              </button>
            ))}
          </div>
        </div>

        {/* 5. Supported Meeting Modes */}
        <div className="md:col-span-2 space-y-2.5">
          <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
            Supported Meeting Modes
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {modes.map((m) => {
              const isSelected = config.meetingModes.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMode(m)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]'
                      : 'border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  <span className="truncate">{m}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
