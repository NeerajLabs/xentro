'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  Plus,
  Video,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  Target,
  Send,
  User,
  Building2,
  Layers,
  ShieldCheck,
  ChevronRight,
  MoreVertical,
  Trash2,
  X,
  UploadCloud,
  Check,
  Star,
  Award,
  TrendingUp,
} from 'lucide-react';
import { MENTORSHIP, MENTORSHIP_GOAL, MENTORSHIP_SHARED_RESOURCE, MentorMeeting } from '@/types/mentor';
import {
  addMentorshipGoal,
  toggleMentorshipGoal,
  addProgressUpdate,
  addSharedResource,
  scheduleMentorshipMeeting,
  completeMentorship,
  endMentorshipEarly,
  initialActiveMentorshipsData,
} from '@/lib/mentorshipService';
import { useToast } from '@/components/ui/Toast';

interface MentorshipWorkspaceProps {
  mentorship?: MENTORSHIP;
  onBack: () => void;
  onNavigateMessages?: (founderName?: string) => void;
  onNavigateMeetings?: () => void;
  onViewStartupProfile?: (startupId: string) => void;
  onViewFounderProfile?: (founderId: string) => void;
}

type WorkspaceTab =
  | 'overview'
  | 'progress'
  | 'meetings'
  | 'communication'
  | 'resources'
  | 'evaluation'
  | 'timeline'
  | 'actions';

export const MentorshipWorkspace: React.FC<MentorshipWorkspaceProps> = ({
  mentorship: initialMentorship,
  onBack,
  onNavigateMessages,
  onNavigateMeetings,
  onViewStartupProfile,
  onViewFounderProfile,
}) => {
  const { showToast } = useToast();
  const fallbackMentorship = initialActiveMentorshipsData[0];
  const [mentorship, setMentorship] = useState<MENTORSHIP>(initialMentorship || fallbackMentorship);

  React.useEffect(() => {
    if (initialMentorship) {
      setMentorship(initialMentorship);
    }
  }, [initialMentorship]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Modals
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const [isAddUpdateModalOpen, setIsAddUpdateModalOpen] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateSummary, setUpdateSummary] = useState('');
  const [updateMetrics, setUpdateMetrics] = useState('');

  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState<'document' | 'link' | 'file' | 'spreadsheet'>('document');
  const [resourceUrl, setResourceUrl] = useState('');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('Tomorrow');
  const [meetingTime, setMeetingTime] = useState('04:00 PM – 04:45 PM');
  const [meetingAgenda, setMeetingAgenda] = useState('');

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionSummary, setCompletionSummary] = useState('');

  const [isEndEarlyModalOpen, setIsEndEarlyModalOpen] = useState(false);
  const [endEarlyReason, setEndEarlyReason] = useState('');

  // Mentorship Evaluation State (Right beside Shared Resources)
  const [evalScore, setEvalScore] = useState<number>(9.2);
  const [evalStatus, setEvalStatus] = useState<'Completed' | 'Pending Review' | 'Draft'>('Completed');
  const [evalRecommendation, setEvalRecommendation] = useState<
    'Strong Buy / Back' | 'Proceed to Diligence' | 'Mentor & Re-evaluate' | 'Pass'
  >('Strong Buy / Back');
  const [evalNotes, setEvalNotes] = useState<string>(
    'Exceptional architectural rigor. The multi-agent orchestration pipeline demonstrates measurable 4x reduction in API latencies compared to standard LangChain wrappers. Highly recommend proceeding to institutional syndicate diligence.'
  );
  const [criteria, setCriteria] = useState({
    productMarketFit: 9,
    teamStrength: 10,
    techDefensibility: 9,
    scalability: 9,
  });
  const [strengths, setStrengths] = useState<string[]>([
    'High-throughput sub-50ms distributed vector graph retrieval',
    'Enterprise-ready granular attribute access control (ABAC)',
    'Exceptional founder technical depth and execution cadence',
  ]);
  const [growthAreas, setGrowthAreas] = useState<string[]>([
    'Secure SOC2 Type II compliance audit prior to Tier-1 enterprise multi-seat expansion',
    'Formalize annual enterprise ACV contract tiers ($35k - $80k bands)',
  ]);
  const [newStrength, setNewStrength] = useState('');
  const [newGrowthArea, setNewGrowthArea] = useState('');
  const [isEvalSaved, setIsEvalSaved] = useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !mentorship?.id) return;
    try {
      const raw = localStorage.getItem(`xentro_mentorship_eval_${mentorship.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.score !== undefined) setEvalScore(parsed.score);
        if (parsed.status) setEvalStatus(parsed.status);
        if (parsed.recommendation) setEvalRecommendation(parsed.recommendation);
        if (parsed.notes) setEvalNotes(parsed.notes);
        if (parsed.criteria) setCriteria(parsed.criteria);
        if (parsed.strengths) setStrengths(parsed.strengths);
        if (parsed.growthAreas) setGrowthAreas(parsed.growthAreas);
      }
    } catch (err) {
      console.error('Failed to load mentorship evaluation:', err);
    }
  }, [mentorship?.id]);

  const handleSaveEvaluation = () => {
    if (!mentorship) return;
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          score: evalScore,
          status: evalStatus,
          recommendation: evalRecommendation,
          notes: evalNotes,
          criteria,
          strengths,
          growthAreas,
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
        localStorage.setItem(`xentro_mentorship_eval_${mentorship.id}`, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save evaluation:', err);
      }
    }
    setIsEvalSaved(true);
    showToast(`Evaluation for ${mentorship.startupName} saved successfully!`, 'success');
    setTimeout(() => setIsEvalSaved(false), 2000);
  };

  // Handle Goal Toggle
  const handleToggleGoal = (goalId: string) => {
    toggleMentorshipGoal(mentorship.id, goalId);
    setMentorship((prev) => {
      const updatedGoals = prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              status: (g.status === 'Completed' ? 'Pending' : 'Completed') as 'Completed' | 'Pending',
              completedAt: g.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0],
            }
          : g
      );
      return { ...prev, goals: updatedGoals };
    });
    showToast('Mentorship milestone updated!', 'success');
  };

  // Handle Add Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addMentorshipGoal(mentorship.id, newGoalTitle, newGoalDate || undefined);
    const newG: MENTORSHIP_GOAL = {
      id: `g_${Date.now()}`,
      title: newGoalTitle,
      status: 'Pending',
      targetDate: newGoalDate || undefined,
    };
    setMentorship((prev) => ({ ...prev, goals: [...prev.goals, newG] }));
    setIsAddGoalModalOpen(false);
    setNewGoalTitle('');
    setNewGoalDate('');
    showToast('New milestone added to mentorship roadmap!', 'success');
  };

  // Handle Progress Update
  const handleSaveProgressUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateSummary.trim()) return;
    addProgressUpdate(mentorship.id, {
      title: updateTitle,
      summary: updateSummary,
      metrics: updateMetrics || undefined,
      author: 'Dr. Arvind Swaminathan',
      role: 'Mentor',
    });
    setMentorship((prev) => ({
      ...prev,
      progressUpdates: [
        {
          id: `up_${Date.now()}`,
          title: updateTitle,
          summary: updateSummary,
          metrics: updateMetrics,
          author: 'Dr. Arvind Swaminathan',
          role: 'Mentor',
          timestamp: 'Today',
        },
        ...prev.progressUpdates,
      ],
    }));
    setIsAddUpdateModalOpen(false);
    setUpdateTitle('');
    setUpdateSummary('');
    setUpdateMetrics('');
    showToast('Progress update published and logged to timeline!', 'success');
  };

  // Handle Add Resource
  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim()) return;
    addSharedResource(mentorship.id, {
      title: resourceTitle,
      type: resourceType,
      url: resourceUrl || '#',
      uploadedBy: 'Dr. Arvind Swaminathan',
      size: '2.1 MB',
    });
    setMentorship((prev) => ({
      ...prev,
      sharedResources: [
        {
          id: `res_${Date.now()}`,
          title: resourceTitle,
          type: resourceType,
          url: resourceUrl || '#',
          uploadedBy: 'Dr. Arvind Swaminathan',
          uploadedAt: 'Today',
          size: '2.1 MB',
        },
        ...prev.sharedResources,
      ],
    }));
    setIsAddResourceModalOpen(false);
    setResourceTitle('');
    setResourceUrl('');
    showToast('Resource added to shared repository!', 'success');
  };

  // Handle Schedule Meeting
  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    const newMeet: MentorMeeting = {
      id: `meet_${Date.now()}`,
      title: meetingTitle,
      founder: {
        id: mentorship.founder.id,
        name: mentorship.founder.name,
        avatar: mentorship.founder.avatar,
        title: mentorship.founder.title,
        startupName: mentorship.startupName,
        startupStage: mentorship.startupStage,
        startupSector: mentorship.startupSector,
        location: 'Bengaluru',
        bio: '',
      },
      date: meetingDate,
      time: meetingTime,
      duration: '45 mins',
      mode: 'Video (Google Meet)',
      meetingLink: 'https://meet.google.com/xnt-men-ses',
      status: 'upcoming',
      isMentee: true,
      agenda: meetingAgenda || 'Scheduled structured mentorship advisory session.',
    };

    scheduleMentorshipMeeting(mentorship.id, newMeet);
    setMentorship((prev) => ({
      ...prev,
      nextMeeting: `${meetingDate} · ${meetingTime}`,
      meetings: [newMeet, ...prev.meetings],
    }));
    setIsScheduleModalOpen(false);
    setMeetingTitle('');
    setMeetingAgenda('');
    showToast(`Advisory session scheduled for ${meetingDate}! Meeting link created.`, 'success');
  };

  // Handle Complete Mentorship
  const handleConfirmComplete = () => {
    completeMentorship(mentorship.id, completionSummary);
    showToast('Mentorship marked as Completed! Testimonial invitation sent to founder.', 'success');
    setIsCompleteModalOpen(false);
    onBack();
  };

  // Handle End Early
  const handleConfirmEndEarly = () => {
    endMentorshipEarly(mentorship.id, endEarlyReason);
    showToast('Mentorship concluded early. Status updated to Ended Early.', 'info');
    setIsEndEarlyModalOpen(false);
    onBack();
  };

  if (!mentorship) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
        <h3 className="text-lg font-bold text-[#101212] dark:text-white">No Mentorship Selected</h3>
        <p className="text-sm text-[#565B59] dark:text-[#B6B8B7]">
          Please select an active mentorship from the list to view its workspace.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#D9FF3F] text-[#101212] font-semibold text-sm rounded-xl cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tabs: { id: WorkspaceTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'progress', label: 'Progress & Roadmap', count: mentorship.goals.length },
    { id: 'meetings', label: 'Meetings', count: mentorship.meetings.length },
    { id: 'communication', label: 'Communication' },
    { id: 'resources', label: 'Shared Resources', count: mentorship.sharedResources.length },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'timeline', label: 'Timeline', count: mentorship.timeline.length },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header with Breadcrumb & Core Identity */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white transition-all cursor-pointer"
              title="Return to Active Mentorships list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <img
                src={mentorship.founder.avatar}
                alt={mentorship.founder.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold font-sora text-[#101212] dark:text-white">
                  {mentorship.startupName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  {mentorship.duration} Structured Mentorship
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                  {mentorship.status}
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Founder: <span className="font-semibold text-[#101212] dark:text-white">{mentorship.founder.name}</span> &bull; {mentorship.startupStage} &bull; {mentorship.startupSector}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateMessages) onNavigateMessages(mentorship.founder.name);
                else showToast(`Opening chat with ${mentorship.founder.name}`);
              }}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
          </div>
        </div>

        {/* Workspace Subnav Tabs */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#262A29] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW                                           */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#565B59] tracking-wider">
                Engagement Package
              </span>
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  {mentorship.packageTitle}
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {mentorship.duration} &bull; {mentorship.paymentStatus === 'PAID' ? `₹${mentorship.price.toLocaleString('en-IN')}` : 'Complimentary Grant'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs space-y-1">
                <div className="flex justify-between text-[#565B59] dark:text-[#B6B8B7]">
                  <span>Timeline:</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{mentorship.startDate} — {mentorship.endDate}</span>
                </div>
                <div className="flex justify-between text-[#565B59] dark:text-[#B6B8B7]">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{mentorship.timeRemaining}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#565B59] tracking-wider">
                Active Focus & Rhythm
              </span>
              <p className="text-xs font-medium text-[#101212] dark:text-white leading-relaxed">
                {mentorship.currentFocus}
              </p>
              <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs">
                <span className="text-[#565B59]">Next Session:</span>
                <span className="font-bold text-[#101212] dark:text-[#D9FF3F]">{mentorship.nextMeeting || 'Pending scheduling'}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
              <span className="text-[10px] uppercase font-bold text-[#565B59] tracking-wider">
                Roadmap Completion
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#101212] dark:text-white">Milestones</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {mentorship.goals.filter((g) => g.status === 'Completed').length} / {mentorship.goals.length} Done
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-[#202422] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D9FF3F] rounded-full transition-all duration-500"
                    style={{
                      width: `${mentorship.goals.length > 0 ? (mentorship.goals.filter((g) => g.status === 'Completed').length / mentorship.goals.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Last interaction recorded: {mentorship.lastInteraction}
              </p>
            </div>
          </div>

          {/* Mentorship Focus Areas & Expected Outcomes */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#D9FF3F]" />
              <span>Charter Objectives & Target Outcomes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] tracking-wider">
                  Core Advisory Areas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mentorship.mentorshipFocus.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#565B59] tracking-wider">
                  Expected Quarter Outcomes
                </span>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  {mentorship.expectedOutcomes.map((out, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PROGRESS & ROADMAP                                 */}
      {/* ========================================================= */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Milestone Goals */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Strategic Milestone Roadmap</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Track and verify completion of objectives throughout the mentorship cycle
                </p>
              </div>
              <button
                onClick={() => setIsAddGoalModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {mentorship.goals.map((goal) => {
                const isCompleted = goal.status === 'Completed';
                return (
                  <div
                    key={goal.id}
                    onClick={() => handleToggleGoal(goal.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                        : 'bg-gray-50 dark:bg-[#202422] border-gray-100 dark:border-[#262A29] text-[#101212] dark:text-white hover:border-[#D9FF3F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#565B59] dark:text-[#8E9390] shrink-0" />
                      )}
                      <div>
                        <p className={`text-xs font-semibold ${isCompleted ? 'line-through opacity-80' : ''}`}>
                          {goal.title}
                        </p>
                        {goal.targetDate && (
                          <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">
                            Target: {goal.targetDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-200/50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Updates Feed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Founder & Mentor Progress Updates</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Asynchronous milestones, metric breakthroughs, and teardown summaries
                </p>
              </div>
              <button
                onClick={() => setIsAddUpdateModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Update</span>
              </button>
            </div>

            <div className="space-y-3">
              {mentorship.progressUpdates.length > 0 ? (
                mentorship.progressUpdates.map((up) => (
                  <div
                    key={up.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#101212] dark:text-white">
                          {up.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {up.role} &bull; {up.author}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#565B59] dark:text-[#8E9390]">
                        {up.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {up.summary}
                    </p>
                    {up.metrics && (
                      <div className="p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        📈 {up.metrics}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  No progress updates logged yet. Post an advisory memo or founder update.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MEETINGS                                           */}
      {/* ========================================================= */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Mentorship Advisory Sessions</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Scheduled calls integrated with Xentro meeting and Google Meet infrastructure
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Session</span>
              </button>
            </div>

            <div className="space-y-3">
              {mentorship.meetings.length > 0 ? (
                mentorship.meetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                          {m.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                          {m.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {m.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {m.time} ({m.duration})
                        </span>
                        <span>{m.mode}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic pt-1">
                        "{m.agenda}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {m.meetingLink && (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Join Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => showToast('Opening meeting details & rescheduling options...', 'info')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#565B59] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  No upcoming meetings scheduled. Click "Schedule Session" to set up your next 1:1 call.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: COMMUNICATION                                      */}
      {/* ========================================================= */}
      {activeTab === 'communication' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D9FF3F]" />
                <span>Dedicated Communication Channel</span>
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Integrated Xentro messaging thread between mentor and startup founders
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigateMessages) onNavigateMessages(mentorship.founder.name);
                else showToast(`Opening chat conversation with ${mentorship.founder.name}`);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>Open in Full Messenger</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                Live Thread with {mentorship.founder.name} ({mentorship.startupName})
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Audio, video, documents, and async voice memos are routed directly through your authenticated Xentro chat thread without creating separate communication silos.
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigateMessages) onNavigateMessages(mentorship.founder.name);
                else showToast(`Opening chat conversation with ${mentorship.founder.name}`);
              }}
              className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold shadow-xs hover:scale-102 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Secure Messaging Thread</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SHARED RESOURCES                                   */}
      {/* ========================================================= */}
      {activeTab === 'resources' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D9FF3F]" />
                <span>Shared Resources & Diligence Docs</span>
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Cap table models, architecture specs, diligence memos, and recommended frameworks
              </p>
            </div>
            <button
              onClick={() => setIsAddResourceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share Resource</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mentorship.sharedResources.length > 0 ? (
              mentorship.sharedResources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 text-[#101212] dark:text-[#D9FF3F]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate">
                        {res.title}
                      </h4>
                      <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                        Shared by {res.uploadedBy} &bull; {res.size || '1.5 MB'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Downloading ${res.title}...`, 'info')}
                    className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-8 text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
                No files or frameworks shared yet. Upload pitch memos, financial models, or architecture specs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: EVALUATION (Right beside to Shared Resources)        */}
      {/* ========================================================= */}
      {activeTab === 'evaluation' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6 animate-fade-slide">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29] gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F] fill-[#D9FF3F]/20" />
                  <span>Venture Mentorship Evaluation</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40">
                  {evalStatus}
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Formal diligence assessment, technical scorecards, and institutional recommendation for {mentorship.startupName}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono font-bold text-[#101212] dark:text-white">
                Score: <span className="text-[#9EBE12] dark:text-[#D9FF3F]">{evalScore}</span> / 10
              </div>
              <button
                type="button"
                onClick={handleSaveEvaluation}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {isEvalSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isEvalSaved ? 'Saved!' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>

          {/* Quick Score Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                Overall Advisory Score
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-display text-[#101212] dark:text-white">
                  {evalScore}
                </span>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">/ 10.0</span>
                <div className="flex items-center text-amber-400 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(evalScore / 2)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                Mentor Recommendation
              </span>
              <select
                value={evalRecommendation}
                onChange={(e) => setEvalRecommendation(e.target.value as any)}
                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-[#D9FF3F] outline-none cursor-pointer"
              >
                <option value="Strong Buy / Back">Strong Buy / Back</option>
                <option value="Proceed to Diligence">Proceed to Diligence</option>
                <option value="Mentor & Re-evaluate">Mentor & Re-evaluate</option>
                <option value="Pass">Pass</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-1">
              <span className="text-[10px] font-bold text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block">
                Evaluation Lifecycle
              </span>
              <select
                value={evalStatus}
                onChange={(e) => setEvalStatus(e.target.value as any)}
                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold text-[#101212] dark:text-white outline-none cursor-pointer"
              >
                <option value="Completed">Completed</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* 4 Core Diligence Criteria */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
              <span>Diligence Scorecards & Pillar Ratings</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Market Fit */}
              <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Product-Market Fit & Demand
                  </span>
                  <span className="text-xs font-mono font-bold text-[#9EBE12] dark:text-[#D9FF3F]">
                    {criteria.productMarketFit} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={criteria.productMarketFit}
                  onChange={(e) =>
                    setCriteria({ ...criteria, productMarketFit: Number(e.target.value) })
                  }
                  className="w-full accent-[#D9FF3F] cursor-pointer"
                />
                <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                  Customer conversion, churn resistance, and pilot willingness-to-pay
                </p>
              </div>

              {/* Team Strength */}
              <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Founding Team & Execution Velocity
                  </span>
                  <span className="text-xs font-mono font-bold text-[#9EBE12] dark:text-[#D9FF3F]">
                    {criteria.teamStrength} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={criteria.teamStrength}
                  onChange={(e) =>
                    setCriteria({ ...criteria, teamStrength: Number(e.target.value) })
                  }
                  className="w-full accent-[#D9FF3F] cursor-pointer"
                />
                <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                  Technical depth, coachability, speed of iteration, and leadership
                </p>
              </div>

              {/* Tech Defensibility */}
              <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Technical Defensibility & IP Moat
                  </span>
                  <span className="text-xs font-mono font-bold text-[#9EBE12] dark:text-[#D9FF3F]">
                    {criteria.techDefensibility} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={criteria.techDefensibility}
                  onChange={(e) =>
                    setCriteria({ ...criteria, techDefensibility: Number(e.target.value) })
                  }
                  className="w-full accent-[#D9FF3F] cursor-pointer"
                />
                <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                  Architecture defensibility, proprietary data, latency and patent claims
                </p>
              </div>

              {/* Scalability */}
              <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    Scalability & Unit Economics
                  </span>
                  <span className="text-xs font-mono font-bold text-[#9EBE12] dark:text-[#D9FF3F]">
                    {criteria.scalability} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={criteria.scalability}
                  onChange={(e) =>
                    setCriteria({ ...criteria, scalability: Number(e.target.value) })
                  }
                  className="w-full accent-[#D9FF3F] cursor-pointer"
                />
                <p className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                  Gross margins, expansion ACV, sales cycle repeatability, and LTV/CAC
                </p>
              </div>
            </div>
          </div>

          {/* Strategic Assessment / Mentor Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
              Strategic Assessment & Detailed Feedback
            </label>
            <textarea
              rows={4}
              value={evalNotes}
              onChange={(e) => setEvalNotes(e.target.value)}
              placeholder="Detailed synthesis of technical scalability, market dynamics, and milestones..."
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422] text-xs font-medium text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] leading-relaxed"
            />
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Strengths */}
            <div className="space-y-2 p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Key Strengths & Differentiators ({strengths.length})
              </span>
              <div className="space-y-1.5">
                {strengths.map((str, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs text-[#101212] dark:text-white">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrengths(strengths.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 pt-2">
                <input
                  type="text"
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStrength.trim()) {
                      e.preventDefault();
                      setStrengths([...strengths, newStrength.trim()]);
                      setNewStrength('');
                    }
                  }}
                  placeholder="Add key strength..."
                  className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStrength.trim()) {
                      setStrengths([...strengths, newStrength.trim()]);
                      setNewStrength('');
                    }
                  }}
                  className="px-2.5 h-8 rounded-lg bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Growth Areas */}
            <div className="space-y-2 p-4 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                Growth Areas & Diligence Checkpoints ({growthAreas.length})
              </span>
              <div className="space-y-1.5">
                {growthAreas.map((ga, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs text-[#101212] dark:text-white">
                    <div className="flex items-start gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{ga}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGrowthAreas(growthAreas.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 pt-2">
                <input
                  type="text"
                  value={newGrowthArea}
                  onChange={(e) => setNewGrowthArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGrowthArea.trim()) {
                      e.preventDefault();
                      setGrowthAreas([...growthAreas, newGrowthArea.trim()]);
                      setNewGrowthArea('');
                    }
                  }}
                  placeholder="Add growth checkpoint..."
                  className="flex-1 h-8 px-2.5 rounded-lg border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newGrowthArea.trim()) {
                      setGrowthAreas([...growthAreas, newGrowthArea.trim()]);
                      setNewGrowthArea('');
                    }
                  }}
                  className="px-2.5 h-8 rounded-lg bg-amber-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: TIMELINE                                           */}
      {/* ========================================================= */}
      {activeTab === 'timeline' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D9FF3F]" />
              <span>Mentorship Chronological Timeline</span>
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Complete immutable event audit trail of meetings, milestones, and shared assets
            </p>
          </div>

          <div className="space-y-4 relative pl-4 border-l-2 border-gray-200 dark:border-[#262A29] ml-2">
            {mentorship.timeline.map((evt) => (
              <div key={evt.id} className="relative space-y-1">
                <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[#D9FF3F] ring-4 ring-white dark:ring-[#181B1A]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101212] dark:text-white">
                    {evt.title}
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#8E9390]">
                    {evt.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  {evt.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: ACTIONS                                            */}
      {/* ========================================================= */}
      {activeTab === 'actions' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D9FF3F]" />
              <span>Mentorship Governance & Lifecycle Actions</span>
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Administrative tools for concluding, graduating, or terminating the engagement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Graduate & Complete Mentorship
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Mark this structured cycle as successfully completed. Automatically dispatches a Founder Testimonial request to {mentorship.founder.name}.
                </p>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Mentorship Cycle</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-red-900 dark:text-red-300">
                  End Mentorship Early
                </h4>
                <p className="text-[11px] text-red-700 dark:text-red-400">
                  Conclude the active advisory engagement early due to mutual agreement, startup pivot, or scheduling conflict.
                </p>
              </div>
              <button
                onClick={() => setIsEndEarlyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>End Engagement Early</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MILESTONE GOAL                                 */}
      {/* ========================================================= */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Add Strategic Milestone
              </h3>
              <button onClick={() => setIsAddGoalModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Milestone Objective
                </label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Sub-50ms vector query latency benchmark"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Target Completion Date (Optional)
                </label>
                <input
                  type="text"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  placeholder="e.g. 15 Oct 2026 or Next 2 Weeks"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: POST PROGRESS UPDATE                               */}
      {/* ========================================================= */}
      {isAddUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Publish Progress Update
              </h3>
              <button onClick={() => setIsAddUpdateModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProgressUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Update Title
                </label>
                <input
                  type="text"
                  required
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. SAFE Syndicate Diligence Memo Teardown"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Key Findings & Summary
                </label>
                <textarea
                  required
                  rows={3}
                  value={updateSummary}
                  onChange={(e) => setUpdateSummary(e.target.value)}
                  placeholder="Summary of recommendations, advisory feedback, or breakthrough results..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Verified Metric Callout (Optional)
                </label>
                <input
                  type="text"
                  value={updateMetrics}
                  onChange={(e) => setUpdateMetrics(e.target.value)}
                  placeholder="e.g. $250k soft commitments reached"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUpdateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SHARE RESOURCE                                     */}
      {/* ========================================================= */}
      {isAddResourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Share Resource or Diligence File
              </h3>
              <button onClick={() => setIsAddResourceModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveResource} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. SAFE_CapTable_Sensitivity_Analysis.xlsx"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Resource Type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden"
                >
                  <option value="document">PDF Document</option>
                  <option value="spreadsheet">Spreadsheet / Model</option>
                  <option value="link">Web Link / Cloud Workspace</option>
                  <option value="file">Code / Notebook File</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddResourceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs"
                >
                  Upload & Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SCHEDULE SESSION                                   */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-[#101212] dark:text-white">
                Schedule Mentorship Session
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMeeting} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Session Topic
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Bi-Weekly Advisory: Enterprise ICP & Security Review"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    placeholder="e.g. Thu, 25 Sep"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 04:00 PM – 04:45 PM"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                  Agenda & Preparation Notes
                </label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="Review Slide 8 of pitch deck and address SOC2 audit questions..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold shadow-2xs"
                >
                  Generate Meet Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COMPLETE MENTORSHIP                                */}
      {/* ========================================================= */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Graduate Mentorship Cycle</span>
              </h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Concluding this mentorship moves <span className="font-semibold text-[#101212] dark:text-white">{mentorship.startupName}</span> to your Mentorship History. An automated request will be dispatched to <span className="font-semibold text-[#101212] dark:text-white">{mentorship.founder.name}</span> to submit a founder testimonial.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                Final Outcome Summary
              </label>
              <textarea
                rows={3}
                value={completionSummary}
                onChange={(e) => setCompletionSummary(e.target.value)}
                placeholder="e.g. Successfully finalized SAFE round structuring and optimized query latency to 42ms."
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: END EARLY                                          */}
      {/* ========================================================= */}
      {isEndEarlyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>End Mentorship Early</span>
              </h3>
              <button onClick={() => setIsEndEarlyModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Please state the reason for concluding this advisory engagement before its scheduled end date.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] block mb-1">
                Reason for Early Conclusion
              </label>
              <textarea
                required
                rows={3}
                value={endEarlyReason}
                onChange={(e) => setEndEarlyReason(e.target.value)}
                placeholder="e.g. Mutual agreement due to startup pivot..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEndEarlyModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#565B59]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndEarly}
                className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700"
              >
                End Engagement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
