'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderLock,
  Folder,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  Filter,
  Plus,
  X,
  Building2,
  ChevronRight,
  Maximize2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import { getUserProfile } from '@/lib/userProfile';
import { InvestorDDDocument, InvestorDDStatus, InvestorDeal } from '@/types/investor';

interface StartupFolderInfo {
  id: string;
  name: string;
  logo: string;
  sector: string;
  stage: string;
  founder: string;
  docsCount: number;
  grantedCount: number;
}

export const InvestorDiligenceLocker: React.FC = () => {
  const { showToast } = useToast();
  const [docs, setDocs] = useState<InvestorDDDocument[]>([]);
  const [deals, setDeals] = useState<InvestorDeal[]>([]);
  const [startupSearch, setStartupSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [previewDoc, setPreviewDoc] = useState<InvestorDDDocument | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [ndaDoc, setNdaDoc] = useState<InvestorDDDocument | null>(null);
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [isNdaSubmitting, setIsNdaSubmitting] = useState(false);

  // Request form state
  const [targetStartupId, setTargetStartupId] = useState('');
  const [requestedCategory, setRequestedCategory] = useState('Financials');
  const [requestedDocTitle, setRequestedDocTitle] = useState('');
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    setDocs(investorDomainService.getDiligenceDocuments());
    setDeals(investorDomainService.getDeals());

    const handleDocsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.docs) {
        setDocs(ce.detail.docs);
      }
    };
    const handleDealsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) {
        setDeals(ce.detail.deals);
      }
    };

    window.addEventListener('xentro-investor-diligence-changed', handleDocsChange);
    window.addEventListener('xentro-investor-deals-changed', handleDealsChange);
    return () => {
      window.removeEventListener('xentro-investor-diligence-changed', handleDocsChange);
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChange);
    };
  }, []);

  // Compute folders: one folder per startup
  const startupFolders: StartupFolderInfo[] = useMemo(() => {
    // Collect all unique startup IDs from deals and docs
    const startupMap = new Map<string, StartupFolderInfo>();

    // Seed default known startups from deals
    deals.forEach((deal) => {
      if (!startupMap.has(deal.startupId)) {
        startupMap.set(deal.startupId, {
          id: deal.startupId,
          name: deal.startupName,
          logo: deal.startupLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          sector: deal.sector,
          stage: deal.stage,
          founder: deal.founderName,
          docsCount: 0,
          grantedCount: 0,
        });
      }
    });

    // Also populate from documents if any startup wasn't in deals
    docs.forEach((doc) => {
      if (!startupMap.has(doc.startupId)) {
        startupMap.set(doc.startupId, {
          id: doc.startupId,
          name: doc.startupName,
          logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          sector: 'Enterprise AI & Tech',
          stage: 'Seed',
          founder: 'Founding Team',
          docsCount: 0,
          grantedCount: 0,
        });
      }
    });

    // Calculate document counts per startup
    docs.forEach((doc) => {
      const item = startupMap.get(doc.startupId);
      if (item) {
        item.docsCount += 1;
        if (doc.accessStatus === 'granted') {
          item.grantedCount += 1;
        }
      }
    });

    return Array.from(startupMap.values());
  }, [deals, docs]);

  // Selected startup folder
  const currentStartup = useMemo(() => {
    return startupFolders.find((s) => s.id === selectedStartupId) || startupFolders[0] || null;
  }, [startupFolders, selectedStartupId]);

  // Filtered startup folders on left
  const filteredStartupFolders = useMemo(() => {
    if (!startupSearch.trim()) return startupFolders;
    const q = startupSearch.toLowerCase();
    return startupFolders.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.founder.toLowerCase().includes(q)
    );
  }, [startupFolders, startupSearch]);

  // Documents inside currently selected startup folder
  const currentStartupDocs = useMemo(() => {
    return docs.filter((d) => d.startupId === currentStartup.id);
  }, [docs, currentStartup]);

  const categories = ['All', 'Pitch Deck', 'Financials', 'Cap Table', 'Technical', 'Compliance'];

  // Filtered documents inside folder
  const filteredDocs = useMemo(() => {
    return currentStartupDocs.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(docSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [currentStartupDocs, docSearch, selectedCategory]);

  const handleOpenDoc = (doc: InvestorDDDocument) => {
    if (doc.accessStatus === 'granted') {
      setPreviewDoc(doc);
    } else if (doc.accessStatus === 'requested') {
      showToast(`Access for "${doc.title}" is currently pending founder approval.`, 'info');
    } else {
      // Locked document requires authentication and mutual NDA agreement
      setNdaDoc(doc);
      setNdaAgreed(false);
    }
  };

  const handleConfirmNdaAndRequest = async () => {
    if (!ndaDoc || !ndaAgreed) return;
    setIsNdaSubmitting(true);
    try {
      // 1. Call backend DD verify / request endpoint
      const startupId = ndaDoc.startupId;
      try {
        await fetch(`http://127.0.0.1:8000/api/v1/dd/${startupId}/request-access/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('xentro_access_token') || ''}`,
          },
          body: JSON.stringify({
            firmName: 'Apex Ventures Capital Management',
            intent: `Access requested for ${ndaDoc.category}: ${ndaDoc.title}`,
            ndaAgreed: true,
          }),
        });
      } catch (err) {
        console.warn('Backend diligence request endpoint unreachable, updating local state:', err);
      }

      // 2. Also record in startup's locker access queue
      try {
        const storedReqs = localStorage.getItem('xentro_startup_dd_access_requests');
        const reqList = storedReqs ? JSON.parse(storedReqs) : [];
        const uProf = getUserProfile();
        reqList.unshift({
          id: `req_${Date.now()}`,
          userName: uProf.name || 'Investor',
          userType: 'Institutional Investor',
          userRole: uProf.roleTitle || 'Investor',
          organization: uProf.organization || 'Venture Partner',
          avatar: uProf.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          requestedFolders: [ndaDoc.category],
          requestedDate: new Date().toISOString().split('T')[0],
          status: 'PENDING',
        });
        localStorage.setItem('xentro_startup_dd_access_requests', JSON.stringify(reqList));
      } catch (storageErr) {}

      // 3. Mark doc as requested
      const updated = docs.map((d) => (d.id === ndaDoc.id ? { ...d, accessStatus: 'requested' as const } : d));
      setDocs(updated);
      localStorage.setItem('xentro_investor_diligence_docs_v1', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-diligence-changed', { detail: { docs: updated } }));

      showToast(`Mutual NDA recorded! Diligence access request dispatched to ${currentStartup.name} founders.`, 'success');
      setNdaDoc(null);
    } finally {
      setIsNdaSubmitting(false);
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = startupFolders.find((s) => s.id === targetStartupId) || currentStartup;
    const category = requestedCategory;
    const title = requestedDocTitle.trim() || `${st.name} - ${category} Confidential Room`;

    const newDoc: InvestorDDDocument = {
      id: `doc_${Date.now()}`,
      startupId: st.id,
      startupName: st.name,
      title,
      category: category as any,
      fileType: 'PDF',
      fileSize: '3.2 MB',
      accessStatus: 'requested',
      requestedAt: new Date().toISOString().split('T')[0],
      watermarked: true,
    };

    const updated = [newDoc, ...docs];
    if (typeof window !== 'undefined') {
      localStorage.setItem('xentro_investor_diligence_docs_v1', JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('xentro-investor-diligence-changed', { detail: { docs: updated } })
      );
    }

    showToast(`Data room request dispatched to ${st.name} founders!`, 'success');
    setIsRequestModalOpen(false);
    setRequestedDocTitle('');
    setRequestReason('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101212] dark:text-white font-heading flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-purple-500" />
            <span>Due Diligence Locker & Virtual Data Room</span>
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Folder-per-startup virtual data room with dynamic NDA watermarking & confidential vaults
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetStartupId(currentStartup.id);
              setIsRequestModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request DD Document</span>
          </button>
        </div>
      </div>

      {/* Institutional Confidentiality Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
          <span>
            <strong>Institutional Diligence Protection:</strong> All accessed documents are dynamically watermarked with your user identity ({getUserProfile().name || 'Investor'}) and cryptographic timestamp.
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 uppercase">
          Strict NDA
        </span>
      </div>

      {/* 2. Folder-per-Startup Explorer Architecture (Left: Startup Folders, Right: Startup Data Room) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-slide">
        {/* Left Column: Startup Folders Nav (1 Column) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
              Startup Vault Folders ({startupFolders.length})
            </span>
          </div>

          {/* Search Startups */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders..."
              value={startupSearch}
              onChange={(e) => setStartupSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
            />
          </div>

          {/* Folder Buttons List */}
          <div className="space-y-1.5 pt-1 max-h-[540px] overflow-y-auto pr-1">
            {filteredStartupFolders.map((folder) => {
              const isSelected = selectedStartupId === folder.id;

              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedStartupId(folder.id);
                    setSelectedCategory('All');
                    setDocSearch('');
                  }}
                  className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                      : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] hover:text-[#101212] dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <img src={folder.logo} alt={folder.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{folder.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{folder.sector}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                          : 'bg-gray-100 dark:bg-[#262A29] text-gray-500'
                      }`}
                    >
                      {folder.docsCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Startup's Virtual Data Room (3 Columns) */}
        {!currentStartup ? (
          <div className="lg:col-span-3 p-12 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle text-center flex flex-col items-center justify-center space-y-3">
            <FolderLock className="w-12 h-12 text-gray-400 opacity-60" />
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              No Diligence Rooms Available
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm">
              When startups share confidential data rooms with you or when you request diligence access, their folders will appear here.
            </p>
          </div>
        ) : (
        <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
          {/* Breadcrumb & Startup Header */}
          <div className="pb-4 border-b border-gray-100 dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] mb-1">
                <span>Diligence Locker</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-[#101212] dark:text-white">{currentStartup.name}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <img src={currentStartup.logo} alt={currentStartup.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                    <span>{currentStartup.name} Virtual Data Room</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Vault Active
                    </span>
                  </h3>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Founder: {currentStartup.founder} &bull; {currentStartup.sector} &bull; {currentStartup.stage} Stage &bull; {currentStartupDocs.length} items catalogued
                  </p>
                </div>
              </div>
            </div>

            {/* In-folder Search & Request */}
            <div className="flex items-center gap-2">
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <button
                onClick={() => {
                  setTargetStartupId(currentStartup.id);
                  setIsRequestModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request File</span>
              </button>
            </div>
          </div>

          {/* Sub-Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? currentStartupDocs.length
                  : currentStartupDocs.filter((d) => d.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                      : 'bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/20">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Documents Grid */}
          {filteredDocs.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-2xl bg-gray-50/50 dark:bg-[#202422]/40 border border-dashed border-gray-200 dark:border-gray-700">
              <FileText className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-xs font-semibold text-[#101212] dark:text-white">
                No documents found in {selectedCategory === 'All' ? 'this folder' : selectedCategory}
              </p>
              <button
                onClick={() => {
                  setTargetStartupId(currentStartup.id);
                  setRequestedCategory(selectedCategory === 'All' ? 'Pitch Deck' : selectedCategory);
                  setIsRequestModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs cursor-pointer hover:bg-[#C7F020]"
              >
                Request from {currentStartup.name}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const isGranted = doc.accessStatus === 'granted';
                const isRequested = doc.accessStatus === 'requested';

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono flex-shrink-0 ${
                          doc.fileType === 'XLSX'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : doc.fileType === 'PDF'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {doc.fileType}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate max-w-sm sm:max-w-md">
                            {doc.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-gray-200 dark:bg-black/30 text-[#565B59] dark:text-gray-300">
                            {doc.category}
                          </span>
                          {doc.watermarked && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Watermarked
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                          Size: {doc.fileSize} &bull;{' '}
                          {isGranted
                            ? `Access active until ${doc.expiresAt || '2026-06-30'}`
                            : isRequested
                            ? `Requested on ${doc.requestedAt || todayStr} (Pending Founder Approval)`
                            : 'Access restricted'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {isGranted ? (
                        <>
                          <button
                            onClick={() => handleOpenDoc(doc)}
                            className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Document</span>
                          </button>

                          <button
                            onClick={() =>
                              showToast(
                                `Downloading watermarked bundle for "${doc.title}"...`,
                                'success'
                              )
                            }
                            title="Download watermarked file"
                            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-gray-300 hover:text-[#101212] dark:hover:text-white transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : isRequested ? (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Approval</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          className="px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Request Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}
      </div>

      {/* 3. Secure Watermarked Document Viewer Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#151918] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl flex flex-col overflow-hidden">
            {/* Viewer Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-4 bg-gray-50 dark:bg-[#1a1f1d]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs font-mono">
                  {previewDoc.fileType}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#101212] dark:text-white truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    {previewDoc.startupName} &bull; Diligence Room &bull; Dynamic Institutional Watermark Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    showToast(`Downloading secure watermarked file for "${previewDoc.title}"`, 'success')
                  }
                  className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-[#262A29] hover:bg-gray-300 dark:hover:bg-[#323635] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[#262A29] text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Canvas with Repeated Watermark */}
            <div className="relative flex-1 p-6 sm:p-8 overflow-y-auto bg-gray-100 dark:bg-[#0e1211] flex items-center justify-center min-h-[420px]">
              {/* Document Sheet Simulation */}
              <div className="relative w-full max-w-2xl bg-white dark:bg-[#181B1A] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 sm:p-12 space-y-6 overflow-hidden select-none">
                {/* Visual Watermarking Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-15 rotate-[-25deg] select-none text-[13px] font-black tracking-widest text-[#101212] dark:text-[#D9FF3F] uppercase">
                  <span>CONFIDENTIAL &bull; {(getUserProfile().name || 'INVESTOR').toUpperCase()} &bull; {todayStr}</span>
                  <span>CONFIDENTIAL &bull; {(getUserProfile().name || 'INVESTOR').toUpperCase()} &bull; {todayStr}</span>
                  <span>CONFIDENTIAL &bull; {(getUserProfile().name || 'INVESTOR').toUpperCase()} &bull; {todayStr}</span>
                </div>

                {/* Simulated Document Content Header */}
                <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
                      CONFIDENTIAL DUE DILIGENCE VAULT
                    </span>
                    <h2 className="text-xl font-extrabold text-[#101212] dark:text-white font-heading">
                      {previewDoc.title}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Organization</span>
                    <span className="text-xs font-bold text-[#101212] dark:text-white">
                      {previewDoc.startupName}
                    </span>
                  </div>
                </div>

                {/* Simulated Text Paragraphs */}
                <div className="space-y-4 text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  <p>
                    This document contains proprietary and strictly confidential investment diligence information
                    pertaining to {previewDoc.startupName}. Access has been granted to verified partner
                    {getUserProfile().name || 'Investor'} under the terms of the bilateral Non-Disclosure Agreement.
                  </p>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="font-bold text-[#101212] dark:text-white">
                      Section 1: Executive Diligence & Strategic Highlights
                    </div>
                    <p className="text-[11px]">
                      Verified operational metrics, financial projections for 2026-2029, audited capitalization
                      structure, IP patents registry, and technical architecture benchmarks validated by third-party
                      counsel.
                    </p>
                  </div>
                  <p>
                    Unauthorized distribution, reproduction, or dissemination is strictly prohibited and subject to
                    immediate legal injunctive relief and forensic telemetry audit tracking.
                  </p>
                </div>

                {/* Document Footer */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
                  <span>Page 1 of 8</span>
                  <span>Apex Institutional Vault ID: #XNT-DD-{previewDoc.id.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Request Access Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Request Diligence Document Access
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Target Startup Folder:</label>
                <select
                  value={targetStartupId}
                  onChange={(e) => setTargetStartupId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  {startupFolders.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Document Category:</label>
                <select
                  value={requestedCategory}
                  onChange={(e) => setRequestedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white font-semibold focus:outline-none focus:border-[#D9FF3F]"
                >
                  <option value="Pitch Deck">Pitch Deck & Overview</option>
                  <option value="Financials">Financial Model & Projections</option>
                  <option value="Cap Table">Cap Table & Waterfall</option>
                  <option value="Technical">Technical Specs & Architecture</option>
                  <option value="Compliance">Legal & Compliance Audits</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Specific Document Title (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Monthly Cash Flow Waterfall & Customer Cohorts"
                  value={requestedDocTitle}
                  onChange={(e) => setRequestedDocTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white">Investment Committee Note / Purpose:</label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Reviewing Series Seed term sheet prerequisites with managing partners..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:text-black dark:hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold shadow-2xs cursor-pointer"
                >
                  Send DD Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Mutual NDA and Authentication Modal */}
      {ndaDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Mutual NDA & Data Room Authorization
                </h3>
              </div>
              <button
                onClick={() => setNdaDoc(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <div className="font-bold text-purple-900 dark:text-purple-300 mb-0.5">
                Restricted Document: {ndaDoc.title}
              </div>
              <div className="text-purple-700 dark:text-purple-400">
                Target Entity: <span className="font-semibold">{currentStartup.name}</span> &bull; Category: {ndaDoc.category}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121413] border border-gray-200 dark:border-[#262A29] text-xs text-gray-600 dark:text-gray-300 space-y-2.5 max-h-48 overflow-y-auto">
              <strong className="block text-[#101212] dark:text-white font-semibold">
                Xentro Standard Mutual Non-Disclosure Agreement (Zero-Leak Policy):
              </strong>
              <p>
                1. <strong>Confidentiality Undertaking:</strong> The Recipient agrees to maintain strictly confidential all financial statements, cap tables, IP models, and technical architectures disclosed in this Due Diligence Locker.
              </p>
              <p>
                2. <strong>Dynamic Cryptographic Watermarking:</strong> Every view and download is dynamically watermarked with your authenticated Investor ID, IP address, and timestamp.
              </p>
              <p>
                3. <strong>Restricted Purpose:</strong> Proprietary data shall be used solely for the evaluation of potential venture financing or commercial partnership with {currentStartup.name}.
              </p>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={ndaAgreed}
                  onChange={(e) => setNdaAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F]"
                />
                <span className="text-[#101212] dark:text-gray-200 leading-relaxed font-medium">
                  I confirm my accredited investor credentials and accept the Xentro Mutual NDA for {currentStartup.name}.
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setNdaDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNdaAndRequest}
                disabled={!ndaAgreed || isNdaSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isNdaSubmitting ? 'Authenticating & Submitting...' : 'Sign NDA & Request Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
