'use client';

import React, { useState } from 'react';
import {
  X,
  Target,
  Building2,
  Rocket,
  TrendingUp,
  DollarSign,
  Calendar,
  Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { startupMilestoneService } from '@/lib/startupMilestoneService';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  defaultCategory?: 'company' | 'product' | 'market' | 'funding';
  onSuccess?: () => void;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  onClose,
  entityId,
  defaultCategory = 'company',
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'company' | 'product' | 'market' | 'funding'>(defaultCategory);
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a milestone title.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await startupMilestoneService.addMilestone(entityId, {
        title: title.trim(),
        category,
        targetDate: targetDate || undefined,
        description: description.trim() || undefined,
      });

      if (res.success) {
        showToast('Milestone added to operational roadmap!', 'success');
        setTitle('');
        setDescription('');
        setTargetDate('');
        onSuccess?.();
        onClose();
      } else {
        showToast(res.message || 'Failed to add milestone', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error creating milestone', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'company', label: 'Company & Governance', icon: Building2 },
    { id: 'product', label: 'Product Engineering', icon: Rocket },
    { id: 'market', label: 'Market & Traction', icon: TrendingUp },
    { id: 'funding', label: 'Capital & Funding', icon: DollarSign },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                Add Operational Milestone
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Track custom objectives and goals across your venture roadmap
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Milestone Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Milestone Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete SOC-2 Type II Audit or Ship V2 Mobile App"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Roadmap Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] border-transparent shadow-2xs'
                        : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Target Completion Date (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white">
              Description & Success Metric (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 5 signed pilot letters or clearance from statutory auditors."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] resize-none"
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Milestone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
