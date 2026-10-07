'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  List,
  Kanban,
  Plus,
  Search,
  Filter,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  FileText,
  FolderLock,
  ChevronRight,
  X,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService, initialInvestorMembers } from '@/lib/investorDomainService';
import {
  InvestorDeal,
  InvestorDealStage,
  InvestorDealTermSheet,
  InvestorEntityMember,
} from '@/types/investor';

import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';

const STAGES: { id: InvestorDealStage; label: string; color: string }[] = [
  { id: 'new', label: 'New Pitches', color: 'bg-gray-500' },
  { id: 'reviewed', label: 'Reviewed', color: 'bg-blue-500' },
  { id: 'connected', label: 'Connected', color: 'bg-cyan-500' },
  { id: 'meeting_scheduled', label: 'Meeting Set', color: 'bg-amber-500' },
  { id: 'evaluation', label: 'Evaluation', color: 'bg-indigo-500' },
  { id: 'due_diligence', label: 'Due Diligence', color: 'bg-purple-500' },
  { id: 'term_discussion', label: 'Term Discussion', color: 'bg-pink-500' },
  { id: 'invested', label: 'Invested', color: 'bg-emerald-500' },
  { id: 'passed', label: 'Passed', color: 'bg-rose-500' },
];

export const InvestorDealFlowCRM: React.FC = () => {
  const { showToast } = useToast();
  const [deals, setDeals] = useState<InvestorDeal[]>(() =>
    investorOrganizationService.getScopedDeals()
  );
  const [members, setMembers] = useState<InvestorEntityMember[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Selected Deal Drawer / Detail Modal
  const [selectedDeal, setSelectedDeal] = useState<InvestorDeal | null>(null);

  // Term Sheet Modal
  const [termSheetDeal, setTermSheetDeal] = useState<InvestorDeal | null>(null);
  const [termAmount, setTermAmount] = useState('');
  const [termEquity, setTermEquity] = useState('');
  const [termValuation, setTermValuation] = useState('');
  const [termNotes, setTermNotes] = useState('');

  // Add Note State
  const [newNoteText, setNewNoteText] = useState('');

  // Move Stage State
  const [moveStageDeal, setMoveStageDeal] = useState<InvestorDeal | null>(null);
  const [targetStage, setTargetStage] = useState<InvestorDealStage>('evaluation');
  const [stageNote, setStageNote] = useState('');

  useEffect(() => {
    const refreshDeals = () => {
      setDeals(investorOrganizationService.getScopedDeals());
      setMembers(investorDomainService.getMembers());
    };
    refreshDeals();

    const handleDealsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) {
        setDeals(ce.detail.deals);
      } else {
        refreshDeals();
      }
    };
    window.addEventListener('xentro-investor-deals-changed', handleDealsChange);
    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshDeals);
    return () => {
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChange);
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshDeals);
    };
  }, []);

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.startupName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.sector.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.founderName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStage = selectedStageFilter === 'all' || d.dealStage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const handleOpenTermSheetModal = (deal: InvestorDeal) => {
    setTermSheetDeal(deal);
    setTermAmount(deal.termSheet?.amount || deal.fundingAsk || '$500k');
    setTermEquity(deal.termSheet?.equity || '8.0%');
    setTermValuation(deal.termSheet?.valuation || deal.valuation || '$6.25M Post');
    setTermNotes(deal.termSheet?.notes || 'Standard NVCA term sheet with 1 board observer seat and pro-rata rights.');
  };

  const handleSaveTermSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termSheetDeal) return;

    const termSheet: InvestorDealTermSheet = {
      status: 'offered',
      amount: termAmount,
      equity: termEquity,
      valuation: termValuation,
      date: new Date().toISOString().split('T')[0],
      notes: termNotes,
    };

    investorDomainService.updateTermSheet(termSheetDeal.id, termSheet);
    investorDomainService.updateDealStage(termSheetDeal.id, 'term_discussion', `Term Sheet issued: ${termAmount} for ${termEquity}`);
    showToast(`Term sheet issued to ${termSheetDeal.startupName}!`, 'success');
    setTermSheetDeal(null);
  };

  const handleAssignMember = (dealId: string, memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    investorDomainService.assignDeal(dealId, member.id, `${member.name} (${member.role})`);
    showToast(`Deal assigned to ${member.name}`, 'success');
  };

  const handleAddNote = (dealId: string) => {
    if (!newNoteText.trim()) return;
    investorDomainService.addDealNote(dealId, newNoteText.trim());
    showToast('Internal note saved to deal file', 'success');
    setNewNoteText('');
    // refresh selected deal
    const updated = investorDomainService.getDeals().find((d) => d.id === dealId);
    if (updated) setSelectedDeal(updated);
  };

  const handleExecuteMoveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveStageDeal) return;
    investorDomainService.updateDealStage(moveStageDeal.id, targetStage, stageNote);
    showToast(`Moved ${moveStageDeal.startupName} to ${targetStage.replace('_', ' ').toUpperCase()}`, 'success');
    setMoveStageDeal(null);
    setStageNote('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading">
              Deal Flow CRM & Diligence Pipeline
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F] text-[#101212]">
              {deals.length} Active Deals
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
              {investorOrganizationService.isOrganizationContext()
                ? `Entity: ${investorOrganizationService.getActiveOrganization()?.name || 'Apex Ventures'}`
                : 'Personal Angel Pipeline'}
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
            Institutional pipeline tracking from inbound pitch deck to investment committee term sheet
          </p>
        </div>

        {/* View Mode & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter deals..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D9FF3F]"
            />
          </div>

          {/* Toggle Kanban / List */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1400px]">
            {STAGES.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => d.dealStage === stage.id);
              return (
                <div
                  key={stage.id}
                  className="w-72 flex-shrink-0 rounded-2xl bg-gray-50/70 dark:bg-[#151716] border border-gray-200/80 dark:border-[#262A29] flex flex-col max-h-[750px]"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-gray-200 dark:border-[#262A29] flex items-center justify-between bg-white/40 dark:bg-[#181B1A]/40 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        {stage.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deals in column */}
                  <div className="p-2.5 space-y-3 overflow-y-auto flex-1 no-scrollbar">
                    {stageDeals.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No deals in this stage
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#1E2220] border border-gray-200 dark:border-[#262A29] shadow-2xs hover:border-[#D9FF3F]/60 transition-all space-y-2.5 group cursor-pointer"
                          onClick={() => setSelectedDeal(deal)}
                        >
                          {/* Deal Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <img src={deal.startupLogo} alt={deal.startupName} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors line-clamp-1">
                                  {deal.startupName}
                                </h4>
                                <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                                  {deal.stage} &bull; {deal.sector}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {deal.matchScore}%
                            </span>
                          </div>

                          {/* Ask & Traction */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100 dark:border-[#262A29]">
                            <span className="font-semibold text-[#101212] dark:text-white">
                              {deal.fundingAsk}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                              {deal.tractionMRR || 'Traction pending'}
                            </span>
                          </div>

                          {/* Assigned Lead */}
                          <div className="flex items-center justify-between text-[10px] text-[#565B59] dark:text-[#B6B8B7] pt-1">
                            <span className="truncate max-w-[140px]">
                              Lead: {deal.assignedMemberName?.split(' ')[0] || 'Unassigned'}
                            </span>
                            {deal.diligenceVaultUnlocked && (
                              <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-bold" title="Data Room Unlocked">
                                <FolderLock className="w-3 h-3" />
                                <span>DD</span>
                              </span>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="pt-2 flex items-center justify-between gap-1 border-t border-gray-100 dark:border-[#262A29]" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setMoveStageDeal(deal);
                                setTargetStage(deal.dealStage);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-gray-100 dark:bg-[#262A29] hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors cursor-pointer"
                            >
                              Move Stage &rarr;
                            </button>

                            <button
                              onClick={() => handleOpenTermSheetModal(deal)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors cursor-pointer"
                            >
                              Term Sheet
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. List CRM Table View */
        <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border-b border-gray-200 dark:border-[#262A29]">
                <tr>
                  <th className="py-3 px-4 font-bold">Venture</th>
                  <th className="py-3 px-4 font-bold">Stage & Sector</th>
                  <th className="py-3 px-4 font-bold">Round Ask</th>
                  <th className="py-3 px-4 font-bold">Pipeline Stage</th>
                  <th className="py-3 px-4 font-bold">Assigned Lead</th>
                  <th className="py-3 px-4 font-bold">Match</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <img src={deal.startupLogo} alt={deal.startupName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#101212] dark:text-white">
                            {deal.startupName}
                          </div>
                          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            Founder: {deal.founderName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      <span className="font-semibold text-[#101212] dark:text-white">{deal.stage}</span> &bull; {deal.sector}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#101212] dark:text-white">
                      {deal.fundingAsk}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]">
                        {deal.dealStage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {deal.assignedMemberName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {deal.matchScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setMoveStageDeal(deal);
                            setTargetStage(deal.dealStage);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#262A29] hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors cursor-pointer"
                        >
                          Move
                        </button>
                        <button
                          onClick={() => handleOpenTermSheetModal(deal)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-colors cursor-pointer"
                        >
                          Term Sheet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Deal Detail Drawer Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between bg-gray-50/50 dark:bg-[#202422]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700">
                  <img src={selectedDeal.startupLogo} alt={selectedDeal.startupName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                    {selectedDeal.startupName}
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Founder: {selectedDeal.founderName} &bull; {selectedDeal.sector}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                <div>
                  <span className="text-[10px] text-gray-500 block">Round Target:</span>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">{selectedDeal.fundingAsk}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Valuation Cap:</span>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">{selectedDeal.valuation || 'TBD'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Current Stage:</span>
                  <span className="font-bold text-sm text-[#D9FF3F] capitalize">{selectedDeal.dealStage.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Assignment Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#101212] dark:text-white">Assigned Deal Lead:</label>
                <select
                  value={selectedDeal.assignedMemberId || ''}
                  onChange={(e) => handleAssignMember(selectedDeal.id, e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pitch Summary */}
              <div className="space-y-1">
                <span className="font-bold text-[#101212] dark:text-white">Executive Pitch:</span>
                <p className="text-[#565B59] dark:text-[#B6B8B7] leading-relaxed p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                  {selectedDeal.pitchSummary}
                </p>
              </div>

              {/* Active Term Sheet Status */}
              {selectedDeal.termSheet && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      Active Term Sheet Proposal ({selectedDeal.termSheet.status.toUpperCase()})
                    </span>
                    <span className="text-[11px] text-gray-400">{selectedDeal.termSheet.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Check: <span className="font-bold">{selectedDeal.termSheet.amount}</span></div>
                    <div>Ownership: <span className="font-bold">{selectedDeal.termSheet.equity}</span></div>
                  </div>
                  {selectedDeal.termSheet.notes && (
                    <p className="text-[11px] text-gray-400">{selectedDeal.termSheet.notes}</p>
                  )}
                </div>
              )}

              {/* Internal Partner Notes Timeline */}
              <div className="space-y-3">
                <span className="font-bold text-[#101212] dark:text-white">Partner & IC Notes Timeline:</span>
                <div className="space-y-2">
                  {selectedDeal.notes && selectedDeal.notes.length > 0 ? (
                    selectedDeal.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-bold text-[#101212] dark:text-white">{n.authorName}</span>
                          <span>{n.createdAt}</span>
                        </div>
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs italic">No internal notes yet.</p>
                  )}
                </div>

                {/* Add Note Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add diligence note or IC feedback..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                  />
                  <button
                    onClick={() => handleAddNote(selectedDeal.id)}
                    className="px-3 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] font-bold text-xs hover:bg-[#C7F020] cursor-pointer"
                  >
                    Post Note
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between bg-gray-50/50 dark:bg-[#202422]/50">
              <button
                onClick={() => {
                  setMoveStageDeal(selectedDeal);
                  setTargetStage(selectedDeal.dealStage);
                  setSelectedDeal(null);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:border-[#D9FF3F] cursor-pointer"
              >
                Advance Pipeline Stage
              </button>

              <button
                onClick={() => {
                  handleOpenTermSheetModal(selectedDeal);
                  setSelectedDeal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
              >
                Issue / Edit Term Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Issue Term Sheet Modal */}
      {termSheetDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Craft Term Sheet: {termSheetDeal.startupName}
                </h3>
              </div>
              <button onClick={() => setTermSheetDeal(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermSheet} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#101212] dark:text-white">Check Size ($):</label>
                  <input
                    type="text"
                    required
                    value={termAmount}
                    onChange={(e) => setTermAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#101212] dark:text-white">Target Equity (%):</label>
                  <input
                    type="text"
                    required
                    value={termEquity}
                    onChange={(e) => setTermEquity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Post-Money Valuation Target:</label>
                <input
                  type="text"
                  required
                  value={termValuation}
                  onChange={(e) => setTermValuation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Lead Rights & Governance Notes:</label>
                <textarea
                  rows={3}
                  value={termNotes}
                  onChange={(e) => setTermNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTermSheetDeal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Issue Term Sheet Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Move Stage Modal */}
      {moveStageDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Move Pipeline Stage
              </h3>
              <button onClick={() => setMoveStageDeal(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteMoveStage} className="space-y-3.5 text-xs">
              <p className="text-gray-400">
                Updating stage for <strong className="text-white">{moveStageDeal.startupName}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Target Pipeline Stage:</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as InvestorDealStage)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Stage Transition Rationale / Note:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed initial partner meeting. Advancing to technical diligence."
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMoveStageDeal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
                >
                  Update Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
