'use client';

import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  Plus,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  BarChart3,
  Layers,
  GraduationCap,
  Briefcase,
  PieChart,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { espProfilesData } from '@/data/espProfilesData';
import { ESPPortfolioStartup, ESPRelationshipType } from '@/types/esp';

interface ESPPortfolioManagerProps {
  onOpenStartupProfile?: (startupId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const ESPPortfolioManager: React.FC<ESPPortfolioManagerProps> = ({
  onOpenStartupProfile,
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const esp = espProfilesData['uni_9'];
  const [portfolio, setPortfolio] = useState<ESPPortfolioStartup[]>(esp.portfolio);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'alumni' | 'analytics'>('active');

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New portfolio entry state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('Seed');
  const [cohort, setCohort] = useState('Lab32 Cohort 12');
  const [founders, setFounders] = useState('');
  const [relationship, setRelationship] = useState<ESPRelationshipType>('Incubated');
  const [funding, setFunding] = useState('$500K');

  // Active vs Alumni lists
  const activeStartups = portfolio.filter((st) => st.currentStatus !== 'Alumni' && st.currentStatus !== 'Acquired');
  const alumniStartups: ESPPortfolioStartup[] = [
    ...portfolio.filter((st) => st.currentStatus === 'Alumni' || st.currentStatus === 'Acquired'),
    // Comprehensive mock alumni dataset
    {
      id: 'alumni_1',
      name: 'Zenoti Cloud Systems',
      logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150',
      industry: 'Enterprise SaaS',
      stage: 'Unicorn / Series D',
      cohortProgram: 'Lab32 Cohort 2',
      year: 2019,
      founders: 'Sudheer Koneru',
      currentStatus: 'Alumni',
      fundingStage: 'Series D ($160M)',
      fundingRaised: '$250M',
      relationshipType: 'Accelerated' as const,
      isEndorsed: true,
    },
    {
      id: 'alumni_2',
      name: 'Darwinbox HRTech',
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150',
      industry: 'Human Capital SaaS',
      stage: 'Unicorn',
      cohortProgram: 'Lab32 Cohort 3',
      year: 2020,
      founders: 'Chaitanya Peddi, Jayant Paleti',
      currentStatus: 'Alumni',
      fundingStage: 'Series D ($72M)',
      fundingRaised: '$110M',
      relationshipType: 'Incubated' as const,
      isEndorsed: true,
    },
    {
      id: 'alumni_3',
      name: 'Skyroot Aerospace',
      logo: 'https://images.unsplash.com/photo-1517976487502-570a98293774?w=150',
      industry: 'SpaceTech / Launch Vehicles',
      stage: 'Series B',
      cohortProgram: 'T-Angel Cohort 2',
      year: 2021,
      founders: 'Pawan Kumar Chandana, Bharath Daka',
      currentStatus: 'Alumni',
      fundingStage: 'Series B ($51M)',
      fundingRaised: '$95M',
      relationshipType: 'Portfolio Startup' as const,
      isEndorsed: true,
    },
  ];

  const currentList = activeSubTab === 'active' ? activeStartups : alumniStartups;

  const filteredList = currentList.filter((st) => {
    if (filter === 'Endorsed' && !st.isEndorsed) return false;
    if (filter !== 'all' && filter !== 'Endorsed') {
      const matchStatus = st.currentStatus.toLowerCase() === filter.toLowerCase();
      const matchRel = st.relationshipType && st.relationshipType.toLowerCase() === filter.toLowerCase();
      if (!matchStatus && !matchRel) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.industry.toLowerCase().includes(q) ||
      st.founders.toLowerCase().includes(q)
    );
  });

  const handleAddStartup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newEntry: ESPPortfolioStartup = {
      id: `port_new_${Date.now()}`,
      name,
      logo: '/images/profile_avatar.webp',
      industry: industry || 'Technology',
      stage,
      cohortProgram: cohort,
      year: new Date().getFullYear(),
      founders: founders || 'Founding Team',
      currentStatus: 'Active',
      fundingStage: stage,
      fundingRaised: funding,
      relationshipType: relationship,
      isEndorsed: true,
      endorsementStatus: 'active',
      programName: cohort,
    };

    setPortfolio([newEntry, ...portfolio]);
    setIsAddModalOpen(false);
    showToast(`Added ${name} to institutional portfolio!`, 'success');

    setName('');
    setIndustry('');
    setFounders('');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Portfolio & Ventures Directory
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {portfolio.length} Active Ventures • {alumniStartups.length} Alumni
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Track incubated ventures, accelerated cohorts, alumni outcomes, and portfolio capital leverage.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Startup to Portfolio</span>
        </button>
      </div>

      {/* 3 Sub-Tabs: Active Startups, Alumni, Portfolio Analytics */}
      <div className="bg-white dark:bg-[#181B1A] p-1.5 rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'active' as const, label: 'Active Startups', icon: Award, count: activeStartups.length },
          { id: 'alumni' as const, label: 'Alumni', icon: GraduationCap, count: alumniStartups.length },
          { id: 'analytics' as const, label: 'Portfolio Analytics', icon: BarChart3 },
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
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#101212]'
                      : 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW: ACTIVE & ALUMNI */}
      {activeSubTab !== 'analytics' && (
        <div className="space-y-4 animate-fade-slide">
          {/* 1. Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search startups, founders, or sector..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'Endorsed', label: '✓ Verified Endorsed' },
                { id: 'Incubated', label: 'Incubated' },
                { id: 'Accelerated', label: 'Accelerated' },
                { id: 'Portfolio Startup', label: 'Funded / Equity' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filter === pill.id
                      ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212]'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Startups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((st) => (
              <div
                key={st.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] shrink-0">
                        <img
                          src={st.logo}
                          alt={st.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                          {st.name}
                        </h3>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {st.industry} • Cohort {st.year}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white">
                      {st.stage}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {st.relationshipType && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                        {st.relationshipType}
                      </span>
                    )}

                    {st.isEndorsed && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Endorsement</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-[#262A29]">
                    <div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block">Founders:</span>
                      <span className="font-semibold text-[#101212] dark:text-white truncate block">{st.founders}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block">Capital Raised:</span>
                      <span className="font-semibold text-emerald-500">{st.fundingRaised || '$0'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#565B59] dark:text-[#B6B8B7]">
                    {st.cohortProgram}
                  </span>
                  <button
                    onClick={() => {
                      if (onOpenStartupProfile && st.xentroStartupId) {
                        onOpenStartupProfile(st.xentroStartupId);
                      } else {
                        showToast(`Viewing venture dossier for ${st.name}`, 'info');
                      }
                    }}
                    className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: PORTFOLIO ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Cumulative Capital Raised', val: '$184.5M', sub: 'Across 45 funded ventures', icon: DollarSign, color: 'text-emerald-500' },
              { label: 'Cohort Survival Rate', val: '86.4%', sub: 'Higher than national avg (42%)', icon: TrendingUp, color: 'text-[#D9FF3F]' },
              { label: 'Follow-On Multiple', val: '14.2x', sub: 'Leverage on institutional seed', icon: BarChart3, color: 'text-cyan-500' },
              { label: 'Total Jobs Created', val: '2,800+', sub: 'High-skill tech & engineering', icon: Briefcase, color: 'text-purple-500' },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2"
                >
                  <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                    <span className="text-xs font-semibold">{m.label}</span>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="text-2xl font-black text-[#101212] dark:text-white font-heading">
                    {m.val}
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{m.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Sector Breakdown and Stage Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#D9FF3F]" />
                <span>Sectoral Concentration</span>
              </h3>
              <div className="space-y-3">
                {[
                  { sector: 'DeepTech & AI Infrastructure', pct: 38, count: '17 Startups' },
                  { sector: 'Enterprise SaaS & Cloud', pct: 26, count: '12 Startups' },
                  { sector: 'CleanTech & Renewable Energy', pct: 18, count: '8 Startups' },
                  { sector: 'MedTech & Bio-Engineering', pct: 12, count: '5 Startups' },
                  { sector: 'Aerospace & Robotics', pct: 6, count: '3 Startups' },
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#101212] dark:text-white">{s.sector}</span>
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">{s.count} ({s.pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-[#202422] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#D9FF3F] h-full rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Maturity Stage Waterfall</span>
              </h3>
              <div className="space-y-3">
                {[
                  { stage: 'Growth / Series A+', pct: 15, count: '7 Startups' },
                  { stage: 'Early Revenue / Seed', pct: 40, count: '18 Startups' },
                  { stage: 'Functional MVP / Pre-Seed', pct: 30, count: '14 Startups' },
                  { stage: 'Prototyping / Pre-Incubation', pct: 15, count: '6 Startups' },
                ].map((st, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#101212] dark:text-white">{st.stage}</span>
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">{st.count} ({st.pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-[#202422] h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${st.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STARTUP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white">Add Startup to Portfolio</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStartup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Startup Legal / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omniscience Robotics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Industry Sector</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Hardware"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Maturity Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Idea">Idea</option>
                    <option value="MVP">MVP</option>
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Early Revenue">Early Revenue</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Relationship Type</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as ESPRelationshipType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Incubated">Incubated</option>
                    <option value="Accelerated">Accelerated</option>
                    <option value="Pre-Incubated">Pre-Incubated</option>
                    <option value="Portfolio Startup">Portfolio Startup (Equity/Funded)</option>
                    <option value="Program Participant">Program Participant</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Capital Raised</label>
                  <input
                    type="text"
                    placeholder="e.g. $750K"
                    value={funding}
                    onChange={(e) => setFunding(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Key Founders</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Rao & Rahul Varma"
                  value={founders}
                  onChange={(e) => setFounders(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Add to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
