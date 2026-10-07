'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Building2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Bookmark,
  Edit3,
  Copy,
  Layers,
  ArrowRight,
  FileText,
  Mail,
  Phone,
  Globe,
  Tag,
  Check,
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { useToast } from '@/components/ui/Toast';

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onApply?: (opportunity: Opportunity) => void;
  onEdit?: (opportunity: Opportunity) => void;
  onManageApplicants?: (opportunity: Opportunity) => void;
  adminMode?: boolean;
  currentUserRole?: string;
  currentUserId?: string;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onApply,
  onEdit,
  onManageApplicants,
  adminMode = false,
  currentUserRole = 'startup',
  currentUserId,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'benefits' | 'timeline' | 'links'>('overview');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !opportunity) return null;

  const isOwnerOrAdmin =
    adminMode ||
    (currentUserId && opportunity.publisherAccountId === currentUserId) ||
    opportunity.publisherType === 'Xentro Admin';

  const formatCurrency = (amt?: number | string, curr: string = 'INR') => {
    if (!amt) return '';
    const num = Number(amt);
    if (isNaN(num)) return String(amt);
    if (curr === 'INR') {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakhs`;
      return `₹${num.toLocaleString('en-IN')}`;
    }
    if (curr === 'USD') return `$${num.toLocaleString('en-US')}`;
    if (curr === 'EUR') return `€${num.toLocaleString('en-EU')}`;
    if (curr === 'GBP') return `£${num.toLocaleString('en-GB')}`;
    return `${curr} ${num.toLocaleString()}`;
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Opportunity link copied to clipboard!', 'success');
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    showToast(
      !isSaved
        ? `Saved "${opportunity.title}" to your bookmarks`
        : `Removed "${opportunity.title}" from bookmarks`,
      !isSaved ? 'success' : 'info'
    );
  };

  const handleDuplicate = () => {
    const copy = opportunityService.duplicateOpportunity(opportunity.id);
    if (copy) {
      showToast(`Duplicated as "${copy.title}" in drafts`, 'success');
      onClose();
    }
  };

  const handleToggleStatus = () => {
    const newStatus = opportunity.status === 'closed' ? 'open' : 'closed';
    opportunityService.updateOpportunityStatus(opportunity.id, newStatus);
    showToast(`Opportunity status marked as ${newStatus}`, 'success');
    opportunity.status = newStatus;
  };

  const bannerImg =
    opportunity.coverImage ||
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative m-auto bg-white dark:bg-[#181B1A] w-full max-w-5xl xl:max-w-6xl rounded-3xl shadow-2xl border border-[#E5E7EB] dark:border-[#262A29] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden animate-fade-slide">
        {/* Hero Cover Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-gray-900 shrink-0 overflow-hidden">
          <img
            src={bannerImg}
            alt={opportunity.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101212] via-[#101212]/50 to-transparent" />

          {/* Top Actions: Close, Share, Save */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handleToggleSave}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-[#D9FF3F] text-[#101212]'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              title="Save opportunity"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all"
              title="Share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badges on Hero */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-10">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D9FF3F] text-[#101212] shadow-sm">
              {opportunity.category}
            </span>
            {opportunity.subcategory && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-md border border-white/20">
                {opportunity.subcategory}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize ${
                opportunity.status === 'open'
                  ? 'bg-emerald-500 text-white'
                  : opportunity.status === 'rolling'
                  ? 'bg-blue-500 text-white'
                  : opportunity.status === 'upcoming'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {opportunity.status}
            </span>
            {opportunity.sourceType === 'government' && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-black flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Government Initiative
              </span>
            )}
          </div>

          {/* Hero Bottom: Title & Publisher */}
          <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-sora leading-tight drop-shadow-md">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-200 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Building2 className="w-3.5 h-3.5 text-[#D9FF3F]" />
                {opportunity.externalOrganization?.name || opportunity.publisherOrgName || opportunity.publisherName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D9FF3F]" />
                {opportunity.participationMode} ({opportunity.opportunityScope || 'National'})
              </span>
              {opportunity.applicationDeadline && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#D9FF3F] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Deadline: {opportunity.applicationDeadline}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 sm:px-6 bg-white dark:bg-[#181B1A] border-b border-[#E5E7EB] dark:border-[#262A29] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {opportunity.applicationMethod === 'External Application' && opportunity.applicationUrl ? (
              <a
                href={opportunity.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Apply on Official Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : opportunity.applicationMethod === 'Apply Through Xentro' ? (
              <button
                onClick={() => onApply && onApply(opportunity)}
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Apply Through Xentro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : opportunity.contact?.email ? (
              <a
                href={`mailto:${opportunity.contact.email}?subject=Application for ${encodeURIComponent(opportunity.title)}`}
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Contact Organizer ({opportunity.contact.email})</span>
                <Mail className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-[#6E7370] dark:text-[#8E9390] italic">
                Direct enrollment / No external application required
              </span>
            )}
          </div>

          {/* Admin & Publisher Controls */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              {onManageApplicants && (
                <button
                  onClick={() => onManageApplicants(opportunity)}
                  className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/20"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Applicants ({opportunity.applicantsCount || 0})</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(opportunity)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8E9390]" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={handleDuplicate}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#6E7370] dark:text-[#8E9390] text-xs font-semibold transition-all"
                title="Duplicate opportunity"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToggleStatus}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#6E7370] dark:text-[#8E9390] text-xs font-semibold transition-all"
              >
                {opportunity.status === 'closed' ? 'Reopen' : 'Close'}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-white dark:bg-[#181B1A] border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center gap-6 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: 'Overview & Focus' },
            { id: 'eligibility', label: 'Eligibility & Stages' },
            { id: 'benefits', label: 'Benefits & Funding' },
            { id: 'timeline', label: 'Timeline & Process' },
            { id: 'links', label: 'Links & Resources' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#D9FF3F] text-[#101212] dark:text-white'
                  : 'border-transparent text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 min-h-0 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-slide">
              {/* Objective Callout */}
              {opportunity.objective && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F]" />
                    Mission & Objective
                  </h4>
                  <p className="text-xs text-[#101212] dark:text-white font-medium leading-relaxed">
                    {opportunity.objective}
                  </p>
                </div>
              )}

              {/* Short & Full Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Program Description
                </h4>
                <p className="text-xs font-semibold text-[#101212] dark:text-white leading-relaxed">
                  {opportunity.shortDescription}
                </p>
                <div className="pt-2 text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed whitespace-pre-wrap space-y-3">
                  {opportunity.fullDescription}
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9390] block">
                    Mode
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                    {opportunity.participationMode}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9390] block">
                    Scope
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                    {opportunity.opportunityScope || 'National'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9390] block">
                    Frequency
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                    {opportunity.frequency || 'Annual'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9390] block">
                    Capacity
                  </span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                    {opportunity.availableSlots
                      ? `${opportunity.availableSlots} ${opportunity.slotLabel || 'Seats'}`
                      : opportunity.capacityType || 'Open'}
                  </span>
                </div>
              </div>

              {/* Publisher & External Org Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D9FF3F] to-emerald-400 text-[#101212] font-black flex items-center justify-center shrink-0">
                    {opportunity.externalOrganization?.logo ? (
                      <img
                        src={opportunity.externalOrganization.logo}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#101212] dark:text-white">
                      {opportunity.externalOrganization?.name || opportunity.publisherOrgName || opportunity.publisherName}
                    </h5>
                    <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                      {opportunity.externalOrganization?.organizationType || opportunity.publisherRoleTitle || 'Verified Organization'}
                    </p>
                  </div>
                </div>

                {opportunity.externalOrganization?.website && (
                  <a
                    href={opportunity.externalOrganization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="space-y-6 animate-fade-slide">
              {/* Target Applicant Types */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Target Applicants
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {opportunity.applicantTypes?.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] font-semibold text-[#101212] dark:text-white text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Startup Stages */}
              {opportunity.startupStages && opportunity.startupStages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Eligible Venture Stages
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {opportunity.startupStages.map((stg) => (
                      <span
                        key={stg}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs"
                      >
                        {stg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Sectors */}
              {opportunity.industries && opportunity.industries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Eligible Industries & Sectors
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {opportunity.industries.map((sec) => (
                      <span
                        key={sec}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold text-xs"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Requirements */}
              {opportunity.registrationRequirements && opportunity.registrationRequirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Statutory & Registration Criteria
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opportunity.registrationRequirements.map((req) => (
                      <div
                        key={req}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center gap-2 font-medium text-[#101212] dark:text-white"
                      >
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Criteria */}
              {opportunity.customEligibility && opportunity.customEligibility.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Specific Requirements
                  </h4>
                  <div className="space-y-2">
                    {opportunity.customEligibility.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-1"
                      >
                        <h5 className="font-bold text-xs text-[#101212] dark:text-white">
                          {c.title}
                        </h5>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {c.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-6 animate-fade-slide">
              {/* Financial Terms Card */}
              {opportunity.financialDetails && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                      Financial Support & Terms
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-[10px] text-[#8E9390] uppercase font-bold block">
                        Capital Amount
                      </span>
                      <span className="text-base font-black text-[#101212] dark:text-white mt-0.5 block font-mono">
                        {opportunity.financialDetails.amountType === 'Range'
                          ? `${formatCurrency(
                              opportunity.financialDetails.minimumAmount,
                              opportunity.financialDetails.currency
                            )} - ${formatCurrency(
                              opportunity.financialDetails.maximumAmount,
                              opportunity.financialDetails.currency
                            )}`
                          : opportunity.financialDetails.amount
                          ? formatCurrency(
                              opportunity.financialDetails.amount,
                              opportunity.financialDetails.currency
                            )
                          : 'Non-Disclosed'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-[10px] text-[#8E9390] uppercase font-bold block">
                        Equity Terms
                      </span>
                      <span className="text-base font-black text-[#101212] dark:text-white mt-0.5 block">
                        {opportunity.financialDetails.equityType === 'Equity Required'
                          ? `${opportunity.financialDetails.minimumEquity || 0}% - ${
                              opportunity.financialDetails.maximumEquity || 0
                            }% Equity`
                          : opportunity.financialDetails.equityType || '0% Non-Dilutive'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                      <span className="text-[10px] text-[#8E9390] uppercase font-bold block">
                        Structure
                      </span>
                      <span className="text-base font-black text-[#101212] dark:text-white mt-0.5 block">
                        {opportunity.financialDetails.type || opportunity.category}
                      </span>
                    </div>
                  </div>

                  {opportunity.financialDetails.additionalTerms && (
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1">
                      <strong>Terms:</strong> {opportunity.financialDetails.additionalTerms}
                    </p>
                  )}
                </div>
              )}

              {/* Grouped Benefits Pills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Awarded Benefits & Enablement
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {opportunity.benefits?.map((benefit) => (
                    <div
                      key={benefit}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#D9FF3F] shrink-0" />
                      <span className="font-semibold text-[#101212] dark:text-white">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-fade-slide">
              {/* Important Dates */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Program Dates & Deadlines
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                    <span className="text-[10px] font-bold uppercase text-[#8E9390] block">
                      Applications Open
                    </span>
                    <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                      {opportunity.applicationsOpen || 'Immediate'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                      Application Deadline
                    </span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                      {opportunity.rollingApplications
                        ? 'Rolling Basis'
                        : opportunity.applicationDeadline || 'No Expiry'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                    <span className="text-[10px] font-bold uppercase text-[#8E9390] block">
                      Cohort / Kickoff Date
                    </span>
                    <span className="text-xs font-bold text-[#101212] dark:text-white mt-0.5 block">
                      {opportunity.opportunityStartDate || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Steps Roadmap */}
              {opportunity.applicationSteps && opportunity.applicationSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Selection & Evaluation Process
                  </h4>
                  <div className="space-y-3">
                    {opportunity.applicationSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-[#D9FF3F] text-[#101212] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {step.stepNumber}
                        </span>
                        <div>
                          <h5 className="font-bold text-xs text-[#101212] dark:text-white">
                            {step.title}
                          </h5>
                          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Documents */}
              {opportunity.applicationRequirements && opportunity.applicationRequirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Required Documentation
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {opportunity.applicationRequirements.map((req) => (
                      <div
                        key={req}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate font-medium text-[#101212] dark:text-white">
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-6 animate-fade-slide">
              {/* Verification & Audit */}
              {opportunity.verification && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9390] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Verification Audit & Provenance
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {opportunity.verification.status || 'Verified'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-[#8E9390] block">Official Source URL:</span>
                      <a
                        href={opportunity.verification.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                      >
                        {opportunity.verification.officialSourceUrl || 'Official Portal Verified'}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#8E9390] block">Verified By / Officer:</span>
                      <span className="text-[#101212] dark:text-white font-medium block">
                        {opportunity.verification.verifiedBy || 'Xentro Editorial Operations'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resource Links */}
              {opportunity.links && opportunity.links.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                    Official Guidelines & Resources
                  </h4>
                  <div className="space-y-2">
                    {opportunity.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] flex items-center justify-between transition-all group"
                      >
                        <span className="font-semibold text-xs text-[#101212] dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F]">
                          {link.label}
                        </span>
                        <ExternalLink className="w-4 h-4 text-[#8E9390] group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F]" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8E9390] italic">
                  No additional external links attached to this opportunity.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
