'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  PlusCircle,
  Search,
  Filter,
  Users,
  Eye,
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
  CheckCircle2,
  FileEdit,
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { UniversalOpportunityModal } from '@/components/opportunity/UniversalOpportunityModal';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplicationManager } from '@/components/opportunity/OpportunityApplicationManager';
import { useToast } from '@/components/ui/Toast';

export const StartupMyListings: React.FC = () => {
  const { showToast } = useToast();
  const currentUser = getUserProfile();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const [editingDraft, setEditingDraft] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applicantManagerOpen, setApplicantManagerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Delete Confirmation Modal State
  const [listingToDelete, setListingToDelete] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    const all = opportunityService.getOpportunities();
    // Exclude archived listings and match publisherAccountId or startup ownership
    const myListings = all.filter(
      (opp) =>
        opp.status !== 'archived' &&
        (opp.publisherAccountId === currentUser.id ||
          opp.publisherOrgName?.toLowerCase() === currentUser.organization?.toLowerCase() ||
          opp.publisherName?.toLowerCase() === currentUser.name?.toLowerCase())
    );

    // Also include any standalone draft from getDraft if not present
    const singleDraft = opportunityService.getDraft(currentUser.id);
    if (singleDraft && singleDraft.title) {
      const alreadyHas = myListings.some(
        (m) => m.id === (singleDraft as Opportunity).id || m.title === singleDraft.title
      );
      if (!alreadyHas) {
        myListings.push({
          id: (singleDraft as any).id || `draft_${currentUser.id}`,
          publisherAccountId: currentUser.id,
          publisherType: 'Personal Account',
          publisherName: currentUser.name,
          title: singleDraft.title,
          category: singleDraft.category || 'Pilot Opportunity',
          subcategory: singleDraft.subcategory,
          shortDescription: singleDraft.shortDescription || 'Draft opportunity',
          fullDescription: singleDraft.fullDescription || 'Draft details',
          targetUserTypes: singleDraft.targetUserTypes || ['startup'],
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          coverImage: singleDraft.coverImage,
        } as Opportunity);
      }
    }

    setOpportunities(myListings);
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

  const publishedListings = useMemo(() => {
    return opportunities.filter((opp) => opp.status !== 'draft');
  }, [opportunities]);

  const draftListings = useMemo(() => {
    return opportunities.filter((opp) => opp.status === 'draft');
  }, [opportunities]);

  const filteredListings = useMemo(() => {
    const source = activeTab === 'published' ? publishedListings : draftListings;
    return source.filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opp.shortDescription && opp.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'All' || opp.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [activeTab, publishedListings, draftListings, searchQuery, categoryFilter]);

  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(true);
  };

  const handleOpenApplicants = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setApplicantManagerOpen(true);
  };

  const handleResumeDraft = (draft: Opportunity) => {
    setEditingDraft(draft);
    setIsPostModalOpen(true);
  };

  // Safe Deletion with Archival / Soft-delete
  const handleConfirmDelete = () => {
    if (!listingToDelete) return;
    setIsDeleting(true);

    try {
      if (listingToDelete.status === 'draft') {
        opportunityService.deleteOpportunity(listingToDelete.id);
        opportunityService.clearDraft(currentUser.id);
        showToast(`Draft "${listingToDelete.title}" deleted successfully.`, 'info');
      } else {
        const success = opportunityService.archiveOpportunity(listingToDelete.id);
        if (success) {
          showToast(`Listing "${listingToDelete.title}" removed from active listings.`, 'success');
        } else {
          opportunityService.deleteOpportunity(listingToDelete.id);
          showToast(`Listing "${listingToDelete.title}" deleted successfully.`, 'success');
        }
      }
      loadData();
    } catch (err) {
      showToast('Failed to delete listing. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };

  const formatAmount = (opp: Opportunity) => {
    if (!opp.financialDetails) return 'Collaboration / Pilot';
    const { amount, minimumAmount, maximumAmount, currency = 'INR', amountType } = opp.financialDetails;
    if (amountType === 'Range' && (minimumAmount || maximumAmount)) {
      return `${currency} ${minimumAmount || 0} - ${maximumAmount || 0}`;
    }
    if (amount) return `${currency} ${amount}`;
    return opp.financialDetails.equityType || 'Non-Dilutive / Terms';
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-[#101212] dark:text-white">My Listings</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
                My Listings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                {activeTab === 'published' ? `${publishedListings.length} Active Published` : `${draftListings.length} Saved Drafts`}
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Manage opportunities, pilot requests, challenges, and collaboration calls posted by your startup.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingDraft(null);
              setIsPostModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post Opportunity / Call</span>
          </button>
        </div>

        {/* Tab Switcher: Published Listings vs Drafts */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'published'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white bg-gray-100 dark:bg-[#202422]'
            }`}
          >
            <span>Published Listings</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'published'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                  : 'bg-gray-200 dark:bg-[#262A29] text-gray-700 dark:text-gray-300'
              }`}
            >
              {publishedListings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drafts'
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white bg-gray-100 dark:bg-[#202422]'
            }`}
          >
            <span>Saved Drafts</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'drafts'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                  : 'bg-gray-200 dark:bg-[#262A29] text-gray-700 dark:text-gray-300'
              }`}
            >
              {draftListings.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'published' ? 'Search published listings...' : 'Search saved drafts...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white"
          >
            <option value="All">All Categories</option>
            <option value="Pilot Opportunity">Pilot Opportunities</option>
            <option value="Challenge">Challenges</option>
            <option value="Partnership">Partnerships</option>
            <option value="Fellowship">Fellowships</option>
            <option value="Grant">Grants</option>
            <option value="Job">Hiring / Roles</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
              {activeTab === 'drafts'
                ? 'No saved drafts found'
                : opportunities.length === 0
                ? 'No published listings yet'
                : 'No listings match your search'}
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {activeTab === 'drafts'
                ? 'When you start creating an opportunity call and click "Save Draft", it will be saved here so you can resume editing anytime.'
                : opportunities.length === 0
                ? 'Create a listing to invite enterprise pilots, research collaborations, hackathon teams, or co-founder fellowships.'
                : 'Try adjusting your search query or category filter.'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDraft(null);
              setIsPostModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post Opportunity / Call</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((opp) => (
            <div
              key={opp.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D9FF3F]/20 to-blue-500/10 text-[#101212] dark:text-[#D9FF3F] font-black flex items-center justify-center border border-gray-100 dark:border-[#262A29] shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          {opp.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            opp.status === 'draft'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white mt-1 line-clamp-1">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {opp.status === 'draft' ? 'Draft in progress' : `Published by ${opp.publisherName || currentUser.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Applicants Pill (only for published) */}
                  {opp.status !== 'draft' && (
                    <button
                      onClick={() => handleOpenApplicants(opp)}
                      className="px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1 border border-blue-500/20 shrink-0 cursor-pointer"
                      title="View and review applicants"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Applicants ({opp.applicantsCount || 0})</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                  {opp.shortDescription || opp.objective || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
                    <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Mode</span>
                    <span className="font-semibold text-[#101212] dark:text-white">
                      {opp.participationMode || 'Online'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
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

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29]">
                {opp.status === 'draft' ? (
                  <button
                    onClick={() => handleResumeDraft(opp)}
                    className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Resume Editing</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenDetail(opp)}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                )}

                {/* Delete Action Trigger */}
                <button
                  onClick={() => setListingToDelete(opp)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/20 cursor-pointer active:scale-95"
                  title={opp.status === 'draft' ? 'Delete draft' : 'Delete this listing'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{opp.status === 'draft' ? 'Delete Draft' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  {listingToDelete.status === 'draft' ? 'Delete this draft?' : 'Delete this listing?'}
                </h3>
              </div>
              <button
                onClick={() => setListingToDelete(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                {listingToDelete.status === 'draft'
                  ? 'This will permanently delete this saved draft. Any unsaved progress will be lost.'
                  : 'This will remove the listing from your active listings. This action may affect associated applications and visibility.'}
              </p>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                <span className="text-[10px] uppercase font-bold text-[#565B59] block">
                  {listingToDelete.status === 'draft' ? 'Draft Title:' : 'Target Listing:'}
                </span>
                <span className="text-xs font-bold text-[#101212] dark:text-white block mt-0.5">
                  {listingToDelete.title}
                </span>
                <span className="text-[11px] text-[#565B59] dark:text-[#8E9390]">
                  Category: {listingToDelete.category} {listingToDelete.status !== 'draft' && `• Applicants: ${listingToDelete.applicantsCount || 0}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : listingToDelete.status === 'draft' ? 'Delete Draft' : 'Delete Listing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Post Opportunity Modal */}
      {isPostModalOpen && (
        <UniversalOpportunityModal
          isOpen={isPostModalOpen}
          onClose={() => {
            setIsPostModalOpen(false);
            setEditingDraft(null);
          }}
          initialOpportunity={editingDraft || undefined}
          isEditMode={!!editingDraft}
          onSuccess={() => {
            loadData();
            setIsPostModalOpen(false);
            setEditingDraft(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          currentUserRole="startup"
          currentUserId={currentUser.id}
          onManageApplicants={(opp) => {
            setDetailModalOpen(false);
            handleOpenApplicants(opp);
          }}
        />
      )}

      {/* Applicant Management Modal */}
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
