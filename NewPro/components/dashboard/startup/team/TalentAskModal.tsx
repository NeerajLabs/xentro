'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  DollarSign,
  Globe,
  Lock,
  Plus,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  StartupTalentAsk,
  TalentRoleType,
  TalentWorkMode,
  TalentCompensationType,
  TalentAskVisibility,
  TalentAskStatus,
} from '@/types/startup';

interface TalentAskModalProps {
  isOpen: boolean;
  ask: StartupTalentAsk | null; // null if creating
  onClose: () => void;
  onSave: (
    askData: Omit<
      StartupTalentAsk,
      'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'applicationsCount' | 'shortlistedCount'
    >
  ) => void;
}

export const TalentAskModal: React.FC<TalentAskModalProps> = ({
  isOpen,
  ask,
  onClose,
  onSave,
}) => {
  const [positionTitle, setPositionTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [roleType, setRoleType] = useState<TalentRoleType>('Full-Time');
  const [seniority, setSeniority] = useState('Senior');
  const [openingsCount, setOpeningsCount] = useState(1);

  const [location, setLocation] = useState('Hyderabad / Bengaluru');
  const [workMode, setWorkMode] = useState<TalentWorkMode>('Hybrid');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [startDate, setStartDate] = useState('Immediately');
  const [duration, setDuration] = useState('');

  const [description, setDescription] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [requiredSkillsText, setRequiredSkillsText] = useState('');
  const [preferredSkillsText, setPreferredSkillsText] = useState('');
  const [minExperience, setMinExperience] = useState('3+ Years');

  const [compensationType, setCompensationType] = useState<TalentCompensationType>('Paid + Equity');
  const [salaryRange, setSalaryRange] = useState('₹18 - ₹28 LPA');
  const [equityRange, setEquityRange] = useState('0.25% - 0.75%');
  const [esop, setEsop] = useState('Standard 4-year vesting');
  const [benefitsText, setBenefitsText] = useState('Health Insurance, Remote Budget');

  const [visibility, setVisibility] = useState<TalentAskVisibility>('Public');
  const [status, setStatus] = useState<TalentAskStatus>('Open');

  useEffect(() => {
    if (ask) {
      setPositionTitle(ask.positionTitle);
      setDepartment(ask.department);
      setRoleType(ask.roleType);
      setSeniority(ask.seniority);
      setOpeningsCount(ask.openingsCount);
      setLocation(ask.location);
      setWorkMode(ask.workMode);
      setEmploymentType(ask.employmentType);
      setStartDate(ask.startDate || 'Immediately');
      setDuration(ask.duration || '');
      setDescription(ask.description);
      setResponsibilitiesText(ask.responsibilities?.join('\n') || '');
      setRequiredSkillsText(ask.requiredSkills?.join(', ') || '');
      setPreferredSkillsText(ask.preferredSkills?.join(', ') || '');
      setMinExperience(ask.minExperience || '3+ Years');
      setCompensationType(ask.compensationType);
      setSalaryRange(ask.salaryRange || '');
      setEquityRange(ask.equityRange || '');
      setEsop(ask.esop || '');
      setBenefitsText(ask.otherBenefits?.join(', ') || '');
      setVisibility(ask.visibility);
      setStatus(ask.status);
    } else {
      setPositionTitle('');
      setDepartment('Engineering');
      setRoleType('Full-Time');
      setSeniority('Senior');
      setOpeningsCount(1);
      setLocation('Hyderabad / Bengaluru');
      setWorkMode('Hybrid');
      setEmploymentType('Full-Time');
      setStartDate('Immediately');
      setDuration('');
      setDescription('');
      setResponsibilitiesText('');
      setRequiredSkillsText('');
      setPreferredSkillsText('');
      setMinExperience('3+ Years');
      setCompensationType('Paid + Equity');
      setSalaryRange('₹18 - ₹28 LPA');
      setEquityRange('0.25% - 0.75%');
      setEsop('Standard 4-year vesting');
      setBenefitsText('Health Insurance, Remote Budget');
      setVisibility('Public');
      setStatus('Open');
    }
  }, [ask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionTitle.trim() || !description.trim()) {
      alert('Please provide position title and description');
      return;
    }

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const requiredSkills = requiredSkillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const preferredSkills = preferredSkillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const otherBenefits = benefitsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      positionTitle: positionTitle.trim(),
      department,
      roleType,
      seniority,
      openingsCount,
      location,
      workMode,
      employmentType,
      startDate,
      duration: duration || undefined,
      description: description.trim(),
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute core engineering & product milestones.'],
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Problem Solving', 'Domain Expertise'],
      preferredSkills,
      minExperience,
      compensationType,
      salaryRange: salaryRange || undefined,
      equityRange: equityRange || undefined,
      esop: esop || undefined,
      otherBenefits,
      visibility,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white">
                {ask ? 'Edit Talent Ask' : '+ Create New Talent Ask'}
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Define talent requirements, compensation, and candidate qualifications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* SECTION 1: ROLE IDENTITY */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              1. Role Identity & Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  placeholder="e.g. Founding Distributed Systems Architect"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product & Design</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing & Growth</option>
                  <option value="Sales">Sales & BD</option>
                  <option value="Finance">Finance</option>
                  <option value="Research">Research & DeepTech</option>
                  <option value="Advisory Board">Advisory Board</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Role Type
                </label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as TalentRoleType)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Co-Founder">Co-Founder</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Advisor">Advisor</option>
                  <option value="Volunteer / Contributor">Volunteer / Contributor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Founding">Founding / Co-Founder</option>
                  <option value="Staff / Principal">Staff / Principal</option>
                  <option value="Lead">Lead / Architect</option>
                  <option value="Senior">Senior</option>
                  <option value="Mid">Mid-Level</option>
                  <option value="Junior / Intern">Junior / Intern</option>
                  <option value="Distinguished Advisor">Distinguished Advisor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Number of Openings
                </label>
                <input
                  type="number"
                  min={1}
                  value={openingsCount}
                  onChange={(e) => setOpeningsCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: WORK DETAILS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              2. Work Location & Arrangements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Location / Base City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hyderabad / Bengaluru"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as TalentWorkMode)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Start Date
                </label>
                <input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="e.g. Immediately or Oct 2026"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: REQUIREMENTS & DESCRIPTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              3. Requirements & Scope
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                Role Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe why this role matters to the venture, team context, and key objectives..."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                Key Responsibilities (One per line)
              </label>
              <textarea
                rows={3}
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                placeholder="Architect distributed consensus layer&#10;Deploy self-healing cluster nodes on AWS&#10;Mentor engineering team on concurrency"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={requiredSkillsText}
                  onChange={(e) => setRequiredSkillsText(e.target.value)}
                  placeholder="e.g. Rust, Kafka, Kubernetes, Distributed Systems"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Minimum Experience
                </label>
                <input
                  type="text"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  placeholder="e.g. 5+ Years"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: COMPENSATION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              4. Compensation & Equity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Compensation Type
                </label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value as TalentCompensationType)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Paid + Equity">Paid + Equity</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Equity">Equity Only</option>
                  <option value="Unpaid Internship">Unpaid Internship</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Salary / Stipend Range
                </label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. ₹25 - ₹40 LPA or ₹30k/mo"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Equity Range
                </label>
                <input
                  type="text"
                  value={equityRange}
                  onChange={(e) => setEquityRange(e.target.value)}
                  placeholder="e.g. 0.5% - 1.5%"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: VISIBILITY & STATUS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              5. Publishing & Discoverability
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as TalentAskVisibility)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Public">Public (Appears on Public Profile & Discover)</option>
                  <option value="Xentro Users">Xentro Users Only (Logged-in members)</option>
                  <option value="Connections Only">Connections Only</option>
                  <option value="Private / Draft">Private / Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TalentAskStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Open">Open (Actively Accepting Applicants)</option>
                  <option value="Draft">Draft</option>
                  <option value="Paused">Paused</option>
                  <option value="Filled">Filled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#262A29]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{ask ? 'Save Changes' : 'Publish Talent Ask'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
