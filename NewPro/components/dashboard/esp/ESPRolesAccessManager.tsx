'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Users,
  Lock,
  ChevronRight,
  Info,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ESPRole, ESPPermissionGroup, ESPMemberRole } from '@/types/esp';
import { mockESPRoles, mockESPPermissionGroups } from '@/data/espWorkspaceData';
import { useToast } from '@/components/ui/Toast';

export const ESPRolesAccessManager: React.FC = () => {
  const { showToast } = useToast();
  const [roles] = useState<ESPRole[]>(mockESPRoles);
  const [selectedRole, setSelectedRole] = useState<ESPRole>(mockESPRoles[0]);
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'permissions'>('roles');
  const [permissionSearch, setPermissionSearch] = useState('');

  const filteredGroups = mockESPPermissionGroups.map((group) => ({
    ...group,
    permissions: group.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(permissionSearch.toLowerCase())
    ),
  })).filter((group) => group.permissions.length > 0);

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Roles & Access Governance
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              10 System Roles • 9 Functional Domains
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Inspect institutional permission groups, operational scopes, and access control matrices.
          </p>
        </div>

        <button
          onClick={() => showToast('Role privileges are enforced by institutional governance policy.', 'info')}
          className="px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5 text-[#D9FF3F]" />
          <span>Governance Policy</span>
        </button>
      </div>

      {/* Sub-Navigation (Roles, Permissions) */}
      <div className="bg-white dark:bg-[#181B1A] p-1.5 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center gap-1.5 w-fit">
        {[
          { id: 'roles' as const, label: 'System Roles', icon: Users, count: roles.length },
          { id: 'permissions' as const, label: 'Permissions Matrix', icon: ShieldCheck, count: 9 },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#101212] text-white dark:bg-white dark:text-[#101212] shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#101212]'
                    : 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW: ROLES */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-slide">
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setSelectedRole(r);
                setActiveSubTab('permissions');
              }}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F] transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    Level {r.level}
                  </span>
                  <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    {r.assignedCount || 1} Assigned
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                  {r.name}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs text-[#101212] dark:text-[#D9FF3F] font-bold">
                <span>Inspect {r.permissions.length} Permissions</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: PERMISSIONS MATRIX */}
      {activeSubTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-slide">
          {/* Roles Selector (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider px-1">
              Select Role to Inspect
            </h3>

            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = selectedRole.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10'
                        : 'border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {r.name}
                      </h4>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate max-w-[200px]">
                        {r.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-gray-300">
                      Lvl {r.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permission Matrix (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  {selectedRole.name} Privileges
                </h3>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {selectedRole.permissions.length} active permissions granted
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredGroups.map((grp) => (
                <div
                  key={grp.group}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-white">
                      {grp.group} DOMAIN
                    </span>
                    <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      {grp.permissions.length} Capabilities
                    </span>
                  </div>

                  <div className="space-y-2">
                    {grp.permissions.map((p) => {
                      const isGranted = selectedRole.permissions.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-gray-50/50 dark:bg-[#202422]/40"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="font-mono text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                                ({p.id})
                              </span>
                            </div>
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                              {p.description}
                            </p>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isGranted ? (
                              <span className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5">
                                <Check className="w-3 h-3" />
                                <span>Allowed</span>
                              </span>
                            ) : (
                              <span className="p-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-400 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5">
                                <Lock className="w-3 h-3" />
                                <span>Restricted</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
