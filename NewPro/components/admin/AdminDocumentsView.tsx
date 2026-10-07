'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Eye,
  Download,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface DdAccessLogItem {
  id: string;
  documentName: string;
  category: string;
  startupName: string;
  investorName: string;
  firmName: string;
  watermarkTag: string;
  accessState: 'Granted' | 'Requested' | 'Revoked' | 'Expired';
  timestamp: string;
}

const INITIAL_DD_LOGS: DdAccessLogItem[] = [];

export const AdminDocumentsView: React.FC = () => {
  const [logs] = useState<DdAccessLogItem[]>(INITIAL_DD_LOGS);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = logs.filter((l) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.documentName.toLowerCase().includes(q) ||
        l.startupName.toLowerCase().includes(q) ||
        l.investorName.toLowerCase().includes(q) ||
        l.firmName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <FileText className="w-3.5 h-3.5" />
            Virtual Data Room & Telemetry
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Documents, DD Locker & Storage Audits
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Audit virtual due diligence data room interactions, dynamic viewer watermarking compliance, NDA enforcement, and multi-tenant cloud storage quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Cloud Storage Used</div>
            <div className="text-lg font-bold font-sora text-emerald-700 dark:text-[#D9FF3F]">184.2 GB</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Watermarked Files</div>
            <div className="text-lg font-bold font-sora text-emerald-600 dark:text-emerald-400">1,840</div>
          </div>
        </div>
      </div>

      {/* Watermarking Enforcement Banner */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Dynamic Digital Watermarking Active: Every document render injects Viewer Identity, Timestamp & NDA notice.</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">AES-256 S3 Encrypted</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by file name, startup, investor, or firm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
        />
      </div>

      {/* DD Access Logs Table */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
              <th className="py-3.5 px-4 font-semibold">Protected File</th>
              <th className="py-3.5 px-4 font-semibold">Startup Owner</th>
              <th className="py-3.5 px-4 font-semibold">Authorized Reviewer</th>
              <th className="py-3.5 px-4 font-semibold">Dynamic Watermark Stamp</th>
              <th className="py-3.5 px-4 font-semibold">Access State</th>
              <th className="py-3.5 px-4 font-semibold text-right">Audit Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{log.documentName}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{log.category}</div>
                </td>
                <td className="py-3.5 px-4 text-[#565B59] dark:text-gray-300 font-medium">{log.startupName}</td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{log.investorName}</div>
                  <div className="text-[10px] text-emerald-700 dark:text-[#D9FF3F] font-medium">{log.firmName}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/15 max-w-sm truncate">
                    {log.watermarkTag}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {log.accessState === 'Granted' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> {log.accessState}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-500 dark:text-gray-400 font-mono text-[11px]">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
