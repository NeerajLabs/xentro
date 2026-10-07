'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { initialApplicationTracker, OpportunityApplication } from '@/data/startupWorkspaceData';
import { Opportunity, OpportunityApplicant } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { useToast } from '@/components/ui/Toast';

interface StartupMyApplicationsProps {
  onNavigateTab?: (tabId: string) => void;
}

export const StartupMyApplications: React.FC<StartupMyApplicationsProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const currentUser = getUserProfile();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [userApplications, setUserApplications] = useState<OpportunityApplicant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = () => {
    const opps = opportunityService.getOpportunities();
    setOpportunities(opps);

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

  // Merge seed static applications from initialApplicationTracker with user applications from opportunityService
  const combinedApplications = useMemo(() => {
    const list: Array<{
      id: string;
      opportunityId: string;
      opportunityTitle: string;
      organization: string;
      appliedDate: string;
      deadline?: string;
      status: string;
      notes: string;
      category?: string;
      amount?: string;
      rawOpp?: Opportunity;
    }> = [];

    // Add submitted applications from opportunityService
    userApplications.forEach((app) => {
      const opp = opportunities.find((o) => o.id === app.opportunityId);
      list.push({
        id: app.id,
        opportunityId: app.opportunityId,
        opportunityTitle: opp?.title || app.opportunityId,
        organization: opp?.externalOrganization?.name || opp?.publisherOrgName || opp?.publisherName || 'Official Provider',
        appliedDate: app.applicationDate || 'Recent',
        deadline: opp?.applicationDeadline || 'Rolling',
        status: app.status,
        notes: app.notes || 'Application received and logged in review pipeline.',
        category: opp?.category,
        amount: opp?.financialDetails ? `${opp.financialDetails.currency || 'INR'} ${opp.financialDetails.amount || opp.financialDetails.maximumAmount || 'Capital Support'}` : undefined,
        rawOpp: opp,
      });
    });

    // Add initial pre-configured workspace applications if not already added
    initialApplicationTracker.forEach((seed) => {
      if (!list.some((item) => item.opportunityTitle.toLowerCase() === seed.opportunityName.toLowerCase())) {
        const opp = opportunities.find((o) => o.id === seed.opportunityId);
        list.push({
          id: seed.id,
          opportunityId: seed.opportunityId,
          opportunityTitle: seed.opportunityName,
          organization: seed.organization,
          appliedDate: seed.appliedDate,
          deadline: seed.deadline,
          status: seed.status,
          notes: seed.nextAction,
          category: opp?.category || 'Grant / Program',
          amount: opp?.financialDetails ? `${opp.financialDetails.currency || 'INR'} ${opp.financialDetails.amount || 'Grant'}` : 'Government / Program',
          rawOpp: opp,
        });
      }
    });

    return list;
  }, [userApplications, opportunities]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return combinedApplications.filter((app) => {
      const matchesSearch =
        app.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.category && app.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'All' || app.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [combinedApplications, searchQuery, statusFilter]);

  const handleOpenDetail = (app: typeof combinedApplications[0]) => {
    if (app.rawOpp) {
      setSelectedOpportunity(app.rawOpp);
      setIsDetailModalOpen(true);
    } else {
      // Find matching or create placeholder
      const found = opportunities.find((o) => o.id === app.opportunityId);
      if (found) {
        setSelectedOpportunity(found);
        setIsDetailModalOpen(true);
      } else {
        showToast('Application details recorded. Full prospectus is archived.', 'info');
      }
    }
  };

  const handleExploreOpportunities = () => {
    window.dispatchEvent(new CustomEvent('xentro-navigate-tab', { detail: { tab: 'opportunity' } }));
    showToast('Navigating to live Opportunity Engine...', 'info');
  };

  // Pipeline metrics
  const stats = useMemo(() => {
    const total = combinedApplications.length;
    const underReview = combinedApplications.filter((a) => a.status === 'Under Review' || a.status === 'Preparing').length;
    const shortlisted = combinedApplications.filter((a) => a.status === 'Shortlisted').length;
    const selected = combinedApplications.filter((a) => a.status === 'Selected').length;
    return { total, underReview, shortlisted, selected };
  }, [combinedApplications]);

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Breadcrumb & Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-[#101212] dark:text-white">My Applications</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
                My Applications
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                {combinedApplications.length} Submissions
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Track the status, evaluation stages, committee feedback, and next actions for all opportunities you have applied to.
            </p>
          </div>
        </div>

        {/* Pipeline Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
              Total Applied
            </span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              {stats.total}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
              Under Review
            </span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              {stats.underReview}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
              Shortlisted
            </span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              {stats.shortlisted}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              Selected / Granted
            </span>
            <span className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              {stats.selected}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search your submitted applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar w-full md:w-auto">
          {(['All', 'Under Review', 'Shortlisted', 'Selected', 'Preparing', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === st
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              {combinedApplications.length === 0
                ? "You haven't applied to any opportunities yet."
                : 'No applications match your filter'}
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {combinedApplications.length === 0
                ? 'Discover government schemes, non-dilutive grants, venture capital allocations, and startup accelerator cohorts to submit your first application.'
                : 'Try adjusting your search query or status filter to see other applications.'}
            </p>
          </div>
          {combinedApplications.length === 0 && (
            <button
              onClick={handleExploreOpportunities}
              className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Available Opportunities</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              onClick={() => handleOpenDetail(app)}
              className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D9FF3F]/20 to-blue-500/10 text-[#101212] dark:text-[#D9FF3F] font-black flex items-center justify-center border border-gray-100 dark:border-[#262A29] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {app.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                            {app.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            app.status === 'Selected'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : app.status === 'Shortlisted'
                              ? 'bg-[#D9FF3F] text-[#101212]'
                              : app.status === 'Under Review'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : app.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F] transition-colors line-clamp-1">
                        {app.opportunityTitle}
                      </h3>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {app.organization}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes / Next Action */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#8E9390] block">
                    Status & Next Steps
                  </span>
                  <p className="text-xs text-[#101212] dark:text-white font-medium leading-relaxed">
                    {app.notes}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                    <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Applied Date</span>
                    <span className="font-semibold font-mono text-[#101212] dark:text-white">
                      {app.appliedDate}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                    <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Deadline / Review</span>
                    <span className="font-semibold font-mono text-[#101212] dark:text-white">
                      {app.deadline || 'Rolling'}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleOpenDetail(app)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submission Logged</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          currentUserRole="startup"
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
};
