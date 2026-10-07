'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  Award,
  PlusCircle,
  Building2,
  Users,
  Clock,
  Eye,
  Edit3,
} from 'lucide-react';
import { MentorOpportunityItem } from '@/types/mentor';
import { Opportunity } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile } from '@/lib/userProfile';
import { UniversalOpportunityModal } from '@/components/opportunity/UniversalOpportunityModal';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplyModal } from '@/components/opportunity/OpportunityApplyModal';
import { OpportunityApplicationManager } from '@/components/opportunity/OpportunityApplicationManager';
import { useToast } from '@/components/ui/Toast';
import { notificationService } from '@/lib/notificationService';

interface MentorOpportunitiesProps {
  opportunities?: MentorOpportunityItem[];
}

export const MentorOpportunities: React.FC<MentorOpportunitiesProps> = ({
  opportunities: initialLegacyOpps = [],
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedOpportunities, setFeedOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({});

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicantManagerOpen, setApplicantManagerOpen] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);

  const currentUser = getUserProfile();

  // Load feed opportunities from Universal Engine and hydrate applied status
  const loadOpportunities = () => {
    const feed = opportunityService.getFeedOpportunities('mentor');
    setFeedOpportunities(feed);

    const userApps = opportunityService.getApplicants().filter((a) => a.applicantId === currentUser.id);
    const map: Record<string, boolean> = {};
    userApps.forEach((a) => {
      map[a.opportunityId] = true;
    });
    setAppliedMap(map);
  };

  useEffect(() => {
    loadOpportunities();
    const handleUpdate = () => loadOpportunities();
    window.addEventListener('xentro-opportunities-updated', handleUpdate);
    window.addEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunities-updated', handleUpdate);
      window.removeEventListener('xentro-opportunity-applicants-updated', handleUpdate);
    };
  }, []);

  const categories = [
    'all',
    'Advisory Opportunities',
    'Mentorship Programs',
    'Speaking Opportunities',
    'Judging Opportunities',
    'Workshops',
    'Startup Programs',
    'Ecosystem Initiatives',
  ];

  // Convert initial legacy items to unified format so they work with detail/apply modals
  const unifiedLegacyOpportunities: (Opportunity & { badge?: string; type?: string; compensation?: string; location?: string })[] =
    useMemo(() => {
      return initialLegacyOpps.map((op) => ({
        id: op.id,
        publisherAccountId: 'usr_external_system',
        publisherType: 'Entity Account' as const,
        publisherName: op.organization,
        publisherOrgName: op.organization,
        targetUserTypes: ['mentor' as const],
        visibilityScope: 'All Xentro Users' as const,
        sourceType: 'partner_org' as const,
        title: op.title,
        category: (op.category.includes('Advisory')
          ? 'Mentorship'
          : op.category.includes('Speaking')
          ? 'Event'
          : op.category.includes('Judging')
          ? 'Competition'
          : op.category.includes('Workshop')
          ? 'Workshop'
          : 'Mentorship') as any,
        subcategory: op.category,
        shortDescription: op.description,
        fullDescription: op.description,
        applicantTypes: ['Mentor', 'Advisor'],
        industries: ['DeepTech', 'Enterprise AI', 'Cross-Domain', 'SaaS'],
        startupStages: ['Seed', 'Growth', 'Scaleup'],
        participationMode:
          op.location.includes('Remote') || op.location.includes('Virtual')
            ? 'Online'
            : op.location.includes('Hybrid')
            ? 'Hybrid'
            : 'Offline',
        benefits: ['Advisory Equity', 'Mentorship', 'Network Access'],
        opportunityScope: op.location.includes('International') || op.location.includes('Global')
          ? ('Global' as const)
          : ('National' as const),
        location: op.location,
        applicationMethod: 'Apply Through Xentro' as const,
        acceptApplicationsThroughXentro: true,
        applicationDeadline: op.deadline,
        badge: op.badge,
        type: op.type,
        compensation: op.compensation,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        financialDetails: op.compensation
          ? {
              type: op.compensation.includes('Equity') ? 'Equity + Honorarium' : 'Honorarium / Fee',
              amountType: 'Not Disclosed' as const,
              equityType: op.compensation.includes('Equity')
                ? ('Equity Required' as const)
                : ('No Equity' as const),
              additionalTerms: op.compensation,
            }
          : undefined,
      }));
    }, [initialLegacyOpps]);

  // Combine unified legacy opportunities and universal engine opportunities
  const allOpportunities = useMemo(() => {
    const map = new Map<string, Opportunity & { badge?: string; type?: string; compensation?: string; location?: string }>();
    unifiedLegacyOpportunities.forEach((op) => map.set(op.id, op));
    feedOpportunities.forEach((op) => map.set(op.id, op));
    return Array.from(map.values());
  }, [unifiedLegacyOpportunities, feedOpportunities]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter((op) => {
      const cat = op.category.toLowerCase();
      const subcat = (op.subcategory || '').toLowerCase();
      const sel = selectedCategory.toLowerCase();

      let matchCat = selectedCategory === 'all';
      if (!matchCat) {
        if (sel === 'advisory opportunities') {
          matchCat = subcat.includes('advisory') || cat.includes('mentor');
        } else if (sel === 'mentorship programs') {
          matchCat = subcat.includes('mentor') || cat.includes('mentor');
        } else if (sel === 'speaking opportunities') {
          matchCat = subcat.includes('speaking') || cat.includes('event');
        } else if (sel === 'judging opportunities') {
          matchCat = subcat.includes('judging') || cat.includes('competition');
        } else if (sel === 'workshops') {
          matchCat = subcat.includes('workshop') || cat.includes('workshop');
        } else if (sel === 'startup programs') {
          matchCat =
            subcat.includes('startup') || cat.includes('startup') || cat.includes('incubation');
        } else if (sel === 'ecosystem initiatives') {
          matchCat = subcat.includes('ecosystem') || cat.includes('ecosystem');
        } else {
          matchCat = cat.includes(sel) || subcat.includes(sel);
        }
      }

      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        op.title.toLowerCase().includes(q) ||
        (op.publisherOrgName && op.publisherOrgName.toLowerCase().includes(q)) ||
        (op.externalOrganization?.name && op.externalOrganization.name.toLowerCase().includes(q)) ||
        op.shortDescription.toLowerCase().includes(q)
      );
    });
  }, [allOpportunities, selectedCategory, searchQuery]);

  const handleOpenDetail = (opp: Opportunity) => {
    setActiveOpportunity(opp);
    setDetailModalOpen(true);
  };

  const handleOpenApply = (opp: Opportunity) => {
    setActiveOpportunity(opp);
    setDetailModalOpen(false);
    setApplyModalOpen(true);
  };

  const handleDirectApply = (opp: Opportunity) => {
    // 1. Submit application to universal opportunity service
    opportunityService.applyToOpportunity(opp.id, {
      applicantId: currentUser.id,
      applicantName: currentUser.name || 'Neeraj Nani',
      applicantAvatar: currentUser.avatar,
      applicantType: currentUser.role || 'mentor',
      organizationName: currentUser.organization || 'Xentro Network',
      email: currentUser.email || 'neeraj@xentro.network',
      proposalPitch: `Expressed advisory/fellowship interest in ${opp.title}. Available for advisory and panel commitments.`,
    });

    // 2. Dispatch a confirmation notification to the user so it shows in Notifications
    notificationService.sendNotification({
      userId: currentUser.id,
      category: 'mentorship',
      title: `Applied: ${opp.title}`,
      description: `Your application / expression of interest was successfully recorded for ${opp.externalOrganization?.name || opp.publisherOrgName || opp.publisherName || 'this opportunity'}.`,
      time: 'Just now',
      avatar: '/xentro-logo.png',
      actorName: opp.externalOrganization?.name || opp.publisherOrgName || opp.publisherName || 'Opportunity Committee',
      actorRole: 'Program Manager',
      actionRequired: false,
      targetTab: 'dashboard',
    });

    setAppliedMap((prev) => ({ ...prev, [opp.id]: true }));
    showToast(`Application / Interest submitted for: ${opp.title}!`, 'success');
  };

  const handleOpenManageApplicants = (opp: Opportunity) => {
    setActiveOpportunity(opp);
    setDetailModalOpen(false);
    setApplicantManagerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] text-xs font-semibold mb-1.5 border border-[#D9FF3F]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentor Advisory & Fellowship Engine</span>
            </div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-sora">
              Mentor Opportunities & Calls
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Curated advisory board seats, cohort mentorship mandates, judging panels, and speaking invites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Post Opportunity</span>
            </button>
          </div>
        </div>

        {/* Category Pills Strip & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D9FF3F] text-[#101212] font-bold shadow-xs'
                      : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  {cat === 'all' ? `All Opportunities (${filteredOpportunities.length})` : cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentor calls..."
              className="w-full h-8.5 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-slide">
        {filteredOpportunities.map((op) => {
          const isMyPost = op.publisherAccountId === currentUser.id;
          const isApplied = appliedMap[op.id];
          const badgeText = op.badge || op.status;

          return (
            <div
              key={op.id}
              onClick={() => handleOpenDetail(op)}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 flex flex-col justify-between hover:border-[#D9FF3F]/40 transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                      {op.subcategory || op.category}
                    </span>
                    {isMyPost && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        My Listing
                      </span>
                    )}
                  </div>
                  {badgeText && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        op.badge
                          ? 'bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white leading-snug font-sora group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F] transition-colors">
                    {op.title}
                  </h4>
                  <p className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F]">
                    {op.externalOrganization?.name || op.publisherOrgName || op.publisherName}
                  </p>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed line-clamp-2">
                  {op.shortDescription}
                </p>

                {/* Dynamic Details: Engagement & Compensation if available, else Mode & Capacity */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29] text-xs">
                  {op.type ? (
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Engagement</span>
                      <span className="font-semibold text-[#101212] dark:text-white">{op.type}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Mode & Scope</span>
                      <span className="font-semibold text-[#101212] dark:text-white">
                        {op.participationMode} ({op.opportunityScope || 'National'})
                      </span>
                    </div>
                  )}

                  {op.compensation ? (
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Compensation</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">
                        {op.compensation}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-[#565B59] uppercase block font-semibold">Capacity</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {op.availableSlots ? `${op.availableSlots} Slots` : op.capacityType || 'Open'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#565B59]" />
                    {op.opportunityScope || 'Global / Remote'}
                  </span>
                  {op.applicationDeadline && (
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#565B59]" />
                      {op.applicationDeadline.startsWith('20') ? `Deadline: ${op.applicationDeadline}` : op.applicationDeadline}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleOpenDetail(op)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-2">
                  {isMyPost ? (
                    <button
                      onClick={() => handleOpenManageApplicants(op)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/20 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review ({op.applicantsCount || 0})</span>
                    </button>
                  ) : isApplied ? (
                    <div className="px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </div>
                  ) : op.applicationMethod === 'Apply Through Xentro' ? (
                    <button
                      onClick={() => {
                        if (op.id.startsWith('op_')) {
                          handleDirectApply(op);
                        } else {
                          handleOpenApply(op);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95 cursor-pointer"
                    >
                      <span>Apply / Express Interest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : op.applicationUrl ? (
                    <a
                      href={op.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95 cursor-pointer"
                    >
                      <span>Open Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleDirectApply(op)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-xs active:scale-95 cursor-pointer"
                    >
                      <span>Apply / Express Interest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Opportunity Modal */}
      {isPostModalOpen && (
        <UniversalOpportunityModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => loadOpportunities()}
        />
      )}

      {/* Detail Modal */}
      {detailModalOpen && activeOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={activeOpportunity}
          onApply={(opp) => handleOpenApply(opp)}
          onManageApplicants={(opp) => handleOpenManageApplicants(opp)}
          currentUserRole="mentor"
          currentUserId={currentUser.id}
        />
      )}

      {/* Apply Modal */}
      {applyModalOpen && activeOpportunity && (
        <OpportunityApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          opportunity={activeOpportunity}
          onSuccess={() => loadOpportunities()}
        />
      )}

      {/* Applicant Management */}
      {applicantManagerOpen && activeOpportunity && (
        <OpportunityApplicationManager
          isOpen={applicantManagerOpen}
          onClose={() => setApplicantManagerOpen(false)}
          opportunity={activeOpportunity}
        />
      )}
    </div>
  );
};
