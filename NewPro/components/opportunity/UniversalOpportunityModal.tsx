'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Save,
  Building2,
  Globe,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Eye,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Tag,
  Briefcase,
  Users,
  MapPin,
  Lock,
  Radio,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  Opportunity,
  OpportunityCategory,
  OPPORTUNITY_CATEGORIES,
  CATEGORY_SUBCATEGORIES_MAP,
  TargetUserType,
  TARGET_USER_OPTIONS,
  OpportunitySourceType,
  OPPORTUNITY_SOURCE_OPTIONS,
  EXTERNAL_ORG_TYPES,
  ExternalOrgType,
  APPLICANT_TYPES,
  ApplicantType,
  STARTUP_STAGES,
  SECTOR_OPTIONS,
  REGISTRATION_REQUIREMENTS,
  BENEFIT_CATEGORIES,
  APPLICATION_REQUIREMENTS_OPTIONS,
  ApplicationStep,
  ImportantDate,
  OpportunityLink,
  CustomEligibilityCriterion,
} from '@/types/opportunity';
import { opportunityService } from '@/lib/opportunityService';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { getAdminSession } from '@/lib/adminAuth';
import { AdminSession } from '@/types/admin';

interface UniversalOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdOpp: Opportunity) => void;
  initialOpportunity?: Partial<Opportunity>;
  isEditMode?: boolean;
  adminMode?: boolean;
}

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
];

export const UniversalOpportunityModal: React.FC<UniversalOpportunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialOpportunity,
  isEditMode = false,
  adminMode = false,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [adminSession, setAdminSession] = useState<AdminSession | null>(getAdminSession());
  const [lastSavedDraftTime, setLastSavedDraftTime] = useState<string | null>(null);

  // Publisher details
  const publisherId = adminMode
    ? adminSession?.employeeId || 'admin_op'
    : userProfile.id;
  const publisherType = adminMode
    ? 'Xentro Admin'
    : userProfile.role === 'startup' || userProfile.role === 'esp'
    ? 'Entity Account'
    : 'Personal Account';
  const publisherName = adminMode
    ? `${adminSession?.name || 'Admin Officer'} (#${adminSession?.employeeId || '9922953'})`
    : userProfile.name;
  const publisherOrg = adminMode ? 'Xentro Operational Control Plane' : userProfile.organization;
  const publisherRoleTitle = adminMode ? 'Super Administrator' : userProfile.roleTitle;

  // STEP 1 State
  const [targetUserTypes, setTargetUserTypes] = useState<string[]>(['startup']);
  const [sourceType, setSourceType] = useState<OpportunitySourceType>('my_account');
  const [extOrgName, setExtOrgName] = useState('');
  const [extOrgLogo, setExtOrgLogo] = useState('');
  const [extOrgType, setExtOrgType] = useState<ExternalOrgType>('Central Government');
  const [extOrgOwnership, setExtOrgOwnership] = useState<'government' | 'private'>('government');
  const [extCountry, setExtCountry] = useState('India');
  const [extState, setExtState] = useState('');
  const [extCity, setExtCity] = useState('');
  const [extWebsite, setExtWebsite] = useState('');
  const [extOfficialOppUrl, setExtOfficialOppUrl] = useState('');

  // STEP 2 State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OpportunityCategory>('Grant');
  const [subcategory, setSubcategory] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [objective, setObjective] = useState('');

  // STEP 3 State
  const [applicantTypes, setApplicantTypes] = useState<string[]>(['Startup', 'Founder']);
  const [industries, setIndustries] = useState<string[]>(['DeepTech', 'Enterprise AI']);
  const [customSectorInput, setCustomSectorInput] = useState('');
  const [startupStages, setStartupStages] = useState<string[]>(['Idea', 'Prototype', 'MVP']);
  const [geoScope, setGeoScope] = useState<'Global' | 'Country' | 'State' | 'City' | 'Specific Region'>('National' as any);
  const [geoCountry, setGeoCountry] = useState('India');
  const [geoState, setGeoState] = useState('');
  const [geoCity, setGeoCity] = useState('');
  const [geoRegionDetails, setGeoRegionDetails] = useState('');
  const [regRequirements, setRegRequirements] = useState<string[]>(['Incorporation Required']);
  const [customCriteria, setCustomCriteria] = useState<CustomEligibilityCriterion[]>([]);

  // STEP 4 State
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['Grant', 'Mentorship']);
  const [customBenefitInput, setCustomBenefitInput] = useState('');
  const [financialType, setFinancialType] = useState('Grant');
  const [amountType, setAmountType] = useState<'Fixed Amount' | 'Range' | 'Not Disclosed'>('Range');
  const [fixedAmount, setFixedAmount] = useState<string>('2500000');
  const [minAmount, setMinAmount] = useState<string>('1500000');
  const [maxAmount, setMaxAmount] = useState<string>('3000000');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP' | 'Other'>('INR');
  const [equityType, setEquityType] = useState<'No Equity' | 'Equity Required' | 'Not Applicable'>('No Equity');
  const [minEquity, setMinEquity] = useState<string>('0');
  const [maxEquity, setMaxEquity] = useState<string>('0');
  const [additionalFinancialTerms, setAdditionalFinancialTerms] = useState('');

  // STEP 5 State
  const [participationMode, setParticipationMode] = useState<'Online' | 'Offline' | 'Hybrid'>('Online');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueState, setVenueState] = useState('');
  const [venueCountry, setVenueCountry] = useState('India');
  const [opportunityScope, setOpportunityScope] = useState<'Local' | 'State' | 'National' | 'International' | 'Global'>('National');
  const [applicationMethod, setApplicationMethod] = useState<
    | 'Apply Through Xentro'
    | 'External Application'
    | 'Contact Publisher'
    | 'Registration Only'
    | 'Invite Only'
    | 'No Application Required'
  >('Apply Through Xentro');
  const [externalAppUrl, setExternalAppUrl] = useState('');
  const [contactType, setContactType] = useState<'xentro' | 'email' | 'phone'>('xentro');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [applicationSteps, setApplicationSteps] = useState<ApplicationStep[]>([
    { stepNumber: 1, title: 'Submit Initial Application', description: 'Fill out executive summary and submit verified deck.' },
    { stepNumber: 2, title: 'Evaluation & Screening', description: 'Internal committee reviews technical and financial feasibility.' },
    { stepNumber: 3, title: 'Final Pitch / Award', description: 'Shortlisted applicants receive grant or admission letter.' },
  ]);
  const [appRequirements, setAppRequirements] = useState<string[]>([
    'Startup Profile',
    'Pitch Deck',
    'Incorporation Certificate',
  ]);
  const [customReqInput, setCustomReqInput] = useState('');

  // STEP 6 State
  const [applicationsOpen, setApplicationsOpen] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [applicationDeadline, setApplicationDeadline] = useState('2026-06-30');
  const [rollingApplications, setRollingApplications] = useState(false);
  const [opportunityStartDate, setOpportunityStartDate] = useState('2026-07-01');
  const [opportunityEndDate, setOpportunityEndDate] = useState('2026-12-31');
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [frequency, setFrequency] = useState<
    'One-Time' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Rolling' | 'Recurring' | 'Other'
  >('Annual');
  const [recurrenceDetails, setRecurrenceDetails] = useState('');
  const [capacityType, setCapacityType] = useState<'Limited' | 'Unlimited' | 'Invite Only'>('Limited');
  const [availableSlots, setAvailableSlots] = useState<number>(30);
  const [slotLabel, setSlotLabel] = useState('Startup Slots');

  // STEP 7 State
  const [coverImage, setCoverImage] = useState(PRESET_BANNERS[0]);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState('');
  const [links, setLinks] = useState<OpportunityLink[]>([
    { id: 'l1', label: 'Program Guidelines', url: 'https://xentro.com/guidelines' },
  ]);

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size should be less than 10MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCoverImage(event.target.result);
        showToast('Cover image uploaded successfully', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // STEP 8 State
  const [visibilityScope, setVisibilityScope] = useState<
    'Selected User Types Only' | 'All Xentro Users' | 'Connections Only' | 'Invite Only'
  >('Selected User Types Only');

  // STEP 9 Admin Verification State
  const [verSourceUrl, setVerSourceUrl] = useState('');
  const [verAppUrl, setVerAppUrl] = useState('');
  const [verPubDate, setVerPubDate] = useState(new Date().toISOString().split('T')[0]);
  const [verStatus, setVerStatus] = useState<'Official' | 'Verified' | 'Needs Review' | 'Expired'>('Official');

  // Pre-load from draft or initialOpportunity
  useEffect(() => {
    if (initialOpportunity) {
      if (initialOpportunity.title) setTitle(initialOpportunity.title);
      if (initialOpportunity.category) setCategory(initialOpportunity.category as any);
      if (initialOpportunity.subcategory) setSubcategory(initialOpportunity.subcategory);
      if (initialOpportunity.shortDescription) setShortDescription(initialOpportunity.shortDescription);
      if (initialOpportunity.fullDescription) setFullDescription(initialOpportunity.fullDescription);
      if (initialOpportunity.targetUserTypes) setTargetUserTypes(initialOpportunity.targetUserTypes);
      if (initialOpportunity.sourceType) setSourceType(initialOpportunity.sourceType);
      if (initialOpportunity.applicantTypes) setApplicantTypes(initialOpportunity.applicantTypes);
      if (initialOpportunity.industries) setIndustries(initialOpportunity.industries);
      if (initialOpportunity.coverImage) setCoverImage(initialOpportunity.coverImage);
      if (initialOpportunity.applicationMethod) setApplicationMethod(initialOpportunity.applicationMethod);
      if (initialOpportunity.applicationDeadline) setApplicationDeadline(initialOpportunity.applicationDeadline);
      if (initialOpportunity.rollingApplications !== undefined) setRollingApplications(initialOpportunity.rollingApplications);
      if (initialOpportunity.benefits) setSelectedBenefits(initialOpportunity.benefits);
      if (initialOpportunity.externalOrganization) {
        setExtOrgName(initialOpportunity.externalOrganization.name || '');
        setExtOrgType((initialOpportunity.externalOrganization.organizationType as any) || 'Central Government');
        setExtWebsite(initialOpportunity.externalOrganization.website || '');
        setExtOfficialOppUrl(initialOpportunity.externalOrganization.officialOpportunityUrl || '');
      }
    } else {
      // Check for saved draft
      const draft = opportunityService.getDraft(publisherId);
      if (draft && !isEditMode) {
        setTitle(draft.title || '');
        if (draft.category) setCategory(draft.category as any);
        if (draft.shortDescription) setShortDescription(draft.shortDescription || '');
        if (draft.targetUserTypes) setTargetUserTypes(draft.targetUserTypes);
        setLastSavedDraftTime('Loaded saved draft');
      }
    }
  }, [initialOpportunity, publisherId, isEditMode]);

  // Keep subcategory updated if category changes
  useEffect(() => {
    const subs = CATEGORY_SUBCATEGORIES_MAP[category] || [];
    if (subs.length > 0 && (!subcategory || !subs.includes(subcategory))) {
      setSubcategory(subs[0]);
    }
  }, [category, subcategory]);

  // Enforce my_account source for standard accounts (Admin only access for external/government/corporate)
  useEffect(() => {
    if (!adminMode && sourceType !== 'my_account') {
      setSourceType('my_account');
    }
  }, [adminMode, sourceType]);

  // Target User Types selection handler
  const handleToggleTargetUser = (id: TargetUserType) => {
    if (id === 'all') {
      if (targetUserTypes.includes('all')) {
        setTargetUserTypes([]);
      } else {
        setTargetUserTypes(['all']);
      }
      return;
    }

    if (targetUserTypes.includes('all')) {
      // Seamlessly switch from 'all' to the clicked persona
      setTargetUserTypes([id]);
      return;
    }

    if (targetUserTypes.includes(id)) {
      setTargetUserTypes(targetUserTypes.filter((t) => t !== id));
    } else {
      setTargetUserTypes([...targetUserTypes, id]);
    }
  };

  const handleClearTargetUsers = () => {
    setTargetUserTypes([]);
  };

  // Check if financial details are required
  const hasFinancialBenefit =
    category === 'Investment' ||
    category === 'Funding' ||
    category === 'Grant' ||
    selectedBenefits.some((b) =>
      ['Grant', 'Investment', 'Prize Money', 'Stipend', 'Sponsorship', 'Credits'].includes(b)
    );

  // Save Draft Handler
  const handleSaveDraft = () => {
    const draftOpp: Opportunity = {
      id: initialOpportunity?.id || `opp_draft_${Date.now()}`,
      publisherAccountId: publisherId,
      publisherType: publisherType as any,
      publisherName,
      publisherRoleTitle,
      publisherOrgName: publisherOrg,
      publisherAvatar: userProfile.avatar,
      publisherVerified: true,
      targetUserTypes,
      visibilityScope,
      sourceType,
      title: title.trim() || 'Untitled Draft Opportunity',
      category,
      subcategory,
      shortDescription: shortDescription.trim() || 'Draft description...',
      fullDescription: fullDescription.trim() || 'Draft detailed description...',
      objective: objective.trim() || undefined,
      applicantTypes,
      industries,
      startupStages,
      benefits: selectedBenefits,
      applicationMethod,
      applicationDeadline: rollingApplications ? undefined : applicationDeadline,
      rollingApplications,
      participationMode,
      opportunityStartDate,
      opportunityEndDate,
      importantDates,
      coverImage,
      logo: logo || undefined,
      links,
      status: 'draft',
      createdAt: initialOpportunity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicantsCount: initialOpportunity?.applicantsCount || 0,
    };
    opportunityService.saveOpportunity(draftOpp);
    opportunityService.saveDraft(publisherId, draftOpp);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedDraftTime(timeStr);
    showToast(`Draft saved successfully at ${timeStr}`, 'success');
  };

  // Validation before advancing steps
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (targetUserTypes.length === 0) {
        showToast('Please select who this opportunity is for', 'error');
        return false;
      }
      if (sourceType !== 'my_account' && !extOrgName.trim()) {
        showToast('Please enter the organization name conducting this opportunity', 'error');
        return false;
      }
    } else if (step === 2) {
      if (!title.trim()) {
        showToast('Opportunity Title is mandatory', 'error');
        return false;
      }
      if (!shortDescription.trim()) {
        showToast('Short Description is mandatory (used for cards)', 'error');
        return false;
      }
      if (!fullDescription.trim()) {
        showToast('Full Description is mandatory', 'error');
        return false;
      }
    } else if (step === 3) {
      if (applicantTypes.length === 0) {
        showToast('Please select at least one eligible applicant type', 'error');
        return false;
      }
      if (industries.length === 0) {
        showToast('Please specify at least one industry sector', 'error');
        return false;
      }
    } else if (step === 5) {
      if (applicationMethod === 'External Application' && !externalAppUrl.trim()) {
        showToast('Please provide the external application URL', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 9));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Publish Handler
  const handlePublish = () => {
    if (!title.trim() || !shortDescription.trim() || !fullDescription.trim()) {
      showToast('Please fill out all mandatory fields before publishing', 'error');
      setCurrentStep(2);
      return;
    }

    const newOpp: Opportunity = {
      id: initialOpportunity?.id || `opp_${Date.now()}`,
      publisherAccountId: publisherId,
      publisherType: publisherType as any,
      publisherName,
      publisherRoleTitle,
      publisherOrgName: publisherOrg,
      publisherAvatar: userProfile.avatar,
      publisherVerified: true,

      targetUserTypes,
      visibilityScope,
      sourceType,
      externalOrganization:
        sourceType !== 'my_account'
          ? {
              name: extOrgName.trim(),
              logo: extOrgLogo.trim() || undefined,
              organizationType: extOrgType,
              ownershipType: extOrgOwnership,
              country: extCountry,
              state: extState,
              city: extCity,
              website: extWebsite.trim() || undefined,
              officialOpportunityUrl: extOfficialOppUrl.trim() || undefined,
            }
          : undefined,

      title: title.trim(),
      category,
      subcategory,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      objective: objective.trim() || undefined,

      applicantTypes,
      industries,
      startupStages:
        applicantTypes.includes('Startup') || applicantTypes.includes('Founder')
          ? startupStages
          : undefined,

      geographicEligibility: {
        scope: geoScope,
        country: geoCountry,
        state: geoState,
        city: geoCity,
        regionDetails: geoRegionDetails,
      },
      registrationRequirements: regRequirements,
      customEligibility: customCriteria,

      benefits: selectedBenefits,
      financialDetails: hasFinancialBenefit
        ? {
            type: financialType,
            amountType,
            amount: amountType === 'Fixed Amount' ? parseFloat(fixedAmount) || 0 : undefined,
            minimumAmount: amountType === 'Range' ? parseFloat(minAmount) || 0 : undefined,
            maximumAmount: amountType === 'Range' ? parseFloat(maxAmount) || 0 : undefined,
            currency,
            equityType,
            minimumEquity: equityType === 'Equity Required' ? parseFloat(minEquity) || 0 : undefined,
            maximumEquity: equityType === 'Equity Required' ? parseFloat(maxEquity) || 0 : undefined,
            additionalTerms: additionalFinancialTerms.trim() || undefined,
          }
        : undefined,

      participationMode,
      venue:
        participationMode !== 'Online'
          ? {
              venueName,
              address: venueAddress,
              city: venueCity,
              state: venueState,
              country: venueCountry,
            }
          : undefined,
      opportunityScope,

      applicationMethod,
      applicationUrl: applicationMethod === 'External Application' ? externalAppUrl.trim() : undefined,
      contact:
        applicationMethod === 'Contact Publisher'
          ? {
              type: contactType,
              email: contactEmail,
              phone: contactPhone,
              contactName: publisherName,
            }
          : undefined,

      acceptApplicationsThroughXentro: applicationMethod === 'Apply Through Xentro',
      applicationSteps,
      applicationRequirements: appRequirements,

      applicationsOpen,
      applicationDeadline: rollingApplications ? undefined : applicationDeadline,
      rollingApplications,
      opportunityStartDate,
      opportunityEndDate,
      importantDates,

      frequency,
      recurrenceDetails: frequency === 'Recurring' ? recurrenceDetails : undefined,

      capacityType,
      availableSlots: capacityType === 'Limited' ? availableSlots : undefined,
      slotLabel: capacityType === 'Limited' ? slotLabel : undefined,

      coverImage,
      logo: logo || undefined,
      links,

      verification:
        adminMode || sourceType !== 'my_account'
          ? {
              officialSourceUrl: verSourceUrl.trim() || extWebsite.trim(),
              officialApplicationUrl: verAppUrl.trim() || extOfficialOppUrl.trim(),
              sourcePublicationDate: verPubDate,
              lastVerifiedDate: new Date().toISOString().split('T')[0],
              verifiedBy: `${publisherName} (${publisherType})`,
              status: verStatus,
            }
          : undefined,

      status: 'open',
      createdAt: initialOpportunity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicantsCount: initialOpportunity?.applicantsCount || 0,
    };

    const saved = opportunityService.saveOpportunity(newOpp);
    opportunityService.clearDraft(publisherId);
    showToast(`Opportunity "${saved.title}" published to Xentro ecosystem!`, 'success');

    if (onSuccess) {
      onSuccess(saved);
    }
    onClose();
  };

  if (!isOpen) return null;

  const STEPS = [
    { num: 1, title: 'Audience & Source' },
    { num: 2, title: 'Basic Details' },
    { num: 3, title: 'Eligibility' },
    { num: 4, title: 'Benefits & Financials' },
    { num: 5, title: 'Application Details' },
    { num: 6, title: 'Dates & Availability' },
    { num: 7, title: 'Media & Links' },
    { num: 8, title: 'Visibility' },
    { num: 9, title: 'Preview & Publish' },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in"
    >
      <div className="relative m-auto w-full max-w-4xl h-[90vh] max-h-[850px] bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* TOP BAR: Header, Step Indicator, Save Draft, Close */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white leading-tight">
                  {isEditMode ? 'Edit Opportunity' : 'Universal Opportunity Creator'}
                </h2>
                {adminMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Admin Portal Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                Step {currentStep} of 9 &bull;{' '}
                <span className="font-semibold text-[#101212] dark:text-white">
                  {STEPS[currentStep - 1].title}
                </span>
                {lastSavedDraftTime && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                    &bull; Draft saved {lastSavedDraftTime}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Save draft progress locally"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-[#D9FF3F]" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29] transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEPPER PROGRESS STRIP */}
        <div className="shrink-0 px-4 py-2.5 bg-white dark:bg-[#181B1A] border-b border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {STEPS.map((s) => {
              const isCurrent = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < currentStep || validateStep(currentStep)) {
                      setCurrentStep(s.num);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    isCurrent
                      ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#A0A4A2]'
                    }`}
                  >
                    {isDone ? <Check className="w-2.5 h-2.5" /> : s.num}
                  </span>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE STEP FORM BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ================= STEP 1: AUDIENCE & SOURCE ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              {/* A. Publisher Information */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                    A. Publisher Identity (Auto-Populated)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Publisher
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Publisher Name</span>
                    <span className="font-bold text-[#101212] dark:text-white">{publisherName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Publisher Type</span>
                    <span className="font-semibold text-emerald-700 dark:text-[#D9FF3F]">{publisherType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Organization</span>
                    <span className="font-medium text-[#101212] dark:text-white truncate block">{publisherOrg}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Role / Designation</span>
                    <span className="font-medium text-[#101212] dark:text-white truncate block">{publisherRoleTitle}</span>
                  </div>
                </div>
              </div>

              {/* B. Who Is This Opportunity For? */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                    <span>Who Is This Opportunity For? *</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {targetUserTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearTargetUsers}
                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Clear Selection</span>
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                      target_user_types[] ({targetUserTypes.length} selected)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                  Select the audience personas who will discover this opportunity in their Opportunities feed.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {TARGET_USER_OPTIONS.map((opt) => {
                    const isSelected = targetUserTypes.includes(opt.id);
                    const isCoveredByAll = targetUserTypes.includes('all') && opt.id !== 'all';

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleTargetUser(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] border-transparent font-bold shadow-xs'
                            : isCoveredByAll
                            ? 'bg-[#D9FF3F]/15 dark:bg-[#D9FF3F]/20 border-[#D9FF3F]/50 text-[#101212] dark:text-white font-medium'
                            : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {isCoveredByAll && (
                            <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 dark:text-[#D9FF3F]">
                              All
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] leading-tight line-clamp-2 ${
                            isSelected ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* C. Opportunity Source */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-[#101212] dark:text-white block">
                    Opportunity Source *
                  </label>
                  {!adminMode && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      External / Govt / MNC sources: Admin Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
                  {!adminMode
                    ? 'Opportunities published by your account are issued directly under your verified profile. Government and Corporate ecosystem programs can only be cataloged by Xentro Admin.'
                    : 'Choose whether this listing is issued by your entity or cataloged on behalf of external government, MNC, or ecosystem partners.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {OPPORTUNITY_SOURCE_OPTIONS.map((src) => {
                    const isUserOption = src.id === 'my_account';
                    const isLocked = !adminMode && !isUserOption;
                    const isSelected = sourceType === src.id;

                    return (
                      <button
                        key={src.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (isLocked) {
                            showToast('Government, Corporate and External opportunities can only be published through Xentro Admin.', 'info');
                            return;
                          }
                          setSourceType(src.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-[#D9FF3F]/10 border-emerald-500 dark:border-[#D9FF3F] text-[#101212] dark:text-white shadow-xs cursor-pointer'
                            : isLocked
                            ? 'bg-gray-100/60 dark:bg-[#202422]/40 border-gray-200 dark:border-[#262A29] text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed'
                            : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{src.label}</span>
                          {isLocked ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-0.5 border border-amber-500/20">
                              <Lock className="w-2.5 h-2.5" />
                              Admin Only
                            </span>
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#D9FF3F]" />
                          ) : null}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {src.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Conditional External Organization Details */}
                {sourceType !== 'my_account' && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-[#202422] border border-amber-500/20 dark:border-[#262A29] space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#262A29]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-[#101212] dark:text-white">
                          External Conducting Organization Details
                        </span>
                      </div>
                      {adminMode && (
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 font-mono">
                          Listed on Xentro by Xentro Admin
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Organization Name *</label>
                        <input
                          type="text"
                          required
                          value={extOrgName}
                          onChange={(e) => setExtOrgName(e.target.value)}
                          placeholder="e.g. Ministry of Electronics and IT / Google Cloud / IIT Bombay"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Organization Type *</label>
                        <select
                          value={extOrgType}
                          onChange={(e) => setExtOrgType(e.target.value as any)}
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                        >
                          {EXTERNAL_ORG_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Ownership Type</label>
                        <div className="flex items-center gap-2 h-10">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="ownership"
                              checked={extOrgOwnership === 'government'}
                              onChange={() => setExtOrgOwnership('government')}
                            />
                            <span>Government / Statutory</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                            <input
                              type="radio"
                              name="ownership"
                              checked={extOrgOwnership === 'private'}
                              onChange={() => setExtOrgOwnership('private')}
                            />
                            <span>Private / Corporate</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Organization Website</label>
                        <input
                          type="url"
                          value={extWebsite}
                          onChange={(e) => setExtWebsite(e.target.value)}
                          placeholder="https://example.org"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold mb-1">Official Opportunity Page URL</label>
                        <input
                          type="url"
                          value={extOfficialOppUrl}
                          onChange={(e) => setExtOfficialOppUrl(e.target.value)}
                          placeholder="https://official-portal.gov.in/scheme/details"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: BASIC DETAILS ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MeitY TIDE 2.0 Scale-Up Seed Innovation Challenge 2026"
                  className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-sm font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  >
                    {OPPORTUNITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity Subcategory
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                  >
                    {(CATEGORY_SUBCATEGORIES_MAP[category] || ['General']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Short Description (Opportunity Card Summary) *
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      shortDescription.length > 300 ? 'text-rose-500 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {shortDescription.length}/300 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Summarize this opportunity in 1-2 crisp sentences. This text appears on Opportunity feed cards."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Full Description & Scope *
                </label>
                <textarea
                  rows={6}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Provide comprehensive details: What is this opportunity? Who is organizing it? Why does it exist? What should applicants expect? Detailed terms and offerings."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Opportunity Objective (Optional)
                </label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Accelerate commercialization of deeptech hardware innovations across national labs"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: ELIGIBILITY ================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Eligible Applicant Types *
                </label>
                <div className="flex flex-wrap gap-2">
                  {APPLICANT_TYPES.map((app) => {
                    const isSelected = applicantTypes.includes(app);
                    return (
                      <button
                        key={app}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (applicantTypes.length > 1) {
                              setApplicantTypes(applicantTypes.filter((a) => a !== app));
                            }
                          } else {
                            setApplicantTypes([...applicantTypes, app]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold shadow-xs'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-200'
                        }`}
                      >
                        {app}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Industries / Sectors */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Industry / Sector Focus *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {industries.map((sec) => (
                    <span
                      key={sec}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{sec}</span>
                      <button
                        type="button"
                        onClick={() => setIndustries(industries.filter((s) => s !== sec))}
                        className="hover:text-rose-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !industries.includes(e.target.value)) {
                        setIndustries([...industries, e.target.value]);
                      }
                    }}
                    value=""
                    className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none"
                  >
                    <option value="">+ Select from standard sectors...</option>
                    {SECTOR_OPTIONS.filter((s) => !industries.includes(s)).map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                    <input
                      type="text"
                      placeholder="Add custom sector..."
                      value={customSectorInput}
                      onChange={(e) => setCustomSectorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customSectorInput.trim()) {
                          e.preventDefault();
                          if (!industries.includes(customSectorInput.trim())) {
                            setIndustries([...industries, customSectorInput.trim()]);
                          }
                          setCustomSectorInput('');
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customSectorInput.trim() && !industries.includes(customSectorInput.trim())) {
                          setIndustries([...industries, customSectorInput.trim()]);
                          setCustomSectorInput('');
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-gray-100 dark:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Startup Stages (Conditional) */}
              {(applicantTypes.includes('Startup') || applicantTypes.includes('Founder')) && (
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Eligible Startup Stages
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTUP_STAGES.map((stg) => {
                      const isSel = startupStages.includes(stg);
                      return (
                        <button
                          key={stg}
                          type="button"
                          onClick={() => {
                            if (stg === 'Any Stage') {
                              setStartupStages(['Any Stage']);
                              return;
                            }
                            const clean = startupStages.filter((s) => s !== 'Any Stage');
                            if (isSel) {
                              setStartupStages(clean.filter((s) => s !== stg));
                            } else {
                              setStartupStages([...clean, stg]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isSel
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2]'
                          }`}
                        >
                          {stg}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Geographic Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold mb-1">Geographic Scope</label>
                  <select
                    value={geoScope}
                    onChange={(e) => setGeoScope(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                  >
                    <option value="Global">Global (Worldwide)</option>
                    <option value="Country">Country Specific</option>
                    <option value="State">State / Province Specific</option>
                    <option value="City">City Specific</option>
                    <option value="Specific Region">Specific Region (e.g. MENA / APAC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Eligible Country / Region</label>
                  <input
                    type="text"
                    value={geoCountry}
                    onChange={(e) => setGeoCountry(e.target.value)}
                    placeholder="e.g. India / United States / Global"
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Registration Requirements */}
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Registration & Recognition Requirements
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {REGISTRATION_REQUIREMENTS.map((req) => {
                    const isChecked = regRequirements.includes(req);
                    return (
                      <label
                        key={req}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-500/10 border-blue-500/40 text-[#101212] dark:text-white font-semibold'
                            : 'bg-gray-50 dark:bg-[#202422] border-[#E5E7EB] dark:border-[#262A29] text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setRegRequirements(regRequirements.filter((r) => r !== req));
                            } else {
                              setRegRequirements([...regRequirements, req]);
                            }
                          }}
                        />
                        <span>{req}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Additional Criteria */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Additional Eligibility Criteria
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCriteria([
                        ...customCriteria,
                        { id: `crit_${Date.now()}`, title: '', description: '' },
                      ]);
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Eligibility Criteria</span>
                  </button>
                </div>

                {customCriteria.map((c, i) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-start gap-2"
                  >
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Criterion Title (e.g. Patent Filing Status)"
                        value={c.title}
                        onChange={(e) => {
                          const updated = [...customCriteria];
                          updated[i].title = e.target.value;
                          setCustomCriteria(updated);
                        }}
                        className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Detailed requirement or qualification rule"
                        value={c.description}
                        onChange={(e) => {
                          const updated = [...customCriteria];
                          updated[i].description = e.target.value;
                          setCustomCriteria(updated);
                        }}
                        className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomCriteria(customCriteria.filter((_, idx) => idx !== i))}
                      className="p-1 text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 4: BENEFITS & FINANCIALS ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Grouped Benefits */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#101212] dark:text-white">
                  What Will Participants Receive? (Select all that apply)
                </label>

                {Object.entries(BENEFIT_CATEGORIES).map(([catTitle, items]) => (
                  <div key={catTitle} className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                      {catTitle}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => {
                        const isSelected = selectedBenefits.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBenefits(selectedBenefits.filter((b) => b !== item));
                              } else {
                                setSelectedBenefits([...selectedBenefits, item]);
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-200'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom Benefit Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="+ Add custom benefit..."
                    value={customBenefitInput}
                    onChange={(e) => setCustomBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customBenefitInput.trim()) {
                        e.preventDefault();
                        if (!selectedBenefits.includes(customBenefitInput.trim())) {
                          setSelectedBenefits([...selectedBenefits, customBenefitInput.trim()]);
                        }
                        setCustomBenefitInput('');
                      }
                    }}
                    className="h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none max-w-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customBenefitInput.trim() && !selectedBenefits.includes(customBenefitInput.trim())) {
                        setSelectedBenefits([...selectedBenefits, customBenefitInput.trim()]);
                        setCustomBenefitInput('');
                      }
                    }}
                    className="h-9 px-3 rounded-xl bg-gray-100 dark:bg-[#262A29] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Conditional Financial Details Block */}
              {hasFinancialBenefit && (
                <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-[#202422] border border-emerald-500/20 dark:border-[#262A29] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#262A29]">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        Financial Terms, Cheque Size & Equity Structure
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Active Financial Benefit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Benefit Type</label>
                      <select
                        value={financialType}
                        onChange={(e) => setFinancialType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      >
                        <option value="Grant">Grant (100% Non-Dilutive)</option>
                        <option value="Equity Investment">Equity Investment</option>
                        <option value="Debt">Venture Debt / Debentures</option>
                        <option value="Prize">Prize Money</option>
                        <option value="Stipend">Stipend / Honorarium</option>
                        <option value="Credits">Cloud / Infrastructure Credits</option>
                        <option value="Other">Other Monetary Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Amount Structure</label>
                      <select
                        value={amountType}
                        onChange={(e) => setAmountType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      >
                        <option value="Range">Range (Min - Max)</option>
                        <option value="Fixed Amount">Fixed Amount</option>
                        <option value="Not Disclosed">Not Disclosed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      >
                        <option value="INR">INR (₹ Indian Rupee)</option>
                        <option value="USD">USD ($ US Dollar)</option>
                        <option value="EUR">EUR (€ Euro)</option>
                        <option value="GBP">GBP (£ British Pound)</option>
                        <option value="Other">Other Currency</option>
                      </select>
                    </div>

                    {amountType === 'Fixed Amount' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold mb-1">Fixed Amount ({currency})</label>
                        <input
                          type="number"
                          value={fixedAmount}
                          onChange={(e) => setFixedAmount(e.target.value)}
                          placeholder="e.g. 2500000"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none font-mono"
                        />
                      </div>
                    )}

                    {amountType === 'Range' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Min Amount ({currency})</label>
                          <input
                            type="number"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            placeholder="e.g. 1500000"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Max Amount ({currency})</label>
                          <input
                            type="number"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            placeholder="e.g. 5000000"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none font-mono"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1">Equity Requirement</label>
                      <select
                        value={equityType}
                        onChange={(e) => setEquityType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      >
                        <option value="No Equity">No Equity (0% Non-Dilutive)</option>
                        <option value="Equity Required">Equity Required</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>

                    {equityType === 'Equity Required' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Min Equity (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={minEquity}
                            onChange={(e) => setMinEquity(e.target.value)}
                            placeholder="e.g. 5.0"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Max Equity (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={maxEquity}
                            onChange={(e) => setMaxEquity(e.target.value)}
                            placeholder="e.g. 8.0"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none font-mono"
                          />
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold mb-1">Additional Financial Terms</label>
                      <input
                        type="text"
                        value={additionalFinancialTerms}
                        onChange={(e) => setAdditionalFinancialTerms(e.target.value)}
                        placeholder="e.g. Milestone-based tranche disbursements, convertible at Series A discount"
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 5: APPLICATION DETAILS ================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Participation Mode & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Participation Mode *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Online', 'Offline', 'Hybrid'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setParticipationMode(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          participationMode === m
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity Scope *
                  </label>
                  <select
                    value={opportunityScope}
                    onChange={(e) => setOpportunityScope(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                  >
                    <option value="Local">Local (City-level)</option>
                    <option value="State">State-level</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
              </div>

              {/* Conditional Venue Fields for Offline / Hybrid */}
              {participationMode !== 'Online' && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#101212] dark:text-white">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-[#D9FF3F]" />
                    <span>In-Person Venue Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Venue / Campus Name</label>
                      <input
                        type="text"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="e.g. T-Hub Phase 2 Campus / IIT Delhi Senate Hall"
                        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Street Address</label>
                      <input
                        type="text"
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="e.g. Knowledge City, Madhapur"
                        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">City</label>
                      <input
                        type="text"
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        placeholder="Hyderabad"
                        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">State & Country</label>
                      <input
                        type="text"
                        value={venueState}
                        onChange={(e) => setVenueState(e.target.value)}
                        placeholder="Telangana, India"
                        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Application Method */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#101212] dark:text-white">
                  Application Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    'Apply Through Xentro',
                    'External Application',
                    'Contact Publisher',
                    'Registration Only',
                    'Invite Only',
                    'No Application Required',
                  ].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setApplicationMethod(m as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        applicationMethod === m
                          ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold shadow-xs'
                          : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-gray-400'
                      }`}
                    >
                      <div className="font-bold text-xs">{m}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {m === 'Apply Through Xentro'
                          ? 'In-platform application review & DD sync'
                          : m === 'External Application'
                          ? 'Redirect applicants to external URL'
                          : m === 'Contact Publisher'
                          ? 'Direct message or phone inquiry'
                          : 'Custom access'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Conditional External App URL */}
                {applicationMethod === 'External Application' && (
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-blue-700 dark:text-blue-300">
                      External Application URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={externalAppUrl}
                      onChange={(e) => setExternalAppUrl(e.target.value)}
                      placeholder="https://portal.external-entity.org/apply/challenge-2026"
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Application Process Steps */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Application Process (Ordered Milestones)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setApplicationSteps([
                        ...applicationSteps,
                        {
                          stepNumber: applicationSteps.length + 1,
                          title: `Step ${applicationSteps.length + 1}`,
                          description: 'Description of milestone or review criteria.',
                        },
                      ]);
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {applicationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                        {step.stepNumber}
                      </span>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => {
                            const updated = [...applicationSteps];
                            updated[idx].title = e.target.value;
                            setApplicationSteps(updated);
                          }}
                          placeholder="Step Title (e.g. Technical Screening)"
                          className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                        />
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => {
                            const updated = [...applicationSteps];
                            updated[idx].description = e.target.value;
                            setApplicationSteps(updated);
                          }}
                          placeholder="What occurs in this step"
                          className="w-full h-7 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[11px] text-gray-500 dark:text-gray-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (applicationSteps.length > 1) {
                            const filtered = applicationSteps.filter((_, i) => i !== idx);
                            // Re-number
                            const renumbered = filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }));
                            setApplicationSteps(renumbered);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Documents & Credentials */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-bold text-[#101212] dark:text-white">
                  Required Application Documents & Credentials
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {APPLICATION_REQUIREMENTS_OPTIONS.map((req) => {
                    const isSelected = appRequirements.includes(req);
                    return (
                      <button
                        key={req}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setAppRequirements(appRequirements.filter((r) => r !== req));
                          } else {
                            setAppRequirements([...appRequirements, req]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-200'
                        }`}
                      >
                        {req}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: DATES & AVAILABILITY ================= */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Applications Open Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applicationsOpen}
                    onChange={(e) => setApplicationsOpen(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">
                      Application Deadline
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rollingApplications}
                        onChange={(e) => setRollingApplications(e.target.checked)}
                      />
                      <span className="font-semibold text-emerald-700 dark:text-[#D9FF3F]">
                        Rolling Applications
                      </span>
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={rollingApplications}
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold outline-none ${
                      rollingApplications
                        ? 'opacity-40 bg-gray-200 dark:bg-[#181B1A]'
                        : 'bg-gray-50 dark:bg-[#202422] text-[#101212] dark:text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Program Start & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity / Cohort Start Date
                  </label>
                  <input
                    type="date"
                    value={opportunityStartDate}
                    onChange={(e) => setOpportunityStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity / Cohort End Date
                  </label>
                  <input
                    type="date"
                    value={opportunityEndDate}
                    onChange={(e) => setOpportunityEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Frequency & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Opportunity Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                  >
                    <option value="One-Time">One-Time Event / Program</option>
                    <option value="Weekly">Weekly Calls</option>
                    <option value="Monthly">Monthly Cohorts</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual Cohort / Grant Call</option>
                    <option value="Rolling">Rolling Ingestion</option>
                    <option value="Recurring">Custom Recurring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Is Capacity Limited?
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={capacityType}
                      onChange={(e) => setCapacityType(e.target.value as any)}
                      className="w-1/2 h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white outline-none"
                    >
                      <option value="Limited">Limited Capacity</option>
                      <option value="Unlimited">Unlimited Capacity</option>
                      <option value="Invite Only">Invite Only</option>
                    </select>

                    {capacityType === 'Limited' && (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          value={availableSlots}
                          onChange={(e) => setAvailableSlots(parseInt(e.target.value) || 0)}
                          placeholder="25"
                          className="w-16 h-10 px-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-mono font-bold text-center"
                        />
                        <input
                          type="text"
                          value={slotLabel}
                          onChange={(e) => setSlotLabel(e.target.value)}
                          placeholder="Slots"
                          className="flex-1 h-10 px-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Important Dates */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Additional Important Dates & Deadlines
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportantDates([
                        ...importantDates,
                        { id: `dt_${Date.now()}`, name: 'Shortlisting Announcement', date: '2026-05-15' },
                      ]);
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Important Date</span>
                  </button>
                </div>

                {importantDates.map((d, idx) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Event Name (e.g. Pitch Showcase)"
                      value={d.name}
                      onChange={(e) => {
                        const updated = [...importantDates];
                        updated[idx].name = e.target.value;
                        setImportantDates(updated);
                      }}
                      className="flex-1 h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none"
                    />
                    <input
                      type="date"
                      value={d.date}
                      onChange={(e) => {
                        const updated = [...importantDates];
                        updated[idx].date = e.target.value;
                        setImportantDates(updated);
                      }}
                      className="w-40 h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setImportantDates(importantDates.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 7: MEDIA & LINKS ================= */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in">
              {/* Cover Image Picker */}
              <div>
                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleCoverFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Opportunity Cover Image
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{coverImage ? 'Replace Image' : 'Upload Image'}</span>
                    </button>
                    {coverImage !== PRESET_BANNERS[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(PRESET_BANNERS[0]);
                          showToast('Reset cover image to default', 'info');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-medium text-gray-500 hover:text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-44 rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#262A29] relative mb-3 group">
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F]" />
                      Active Banner Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-white text-[11px] font-semibold backdrop-blur-xs transition-all flex items-center gap-1 opacity-90 group-hover:opacity-100"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Change File</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Choose from curated presets:</span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_BANNERS.map((banner, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCoverImage(banner)}
                        className={`h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          coverImage === banner ? 'border-[#D9FF3F] scale-102 shadow-xs' : 'border-transparent opacity-70'
                        }`}
                      >
                        <img src={banner} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                    Or paste custom image URL:
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Links & Resources */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Official Links & Resources
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinks([...links, { id: `link_${Date.now()}`, label: 'Official Portal', url: 'https://' }]);
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>

                {links.map((link, idx) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Terms & Conditions)"
                      value={link.label}
                      onChange={(e) => {
                        const updated = [...links];
                        updated[idx].label = e.target.value;
                        setLinks(updated);
                      }}
                      className="w-48 h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none font-semibold"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...links];
                        updated[idx].url = e.target.value;
                        setLinks(updated);
                      }}
                      className="flex-1 h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 8: VISIBILITY ================= */}
          {currentStep === 8 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                  Opportunity Discovery Scope *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'Selected User Types Only',
                      desc: 'Strictly restricted to stakeholders chosen in Step 1 (Audience).',
                    },
                    {
                      id: 'All Xentro Users',
                      desc: 'Visible across all ecosystem feeds and search results.',
                    },
                    {
                      id: 'Connections Only',
                      desc: 'Exclusively discoverable by direct first-degree connections.',
                    },
                    {
                      id: 'Invite Only',
                      desc: 'Hidden from feed; accessible only via private link.',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisibilityScope(item.id as any)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        visibilityScope === item.id
                          ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold shadow-xs'
                          : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:border-gray-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.id}</div>
                      <div className="text-[10px] opacity-80 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Visibility Simulation Block */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-[#D9FF3F]" />
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Real-time Feed Visibility Resolution
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                  Based on your configuration, this opportunity will be surfaced for users whose currently active account matches:{' '}
                  <span className="font-bold text-[#101212] dark:text-white font-mono">
                    [{targetUserTypes.join(', ')}]
                  </span>
                  .
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {['startup', 'mentor', 'investor', 'esp'].map((role) => {
                    const isAllowed = targetUserTypes.includes('all') || targetUserTypes.includes(role);
                    return (
                      <div
                        key={role}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isAllowed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'bg-gray-100 dark:bg-[#181B1A] border-gray-200 dark:border-[#262A29] text-gray-400 opacity-60'
                        }`}
                      >
                        <span className="capitalize">{role} Feed</span>
                        <span className="font-mono text-[10px] font-bold">
                          {isAllowed ? '✓ Visible' : '✕ Hidden'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 9: PREVIEW & PUBLISH ================= */}
          {currentStep === 9 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2 border border-blue-500/20">
                <Sparkles className="w-4 h-4" />
                <span>
                  High-Fidelity Detail Preview: This is exactly how the opportunity will render on Xentro.
                </span>
              </div>

              {/* Full Opportunity Card & Hero Preview */}
              <div className="rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-xl">
                {/* Banner */}
                <div className="h-44 sm:h-56 relative overflow-hidden">
                  <img src={coverImage} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212]">
                        {category} &bull; {subcategory || 'Initiative'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white font-mono">
                        {rollingApplications ? 'Rolling Call' : `Deadline: ${applicationDeadline}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-[#D9FF3F] font-semibold">
                        {sourceType !== 'my_account' ? extOrgName : publisherOrg}
                      </span>
                      <h1 className="text-xl sm:text-2xl font-bold font-sora text-white leading-tight">
                        {title || 'Untitled Opportunity'}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                  {/* Metadata Chips Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                      <span className="text-gray-400 block text-[10px]">Audience Scope</span>
                      <span className="font-bold text-[#101212] dark:text-white capitalize">
                        {targetUserTypes.join(', ')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                      <span className="text-gray-400 block text-[10px]">Mode & Geography</span>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {participationMode} &bull; {geoScope}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                      <span className="text-gray-400 block text-[10px]">Financial Support</span>
                      <span className="font-bold text-emerald-700 dark:text-[#D9FF3F] font-mono">
                        {hasFinancialBenefit
                          ? amountType === 'Fixed Amount'
                            ? `${currency} ${Number(fixedAmount).toLocaleString()}`
                            : `${currency} ${Number(minAmount).toLocaleString()} - ${Number(maxAmount).toLocaleString()}`
                          : 'Non-Monetary Support'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                      <span className="text-gray-400 block text-[10px]">Application Pipeline</span>
                      <span className="font-bold text-[#101212] dark:text-white truncate block">
                        {applicationMethod}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-[#101212] dark:text-white font-sora">
                      About this Opportunity
                    </h3>
                    <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed whitespace-pre-line font-sans">
                      {fullDescription || shortDescription}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-[#101212] dark:text-white font-sora">
                      Benefits & Offerings
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBenefits.map((b) => (
                        <span
                          key={b}
                          className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40"
                        >
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Application Steps */}
                  {applicationSteps.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm text-[#101212] dark:text-white font-sora">
                        Selection Process & Timeline
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {applicationSteps.map((s) => (
                          <div
                            key={s.stepNumber}
                            className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1"
                          >
                            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-[#D9FF3F]">
                              STEP {s.stepNumber}
                            </span>
                            <h4 className="text-xs font-bold text-[#101212] dark:text-white">{s.title}</h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Documents */}
                  {appRequirements.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm text-[#101212] dark:text-white font-sora">
                        Required Documents
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {appRequirements.map((r) => (
                          <span
                            key={r}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white text-xs font-medium"
                          >
                            &bull; {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN VERIFICATION AUDIT BLOCK (Only in Admin mode or External Source) */}
              {(adminMode || sourceType !== 'my_account') && (
                <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-[#202422] border border-rose-500/20 dark:border-[#262A29] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-[#262A29]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        Administrative Source Verification & Audit Stamp
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600">
                      Operator Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Verified By (Admin Identifier)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${publisherName} (${publisherType})`}
                        className="w-full h-8 px-2.5 rounded-lg bg-gray-100 dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] font-mono text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Verification Status
                      </label>
                      <select
                        value={verStatus}
                        onChange={(e) => setVerStatus(e.target.value as any)}
                        className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] font-semibold text-[#101212] dark:text-white"
                      >
                        <option value="Official">Official (Government / Statutory Verified)</option>
                        <option value="Verified">Verified (Partner Authenticated)</option>
                        <option value="Needs Review">Needs Review (Pending Checks)</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                        Verification Date
                      </label>
                      <input
                        type="date"
                        value={verPubDate}
                        onChange={(e) => setVerPubDate(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/60 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrev}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#262A29]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Opportunity to Xentro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
