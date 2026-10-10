'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Building2,
  TrendingUp,
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: any;
  onEntityCreated?: () => void;
}

type EntityCategory = 'STARTUP' | 'INVESTOR_ORG' | 'ESP';

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onEntityCreated,
}) => {
  const { showToast } = useToast();
  const [category, setCategory] = useState<EntityCategory>('STARTUP');

  // Form Fields
  const [name, setName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [subType, setSubType] = useState('');
  const [industryOrFocus, setIndustryOrFocus] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please provide an entity name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUserProfile?.id,
        userEmail: currentUserProfile?.email,
        entityType: category,
        name: name.trim(),
        officialEmail: officialEmail.trim() || currentUserProfile?.email,
        details: {
          subType,
          industryOrFocus,
          location,
          primaryOwner: currentUserProfile?.name,
        },
      };

      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast(
          `${category === 'STARTUP' ? 'Startup' : category === 'INVESTOR_ORG' ? 'Investor Organization' : 'ESP / Institution'} initiated successfully!`,
          'success'
        );
        setName('');
        setOfficialEmail('');
        setSubType('');
        setIndustryOrFocus('');
        setLocation('');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('xentro-entities-updated'));
          window.dispatchEvent(new CustomEvent('xentro-workspaces-updated'));
        }
        if (onEntityCreated) onEntityCreated();
        onClose();
      } else {
        showToast(data?.message || 'Failed to create entity account.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to connect to entity service.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-[#262A29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Create Entity Account
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Separately managed organizational profile linked to your personal Explorer identity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Category Switcher */}
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCategory('STARTUP')}
              className={cn(
                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                category === 'STARTUP'
                  ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                  : 'border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:border-gray-400'
              )}
            >
              <Rocket className="w-4 h-4 text-blue-500 mb-1.5" />
              <div className="text-xs font-bold">Startup</div>
              <div className="text-[10px] text-[#7D8280]">Venture Profile</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('INVESTOR_ORG')}
              className={cn(
                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                category === 'INVESTOR_ORG'
                  ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                  : 'border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:border-gray-400'
              )}
            >
              <TrendingUp className="w-4 h-4 text-emerald-500 mb-1.5" />
              <div className="text-xs font-bold">Investor Org</div>
              <div className="text-[10px] text-[#7D8280]">Fund / Firm</div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('ESP')}
              className={cn(
                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                category === 'ESP'
                  ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10 text-[#101212] dark:text-white'
                  : 'border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:border-gray-400'
              )}
            >
              <Building2 className="w-4 h-4 text-amber-500 mb-1.5" />
              <div className="text-xs font-bold">ESP / Institution</div>
              <div className="text-[10px] text-[#7D8280]">Incubator / Uni</div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                {category === 'STARTUP'
                  ? 'Startup Name *'
                  : category === 'INVESTOR_ORG'
                  ? 'Organization / Firm Name *'
                  : 'Institution / Hub Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  category === 'STARTUP'
                    ? 'e.g. Nexus AI Technologies'
                    : category === 'INVESTOR_ORG'
                    ? 'e.g. Apex Horizon Capital'
                    : 'e.g. IIT Innovation Cell'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                Official Entity Email
              </label>
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="contact@entitydomain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
              />
              <span className="text-[10px] text-[#565B59] dark:text-[#7D8280] block">
                Separate email policy applies to official entity accounts.
              </span>
            </div>

            {category === 'STARTUP' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#101212] dark:text-white">Stage</label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-xs text-[#101212] dark:text-white"
                  >
                    <option value="Idea">Idea Stage</option>
                    <option value="Prototype">Prototype / MVP</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Growth">Growth / Scale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#101212] dark:text-white">Industry</label>
                  <input
                    type="text"
                    value={industryOrFocus}
                    onChange={(e) => setIndustryOrFocus(e.target.value)}
                    placeholder="e.g. AI SaaS, FinTech"
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] text-xs text-[#101212] dark:text-white"
                  />
                </div>
              </div>
            )}

            {category === 'INVESTOR_ORG' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Investor Organization accounts require administrator review and commercial activation before access to private syndicates is enabled.
                </span>
              </div>
            )}

            {category === 'ESP' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  ESP &amp; Institution accounts enter administrator verification to confirm institutional accreditation.
                </span>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-[#101212] dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Entity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
