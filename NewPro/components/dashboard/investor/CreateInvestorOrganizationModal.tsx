'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  DollarSign,
  Globe,
  Briefcase,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  InvestorOrganizationType,
  INVESTOR_ORG_TYPES,
} from '@/types/investorOrganization';
import { investorOrganizationService } from '@/lib/investorOrganizationService';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile } from '@/lib/userProfile';

interface CreateInvestorOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (orgId: string) => void;
}

export const CreateInvestorOrganizationModal: React.FC<CreateInvestorOrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [orgType, setOrgType] = useState<InvestorOrganizationType>('VC Firm');
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [country, setCountry] = useState('India');
  const [foundedYear, setFoundedYear] = useState('2026');
  const [legalName, setLegalName] = useState('');
  const [fundSize, setFundSize] = useState('₹250 Cr');
  const [aum, setAum] = useState('₹250 Cr AUM');

  // Thesis & Investment Profile
  const [thesis, setThesis] = useState('');
  const [minTicket, setMinTicket] = useState('₹1 Cr');
  const [maxTicket, setMaxTicket] = useState('₹5 Cr');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'Enterprise SaaS',
    'FinTech',
    'AI & Machine Learning',
  ]);
  const [selectedStages, setSelectedStages] = useState<
    ('Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Growth')[]
  >(['Seed', 'Series A']);

  // Owner details
  const [ownerName, setOwnerName] = useState(() => (typeof window !== 'undefined' ? getUserProfile().name || '' : ''));
  const [ownerTitle, setOwnerTitle] = useState('Managing Partner');

  if (!isOpen) return null;

  const availableSectors = [
    'Enterprise SaaS',
    'FinTech',
    'DeepTech',
    'AI & Machine Learning',
    'ClimateTech',
    'HealthTech',
    'Consumer Tech',
    'B2B Marketplaces',
    'Hardware & IoT',
    'Web3 / Crypto',
  ];

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const handleNext = () => {
    if (step === 1 && !orgType) {
      showToast('Please select an organization type', 'error');
      return;
    }
    if (step === 2) {
      if (!name.trim()) {
        showToast('Please provide an organization name', 'error');
        return;
      }
      if (!officialEmail.trim()) {
        showToast('Official organization email is required', 'error');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const created = investorOrganizationService.createInvestorOrganization({
        name,
        organizationType: orgType,
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        banner:
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        shortDescription:
          shortDescription ||
          `Early-stage ${orgType} backing pioneering technology startups across ${country}.`,
        website: website || 'https://xentro.io',
        linkedIn: linkedIn || 'https://linkedin.com',
        officialEmail,
        headquarters: {
          city: city || 'Bengaluru',
          country: country || 'India',
        },
        foundedYear: foundedYear || '2026',
        legalName: legalName || name,
        fundSize: fundSize || '₹100 Cr',
        aum: aum || fundSize || '₹100 Cr AUM',
        verified: false, // Rule #27: cannot manually self-verify
        ownerId: 'usr_rajesh_singhania',
        ownerName,
        ownerEmail: officialEmail,

        about: {
          overview:
            shortDescription ||
            `${name} is an institutional ${orgType} focused on early-stage investments.`,
          thesis:
            thesis ||
            'We back high-conviction founders solving mission-critical problems with sustainable unit economics.',
          mission: `Empowering founders to scale impactful tech enterprises from ${city}.`,
          assetsInfo: fundSize ? `Active pool of ${fundSize}` : undefined,
        },

        investmentFocus: {
          sectors: selectedSectors,
          stages: selectedStages,
          geography: {
            countries: [country],
            regions: [city],
          },
          businessModels: ['B2B', 'SaaS', 'Marketplace'],
          ticketSize: {
            min: minTicket,
            max: maxTicket,
            formatted: `${minTicket} – ${maxTicket}`,
          },
          leadInvestorPreference: 'Lead or Co-Lead',
          investmentInstruments: ['Equity', 'CCPS', 'SAFE notes'],
        },

        valueBeyondCapital: {
          supportAreas: [
            'Go-To-Market Acceleration',
            'Customer Introductions',
            'Follow-On Syndication',
          ],
          whatIBringToFounders:
            'Hands-on platform support in enterprise scaling, strategic hiring, and fundraising guidance.',
        },

        investmentCriteria: {
          evaluationCriteria: [
            'High founder integrity and velocity',
            'Demonstrated customer demand',
            'Defensible technology moat',
          ],
          preferredTraction: ['MVP', 'Early Revenue'],
          diligenceHighlights: ['Customer references', 'Financial audit'],
        },

        investmentProcess: {
          stages: [
            {
              stepNumber: 1,
              title: 'Initial Review',
              description: 'Deck review within 48 hours.',
            },
            {
              stepNumber: 2,
              title: 'Partner Meeting',
              description: 'Discussion on product roadmap and traction.',
            },
            {
              stepNumber: 3,
              title: 'Due Diligence & Term Sheet',
              description: 'Cap table evaluation and investment memo.',
            },
          ],
          preferredConnectionMethod: 'Platform pitch submission',
          informationRequiredInitially: ['Pitch Deck (PDF)', 'Metrics'],
          typicalDecisionTimeline: '2 to 3 weeks',
          pitchDeckRequirements: 'PDF deck with traction and financial summary',
          warmIntroPreferred: false,
          unsolicitedPitchesAccepted: true,
        },

        portfolio: [],
        experienceStats: {
          totalInvestments: 0,
          activePortfolio: 0,
          followOnInvestments: 0,
          exits: 0,
        },
        testimonials: [],
        connectionPreferences: {
          openToConnectionRequests: true,
          openToStartupPitches: true,
          introductionPreferred: false,
          currentlyInvesting: true,
          notAcceptingNewPitches: false,
        },
        content: [],
        activities: [],

        subscription: {
          tier: 'pro',
          status: 'active',
          currentPeriodEnd: '2026-12-31T23:59:59Z',
          cancelAtPeriodEnd: false,
          seatsIncluded: 5,
          seatsUsed: 1,
          dealFlowLimit: -1,
          dueDiligenceExportsLimit: 50,
          monthlyPrice: 9999,
          currency: 'INR',
        },

        billingAccount: {
          organizationName: legalName || name,
          billingEmail: officialEmail,
          taxExempt: false,
          billingAddress: {
            line1: 'Corporate Office',
            city,
            state: 'Karnataka',
            country,
            postalCode: '560001',
          },
          defaultPaymentMethod: {
            type: 'card',
            last4: '4242',
          },
        },
        invoices: [],
      });

      showToast(`Investor Organization "${created.name}" created successfully!`, 'success');
      if (onCreated) onCreated(created.id);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create organization', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between bg-gray-50 dark:bg-[#101212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 flex items-center justify-center text-[#71870A] dark:text-[#D9FF3F]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Create Investor Organization
              </h2>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Institutional entity account for VC funds, angel networks, syndicates & family offices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-5 py-2.5 bg-gray-100/50 dark:bg-[#141615] border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                      : step > s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                </span>
                <span className="hidden sm:inline text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {s === 1 && 'Type'}
                  {s === 2 && 'Details'}
                  {s === 3 && 'Thesis'}
                  {s === 4 && 'Owner'}
                  {s === 5 && 'Verification'}
                </span>
                {s < 5 && <span className="text-gray-300 dark:text-gray-700 mx-1">&bull;</span>}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7]">
            Step {step} of 5
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: ORGANIZATION TYPE */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Select Organization Structure
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Choose the category that matches your investment entity
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {INVESTOR_ORG_TYPES.map((type) => {
                  const isSelected = orgType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrgType(type)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#101212] dark:border-[#D9FF3F] bg-gray-50 dark:bg-[#202422] shadow-2xs ring-1 ring-[#101212] dark:ring-[#D9FF3F]'
                          : 'border-gray-200 dark:border-[#262A29] hover:bg-gray-50 dark:hover:bg-[#1a1d1c]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#101212] dark:text-white">
                          {type}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">
                        Institutional entity
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ORGANIZATION DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Organization Details
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Basic profile and public institutional contact details
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nexus Venture Partners / Peak Seed Fund"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview of your fund's core mission."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="partners@yourfund.vc"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourfund.vc"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Headquarters City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Founded Year
                  </label>
                  <input
                    type="text"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Fund Size / Pool (Optional)
                  </label>
                  <input
                    type="text"
                    value={fundSize}
                    onChange={(e) => setFundSize(e.target.value)}
                    placeholder="e.g. ₹250 Cr ($30M)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    AUM / Total Capital (Optional)
                  </label>
                  <input
                    type="text"
                    value={aum}
                    onChange={(e) => setAum(e.target.value)}
                    placeholder="e.g. ₹500 Cr AUM"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INVESTMENT PROFILE & THESIS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Institutional Investment Thesis
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Define the entity&apos;s cheque size, focus sectors, and deployment stages
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Investment Thesis Summary
                </label>
                <textarea
                  rows={2}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="What is your organization's core investment philosophy? What kinds of moats do you seek?"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Min Cheque Size
                  </label>
                  <input
                    type="text"
                    value={minTicket}
                    onChange={(e) => setMinTicket(e.target.value)}
                    placeholder="₹1 Cr"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Max Cheque Size
                  </label>
                  <input
                    type="text"
                    value={maxTicket}
                    onChange={(e) => setMaxTicket(e.target.value)}
                    placeholder="₹10 Cr"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1.5">
                  Sector Focus Areas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSectors.map((sector) => {
                    const active = selectedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => toggleSector(sector)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212]'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200'
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: OWNER & MEMBERSHIP ARCHITECTURE */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Owner & Membership Architecture
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Your personal Xentro account will be designated as the founding Owner
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>No Shared Login Accounts</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Per Xentro architecture, access is never shared via credentials. You access this
                  firm through your Personal Account as an authorized Managing Partner.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Founding Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Your Title in the Firm
                  </label>
                  <input
                    type="text"
                    value={ownerTitle}
                    onChange={(e) => setOwnerTitle(e.target.value)}
                    placeholder="Managing Partner / General Partner"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: VERIFICATION & FINAL CONFIRMATION */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                  Institutional Verification & Review
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Verify organization status and understand institutional compliance
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Organization Verification Policy
                  </span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Institutional verification is distinct from individual identity verification.
                  After creation, your organization will begin in standard registration mode. The
                  Verified Fund badge is awarded after our institutional review team verifies your SEBI /
                  regulatory registration or fund incorporation documents.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] space-y-1.5">
                <span className="text-xs font-bold text-[#101212] dark:text-white">
                  Account Summary
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>{' '}
                    {name || 'New Organization'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Type:</span>{' '}
                    {orgType}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Fund Size:</span>{' '}
                    {fundSize || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Owner:</span>{' '}
                    {ownerName} ({ownerTitle})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#101212] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#c7ee2f] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
