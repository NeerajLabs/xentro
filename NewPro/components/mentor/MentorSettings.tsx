'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Lock,
  User,
  Check,
  Save,
  Video,
  Mail,
  Sun,
  Moon,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const MentorSettings: React.FC = () => {
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateTheme = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      updateTheme();
      window.addEventListener('storage', updateTheme);
      window.addEventListener('xentro-theme-changed', updateTheme);
      return () => {
        window.removeEventListener('storage', updateTheme);
        window.removeEventListener('xentro-theme-changed', updateTheme);
      };
    }
  }, []);

  const setTheme = (mode: 'light' | 'dark') => {
    const toDark = mode === 'dark';
    setIsDark(toDark);
    if (typeof window !== 'undefined') {
      if (toDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('xentro_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('xentro_theme', 'light');
      }
      window.dispatchEvent(new Event('xentro-theme-changed'));
    }
    showToast(toDark ? '🌙 Switched to Dark Theme' : '☀️ Switched to Light Theme');
  };

  const handleSave = () => {
    setIsSaved(true);
    showToast('✨ Mentor account settings updated successfully!', 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-6 animate-fade-slide">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white">
            Mentor Workspace Settings
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Configure operational preferences, meeting integrations, and notification channels.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Meeting & Video Integration */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Video & Calendar Integrations</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#101212] dark:text-white block">Google Meet & Calendar</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected as arvind.swaminathan@xentro.network</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">Active</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#101212] dark:text-white block">Zoom Integration</span>
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">Configured for custom exploratory calls</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]">Ready</span>
            </div>
          </div>
        </div>

        {/* 2. Notification Dispatch Preferences */}
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
          <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Communication & Alert Channels</span>
          </h4>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-[#D9FF3F]" />
              <span className="text-gray-700 dark:text-gray-300">
                Instant push alerts when a founder submits a new mentorship request
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-[#D9FF3F]" />
              <span className="text-gray-700 dark:text-gray-300">
                SMS / WhatsApp summary 15 minutes before confirmed sessions
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-[#D9FF3F]" />
              <span className="text-gray-700 dark:text-gray-300">
                Weekly digest of vetted AI & deep tech startups seeking mentors
              </span>
            </label>
          </div>
        </div>

        {/* 3. Workspace Theme & Appearance */}
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Workspace Theme & Visual Mode</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                !isDark
                  ? 'border-[#D9FF3F] ring-2 ring-[#D9FF3F]/40 bg-white text-[#101212] shadow-sm'
                  : 'border-[#262A29] bg-[#202422] text-[#B6B8B7] hover:border-[#D9FF3F]/50 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F7F8F6] border border-[#E5E7EB] flex items-center justify-center text-[#101212]">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">Light Mode</span>
                </div>
                {!isDark && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F] text-[#101212]">
                    Current
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Clean soft neutral canvas (#F7F8F6) with crisp white cards and dark charcoal typography.
              </p>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                isDark
                  ? 'border-[#D9FF3F] ring-2 ring-[#D9FF3F]/40 bg-[#181B1A] text-white shadow-sm'
                  : 'border-[#E5E7EB] bg-[#F7F8F6] text-[#565B59] hover:border-[#D9FF3F]/50 hover:text-[#101212]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0D0F0F] border border-[#262A29] flex items-center justify-center text-[#D9FF3F]">
                    <Moon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">Dark Mode</span>
                </div>
                {isDark && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9FF3F] text-[#101212]">
                    Current
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Deep near-black (#0D0F0F) canvas with (#181B1A) surfaces and high-contrast (#D9FF3F) neon accents.
              </p>
            </button>
          </div>
        </div>

        {/* 4. Security & Account */}
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
          <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Security & Privacy Verification</span>
          </h4>
          <div className="p-4 rounded-xl bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/25 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-[#101212] dark:text-[#D9FF3F] block">Verified Mentor Identity Protocol</span>
              <span className="text-[#565B59] dark:text-[#B6B8B7]">Accredited by IIIT-H Foundation & XENTRO Mentor Guild</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D9FF3F] text-[#101212]">
              Verified ✓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
