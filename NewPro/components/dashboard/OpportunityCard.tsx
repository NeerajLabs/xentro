'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, Sparkles, X, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Opportunity } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplyModal } from '@/components/opportunity/OpportunityApplyModal';

export const OpportunityCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const { showToast } = useToast();

  const userProfile = getUserProfile();

  useEffect(() => {
    const list = opportunityService.getFeedOpportunities(userProfile.role);
    setOpportunities(list.slice(0, 5));

    const handleUpdate = () => {
      const updated = opportunityService.getFeedOpportunities(userProfile.role);
      setOpportunities(updated.slice(0, 5));
    };
    window.addEventListener('xentro-opportunities-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunities-updated', handleUpdate);
    };
  }, [userProfile.role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setDetailModalOpen(true);
  };

  const handleOpenApply = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setApplyModalOpen(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-3.5 sm:p-4 shadow-subtle transition-all">
        <div className="flex items-start gap-3">
          {/* Briefcase 3D-styled Icon Card */}
          <div className="w-13 h-13 rounded-xl bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 flex items-center justify-center flex-shrink-0 relative shadow-inner p-2.5">
            <div className="w-8 h-6 rounded-md bg-[#101212] dark:bg-[#0D0F0F] flex items-center justify-center relative shadow-sm border border-gray-800">
              {/* Handle */}
              <div className="absolute -top-1.5 w-3 h-1.5 border-2 border-[#101212] dark:border-[#D9FF3F] rounded-t-md bg-transparent" />
              {/* Clasp */}
              <div className="w-2 h-1 bg-[#D9FF3F] rounded-xs" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center text-[9px] font-black shadow-2xs">
              ✨
            </span>
          </div>

          {/* Texts */}
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white leading-snug font-heading">
              Explore opportunities that match your profile
            </h4>
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5 leading-relaxed">
              Curated grants, VC allocations, and ecosystem calls
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-3 py-2 px-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-[0.98] text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span>Explore Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explore Opportunities Modal */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-[#181B1A] w-full max-w-lg rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-6 max-h-[90vh] overflow-y-auto animate-fade-slide">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#101212] dark:text-white font-heading">
                    Matched Opportunities
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Curated from the Universal Opportunity Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors active:scale-90"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-[#262A29] mt-3">
              {opportunities.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8E9390]">
                  No opportunities currently active for your persona. Check back soon!
                </div>
              ) : (
                opportunities.map((op) => (
                  <div key={op.id} className="py-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={() => handleOpenDetail(op)}
                          className="font-bold text-sm text-[#101212] dark:text-white font-heading truncate cursor-pointer hover:underline"
                        >
                          {op.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F] text-[10px] font-bold">
                          {op.category}
                        </span>
                        {op.sourceType === 'government' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Govt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1 truncate">
                        {op.externalOrganization?.name || op.publisherOrgName || op.publisherName} • {op.participationMode}
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                        {op.financialDetails?.amount
                          ? `${op.financialDetails.currency || 'INR'} ${op.financialDetails.amount}`
                          : op.financialDetails?.equityType || 'Verified Scheme'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenDetail(op)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-[#101212] dark:text-white text-xs font-semibold transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenApply(op)}
                        className="px-3 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] active:bg-[#9EBE12] text-[#101212] text-xs font-bold transition-colors shadow-2xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Detail Modal */}
      {detailModalOpen && selectedOpp && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={selectedOpp}
          onApply={(opp) => {
            setDetailModalOpen(false);
            handleOpenApply(opp);
          }}
          currentUserRole={userProfile.role}
          currentUserId={userProfile.id}
        />
      )}

      {/* Opportunity Apply Modal */}
      {applyModalOpen && selectedOpp && (
        <OpportunityApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          opportunity={selectedOpp}
          onSuccess={() => {
            showToast('Applied successfully!', 'success');
          }}
        />
      )}
    </>
  );
};
