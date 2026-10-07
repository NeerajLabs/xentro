'use client';

import React, { useState, useEffect } from 'react';
import { Building2, X, Globe, Star } from 'lucide-react';
import { ESPEcosystemOrgPartner } from '@/types/espPublicTeam';

interface OrgPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partnerData: Omit<ESPEcosystemOrgPartner, 'id' | 'displayOrder'>) => void;
  editingPartner: ESPEcosystemOrgPartner | null;
}

export const OrgPartnerModal: React.FC<OrgPartnerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPartner,
}) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [category, setCategory] = useState<ESPEcosystemOrgPartner['category']>('Corporates');
  const [website, setWebsite] = useState('');
  const [partnershipScope, setPartnershipScope] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden'>('published');

  useEffect(() => {
    if (editingPartner) {
      setName(editingPartner.name);
      setLogo(editingPartner.logo || '');
      setCategory(editingPartner.category);
      setWebsite(editingPartner.website || '');
      setPartnershipScope(editingPartner.partnershipScope || '');
      setIsFeatured(editingPartner.isFeatured || false);
      setStatus(editingPartner.status);
    } else {
      setName('');
      setLogo('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120');
      setCategory('Corporates');
      setWebsite('');
      setPartnershipScope('');
      setIsFeatured(false);
      setStatus('published');
    }
  }, [editingPartner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      espEntityId: 'uni_9',
      name: name.trim(),
      logo: logo.trim() || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120',
      category,
      website: website.trim() || undefined,
      partnershipScope: partnershipScope.trim() || undefined,
      isFeatured,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D9FF3F]" />
            <h3 className="font-bold text-sm text-[#101212] dark:text-white">
              {editingPartner ? 'Edit Partner Organization' : 'Add Ecosystem Partner Organization'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          <div>
            <label className="block font-bold text-[#101212] dark:text-white mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Cloud Startups, Startup India, Intel Labs"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#101212] dark:text-white mb-1">
              Partner Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            >
              <option value="Corporates">Corporates</option>
              <option value="Universities">Universities & Research Institutions</option>
              <option value="Government Agencies">Government Agencies & Regulators</option>
              <option value="Venture Funds">Venture Funds & Angel Alliances</option>
              <option value="Accelerators">Accelerators & Hubs</option>
              <option value="Technology Partners">Technology / Cloud Partners</option>
              <option value="Industry Bodies">Industry Bodies & Councils</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#101212] dark:text-white mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#101212] dark:text-white mb-1">
              Official Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#101212] dark:text-white mb-1">
              Partnership Scope / Entitlements
            </label>
            <textarea
              rows={2}
              value={partnershipScope}
              onChange={(e) => setPartnershipScope(e.target.value)}
              placeholder="e.g. $100K Cloud Credits, joint demo day co-sponsorship, regulatory sandbox access"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded-sm text-[#D9FF3F] focus:ring-[#D9FF3F]"
              />
              <span className="font-semibold text-[#101212] dark:text-white">
                Feature on Public Profile
              </span>
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold hover:opacity-90"
            >
              {editingPartner ? 'Save Changes' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
