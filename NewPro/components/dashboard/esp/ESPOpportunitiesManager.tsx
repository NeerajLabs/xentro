'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  DollarSign,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Target,
  FileText,
  Sparkles,
  Eye,
  PlusCircle,
  Building2,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Opportunity } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { UniversalOpportunityModal } from '@/components/opportunity/UniversalOpportunityModal';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplyModal } from '@/components/opportunity/OpportunityApplyModal';
import { OpportunityApplicationManager } from '@/components/opportunity/OpportunityApplicationManager';

interface ESPOpportunitiesManagerProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ESPOpportunitiesManager: React.FC<ESPOpportunitiesManagerProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'my-listings' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicantManagerOpen, setApplicantManagerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const currentUser = getUserProfile();

  // Load feed opportunities
  const loadOpportunities = () => {
    const feed = opportunityService.getFeedOpportunities('esp');
    setOpportunities(feed);
  };

  useEffect(() => {
    loadOpportunities();
    const handleUpdate = () => loadOpportunities();
    window.addEventListener('xentro-opportunities-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunities-updated', handleUpdate);
    };
  }, []);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (statusFilter === 'open' && opp.status !== 'open') return false;
      if (statusFilter === 'closed' && opp.status !== 'closed') return false;
      if (statusFilter === 'my-listings' && opp.publisherAccountId !== currentUser.id) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.category.toLowerCase().includes(q) ||
        opp.shortDescription.toLowerCase().includes(q) ||
        (opp.externalOrganization?.name && opp.externalOrganization.name.toLowerCase().includes(q))
      );
    });
  }, [opportunities, statusFilter, searchQuery, currentUser.id]);

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

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-heading">
              Institutional Incubation & Ecosystem Calls
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              {opportunities.length} Active Platform Calls
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Publish non-dilutive seed grants, corporate innovation challenges, and open accelerator calls to founders.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post Opportunity / Call</span>
          </button>
        </div>
      </div>

      {/* 1. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            All Calls ({opportunities.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'open'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Open & Active
          </button>
          <button
            onClick={() => setStatusFilter('my-listings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'my-listings'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            My Managed Calls
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'closed'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            Closed
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search programs, grants, calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* 2. Opportunities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOpportunities.map((opp) => {
          const isMyPost = opp.publisherAccountId === currentUser.id;

          return (
            <div
              key={opp.id}
              onClick={() => handleOpenDetail(opp)}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] uppercase">
                      {opp.category}
                    </span>
                    {opp.sourceType === 'government' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Govt
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      opp.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#8E9390]'
                    }`}
                  >
                    {opp.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F] transition-colors">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                    {opp.externalOrganization?.name || opp.publisherOrgName || opp.publisherName}
                  </p>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                  {opp.shortDescription}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-[#262A29]">
                  <div>
                    <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Mode</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {opp.participationMode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Applicants</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {opp.applicantsCount || 0} Submitted
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
                className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleOpenDetail(opp)}
                  className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>

                <button
                  onClick={() => handleOpenManageApplicants(opp)}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#202422] hover:bg-[#D9FF3F] hover:text-[#101212] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Review Submissions ({opp.applicantsCount || 0})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE OPPORTUNITY MODAL */}
      {isCreateModalOpen && (
        <UniversalOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => loadOpportunities()}
        />
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          onApply={(opp) => handleOpenApply(opp)}
          onManageApplicants={(opp) => handleOpenManageApplicants(opp)}
          currentUserRole="esp"
          currentUserId={currentUser.id}
        />
      )}

      {/* APPLY MODAL */}
      {applyModalOpen && selectedOpportunity && (
        <OpportunityApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          opportunity={selectedOpportunity}
          onSuccess={() => loadOpportunities()}
        />
      )}

      {/* APPLICANT MANAGEMENT MODAL */}
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
