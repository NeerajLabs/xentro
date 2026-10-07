'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Star,
  Building2,
  Calendar,
  Sparkles,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Filter,
  Check,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface EvaluationItem {
  id: string;
  startupName: string;
  founderName: string;
  sector: string;
  stage: string;
  date: string;
  score: number;
  status: 'Completed' | 'Pending Review' | 'Draft';
  recommendation: 'Strong Buy / Back' | 'Proceed to Diligence' | 'Mentor & Re-evaluate' | 'Pass';
  notes: string;
  criteria: {
    productMarketFit: number;
    teamStrength: number;
    techDefensibility: number;
    scalability: number;
  };
}

export const MentorEvaluationsView: React.FC = () => {
  const { showToast } = useToast();
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('xentro_mentor_evaluations');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((e: EvaluationItem) => e.id === 'eval_1' || e.startupName === 'Kinetix AI')) {
        localStorage.removeItem('xentro_mentor_evaluations');
        return [];
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedEval, setSelectedEval] = useState<string>(() => evaluations[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const active = evaluations.find((e) => e.id === selectedEval) || evaluations[0];

  const handleUpdateScore = (key: keyof EvaluationItem['criteria'], value: number) => {
    setEvaluations((prev) =>
      prev.map((item) => {
        if (item.id !== selectedEval) return item;
        const newCrit = { ...item.criteria, [key]: value };
        const avg = Object.values(newCrit).reduce((a, b) => a + b, 0) / 4;
        return {
          ...item,
          criteria: newCrit,
          score: Math.round(avg * 10) / 10,
        };
      })
    );
    showToast('Evaluation scorecard updated', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              Founder & Venture Evaluations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F] text-[#101212]">
              {evaluations.length} Active
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
            Structured advisory evaluations, technical feasibility assessments, and jury scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('New evaluation sheet opened', 'info')}
            className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Evaluation</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left List + Right Scorecard or Empty State */}
      {evaluations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
          <Award className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-[#101212] dark:text-white">No Evaluations Recorded Yet</h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
            Structured advisory evaluations, technical scorecards, and pitch assessments will appear here once submitted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Evaluation items */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
              Evaluation History
            </span>
            <div className="flex items-center gap-1 text-xs text-[#565B59]">
              <Filter className="w-3 h-3" />
              <span>All Types</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {evaluations.map((item) => {
              const isSelected = item.id === selectedEval;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEval(item.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#181B1A] border-[#D9FF3F] dark:border-[#D9FF3F] shadow-md ring-1 ring-[#D9FF3F]'
                      : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#101212] dark:text-white">
                      {item.startupName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                      Score: {item.score} / 10
                    </span>
                  </div>

                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {item.founderName} &bull; {item.sector}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#7A807D]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.recommendation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Detailed scorecard */}
        {active && (
          <div className="lg:col-span-7 bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
                  Evaluation Scorecard
                </span>
                <h3 className="text-xl font-bold font-sora text-[#101212] dark:text-white mt-0.5">
                  {active.startupName}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Founder: <strong className="text-[#101212] dark:text-white">{active.founderName}</strong> &bull; {active.stage}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-sora text-[#101212] dark:text-[#D9FF3F]">
                  {active.score}
                  <span className="text-xs text-[#565B59] dark:text-[#7A807D] font-normal"> / 10</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-500">
                  {active.recommendation}
                </span>
              </div>
            </div>

            {/* Criteria Sliders */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
                Quantitative Scoring Breakdown
              </h4>

              {[
                { key: 'productMarketFit', label: 'Product-Market Fit & Traction' },
                { key: 'teamStrength', label: 'Founding Team Rigor & Execution' },
                { key: 'techDefensibility', label: 'Technical Moat & Architecture' },
                { key: 'scalability', label: 'TAM, Margins & Scalability' },
              ].map(({ key, label }) => {
                const k = key as keyof EvaluationItem['criteria'];
                const val = active.criteria[k];
                return (
                  <div key={key} className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-[#202422]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#101212] dark:text-white">{label}</span>
                      <span className="font-bold text-[#101212] dark:text-[#D9FF3F]">{val} / 10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={val}
                        onChange={(e) => handleUpdateScore(k, parseInt(e.target.value))}
                        className="w-full accent-[#D9FF3F] cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Qualitative Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#7A807D] block">
                Advisor Qualitative Notes & Thesis
              </label>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-[#262A29]">
                {active.notes}
              </div>
            </div>

            {/* Recommendation Tag */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-[#565B59] dark:text-[#B6B8B7]">
                  Logged on {active.date} &bull; Shared with Investment Committee
                </span>
              </div>

              <button
                onClick={() => showToast(`Report exported for ${active.startupName}`, 'success')}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF Memo</span>
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
