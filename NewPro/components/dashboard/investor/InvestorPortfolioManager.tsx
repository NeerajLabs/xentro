'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Download,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Plus,
  X,
  FileText,
  Building2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import { getUserProfile } from '@/lib/userProfile';

interface PortfolioItem {
  id: string;
  name: string;
  logo: string;
  sector: string;
  stageInvested: string;
  investmentYear: string;
  checkInvested: string;
  equityPercentage: string;
  currentMultiple: string;
  growthMoM: string;
  boardSeat: 'Director' | 'Observer' | 'None';
  status: 'Outperforming' | 'Healthy' | 'On Track' | 'Seed Extension';
  recentUpdate: {
    title: string;
    date: string;
    summary: string;
  };
}

const mockPortfolio: PortfolioItem[] = [];

export const InvestorPortfolioManager: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [activeTab, setActiveTab] = useState<'holdings' | 'updates'>('holdings');
  const [selectedCompany, setSelectedCompany] = useState<PortfolioItem | null>(null);
  const [activeContext, setActiveContext] = useState(() =>
    investorOrganizationService.getActiveContext()
  );

  React.useEffect(() => {
    const handleContextChange = () => {
      setActiveContext(investorOrganizationService.getActiveContext());
    };
    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
    };
  }, []);

  const isOrg = activeContext.type === 'organization';
  const activeOrg = isOrg ? investorOrganizationService.getActiveOrganization() : null;

  const filteredPortfolio = mockPortfolio.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'All' || item.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const handleExportReport = () => {
    showToast(
      isOrg
        ? 'Exporting LP Quarterly Fund Performance Report (PDF & CSV)...'
        : 'Exporting Angel Portfolio Summary (PDF)...',
      'info'
    );
    setTimeout(() => {
      showToast('Report downloaded successfully.', 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. Fund Performance High-Level Metrics Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>
                  {isOrg
                    ? `${activeOrg?.name || 'Apex Ventures'} Portfolio Performance`
                    : 'Personal Angel Portfolio & Holdings'}
                </span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
                {isOrg ? 'Fund Portfolio' : 'Angel Portfolio'}
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
              {isOrg
                ? `${activeOrg?.name || 'Venture Fund'} Fund Portfolio &bull; Real-time TVPI, DPI, and founder KPIs`
                : `${getUserProfile().name || 'Personal'} Direct Angel Holdings &bull; Personal Co-investments`}
            </p>
          </div>

          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D9FF3F]" />
            <span>{isOrg ? 'Export LP Report' : 'Export Portfolio'}</span>
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[11px] text-[#565B59] dark:text-[#8E9390] block">Invested Capital</span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">{filteredPortfolio.length > 0 ? '$8.45M' : '$0.00'}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Across {filteredPortfolio.length} Active Cos</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[11px] text-[#565B59] dark:text-[#8E9390] block">Estimated Fair Value</span>
            <span className="text-xl font-bold font-sora text-emerald-600 dark:text-emerald-400">{filteredPortfolio.length > 0 ? '$28.73M' : '$0.00'}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">{filteredPortfolio.length > 0 ? '+$6.2M in last 12m' : 'No valuation changes'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[11px] text-[#565B59] dark:text-[#8E9390] block">Unrealized MOIC</span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">{filteredPortfolio.length > 0 ? '3.40x' : '0.00x'}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Net TVPI Multiple</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[11px] text-[#565B59] dark:text-[#8E9390] block">Gross Fund IRR</span>
            <span className="text-xl font-bold font-sora text-emerald-600 dark:text-emerald-400">{filteredPortfolio.length > 0 ? '31.4%' : '0.0%'}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Benchmark IRR</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] w-fit">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'holdings'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Holdings & Valuations
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'updates'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Founder Quarterly Updates
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
          />
        </div>
      </div>

      {/* 3. Holdings View */}
      {activeTab === 'holdings' && (
        <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border-b border-gray-200 dark:border-[#262A29]">
                <tr>
                  <th className="py-3 px-4 font-bold">Company</th>
                  <th className="py-3 px-4 font-bold">Entry Stage & Year</th>
                  <th className="py-3 px-4 font-bold">Check Invested</th>
                  <th className="py-3 px-4 font-bold">Ownership</th>
                  <th className="py-3 px-4 font-bold">Current Multiple</th>
                  <th className="py-3 px-4 font-bold">Revenue Growth</th>
                  <th className="py-3 px-4 font-bold">Board Seat</th>
                  <th className="py-3 px-4 font-bold">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {filteredPortfolio.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Building2 className="w-10 h-10 mx-auto text-gray-400 opacity-50 mb-2" />
                      <p className="text-sm font-bold text-[#101212] dark:text-white">No Portfolio Companies Recorded</p>
                      <p className="text-xs text-gray-400 mt-1">Investments and syndicate participation will appear here.</p>
                    </td>
                  </tr>
                ) : (
                filteredPortfolio.map((comp) => (
                  <tr
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp)}
                    className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#101212] dark:text-white">
                            {comp.name}
                          </div>
                          <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                            {comp.sector}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      {comp.stageInvested} ({comp.investmentYear})
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#101212] dark:text-white">
                      {comp.checkInvested}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#101212] dark:text-white">
                      {comp.equityPercentage}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {comp.currentMultiple}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {comp.growthMoM}
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#202422] font-semibold">
                        {comp.boardSeat}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          comp.status === 'Outperforming'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : comp.status === 'Healthy'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {comp.status}
                      </span>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Founder Updates View */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {filteredPortfolio.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
              <Calendar className="w-10 h-10 mx-auto text-gray-400 opacity-50 mb-2" />
              <p className="text-sm font-bold text-[#101212] dark:text-white">No Portfolio Updates Yet</p>
              <p className="text-xs text-gray-400 mt-1">Founder quarterly letters and KPI updates will be logged here.</p>
            </div>
          ) : (
          filteredPortfolio.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700">
                    <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                      {comp.name}
                    </h3>
                    <span className="text-[10px] text-gray-400">{comp.sector}</span>
                  </div>
                </div>

                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  {comp.recentUpdate.date}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F]">
                  {comp.recentUpdate.title}
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 leading-relaxed">
                  {comp.recentUpdate.summary}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-[#262A29]">
                <span>Ownership: {comp.equityPercentage} &bull; Check: {comp.checkInvested}</span>
                <button
                  onClick={() => showToast(`Opening founder report channel for ${comp.name}`, 'info')}
                  className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline cursor-pointer"
                >
                  Direct Message Founder &rarr;
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {/* 5. Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700">
                  <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                    {selectedCompany.name}
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {selectedCompany.sector} &bull; Invested {selectedCompany.investmentYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422]">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Check:</span>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">{selectedCompany.checkInvested}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Fund Ownership:</span>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">{selectedCompany.equityPercentage}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Current MOIC:</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">{selectedCompany.currentMultiple}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Governance:</span>
                  <span className="font-bold text-sm text-[#101212] dark:text-white">{selectedCompany.boardSeat}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] space-y-1">
                <span className="font-bold text-[#101212] dark:text-white block">Latest Performance Update:</span>
                <p className="text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {selectedCompany.recentUpdate.summary}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
