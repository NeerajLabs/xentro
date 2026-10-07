'use client';

import React, { useState } from 'react';
import { AdminWorkspace, WorkspaceType } from '@/types/admin';
import { INITIAL_WORKSPACES } from '@/lib/adminDomainService';
import {
  Layers,
  Search,
  Filter,
  User,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

export const AdminWorkspacesView: React.FC = () => {
  const [workspaces] = useState<AdminWorkspace[]>(INITIAL_WORKSPACES);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<AdminWorkspace | null>(null);

  const filtered = workspaces.filter((w) => {
    if (typeFilter !== 'All' && w.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.entityName.toLowerCase().includes(q) ||
        w.userName.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getTypeColor = (type: WorkspaceType) => {
    switch (type) {
      case 'Personal':
        return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Individual Investor':
        return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Startup Entity':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Investor Organization':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'ESP':
        return 'text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border-emerald-200 dark:border-[#D9FF3F]/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Layers className="w-3.5 h-3.5" />
            Context Isolation Architecture
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Workspace Governance
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Audit and inspect active execution contexts. Ensures strict data separation between a person&apos;s Personal Account, Startup Entity, Angel Portfolio, and VC Firm.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
          <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Active Workspaces</div>
          <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">{workspaces.length}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workspaces by entity, member, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Workspace Type:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          >
            <option value="All">All Workspace Types</option>
            <option value="Personal">Personal</option>
            <option value="Individual Investor">Individual Investor</option>
            <option value="Startup Entity">Startup Entity</option>
            <option value="Investor Organization">Investor Organization</option>
            <option value="ESP">ESP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
              <th className="py-3.5 px-4 font-semibold">Workspace Context</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold">Operating Member</th>
              <th className="py-3.5 px-4 font-semibold">Role</th>
              <th className="py-3.5 px-4 font-semibold">Permissions</th>
              <th className="py-3.5 px-4 font-semibold">State</th>
              <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{w.entityName}</div>
                  <div className="text-[10px] font-mono text-gray-400">ID: {w.id}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getTypeColor(w.type)}`}>
                    {w.type}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-[#101212] dark:text-white">{w.userName}</div>
                  <div className="text-[10px] text-gray-400 font-mono">UID: {w.userId}</div>
                </td>
                <td className="py-3.5 px-4 font-medium text-[#565B59] dark:text-gray-300">{w.role}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white border border-gray-200 dark:border-transparent">
                    {w.permissionsCount} rights
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {w.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedWorkspace(w)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all border border-gray-200 dark:border-transparent"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workspace Detail Modal */}
      {selectedWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Workspace Context Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedWorkspace(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Context Name:</span>
                <strong className="text-[#101212] dark:text-white">{selectedWorkspace.entityName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Workspace Type:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getTypeColor(selectedWorkspace.type)}`}>
                  {selectedWorkspace.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Operating Member:</span>
                <span className="text-[#101212] dark:text-white">{selectedWorkspace.userName} ({selectedWorkspace.role})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Creation Date:</span>
                <span className="text-[#101212] dark:text-white">{selectedWorkspace.createdDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Data Mixing Assurance</span>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                Workspaces are strictly sandboxed. Deal flow CRM data, investor notes, pitch decks, and billing ledgers in this workspace cannot leak into other personal or organizational profiles of the user.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWorkspace(null)}
                className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
