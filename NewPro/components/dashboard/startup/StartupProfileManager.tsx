'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Globe,
  Upload,
  Video,
  FileText,
  Users,
  Eye,
  Plus,
  Trash2,
  Check,
  Save,
  Lock,
  Sparkles,
  ExternalLink,
  Play,
  X,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Search,
  UserCheck,
  UserPlus,
  Pencil,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { initialStartupWorkspaceData, StartupWorkspaceData } from '@/data/startupWorkspaceData';
import { StartupTeamWorkspace } from './team/StartupTeamWorkspace';
import { useToast } from '@/components/ui/Toast';
import {
  getStartupGhostMode,
  setStartupGhostMode,
  getStartupPitchVideo,
  setStartupPitchVideo,
  getStartupPitchDeck,
  setStartupPitchDeck,
  uploadStartupPitchDeck,
  replaceStartupPitchDeck,
  updateStartupPitchDeckMetadata,
  removeStartupPitchDeck,
  getStartupTeamMembers,
  setStartupTeamMembers,
  getStartupProblem,
  setStartupProblem,
  getStartupSolution,
  setStartupSolution,
  getStartupProduct,
  setStartupProduct,
  getStartupCompanyInfo,
  setStartupCompanyInfo,
  getStartupMarket,
  setStartupMarket,
  getStartupBusinessModel,
  setStartupBusinessModel,
  getStartupBasicInfo,
  setStartupBasicInfo,
  type StartupBasicInfo,
} from '@/lib/startupProfileState';
import {
  mockRecommendedMentors,
  mockRecommendedInvestors,
  mockRecommendedStartups,
} from '@/data/discoverData';
import {
  ElevatorPitchVideo,
  PitchDeckDoc,
  StartupTeamMember,
  StartupProblem,
  StartupSolution,
  StartupProduct,
  StartupCompanyInfo,
  StartupMarket,
  StartupBusinessModel,
  ProductStatus,
} from '@/types/startup';

interface StartupProfileManagerProps {
  onPreviewPublicProfile: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const StartupProfileManager: React.FC<StartupProfileManagerProps> = ({
  onPreviewPublicProfile,
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'basic' | 'pitch' | 'team' | 'narrative'>('basic');

  // Form states for Basic Info
  const [basicInfo, setBasicInfo] = useState<StartupBasicInfo>(getStartupBasicInfo());

  // Pitch Deck state from canonical storage
  const [elevatorVideo, setElevatorVideo] = useState<ElevatorPitchVideo | null>(getStartupPitchVideo());
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoEditorOpen, setIsVideoEditorOpen] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: elevatorVideo?.title || 'Xentro 3-Minute Founder Elevator Pitch (v2.4)',
    presenterName: elevatorVideo?.presenterName || 'Founder',
    presenterRole: elevatorVideo?.presenterRole || 'Founder & CEO',
    duration: elevatorVideo?.duration || '2:48 min',
    videoUrl: elevatorVideo?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: elevatorVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  });

  const [pitchDeck, setPitchDeck] = useState<PitchDeckDoc | null>(getStartupPitchDeck());
  const deckFileInputRef = useRef<HTMLInputElement>(null);
  const [isDeckViewerOpen, setIsDeckViewerOpen] = useState(false);
  const [currentViewerSlide, setCurrentViewerSlide] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    fileName: '',
    description: '',
    version: '',
    slideCount: 12,
    visibility: 'Public' as PitchDeckDoc['visibility'],
    allowDownload: false,
    fileUrl: '',
  });

  useEffect(() => {
    const handlePitchDeckChanged = (e: Event) => {
      const ce = e as CustomEvent;
      setPitchDeck(ce.detail?.deck !== undefined ? ce.detail.deck : getStartupPitchDeck());
    };
    window.addEventListener('xentro-pitch-deck-changed', handlePitchDeckChanged);
    return () => {
      window.removeEventListener('xentro-pitch-deck-changed', handlePitchDeckChanged);
    };
  }, []);

  const [pitchSubSection, setPitchSubSection] = useState<
    'all' | 'video' | 'deck' | 'problem' | 'solution' | 'product' | 'market' | 'business'
  >('all');

  const [problem, setProblem] = useState<StartupProblem>(getStartupProblem());
  const [solution, setSolution] = useState<StartupSolution>(getStartupSolution());
  const [product, setProduct] = useState<StartupProduct>(getStartupProduct());
  const [companyInfo, setCompanyInfo] = useState<StartupCompanyInfo>(getStartupCompanyInfo());
  const [market, setMarket] = useState<StartupMarket>(getStartupMarket());
  const [businessModel, setBusinessModel] = useState<StartupBusinessModel>(getStartupBusinessModel());

  const [newPainPoint, setNewPainPoint] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newScreenshot, setNewScreenshot] = useState('');
  const [newRevenueStream, setNewRevenueStream] = useState('');
  const [newGeography, setNewGeography] = useState('');

  useEffect(() => {
    const handleProblemChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.problem) setProblem(ce.detail.problem);
    };
    const handleSolutionChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.solution) setSolution(ce.detail.solution);
    };
    const handleProductChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.product) setProduct(ce.detail.product);
    };
    const handleCompanyInfoChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.companyInfo) setCompanyInfo(ce.detail.companyInfo);
    };
    const handleMarketChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.market) setMarket(ce.detail.market);
    };
    const handleBusinessModelChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.businessModel) setBusinessModel(ce.detail.businessModel);
    };
    const handleBasicInfoChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.basicInfo) setBasicInfo(ce.detail.basicInfo);
    };

    window.addEventListener('xentro-startup-problem-changed', handleProblemChanged);
    window.addEventListener('xentro-startup-solution-changed', handleSolutionChanged);
    window.addEventListener('xentro-startup-product-changed', handleProductChanged);
    window.addEventListener('xentro-startup-company-info-changed', handleCompanyInfoChanged);
    window.addEventListener('xentro-startup-market-changed', handleMarketChanged);
    window.addEventListener('xentro-startup-business-model-changed', handleBusinessModelChanged);
    window.addEventListener('xentro-startup-basic-info-changed', handleBasicInfoChanged);

    return () => {
      window.removeEventListener('xentro-startup-problem-changed', handleProblemChanged);
      window.removeEventListener('xentro-startup-solution-changed', handleSolutionChanged);
      window.removeEventListener('xentro-startup-product-changed', handleProductChanged);
      window.removeEventListener('xentro-startup-company-info-changed', handleCompanyInfoChanged);
      window.removeEventListener('xentro-startup-market-changed', handleMarketChanged);
      window.removeEventListener('xentro-startup-business-model-changed', handleBusinessModelChanged);
      window.removeEventListener('xentro-startup-basic-info-changed', handleBasicInfoChanged);
    };
  }, []);

  // Team members from canonical storage
  const [teamMembers, setTeamMembers] = useState<StartupTeamMember[]>(getStartupTeamMembers());

  // Platform users for tagging
  const platformUsers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      role: string;
      avatar: string;
      bio: string;
      category: 'founder' | 'leadership' | 'core' | 'advisor';
    }> = [];

    mockRecommendedMentors.forEach((m) => {
      list.push({
        id: m.id,
        name: m.name,
        role: m.title,
        avatar: m.avatar,
        bio: m.bio || m.expertise.join(', '),
        category: 'advisor',
      });
    });

    mockRecommendedInvestors.forEach((inv) => {
      list.push({
        id: inv.id,
        name: inv.name,
        role: inv.investorType || 'Investor',
        avatar: inv.logo,
        bio: `${inv.location} · ${inv.focusIndustries.join(', ')}`,
        category: 'advisor',
      });
    });

    mockRecommendedStartups.forEach((st) => {
      if (st.founder) {
        list.push({
          id: `usr_${st.id}`,
          name: st.founder.name,
          role: st.founder.role,
          avatar: st.founder.avatar,
          bio: `${st.name} · ${st.industry}`,
          category: 'founder',
        });
      }
    });

    return list;
  }, []);

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    category: 'core' as 'founder' | 'leadership' | 'core' | 'advisor',
    xentroHandle: '',
    bio: '',
    avatar: '',
  });

  // Talent requirements
  const [openRoles, setOpenRoles] = useState([
    {
      id: 'role_1',
      roleTitle: 'Founding Lead Distributed AI Systems Engineer',
      type: 'Developer / CTO',
      commitment: 'Full-time',
      equityStipend: '2.0% - 4.0% Equity + Pre-Seed Stipend',
      location: 'Bengaluru / Hybrid',
    },
    {
      id: 'role_2',
      roleTitle: 'Enterprise GTM & Partnerships Co-founder',
      type: 'Co-founder',
      commitment: 'Full-time',
      equityStipend: '8.0% - 15.0% Equity',
      location: 'Bengaluru, India',
    },
  ]);

  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [isGhostConfirmOpen, setIsGhostConfirmOpen] = useState(false);

  useEffect(() => {
    setIsGhostMode(getStartupGhostMode());
    const handleGhostChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.isGhostMode !== undefined) {
        setIsGhostMode(ce.detail.isGhostMode);
      }
    };
    window.addEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    return () => {
      window.removeEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    };
  }, []);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isAnyModalOpen =
      isVideoEditorOpen ||
      isVideoModalOpen ||
      isDeckViewerOpen ||
      isEditModalOpen ||
      isRemoveConfirmOpen ||
      isGhostConfirmOpen;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isVideoEditorOpen,
    isVideoModalOpen,
    isDeckViewerOpen,
    isEditModalOpen,
    isRemoveConfirmOpen,
    isGhostConfirmOpen,
  ]);

  // Real-time automatic synchronization helpers across profile and public views
  const updateBasicInfoField = (field: keyof StartupBasicInfo, value: string) => {
    const updated = { ...basicInfo, [field]: value };
    setBasicInfo(updated);
    setStartupBasicInfo(updated);
  };

  const updateCompanyInfoField = (field: keyof StartupCompanyInfo, value: any) => {
    const updated = { ...companyInfo, [field]: value };
    setCompanyInfo(updated);
    setStartupCompanyInfo(updated);
  };

  const updateProblemField = (field: keyof StartupProblem, value: any) => {
    const updated = { ...problem, [field]: value };
    setProblem(updated);
    setStartupProblem(updated);
  };

  const updateSolutionField = (field: keyof StartupSolution, value: any) => {
    const updated = { ...solution, [field]: value };
    setSolution(updated);
    setStartupSolution(updated);
  };

  const updateProductField = (field: keyof StartupProduct, value: any) => {
    const updated = { ...product, [field]: value };
    setProduct(updated);
    setStartupProduct(updated);
  };

  const updateMarketField = (field: keyof StartupMarket, value: any) => {
    const updated = { ...market, [field]: value };
    setMarket(updated);
    setStartupMarket(updated);
  };

  const updateBusinessModelField = (field: keyof StartupBusinessModel, value: any) => {
    const updated = { ...businessModel, [field]: value };
    setBusinessModel(updated);
    setStartupBusinessModel(updated);
  };

  const handleSave = () => {
    setStartupBasicInfo(basicInfo);
    setStartupProblem(problem);
    setStartupSolution(solution);
    setStartupProduct(product);
    setStartupCompanyInfo(companyInfo);
    setStartupMarket(market);
    setStartupBusinessModel(businessModel);
    showToast('All startup profile & pitch deck changes saved successfully!', 'success');
  };

  const handleSaveBasicInfo = () => {
    setStartupBasicInfo(basicInfo);
    showToast('Basic info & startup identity saved successfully!', 'success');
  };

  const handleSaveProblem = () => {
    setStartupProblem(problem);
    showToast('Problem statement & pain points updated', 'success');
  };

  const handleSaveSolution = () => {
    setStartupSolution(solution);
    showToast('Solution & value proposition updated', 'success');
  };

  const handleSaveProduct = () => {
    setStartupProduct(product);
    showToast('Product & service details updated', 'success');
  };

  const handleSaveCompanyInfo = () => {
    setStartupCompanyInfo(companyInfo);
    showToast('Company information & statutory details updated', 'success');
  };

  const handleSaveMarket = () => {
    setStartupMarket(market);
    showToast('Market opportunity & sizing (TAM/SAM/SOM) updated', 'success');
  };

  const handleSaveBusinessModel = () => {
    setStartupBusinessModel(businessModel);
    showToast('Business model & monetization architecture updated', 'success');
  };

  const handleAddPainPoint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPainPoint.trim()) return;
    const updated: StartupProblem = {
      ...problem,
      painPoints: [...problem.painPoints, newPainPoint.trim()],
    };
    setProblem(updated);
    setStartupProblem(updated);
    setNewPainPoint('');
    showToast('Pain point added', 'info');
  };

  const handleRemovePainPoint = (index: number) => {
    const updated: StartupProblem = {
      ...problem,
      painPoints: problem.painPoints.filter((_, i) => i !== index),
    };
    setProblem(updated);
    setStartupProblem(updated);
    showToast('Pain point removed', 'info');
  };

  const handleAddDifferentiator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newDifferentiator.trim()) return;
    const updated: StartupSolution = {
      ...solution,
      keyDifferentiators: [...solution.keyDifferentiators, newDifferentiator.trim()],
    };
    setSolution(updated);
    setStartupSolution(updated);
    setNewDifferentiator('');
    showToast('Key differentiator added', 'info');
  };

  const handleRemoveDifferentiator = (index: number) => {
    const updated: StartupSolution = {
      ...solution,
      keyDifferentiators: solution.keyDifferentiators.filter((_, i) => i !== index),
    };
    setSolution(updated);
    setStartupSolution(updated);
    showToast('Differentiator removed', 'info');
  };

  const handleAddFeature = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFeature.trim()) return;
    const updated: StartupProduct = {
      ...product,
      keyFeatures: [...product.keyFeatures, newFeature.trim()],
    };
    setProduct(updated);
    setStartupProduct(updated);
    setNewFeature('');
    showToast('Product feature added', 'info');
  };

  const handleRemoveFeature = (index: number) => {
    const updated: StartupProduct = {
      ...product,
      keyFeatures: product.keyFeatures.filter((_, i) => i !== index),
    };
    setProduct(updated);
    setStartupProduct(updated);
    showToast('Product feature removed', 'info');
  };

  const handleAddScreenshot = (url: string) => {
    if (!url.trim()) return;
    const updated: StartupProduct = {
      ...product,
      screenshots: [...(product.screenshots || []), url.trim()],
    };
    setProduct(updated);
    setStartupProduct(updated);
    setNewScreenshot('');
    showToast('Screenshot added to product gallery', 'info');
  };

  const handleRemoveScreenshot = (index: number) => {
    const updated: StartupProduct = {
      ...product,
      screenshots: (product.screenshots || []).filter((_, i) => i !== index),
    };
    setProduct(updated);
    setStartupProduct(updated);
    showToast('Screenshot removed', 'info');
  };

  const handleAddRevenueStream = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRevenueStream.trim()) return;
    const updated: StartupBusinessModel = {
      ...businessModel,
      revenueStreams: [...businessModel.revenueStreams, newRevenueStream.trim()],
    };
    setBusinessModel(updated);
    setStartupBusinessModel(updated);
    setNewRevenueStream('');
    showToast('Revenue stream added', 'info');
  };

  const handleRemoveRevenueStream = (index: number) => {
    const updated: StartupBusinessModel = {
      ...businessModel,
      revenueStreams: businessModel.revenueStreams.filter((_, i) => i !== index),
    };
    setBusinessModel(updated);
    setStartupBusinessModel(updated);
    showToast('Revenue stream removed', 'info');
  };

  const handleAddGeography = (geo: string) => {
    if (!geo.trim() || market.targetGeography.includes(geo.trim())) return;
    const updated: StartupMarket = {
      ...market,
      targetGeography: [...market.targetGeography, geo.trim()],
    };
    setMarket(updated);
    setStartupMarket(updated);
    setNewGeography('');
    showToast(`Added ${geo} to target geographies`, 'info');
  };

  const handleRemoveGeography = (geo: string) => {
    const updated: StartupMarket = {
      ...market,
      targetGeography: market.targetGeography.filter((g) => g !== geo),
    };
    setMarket(updated);
    setStartupMarket(updated);
    showToast(`Removed ${geo} from target geographies`, 'info');
  };

  /* Video Handlers */
  const handleOpenVideoEditor = () => {
    setVideoFormData({
      title: elevatorVideo?.title || 'Xentro 3-Minute Founder Elevator Pitch (v2.4)',
      presenterName: elevatorVideo?.presenterName || basicInfo.startupName.split(' ')[0] + ' Founder',
      presenterRole: elevatorVideo?.presenterRole || 'Founder & CEO',
      duration: elevatorVideo?.duration || '2:48 min',
      videoUrl: elevatorVideo?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: elevatorVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    });
    setIsVideoEditorOpen(true);
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      showToast('Video size exceeds 100MB limit', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setVideoFormData((prev) => ({
          ...prev,
          videoUrl: event.target!.result as string,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }));
        showToast(`Loaded "${file.name}" for pitch video`, 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFormData.videoUrl) {
      showToast('Please select a video file or enter a valid video URL', 'error');
      return;
    }
    const updated: ElevatorPitchVideo = {
      title: videoFormData.title.trim() || 'Elevator Pitch Video',
      presenterName: videoFormData.presenterName.trim() || 'Founder',
      presenterRole: videoFormData.presenterRole.trim() || 'Founder & CEO',
      duration: videoFormData.duration.trim() || '2:30 min',
      videoUrl: videoFormData.videoUrl,
      thumbnailUrl: videoFormData.thumbnailUrl,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setElevatorVideo(updated);
    setStartupPitchVideo(updated);
    setIsVideoEditorOpen(false);
    showToast('Elevator Pitch Video saved and synced to public profile!', 'success');
  };

  const handleRemoveVideo = () => {
    setElevatorVideo(null);
    setStartupPitchVideo(null);
    showToast('Pitch video removed from profile.', 'info');
  };

  /* Pitch Deck Handlers */
  const handleDeckFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Pitch deck file exceeds 50 MB limit.', 'error');
      return;
    }

    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const allowed = ['PDF', 'PPTX', 'PPT', 'KEY'];
    if (!allowed.includes(ext)) {
      showToast('Please upload a PDF or PowerPoint (.pptx) file.', 'error');
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const nowFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (pitchDeck) {
      const nextVersion = `${(parseFloat(pitchDeck.version || '1.0') + 0.1).toFixed(1)}`;
      const updated: PitchDeckDoc = {
        ...pitchDeck,
        title: file.name,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: ext,
        version: nextVersion,
        lastUpdated: nowFormatted,
        updatedAt: nowFormatted,
      };
      replaceStartupPitchDeck(updated);
      setPitchDeck(updated);
      showToast(`Pitch deck replaced with "${file.name}" (${sizeStr})`, 'success');
    } else {
      const created: PitchDeckDoc = {
        title: file.name,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: ext,
        description: 'Official startup investor deck presenting market problem, tech architecture, and growth metrics.',
        version: '1.0',
        lastUpdated: nowFormatted,
        uploadedAt: nowFormatted,
        updatedAt: nowFormatted,
        slideCount: 14,
        visibility: 'Public',
        allowDownload: false,
        previewSlides: [
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
        ],
      };
      uploadStartupPitchDeck(created);
      setPitchDeck(created);
      showToast(`Uploaded pitch deck "${file.name}" (${sizeStr})`, 'success');
    }

    if (e.target) e.target.value = '';
  };

  const handleOpenEditModal = () => {
    if (!pitchDeck) return;
    setEditFormData({
      title: pitchDeck.title || '',
      fileName: pitchDeck.fileName || pitchDeck.title || '',
      description: pitchDeck.description || '',
      version: pitchDeck.version || '1.0',
      slideCount: pitchDeck.slideCount || 12,
      visibility: pitchDeck.visibility || 'Public',
      allowDownload: pitchDeck.allowDownload ?? false,
      fileUrl: pitchDeck.fileUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchDeck) return;
    if (!editFormData.title.trim()) {
      showToast('Deck title is required', 'error');
      return;
    }

    const updated = updateStartupPitchDeckMetadata({
      title: editFormData.title.trim(),
      fileName: editFormData.fileName.trim() || editFormData.title.trim(),
      description: editFormData.description.trim(),
      version: editFormData.version.trim() || '1.0',
      slideCount: Number(editFormData.slideCount) || 12,
      visibility: editFormData.visibility,
      allowDownload: editFormData.allowDownload,
      fileUrl: editFormData.fileUrl.trim() || undefined,
    });

    if (updated) {
      setPitchDeck(updated);
      setIsEditModalOpen(false);
      showToast('Pitch deck metadata updated successfully', 'success');
    }
  };

  const handleConfirmRemoveDeck = () => {
    removeStartupPitchDeck();
    setPitchDeck(null);
    setIsRemoveConfirmOpen(false);
    showToast('Pitch deck removed from startup profile', 'info');
  };

  const handleDeckVisibilityChange = (visibility: PitchDeckDoc['visibility']) => {
    if (!pitchDeck) return;
    const updated = updateStartupPitchDeckMetadata({ visibility });
    if (updated) {
      setPitchDeck(updated);
      showToast(`Pitch deck visibility set to ${visibility}`, 'info');
    }
  };

  const handleDeckDownloadChange = (allowDownload: boolean) => {
    if (!pitchDeck) return;
    const updated = updateStartupPitchDeckMetadata({ allowDownload });
    if (updated) {
      setPitchDeck(updated);
      showToast(allowDownload ? 'Deck download enabled' : 'Deck download restricted', 'info');
    }
  };

  /* Team Member Tagging Handlers */
  const handleSelectPlatformUser = (u: typeof platformUsers[0]) => {
    setNewMember({
      name: u.name,
      role: u.role,
      category: u.category,
      xentroHandle: `@${u.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      bio: u.bio,
      avatar: u.avatar,
    });
    setUserSearchQuery(u.name);
    showToast(`Selected platform user: ${u.name}`, 'info');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.role.trim()) {
      showToast('Please provide member name and role', 'error');
      return;
    }

    // Check duplicate member
    const isDuplicate = teamMembers.some(
      (m) => m.name.toLowerCase().trim() === newMember.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      showToast(`"${newMember.name}" is already a member of your startup team`, 'error');
      return;
    }

    const member: StartupTeamMember = {
      id: `tm_${Date.now()}`,
      name: newMember.name.trim(),
      role: newMember.role.trim(),
      roleCategory: newMember.category,
      xentroProfile: newMember.xentroHandle || `@${newMember.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      bio: newMember.bio.trim() || 'Key startup team contributor.',
      avatar:
        newMember.avatar ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      isVerified: true,
      isFullTime: newMember.category !== 'advisor',
    };

    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    setStartupTeamMembers(updated);
    setIsAddingMember(false);
    setNewMember({ name: '', role: '', category: 'core', xentroHandle: '', bio: '', avatar: '' });
    setUserSearchQuery('');
    showToast(`Added ${member.name} as ${member.role}!`, 'success');
  };

  const handleRemoveMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    setStartupTeamMembers(updated);
    showToast('Team member removed from profile', 'info');
  };

  const renderProblemCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" />
            <span>Problem Statement & Key Pain Points</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Articulate the friction, cost of inaction, and specific user pain points for investors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProblem}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Problem</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Problem Statement *
          </label>
          <textarea
            rows={3}
            value={problem.problemStatement}
            onChange={(e) => updateProblemField('problemStatement', e.target.value)}
            placeholder="Describe the fundamental industry problem your startup tackles..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white leading-relaxed focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Target Users / Victims of Problem
            </label>
            <input
              type="text"
              value={problem.targetUsers}
              onChange={(e) => updateProblemField('targetUsers', e.target.value)}
              placeholder="e.g. CTOs, Data Architects, SREs"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Why It Matters (Cost of Inaction / Urgency)
            </label>
            <input
              type="text"
              value={problem.whyItMatters}
              onChange={(e) => updateProblemField('whyItMatters', e.target.value)}
              placeholder="e.g. Enterprise downtime costs $14,000/min..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Key Pain Points List */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Key Pain Points ({problem.painPoints.length})
          </label>
          <div className="space-y-2">
            {problem.painPoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-[#101212] dark:text-white font-medium">{pt}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePainPoint(idx)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                  title="Remove pain point"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddPainPoint} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              placeholder="Add another acute pain point..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Point</span>
            </button>
          </form>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Existing Alternatives & Flaws
          </label>
          <textarea
            rows={2}
            value={problem.existingAlternatives || ''}
            onChange={(e) => updateProblemField('existingAlternatives', e.target.value)}
            placeholder="e.g. Static relational catalogs, generic vector databases, manual runbooks..."
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );

  const renderSolutionCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
            <span>Solution & Value Proposition</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Explain how your technological approach uniquely solves the problem and your defensible moats.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSolution}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Solution</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Solution Overview *
          </label>
          <textarea
            rows={3}
            value={solution.overview}
            onChange={(e) => updateSolutionField('overview', e.target.value)}
            placeholder="High-level architecture and breakthrough proposition..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white leading-relaxed focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              How It Solves the Problem
            </label>
            <textarea
              rows={2}
              value={solution.howItSolves}
              onChange={(e) => updateSolutionField('howItSolves', e.target.value)}
              placeholder="e.g. Marries deterministic symbolic graph verification with probabilistic models..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Core Value Proposition
            </label>
            <textarea
              rows={2}
              value={solution.coreValueProp}
              onChange={(e) => updateSolutionField('coreValueProp', e.target.value)}
              placeholder="e.g. 10x faster root-cause analysis with zero-latency entity correlation..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Key Differentiators & Moats */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Key Differentiators & Moats ({solution.keyDifferentiators.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {solution.keyDifferentiators.map((diff, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[#101212] dark:text-white font-medium">{diff}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDifferentiator(idx)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                  title="Remove differentiator"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddDifferentiator} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newDifferentiator}
              onChange={(e) => setNewDifferentiator(e.target.value)}
              placeholder="Add proprietary moat or IP differentiator..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Moat</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderProductCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            <span>Product / Service & Tech Architecture</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Detail product offerings, lifecycle status, interactive demos, and screenshot evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProduct}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Product</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Product / Platform Name *
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProductField('name', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Product Category
            </label>
            <input
              type="text"
              value={product.category}
              onChange={(e) => updateProductField('category', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Product Lifecycle Status
            </label>
            <select
              value={product.status}
              onChange={(e) => updateProductField('status', e.target.value as ProductStatus)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="Idea">Idea / Concept</option>
              <option value="Prototype">Prototype</option>
              <option value="MVP">MVP (Minimum Viable Product)</option>
              <option value="Beta">Beta (Closed / Private Testing)</option>
              <option value="Live">Live (Commercial Market)</option>
              <option value="Revenue Generating">Revenue Generating</option>
              <option value="Scaling">Scaling</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Interactive Demo URL
            </label>
            <input
              type="url"
              value={product.demoLink || ''}
              onChange={(e) => updateProductField('demoLink', e.target.value)}
              placeholder="https://demo.example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Product Dedicated Website (Optional)
          </label>
          <input
            type="url"
            value={product.productWebsite || ''}
            onChange={(e) => updateProductField('productWebsite', e.target.value)}
            placeholder="https://example.com/product"
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Product Description
          </label>
          <textarea
            rows={3}
            value={product.description}
            onChange={(e) => updateProductField('description', e.target.value)}
            placeholder="Elaborate on core system architecture and customer UX..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Key Product Features */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Key Features ({product.keyFeatures.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {product.keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9FF3F] shrink-0" />
                  <span className="text-[#101212] dark:text-white font-medium">{feat}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                  title="Remove feature"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddFeature} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add key feature..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Feature</span>
            </button>
          </form>
        </div>

        {/* Product Screenshots Gallery */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Product Screenshots & Gallery ({product.screenshots?.length || 0})
          </label>
          {product.screenshots && product.screenshots.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {product.screenshots.map((shot, sIdx) => (
                <div
                  key={sIdx}
                  className="relative rounded-xl overflow-hidden aspect-video border border-gray-200 dark:border-[#262A29] bg-black group"
                >
                  <img src={shot} alt="Screenshot preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(sIdx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-all cursor-pointer"
                    title="Remove screenshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="url"
              value={newScreenshot}
              onChange={(e) => setNewScreenshot(e.target.value)}
              placeholder="Paste image URL (https://...)..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleAddScreenshot(newScreenshot)}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Add Screenshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanyInfoCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Company Information (Statutory & Incorporation)</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Corporate entity details, legal registration date, regulatory recognitions, and affiliations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveCompanyInfo}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Company Info</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Legal Entity Name *
            </label>
            <input
              type="text"
              value={companyInfo.legalName}
              onChange={(e) => updateCompanyInfoField('legalName', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Incorporation Status
            </label>
            <input
              type="text"
              value={companyInfo.incorporationStatus}
              onChange={(e) => updateCompanyInfoField('incorporationStatus', e.target.value)}
              placeholder="e.g. Active / Incorporated"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Incorporation Date
            </label>
            <input
              type="text"
              value={companyInfo.incorporationDate}
              onChange={(e) => updateCompanyInfoField('incorporationDate', e.target.value)}
              placeholder="e.g. March 14, 2023"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Registered Location / Office Address
            </label>
            <input
              type="text"
              value={companyInfo.registeredLocation}
              onChange={(e) => updateCompanyInfoField('registeredLocation', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Incubator / Accelerator Affiliation
            </label>
            <input
              type="text"
              value={companyInfo.incubatorAffiliation || ''}
              onChange={(e) => updateCompanyInfoField('incubatorAffiliation', e.target.value)}
              placeholder="e.g. T-Hub Hyderabad & NVIDIA Inception"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          {/* Recognitions */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={companyInfo.isDPIITRecognised}
                onChange={(e) => updateCompanyInfoField('isDPIITRecognised', e.target.checked)}
                className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>DPIIT Recognised Venture</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={companyInfo.isMSMERegistered}
                onChange={(e) => updateCompanyInfoField('isMSMERegistered', e.target.checked)}
                className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>MSME / Udyam Registered</span>
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Corporate Identification Number (CIN)
            </label>
            <input
              type="text"
              value={companyInfo.cinMasked || ''}
              onChange={(e) => updateCompanyInfoField('cinMasked', e.target.value)}
              placeholder="e.g. U72900TG2023PTC••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              GST Number (GSTIN)
            </label>
            <input
              type="text"
              value={companyInfo.gstMasked || ''}
              onChange={(e) => updateCompanyInfoField('gstMasked', e.target.value)}
              placeholder="e.g. 36AAACK••••••1Z7"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Market Opportunity & Sizing (TAM / SAM / SOM)</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Quantify market size, customer targets, industry segmentation, and operating regions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveMarket}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Market</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* TAM / SAM / SOM Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
            <label className="block text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              TAM (Total Addressable)
            </label>
            <input
              type="text"
              value={market.tam || ''}
              onChange={(e) => updateMarketField('tam', e.target.value)}
              placeholder="e.g. $48.6 Billion"
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-emerald-300 dark:border-emerald-700/50 text-xs font-bold text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 space-y-1.5">
            <label className="block text-[11px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
              SAM (Serviceable Addressable)
            </label>
            <input
              type="text"
              value={market.sam || ''}
              onChange={(e) => updateMarketField('sam', e.target.value)}
              placeholder="e.g. $11.2 Billion"
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-cyan-300 dark:border-cyan-700/50 text-xs font-bold text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-lime-50/40 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-800/40 space-y-1.5">
            <label className="block text-[11px] uppercase font-bold text-lime-700 dark:text-[#D9FF3F]">
              SOM (Serviceable Obtainable)
            </label>
            <input
              type="text"
              value={market.som || ''}
              onChange={(e) => updateMarketField('som', e.target.value)}
              placeholder="e.g. $850 Million"
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-lime-300 dark:border-lime-700/50 text-xs font-bold text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Target Customer Profile *
            </label>
            <input
              type="text"
              value={market.targetCustomer}
              onChange={(e) => updateMarketField('targetCustomer', e.target.value)}
              placeholder="e.g. Enterprise scale B2B organizations with >$50M ARR..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Primary Industry Segment
            </label>
            <input
              type="text"
              value={market.primarySegment}
              onChange={(e) => updateMarketField('primarySegment', e.target.value)}
              placeholder="e.g. FinTech, Telecom, Healthcare & Enterprise SaaS"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Secondary Segment (Optional)
            </label>
            <input
              type="text"
              value={market.secondarySegment || ''}
              onChange={(e) => updateMarketField('secondarySegment', e.target.value)}
              placeholder="e.g. Defense Contractors & Critical Infrastructure"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Business Model Category
            </label>
            <input
              type="text"
              value={market.businessModelCategory}
              onChange={(e) => updateMarketField('businessModelCategory', e.target.value)}
              placeholder="e.g. B2B SaaS / Enterprise Subscription"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Market Opportunity Narrative
          </label>
          <textarea
            rows={2}
            value={market.marketOpportunity}
            onChange={(e) => updateMarketField('marketOpportunity', e.target.value)}
            placeholder="e.g. The global market is expanding from $14.2B in 2024 to $48.6B by 2030..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Target Geographies */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Target Geographies ({market.targetGeography.length})
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {market.targetGeography.map((geo, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white inline-flex items-center gap-1.5"
              >
                <span>{geo}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGeography(geo)}
                  className="hover:text-rose-500 cursor-pointer"
                  title="Remove geography"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newGeography}
              onChange={(e) => setNewGeography(e.target.value)}
              placeholder="Add region (e.g. India, APAC, North America, GCC)..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleAddGeography(newGeography)}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Geography</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Competitive Landscape & Defensibility
          </label>
          <textarea
            rows={2}
            value={market.competitiveLandscape || ''}
            onChange={(e) => updateMarketField('competitiveLandscape', e.target.value)}
            placeholder="Describe competitor moats and how your positioning beats existing products..."
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );

  const renderBusinessModelCard = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#D9FF3F]" />
            <span>Business Model & Monetization Architecture</span>
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Pricing mechanics, subscription tiers, customer segmentation, and go-to-market sales motions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveBusinessModel}
          className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Business Model</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Core Business Model *
            </label>
            <input
              type="text"
              value={businessModel.businessModel}
              onChange={(e) => updateBusinessModelField('businessModel', e.target.value)}
              placeholder="e.g. B2B Annual Recurring SaaS + High-Volume Ingestion Usage"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Customer Type
            </label>
            <input
              type="text"
              value={businessModel.customerType}
              onChange={(e) => updateBusinessModelField('customerType', e.target.value)}
              placeholder="e.g. Mid-Market to Fortune 500 Enterprise IT & Engineering"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Pricing Model & Tiers
            </label>
            <input
              type="text"
              value={businessModel.pricingModel}
              onChange={(e) => updateBusinessModelField('pricingModel', e.target.value)}
              placeholder="e.g. Enterprise Starter ($2,500/mo), Scale ($6,500/mo)..."
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
              Sales & Distribution Model
            </label>
            <input
              type="text"
              value={businessModel.salesModel}
              onChange={(e) => updateBusinessModelField('salesModel', e.target.value)}
              placeholder="e.g. Founder-led enterprise sales expanding into AWS Marketplace"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
            Revenue Model Mechanics
          </label>
          <textarea
            rows={2}
            value={businessModel.revenueModel}
            onChange={(e) => updateBusinessModelField('revenueModel', e.target.value)}
            placeholder="e.g. Tiered platform fee based on monthly indexed entities plus consumed compute..."
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        {/* Active Revenue Streams */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#101212] dark:text-white">
            Active Revenue Streams ({businessModel.revenueStreams.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {businessModel.revenueStreams.map((stream, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F] shrink-0" />
                  <span className="text-[#101212] dark:text-white font-medium">{stream}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRevenueStream(idx)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                  title="Remove stream"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddRevenueStream} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newRevenueStream}
              onChange={(e) => setNewRevenueStream(e.target.value)}
              placeholder="Add another revenue stream..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stream</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Ghost Mode Active Warning Banner */}
      {isGhostMode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-slide">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Ghost Mode Active
              </h4>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                Your Startup Profile is currently hidden from discovery.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStartupGhostMode(false);
              setIsGhostMode(false);
              showToast('Your Startup Profile is now Public and discoverable across Xentro!', 'success');
            }}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs self-start sm:self-auto"
          >
            Make Profile Public
          </button>
        </div>
      )}

      {/* Top Header with Profile Action and Public Preview Trigger */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
              Profile Management Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Live Ecosystem Sync
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Update your public profile, founder pitch video, pitch deck privacy, and open talent asks.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Profile Visibility Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
            <button
              onClick={() => {
                if (isGhostMode) {
                  setStartupGhostMode(false);
                  setIsGhostMode(false);
                  showToast('Startup Profile set to Public', 'success');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isGhostMode
                  ? 'bg-white dark:bg-[#181B1A] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Public</span>
            </button>
            <button
              onClick={() => {
                if (!isGhostMode) {
                  setIsGhostConfirmOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isGhostMode
                  ? 'bg-white dark:bg-[#181B1A] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Ghost Mode</span>
            </button>
          </div>

          <button
            onClick={onPreviewPublicProfile}
            className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-gray-200 dark:border-[#262A29]"
          >
            <Eye className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F]" />
            <span>Preview Public Profile</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Profile Section Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('basic')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'basic'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Basic Info</span>
        </button>

        <button
          onClick={() => setActiveSection('pitch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'pitch' || activeSection === 'narrative'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Pitch Deck</span>
        </button>

        <button
          onClick={() => setActiveSection('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'team'
              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team & Talent Asks</span>
        </button>
      </div>

      {/* SECTION 1: BASIC INFO & STATUTORY */}
      {activeSection === 'basic' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D9FF3F]" />
                <span>Core Startup Identity</span>
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Essential organization details visible to all founders, investors, and ecosystem accelerators.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveBasicInfo}
              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Basic Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Startup Legal / Registered Name
              </label>
              <input
                type="text"
                value={basicInfo.startupName}
                onChange={(e) => updateBasicInfoField('startupName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Startup Stage
              </label>
              <select
                value={basicInfo.stage}
                onChange={(e) => updateBasicInfoField('stage', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              >
                <option>Idea / Validation</option>
                <option>Pre-Seed · Verified</option>
                <option>Seed Stage</option>
                <option>Early Growth / Pre-Series A</option>
                <option>Series A+</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                One-Line Tagline / Value Proposition
              </label>
              <input
                type="text"
                value={basicInfo.tagline}
                onChange={(e) => updateBasicInfoField('tagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Primary Industry
              </label>
              <input
                type="text"
                value={basicInfo.industry}
                onChange={(e) => updateBasicInfoField('industry', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Sub-Sector / Specialization
              </label>
              <input
                type="text"
                value={basicInfo.subSector}
                onChange={(e) => updateBasicInfoField('subSector', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Business Model
              </label>
              <input
                type="text"
                value={basicInfo.businessModel}
                onChange={(e) => updateBasicInfoField('businessModel', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Headquarters
              </label>
              <input
                type="text"
                value={basicInfo.headquarters}
                onChange={(e) => updateBasicInfoField('headquarters', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Operating Geography
              </label>
              <input
                type="text"
                value={basicInfo.operatingGeography}
                onChange={(e) => updateBasicInfoField('operatingGeography', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Website URL
              </label>
              <input
                type="url"
                value={basicInfo.website}
                onChange={(e) => updateBasicInfoField('website', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Executive Overview & Mission
              </label>
              <textarea
                rows={3}
                value={basicInfo.overview}
                onChange={(e) => updateBasicInfoField('overview', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                UN Sustainable Development Goals (UNSDGs)
              </label>
              <input
                type="text"
                value={basicInfo.unsdgs}
                onChange={(e) => updateBasicInfoField('unsdgs', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                Key Impact Areas
              </label>
              <input
                type="text"
                value={basicInfo.impactAreas}
                onChange={(e) => updateBasicInfoField('impactAreas', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Company Information (Statutory & Incorporation) */}
        {renderCompanyInfoCard()}
      </div>
    )}

      {/* SECTION 2: PITCH DECK */}
      {(activeSection === 'pitch' || activeSection === 'narrative') && (
        <div className="space-y-6 animate-fade-slide">
          {/* Sub-section Navigation Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100 dark:border-[#262A29] scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'video', label: 'Elevator Pitch Video' },
              { id: 'deck', label: 'Pitch Deck Document' },
              { id: 'problem', label: 'Problem' },
              { id: 'solution', label: 'Solution' },
              { id: 'product', label: 'Product & Service' },
              { id: 'market', label: 'Market Opportunity' },
              { id: 'business', label: 'Business Model' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setPitchSubSection(pill.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  pitchSubSection === pill.id
                    ? 'bg-[#101212] dark:bg-white text-white dark:text-[#101212] shadow-xs'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-200 dark:hover:bg-[#262A29]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Elevator Pitch Video (Max 3 Min) */}
          {(pitchSubSection === 'all' || pitchSubSection === 'video') && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white">
                    Elevator Pitch Video
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    Max 3 Minutes
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  First impression for institutional investors and cohort evaluation committees.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {elevatorVideo && (
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F]" />
                    <span>Preview Video</span>
                  </button>
                )}
                <button
                  onClick={handleOpenVideoEditor}
                  className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{elevatorVideo ? 'Replace Video' : '+ Add Video'}</span>
                </button>
                {elevatorVideo && (
                  <button
                    onClick={handleRemoveVideo}
                    className="p-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-500 transition-all cursor-pointer"
                    title="Remove pitch video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {elevatorVideo ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#101212] dark:bg-[#262A29] flex items-center justify-center text-[#D9FF3F] shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                      {elevatorVideo.title}
                    </h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Presenter: {elevatorVideo.presenterName} ({elevatorVideo.presenterRole}) &bull; Length: {elevatorVideo.duration} &bull; Synced {elevatorVideo.lastUpdated}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <Check className="w-3.5 h-3.5" /> Active in Header & Profile
                </span>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#202422] border border-dashed border-gray-200 dark:border-[#262A29] space-y-2">
                <Video className="w-8 h-8 mx-auto text-gray-400" />
                <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                  No Pitch Video Active
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
                  Upload a 2-3 minute elevator pitch video to give institutional evaluators an immediate overview of your vision.
                </p>
                <button
                  type="button"
                  onClick={handleOpenVideoEditor}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D9FF3F] text-xs font-bold text-[#101212] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Pitch Video</span>
                </button>
              </div>
            )}
          </div>
        )}

          {/* Pitch Deck Section */}
          {(pitchSubSection === 'all' || pitchSubSection === 'deck') && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
              <input
              type="file"
              ref={deckFileInputRef}
              onChange={handleDeckFileSelect}
              accept=".pdf,.pptx,.ppt,.key"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Pitch Deck</span>
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Manage your venture presentation, configure viewer permissions, and update investor slides.
                </p>
              </div>

              {pitchDeck && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      pitchDeck.visibility === 'Public'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : pitchDeck.visibility === 'Connections Only'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : pitchDeck.visibility === 'Request Access'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {pitchDeck.visibility}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                      pitchDeck.allowDownload
                        ? 'bg-gray-100 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-gray-700 dark:text-gray-300'
                        : 'bg-gray-50 dark:bg-[#202422]/50 border-gray-200 dark:border-[#262A29] text-gray-400'
                    }`}
                  >
                    {pitchDeck.allowDownload ? 'Download Allowed' : 'Download Restricted'}
                  </span>
                </div>
              )}
            </div>

            {pitchDeck ? (
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                          {pitchDeck.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          {pitchDeck.fileType || 'PDF'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-[#262A29] text-gray-600 dark:text-gray-300 font-bold">
                          v{pitchDeck.version || '1.0'}
                        </span>
                      </div>

                      {pitchDeck.fileName && pitchDeck.fileName !== pitchDeck.title && (
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {pitchDeck.fileName}
                        </p>
                      )}

                      {pitchDeck.description && (
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-2 max-w-2xl">
                          {pitchDeck.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2.5 text-xs text-[#565B59] dark:text-[#B6B8B7] flex-wrap pt-1">
                        <span>
                          Updated: <strong>{pitchDeck.updatedAt || pitchDeck.lastUpdated || 'Recently'}</strong>
                        </span>
                        <span>&bull;</span>
                        <span>
                          Format: <strong>{pitchDeck.fileType || 'PDF'}</strong>
                        </span>
                        {pitchDeck.fileSize && (
                          <>
                            <span>&bull;</span>
                            <span>
                              Size: <strong className="font-mono">{pitchDeck.fileSize}</strong>
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>
                          <strong>{pitchDeck.slideCount || 14} Slides</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Action Buttons: [ View ], [ Replace ], [ Edit ], [ Remove ] */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentViewerSlide(0);
                        setIsDeckViewerOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deckFileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRemoveConfirmOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Quick Governance Row */}
                <div className="pt-3 border-t border-gray-200/60 dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">
                      Access Mode:
                    </label>
                    <select
                      value={pitchDeck.visibility}
                      onChange={(e) => handleDeckVisibilityChange(e.target.value as PitchDeckDoc['visibility'])}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white cursor-pointer focus:outline-hidden"
                    >
                      <option value="Public">Public (Anyone on Xentro)</option>
                      <option value="Connections Only">Connections Only</option>
                      <option value="Request Access">Request Access (Approval Required)</option>
                      <option value="Private">Private (Founding Team Only)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pitchDeck.allowDownload ?? false}
                      onChange={(e) => handleDeckDownloadChange(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      Allow viewers to download presentation file
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="p-10 text-center rounded-2xl bg-gray-50 dark:bg-[#202422] border border-dashed border-gray-200 dark:border-[#262A29] space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                    No pitch deck added yet.
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto leading-relaxed">
                    Upload your pitch presentation in PDF, PPTX, or Keynote format to showcase your business model and traction to investors.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => deckFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Pitch Deck</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Problem */}
          {(pitchSubSection === 'all' || pitchSubSection === 'problem') && renderProblemCard()}

          {/* Solution */}
          {(pitchSubSection === 'all' || pitchSubSection === 'solution') && renderSolutionCard()}

          {/* Product / Service */}
          {(pitchSubSection === 'all' || pitchSubSection === 'product') && renderProductCard()}

          {/* Market Opportunity & Sizing */}
          {(pitchSubSection === 'all' || pitchSubSection === 'market') && renderMarketCard()}

          {/* Business Model & Monetization Architecture */}
          {(pitchSubSection === 'all' || pitchSubSection === 'business') && renderBusinessModelCard()}
        </div>
      )}

      {/* SECTION 3: TEAM & TALENT ASKS */}
      {activeSection === 'team' && (
        <StartupTeamWorkspace />
      )}

      {/* Hidden file input for video */}
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleVideoFileSelect}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
      />

      {/* Video Modal Preview */}
      {isClient && isVideoModalOpen && elevatorVideo && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#181B1A] border border-[#262A29] overflow-hidden shadow-2xl space-y-3 p-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#262A29]">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-[#D9FF3F]" />
                {elevatorVideo.title}
              </span>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <video controls className="w-full h-full object-cover">
                <source src={elevatorVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Editor Modal */}
      {isClient && isVideoEditorOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  {elevatorVideo ? 'Replace Elevator Pitch Video' : 'Add Elevator Pitch Video'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoEditorOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Video Source (Upload File or Enter URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={videoFormData.videoUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, videoUrl: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1 block">
                  Accepted formats: MP4, WebM, MOV up to 100MB
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Video Title
                </label>
                <input
                  type="text"
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Presenter Name
                  </label>
                  <input
                    type="text"
                    value={videoFormData.presenterName}
                    onChange={(e) => setVideoFormData({ ...videoFormData, presenterName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Presenter Role
                  </label>
                  <input
                    type="text"
                    value={videoFormData.presenterRole}
                    onChange={(e) => setVideoFormData({ ...videoFormData, presenterRole: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Duration (Max 3:00 min)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2:45 min"
                  value={videoFormData.duration}
                  onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => setIsVideoEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Save Pitch Video
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Ghost Mode Confirmation Modal */}
      {isClient && isGhostConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <EyeOff className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#101212] dark:text-white font-heading">
                Enable Ghost Mode?
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Your Startup Profile will be hidden from Xentro Search, Explore, Recommendations, and discovery features. You will still be able to use your Dashboard, Messages, Opportunities, and other Xentro features.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsGhostConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartupGhostMode(true);
                  setIsGhostMode(true);
                  setIsGhostConfirmOpen(false);
                  showToast('Ghost Mode enabled. Your profile is now hidden from discovery.', 'info');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Enable Ghost Mode
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pitch Deck Viewer Modal */}
      {isClient && isDeckViewerOpen && pitchDeck && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[#181B1A] border border-[#262A29] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#262A29] bg-[#101212]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{pitchDeck.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#262A29] text-gray-300 font-normal">
                      v{pitchDeck.version}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#B6B8B7]">
                    Slide {currentViewerSlide + 1} of {(pitchDeck.previewSlides?.length || pitchDeck.slideCount || 1)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pitchDeck.allowDownload && (
                  <button
                    type="button"
                    onClick={() => showToast('Downloading pitch presentation PDF...', 'success')}
                    className="px-3 py-1.5 rounded-lg border border-[#262A29] bg-[#181B1A] hover:bg-[#202422] text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDeckViewerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide View Canvas */}
            <div className="flex-1 overflow-auto bg-black p-4 sm:p-8 flex items-center justify-center min-h-[350px]">
              {pitchDeck.previewSlides && pitchDeck.previewSlides.length > 0 ? (
                <img
                  src={pitchDeck.previewSlides[currentViewerSlide % pitchDeck.previewSlides.length]}
                  alt={`Slide ${currentViewerSlide + 1}`}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain border border-[#262A29] shadow-2xl"
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <FileText className="w-16 h-16 mx-auto text-gray-600" />
                  <p className="text-sm font-bold text-white">{pitchDeck.fileName || pitchDeck.title}</p>
                  <p className="text-xs text-gray-400">PDF Document Presentation ({pitchDeck.slideCount || 14} slides)</p>
                </div>
              )}
            </div>

            {/* Slide Navigation & Controls */}
            <div className="flex items-center justify-between p-3.5 border-t border-[#262A29] bg-[#101212] text-xs text-[#B6B8B7]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-gray-400">
                  {pitchDeck.fileType || 'PDF'} · {pitchDeck.fileSize || '3.8 MB'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentViewerSlide((prev) => Math.max(0, prev - 1))}
                  disabled={currentViewerSlide === 0}
                  className="p-1.5 rounded-lg border border-[#262A29] bg-[#181B1A] text-white hover:bg-[#202422] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-white">
                  {currentViewerSlide + 1} / {pitchDeck.previewSlides?.length || pitchDeck.slideCount || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentViewerSlide((prev) =>
                      Math.min((pitchDeck.previewSlides?.length || pitchDeck.slideCount || 1) - 1, prev + 1)
                    )
                  }
                  disabled={
                    currentViewerSlide >=
                    (pitchDeck.previewSlides?.length || pitchDeck.slideCount || 1) - 1
                  }
                  className="p-1.5 rounded-lg border border-[#262A29] bg-[#181B1A] text-white hover:bg-[#202422] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pitch Deck Edit Metadata Modal */}
      {isClient && isEditModalOpen && pitchDeck && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#D9FF3F]" />
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Edit Pitch Deck Metadata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Deck Title *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  placeholder="e.g. Nexus AI Seed Investor Deck"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  value={editFormData.fileName}
                  onChange={(e) => setEditFormData({ ...editFormData, fileName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white"
                  placeholder="e.g. Nexus_AI_Pitch_Deck_v2.4.pdf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white resize-none"
                  placeholder="Brief summary or context for investors reviewing this presentation..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editFormData.version}
                    onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                    placeholder="e.g. 2.4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Slide Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editFormData.slideCount}
                    onChange={(e) => setEditFormData({ ...editFormData, slideCount: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Visibility & Access Permissions
                </label>
                <select
                  value={editFormData.visibility}
                  onChange={(e) => setEditFormData({ ...editFormData, visibility: e.target.value as PitchDeckDoc['visibility'] })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                >
                  <option value="Public">Public (Anyone on Xentro)</option>
                  <option value="Connections Only">Connections Only (Approved Network)</option>
                  <option value="Request Access">Request Access (Approval Required)</option>
                  <option value="Private">Private (Founding Team Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                  Presentation URL (Optional External Link)
                </label>
                <input
                  type="url"
                  value={editFormData.fileUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, fileUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono text-[#101212] dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editFormData.allowDownload}
                    onChange={(e) => setEditFormData({ ...editFormData, allowDownload: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D9FF3F] accent-[#D9FF3F] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Allow viewers to download original presentation file
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    deckFileInputRef.current?.click();
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace File</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Save Metadata
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Pitch Deck Remove Confirmation Modal */}
      {isClient && isRemoveConfirmOpen && pitchDeck && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#101212] dark:text-white font-heading">
                Remove Pitch Deck?
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Are you sure you want to remove <strong className="text-[#101212] dark:text-white">"{pitchDeck.title}"</strong>? It will immediately be removed from your public startup profile and will no longer be visible or downloadable by investors and mentors.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRemoveConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveDeck}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Pitch Deck</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
