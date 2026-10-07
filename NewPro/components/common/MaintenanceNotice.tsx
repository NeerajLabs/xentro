'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, ShieldCheck, X, ChevronRight, Wrench, Info } from 'lucide-react';
import { getMaintenanceState, MaintenanceState } from '@/lib/maintenance';

export const MaintenanceNotice: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceState>({ isActive: false, reason: '' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial check
    const current = getMaintenanceState();
    setMaintenance(current);

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<MaintenanceState>;
      if (custom.detail) {
        setMaintenance(custom.detail);
        setDismissed(false);
      } else {
        setMaintenance(getMaintenanceState());
      }
    };

    window.addEventListener('xentro-maintenance-changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('xentro-maintenance-changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!maintenance.isActive || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-b border-amber-500/30 text-[#101212] dark:text-white sticky top-0 z-50 backdrop-blur-md transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Notice Header & Reason Message */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 sm:mt-0">
              <Wrench className="w-4 h-4 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-black">
                  Temporary Web Maintenance
                </span>
                {maintenance.scheduledEnd && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {maintenance.scheduledEnd}</span>
                  </span>
                )}
                {maintenance.activatedAt && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:inline">
                    &bull; Began {new Date(maintenance.activatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Context Message Explaining WHY Maintenance is Happening */}
              <div className="mt-1 text-xs text-[#101212] dark:text-gray-100 flex items-start sm:items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="font-semibold text-amber-800 dark:text-amber-300 mr-1">Context:</span>
                <span className="font-medium leading-tight line-clamp-2 sm:line-clamp-1">
                  {maintenance.reason || 'Core ecosystem services are undergoing scheduled maintenance upgrades.'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#101212] dark:text-white text-xs font-semibold transition-all border border-amber-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Admin Console</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </Link>

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Dismiss banner preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
