'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PieChart,
  Users,
  ShieldCheck,
  Plus,
  Download,
  FolderLock,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Info,
  DollarSign,
  Award,
} from 'lucide-react';
import { financeService } from '@/lib/financeService';
import { CapitalStructureItem } from '@/types/finance';
import { useToast } from '@/components/ui/Toast';

interface FinanceCapTableViewProps {
  onNavigateToDDLocker?: () => void;
}

export const FinanceCapTableView: React.FC<FinanceCapTableViewProps> = ({
  onNavigateToDDLocker,
}) => {
  const { showToast } = useToast();
  const [capStructure, setCapStructure] = useState<CapitalStructureItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapitalStructureItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    stakeholder: string;
    category: 'Founders' | 'ESOP' | 'Investors' | 'Advisors';
    ownershipPct: number;
    sharesCount: number;
    shareClass: string;
    investmentAmount: number;
    vestingTerms: string;
  }>({
    stakeholder: '',
    category: 'Founders',
    ownershipPct: 5,
    sharesCount: 50000,
    shareClass: 'Common Stock',
    investmentAmount: 0,
    vestingTerms: '4-Year Monthly (1-Year Cliff)',
  });

  useEffect(() => {
    setIsClient(true);
    const loadData = () => {
      setCapStructure(financeService.getCapitalStructure());
    };
    loadData();

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('xentro-finances-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-finances-updated', handleUpdate);
    };
  }, []);

  const totalShares = capStructure.reduce((acc, curr) => acc + (curr.sharesCount || 0), 0);
  const totalOwnershipPct = capStructure.reduce((acc, curr) => acc + curr.ownershipPct, 0);

  // Category aggregates
  const foundersPct = capStructure
    .filter((c) => c.category === 'Founders')
    .reduce((acc, c) => acc + c.ownershipPct, 0);

  const investorsPct = capStructure
    .filter((c) => c.category === 'Investors')
    .reduce((acc, c) => acc + c.ownershipPct, 0);

  const esopPct = capStructure
    .filter((c) => c.category === 'ESOP')
    .reduce((acc, c) => acc + c.ownershipPct, 0);

  const advisorsPct = capStructure
    .filter((c) => c.category === 'Advisors')
    .reduce((acc, c) => acc + c.ownershipPct, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredItems = capStructure.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      stakeholder: '',
      category: 'Investors',
      ownershipPct: 5,
      sharesCount: 50000,
      shareClass: 'Series Seed CCPS',
      investmentAmount: 10000000,
      vestingTerms: 'Fully Vested',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: CapitalStructureItem) => {
    setEditingItem(item);
    setFormData({
      stakeholder: item.stakeholder,
      category: item.category,
      ownershipPct: item.ownershipPct,
      sharesCount: item.sharesCount || Math.round((item.ownershipPct / 100) * 1000000),
      shareClass: item.shareClass,
      investmentAmount: item.investmentAmount || 0,
      vestingTerms: item.vestingTerms || 'Standard Terms',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the Cap Table?`)) {
      financeService.deleteCapitalStructureItem(id);
      showToast(`Removed ${name} from Cap Table`, 'info');
    }
  };

  const handleSaveStakeholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stakeholder.trim()) {
      showToast('Please specify a stakeholder or entity name', 'error');
      return;
    }

    if (editingItem) {
      financeService.updateCapitalStructureItem({
        ...editingItem,
        stakeholder: formData.stakeholder,
        category: formData.category,
        ownershipPct: Number(formData.ownershipPct),
        sharesCount: Number(formData.sharesCount),
        shareClass: formData.shareClass,
        investmentAmount: Number(formData.investmentAmount),
        vestingTerms: formData.vestingTerms,
      });
      showToast(`Updated Cap Table entry for ${formData.stakeholder}`, 'success');
    } else {
      financeService.addCapitalStructureItem({
        stakeholder: formData.stakeholder,
        category: formData.category,
        ownershipPct: Number(formData.ownershipPct),
        sharesCount: Number(formData.sharesCount),
        shareClass: formData.shareClass,
        investmentAmount: Number(formData.investmentAmount),
        vestingTerms: formData.vestingTerms,
        dateAdded: new Date().toISOString().split('T')[0],
      });
      showToast(`Added ${formData.stakeholder} to Cap Table`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = ['Stakeholder,Category,Share Class,Ownership %,Shares Count,Investment (INR),Vesting Terms'];
    const rows = capStructure.map(
      (s) =>
        `"${s.stakeholder}","${s.category}","${s.shareClass}",${s.ownershipPct},${s.sharesCount || ''},${s.investmentAmount || 0},"${s.vestingTerms || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Xentro_Startup_Cap_Table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Cap Table to CSV format', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Top Cap Table Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Cap Table & Capital Structure
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Fully Diluted Basis</span>
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Stakeholder ownership allocations, share classes, dilution history, and verified equity agreements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#282D2B] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onNavigateToDDLocker && (
            <button
              onClick={onNavigateToDDLocker}
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Legal SHA in DD Locker</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Stakeholder</span>
          </button>
        </div>
      </div>

      {/* 2. Key Cap Table Metrics Grid (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Founders Equity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Founders Equity</span>
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {foundersPct.toFixed(1)}%
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Founding Team & Key Operators
          </p>
        </div>

        {/* Investors & VCs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Investors & Capital</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {investorsPct.toFixed(1)}%
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Lead Angels & Syndicate Funds
          </p>
        </div>

        {/* ESOP Pool */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">ESOP Pool</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
            {esopPct.toFixed(1)}%
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Employee Incentive Trust
          </p>
        </div>

        {/* Total Authorized Shares */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-xs font-semibold">Total Shares Issued</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-sora text-[#101212] dark:text-white font-mono">
            {totalShares ? totalShares.toLocaleString() : '1,000,000'}
          </div>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            {totalOwnershipPct.toFixed(1)}% Allocated
          </p>
        </div>
      </div>

      {/* 3. Visual Ownership Allocation Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#D9FF3F]" />
            <span>Fully-Diluted Ownership Allocation</span>
          </h3>
          <span className="text-xs font-mono text-[#565B59] dark:text-[#B6B8B7]">
            Total: {totalOwnershipPct.toFixed(1)}%
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-4 bg-gray-100 dark:bg-[#202422] rounded-full overflow-hidden flex">
          <div
            className="bg-[#D9FF3F] h-full transition-all duration-500"
            style={{ width: `${foundersPct}%` }}
            title={`Founders: ${foundersPct}%`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-500"
            style={{ width: `${investorsPct}%` }}
            title={`Investors: ${investorsPct}%`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-500"
            style={{ width: `${esopPct}%` }}
            title={`ESOP Pool: ${esopPct}%`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${advisorsPct}%` }}
            title={`Advisors: ${advisorsPct}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D9FF3F]" />
            <span className="font-semibold text-[#101212] dark:text-white">
              Founders ({foundersPct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-semibold text-[#101212] dark:text-white">
              Investors ({investorsPct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="font-semibold text-[#101212] dark:text-white">
              ESOP Pool ({esopPct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="font-semibold text-[#101212] dark:text-white">
              Advisors ({advisorsPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Stakeholders Table & Filter Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              Stakeholder Registry
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Individual holders, assigned share classes, vested fractions, and voting power.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422]">
            {['all', 'founders', 'investors', 'esop', 'advisors'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white shadow-2xs font-bold'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-semibold">
                <th className="pb-3 px-3">Stakeholder</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Share Class</th>
                <th className="pb-3 px-3 text-right">Shares Count</th>
                <th className="pb-3 px-3 text-right">Ownership %</th>
                <th className="pb-3 px-3 text-right">Capital Invested</th>
                <th className="pb-3 px-3">Vesting / Terms</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#101212] dark:text-white block">
                      {item.stakeholder}
                    </span>
                    {item.dateAdded && (
                      <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                        Added on {item.dateAdded}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.category === 'Founders'
                          ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]'
                          : item.category === 'Investors'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : item.category === 'ESOP'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7] font-medium">
                    {item.shareClass}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-right text-[#101212] dark:text-white">
                    {item.sharesCount ? item.sharesCount.toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 text-sm">
                    {item.ownershipPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-right text-[#565B59] dark:text-[#B6B8B7]">
                    {item.investmentAmount && item.investmentAmount > 0
                      ? formatCurrency(item.investmentAmount)
                      : 'Sweat Equity / Par Value'}
                  </td>
                  <td className="py-3 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                    {item.vestingTerms || 'Standard Terms'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262A29] text-gray-500 hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Stakeholder"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.stakeholder)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove from Cap Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DD Locker Encrypted Cap Table & Governance Documents Notice */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#101212] dark:text-white">
              Encrypted Corporate Governance Documents
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Executed Shareholders Agreements (SHA), Share Purchase Agreements (SPA), Term Sheets, and PAS-3 statutory filings are archived inside your DD Locker.
            </p>
          </div>
        </div>

        {onNavigateToDDLocker && (
          <button
            onClick={onNavigateToDDLocker}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#282D2B] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <span>Open DD Locker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 6. Modal: Add / Edit Stakeholder */}
      {isClient && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  {editingItem ? 'Edit Stakeholder Allocation' : 'Add Stakeholder to Cap Table'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStakeholder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Stakeholder / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peak XV Partners / Co-Founder Name"
                  value={formData.stakeholder}
                  onChange={(e) => setFormData({ ...formData, stakeholder: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as 'Founders' | 'ESOP' | 'Investors' | 'Advisors',
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-hidden"
                  >
                    <option value="Founders">Founders</option>
                    <option value="Investors">Investors</option>
                    <option value="ESOP">ESOP Pool</option>
                    <option value="Advisors">Advisors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Share Class
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Series Seed CCPS"
                    value={formData.shareClass}
                    onChange={(e) => setFormData({ ...formData, shareClass: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Ownership % (Fully Diluted) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.ownershipPct}
                    onChange={(e) => setFormData({ ...formData, ownershipPct: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Number of Shares *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sharesCount}
                    onChange={(e) => setFormData({ ...formData, sharesCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Investment Consideration (₹ INR, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 25000000"
                  value={formData.investmentAmount}
                  onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Vesting Schedule / Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4-Year Monthly (1-Year Cliff) or Fully Vested"
                  value={formData.vestingTerms}
                  onChange={(e) => setFormData({ ...formData, vestingTerms: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {editingItem ? 'Save Allocation' : 'Add to Cap Table'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
