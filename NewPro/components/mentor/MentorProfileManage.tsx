'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Building2,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  Eye,
  Camera,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  MessageSquare,
  Globe,
  RotateCcw,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  FullMentorProfile,
  MentorProfessionalExperience,
  MentorEducation,
  MentorshipProgramExperience,
  MentorStartupExperience,
  FounderTestimonial,
  MENTORSHIP_OFFERING,
} from '@/types/mentor';
import {
  getStoredMentorProfile,
  saveStoredMentorProfile,
  resetStoredMentorProfile,
} from '@/lib/mentorProfileState';
import {
  getMentorOfferings,
  saveMentorOfferings,
} from '@/lib/mentorshipService';

interface MentorProfileManageProps {
  onViewPublicProfile: () => void;
  mentorId?: string;
}

type ManageTab = 'identity' | 'basic' | 'experience' | 'slots' | 'mentorship';

export const MentorProfileManage: React.FC<MentorProfileManageProps> = ({
  onViewPublicProfile,
  mentorId = 'user_mentor',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ManageTab>('identity');
  const [profile, setProfile] = useState<FullMentorProfile>(() => getStoredMentorProfile(mentorId));
  const [offerings, setOfferings] = useState<MENTORSHIP_OFFERING[]>(() => getMentorOfferings(mentorId));
  const [isSaved, setIsSaved] = useState(false);

  // Sync if mentorId changes
  useEffect(() => {
    setProfile(getStoredMentorProfile(mentorId));
    setOfferings(getMentorOfferings(mentorId));
  }, [mentorId]);

  // Tag inputs state
  const [newExpertise, setNewExpertise] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newFounderType, setNewFounderType] = useState('');
  const [newAreaMentored, setNewAreaMentored] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  // Modals / Item Editors State
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expForm, setExpForm] = useState<MentorProfessionalExperience>({
    organization: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);
  const [eduForm, setEduForm] = useState<MentorEducation>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
  });

  const [editingProgIndex, setEditingProgIndex] = useState<number | null>(null);
  const [progForm, setProgForm] = useState<MentorshipProgramExperience>({
    name: '',
    role: '',
    period: '',
    description: '',
  });

  const [editingStartupIndex, setEditingStartupIndex] = useState<number | null>(null);
  const [startupForm, setStartupForm] = useState<MentorStartupExperience>({
    startupName: '',
    startupLogo: '',
    role: '',
    industry: '',
    stage: '',
    period: '',
    contribution: '',
  });

  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<FounderTestimonial>({
    id: '',
    testimonial: '',
    founderName: '',
    founderPhoto: '',
    founderDesignation: '',
    startupName: '',
    periodOfMentorship: '',
  });

  // Save handler
  const handleSaveAll = () => {
    saveStoredMentorProfile(profile);
    saveMentorOfferings(offerings, profile.id);
    setIsSaved(true);
    showToast('✨ Mentor public profile updated and synchronized!', 'success');
    setTimeout(() => setIsSaved(false), 2200);
  };

  // Reset handler
  const handleResetDefaults = () => {
    if (confirm('Reset profile content to default verified template?')) {
      const reset = resetStoredMentorProfile(mentorId);
      setProfile(reset);
      setOfferings(getMentorOfferings(mentorId));
      showToast('Profile content restored to defaults.', 'info');
    }
  };

  // -------------------------------------------------------------
  // Helpers for Experience
  // -------------------------------------------------------------
  const handleSaveExp = () => {
    if (!expForm.organization || !expForm.position) {
      showToast('Please enter organization and position', 'error');
      return;
    }
    const updated = [...profile.professionalExperience];
    if (editingExpIndex !== null && editingExpIndex >= 0) {
      updated[editingExpIndex] = expForm;
    } else {
      updated.push(expForm);
    }
    setProfile({ ...profile, professionalExperience: updated });
    setEditingExpIndex(null);
    setExpForm({ organization: '', position: '', startDate: '', endDate: '', description: '' });
  };

  const handleDeleteExp = (index: number) => {
    const updated = profile.professionalExperience.filter((_, i) => i !== index);
    setProfile({ ...profile, professionalExperience: updated });
  };

  // -------------------------------------------------------------
  // Helpers for Education
  // -------------------------------------------------------------
  const handleSaveEdu = () => {
    if (!eduForm.institution || !eduForm.degree) {
      showToast('Please enter institution and degree', 'error');
      return;
    }
    const updated = [...profile.education];
    if (editingEduIndex !== null && editingEduIndex >= 0) {
      updated[editingEduIndex] = eduForm;
    } else {
      updated.push(eduForm);
    }
    setProfile({ ...profile, education: updated });
    setEditingEduIndex(null);
    setEduForm({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' });
  };

  const handleDeleteEdu = (index: number) => {
    const updated = profile.education.filter((_, i) => i !== index);
    setProfile({ ...profile, education: updated });
  };

  // -------------------------------------------------------------
  // Helpers for Programs & Institutions
  // -------------------------------------------------------------
  const handleSaveProg = () => {
    if (!progForm.name || !progForm.role) {
      showToast('Please enter program name and role', 'error');
      return;
    }
    const updated = [...profile.mentorshipBackground.programsAndInstitutions];
    if (editingProgIndex !== null && editingProgIndex >= 0) {
      updated[editingProgIndex] = progForm;
    } else {
      updated.push(progForm);
    }
    setProfile({
      ...profile,
      mentorshipBackground: {
        ...profile.mentorshipBackground,
        programsAndInstitutions: updated,
      },
    });
    setEditingProgIndex(null);
    setProgForm({ name: '', role: '', period: '', description: '' });
  };

  const handleDeleteProg = (index: number) => {
    const updated = profile.mentorshipBackground.programsAndInstitutions.filter((_, i) => i !== index);
    setProfile({
      ...profile,
      mentorshipBackground: {
        ...profile.mentorshipBackground,
        programsAndInstitutions: updated,
      },
    });
  };

  // -------------------------------------------------------------
  // Helpers for Startup Experience Cards
  // -------------------------------------------------------------
  const handleSaveStartup = () => {
    if (!startupForm.startupName || !startupForm.role) {
      showToast('Please enter startup name and role', 'error');
      return;
    }
    const updated = [...profile.previousStartupExperience];
    if (editingStartupIndex !== null && editingStartupIndex >= 0) {
      updated[editingStartupIndex] = startupForm;
    } else {
      updated.push({
        ...startupForm,
        startupLogo: startupForm.startupLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      });
    }
    setProfile({ ...profile, previousStartupExperience: updated });
    setEditingStartupIndex(null);
    setStartupForm({ startupName: '', startupLogo: '', role: '', industry: '', stage: '', period: '', contribution: '' });
  };

  const handleDeleteStartup = (index: number) => {
    const updated = profile.previousStartupExperience.filter((_, i) => i !== index);
    setProfile({ ...profile, previousStartupExperience: updated });
  };

  // -------------------------------------------------------------
  // Helpers for Founder Testimonials ("What Founders Say")
  // -------------------------------------------------------------
  const handleSaveTestimonial = () => {
    if (!testimonialForm.founderName || !testimonialForm.testimonial) {
      showToast('Please enter founder name and testimonial quote', 'error');
      return;
    }
    const updated = [...profile.founderTestimonials];
    if (editingTestimonialIndex !== null && editingTestimonialIndex >= 0) {
      updated[editingTestimonialIndex] = testimonialForm;
    } else {
      updated.push({
        ...testimonialForm,
        id: `t_${Date.now()}`,
        founderPhoto: testimonialForm.founderPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    }
    setProfile({ ...profile, founderTestimonials: updated });
    setEditingTestimonialIndex(null);
    setTestimonialForm({ id: '', testimonial: '', founderName: '', founderPhoto: '', founderDesignation: '', startupName: '', periodOfMentorship: '' });
  };

  const handleDeleteTestimonial = (index: number) => {
    const updated = profile.founderTestimonials.filter((_, i) => i !== index);
    setProfile({ ...profile, founderTestimonials: updated });
  };

  // -------------------------------------------------------------
  // Array Tag Helpers
  // -------------------------------------------------------------
  const addTag = (
    field: keyof FullMentorProfile,
    val: string,
    setter: (s: string) => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = (profile[field] as string[]) || [];
    if (!current.includes(trimmed)) {
      setProfile({ ...profile, [field]: [...current, trimmed] });
    }
    setter('');
  };

  const removeTag = (field: keyof FullMentorProfile, tagToRemove: string) => {
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: current.filter((t) => t !== tagToRemove) });
  };

  const addBgTag = (
    subField: 'founderTypesMentored' | 'areasMentored' | 'relevantAchievements',
    val: string,
    setter: (s: string) => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = profile.mentorshipBackground[subField] || [];
    if (!current.includes(trimmed)) {
      setProfile({
        ...profile,
        mentorshipBackground: {
          ...profile.mentorshipBackground,
          [subField]: [...current, trimmed],
        },
      });
    }
    setter('');
  };

  const removeBgTag = (
    subField: 'founderTypesMentored' | 'areasMentored' | 'relevantAchievements',
    tagToRemove: string
  ) => {
    const current = profile.mentorshipBackground[subField] || [];
    setProfile({
      ...profile,
      mentorshipBackground: {
        ...profile.mentorshipBackground,
        [subField]: current.filter((t) => t !== tagToRemove),
      },
    });
  };

  // Meeting Slot Toggles
  const toggleAvailableDay = (day: string) => {
    const current = profile.meetingSlots.availableDays || [];
    const exists = current.includes(day);
    const updated = exists ? current.filter((d) => d !== day) : [...current, day];
    setProfile({
      ...profile,
      meetingSlots: {
        ...profile.meetingSlots,
        availableDays: updated,
      },
    });
  };

  const toggleSessionType = (type: any) => {
    const current = profile.meetingSlots.sessionTypes || [];
    const exists = current.includes(type);
    const updated = exists ? current.filter((t) => t !== type) : [...current, type];
    setProfile({
      ...profile,
      meetingSlots: {
        ...profile.meetingSlots,
        sessionTypes: updated,
      },
    });
  };

  const toggleDuration = (dur: any) => {
    const current = profile.meetingSlots.durations || [];
    const exists = current.includes(dur);
    const updated = exists ? current.filter((d) => d !== dur) : [...current, dur];
    setProfile({
      ...profile,
      meetingSlots: {
        ...profile.meetingSlots,
        durations: updated,
      },
    });
  };

  const toggleMeetingMode = (mode: any) => {
    const current = profile.meetingSlots.meetingModes || [];
    const exists = current.includes(mode);
    const updated = exists ? current.filter((m) => m !== mode) : [...current, mode];
    setProfile({
      ...profile,
      meetingSlots: {
        ...profile.meetingSlots,
        meetingModes: updated,
      },
    });
  };

  const addTimeSlot = () => {
    const trimmed = newTimeSlot.trim();
    if (!trimmed) return;
    const current = profile.meetingSlots.availableTimeSlots || [];
    if (!current.includes(trimmed)) {
      setProfile({
        ...profile,
        meetingSlots: {
          ...profile.meetingSlots,
          availableTimeSlots: [...current, trimmed],
        },
      });
    }
    setNewTimeSlot('');
  };

  const removeTimeSlot = (slot: string) => {
    const current = profile.meetingSlots.availableTimeSlots || [];
    setProfile({
      ...profile,
      meetingSlots: {
        ...profile.meetingSlots,
        availableTimeSlots: current.filter((s) => s !== slot),
      },
    });
  };

  // Structured Offerings handler
  const updateOffering = (index: number, patch: Partial<MENTORSHIP_OFFERING>) => {
    const updated = [...offerings];
    updated[index] = { ...updated[index], ...patch };
    setOfferings(updated);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top Action Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Mentor Profile Management
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40">
              Live Synchronized
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Every field configured here updates your public mentor profile in real-time across the XENTRO ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] border border-gray-200 dark:border-[#262A29] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Reset profile content to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={onViewPublicProfile}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
            <span>View Public Profile</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved & Synced!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. Management Sub-tabs */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-2 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'identity', label: 'Identity & Header', icon: Sparkles },
            { id: 'basic', label: 'Basic Info & Career', icon: BookOpenIcon },
            { id: 'experience', label: 'Track Record & Startups', icon: Award },
            { id: 'slots', label: 'Meeting Slots & Availability', icon: Calendar },
            { id: 'mentorship', label: 'Structured Programs', icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManageTab)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] text-white dark:bg-[#202422] dark:text-[#D9FF3F] shadow-sm'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-[#202422]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D9FF3F]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: IDENTITY & HEADER                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'identity' && (
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-6 animate-fade-slide">
          <div className="border-b border-gray-100 dark:border-[#262A29] pb-4">
            <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Public Profile Header & Brand Identity</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Controls your top banner, avatar photo, headline, designation, and verification status.
            </p>
          </div>

          {/* Banner & Avatar Visual Preview */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#262A29] overflow-hidden bg-white dark:bg-[#181B1A] shadow-subtle">
            {/* Banner Top */}
            <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-r from-[#141716] via-[#202422] to-[#0D0F0F]">
              {profile.banner && (
                <img
                  src={profile.banner}
                  alt="Banner Preview"
                  className="w-full h-full object-cover opacity-75 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#101212]/90 text-[#D9FF3F] border border-[#262A29] shadow-xs">
                  {profile.verificationBadge || 'Verified Mentor • XENTRO Partner'}
                </span>
              </div>
            </div>

            {/* Profile Info Row with Overlapping Avatar */}
            <div className="px-6 pb-6 pt-0 bg-white dark:bg-[#181B1A]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4.5 -mt-12 sm:-mt-14 relative z-10">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-[#181B1A] shadow-xl bg-[#0D0F0F] shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={profile.avatar || '/xentro-logo.png'}
                      alt={profile.name || 'Mentor'}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/xentro-logo.png';
                      }}
                    />
                  </div>
                  <div className="space-y-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold font-sora text-[#101212] dark:text-white">
                        {profile.name || 'Your Name'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30">
                        Active Mentor
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-[#101212] dark:text-[#D9FF3F]">
                      {profile.currentRole?.designation || 'Mentor'} {profile.currentRole?.organization ? `· ${profile.currentRole.organization}` : ''}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 pt-3">
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F]" />
                    Live preview card
                  </span>
                </div>
              </div>

              {/* Extra Details Row: Headline & Tags */}
              <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-[#262A29]/60 space-y-2">
                {profile.headline && (
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 leading-relaxed">
                    {profile.headline}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-[#8E9290] flex-wrap">
                  {(profile.location?.city || profile.location?.country) && (
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D9FF3F]" />
                      {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.primaryExpertise && (
                    <span className="flex items-center gap-1 font-medium text-[#101212] dark:text-gray-300">
                      <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F]" />
                      {profile.primaryExpertise}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Banner & Avatar URL inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Avatar Image URL
              </label>
              <input
                type="text"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="https://..."
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Cover Banner Image URL
              </label>
              <input
                type="text"
                value={profile.banner}
                onChange={(e) => setProfile({ ...profile, banner: e.target.value })}
                placeholder="https://..."
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>
          </div>

          {/* Core Identity Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Full Legal / Professional Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Primary Expertise Title
              </label>
              <input
                type="text"
                value={profile.primaryExpertise}
                onChange={(e) => setProfile({ ...profile, primaryExpertise: e.target.value })}
                placeholder="e.g. Scaled AI Systems & Strategic GTM"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Current Designation / Title
              </label>
              <input
                type="text"
                value={profile.currentRole.designation}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    currentRole: { ...profile.currentRole, designation: e.target.value },
                  })
                }
                placeholder="e.g. Principal AI Systems Architect & Venture Mentor"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Primary Organization / Affiliation
              </label>
              <input
                type="text"
                value={profile.currentRole.organization}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    currentRole: { ...profile.currentRole, organization: e.target.value },
                  })
                }
                placeholder="e.g. IIIT-H Foundation & ScaleCraft Advisory"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Current Role Duration
              </label>
              <input
                type="text"
                value={profile.currentRole.duration}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    currentRole: { ...profile.currentRole, duration: e.target.value },
                  })
                }
                placeholder="e.g. 2022 — Present"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Verification Badge Label
              </label>
              <input
                type="text"
                value={profile.verificationBadge || ''}
                onChange={(e) => setProfile({ ...profile, verificationBadge: e.target.value })}
                placeholder="Verified Mentor • XENTRO Partner"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            {/* Location Fields */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                City
              </label>
              <input
                type="text"
                value={profile.location.city}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    location: { ...profile.location, city: e.target.value },
                  })
                }
                placeholder="e.g. Hyderabad"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                State & Country
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={profile.location.state || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      location: { ...profile.location, state: e.target.value },
                    })
                  }
                  placeholder="State"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
                <input
                  type="text"
                  value={profile.location.country}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      location: { ...profile.location, country: e.target.value },
                    })
                  }
                  placeholder="Country"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            {/* Headline */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Mentorship Headline
              </label>
              <input
                type="text"
                value={profile.headline || ''}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="Guiding early & growth-stage founders on Scaled AI Architecture, GTM & Venture Readiness."
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>
          </div>

          {/* Verification Switch */}
          <div className="pt-4 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#101212] dark:text-white block">
                Show Verified Mentor Shield
              </span>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Displays the verified checkmark and badge beside your name on the public profile.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.verified}
                onChange={(e) => setProfile({ ...profile, verified: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D9FF3F]"></div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BASIC INFO & CAREER                                                */}
      {/* ========================================================================= */}
      {activeTab === 'basic' && (
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-8 animate-fade-slide">
          <div className="border-b border-gray-100 dark:border-[#262A29] pb-4">
            <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>About, Professional History & Matching Tags</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Controls the &quot;Basic Info&quot; tab on your public profile, including your biography, career timeline, education, and keyword chips.
            </p>
          </div>

          {/* 1. About / Biography */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              About Bio (Public Profile)
            </label>
            <textarea
              rows={4}
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] leading-relaxed"
            />
          </div>

          {/* 2. Professional Experience Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Professional Experience Timeline ({profile.professionalExperience.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  setEditingExpIndex(-1);
                  setExpForm({ organization: '', position: '', startDate: '', endDate: '', description: '' });
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {profile.professionalExperience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h6 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                        {exp.position}
                      </h6>
                      <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                        {exp.startDate} — {exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                      {exp.organization}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-0.5 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpIndex(idx);
                        setExpForm(exp);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#262A29]"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExp(idx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Experience Inline Form */}
            {editingExpIndex !== null && (
              <div className="p-4 rounded-xl border-2 border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] space-y-3">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  {editingExpIndex >= 0 ? 'Edit Professional Position' : 'Add New Professional Position'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Position (e.g. VP of Growth)"
                    value={expForm.position}
                    onChange={(e) => setExpForm({ ...expForm, position: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Organization (e.g. Google DeepMind)"
                    value={expForm.organization}
                    onChange={(e) => setExpForm({ ...expForm, organization: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Start Date (e.g. 2018)"
                    value={expForm.startDate}
                    onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="End Date (e.g. Present)"
                    value={expForm.endDate}
                    onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description of accomplishments and scope..."
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    className="sm:col-span-2 p-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingExpIndex(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExp}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Education Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Education ({profile.education.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  setEditingEduIndex(-1);
                  setEduForm({ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' });
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Degree</span>
              </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {edu.startYear} — {edu.endYear}
                    </span>
                    <h6 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                      {edu.degree}
                    </h6>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-medium">
                      {edu.fieldOfStudy}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] truncate">
                      {edu.institution}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEduIndex(idx);
                        setEduForm(edu);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEdu(idx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Education Inline Form */}
            {editingEduIndex !== null && (
              <div className="p-4 rounded-xl border-2 border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] space-y-3">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  {editingEduIndex >= 0 ? 'Edit Education' : 'Add New Degree / Education'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Degree (e.g. Ph.D. in Computer Science)"
                    value={eduForm.degree}
                    onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study (e.g. Machine Intelligence)"
                    value={eduForm.fieldOfStudy}
                    onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Institution (e.g. Stanford University)"
                    value={eduForm.institution}
                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Start Year (2008)"
                      value={eduForm.startYear}
                      onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                      className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="End Year (2012)"
                      value={eduForm.endYear}
                      onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                      className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingEduIndex(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdu}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold"
                  >
                    Save Degree
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Categorical Chips (Expertise, Industries, Areas, Stages, Languages) */}
          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-[#262A29]">
            <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
              Matching Keywords & Profile Tags
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Expertise */}
              <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Expertise Tags ({profile.expertise.length})
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {profile.expertise.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag('expertise', tag)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('expertise', newExpertise, setNewExpertise))}
                    placeholder="Add expertise (e.g. AI Architecture)"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('expertise', newExpertise, setNewExpertise)}
                    className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Industries ({profile.industries.length})
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {profile.industries.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag('industries', tag)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('industries', newIndustry, setNewIndustry))}
                    placeholder="Add industry (e.g. B2B SaaS)"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('industries', newIndustry, setNewIndustry)}
                    className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Areas of Mentorship */}
              <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Areas of Mentorship ({profile.areasOfMentorship.length})
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {profile.areasOfMentorship.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag('areasOfMentorship', tag)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('areasOfMentorship', newArea, setNewArea))}
                    placeholder="Add area (e.g. Enterprise GTM)"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('areasOfMentorship', newArea, setNewArea)}
                    className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Startup Stages Mentored */}
              <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Startup Stages Mentored ({profile.startupStagesMentored.length})
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {profile.startupStagesMentored.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag('startupStagesMentored', tag)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('startupStagesMentored', newStage, setNewStage))}
                    placeholder="Add stage (e.g. Pre-Seed)"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('startupStagesMentored', newStage, setNewStage)}
                    className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50 sm:col-span-2">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Spoken Languages ({profile.languages.length})
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                  {profile.languages.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag('languages', tag)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('languages', newLanguage, setNewLanguage))}
                    placeholder="Add language (e.g. English)"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTag('languages', newLanguage, setNewLanguage)}
                    className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPERIENCE & TRACK RECORD                                          */}
      {/* ========================================================================= */}
      {activeTab === 'experience' && (
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-8 animate-fade-slide">
          <div className="border-b border-gray-100 dark:border-[#262A29] pb-4">
            <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Mentorship Background, Startups & Testimonials</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Controls the &quot;Experience &amp; Mentorship&quot; tab on your public profile, including verified founder counts, accelerator programs, previous startup cards, and founder testimonials.
            </p>
          </div>

          {/* 1. Mentorship Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Mentoring Experience Overview
              </label>
              <input
                type="text"
                value={profile.mentorshipBackground.mentoringExperience}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    mentorshipBackground: {
                      ...profile.mentorshipBackground,
                      mentoringExperience: e.target.value,
                    },
                  })
                }
                placeholder="6+ years active venture mentoring across South Asia accelerators"
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                Founders Mentored Count
              </label>
              <input
                type="number"
                value={profile.mentorshipBackground.foundersMentoredCount}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    mentorshipBackground: {
                      ...profile.mentorshipBackground,
                      foundersMentoredCount: Number(e.target.value) || 0,
                    },
                  })
                }
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
              />
            </div>
          </div>

          {/* Verified Mentored Badge Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#101212] dark:text-white block">
                Verified Founders Mentored Badge
              </span>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                When active, displays &quot;{profile.mentorshipBackground.foundersMentoredCount}+ Founders Mentored • Verified&quot; badge in green.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.mentorshipBackground.isFoundersMentoredVerified}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    mentorshipBackground: {
                      ...profile.mentorshipBackground,
                      isFoundersMentoredVerified: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D9FF3F]"></div>
            </label>
          </div>

          {/* 2. Founder Profiles Mentored & Areas Mentored Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Founder Types Mentored */}
            <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
              <span className="text-xs font-bold text-[#101212] dark:text-white block">
                Founder Profiles Mentored ({profile.mentorshipBackground.founderTypesMentored.length})
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                {profile.mentorshipBackground.founderTypesMentored.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#181B1A] text-[#101212] dark:text-white"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeBgTag('founderTypesMentored', tag)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newFounderType}
                  onChange={(e) => setNewFounderType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBgTag('founderTypesMentored', newFounderType, setNewFounderType))}
                  placeholder="e.g. Technical Founders"
                  className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => addBgTag('founderTypesMentored', newFounderType, setNewFounderType)}
                  className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Areas Mentored */}
            <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50">
              <span className="text-xs font-bold text-[#101212] dark:text-white block">
                Areas Mentored ({profile.mentorshipBackground.areasMentored.length})
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                {profile.mentorshipBackground.areasMentored.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeBgTag('areasMentored', tag)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newAreaMentored}
                  onChange={(e) => setNewAreaMentored(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBgTag('areasMentored', newAreaMentored, setNewAreaMentored))}
                  placeholder="e.g. Enterprise GTM Playbooks"
                  className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => addBgTag('areasMentored', newAreaMentored, setNewAreaMentored)}
                  className="px-3 h-8 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* 3. Programs & Institutions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Programs & Institutions ({profile.mentorshipBackground.programsAndInstitutions.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  setEditingProgIndex(-1);
                  setProgForm({ name: '', role: '', period: '', description: '' });
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Program</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.mentorshipBackground.programsAndInstitutions.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-xs text-[#101212] dark:text-white truncate">
                        {prog.name}
                      </h6>
                      <span className="text-[10px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                        {prog.period}
                      </span>
                    </div>
                    <p className="text-xs text-[#101212] dark:text-[#D9FF3F] font-semibold">
                      {prog.role}
                    </p>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-0.5 leading-relaxed">
                      {prog.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProgIndex(idx);
                        setProgForm(prog);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProg(idx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Add / Edit Form */}
            {editingProgIndex !== null && (
              <div className="p-4 rounded-xl border-2 border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] space-y-3">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  {editingProgIndex >= 0 ? 'Edit Program Experience' : 'Add Program or Institution Experience'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Program / Accelerator Name (e.g. T-Hub Accelerator)"
                    value={progForm.name}
                    onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Lead Mentor & Coach)"
                    value={progForm.role}
                    onChange={(e) => setProgForm({ ...progForm, role: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Period (e.g. 2022 — Present)"
                    value={progForm.period}
                    onChange={(e) => setProgForm({ ...progForm, period: e.target.value })}
                    className="sm:col-span-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description of workshops, teardowns, or cohorts..."
                    value={progForm.description}
                    onChange={(e) => setProgForm({ ...progForm, description: e.target.value })}
                    className="sm:col-span-2 p-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingProgIndex(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProg}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold"
                  >
                    Save Program
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Relevant Achievements */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Relevant Achievements ({profile.mentorshipBackground.relevantAchievements.length})
            </span>
            <div className="space-y-2">
              {profile.mentorshipBackground.relevantAchievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#101212] dark:text-white">{ach}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBgTag('relevantAchievements', ach)}
                    className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBgTag('relevantAchievements', newAchievement, setNewAchievement))}
                placeholder="Add milestone achievement (e.g. Mentored 42+ early-stage startups with $38M+ raised)..."
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => addBgTag('relevantAchievements', newAchievement, setNewAchievement)}
                className="px-3.5 h-9 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold shrink-0"
              >
                Add Achievement
              </button>
            </div>
          </div>

          {/* 5. Previous Startup Experience Cards */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Previous Startup Experience Cards ({profile.previousStartupExperience.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  setEditingStartupIndex(-1);
                  setStartupForm({ startupName: '', startupLogo: '', role: '', industry: '', stage: '', period: '', contribution: '' });
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Startup Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.previousStartupExperience.map((st, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white shrink-0">
                        <img
                          src={st.startupLogo}
                          alt={st.startupName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                          {st.startupName}
                        </h6>
                        <p className="text-[11px] text-[#101212] dark:text-[#D9FF3F] font-semibold">
                          {st.role}
                        </p>
                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                          {st.industry} · {st.stage} · {st.period}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStartupIndex(idx);
                          setStartupForm(st);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStartup(idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] pt-1 border-t border-gray-200 dark:border-[#262A29] leading-relaxed italic">
                    &quot;{st.contribution}&quot;
                  </p>
                </div>
              ))}
            </div>

            {/* Inline Add / Edit Startup Form */}
            {editingStartupIndex !== null && (
              <div className="p-4 rounded-xl border-2 border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] space-y-3">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  {editingStartupIndex >= 0 ? 'Edit Startup Experience' : 'Add Previous Startup Experience'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Startup Name (e.g. Synthetix Systems)"
                    value={startupForm.startupName}
                    onChange={(e) => setStartupForm({ ...startupForm, startupName: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Co-Founder & CTO)"
                    value={startupForm.role}
                    onChange={(e) => setStartupForm({ ...startupForm, role: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Industry (e.g. Enterprise AI)"
                    value={startupForm.industry}
                    onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Stage / Outcome (e.g. Acquired ($22M Exit))"
                    value={startupForm.stage}
                    onChange={(e) => setStartupForm({ ...startupForm, stage: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Period (e.g. 2017 — 2021)"
                    value={startupForm.period}
                    onChange={(e) => setStartupForm({ ...startupForm, period: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Logo URL (https://...)"
                    value={startupForm.startupLogo}
                    onChange={(e) => setStartupForm({ ...startupForm, startupLogo: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="Concrete contribution (e.g. Scaled infrastructure from 0 to 80M daily transactions)..."
                    value={startupForm.contribution}
                    onChange={(e) => setStartupForm({ ...startupForm, contribution: e.target.value })}
                    className="sm:col-span-2 p-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingStartupIndex(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStartup}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold"
                  >
                    Save Startup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Founder Testimonials ("What Founders Say") */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
                <span>Founder Testimonials (&quot;What Founders Say&quot;) ({profile.founderTestimonials.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => {
                  setEditingTestimonialIndex(-1);
                  setTestimonialForm({ id: '', testimonial: '', founderName: '', founderPhoto: '', founderDesignation: '', startupName: '', periodOfMentorship: '' });
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Testimonial</span>
              </button>
            </div>

            <div className="space-y-3">
              {profile.founderTestimonials.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white shrink-0">
                        <img
                          src={t.founderPhoto}
                          alt={t.founderName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h6 className="text-xs font-bold text-[#101212] dark:text-white">
                          {t.founderName}
                        </h6>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {t.founderDesignation} • {t.startupName} ({t.periodOfMentorship})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTestimonialIndex(idx);
                          setTestimonialForm(t);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#101212] dark:text-white leading-relaxed italic pt-1 border-t border-gray-200 dark:border-[#262A29]">
                    &quot;{t.testimonial}&quot;
                  </p>
                </div>
              ))}
            </div>

            {/* Inline Add / Edit Testimonial Form */}
            {editingTestimonialIndex !== null && (
              <div className="p-4 rounded-xl border-2 border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] space-y-3">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  {editingTestimonialIndex >= 0 ? 'Edit Founder Testimonial' : 'Add Founder Testimonial'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Founder Name (e.g. Founder Full Name)"
                    value={testimonialForm.founderName}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, founderName: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Founder Designation (e.g. Founder & CEO)"
                    value={testimonialForm.founderDesignation}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, founderDesignation: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Startup Name (e.g. Acme AI)"
                    value={testimonialForm.startupName}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, startupName: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Period of Mentorship (e.g. Seed Stage Sprint (2026))"
                    value={testimonialForm.periodOfMentorship}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, periodOfMentorship: e.target.value })}
                    className="h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Founder Photo URL (https://...)"
                    value={testimonialForm.founderPhoto}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, founderPhoto: e.target.value })}
                    className="sm:col-span-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                  <textarea
                    rows={3}
                    placeholder="Exact founder feedback and quote..."
                    value={testimonialForm.testimonial}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial: e.target.value })}
                    className="sm:col-span-2 p-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingTestimonialIndex(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTestimonial}
                    className="px-3.5 py-1.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold"
                  >
                    Save Testimonial
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEETING SLOTS & AVAILABILITY                                       */}
      {/* ========================================================================= */}
      {activeTab === 'slots' && (
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-8 animate-fade-slide">
          <div className="border-b border-gray-100 dark:border-[#262A29] pb-4">
            <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Meeting Slots, Durations & Booking Modes</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Configures the &quot;Meeting Slots&quot; tab on your public profile where founders schedule 1:1 advisory and discovery calls.
            </p>
          </div>

          {/* Time Zone */}
          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Operating Time Zone
            </label>
            <input
              type="text"
              value={profile.meetingSlots.timeZone}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  meetingSlots: { ...profile.meetingSlots, timeZone: e.target.value },
                })
              }
              placeholder="e.g. IST (UTC +5:30)"
              className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F]"
            />
          </div>

          {/* Available Days */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Weekly Open Days ({profile.meetingSlots.availableDays.length} active)
            </label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const isSelected = profile.meetingSlots.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleAvailableDay(day)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D9FF3F] text-[#101212] shadow-xs'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Types */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Supported Session Types
            </label>
            <div className="flex flex-wrap gap-2">
              {['Discovery Call', 'Mentorship Session', 'Founder Consultation', 'Architecture Review', 'Pitch Teardown'].map((st) => {
                const isSelected = profile.meetingSlots.sessionTypes.includes(st as any);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleSessionType(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#101212] text-white dark:bg-[#202422] dark:text-[#D9FF3F] border border-[#D9FF3F]/30'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Durations */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Offered Meeting Durations
            </label>
            <div className="flex flex-wrap gap-2">
              {['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes'].map((dur) => {
                const isSelected = profile.meetingSlots.durations.includes(dur as any);
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => toggleDuration(dur)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D9FF3F] text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {dur}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meeting Modes */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Meeting Modes
            </label>
            <div className="flex flex-wrap gap-2">
              {['Video', 'Audio', 'In-Person'].map((mode) => {
                const isSelected = profile.meetingSlots.meetingModes.includes(mode as any);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleMeetingMode(mode)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D9FF3F] text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Available Office Hours / Time Slots ({profile.meetingSlots.availableTimeSlots.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.meetingSlots.availableTimeSlots.map((slot, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-[#262A29]"
                >
                  <span>{slot}</span>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(slot)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1 max-w-md">
              <input
                type="text"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTimeSlot())}
                placeholder="e.g. 11:00 AM — 11:45 AM"
                className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
              />
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-3.5 h-9 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold shrink-0"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STRUCTURED MENTORSHIP OFFERINGS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'mentorship' && (
        <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-6 animate-fade-slide">
          <div className="border-b border-gray-100 dark:border-[#262A29] pb-4">
            <h4 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Structured Mentorship Offerings & Pricing</span>
            </h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Controls the packages displayed on Tab 4 (&quot;Mentorship&quot;) of your public profile (1 Month, 3 Months, 6 Months).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {offerings.map((offering, idx) => (
              <div
                key={offering.id || idx}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  offering.enabled
                    ? 'border-[#D9FF3F]/40 bg-white dark:bg-[#181B1A] shadow-sm'
                    : 'border-gray-200 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262A29]">
                  <span className="text-sm font-bold text-[#101212] dark:text-white">
                    {offering.duration} Sprint
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offering.enabled}
                      onChange={(e) => updateOffering(idx, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D9FF3F]"></div>
                  </label>
                </div>

                {/* Price & Currency */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Package Price
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#565B59]">{offering.currency}</span>
                    <input
                      type="number"
                      value={offering.price}
                      onChange={(e) => updateOffering(idx, { price: Number(e.target.value) || 0 })}
                      className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Program Focus
                  </label>
                  <textarea
                    rows={2}
                    value={offering.description}
                    onChange={(e) => updateOffering(idx, { description: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none leading-relaxed"
                  />
                </div>

                {/* Meeting Frequency */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Meeting Rhythm
                  </label>
                  <input
                    type="text"
                    value={offering.meetingFrequency}
                    onChange={(e) => updateOffering(idx, { meetingFrequency: e.target.value })}
                    placeholder="2 sessions / month"
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>

                {/* Preferred Duration */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Session Duration
                  </label>
                  <input
                    type="text"
                    value={offering.preferredMeetingDuration}
                    onChange={(e) => updateOffering(idx, { preferredMeetingDuration: e.target.value })}
                    placeholder="45 Minutes"
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>

                {/* Communication Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Communication Channel
                  </label>
                  <input
                    type="text"
                    value={offering.communicationMode}
                    onChange={(e) => updateOffering(idx, { communicationMode: e.target.value })}
                    placeholder="Xentro Messages + Video Calls"
                    className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] text-xs text-[#101212] dark:text-white outline-none"
                  />
                </div>

                {/* Focus Areas Covered */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Focus Areas ({offering.areasCovered.length})
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {offering.areasCovered.map((area, aIdx) => (
                      <span
                        key={aIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white"
                      >
                        <span>{area}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = offering.areasCovered.filter((_, i) => i !== aIdx);
                            updateOffering(idx, { areasCovered: updated });
                          }}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
