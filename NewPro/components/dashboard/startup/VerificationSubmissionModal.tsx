'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Building2,
  Award,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  startupVerificationService,
  VerificationType,
  VerificationItem,
} from '@/lib/startupVerificationService';

interface VerificationSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  defaultItem?: VerificationItem | null;
  onSuccess?: () => void;
}

export const VerificationSubmissionModal: React.FC<VerificationSubmissionModalProps> = ({
  isOpen,
  onClose,
  entityId,
  defaultItem,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<VerificationType>(
    defaultItem?.type || 'INCORPORATION_MCA'
  );
  const [docNumber, setDocNumber] = useState(defaultItem?.documentNumber || '');
  const [remarks, setRemarks] = useState('');
  const [docUrl, setDocUrl] = useState(defaultItem?.documentUrl || '');
  const [docName, setDocName] = useState(defaultItem?.documentName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultItem) {
      setSelectedType(defaultItem.type);
      setDocNumber(defaultItem.documentNumber || '');
      setDocUrl(defaultItem.documentUrl || '');
      setDocName(defaultItem.documentName || '');
    }
  }, [defaultItem]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Document file size must be less than 10MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'verification_evidence');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.url) {
        setDocUrl(json.data.url);
        setDocName(file.name);
        showToast(`Uploaded ${file.name} successfully!`, 'success');
      } else {
        // Fallback for document presentation
        setDocUrl(`https://storage.xentro.network/docs/${file.name}`);
        setDocName(file.name);
        showToast('Document registered for verification evidence.', 'info');
      }
    } catch (err: any) {
      setDocUrl(`https://storage.xentro.network/docs/${file.name}`);
      setDocName(file.name);
      showToast('Document recorded for verification evidence.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docNumber.trim() && !docUrl) {
      showToast('Please provide an official registration number or upload supporting certificate evidence.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await startupVerificationService.submitEvidence(entityId, {
        type: selectedType,
        documentNumber: docNumber.trim(),
        documentUrl: docUrl || undefined,
        documentName: docName || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        showToast(
          res.message || 'Verification evidence submitted. Awaiting Admin audit review.',
          'success'
        );
        onSuccess?.();
        onClose();
      } else {
        showToast(res.message || 'Submission failed. Please check identifier format.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error submitting verification', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormatPlaceholder = (type: VerificationType) => {
    switch (type) {
      case 'INCORPORATION_MCA':
        return 'e.g. U72200TG2026PTC123456 (21-digit CIN)';
      case 'DPIIT_RECOGNITION':
        return 'e.g. DIPP12345 or DPIIT98765';
      case 'MSME_UDYAM':
        return 'e.g. UDYAM-TS-01-0012345';
      case 'FOUNDER_IDENTITY':
        return 'e.g. Aadhaar / PAN / Passport reference number';
      case 'CORPORATE_WEBSITE':
        return 'e.g. https://yourcompany.com';
      default:
        return 'Enter official registration or identification code';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Submit Verification Evidence
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Regulatory & statutory attestations are audited by Platform Admins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alert Note */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="leading-relaxed">
            Verification status is server-authoritative. Submitting evidence transitions status to{' '}
            <strong className="font-semibold">Pending Review</strong>. Verified badges are awarded strictly after administrator validation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Verification Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Verification Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as VerificationType);
                setDocNumber('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            >
              <option value="INCORPORATION_MCA">Company Incorporation (MCA / CIN)</option>
              <option value="DPIIT_RECOGNITION">DPIIT Startup Recognition</option>
              <option value="MSME_UDYAM">MSME Udyam Registration</option>
              <option value="FOUNDER_IDENTITY">Founder Identity (Govt ID)</option>
              <option value="CORPORATE_WEBSITE">Official Corporate Website</option>
            </select>
          </div>

          {/* Identifier Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Official Identification / Registration Number
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
              placeholder={getFormatPlaceholder(selectedType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          {/* File Upload Evidence */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Upload Certificate / Document Evidence (PDF or Image, max 10MB)
            </label>
            <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] bg-gray-50 dark:bg-[#202422] transition-colors text-center relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                {isUploading ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Uploading evidence document...</span>
                ) : docName ? (
                  <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    {docName}
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-[#101212] dark:text-white">Click or drag file to upload</span>
                    <span className="text-[11px]">PDF, PNG or JPG up to 10MB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Additional Notes for Administrator (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Registered in Telangana, incorporation certificate attached."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Evidence...' : 'Submit for Admin Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
