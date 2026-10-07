'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Bookmark,
  Send,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Share2,
  Award,
  Sparkles,
  AlertCircle,
  X,
  PlusCircle,
  Eye,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  OpportunityApplication,
} from '@/data/startupWorkspaceData';
import { Opportunity, OpportunityApplicant } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { UniversalOpportunityModal } from '@/components/opportunity/UniversalOpportunityModal';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplyModal } from '@/components/opportunity/OpportunityApplyModal';
import { OpportunityApplicationManager } from '@/components/opportunity/OpportunityApplicationManager';
import { useToast } from '@/components/ui/Toast';

export const StartupOpportunityManager: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved' | 'my-opportunities' | 'tracker'>('discover');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [userApplications, setUserApplications] = useState<OpportunityApplicant[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicantManagerOpen, setApplicantManagerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const currentUser = getUserProfile();

  // Load feed opportunities and user applications
  const loadData = () => {
    const feed = opportunityService.getFeedOpportunities('startup');
    setOpportunities(feed);

    // Load applications made by this user
    const allApplicants = opportunityService.getApplicants();
    const myApps = allApplicants.filter((a) => a.applicantId === currentUser.id);
    setUserApplications(myApps);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('xentro-opportunities-updated', handleUpdate);
    window.addEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunities-updated', handleUpdate);
      window.removeEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    };
  }, []);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((i) => i !== id) : [...prev, id];
      showToast(exists ? 'Removed from saved' : 'Saved to your opportunities', exists ? 'info' : 'success');
      return next;
    });
  };

  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(true);
  };

  const handleOpenApply = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(false);
    setApplyModalOpen(true);
  };

  const handleOpenManageApplicants = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(false);
    setApplicantManagerOpen(true);
  };

  // Filtered lists
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opp.externalOrganization?.name && opp.externalOrganization.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opp.publisherOrgName && opp.publisherOrgName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        opp.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        opp.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesType =
        selectedType === 'All' ||
        (selectedType === 'Government' && opp.sourceType === 'government') ||
        (selectedType === 'Private' && opp.sourceType !== 'government');

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [opportunities, searchQuery, selectedCategory, selectedType]);

  const savedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => savedIds.includes(opp.id));
  }, [opportunities, savedIds]);

  const myPostedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => opp.publisherAccountId === currentUser.id);
  }, [opportunities, currentUser.id]);

  const formatAmount = (opp: Opportunity) => {
    if (!opp.financialDetails) return 'Capital Support';
    const { amount, minimumAmount, maximumAmount, currency = 'INR', amountType } = opp.financialDetails;
    if (amountType === 'Range' && (minimumAmount || maximumAmount)) {
      return `${currency} ${minimumAmount || 0} - ${maximumAmount || 0}`;
    }
    if (amount) return `${currency} ${amount}`;
    return opp.financialDetails.equityType || 'Non-Dilutive';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Opportunity Engine & Grant Tracker
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Universal Matching
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Discover government schemes, non-dilutive grants, venture capital allocations, and track active applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post Opportunity / Call</span>
          </button>

          {/* Tab switchers */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'discover'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Discover ({opportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Saved ({savedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('my-opportunities')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'my-opportunities'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              My Listings ({myPostedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              Tracker ({userApplications.length})
            </button>
          </div>
        </div>
      </div>

      {/* DISCOVER & SAVED & MY LISTINGS TABS */}
      {activeTab !== 'tracker' && (
        <div className="space-y-5 animate-fade-slide">
          {/* Search & Multi-filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search grants, accelerators, schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white"
              >
                <option value="All">All Categories</option>
                <option value="Grant">Grants</option>
                <option value="Investment">Investment & VC</option>
                <option value="Incubation">Incubation</option>
                <option value="Acceleration">Acceleration</option>
                <option value="Mentorship">Mentorship</option>
                <option value="Challenge">Challenges</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white"
              >
                <option value="All">All Sponsors</option>
                <option value="Government">Government / Public</option>
                <option value="Private">Private / Corporate / VC</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(activeTab === 'discover'
              ? filteredOpportunities
              : activeTab === 'saved'
              ? savedOpportunities
              : myPostedOpportunities
            ).map((opp) => {
              const isSaved = savedIds.includes(opp.id);
              const isMyPost = opp.publisherAccountId === currentUser.id;
              const hasApplied = userApplications.some((a) => a.opportunityId === opp.id);

              return (
                <div
                  key={opp.id}
                  onClick={() => handleOpenDetail(opp)}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/40 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D9FF3F]/30 to-emerald-400/20 text-[#101212] dark:text-[#D9FF3F] font-black flex items-center justify-center border border-gray-100 dark:border-[#262A29] shrink-0 overflow-hidden">
                          {opp.coverImage ? (
                            <img
                              src={opp.coverImage}
                              alt={opp.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                              {opp.category}
                            </span>
                            {opp.sourceType === 'government' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Official Govt
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white mt-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F] transition-colors">
                            {opp.title}
                          </h3>
                          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                            {opp.externalOrganization?.name || opp.publisherOrgName || opp.publisherName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(opp.id);
                        }}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-[#D9FF3F] text-[#101212]'
                            : 'bg-gray-100 dark:bg-[#202422] text-gray-400 hover:text-gray-700 dark:hover:text-white'
                        }`}
                        title={isSaved ? 'Saved' : 'Save Opportunity'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                      {opp.shortDescription}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                        <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Mode</span>
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {opp.participationMode}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                        <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Value / Terms</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                          {formatAmount(opp)}
                        </span>
                      </div>
                    </div>

                    {opp.applicationDeadline && (
                      <div className="flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Deadline: {opp.applicationDeadline}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenDetail(opp)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {isMyPost ? (
                      <button
                        onClick={() => handleOpenManageApplicants(opp)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/20"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Applicants ({opp.applicantsCount || 0})</span>
                      </button>
                    ) : hasApplied ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Applied
                      </span>
                    ) : opp.applicationMethod === 'Apply Through Xentro' ? (
                      <button
                        onClick={() => handleOpenApply(opp)}
                        className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <span>Apply Now</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : opp.applicationUrl ? (
                      <a
                        href={opp.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <span>External Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRACKER TAB */}
      {activeTab === 'tracker' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Live Opportunity Application Pipeline
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Live tracking across submitted, committee review, shortlist, and selection statuses.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {userApplications.length} Active Submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Opportunity</th>
                  <th className="pb-3 px-3">Provider</th>
                  <th className="pb-3 px-3">Applied Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Notes & Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29]">
                {userApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#8E9390]">
                      No active applications submitted yet. Browse the Discover tab to submit to live opportunities!
                    </td>
                  </tr>
                ) : (
                  userApplications.map((item) => {
                    const opp = opportunities.find((o) => o.id === item.opportunityId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-[#101212] dark:text-white">
                          {opp?.title || item.opportunityId}
                        </td>
                        <td className="py-3.5 px-3 text-[#565B59] dark:text-[#B6B8B7]">
                          {opp?.externalOrganization?.name || opp?.publisherOrgName || 'Provider'}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[#565B59] dark:text-[#B6B8B7]">
                          {item.applicationDate}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.status === 'Selected'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : item.status === 'Shortlisted'
                                ? 'bg-[#D9FF3F] text-[#101212]'
                                : item.status === 'Under Review'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : item.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-[#101212] dark:text-white font-medium">
                          {item.notes || 'Under review by opportunity committee.'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal Post Opportunity Modal */}
      {isPostModalOpen && (
        <UniversalOpportunityModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => loadData()}
        />
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          onApply={(opp) => handleOpenApply(opp)}
          onManageApplicants={(opp) => handleOpenManageApplicants(opp)}
          currentUserRole="startup"
          currentUserId={currentUser.id}
        />
      )}

      {/* Apply Modal */}
      {applyModalOpen && selectedOpportunity && (
        <OpportunityApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          opportunity={selectedOpportunity}
          onSuccess={() => loadData()}
        />
      )}

      {/* Applicant Management */}
      {applicantManagerOpen && selectedOpportunity && (
        <OpportunityApplicationManager
          isOpen={applicantManagerOpen}
          onClose={() => setApplicantManagerOpen(false)}
          opportunity={selectedOpportunity}
        />
      )}
    </div>
  );
};
