'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Target,
  Send,
  Eye,
  FileText,
  Save,
  Shield,
  HelpCircle,
  Sparkles,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { UserRole, getUserProfile } from '@/lib/userProfile';
import {
  EcosystemAsk,
  AskVisibility,
  ASK_ROLE_CONFIGS,
  AskCategoryConfig,
  AskFieldConfig,
  VISIBILITY_OPTIONS,
} from '@/lib/askConfig';
import { askService } from '@/lib/askService';
import { useToast } from '@/components/ui/Toast';

interface DynamicAskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsk?: EcosystemAsk | null;
  activeRole?: UserRole;
  onSaved?: (ask: EcosystemAsk) => void;
}

export const DynamicAskModal: React.FC<DynamicAskModalProps> = ({
  isOpen,
  onClose,
  initialAsk,
  activeRole,
  onSaved,
}) => {
  const { showToast } = useToast();

  // Determine current active persona
  const currentRole: UserRole = useMemo(() => {
    if (activeRole) return activeRole;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('xentro_active_role') as UserRole;
      if (stored && ASK_ROLE_CONFIGS[stored]) return stored;
    }
    return (getUserProfile().role as UserRole) || 'startup';
  }, [activeRole]);

  const roleConfig = ASK_ROLE_CONFIGS[currentRole] || ASK_ROLE_CONFIGS.startup;
  const availableCategories = roleConfig.categoryOrder;
  const initialCategoryKey = initialAsk?.category || availableCategories[0];

  // Common Form States
  const [category, setCategory] = useState<string>(initialCategoryKey);
  const [title, setTitle] = useState<string>(initialAsk?.title || '');
  const [shortSummary, setShortSummary] = useState<string>(initialAsk?.shortSummary || '');
  const [description, setDescription] = useState<string>(initialAsk?.description || '');
  const [desiredOutcome, setDesiredOutcome] = useState<string>(initialAsk?.desiredOutcome || '');
  const [deadline, setDeadline] = useState<string>(initialAsk?.deadline || '');
  const [visibility, setVisibility] = useState<AskVisibility>(initialAsk?.visibility || 'public');
  const [targetUserTypes, setTargetUserTypes] = useState<string[]>(
    initialAsk?.targeting?.userTypes || []
  );

  // Category Specific Data
  const [categoryData, setCategoryData] = useState<Record<string, any>>(
    initialAsk?.categoryData || {}
  );

  // Supporting Access Toggles
  const [attachments, setAttachments] = useState({
    pitchDeck: initialAsk?.attachments?.pitchDeck ?? true,
    elevatorPitch: initialAsk?.attachments?.elevatorPitch ?? true,
    financialSnapshot: initialAsk?.attachments?.financialSnapshot ?? false,
    ddLocker: initialAsk?.attachments?.ddLocker ?? true,
  });

  // Preview Mode Toggle
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Active Category Config
  const activeCategoryConfig: AskCategoryConfig =
    roleConfig.categories[category] || roleConfig.categories[availableCategories[0]];

  // When category changes, re-sync default target user types and response actions
  useEffect(() => {
    if (!initialAsk) {
      if (activeCategoryConfig) {
        setTargetUserTypes(activeCategoryConfig.defaultTargetUserTypes);
      }
    }
  }, [category, activeCategoryConfig, initialAsk]);

  // If initialAsk changes, load its values
  useEffect(() => {
    if (initialAsk) {
      setCategory(initialAsk.category);
      setTitle(initialAsk.title);
      setShortSummary(initialAsk.shortSummary || '');
      setDescription(initialAsk.description || '');
      setDesiredOutcome(initialAsk.desiredOutcome || '');
      setDeadline(initialAsk.deadline || '');
      setVisibility(initialAsk.visibility || 'public');
      setTargetUserTypes(initialAsk.targeting?.userTypes || []);
      setCategoryData(initialAsk.categoryData || {});
      setAttachments({
        pitchDeck: initialAsk.attachments?.pitchDeck ?? true,
        elevatorPitch: initialAsk.attachments?.elevatorPitch ?? true,
        financialSnapshot: initialAsk.attachments?.financialSnapshot ?? false,
        ddLocker: initialAsk.attachments?.ddLocker ?? true,
      });
    } else {
      // New Ask defaults
      setCategory(availableCategories[0]);
      setTitle('');
      setShortSummary('');
      setDescription('');
      setDesiredOutcome('');
      setDeadline('');
      setVisibility('public');
      setCategoryData({});
      if (roleConfig.categories[availableCategories[0]]) {
        setTargetUserTypes(roleConfig.categories[availableCategories[0]].defaultTargetUserTypes);
      }
    }
    setIsPreviewMode(false);
  }, [initialAsk, isOpen, availableCategories, roleConfig]);

  if (!isOpen) return null;

  // Handle category change: cleanly reset obsolete categoryData and update defaults
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const newConfig = roleConfig.categories[newCat];
    if (newConfig) {
      setTargetUserTypes(newConfig.defaultTargetUserTypes);
      // Clean obsolete category data while preserving any matching defaults
      const initialCatData: Record<string, any> = {};
      newConfig.fields.forEach((f) => {
        if (f.defaultValue !== undefined) {
          initialCatData[f.id] = f.defaultValue;
        }
      });
      setCategoryData(initialCatData);
    }
  };

  const handleFieldChange = (fieldId: string, val: any) => {
    setCategoryData((prev) => {
      const next = { ...prev, [fieldId]: val };

      // Automatic Calculation: Startup Investment amount remaining
      if (currentRole === 'startup' && category === 'investment') {
        if (fieldId === 'totalRoundSize' || fieldId === 'amountCommitted') {
          const total = Number(fieldId === 'totalRoundSize' ? val : prev.totalRoundSize || 0);
          const committed = Number(fieldId === 'amountCommitted' ? val : prev.amountCommitted || 0);
          next.amountRemaining = Math.max(0, total - committed);
        }
      }
      return next;
    });
  };

  // Toggle array item (for multi_select fields or userTypes)
  const toggleArrayItem = (fieldId: string, item: string) => {
    const current = (categoryData[fieldId] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    handleFieldChange(fieldId, updated);
  };

  const toggleTargetUserType = (type: string) => {
    setTargetUserTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Validation
  const validateForm = (isDraft: boolean): boolean => {
    if (!title.trim()) {
      showToast('Please provide an Ask Title', 'error');
      return false;
    }

    if (isDraft) {
      // Drafts allow partial fields
      return true;
    }

    if (!shortSummary.trim()) {
      showToast('Please provide a Short Summary (up to 300 characters)', 'error');
      return false;
    }

    if (shortSummary.length > 300) {
      showToast('Short summary cannot exceed 300 characters', 'error');
      return false;
    }

    if (!description.trim()) {
      showToast('Please provide Detailed Description & Context', 'error');
      return false;
    }

    if (!desiredOutcome.trim()) {
      showToast('Please provide Desired Outcome', 'error');
      return false;
    }

    // Validate active category fields
    for (const field of activeCategoryConfig.fields) {
      // If field depends on another field, check condition
      if (field.dependsOn) {
        const parentVal = categoryData[field.dependsOn.field];
        if (parentVal !== field.dependsOn.value) {
          continue; // Skip validation of hidden dependent field
        }
      }

      if (field.required) {
        const val = categoryData[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          showToast(`Please fill out required field: "${field.label}"`, 'error');
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = (status: 'published' | 'draft') => {
    const isValid = validateForm(status === 'draft');
    if (!isValid) return;

    const userProfile = getUserProfile();

    const askToSave: EcosystemAsk = {
      id: initialAsk?.id || `ask_${currentRole}_${Date.now()}`,
      creatorId: initialAsk?.creatorId || userProfile.id || `user_${currentRole}_1`,
      creatorName: initialAsk?.creatorName || userProfile.name || 'Verified Member',
      creatorRole: currentRole,
      creatorAvatar: initialAsk?.creatorAvatar || userProfile.avatar || '',
      creatorTagline: initialAsk?.creatorTagline || userProfile.bio || userProfile.roleTitle || '',
      creatorLocation: initialAsk?.creatorLocation || 'India',
      creatorStage: initialAsk?.creatorStage || 'Verified',
      creatorVerified: true,

      category,
      type: activeCategoryConfig.label,

      title: title.trim(),
      shortSummary: shortSummary.trim(),
      description: description.trim(),
      desiredOutcome: desiredOutcome.trim(),

      categoryData,

      targeting: {
        userTypes: targetUserTypes.length > 0 ? targetUserTypes : activeCategoryConfig.defaultTargetUserTypes,
      },

      visibility,
      responseActions: activeCategoryConfig.responseActions,

      attachments,
      deadline: deadline || null,

      status,
      createdAt: initialAsk?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateCreated: initialAsk?.dateCreated || 'Just now',
      requirement: shortSummary.slice(0, 120),
      targetUserType: targetUserTypes.join(', '),
      responsesCount: initialAsk?.responsesCount || 0,
    };

    askService.saveAsk(askToSave);
    if (onSaved) onSaved(askToSave);
    showToast(
      status === 'draft'
        ? `Ask saved as Draft: "${askToSave.title}"`
        : `Successfully published Ecosystem Ask!`,
      status === 'draft' ? 'info' : 'success'
    );
    onClose();
  };

  // User Profile for Ghost Mode Preview
  const ghostProfile = askService.getGhostProfile(currentRole, {
    id: 'preview',
    creatorId: 'me',
    creatorRole: currentRole,
    creatorName: getUserProfile().name,
    category,
    title,
    shortSummary,
    description,
    desiredOutcome,
    categoryData,
    targeting: { userTypes: targetUserTypes },
    visibility,
    responseActions: activeCategoryConfig.responseActions,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-[#101212]/50">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212]">
                {roleConfig.roleLabel} Ask Engine
              </span>
              <h3 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white">
                {initialAsk ? 'Edit Ecosystem Ask' : 'Create New Ecosystem Ask'}
              </h3>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {initialAsk
                ? 'Update your broadcast parameters and terms for ecosystem partners.'
                : 'Publish structured capital, partnership, or advisory requests dynamically tailored to your role.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isPreviewMode
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] border-transparent'
                  : 'bg-white dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] border-gray-200 dark:border-[#262A29] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreviewMode ? 'Edit Mode' : 'Preview Card'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isPreviewMode ? (
            /* PREVIEW CARD MODE */
            <div className="space-y-4 animate-fade-slide">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Live Ecosystem Preview</p>
                  <p className="text-[11px] opacity-90">
                    This is how your Ask will render to target ecosystem partners in discovery feeds.
                    {visibility === 'ghost' && ' Notice that Ghost Mode anonymizes your company and personal identities.'}
                  </p>
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#101212] border border-gray-200 dark:border-[#262A29] shadow-subtle space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center font-bold font-sora">
                      {ghostProfile.avatar ? (
                        <img src={ghostProfile.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#101212] dark:text-white">
                          {ghostProfile.name}
                        </span>
                        {visibility === 'ghost' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                            Ghost Mode
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {ghostProfile.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    {activeCategoryConfig.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-[#101212] dark:text-white">
                    {title || 'Untitled Ecosystem Ask'}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    {shortSummary || 'No short summary provided.'}
                  </p>
                </div>

                {description && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    <span className="font-semibold text-[#101212] dark:text-white block mb-1">
                      Context & Description:
                    </span>
                    {description}
                  </div>
                )}

                {/* Key Category Highlights */}
                {Object.keys(categoryData).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 dark:border-[#262A29]">
                    {Object.entries(categoryData)
                      .slice(0, 6)
                      .map(([k, v]) => {
                        if (v === undefined || v === null || v === '' || typeof v === 'boolean') return null;
                        const fieldDef = activeCategoryConfig.fields.find((f) => f.id === k);
                        return (
                          <div key={k} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#181B1A]">
                            <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block truncate">
                              {fieldDef?.label || k}
                            </span>
                            <span className="text-xs font-bold text-[#101212] dark:text-white block truncate">
                              {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Dynamic CTAs */}
                <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {targetUserTypes.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]"
                      >
                        Target: {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeCategoryConfig.responseActions.slice(0, 3).map((action, idx) => (
                      <button
                        key={action}
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          idx === 0
                            ? 'bg-[#D9FF3F] text-[#101212]'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white'
                        }`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT FORM MODE */
            <form onSubmit={(e) => { e.preventDefault(); handleSave('published'); }} className="space-y-6">
              {/* Step 1: Category Selection */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#101212] border border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-white flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-[#D9FF3F]" />
                    <span>Ask Category *</span>
                  </label>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    10 dynamic {roleConfig.roleLabel} categories
                  </span>
                </div>

                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                >
                  {availableCategories.map((catKey) => {
                    const cfg = roleConfig.categories[catKey];
                    return (
                      <option key={catKey} value={catKey}>
                        {cfg.label} — {cfg.description}
                      </option>
                    );
                  })}
                </select>

                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] italic">
                  💡 {activeCategoryConfig.description}
                </p>
              </div>

              {/* Step 2: Common Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  General Information
                </h4>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Ask Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={activeCategoryConfig.titlePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                {/* Short Summary with char counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">
                      Short Summary *
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        shortSummary.length > 300 ? 'text-red-500 font-bold' : 'text-[#565B59] dark:text-[#B6B8B7]'
                      }`}
                    >
                      {shortSummary.length} / 300 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    required
                    maxLength={300}
                    value={shortSummary}
                    onChange={(e) => setShortSummary(e.target.value)}
                    placeholder="Brief 1-2 sentence executive summary displayed on cards and search feeds..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Detailed Description & Context *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your current status, what you have built or offer, and the specific terms..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                {/* Desired Outcome */}
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Desired Outcome *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="What concrete milestone or success criteria should conclude this engagement?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              {/* Step 3: Category-Specific Fields */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    {activeCategoryConfig.label} Parameters
                  </h4>
                  <span className="text-[10px] text-[#D9FF3F] bg-[#D9FF3F]/10 px-2 py-0.5 rounded-full font-bold">
                    Category Specific
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCategoryConfig.fields.map((field) => {
                    // Check dependent condition
                    if (field.dependsOn) {
                      const parentVal = categoryData[field.dependsOn.field];
                      if (parentVal !== field.dependsOn.value) return null;
                    }

                    const val = categoryData[field.id];
                    const colSpan = field.halfWidth ? 'col-span-1' : 'col-span-1 sm:col-span-2';

                    return (
                      <div key={field.id} className={colSpan}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#101212] dark:text-white">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.helperText && (
                            <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                              {field.helperText}
                            </span>
                          )}
                        </div>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            required={field.required}
                            value={val || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            rows={2}
                            required={field.required}
                            value={val || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            required={field.required}
                            value={val !== undefined ? val : field.defaultValue || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                          >
                            <option value="">Select {field.label}...</option>
                            {field.options?.map((opt) => {
                              const value = typeof opt === 'string' ? opt : opt.value;
                              const label = typeof opt === 'string' ? opt : opt.label;
                              return (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        )}

                        {field.type === 'currency' && (
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#565B59] dark:text-[#B6B8B7]">
                              ₹
                            </span>
                            <input
                              type="number"
                              required={field.required}
                              value={val !== undefined ? val : ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
                              placeholder={field.placeholder || '0'}
                              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                            />
                          </div>
                        )}

                        {field.type === 'calculated' && (
                          <div className="p-3 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20 flex items-center justify-between">
                            <span className="text-xs text-[#101212] dark:text-white font-medium">
                              Remaining to Raise:
                            </span>
                            <span className="text-sm font-bold font-mono text-[#101212] dark:text-[#D9FF3F]">
                              ₹ {Number(categoryData.amountRemaining || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {field.type === 'date' && (
                          <input
                            type="date"
                            required={field.required}
                            value={val || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            required={field.required}
                            value={val !== undefined ? val : ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
                            placeholder={field.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                          />
                        )}

                        {field.type === 'boolean' && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={val !== undefined ? Boolean(val) : Boolean(field.defaultValue)}
                                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                                className="w-4 h-4 rounded text-[#D9FF3F] focus:ring-0 cursor-pointer accent-[#D9FF3F]"
                              />
                              <span className="text-xs text-[#101212] dark:text-white font-medium">
                                {field.label}
                              </span>
                            </label>
                            {field.notice && Boolean(val) && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg font-medium">
                                🔒 {field.notice}
                              </p>
                            )}
                          </div>
                        )}

                        {field.type === 'multi_select' && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                              {field.options?.map((opt) => {
                                const itemStr = typeof opt === 'string' ? opt : opt.value;
                                const isSelected = ((categoryData[field.id] as string[]) || []).includes(itemStr);
                                return (
                                  <button
                                    key={itemStr}
                                    type="button"
                                    onClick={() => toggleArrayItem(field.id, itemStr)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] font-bold shadow-2xs'
                                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200'
                                    }`}
                                  >
                                    {itemStr}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Targeting & Audience */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Target Audience *
                  </label>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Pre-selected based on category
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Startup', 'Investor', 'Mentor', 'ESP', 'Institution'].map((type) => {
                    const isSelected = targetUserTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleTargetUserType(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                            : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Visibility & Ghost Mode */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
                  Ask Visibility & Privacy Mode *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const isSelected = visibility === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gray-50 dark:bg-[#202422] border-[#101212] dark:border-[#D9FF3F] ring-1 ring-[#101212] dark:ring-[#D9FF3F]'
                            : 'bg-white dark:bg-[#181B1A] border-gray-200 dark:border-[#262A29] hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#101212] dark:text-white">
                            {opt.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                          {opt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {visibility === 'ghost' && (
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-600 dark:text-purple-400 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ghost Stealth Mode Activated</p>
                      <p className="text-[11px] opacity-90">
                        Your entity name, logo, founder identity, and direct links will be hidden. Viewers will only see verified stage, sector, and thesis criteria until mutual engagement is approved.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 6: Supporting Access & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-[#262A29]">
                <div>
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1.5">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#101212] dark:text-white mb-1">
                    Supporting Data Attached
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachments.pitchDeck}
                        onChange={(e) => setAttachments({ ...attachments, pitchDeck: e.target.checked })}
                        className="rounded text-[#D9FF3F] accent-[#D9FF3F]"
                      />
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">Pitch Deck</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachments.elevatorPitch}
                        onChange={(e) => setAttachments({ ...attachments, elevatorPitch: e.target.checked })}
                        className="rounded text-[#D9FF3F] accent-[#D9FF3F]"
                      />
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">Video Pitch</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachments.financialSnapshot}
                        onChange={(e) => setAttachments({ ...attachments, financialSnapshot: e.target.checked })}
                        className="rounded text-[#D9FF3F] accent-[#D9FF3F]"
                      />
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">Financials</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachments.ddLocker}
                        onChange={(e) => setAttachments({ ...attachments, ddLocker: e.target.checked })}
                        className="rounded text-[#D9FF3F] accent-[#D9FF3F]"
                      />
                      <span className="text-[#565B59] dark:text-[#B6B8B7]">DD Locker</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Response Actions Callout */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#101212] border border-gray-200 dark:border-[#262A29] flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Viewer Response CTAs:
                  </span>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Actions available to users responding to this Ask
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeCategoryConfig.responseActions.map((act) => (
                    <span
                      key={act}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-[#101212]/50 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Ask</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
