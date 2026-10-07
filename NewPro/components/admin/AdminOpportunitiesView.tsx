'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  PlusCircle,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Calendar,
  Building2,
  Tag,
  DollarSign,
  Globe,
  Filter,
  RefreshCw,
  X,
  Users,
  Eye,
  Edit3,
  ShieldCheck,
  Check,
  Upload,
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import { Opportunity, OpportunityStatus } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { UniversalOpportunityModal } from '@/components/opportunity/UniversalOpportunityModal';
import { OpportunityDetailModal } from '@/components/opportunity/OpportunityDetailModal';
import { OpportunityApplicationManager } from '@/components/opportunity/OpportunityApplicationManager';
import { useToast } from '@/components/ui/Toast';

export const AdminOpportunitiesView: React.FC = () => {
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'open' | 'government' | 'corporate' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Modals state
  const [universalModalOpen, setUniversalModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | undefined>(undefined);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [applicantManagerOpen, setApplicantManagerOpen] = useState(false);

  // CSV Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvInputMode, setCsvInputMode] = useState<'file' | 'text'>('file');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Load from service and API
  const loadOpportunities = () => {
    const all = opportunityService.getOpportunities();
    setOpportunities(all);
  };

  useEffect(() => {
    loadOpportunities();
    // Also sync opportunities from backend API
    opportunityService.fetchOpportunitiesFromApi().then((synced) => {
      if (synced && synced.length > 0) setOpportunities(synced);
    });

    const handleUpdate = () => loadOpportunities();
    window.addEventListener('xentro-opportunities-updated', handleUpdate);
    return () => {
      window.removeEventListener('xentro-opportunities-updated', handleUpdate);
    };
  }, []);

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (filterTab === 'open' && o.status !== 'open') return false;
      if (filterTab === 'government' && o.sourceType !== 'government') return false;
      if (filterTab === 'corporate' && o.sourceType !== 'corporate_mnc') return false;
      if (filterTab === 'draft' && o.status !== 'draft') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = o.title.toLowerCase().includes(q);
        const orgMatch =
          o.externalOrganization?.name.toLowerCase().includes(q) ||
          (o.publisherOrgName && o.publisherOrgName.toLowerCase().includes(q));
        const catMatch = o.category.toLowerCase().includes(q);
        const subcatMatch = o.subcategory?.toLowerCase().includes(q);
        return titleMatch || orgMatch || catMatch || subcatMatch;
      }
      return true;
    });
  }, [opportunities, filterTab, searchQuery]);

  // AI Scraper Simulation - Ingests as verified Official Opportunity
  const handleRunScraper = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      const newScraped: Opportunity = {
        id: `opp-ai-${Date.now().toString().slice(-4)}`,
        publisherAccountId: 'usr_admin_karunya',
        publisherType: 'Xentro Admin',
        publisherName: 'Karunya S.',
        publisherRoleTitle: 'Super Admin, Platform Ops',
        publisherOrgName: 'Xentro Admin Operational Control Plane',
        publisherVerified: true,
        targetUserTypes: ['startup', 'founder'],
        visibilityScope: 'All Xentro Users',
        sourceType: 'government',
        externalOrganization: {
          name: 'Ministry of Electronics and Information Technology (MeitY)',
          organizationType: 'Central Government',
          ownershipType: 'government',
          country: 'India',
          state: 'New Delhi',
          city: 'New Delhi',
          website: 'https://meitystartuphub.in',
          officialOpportunityUrl: 'https://meitystartuphub.in/tide2',
        },
        title: 'MeitY TIDE 2.0 Scale-Up Seed Fund (Cohort 2026)',
        category: 'Grant',
        subcategory: 'Government Seed Fund',
        shortDescription:
          'Financial and technical enablement for early-stage IoT, AI, Hardware, and Semiconductor ventures across India.',
        fullDescription: `The Ministry of Electronics & IT (MeitY) TIDE 2.0 scheme supports tech startups using emerging technologies like IoT, AI, Blockchain, and Robotics.

Selected startups receive up to ₹30 Lakhs in non-dilutive grant support, direct access to state fab labs and high-performance compute clusters, and mentor advisory panels across premier research institutions.`,
        objective: 'Catalyze indigenous deeptech and semiconductor product innovation in India.',
        applicantTypes: ['Startup', 'Founder', 'Team'],
        industries: ['Enterprise AI', 'DeepTech', 'Hardware & Robotics', 'Semiconductors & Silicon'],
        startupStages: ['Prototype', 'MVP', 'Pre-Revenue'],
        geographicEligibility: {
          scope: 'Country',
          country: 'India',
        },
        registrationRequirements: ['Incorporation Required', 'DPIIT Recognition Required'],
        benefits: ['Grant', 'Government Access', 'Lab Access', 'Mentorship'],
        financialDetails: {
          type: 'Grant',
          amountType: 'Fixed Amount',
          amount: 3000000,
          currency: 'INR',
          equityType: 'No Equity',
        },
        participationMode: 'Hybrid',
        opportunityScope: 'National',
        applicationMethod: 'Apply Through Xentro',
        acceptApplicationsThroughXentro: true,
        applicationRequirements: ['Startup Profile', 'Pitch Deck', 'Incorporation Certificate', 'DPIIT Certificate'],
        applicationsOpen: new Date().toISOString().split('T')[0],
        applicationDeadline: '2026-11-30',
        rollingApplications: false,
        opportunityStartDate: '2026-12-15',
        frequency: 'Annual',
        capacityType: 'Limited',
        availableSlots: 20,
        slotLabel: 'Grants',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        verification: {
          officialSourceUrl: 'https://meitystartuphub.in/tide2',
          sourcePublicationDate: new Date().toISOString().split('T')[0],
          lastVerifiedDate: new Date().toISOString().split('T')[0],
          verifiedBy: 'Karunya (#9922953) - Super Admin',
          status: 'Official',
        },
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicantsCount: 0,
      };

      opportunityService.saveOpportunity(newScraped);
      showToast('AI Ingestion complete: 1 new official MeitY grant indexed into Universal Engine', 'success');
    }, 1500);
  };

  const handleImportCsv = async () => {
    if (csvInputMode === 'file' && !csvFile) {
      showToast('Please select a CSV file to import.', 'error');
      return;
    }
    if (csvInputMode === 'text' && !csvText.trim()) {
      showToast('Please paste valid CSV content.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const payload = csvInputMode === 'file' ? csvFile! : csvText;
      const res = await opportunityService.importOpportunitiesCsv(payload);
      if (res.success) {
        showToast(res.message, 'success');
        setImportModalOpen(false);
        setCsvFile(null);
        setCsvText('');
        loadOpportunities();
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to import CSV opportunities.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = `title,category,organization,amount,deadline,eligibility,url,description
Karnataka Elevate 2026,Grant,Startup Karnataka,5000000,2026-10-31,Early Stage Tech Startups,https://startup.karnataka.gov.in,Karnataka State Innovation Seed Grant for DeepTech & AI
NVIDIA Inception Scale Grant,Corporate,NVIDIA Corporation,2500000,2026-11-15,AI & GPU Acceleration Ventures,https://nvidia.com/inception,Accelerated computing credits and premier enterprise design partner access
DST NIDHI PRAYAS,Government,Department of Science and Technology,1000000,2026-12-01,Hardware & DeepTech Innovators,https://nidhi-prayas.org,Prototyping grant support for hardware innovations`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'xentro_opportunities_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setDetailModalOpen(false);
    setUniversalModalOpen(true);
  };

  const handleOpenApplicants = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDetailModalOpen(false);
    setApplicantManagerOpen(true);
  };

  const handleDeleteOpportunity = (id: string) => {
    if (confirm('Are you sure you want to remove this opportunity from the universal engine?')) {
      opportunityService.deleteOpportunity(id);
      showToast('Opportunity removed from platform', 'info');
    }
  };

  const handleToggleStatus = (id: string, currentStatus: OpportunityStatus) => {
    const nextStatus: OpportunityStatus = currentStatus === 'open' ? 'closed' : 'open';
    opportunityService.updateOpportunityStatus(id, nextStatus);
    showToast(`Opportunity marked as ${nextStatus}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Overview & AI Scraper Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] text-xs font-semibold mb-2 border border-[#D9FF3F]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F]" />
            <span>Universal Opportunity Engine & Platform Control</span>
          </div>
          <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            Ecosystem Grants & Opportunities Hub
          </h2>
          <p className="text-xs text-[#6E7370] dark:text-[#8E9390] mt-1 max-w-2xl leading-relaxed">
            Universal opportunity control plane for government grants, MNC innovation calls, VC syndicate allocations, incubator programs, and mentor advisory seats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#101212] text-white dark:bg-[#202422] dark:text-white hover:bg-gray-800 dark:hover:bg-[#282C2A] text-xs font-bold transition-all border border-[#262A29] shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D9FF3F]" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleRunScraper}
            disabled={isScraping}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-bold transition-all border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin text-emerald-600 dark:text-[#D9FF3F]' : ''}`} />
            <span>{isScraping ? 'Ingesting Feeds...' : 'Trigger AI Ingestion'}</span>
          </button>

          <button
            onClick={() => {
              setEditingOpportunity(undefined);
              setUniversalModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post Opportunity</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            All Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setFilterTab('open')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterTab === 'open'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Open & Active
          </button>
          <button
            onClick={() => setFilterTab('government')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterTab === 'government'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Government Grants
          </button>
          <button
            onClick={() => setFilterTab('corporate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterTab === 'corporate'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Corporate & MNC
          </button>
          <button
            onClick={() => setFilterTab('draft')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterTab === 'draft'
                ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            Drafts
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs, grants, orgs..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden"
          />
        </div>
      </div>

      {/* Opportunities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((opp) => {
          const isGov = opp.sourceType === 'government';
          const isCorp = opp.sourceType === 'corporate_mnc';

          return (
            <div
              key={opp.id}
              onClick={() => handleOpenDetail(opp)}
              className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F]/50 transition-all flex flex-col justify-between cursor-pointer group shadow-subtle hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                      {opp.category}
                    </span>
                    {opp.subcategory && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-[#262A29] text-[#6E7370] dark:text-[#A0A4A2]">
                        {opp.subcategory}
                      </span>
                    )}
                    {isGov && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Govt Scheme
                      </span>
                    )}
                    {isCorp && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Enterprise
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      opp.status === 'open'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : opp.status === 'rolling'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : opp.status === 'upcoming'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-[#262A29]'
                    }`}
                  >
                    {opp.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-sora text-base font-bold text-[#101212] dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-[#D9FF3F] transition-colors">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {opp.externalOrganization?.name || opp.publisherOrgName || opp.publisherName}
                    </span>
                  </p>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                  {opp.shortDescription}
                </p>

                {/* Target Audience & Mode */}
                <div className="flex items-center gap-3 text-xs text-[#6E7370] dark:text-[#8E9390] pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{opp.targetUserTypes?.join(', ') || 'All Users'}</span>
                  </span>
                  <span>•</span>
                  <span>{opp.participationMode}</span>
                  {opp.applicationDeadline && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#101212] dark:text-white font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Deadline: {opp.applicationDeadline}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Administrative Action Bar */}
              <div
                className="mt-4 pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetail(opp)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8E9390]" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleOpenApplicants(opp)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-500/20"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Applicants ({opp.applicantsCount || 0})</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(opp)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white transition-colors"
                    title="Edit opportunity"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(opp.id, opp.status)}
                    className="text-xs font-semibold px-2 py-1 rounded text-[#6E7370] dark:text-[#8E9390] hover:bg-gray-100 dark:hover:bg-[#202422]"
                  >
                    {opp.status === 'open' ? 'Close' : 'Open'}
                  </button>

                  <button
                    onClick={() => handleDeleteOpportunity(opp.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Remove Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal Opportunity Creation & Edit Modal */}
      {universalModalOpen && (
        <UniversalOpportunityModal
          isOpen={universalModalOpen}
          onClose={() => {
            setUniversalModalOpen(false);
            setEditingOpportunity(undefined);
          }}
          adminMode={true}
          isEditMode={!!editingOpportunity}
          initialOpportunity={editingOpportunity}
          onSuccess={() => {
            loadOpportunities();
          }}
        />
      )}

      {/* Opportunity Detail Modal */}
      {detailModalOpen && selectedOpportunity && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          adminMode={true}
          onEdit={(opp) => handleOpenEdit(opp)}
          onManageApplicants={(opp) => handleOpenApplicants(opp)}
        />
      )}

      {/* Applicant Management Modal */}
      {applicantManagerOpen && selectedOpportunity && (
        <OpportunityApplicationManager
          isOpen={applicantManagerOpen}
          onClose={() => setApplicantManagerOpen(false)}
          opportunity={selectedOpportunity}
          adminMode={true}
        />
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] rounded-2xl border border-[#CDD1CE] dark:border-[#262928] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#CDD1CE] dark:border-[#262928]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                    Import Opportunities via CSV
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                    Ingest batches of grants, corporate challenges, or accelerators directly into the database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262928]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="p-5 pb-0">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 dark:bg-[#121413] border border-gray-200 dark:border-[#222524] text-xs">
                <button
                  type="button"
                  onClick={() => setCsvInputMode('file')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    csvInputMode === 'file'
                      ? 'bg-white dark:bg-[#202422] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Upload CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setCsvInputMode('text')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    csvInputMode === 'text'
                      ? 'bg-white dark:bg-[#202422] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Paste CSV Text
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {csvInputMode === 'file' ? (
                <div className="border-2 border-dashed border-[#CDD1CE] dark:border-[#262928] rounded-xl p-6 text-center hover:border-[#D9FF3F] transition-colors cursor-pointer bg-gray-50/50 dark:bg-[#121413]/50">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    id="csv-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCsvFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs font-semibold text-[#101212] dark:text-white">
                      {csvFile ? csvFile.name : 'Click to select CSV file or drag here'}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB selected` : 'Supports UTF-8 CSV with standard headers'}
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    CSV Raw Text (comma or tab delimited)
                  </label>
                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="title,category,organization,amount,deadline,eligibility,url,description&#10;Startup India SISFS,Grant,DPIIT,5000000,2026-11-30,Seed Startups,https://seedfund.startupindia.gov.in,Government seed fund grant"
                    className="w-full p-3 font-mono text-xs rounded-xl border border-[#CDD1CE] dark:border-[#262928] bg-white dark:bg-[#121413] text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              )}

              {/* Template Helper Card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#121413] border border-[#CDD1CE] dark:border-[#262928] text-xs">
                <div>
                  <strong className="block text-[#101212] dark:text-white font-semibold">Need standard schema?</strong>
                  <span className="text-gray-500 text-[11px]">Includes title, category, amount, deadline, eligibility, url, summary</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202422] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-[#101212] dark:text-white hover:border-[#D9FF3F] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#CDD1CE] dark:border-[#262928] bg-gray-50/50 dark:bg-[#121413]/50">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={isImporting || (csvInputMode === 'file' ? !csvFile : !csvText.trim())}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.99] shadow-xs"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing & Ingesting...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Import Opportunities</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
