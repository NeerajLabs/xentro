'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  DollarSign,
  Sparkles,
  Lock,
  Globe,
  Sliders,
  AlertCircle,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Target,
  Briefcase,
  Users,
  Compass,
  Zap,
  Clock,
  Award,
  FileText,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  FullInvestorProfile,
  PortfolioCompany,
  InvestorTestimonial,
  InvestmentProcessStep,
  InvestorAccountType,
  InvestorVisibility,
  PortfolioCompanyStatus,
} from '@/types/investor';
import {
  getStoredInvestorProfile,
  saveStoredInvestorProfile,
  resetStoredInvestorProfile,
  INVESTOR_PROFILE_UPDATED_EVENT,
} from '@/lib/investorProfileState';
import { investorDomainService } from '@/lib/investorDomainService';

interface InvestorProfileSettingsProps {
  onViewPreview?: () => void;
  investorId?: string;
}

type SettingsTab =
  | 'identity'
  | 'thesis'
  | 'value_criteria'
  | 'process'
  | 'portfolio'
  | 'account_governance';

export const InvestorProfileSettings: React.FC<InvestorProfileSettingsProps> = ({
  onViewPreview,
  investorId = 'inv_own',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [profile, setProfile] = useState<FullInvestorProfile>(() =>
    getStoredInvestorProfile(investorId, { ownProfile: true })
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sync if profile is updated elsewhere
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.profile) {
        setProfile(ce.detail.profile);
      } else {
        setProfile(getStoredInvestorProfile(investorId, { ownProfile: true }));
      }
    };
    window.addEventListener(INVESTOR_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    return () => {
      window.removeEventListener(INVESTOR_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    };
  }, [investorId]);

  // Temporary item input states
  const [newSector, setNewSector] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newSupportArea, setNewSupportArea] = useState('');
  const [newAdvisoryCap, setNewAdvisoryCap] = useState('');
  const [newEvalCriteria, setNewEvalCriteria] = useState('');
  const [newDiligenceHighlight, setNewDiligenceHighlight] = useState('');
  const [newInstrument, setNewInstrument] = useState('');
  const [newInitialInfo, setNewInitialInfo] = useState('');

  // Modals for Adding Company & Testimonial
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState<PortfolioCompany>({
    id: '',
    name: '',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    sector: '',
    stageInvested: 'Seed',
    investmentYear: new Date().getFullYear().toString(),
    currentStatus: 'Active',
    description: '',
    xentroStartupId: '',
  });

  const [isAddTestimonialOpen, setIsAddTestimonialOpen] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState<InvestorTestimonial>({
    id: '',
    founderName: '',
    founderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    founderRole: 'Founder & CEO',
    startupName: '',
    relationship: 'Seed Portfolio Founder',
    testimonial: '',
    verified: true,
  });

  // Master Save Handler
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredInvestorProfile(profile);
    setIsSaved(true);
    showToast('Investor profile and settings updated successfully!', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset your investor profile back to initial defaults?')) {
      const reset = resetStoredInvestorProfile(investorId);
      setProfile(reset);
      showToast('Profile restored to default platform verified data.', 'info');
    }
  };

  // Helper updates
  const updateIdentity = (fields: Partial<FullInvestorProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const updateLocation = (fields: Partial<FullInvestorProfile['location']>) => {
    setProfile((prev) => ({
      ...prev,
      location: { ...prev.location, ...fields },
    }));
  };

  const updateOverview = (fields: Partial<FullInvestorProfile['overview']>) => {
    setProfile((prev) => ({
      ...prev,
      overview: { ...prev.overview, ...fields },
    }));
  };

  const updateFocus = (fields: Partial<FullInvestorProfile['investmentFocus']>) => {
    setProfile((prev) => ({
      ...prev,
      investmentFocus: { ...prev.investmentFocus, ...fields },
    }));
  };

  const updateTicketSize = (fields: Partial<FullInvestorProfile['investmentFocus']['ticketSize']>) => {
    setProfile((prev) => {
      const ticket = { ...prev.investmentFocus.ticketSize, ...fields };
      ticket.formatted = `${ticket.min} – ${ticket.max}`;
      return {
        ...prev,
        investmentFocus: { ...prev.investmentFocus, ticketSize: ticket },
      };
    });
  };

  const updateValue = (fields: Partial<FullInvestorProfile['valueBeyondCapital']>) => {
    setProfile((prev) => ({
      ...prev,
      valueBeyondCapital: { ...prev.valueBeyondCapital, ...fields },
    }));
  };

  const updateCriteria = (fields: Partial<FullInvestorProfile['investmentCriteria']>) => {
    setProfile((prev) => ({
      ...prev,
      investmentCriteria: { ...prev.investmentCriteria, ...fields },
    }));
  };

  const updateProcess = (fields: Partial<FullInvestorProfile['investmentProcess']>) => {
    setProfile((prev) => ({
      ...prev,
      investmentProcess: { ...prev.investmentProcess, ...fields },
    }));
  };

  const updateConnectionPrefs = (fields: Partial<FullInvestorProfile['connectionPreferences']>) => {
    setProfile((prev) => ({
      ...prev,
      connectionPreferences: { ...prev.connectionPreferences, ...fields },
    }));
  };

  const updateStats = (fields: Partial<FullInvestorProfile['experienceStats']>) => {
    setProfile((prev) => ({
      ...prev,
      experienceStats: { ...prev.experienceStats, ...fields },
    }));
  };

  // Tag list modifiers
  const addItem = (key: string, value: string, setter: (v: string) => void) => {
    const val = value.trim();
    if (!val) return;
    if (key === 'sectors') {
      if (!profile.investmentFocus.sectors.includes(val)) {
        updateFocus({ sectors: [...profile.investmentFocus.sectors, val] });
      }
    } else if (key === 'countries') {
      if (!profile.investmentFocus.geography.countries.includes(val)) {
        updateFocus({
          geography: {
            ...profile.investmentFocus.geography,
            countries: [...profile.investmentFocus.geography.countries, val],
          },
        });
      }
    } else if (key === 'instruments') {
      const current = profile.investmentFocus.investmentInstruments || [];
      if (!current.includes(val)) {
        updateFocus({ investmentInstruments: [...current, val] });
      }
    } else if (key === 'supportAreas') {
      if (!profile.valueBeyondCapital.supportAreas.includes(val)) {
        updateValue({ supportAreas: [...profile.valueBeyondCapital.supportAreas, val] });
      }
    } else if (key === 'advisoryCaps') {
      const current = profile.valueBeyondCapital.advisoryCapabilities || [];
      if (!current.includes(val)) {
        updateValue({ advisoryCapabilities: [...current, val] });
      }
    } else if (key === 'evalCriteria') {
      if (!profile.investmentCriteria.evaluationCriteria.includes(val)) {
        updateCriteria({ evaluationCriteria: [...profile.investmentCriteria.evaluationCriteria, val] });
      }
    } else if (key === 'diligenceHighlights') {
      const current = profile.investmentCriteria.diligenceHighlights || [];
      if (!current.includes(val)) {
        updateCriteria({ diligenceHighlights: [...current, val] });
      }
    } else if (key === 'initialInfo') {
      const current = profile.investmentProcess.informationRequiredInitially || [];
      if (!current.includes(val)) {
        updateProcess({ informationRequiredInitially: [...current, val] });
      }
    }
    setter('');
  };

  const removeItem = (key: string, idxToRemove: number) => {
    if (key === 'sectors') {
      updateFocus({ sectors: profile.investmentFocus.sectors.filter((_, i) => i !== idxToRemove) });
    } else if (key === 'countries') {
      updateFocus({
        geography: {
          ...profile.investmentFocus.geography,
          countries: profile.investmentFocus.geography.countries.filter((_, i) => i !== idxToRemove),
        },
      });
    } else if (key === 'instruments') {
      const current = profile.investmentFocus.investmentInstruments || [];
      updateFocus({ investmentInstruments: current.filter((_, i) => i !== idxToRemove) });
    } else if (key === 'supportAreas') {
      updateValue({
        supportAreas: profile.valueBeyondCapital.supportAreas.filter((_, i) => i !== idxToRemove),
      });
    } else if (key === 'advisoryCaps') {
      const current = profile.valueBeyondCapital.advisoryCapabilities || [];
      updateValue({ advisoryCapabilities: current.filter((_, i) => i !== idxToRemove) });
    } else if (key === 'evalCriteria') {
      updateCriteria({
        evaluationCriteria: profile.investmentCriteria.evaluationCriteria.filter((_, i) => i !== idxToRemove),
      });
    } else if (key === 'diligenceHighlights') {
      const current = profile.investmentCriteria.diligenceHighlights || [];
      updateCriteria({ diligenceHighlights: current.filter((_, i) => i !== idxToRemove) });
    } else if (key === 'initialInfo') {
      const current = profile.investmentProcess.informationRequiredInitially || [];
      updateProcess({ informationRequiredInitially: current.filter((_, i) => i !== idxToRemove) });
    }
  };

  // Toggle stage / model / traction
  const toggleStage = (stg: any) => {
    const current = profile.investmentFocus.stages;
    const next = current.includes(stg) ? current.filter((s) => s !== stg) : [...current, stg];
    updateFocus({ stages: next });
  };

  const toggleBusinessModel = (bm: any) => {
    const current = profile.investmentFocus.businessModels;
    const next = current.includes(bm) ? current.filter((b) => b !== bm) : [...current, bm];
    updateFocus({ businessModels: next });
  };

  const toggleTraction = (tr: any) => {
    const current = profile.investmentCriteria.preferredTraction;
    const next = current.includes(tr) ? current.filter((t) => t !== tr) : [...current, tr];
    updateCriteria({ preferredTraction: next });
  };

  // Portfolio Handlers
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    const newCo: PortfolioCompany = {
      ...companyForm,
      id: `port_${Date.now()}`,
    };
    setProfile((prev) => ({
      ...prev,
      portfolio: [newCo, ...prev.portfolio],
    }));
    setIsAddCompanyOpen(false);
    setCompanyForm({
      id: '',
      name: '',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      sector: '',
      stageInvested: 'Seed',
      investmentYear: new Date().getFullYear().toString(),
      currentStatus: 'Active',
      description: '',
      xentroStartupId: '',
    });
    showToast(`Added ${newCo.name} to portfolio!`, 'success');
  };

  const handleDeleteCompany = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((c) => c.id !== id),
    }));
    showToast('Portfolio company removed.', 'info');
  };

  // Testimonial Handlers
  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.founderName || !testimonialForm.testimonial) return;
    const newTest: InvestorTestimonial = {
      ...testimonialForm,
      id: `test_${Date.now()}`,
    };
    setProfile((prev) => ({
      ...prev,
      testimonials: [newTest, ...prev.testimonials],
    }));
    setIsAddTestimonialOpen(false);
    setTestimonialForm({
      id: '',
      founderName: '',
      founderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      founderRole: 'Founder & CEO',
      startupName: '',
      relationship: 'Seed Portfolio Founder',
      testimonial: '',
      verified: true,
    });
    showToast(`Testimonial from ${newTest.founderName} added!`, 'success');
  };

  const handleDeleteTestimonial = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((t) => t.id !== id),
    }));
    showToast('Testimonial removed.', 'info');
  };

  // Available options
  const allStages = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series B+', 'Growth'] as const;
  const allBusinessModels = ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'D2C', 'Hardware', 'DeepTech'] as const;
  const allTractions = ['Idea', 'MVP', 'Early Revenue', 'PMF', 'Growth'] as const;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Investor Profile & Account Settings</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Edit every public-facing profile detail, investment thesis, portfolio ventures, and inbound rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#202422] text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Reset to Verified Platform Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          {onViewPreview && (
            <button
              type="button"
              onClick={onViewPreview}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Preview Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="p-1.5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Identity & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('thesis')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'thesis'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Investment Focus</span>
        </button>

        <button
          onClick={() => setActiveTab('value_criteria')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'value_criteria'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Value & Criteria</span>
        </button>

        <button
          onClick={() => setActiveTab('process')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'process'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Process & Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Portfolio & Experience ({profile.portfolio.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('account_governance')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'account_governance'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Account & Visibility</span>
        </button>
      </div>

      {/* 3. Tab Body Area */}
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: IDENTITY & OVERVIEW                                */}
        {/* ========================================================= */}
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Core Identity Details */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Building2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investor Identity & Branding</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Investor / Fund Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateIdentity({ name: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Investor Entity Type
                  </label>
                  <select
                    value={profile.investorType}
                    onChange={(e) => updateIdentity({ investorType: e.target.value as any })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  >
                    <option value="Venture Capital">Venture Capital</option>
                    <option value="Angel Network">Angel Network</option>
                    <option value="Corporate VC">Corporate VC</option>
                    <option value="Growth Fund">Growth Fund</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Angel Investor">Angel Investor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Current Role / Title
                  </label>
                  <input
                    type="text"
                    value={profile.currentRole}
                    onChange={(e) => updateIdentity({ currentRole: e.target.value })}
                    placeholder="e.g. Managing Partner, Lead Partner"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Organization / Firm Name
                  </label>
                  <input
                    type="text"
                    value={profile.organization}
                    onChange={(e) => updateIdentity({ organization: e.target.value })}
                    placeholder="e.g. Apex Ventures LLP"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Headquarters City
                  </label>
                  <input
                    type="text"
                    value={profile.location.city}
                    onChange={(e) => updateLocation({ city: e.target.value })}
                    placeholder="e.g. Bengaluru, San Francisco"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={profile.location.country}
                    onChange={(e) => updateLocation({ country: e.target.value })}
                    placeholder="e.g. India, United States"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => updateIdentity({ website: e.target.value })}
                    placeholder="https://yourfund.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={profile.linkedIn || ''}
                    onChange={(e) => updateIdentity({ linkedIn: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Years of Investing Experience
                  </label>
                  <input
                    type="text"
                    value={profile.yearsOfInvestingExperience}
                    onChange={(e) => updateIdentity({ yearsOfInvestingExperience: e.target.value })}
                    placeholder="e.g. 15+ Years in Global Venture"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#101212] dark:text-white block mb-1 text-xs">
                  Primary Investment Focus Headline
                </label>
                <input
                  type="text"
                  value={profile.primaryInvestmentFocus}
                  onChange={(e) => updateIdentity({ primaryInvestmentFocus: e.target.value })}
                  placeholder="e.g. AI Systems · Enterprise SaaS · DeepTech"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Logo / Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={profile.logo}
                    onChange={(e) => updateIdentity({ logo: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Banner Background Image URL
                  </label>
                  <input
                    type="url"
                    value={profile.banner}
                    onChange={(e) => updateIdentity({ banner: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>

            {/* Bios & Institutional Background */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <FileText className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Professional Bio & Narrative</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Professional Bio *
                  </label>
                  <textarea
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => updateIdentity({ bio: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Background & Institutional Context
                  </label>
                  <textarea
                    rows={3}
                    value={profile.background}
                    onChange={(e) => updateIdentity({ background: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>

            {/* Investor Overview 4-Pillars */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Compass className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investor Overview (4 Core Pillars)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Who We Invest In
                  </label>
                  <textarea
                    rows={3}
                    value={profile.overview.whoTheyInvestIn}
                    onChange={(e) => updateOverview({ whoTheyInvestIn: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Sectors We Focus On
                  </label>
                  <textarea
                    rows={3}
                    value={profile.overview.sectorsFocus}
                    onChange={(e) => updateOverview({ sectorsFocus: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Investment Philosophy
                  </label>
                  <textarea
                    rows={3}
                    value={profile.overview.investmentPhilosophy}
                    onChange={(e) => updateOverview({ investmentPhilosophy: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    What We Aim to Contribute
                  </label>
                  <textarea
                    rows={3}
                    value={profile.overview.aimToContribute}
                    onChange={(e) => updateOverview({ aimToContribute: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INVESTMENT FOCUS & THESIS                          */}
        {/* ========================================================= */}
        {activeTab === 'thesis' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Cheque Parameters & Preferences */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <DollarSign className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Ticket Size & Syndication Roles</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Minimum Check Size
                  </label>
                  <input
                    type="text"
                    value={profile.investmentFocus.ticketSize.min}
                    onChange={(e) => updateTicketSize({ min: e.target.value })}
                    placeholder="e.g. $500K or ₹2 Cr"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Maximum Check Size
                  </label>
                  <input
                    type="text"
                    value={profile.investmentFocus.ticketSize.max}
                    onChange={(e) => updateTicketSize({ max: e.target.value })}
                    placeholder="e.g. $10M or ₹25 Cr"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Formatted Range Preview
                  </label>
                  <input
                    type="text"
                    value={profile.investmentFocus.ticketSize.formatted}
                    onChange={(e) => updateTicketSize({ formatted: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Lead Investor Preference
                  </label>
                  <input
                    type="text"
                    value={profile.investmentFocus.leadInvestorPreference || ''}
                    onChange={(e) => updateFocus({ leadInvestorPreference: e.target.value })}
                    placeholder="e.g. Lead / Co-lead Preferred"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Co-investor & Syndicate Preference
                  </label>
                  <input
                    type="text"
                    value={profile.investmentFocus.coInvestorPreference || ''}
                    onChange={(e) => updateFocus({ coInvestorPreference: e.target.value })}
                    placeholder="e.g. Open to syndicating with verified funds & angels"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>

            {/* Target Sectors Tag Manager */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <span>Target Sectors ({profile.investmentFocus.sectors.length})</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {profile.investmentFocus.sectors.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('sectors', idx)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('sectors', newSector, setNewSector)}
                  placeholder="Add new sector (e.g. Enterprise AI, ClimateTech)..."
                  className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
                <button
                  type="button"
                  onClick={() => addItem('sectors', newSector, setNewSector)}
                  className="px-3 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Target Stages & Business Models */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stages */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Target Startup Stages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allStages.map((stg) => {
                    const active = profile.investmentFocus.stages.includes(stg as any);
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => toggleStage(stg)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] border-transparent'
                            : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Models */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Target Business Models
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allBusinessModels.map((bm) => {
                    const active = profile.investmentFocus.businessModels.includes(bm as any);
                    return (
                      <button
                        key={bm}
                        type="button"
                        onClick={() => toggleBusinessModel(bm)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          active
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] border-transparent'
                            : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {bm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Geography & Instruments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Countries */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Target Geography / Countries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.investmentFocus.geography.countries.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('countries', idx)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('countries', newCountry, setNewCountry)}
                    placeholder="Add country (e.g. India, USA)..."
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                  <button
                    type="button"
                    onClick={() => addItem('countries', newCountry, setNewCountry)}
                    className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Instruments */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Investment Instruments
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.investmentFocus.investmentInstruments || []).map((ins, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F7F8F6] dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      <span>{ins}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('instruments', idx)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('instruments', newInstrument, setNewInstrument)}
                    placeholder="Add instrument (e.g. SAFE, Priced Equity)..."
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                  <button
                    type="button"
                    onClick={() => addItem('instruments', newInstrument, setNewInstrument)}
                    className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: VALUE BEYOND CAPITAL & CRITERIA                    */}
        {/* ========================================================= */}
        {activeTab === 'value_criteria' && (
          <div className="space-y-6 animate-fade-slide">
            {/* What We Bring To Founders */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Zap className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Value Beyond Capital Narrative</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-[#101212] dark:text-white block">
                  What We Bring to Founders (Personalized Statement)
                </label>
                <textarea
                  rows={3}
                  value={profile.valueBeyondCapital.whatIBringToFounders}
                  onChange={(e) => updateValue({ whatIBringToFounders: e.target.value })}
                  placeholder="Describe your operator network, talent recruiting, enterprise customer access, and follow-on round pricing support..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            {/* Active Support Areas */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Active Support Areas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {profile.valueBeyondCapital.supportAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between text-[#101212] dark:text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                      <span>{area}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem('supportAreas', idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSupportArea}
                  onChange={(e) => setNewSupportArea(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('supportAreas', newSupportArea, setNewSupportArea)}
                  placeholder="Add support area (e.g. Hiring & Talent, Global Customer Intros)..."
                  className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
                <button
                  type="button"
                  onClick={() => addItem('supportAreas', newSupportArea, setNewSupportArea)}
                  className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                >
                  Add Area
                </button>
              </div>
            </div>

            {/* Preferred Traction Pipeline */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Preferred Traction Stages (Click to toggle backed stages)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {allTractions.map((tr) => {
                  const backed = profile.investmentCriteria.preferredTraction.includes(tr);
                  return (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => toggleTraction(tr)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        backed
                          ? 'bg-[#D9FF3F]/20 border-[#D9FF3F] text-[#101212] dark:text-white font-bold'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] opacity-60'
                      }`}
                    >
                      <div className="text-[10px] uppercase mb-0.5">{backed ? '✓ Backed' : '— Excluded'}</div>
                      <div className="text-xs font-bold">{tr}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Evaluation Criteria List */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Core Evaluation Factors
              </h3>

              <div className="space-y-2 text-xs">
                {profile.investmentCriteria.evaluationCriteria.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center justify-between text-[#101212] dark:text-white font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#D9FF3F] text-[#101212] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{crit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem('evalCriteria', idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newEvalCriteria}
                  onChange={(e) => setNewEvalCriteria(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('evalCriteria', newEvalCriteria, setNewEvalCriteria)}
                  placeholder="Add evaluation factor (e.g. TAM > $5B, Unit Economics, Founder Velocity)..."
                  className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
                <button
                  type="button"
                  onClick={() => addItem('evalCriteria', newEvalCriteria, setNewEvalCriteria)}
                  className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                >
                  Add Factor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROCESS & TIMELINE                                 */}
        {/* ========================================================= */}
        {activeTab === 'process' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Timeline & Connection Rules */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Clock className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investment Timeline & Connection Protocols</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Typical Decision Timeline
                  </label>
                  <input
                    type="text"
                    value={profile.investmentProcess.typicalDecisionTimeline}
                    onChange={(e) => updateProcess({ typicalDecisionTimeline: e.target.value })}
                    placeholder="e.g. 2 to 3 Weeks from First Meeting"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Preferred Way to Connect
                  </label>
                  <input
                    type="text"
                    value={profile.investmentProcess.preferredConnectionMethod}
                    onChange={(e) => updateProcess({ preferredConnectionMethod: e.target.value })}
                    placeholder="e.g. Platform Connection Request or Warm Introduction"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="text-xs pt-1">
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Pitch Deck Requirements Description
                </label>
                <textarea
                  rows={2}
                  value={profile.investmentProcess.pitchDeckRequirements}
                  onChange={(e) => updateProcess({ pitchDeckRequirements: e.target.value })}
                  placeholder="e.g. Concise 12-15 slide deck highlighting Problem, Solution, Tech Moat, Team, and MRR metrics."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.investmentProcess.warmIntroPreferred}
                    onChange={(e) => updateProcess({ warmIntroPreferred: e.target.checked })}
                    className="w-4 h-4 text-[#D9FF3F] rounded"
                  />
                  <div>
                    <span className="font-bold text-[#101212] dark:text-white block">Warm Intro Preferred</span>
                    <span className="text-[11px] text-gray-400">Recommend verified introductions from platform peers</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.investmentProcess.unsolicitedPitchesAccepted}
                    onChange={(e) => updateProcess({ unsolicitedPitchesAccepted: e.target.checked })}
                    className="w-4 h-4 text-[#D9FF3F] rounded"
                  />
                  <div>
                    <span className="font-bold text-[#101212] dark:text-white block">Unsolicited Pitches Accepted</span>
                    <span className="text-[11px] text-gray-400">Permit direct formal pitch deck uploads</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Stepper Stages Timeline Editor */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Configured Investment Stages ({profile.investmentProcess.stages.length} Stages)
              </h3>

              <div className="space-y-3">
                {profile.investmentProcess.stages.map((stage, idx) => (
                  <div
                    key={stage.stepNumber}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#D9FF3F] text-[#101212] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {stage.stepNumber}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={stage.title}
                          onChange={(e) => {
                            const updated = [...profile.investmentProcess.stages];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            updateProcess({ stages: updated });
                          }}
                          className="h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] font-bold text-[#101212] dark:text-white"
                        />
                        <input
                          type="text"
                          value={stage.estimatedTime || ''}
                          onChange={(e) => {
                            const updated = [...profile.investmentProcess.stages];
                            updated[idx] = { ...updated[idx], estimatedTime: e.target.value };
                            updateProcess({ stages: updated });
                          }}
                          placeholder="Estimated time (e.g. Week 1)"
                          className="h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-gray-500"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={stage.description}
                        onChange={(e) => {
                          const updated = [...profile.investmentProcess.stages];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          updateProcess({ stages: updated });
                        }}
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PORTFOLIO & TESTIMONIALS                           */}
        {/* ========================================================= */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Experience Stats */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-[#262A29] pb-3">
                <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Investment Experience & Track Record Metrics</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Total Investments
                  </label>
                  <input
                    type="number"
                    value={profile.experienceStats.totalInvestments || 0}
                    onChange={(e) => updateStats({ totalInvestments: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Active Portfolio
                  </label>
                  <input
                    type="number"
                    value={profile.experienceStats.activePortfolio || 0}
                    onChange={(e) => updateStats({ activePortfolio: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Follow-on Rounds
                  </label>
                  <input
                    type="number"
                    value={profile.experienceStats.followOnInvestments || 0}
                    onChange={(e) => updateStats({ followOnInvestments: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Exits / IPOs
                  </label>
                  <input
                    type="number"
                    value={profile.experienceStats.exits || 0}
                    onChange={(e) => updateStats({ exits: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Experience Years
                  </label>
                  <input
                    type="text"
                    value={profile.experienceStats.yearsOfExperience || '10+'}
                    onChange={(e) => updateStats({ yearsOfExperience: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#101212] dark:text-white block mb-1">
                    Industries Backed
                  </label>
                  <input
                    type="number"
                    value={profile.experienceStats.industriesInvested || 0}
                    onChange={(e) => updateStats({ industriesInvested: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Portfolio Companies Management */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Portfolio Companies ({profile.portfolio.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.portfolio.map((co) => (
                  <div
                    key={co.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex-shrink-0">
                        <img src={co.logo} alt={co.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[#101212] dark:text-white truncate">{co.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                            {co.currentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{co.sector} · {co.stageInvested} ({co.investmentYear})</p>
                        {co.xentroStartupId && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-0.5">
                            ✓ Linked to Xentro Venture #{co.xentroStartupId}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(co.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Remove Company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Founder Testimonials Management */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262A29] pb-3">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                  <span>Founder Testimonials ({profile.testimonials.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setIsAddTestimonialOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Testimonial</span>
                </button>
              </div>

              <div className="space-y-3">
                {profile.testimonials.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="italic text-[#101212] dark:text-white">"{test.testimonial}"</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-bold text-[#101212] dark:text-white">{test.founderName}</span>
                        <span className="text-gray-400">· {test.founderRole}, {test.startupName}</span>
                        {test.verified && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            (Verified)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(test.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Remove Testimonial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ACCOUNT, VISIBILITY & GOVERNANCE                   */}
        {/* ========================================================= */}
        {activeTab === 'account_governance' && (
          <div className="space-y-6 animate-fade-slide">
            {/* Dual Account Mode */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Dual Account Architecture Mode
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div
                  onClick={() => updateIdentity({ accountType: 'organization' })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    profile.accountType === 'organization'
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                      : 'border-gray-200 dark:border-[#262A29]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[#101212] dark:text-white">
                      <Building2 className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                      <span>Organization Entity Account</span>
                    </div>
                    {profile.accountType === 'organization' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D9FF3F] text-[#101212]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Institutional firm entity. Team RBAC permissions, shared pipeline, and firm diligence vault.
                  </p>
                </div>

                <div
                  onClick={() => updateIdentity({ accountType: 'individual' })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    profile.accountType === 'individual'
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                      : 'border-gray-200 dark:border-[#262A29]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[#101212] dark:text-white">
                      <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
                      <span>Individual Angel Investor Mode</span>
                    </div>
                    {profile.accountType === 'individual' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D9FF3F] text-[#101212]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Independent Angel. Write personal angel checks and syndicate deals under your individual verified name.
                  </p>
                </div>
              </div>
            </div>

            {/* 4-Tier Public Visibility */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                4-Tier Public Visibility Control
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {(['public', 'limited', 'private', 'ghost'] as const).map((vis) => (
                  <div
                    key={vis}
                    onClick={() => updateIdentity({ visibility: vis })}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      profile.visibility === vis
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                        : 'border-gray-200 dark:border-[#262A29]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#101212] dark:text-white capitalize">{vis}</span>
                      {vis === 'public' && <Globe className="w-4 h-4 text-[#D9FF3F]" />}
                      {vis === 'limited' && <Sliders className="w-4 h-4 text-purple-500" />}
                      {vis === 'private' && <Lock className="w-4 h-4 text-amber-500" />}
                      {vis === 'ghost' && <EyeOff className="w-4 h-4 text-rose-500" />}
                    </div>
                    <p className="text-gray-400 text-[11px]">
                      {vis === 'public' && 'Visible in directory to all ecosystem users.'}
                      {vis === 'limited' && 'Visible only to verified matching ventures.'}
                      {vis === 'private' && 'Unlisted. Accessible via direct share only.'}
                      {vis === 'ghost' && 'Anonymous browsing. Conceal identity.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inbound Pitch Rules & Connection Preferences */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Inbound Pitching Rules & Connection Preferences
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.connectionPreferences.openToStartupPitches}
                    onChange={(e) => updateConnectionPrefs({ openToStartupPitches: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F]"
                  />
                  <span className="font-semibold text-[#101212] dark:text-white">
                    Open to startup pitch deck submissions
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.connectionPreferences.openToConnectionRequests}
                    onChange={(e) => updateConnectionPrefs({ openToConnectionRequests: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F]"
                  />
                  <span className="font-semibold text-[#101212] dark:text-white">
                    Open to direct connection requests from verified network peers
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.connectionPreferences.currentlyInvesting}
                    onChange={(e) => updateConnectionPrefs({ currentlyInvesting: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F]"
                  />
                  <span className="font-semibold text-[#101212] dark:text-white">
                    Fund Deployment Status: Actively Investing
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.connectionPreferences.notAcceptingNewPitches}
                    onChange={(e) => updateConnectionPrefs({ notAcceptingNewPitches: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F]"
                  />
                  <span className="font-semibold text-[#101212] dark:text-white">
                    Temporarily pause inbound pitches (Not Accepting New Pitches)
                  </span>
                </label>
              </div>

              <div className="text-xs pt-2">
                <label className="font-bold text-[#101212] dark:text-white block mb-1">
                  Inbound Guidelines & Founder Note
                </label>
                <textarea
                  rows={3}
                  value={profile.connectionPreferences.guidelines || ''}
                  onChange={(e) => updateConnectionPrefs({ guidelines: e.target.value })}
                  placeholder="Note to founders submitting pitches or requesting intros..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD PORTFOLIO COMPANY                            */}
      {/* ========================================================= */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#101212] dark:text-white border-b border-gray-100 dark:border-[#262A29] pb-3">
              Add Featured Portfolio Company
            </h3>

            <form onSubmit={handleAddCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  placeholder="e.g. Portfolio Company Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Sector *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.sector}
                    onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                    placeholder="e.g. Enterprise AI"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Stage Invested</label>
                  <select
                    value={companyForm.stageInvested}
                    onChange={(e) => setCompanyForm({ ...companyForm, stageInvested: e.target.value as any })}
                    className="w-full h-9 px-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                    <option value="Growth">Growth</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Current Status</label>
                  <select
                    value={companyForm.currentStatus}
                    onChange={(e) => setCompanyForm({ ...companyForm, currentStatus: e.target.value as PortfolioCompanyStatus })}
                    className="w-full h-9 px-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Scaled">Scaled</option>
                    <option value="Acquired">Acquired</option>
                    <option value="IPO">IPO</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Investment Year</label>
                  <input
                    type="text"
                    value={companyForm.investmentYear}
                    onChange={(e) => setCompanyForm({ ...companyForm, investmentYear: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                    placeholder="2024"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Logo URL</label>
                <input
                  type="url"
                  value={companyForm.logo}
                  onChange={(e) => setCompanyForm({ ...companyForm, logo: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Xentro Startup ID (Optional - creates link to profile)</label>
                <input
                  type="text"
                  value={companyForm.xentroStartupId || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, xentroStartupId: e.target.value })}
                  placeholder="e.g. st_1"
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={companyForm.description || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D9FF3F] text-[#101212]"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD TESTIMONIAL                                  */}
      {/* ========================================================= */}
      {isAddTestimonialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#101212] dark:text-white border-b border-gray-100 dark:border-[#262A29] pb-3">
              Add Founder Testimonial
            </h3>

            <form onSubmit={handleAddTestimonial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Founder Name *</label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.founderName}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, founderName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Startup Venture Name *</label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.startupName}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, startupName: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Founder Role</label>
                  <input
                    type="text"
                    value={testimonialForm.founderRole}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, founderRole: e.target.value })}
                    placeholder="Founder & CEO"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Relationship</label>
                  <input
                    type="text"
                    value={testimonialForm.relationship}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, relationship: e.target.value })}
                    placeholder="e.g. Seed Portfolio Founder"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={testimonialForm.founderAvatar}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, founderAvatar: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Testimonial Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={testimonialForm.testimonial}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial: e.target.value })}
                  placeholder="Share the founder's experience working with your investment team..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={testimonialForm.verified}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, verified: e.target.checked })}
                  className="w-4 h-4 text-[#D9FF3F] rounded"
                />
                <span className="font-bold">Verified Founder Endorsement</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTestimonialOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-[#D9FF3F] text-[#101212]"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
