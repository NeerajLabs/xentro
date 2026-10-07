'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Tag,
  Globe,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Info,
  ImageIcon,
} from 'lucide-react';
import { UserProfile, defaultProfiles, UserRole, GUEST_AVATAR } from '@/lib/userProfile';
import { feedService, CreatePostInput } from '@/lib/feedService';
import { Post } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  initialIntent?: string;
  initialImageUrl?: string;
  onPostCreated?: (newPost: Post) => void;
}

type ExtendedRole = UserRole | 'student';

interface PersonaOption {
  role: ExtendedRole;
  name: string;
  roleTitle: string;
  organization: string;
  avatar: string;
  badgeLabel: string;
  color: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    role: 'startup',
    name: '',
    roleTitle: 'Startup Founder',
    organization: '',
    avatar: '',
    badgeLabel: 'Startup Founder',
    color: 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/40',
  },
  {
    role: 'investor',
    name: '',
    roleTitle: 'Investment Partner',
    organization: '',
    avatar: '',
    badgeLabel: 'Venture Investor',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    role: 'mentor',
    name: '',
    roleTitle: 'Advisory Mentor',
    organization: '',
    avatar: '',
    badgeLabel: 'Advisory Mentor',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  },
  {
    role: 'esp',
    name: '',
    roleTitle: 'Incubator / ESP',
    organization: '',
    avatar: '',
    badgeLabel: 'Incubator / ESP',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  },
  {
    role: 'student',
    name: '',
    roleTitle: 'Student Innovator',
    organization: '',
    avatar: '',
    badgeLabel: 'Student Innovator',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  {
    role: 'explorer',
    name: 'Ecosystem Explorer',
    roleTitle: 'Guest Member',
    organization: 'Xentro Ecosystem',
    avatar: GUEST_AVATAR,
    badgeLabel: 'Explorer',
    color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
  },
];

// Presets by role for post types
const POST_TYPES_BY_ROLE: Record<ExtendedRole, string[]> = {
  startup: [
    'Company Update',
    'Product Launch',
    'Fundraising Milestone',
    'Hiring / Talent Ask',
    'Tech Insight',
  ],
  investor: [
    'Investment Thesis',
    'Portfolio Spotlight',
    'Call for Pitches',
    'Market Perspective',
    'Co-investment Opportunity',
  ],
  mentor: [
    'Mentorship Insight',
    'Office Hours Announcement',
    'AMA / Founder Advice',
    'Architecture & Scale Tip',
    'Workshop Call',
  ],
  esp: [
    'Cohort Applications Open',
    'Grant / Funding Call',
    'Demo Day Announcement',
    'Student Spotlight',
    'Ecosystem Alliance',
  ],
  student: [
    'Project Showcase',
    'Co-founder Search',
    'Hackathon Win',
    'Prototype Demo',
    'Learning Journey',
  ],
  explorer: [
    'Community Inquiry',
    'Ecosystem Feedback',
    'General Note',
    'Collaboration Request',
  ],
};

// Suggested tags by role
const SUGGESTED_TAGS_BY_ROLE: Record<ExtendedRole, string[]> = {
  startup: ['BuildInPublic', 'TechLaunch', 'Fundraising', 'AI', 'SaaS', 'Hiring'],
  investor: ['VentureCapital', 'AngelInvesting', 'SeedFunding', 'FinTech', 'DeepTech', 'PortfolioUpdate'],
  mentor: ['Mentorship', 'StartupAdvice', 'EngineeringExcellence', 'ScaleUp', 'SystemDesign'],
  esp: ['Incubation', 'DemoDay', 'Accelerator', 'GrantOpportunity', 'StudentInnovators', 'UniversityHub'],
  student: ['StudentFounder', 'StudentInnovator', 'NextGenTech', 'HardwareLab', 'AIResearch'],
  explorer: ['Ecosystem', 'Networking', 'Exploration', 'Innovation', 'Community'],
};

// Curated high quality media presets
const MEDIA_PRESETS = [
  {
    label: 'AI & Autonomous Systems',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    caption: 'Next-Gen Autonomous Architecture',
  },
  {
    label: 'Minimalist Workspace',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200&auto=format&fit=crop&q=80',
    caption: 'Deep Focus Studio & Building Sprint',
  },
  {
    label: 'Venture & Growth',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
    caption: 'Strategic Board & Investment Session',
  },
  {
    label: 'Innovation Lab',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
    caption: 'Incubation Lab & Prototype Validation',
  },
  {
    label: 'Demo Day & Pitch',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    caption: 'Cohort Showcase & Investor Pitch',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  initialIntent,
  initialImageUrl,
  onPostCreated,
}) => {
  const { showToast } = useToast();
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Active persona for the post
  const [selectedRole, setSelectedRole] = useState<ExtendedRole>(
    currentUserProfile.role || 'startup'
  );
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  // Form states
  const [postType, setPostType] = useState<string>('Company Update');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Media & Upload states
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaCaption, setMediaCaption] = useState<string>('');
  const [isShowingPresetList, setIsShowingPresetList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Sync role and defaults when opened
  useEffect(() => {
    if (isOpen) {
      const initialRole = (currentUserProfile.role || 'startup') as ExtendedRole;
      setSelectedRole(initialRole);
      const defaultTypes = POST_TYPES_BY_ROLE[initialRole] || POST_TYPES_BY_ROLE.startup;
      setPostType(defaultTypes[0]);
      setSelectedTags(SUGGESTED_TAGS_BY_ROLE[initialRole].slice(0, 3));

      // Handle image or intent
      if (initialImageUrl) {
        setMediaUrl(initialImageUrl);
        setShowMediaSection(true);
      } else if (initialIntent === 'upload-image' || initialIntent === 'media') {
        setShowMediaSection(true);
      } else if (initialIntent === 'milestone') {
        setPostType(defaultTypes[0] || 'Milestone');
      } else if (initialIntent === 'opportunity') {
        setPostType(defaultTypes.find((t) => t.includes('Opportunity') || t.includes('Call')) || 'Opportunity');
        setCategory('opportunities');
      } else if (initialIntent === 'tags') {
        setIsAddingTag(true);
      }
    }
  }, [isOpen, currentUserProfile.role, initialIntent, initialImageUrl]);

  // Handle persona change
  const handleSelectPersona = (role: ExtendedRole) => {
    setSelectedRole(role);
    setIsPersonaMenuOpen(false);
    const availableTypes = POST_TYPES_BY_ROLE[role];
    if (availableTypes && availableTypes.length > 0) {
      setPostType(availableTypes[0]);
    }
    const tags = SUGGESTED_TAGS_BY_ROLE[role] || [];
    setSelectedTags(tags.slice(0, 3));
  };

  // Tag helpers
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
      setIsAddingTag(false);
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setMediaUrl(dataUrl);
      setShowMediaSection(true);
      if (!mediaCaption) {
        setMediaCaption(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Author identity is ALWAYS the signed-in user's real profile (never a demo persona).
  // The role-specific presets only drive labels/colors, not names or avatars.
  const rolePreset = PERSONA_OPTIONS.find((p) => p.role === selectedRole);
  const currentPersona: PersonaOption = {
    role: selectedRole,
    name: currentUserProfile.name || 'You',
    roleTitle:
      currentUserProfile.roleTitle || (selectedRole === 'explorer' ? 'Ecosystem Explorer' : ''),
    organization: currentUserProfile.organization || (selectedRole === 'explorer' ? 'Xentro Ecosystem' : ''),
    avatar: currentUserProfile.avatar || GUEST_AVATAR,
    badgeLabel: rolePreset?.badgeLabel || 'Xentro User',
    color: rolePreset?.color || 'bg-gray-100 text-[#101212] border-gray-300',
  };

  // Placeholder customized by role
  const getPlaceholder = () => {
    switch (selectedRole) {
      case 'startup':
        return `What's the latest milestone at ${currentPersona.organization}? Share product progress, metrics, tech breakthroughs, or open asks with the ecosystem...`;
      case 'investor':
        return 'Share your current investment thesis, market observations, portfolio highlights, or invite founders to connect...';
      case 'mentor':
        return 'Share a high-leverage architectural tip, startup operating framework, mentorship insight, or office hours availability...';
      case 'esp':
        return `Announce cohort openings at ${currentPersona.organization}, grant deadlines, upcoming Demo Days, or spotlight student innovators...`;
      case 'student':
        return 'Share what you are building, prototype demo links, hackathon results, or search for co-founders and early testers...';
      default:
        return "What's happening in your venture or ecosystem? Write your post...";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Use active user's actual profile if available for the selected role
      const isSelectedOwnRole = selectedRole === currentUserProfile.role;
      const authorName = (isSelectedOwnRole && currentUserProfile.name?.trim())
        ? currentUserProfile.name.trim()
        : currentPersona.name;
      const authorRoleTitle = (isSelectedOwnRole && currentUserProfile.roleTitle?.trim())
        ? currentUserProfile.roleTitle.trim()
        : currentPersona.roleTitle;
      const authorCompany = (isSelectedOwnRole && currentUserProfile.organization?.trim())
        ? currentUserProfile.organization.trim()
        : currentPersona.organization;
      const authorAvatar = (isSelectedOwnRole && currentUserProfile.avatar)
        ? currentUserProfile.avatar
        : currentPersona.avatar;

      const authorData = {
        id: currentUserProfile.id || `user_${selectedRole}_${Date.now()}`,
        name: authorName,
        username: authorName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member',
        role: authorRoleTitle,
        company: authorCompany,
        avatar: authorAvatar,
        verified: isSelectedOwnRole ? true : false,
      };

      const newPostInput: CreatePostInput = {
        content: content.trim(),
        author: authorData,
        authorRoleType: selectedRole,
        category: category,
        postType: postType,
        tags: selectedTags,
        media: mediaUrl.trim()
          ? {
              type: 'image',
              url: mediaUrl.trim(),
              alt: mediaCaption.trim() || `${currentPersona.name} post graphic`,
              caption: mediaCaption.trim() || postType,
            }
          : undefined,
      };

      const created = feedService.createPost(newPostInput);

      showToast('Post published to the Universal Feed!', 'success');

      // Reset
      setContent('');
      setMediaUrl('');
      setMediaCaption('');
      setShowMediaSection(false);

      if (onPostCreated) {
        onPostCreated(created);
      }

      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
      showToast('Failed to publish post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    /* Modal Wrapper anchored at the top-center (items-start pt-6 sm:pt-10) so it appears RIGHT THERE without going down */
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto pt-6 sm:pt-10 pb-6 sm:pb-10">
      {/* Hidden file input for modal uploads */}
      <input
        type="file"
        ref={modalFileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div
        className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-5rem)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between bg-white dark:bg-[#181B1A] sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#101212] dark:text-white leading-tight">
                Create a Post
              </h3>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Broadcast to Universal Feed & Ecosystem Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* 1. Author Persona Selector Card */}
          <div className="bg-gray-50 dark:bg-[#101212] rounded-2xl p-3 border border-[#E5E7EB] dark:border-[#262A29] relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#101212] dark:text-white truncate">
                      {currentPersona.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentPersona.color}`}
                    >
                      {currentPersona.badgeLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                    {currentPersona.roleTitle} · {currentPersona.organization}
                  </p>
                </div>
              </div>

              {/* Identity indicator (demo persona switcher removed: posts always publish as YOUR profile) */}
              <div className="relative flex-shrink-0">
                <span
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[11px] font-bold text-[#565B59] dark:text-[#B6B8B7] inline-flex items-center gap-1.5"
                  title="Posts always publish using your active profile"
                >
                  Posting as you
                </span>

                {/* Dropdown Menu for all User Types */}
                {isPersonaMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-2xl py-2 z-30 animate-fade-slide">
                    <div className="px-3 py-1.5 border-b border-gray-100 dark:border-[#262A29] text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
                      Switch User Type Persona
                    </div>
                    {PERSONA_OPTIONS.map((persona) => {
                      const isSelected = selectedRole === persona.role;
                      return (
                        <button
                          key={persona.role}
                          type="button"
                          onClick={() => handleSelectPersona(persona.role)}
                          className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-[#202422] transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/5' : ''
                          }`}
                        >
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#101212] dark:text-white truncate">
                                {persona.name}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#9EBE12]" />
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 truncate block">
                              {persona.badgeLabel} · {persona.organization}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Post Intent / Type Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] mb-1.5">
              Select Post Type:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(POST_TYPES_BY_ROLE[selectedRole] || POST_TYPES_BY_ROLE.startup).map(
                (type) => {
                  const isSelected = postType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPostType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] dark:hover:bg-[#282D2B] text-[#565B59] dark:text-[#B6B8B7]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 3. Main Post Content Area */}
          <div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getPlaceholder()}
              maxLength={3000}
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#101212] border border-[#E5E7EB] dark:border-[#262A29] focus:outline-none focus:border-[#D9FF3F] text-sm text-[#101212] dark:text-white placeholder-[#8E9290] resize-none transition-all leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-[#8E9290] mt-1 px-1">
              <span>Supports hashtags, URLs, and multi-line formatting</span>
              <span>{content.length} / 3,000</span>
            </div>
          </div>

          {/* 4. Upload Image Section - RIGHT HERE beneath textarea */}
          {mediaUrl ? (
            /* Image Preview Card */
            <div className="rounded-2xl border border-gray-200 dark:border-[#262A29] p-3 bg-gray-50 dark:bg-[#101212] space-y-2.5 animate-fade-slide">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Attached Image</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F] hover:underline cursor-pointer"
                  >
                    Change Image
                  </button>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl('');
                      setMediaCaption('');
                    }}
                    className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden max-h-52 bg-black/10 border border-gray-200 dark:border-[#262A29]">
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-48 object-cover"
                />
              </div>

              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Add optional image caption or banner title..."
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
              />
            </div>
          ) : showMediaSection ? (
            /* Upload Image Dropzone & Selector */
            <div className="rounded-2xl border border-gray-200 dark:border-[#262A29] p-3.5 bg-gray-50 dark:bg-[#101212] space-y-3 animate-fade-slide">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Upload Image</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMediaSection(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => modalFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingOver
                    ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                    : 'border-gray-200 dark:border-[#2A2E2C] hover:border-[#D9FF3F] bg-white dark:bg-[#181B1A]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  Click to browse or drag & drop image here
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Supports PNG, JPG, GIF, WebP up to 10MB
                </p>
              </div>

              {/* Presets and URL accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsShowingPresetList(!isShowingPresetList)}
                  className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 text-[#D9FF3F]" />
                  <span>Or choose from curated preset graphics & URL</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isShowingPresetList ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isShowingPresetList && (
                  <div className="mt-2.5 space-y-2 pt-2 border-t border-gray-200 dark:border-[#262A29]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {MEDIA_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setMediaUrl(preset.url);
                            setMediaCaption(preset.caption);
                          }}
                          className="text-left p-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:border-[#D9FF3F] text-[10px] font-semibold transition-all cursor-pointer flex flex-col gap-0.5"
                        >
                          <span className="truncate font-bold text-[#101212] dark:text-white">
                            {preset.label}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate">
                            {preset.caption}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload Image Trigger Button right beneath textarea */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-gray-50 hover:bg-gray-100 dark:bg-[#101212] dark:hover:bg-[#181B1A] text-xs font-semibold text-[#101212] dark:text-white transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Upload Image</span>
              </button>
            </div>
          )}

          {/* 5. Topic Tags Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>Topic Tags</span>
              </label>

              {!isAddingTag ? (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[11px] font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Custom Tag
                </button>
              ) : (
                <form
                  onSubmit={handleAddCustomTag}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="e.g. CleanTech"
                    className="px-2 py-0.5 text-xs rounded-lg bg-gray-50 dark:bg-[#101212] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#D9FF3F]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTag(false);
                      setCustomTagInput('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>

            {/* Tags Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(SUGGESTED_TAGS_BY_ROLE[selectedRole] || []).map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    <span>#{tag}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}

              {/* Any custom added tags not in suggested list */}
              {selectedTags
                .filter(
                  (t) =>
                    !(SUGGESTED_TAGS_BY_ROLE[selectedRole] || []).includes(t)
                )
                .map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>

          {/* 6. Feed Visibility / Category Target */}
          <div className="flex items-center justify-between text-xs text-[#565B59] dark:text-[#B6B8B7] pt-2 border-t border-gray-100 dark:border-[#262A29]">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Visible to:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent font-bold text-[#101212] dark:text-white underline cursor-pointer focus:outline-none"
              >
                <option value="all" className="bg-white dark:bg-[#181B1A]">
                  Universal Feed (All Ecosystem)
                </option>
                <option value="opportunities" className="bg-white dark:bg-[#181B1A]">
                  Opportunities & Asks
                </option>
                <option value="investors" className="bg-white dark:bg-[#181B1A]">
                  Investors & Funds
                </option>
                <option value="mentors" className="bg-white dark:bg-[#181B1A]">
                  Mentors & Advisors
                </option>
                <option value="following" className="bg-white dark:bg-[#181B1A]">
                  My Connections & Followers
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#8E9290]">
              <Info className="w-3 h-3" />
              <span>Instant broadcast</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between bg-white dark:bg-[#181B1A] sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-[#101212] shadow-sm transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish to Feed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
