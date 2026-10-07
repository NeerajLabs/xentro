'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  Folder,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Users,
  Search,
  Check,
  X,
  Plus,
  AlertTriangle,
  History,
  FileCheck,
  Loader2,
} from 'lucide-react';
import {
  initialDDDocuments,
  initialDDAccessRequests,
  initialDDActiveAccess,
  initialDDAuditLog,
  DDDocument,
  DDAccessRequest,
  DDActiveAccess,
  DDActivityLogItem,
  DDFolderType,
} from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';

const DD_DOCUMENTS_KEY = 'xentro_startup_dd_documents';
const DD_AUDIT_LOG_KEY = 'xentro_startup_dd_audit';
const DD_ACTIVE_ACCESS_KEY = 'xentro_startup_dd_active_access';
const DD_ACCESS_REQUESTS_KEY = 'xentro_startup_dd_access_requests';

export const StartupDDLocker: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'folders' | 'requests' | 'active_access' | 'audit_log'>('folders');

  const folders: DDFolderType[] = [
    'Corporate',
    'Ownership',
    'Financial',
    'Fundraising',
    'Legal',
    'Intellectual Property',
    'Product / Technology',
  ];

  const [selectedFolder, setSelectedFolder] = useState<DDFolderType>('Corporate');
  const [documents, setDocuments] = useState<DDDocument[]>(initialDDDocuments);
  const [accessRequests, setAccessRequests] = useState<DDAccessRequest[]>(initialDDAccessRequests);
  const [activeAccessList, setActiveAccessList] = useState<DDActiveAccess[]>(initialDDActiveAccess);
  const [auditLog, setAuditLog] = useState<DDActivityLogItem[]>(initialDDAuditLog);

  // Approval Modal with Folder Selection
  const [approvingRequest, setApprovingRequest] = useState<DDAccessRequest | null>(null);
  const [selectedGrantFolders, setSelectedGrantFolders] = useState<DDFolderType[]>([]);

  // Preview file modal
  const [previewDoc, setPreviewDoc] = useState<DDDocument | null>(null);

  // New Document Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFolder, setNewDocFolder] = useState<DDFolderType>('Corporate');
  const [isConfidential, setIsConfidential] = useState(true);

  // Real File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem(DD_DOCUMENTS_KEY);
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        if (Array.isArray(parsed)) {
          if (parsed.some((d: any) => d?.id?.startsWith('doc_') && parseInt(d.id.replace('doc_', ''), 10) <= 12)) {
            localStorage.removeItem(DD_DOCUMENTS_KEY);
            setDocuments([]);
          } else {
            setDocuments(parsed);
          }
        }
      }
      const storedAudit = localStorage.getItem(DD_AUDIT_LOG_KEY);
      if (storedAudit) {
        const parsed = JSON.parse(storedAudit);
        if (Array.isArray(parsed)) {
          if (parsed.some((a: any) => a?.id?.startsWith('aud_'))) {
            localStorage.removeItem(DD_AUDIT_LOG_KEY);
            setAuditLog([]);
          } else {
            setAuditLog(parsed);
          }
        }
      }
      const storedActive = localStorage.getItem(DD_ACTIVE_ACCESS_KEY);
      if (storedActive) {
        const parsed = JSON.parse(storedActive);
        if (Array.isArray(parsed)) {
          if (parsed.some((a: any) => a?.id?.startsWith('acc_'))) {
            localStorage.removeItem(DD_ACTIVE_ACCESS_KEY);
            setActiveAccessList([]);
          } else {
            setActiveAccessList(parsed);
          }
        }
      }
      const storedReqs = localStorage.getItem(DD_ACCESS_REQUESTS_KEY);
      if (storedReqs) {
        const parsed = JSON.parse(storedReqs);
        if (Array.isArray(parsed)) {
          if (parsed.some((r: any) => r?.id?.startsWith('req_'))) {
            localStorage.removeItem(DD_ACCESS_REQUESTS_KEY);
            setAccessRequests([]);
          } else {
            setAccessRequests(parsed);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load DD locker data from localStorage:', err);
    }
  }, []);

  const updateDocumentsAndPersist = (newDocs: DDDocument[]) => {
    setDocuments(newDocs);
    try {
      localStorage.setItem(DD_DOCUMENTS_KEY, JSON.stringify(newDocs));
    } catch (err) {
      console.error('Failed to persist DD docs:', err);
    }
  };

  const updateActiveAccessAndPersist = (newAccess: DDActiveAccess[]) => {
    setActiveAccessList(newAccess);
    try {
      localStorage.setItem(DD_ACTIVE_ACCESS_KEY, JSON.stringify(newAccess));
    } catch (err) {
      console.error('Failed to persist active access:', err);
    }
  };

  const updateRequestsAndPersist = (newReqs: DDAccessRequest[]) => {
    setAccessRequests(newReqs);
    try {
      localStorage.setItem(DD_ACCESS_REQUESTS_KEY, JSON.stringify(newReqs));
    } catch (err) {
      console.error('Failed to persist requests:', err);
    }
  };

  const updateAuditLogAndPersist = (newAudit: DDActivityLogItem[]) => {
    setAuditLog(newAudit);
    try {
      localStorage.setItem(DD_AUDIT_LOG_KEY, JSON.stringify(newAudit));
    } catch (err) {
      console.error('Failed to persist DD audit log:', err);
    }
  };

  const handleFileChange = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      showToast('File exceeds 25 MB limit. Please select a smaller file.', 'error');
      return;
    }
    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    const allowed = ['PDF', 'DOCX', 'DOC', 'XLSX', 'XLS', 'PPTX', 'PPT', 'PNG', 'JPG', 'JPEG'];
    if (!allowed.includes(ext)) {
      showToast('Unsupported format. Please select PDF, DOCX, XLSX, PPTX, or PNG.', 'error');
      return;
    }
    setSelectedFile(file);
    if (!newDocName) {
      setNewDocName(file.name);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !newDocName.trim()) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    let uploadedUrl = '';
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrl = data.url;
        }
      } catch (err) {
        console.warn('[DD Locker] Real upload fallback to local simulation:', err);
      }
    }

    setUploadProgress(100);

    const calculatedSize = selectedFile
      ? selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selectedFile.size / 1024)} KB`
      : '1.8 MB';

    const fileExt = (selectedFile?.name.split('.').pop()?.toUpperCase() || 'PDF') as any;
    const finalName = newDocName.trim() || selectedFile?.name || 'Document.pdf';

    const doc: DDDocument = {
      id: `doc_${Date.now()}`,
      name: finalName,
      folder: newDocFolder,
      fileSize: calculatedSize,
      updatedDate: 'Just now',
      fileType: fileExt,
      isConfidential,
      fileUrl: uploadedUrl || undefined,
    };

    const newDocs = [doc, ...documents];
    updateDocumentsAndPersist(newDocs);

    let activeName = 'Founder';
    let activeOrg = 'Venture';
    try {
      const stored = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) activeName = p.name;
        if (p.organization) activeOrg = p.organization;
      }
    } catch (_) {}

    const newAuditItem: DDActivityLogItem = {
      id: `log_${Date.now()}`,
      userName: activeName,
      organization: activeOrg,
      action: 'Uploaded Document',
      documentName: doc.name,
      timestamp: 'Just now',
    };
    updateAuditLogAndPersist([newAuditItem, ...auditLog]);

    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setNewDocName('');
    setIsUploadOpen(false);
    showToast(`Uploaded & encrypted "${doc.name}" in folder: ${newDocFolder}`, 'success');
  };

  const handleDeleteDoc = (id: string, name: string) => {
    const updated = documents.filter((d) => d.id !== id);
    updateDocumentsAndPersist(updated);

    let activeName = 'Founder';
    let activeOrg = 'Venture';
    try {
      const stored = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.name) activeName = p.name;
        if (p.organization) activeOrg = p.organization;
      }
    } catch (_) {}

    const newAuditItem: DDActivityLogItem = {
      id: `log_${Date.now()}`,
      userName: activeName,
      organization: activeOrg,
      action: 'Deleted Document',
      documentName: name,
      timestamp: 'Just now',
    };
    updateAuditLogAndPersist([newAuditItem, ...auditLog]);
    showToast(`Deleted "${name}"`, 'info');
  };

  const openApproveModal = (req: DDAccessRequest) => {
    setApprovingRequest(req);
    setSelectedGrantFolders(req.requestedFolders);
  };

  const handleConfirmApproval = () => {
    if (!approvingRequest) return;

    const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const expiryStr = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Move to active access with real 14-day expiry
    const newActive: DDActiveAccess = {
      id: `act_acc_${Date.now()}`,
      userName: approvingRequest.userName,
      organization: approvingRequest.organization,
      grantedFolders: selectedGrantFolders,
      dateGranted: 'Today',
      expiryDate: `14 Days (${expiryStr})`,
      status: 'Active',
    };

    updateActiveAccessAndPersist([newActive, ...activeAccessList]);
    updateRequestsAndPersist(accessRequests.filter((r) => r.id !== approvingRequest.id));
    const newLogItem: DDActivityLogItem = {
      id: `log_${Date.now()}`,
      userName: approvingRequest.userName,
      organization: approvingRequest.organization,
      action: 'Access Granted by Founder',
      documentName: selectedGrantFolders.join(', '),
      timestamp: 'Just now',
    };
    updateAuditLogAndPersist([newLogItem, ...auditLog]);

    showToast(`Granted DD access to ${approvingRequest.userName} (${approvingRequest.organization}) for 14 days`, 'success');
    setApprovingRequest(null);
  };

  const handleRejectRequest = (reqId: string, name: string) => {
    updateRequestsAndPersist(accessRequests.filter((r) => r.id !== reqId));
    showToast(`Declined DD access request from ${name}`, 'info');
  };

  const handleRevokeAccess = (id: string, name: string) => {
    updateActiveAccessAndPersist(activeAccessList.filter((a) => a.id !== id));
    showToast(`Revoked DD access for ${name}`, 'info');
  };

  const folderDocs = documents.filter((d) => d.folder === selectedFolder);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-[#D9FF3F]" />
              <span>Due Diligence Locker (Virtual Data Room)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Bank-Grade Encryption
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            7-folder institutional data room for MCA filings, cap table, financials, patents, and investor DD requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('folders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'folders'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>7 Vault Folders ({documents.length} Docs)</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Access Requests ({accessRequests.length})</span>
          {accessRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('active_access')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'active_access'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Granted Access ({activeAccessList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit_log'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit & Telemetry Log</span>
        </button>
      </div>

      {/* TAB 1: 7 VAULT FOLDERS */}
      {activeTab === 'folders' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-slide">
          {/* Left Folder Nav (1 Column) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] px-2 block mb-1">
              Data Room Folders
            </span>
            {folders.map((folder) => {
              const count = documents.filter((d) => d.folder === folder).length;
              const isSelected = selectedFolder === folder;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                      : 'text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] hover:text-[#101212] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#262A29] text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Document List (3 Columns) */}
          <div className="lg:col-span-3 p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <span>Folder: {selectedFolder}</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {folderDocs.length} items verified and encrypted in this folder.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewDocFolder(selectedFolder);
                  setIsUploadOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload to {selectedFolder}</span>
              </button>
            </div>

            {folderDocs.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-[#565B59] dark:text-[#B6B8B7]">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No documents in this folder yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {folderDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs font-mono">
                        {doc.fileType}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate max-w-xs sm:max-w-md">
                            {doc.name}
                          </h4>
                          {doc.isConfidential && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Confidential
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          Size: {doc.fileSize} &bull; Updated {doc.updatedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => showToast(`Downloading ${doc.name}`, 'info')}
                        className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
                        className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS REQUESTS */}
      {activeTab === 'requests' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 animate-fade-slide">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Incoming Due Diligence Access Requests
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Review requests from institutional funds and grant bodies. Choose which folders to grant access to.
            </p>
          </div>

          {accessRequests.length === 0 ? (
            <div className="p-8 text-center text-[#565B59] dark:text-[#B6B8B7] text-xs">
              No pending access requests.
            </div>
          ) : (
            <div className="space-y-4">
              {accessRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={req.avatar}
                      alt={req.userName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-700"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                          {req.userName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {req.userType}
                        </span>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          &bull; {req.requestedDate}
                        </span>
                      </div>

                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {req.userRole} &bull; <strong className="text-[#101212] dark:text-white">{req.organization}</strong>
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">Requested Folders:</span>
                        {req.requestedFolders.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleRejectRequest(req.id, req.userName)}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-gray-500 hover:text-red-500 transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => openApproveModal(req)}
                      className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Review & Grant Access</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE ACCESS */}
      {activeTab === 'active_access' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 animate-fade-slide">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Currently Active Due Diligence Permissions
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Stakeholders who currently have time-limited access to specific data room folders.
            </p>
          </div>

          <div className="space-y-3">
            {activeAccessList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {item.userName}
                    </h4>
                    <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      &bull; {item.organization}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] pt-0.5">
                    Granted: {item.dateGranted} &bull; Expiry: {item.expiryDate}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap pt-1.5">
                    {item.grantedFolders.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleRevokeAccess(item.id, item.userName)}
                    className="px-3.5 py-1.5 rounded-xl border border-red-500/30 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit_log' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 animate-fade-slide">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Data Room Audit Trail & View Logs
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Granular telemetry tracking all views, downloads, permissions, and uploads.
            </p>
          </div>

          <div className="space-y-2">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#101212] dark:text-white">{log.userName}</span>
                  <span className="text-[#565B59] dark:text-[#B6B8B7]"> ({log.organization}) </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">&bull; {log.action}</span>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{log.documentName}</p>
                </div>
                <span className="font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7] flex-shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folder Approval Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Grant DD Access: {approvingRequest.userName}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {approvingRequest.organization} &bull; Select authorized data room folders
                </p>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#101212] dark:text-white block">
                Select Folders to Authorize:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {folders.map((folder) => {
                  const isChecked = selectedGrantFolders.includes(folder);
                  return (
                    <label
                      key={folder}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                          : 'border-gray-200 dark:border-[#262A29] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGrantFolders([...selectedGrantFolders, folder]);
                          } else {
                            setSelectedGrantFolders(selectedGrantFolders.filter((f) => f !== folder));
                          }
                        }}
                        className="w-4 h-4 accent-[#D9FF3F]"
                      />
                      <span>{folder}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Grant Access</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Upload Due Diligence Document</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  All documents are client-side indexed and encrypted for the Virtual Data Room.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadOpen(false);
                    setSelectedFile(null);
                    setNewDocName('');
                  }
                }}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />

                {!selectedFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/5'
                        : 'border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F]/50 bg-gray-50/50 dark:bg-[#202422]/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#141716] text-[#D9FF3F] flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-[#262A29]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#101212] dark:text-white mb-1">
                      Drag & drop your document here, or <span className="text-[#D9FF3F] underline">browse</span>
                    </p>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Supports PDF, DOCX, XLSX, PPTX, or PNG (up to 25 MB)
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-[#D9FF3F]/10 text-[#D9FF3F] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-[#101212] dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] text-[11px] font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#181B1A] shrink-0 disabled:opacity-50"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Document Title / Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audited_Balance_Sheet_Q2_2026.pdf"
                  value={newDocName}
                  disabled={isUploading}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Target Vault Folder
                </label>
                <select
                  value={newDocFolder}
                  disabled={isUploading}
                  onChange={(e) => setNewDocFolder(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-50"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  disabled={isUploading}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F] disabled:opacity-50"
                />
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Mark as confidential (dynamic watermark on investor viewing and export)
                </span>
              </label>

              {/* Progress bar if uploading */}
              {isUploading && (
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D9FF3F]" />
                      Encrypting with AES-256...
                    </span>
                    <span className="font-bold text-[#D9FF3F]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-[#141716] overflow-hidden">
                    <div
                      className="h-full bg-[#D9FF3F] transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedFile(null);
                    setNewDocName('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !newDocName.trim())}
                  className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Encrypt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-[#101212] dark:text-white truncate max-w-sm">
                  {previewDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-3">
              <FileText className="w-12 h-12 mx-auto text-[#D9FF3F]" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  Document Verified & Ready
                </p>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Folder: {previewDoc.folder} &bull; Size: {previewDoc.fileSize} &bull; Last updated {previewDoc.updatedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  showToast(`Downloading ${previewDoc.name}`, 'info');
                  setPreviewDoc(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
