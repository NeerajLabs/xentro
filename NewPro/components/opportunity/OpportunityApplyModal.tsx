'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Upload,
  FileText,
  AlertCircle,
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Opportunity, OpportunityApplicant } from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

interface OpportunityApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onSuccess?: (applicant: OpportunityApplicant) => void;
}

export const OpportunityApplyModal: React.FC<OpportunityApplyModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [applicantName, setApplicantName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [organizationName, setOrganizationName] = useState(profile.organization || '');
  const [location, setLocation] = useState(profile.location || 'India');
  const [applicantType, setApplicantType] = useState<string>(
    profile.role === 'startup' ? 'Startup' : profile.role === 'mentor' ? 'Mentor' : 'Founder'
  );
  const [proposalPitch, setProposalPitch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [customDocLink, setCustomDocLink] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    setApplicantName(p.name || '');
    setEmail(p.email || '');
    setOrganizationName(p.organization || '');
    setLocation(p.location || 'India');
    if (opportunity.applicationRequirements && opportunity.applicationRequirements.length > 0) {
      setSelectedDocs(opportunity.applicationRequirements.slice(0, 2));
    }
  }, [opportunity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleDoc = (doc: string) => {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicantName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!proposalPitch.trim()) {
      showToast('Please include a brief proposal or pitch', 'error');
      return;
    }
    if (!agreedToTerms) {
      showToast('Please verify and accept the submission declaration', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const allDocs = [...selectedDocs];
      if (customDocLink.trim()) {
        allDocs.push(`Link: ${customDocLink.trim()}`);
      }

      const created = opportunityService.applyToOpportunity(opportunity.id, {
        applicantId: profile.id,
        applicantName,
        applicantAvatar: profile.avatar,
        applicantType,
        organizationName,
        email,
        phone,
        location,
        proposalPitch,
        submittedDocuments: allDocs,
      });

      showToast(`Application submitted successfully for ${opportunity.title}!`, 'success');
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to submit application', err);
      showToast('Could not submit application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredRequirements = opportunity.applicationRequirements || [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative m-auto bg-white dark:bg-[#181B1A] w-full max-w-2xl rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] h-[90vh] max-h-[850px] flex flex-col overflow-hidden animate-fade-slide">
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-start justify-between gap-4 bg-gray-50/50 dark:bg-[#202422]/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                {opportunity.category}
              </span>
              {opportunity.subcategory && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#262A29] text-[#6E7370] dark:text-[#8E9390]">
                  {opportunity.subcategory}
                </span>
              )}
              {opportunity.sourceType === 'government' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Official Scheme
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#101212] dark:text-white font-heading">
              Apply: {opportunity.title}
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#8E9390] mt-0.5">
              Issued by <span className="font-semibold text-[#101212] dark:text-white">{opportunity.externalOrganization?.name || opportunity.publisherOrgName || opportunity.publisherName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#6E7370] dark:text-[#8E9390] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-xs">
          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p className="leading-relaxed">
              Your verified Xentro credentials and profile will be bundled with this submission. The publisher will review and notify you through your Xentro dashboard.
            </p>
          </div>

          {/* Applicant Credentials */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
              1. Applicant & Entity Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Applicant Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Applicant Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={applicantType}
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                >
                  <option value="Startup">Startup</option>
                  <option value="Founder">Founder</option>
                  <option value="Individual">Individual</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Investor">Investor</option>
                  <option value="Student">Student</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Registered Company">Registered Company</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Acme Tech Pvt Ltd"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#101212] dark:text-white mb-1">
                  Current City & Country
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Proposal / Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-[#101212] dark:text-white">
                2. Proposal, Venture Pitch & Eligibility Fit <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-[#8E9390]">
                {proposalPitch.length} characters
              </span>
            </div>
            <textarea
              rows={5}
              value={proposalPitch}
              onChange={(e) => setProposalPitch(e.target.value)}
              required
              placeholder="Detail your venture/solution, current stage, why you are applying, how this opportunity accelerates your roadmap, and compliance with the stated eligibility requirements..."
              className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] focus:border-[#D9FF3F] outline-hidden leading-relaxed resize-none"
            />
          </div>

          {/* Required Documents Checklist */}
          {requiredRequirements.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold text-[#101212] dark:text-white">
                3. Attached Documents & Certificates
              </label>
              <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                Select the documents available in your verified vault that will be shared with the review committee:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requiredRequirements.map((req) => {
                  const isChecked = selectedDocs.includes(req);
                  return (
                    <button
                      type="button"
                      key={req}
                      onClick={() => toggleDoc(req)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-white font-semibold'
                          : 'border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#202422] text-[#6E7370] dark:text-[#8E9390]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-[#8E9390]" />
                        <span className="truncate">{req}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-[#D9FF3F] border-[#D9FF3F] text-[#101212]'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* External Links / Deck URL */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[#101212] dark:text-white">
              Pitch Deck or Product Demo Link (Optional)
            </label>
            <input
              type="url"
              value={customDocLink}
              onChange={(e) => setCustomDocLink(e.target.value)}
              placeholder="https://drive.google.com/... or https://youtube.com/..."
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded text-[#D9FF3F] focus:ring-[#D9FF3F]"
              />
              <span className="text-[11px] text-[#565B59] dark:text-[#8E9390] leading-snug">
                I hereby declare that all provided statements, documents, and credentials are true and complete. I authorize <strong className="text-[#101212] dark:text-white">{opportunity.externalOrganization?.name || opportunity.publisherOrgName || opportunity.publisherName}</strong> and Xentro to verify my eligibility.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="shrink-0 flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-[#6E7370] dark:text-[#8E9390] hover:bg-black/5 dark:hover:bg-[#202422] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
