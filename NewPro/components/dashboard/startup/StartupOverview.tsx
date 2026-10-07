'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Rocket,
  Eye,
  Users,
  MessageSquare,
  Briefcase,
  FolderLock,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Building2,
  Calendar,
  ExternalLink,
  Target,
  FileText,
  DollarSign,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  Trash2,
  X,
  RotateCcw,
  Shield,
  CreditCard,
  Award,
  ChevronRight,
  CheckCircle,
  Info,
  Lock,
  Edit3,
  Save,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import {
  initialStartupWorkspaceData,
  StartupWorkspaceData,
  initialConnectionsData,
  EcosystemConnection,
} from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import { followService, FOLLOWS_UPDATED_EVENT } from '@/lib/followService';
import { getUserProfile } from '@/lib/userProfile';
import {
  getStartupBanner,
  setStartupBanner,
  getStartupAvatar,
  setStartupAvatar,
} from '@/lib/startupProfileState';
import {
  getStartupEntityMembers,
  getStartupInvitations,
  getStartupVerificationStatus,
  getStartupEndorsements,
  resolveStartupEntitlements,
  getStartupSubscription,
  getFailedPaymentSimulation,
  acceptESPEndorsement,
  declineESPEndorsement,
} from '@/lib/startupDomainService';
import {
  StartupEntityMember,
  StartupInvitation,
  StartupVerificationRecord,
  StartupESPEndorsementItem,
  StartupEntitlement,
  StartupSubscription,
} from '@/types/startup';

interface StartupOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

export const StartupOverview: React.FC<StartupOverviewProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<StartupWorkspaceData>(initialStartupWorkspaceData);

  // Operational Telemetry Domain State
  const [members, setMembers] = useState<StartupEntityMember[]>([]);
  const [invitations, setInvitations] = useState<StartupInvitation[]>([]);
  const [verification, setVerification] = useState<StartupVerificationRecord | null>(null);
  const [endorsements, setEndorsements] = useState<StartupESPEndorsementItem[]>([]);
  const [entitlements, setEntitlements] = useState<StartupEntitlement | null>(null);
  const [subscription, setSubscription] = useState<StartupSubscription | null>(null);
  const [failedPaymentSim, setFailedPaymentSim] = useState<boolean>(false);

  // Custom Banner & Avatar state
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  const [isBannerMenuOpen, setIsBannerMenuOpen] = useState(false);
  const [isPhotoActionModalOpen, setIsPhotoActionModalOpen] = useState(false);

  // Camera modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Integrated Connections Module State
  const [connections, setConnections] = useState<EcosystemConnection[]>([]);
  const [followStats, setFollowStats] = useState<{ followersCount: number; followingCount: number }>({
    followersCount: 0,
    followingCount: 0,
  });
  const [activeConnectionCategory, setActiveConnectionCategory] = useState<'All' | 'Investor' | 'Mentor' | 'Startup' | 'ESP'>('All');
  const [connectionSearchQuery, setConnectionSearchQuery] = useState('');
  const [editingNoteConn, setEditingNoteConn] = useState<EcosystemConnection | null>(null);
  const [connNoteText, setConnNoteText] = useState('');
  const [connNextFollowUp, setConnNextFollowUp] = useState('');
  const [connRelStatus, setConnRelStatus] = useState('');

  const openNoteEditor = (conn: EcosystemConnection) => {
    setEditingNoteConn(conn);
    setConnNoteText(conn.founderNotes?.notes || '');
    setConnNextFollowUp(conn.founderNotes?.nextFollowUpDate || '');
    setConnRelStatus(conn.founderNotes?.relationshipStatus || 'In Discussion');
  };

  const savePrivateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteConn) return;

    setConnections((prev) =>
      prev.map((c) => {
        if (c.id === editingNoteConn.id) {
          return {
            ...c,
            founderNotes: {
              notes: connNoteText,
              nextFollowUpDate: connNextFollowUp,
              relationshipStatus: connRelStatus,
            },
          };
        }
        return c;
      })
    );

    showToast(`Private founder notes saved for ${editingNoteConn.name}`, 'success');
    setEditingNoteConn(null);
  };

  // Hidden input refs
  const bannerGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const loadDomainTelemetry = () => {
    setMembers(getStartupEntityMembers());
    setInvitations(getStartupInvitations());
    setVerification(getStartupVerificationStatus());
    setEndorsements(getStartupEndorsements());
    setEntitlements(resolveStartupEntitlements());
    setSubscription(getStartupSubscription());
    setFailedPaymentSim(getFailedPaymentSimulation());
  };

  // Load and listen to identity and domain updates
  useEffect(() => {
    const syncWorkspaceData = () => {
      let userProfile: any = null;
      let currentUser: any = null;
      let startupEntity: any = null;

      try {
        const storedProf = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
        if (storedProf) userProfile = JSON.parse(storedProf);
      } catch (_) {}

      try {
        const storedUser = localStorage.getItem('xentro_current_user') || localStorage.getItem('xentro_auth_user');
        if (storedUser) currentUser = JSON.parse(storedUser);
      } catch (_) {}

      let personalProfile: any = null;
      try {
        const rawPersonal = localStorage.getItem('xentro_personal_profile');
        if (rawPersonal) personalProfile = JSON.parse(rawPersonal);
      } catch (_) {}

      try {
        const rawEntities = localStorage.getItem('xentro_startup_entities');
        if (rawEntities) {
          const parsed = JSON.parse(rawEntities);
          if (Array.isArray(parsed) && parsed.length > 0) {
            startupEntity = parsed[parsed.length - 1];
          }
        }
      } catch (_) {}

      const founderName = personalProfile?.fullName || startupEntity?.founderName || userProfile?.name || currentUser?.fullName || 'Founder';
      const startupName = startupEntity?.startupName || userProfile?.organization || `${founderName}'s Venture`;
      const stage = startupEntity?.stage || userProfile?.stageOrFocus || 'Early Stage';
      const industry = startupEntity?.industry || personalProfile?.industries?.[0] || userProfile?.sector || 'Enterprise Software & Technology';
      const location = personalProfile?.location || startupEntity?.location || userProfile?.location || 'India';
      const website = startupEntity?.website || personalProfile?.website || 'https://xentro.io';

      setData((prev) => ({
        ...prev,
        identity: {
          ...prev.identity,
          founderName,
          startupName,
          stage: `${stage} · Verified`,
          industry,
          headquarters: location,
          website,
          overview: startupEntity?.description || `${startupName} is building next-generation innovation connected via Xentro ecosystem.`,
        },
      }));
    };

    syncWorkspaceData();
    setBannerImage(getStartupBanner());
    setAvatarImage(getStartupAvatar());
    loadDomainTelemetry();

    const handleBannerChange = (e: Event) => {
      const ce = e as CustomEvent;
      setBannerImage(ce.detail?.banner || null);
    };
    const handleAvatarChange = (e: Event) => {
      const ce = e as CustomEvent;
      setAvatarImage(ce.detail?.avatar || null);
    };

    const handleDomainChange = () => {
      syncWorkspaceData();
      loadDomainTelemetry();
    };

    const syncLiveConnections = () => {
      const raw = connectionService.getConnections();
      if (raw && raw.length > 0) {
        const mapped: EcosystemConnection[] = raw.map((c: any) => ({
          id: c.id,
          name: c.name || 'Connected Member',
          role: c.role || 'Partner',
          organization: c.organization || c.company || 'Ecosystem',
          avatar: c.avatar || '/xentro-logo.png',
          category: (c.role?.toLowerCase().includes('investor')
            ? 'Investor'
            : c.role?.toLowerCase().includes('mentor')
            ? 'Mentor'
            : c.role?.toLowerCase().includes('esp')
            ? 'ESP'
            : 'Startup') as any,
          email: c.email || '',
          connectionDate: c.connectedAt || 'Recently',
          status: 'Connected',
          founderNotes: {
            notes: 'Connected via Xentro ecosystem',
            nextFollowUpDate: '',
            relationshipStatus: 'Active Discussion',
          },
        }));
        setConnections(mapped);
      } else {
        setConnections([]);
      }
    };

    const currentProfile = getUserProfile();
    const currentUid = currentProfile?.id || '';
    if (currentUid) {
      followService.getFollowStats(currentUid).then((stats) => {
        setFollowStats({
          followersCount: stats.followersCount,
          followingCount: stats.followingCount,
        });
      });
    }

    syncLiveConnections();

    const handleConnectionsUpdate = () => {
      syncLiveConnections();
    };

    const handleFollowsUpdate = (e: Event) => {
      const ce = e as CustomEvent;
      if (!currentUid || ce.detail?.targetUserId === currentUid) {
        setFollowStats((prev) => ({
          ...prev,
          followersCount: ce.detail?.followersCount ?? prev.followersCount,
          followingCount: ce.detail?.followingCount ?? prev.followingCount,
        }));
      }
    };

    window.addEventListener('xentro-startup-banner-changed', handleBannerChange);
    window.addEventListener('xentro-startup-avatar-changed', handleAvatarChange);
    window.addEventListener('xentro-startup-members-changed', handleDomainChange);
    window.addEventListener('xentro-startup-billing-changed', handleDomainChange);
    window.addEventListener('xentro-startup-endorsements-changed', handleDomainChange);
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsUpdate);
    window.addEventListener(FOLLOWS_UPDATED_EVENT, handleFollowsUpdate);

    return () => {
      window.removeEventListener('xentro-startup-banner-changed', handleBannerChange);
      window.removeEventListener('xentro-startup-avatar-changed', handleAvatarChange);
      window.removeEventListener('xentro-startup-members-changed', handleDomainChange);
      window.removeEventListener('xentro-startup-billing-changed', handleDomainChange);
      window.removeEventListener('xentro-startup-endorsements-changed', handleDomainChange);
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleConnectionsUpdate);
      window.removeEventListener(FOLLOWS_UPDATED_EVENT, handleFollowsUpdate);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Process chosen file with lag-free canvas optimization
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit. Please choose a smaller file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = target === 'banner' ? 1200 : 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (target === 'banner') {
            setBannerImage(optimizedDataUrl);
            setStartupBanner(optimizedDataUrl);
            showToast('Startup cover banner updated successfully!', 'success');
          } else {
            setAvatarImage(optimizedDataUrl);
            setStartupAvatar(optimizedDataUrl);
            showToast('Startup profile photo updated successfully!', 'success');
          }
        } else {
          if (target === 'banner') {
            setBannerImage(dataUrl);
            setStartupBanner(dataUrl);
          } else {
            setAvatarImage(dataUrl);
            setStartupAvatar(dataUrl);
          }
        }
      };
      img.onerror = () => {
        showToast('Failed to process image file', 'error');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);

    e.target.value = '';
    setIsBannerMenuOpen(false);
    setIsPhotoActionModalOpen(false);
  };

  // Camera handling for profile photo
  const startCamera = async () => {
    setIsPhotoActionModalOpen(false);
    setIsCameraModalOpen(true);
    setCapturedPhoto(null);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Direct webcam access failed or unavailable, providing camera input fallback:', err);
      setCameraError(err.message || 'Unable to access camera directly');
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraModalOpen(false);
    setCapturedPhoto(null);
    setCameraError(null);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight) || 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoData);
  };

  const retakeSnapshot = () => {
    setCapturedPhoto(null);
    if (videoRef.current && cameraStream) {
      videoRef.current.play().catch(() => {});
    }
  };

  const saveCapturedPhoto = () => {
    if (!capturedPhoto) return;
    setAvatarImage(capturedPhoto);
    setStartupAvatar(capturedPhoto);
    stopCamera();
    showToast('New profile photo captured and saved!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs for Banner & Avatar Uploads */}
      <input
        ref={bannerGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'banner')}
      />
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'banner')}
      />
      <input
        ref={avatarGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'avatar')}
      />
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'avatar')}
      />
      <input
        ref={avatarCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'avatar')}
      />

      {/* 1. Header Hero Card with Sleek Editable Cover Banner */}
      <div className="relative rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle overflow-hidden">
        {/* Cover Banner Area */}
        <div className="relative h-24 sm:h-28 md:h-32 w-full overflow-hidden bg-gradient-to-r from-emerald-950/40 via-[#181B1A] to-lime-950/30">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt="Startup Cover Banner"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(#D9FF3F_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
          )}

          {/* Edit Banner Action Button */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <button
              onClick={() => {
                setIsPhotoActionModalOpen(false);
                setIsBannerMenuOpen(!isBannerMenuOpen);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              title="Change cover banner"
            >
              <Camera className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span className="hidden xs:inline sm:inline">Edit Banner</span>
            </button>

            {/* Banner Options Dropdown */}
            {isBannerMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsBannerMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-2xl p-1.5 z-40 space-y-1 animate-scale-up">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Cover Banner
                  </div>

                  <button
                    onClick={() => {
                      bannerGalleryInputRef.current?.click();
                      setIsBannerMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors flex items-center gap-2 text-left cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#D9FF3F]" />
                    <span>Upload from Gallery</span>
                  </button>

                  <button
                    onClick={() => {
                      bannerFileInputRef.current?.click();
                      setIsBannerMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors flex items-center gap-2 text-left cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload from Files</span>
                  </button>

                  {bannerImage && (
                    <button
                      onClick={() => {
                        setBannerImage(null);
                        setStartupBanner(null);
                        setIsBannerMenuOpen(false);
                        showToast('Banner reset to default theme', 'info');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 text-left cursor-pointer border-t border-gray-100 dark:border-[#262A29]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Banner</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Banner Lower Details & Profile Photo Row */}
        <div className="px-4 sm:px-5 pb-3.5 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-7 sm:-mt-9">
            {/* Logo / Profile Photo with Prominent Edit Badge & Popup Trigger */}
            <div className="flex items-end gap-3.5">
              <div
                onClick={() => setIsPhotoActionModalOpen(true)}
                className="relative group shrink-0 cursor-pointer"
                title="Click to change profile photo"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-[#202422] border-3 border-white dark:border-[#181B1A] shadow-md overflow-hidden flex items-center justify-center p-0.5 relative">
                  <img
                    src={avatarImage || data.identity.logo}
                    alt="Startup Logo"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.src = '/xentro-logo.png';
                    }}
                  />
                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white">
                    <Camera className="w-5 h-5 text-[#D9FF3F]" />
                    <span className="text-[9px] font-bold text-[#D9FF3F] mt-0.5">Edit</span>
                  </div>
                </div>

                {/* Edit Photo Camera Badge Button - High visibility */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoActionModalOpen(true);
                  }}
                  className="absolute -bottom-1.5 -right-1.5 z-20 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] shadow-lg flex items-center justify-center border-2 border-white dark:border-[#181B1A] hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-black/10"
                  title="Change profile photo"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Startup Text Info */}
              <div className="space-y-0.5 pb-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold font-sora tracking-tight text-[#101212] dark:text-white">
                    {data.identity.startupName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Good afternoon, <strong className="text-[#101212] dark:text-white font-semibold">{data.identity.founderName}</strong> &bull; {data.identity.stage} &bull; {data.identity.headquarters}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => onNavigateTab('profile')}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all active:scale-95 cursor-pointer border border-gray-200 dark:border-[#262A29]"
              >
                Profile Studio
              </button>
              <button
                onClick={() => onNavigateTab('ask')}
                className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Manage Round</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Failed Payment Alert (if simulated or real payment issue) */}
      {failedPaymentSim && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                  Payment Failed &bull; Action Required
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  Grace Period Active (14 Days)
                </span>
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-400/90 mt-0.5">
                Your last subscription invoice payment of ₹17,700 was declined by the bank. Please retry payment or update your payment method to maintain uninterrupted institutional access.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer"
          >
            Resolve in Billing
          </button>
        </div>
      )}

      {/* Inbound ESP Endorsement Banner */}
      {endorsements.filter((e) => e.status === 'Pending').length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#181B1A] to-[#D9FF3F]/10 border border-emerald-500/30 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-slide">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center font-bold text-lg shrink-0 border border-[#D9FF3F]/30">
              <Award className="w-6 h-6 text-emerald-600 dark:text-[#D9FF3F]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Inbound Institutional Endorsement
                </span>
                <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Received {endorsements.find((e) => e.status === 'Pending')?.startDate || 'Recently'}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#101212] dark:text-white font-sora">
                {endorsements.find((e) => e.status === 'Pending')?.espName} has offered to sponsor and endorse your startup
              </h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-2xl leading-relaxed">
                Scope: <strong className="text-[#101212] dark:text-white font-semibold">{endorsements.find((e) => e.status === 'Pending')?.relationshipType || 'Incubated'} ({endorsements.find((e) => e.status === 'Pending')?.program})</strong>. Accepting this endorsement unlocks full <strong>Startup Pro</strong> platform access with <strong>zero direct fees</strong> and displays an institutional badge on your public profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                const pending = endorsements.find((e) => e.status === 'Pending');
                if (pending) {
                  acceptESPEndorsement(pending.id);
                  loadDomainTelemetry();
                  showToast(`Endorsement from ${pending.espName} accepted! Startup Pro features unlocked.`, 'success');
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Accept Endorsement</span>
            </button>
            <button
              onClick={() => {
                const pending = endorsements.find((e) => e.status === 'Pending');
                if (pending) {
                  declineESPEndorsement(pending.id, 'Founder declined sponsorship offer');
                  loadDomainTelemetry();
                  showToast('Endorsement offer declined.', 'info');
                }
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] transition-all cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => onNavigateTab('billing')}
              className="p-2 rounded-xl text-gray-500 hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
              title="Review in Billing & Payments"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Operational Telemetry Matrix (Section 10) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Telemetry 1: Entity Verification */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to view Entity Verification records & RBAC"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verification</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold font-sora text-[#101212] dark:text-white truncate">
            {verification?.overallStatus === 'Verified' ? 'Institutional Verified' : 'Under Review'}
          </div>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex items-center gap-1">
            <span>DPIIT &bull; CIN &bull; Founder ID</span>
          </p>
        </div>

        {/* Telemetry 2: Platform Entitlement */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to manage Xentro Subscription & Entitlements"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Entitlement</span>
            <div className="p-1 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] group-hover:scale-105">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold font-sora text-[#101212] dark:text-white truncate">
            {entitlements?.planTier || 'Startup Pro'}
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate font-medium">
            {entitlements?.source === 'ESP Endorsement'
              ? `Via ${entitlements.sponsoringEntityName || 'ESP'}`
              : entitlements?.source || 'Direct Subscription'}
          </p>
        </div>

        {/* Telemetry 3: ESP Endorsement */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to view Active and Inbound ESP Endorsements"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">ESP Endorsement</span>
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold font-sora text-[#101212] dark:text-white truncate">
            {endorsements.filter((e) => e.status === 'Active').length} Active
            {endorsements.some((e) => e.status === 'Pending') && (
              <span className="ml-1 text-[10px] text-amber-500 font-normal">
                ({endorsements.filter((e) => e.status === 'Pending').length} Pending)
              </span>
            )}
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate">
            {endorsements.find((e) => e.status === 'Active')?.espName || 'No Active Endorsement'}
          </p>
        </div>

        {/* Telemetry 4: Billing Health */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to view Billing & Payments module"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Billing Status</span>
            <div className={`p-1 rounded-lg ${
              failedPaymentSim
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xs sm:text-sm font-bold font-sora truncate ${
            failedPaymentSim ? 'text-rose-600 dark:text-rose-400' : 'text-[#101212] dark:text-white'
          }`}>
            {failedPaymentSim ? 'Payment Overdue' : 'Good Standing'}
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate">
            {entitlements?.directPaymentRequired ? 'Auto-pay Configured' : '₹0 Direct (Sponsored)'}
          </p>
        </div>

        {/* Telemetry 5: Entity Team & RBAC */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to manage Entity Members & Roles"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Entity Team</span>
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold font-sora text-[#101212] dark:text-white truncate">
            {members.length} Members
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate">
            {invitations.length > 0 ? `${invitations.length} invite pending` : '7 Granular Roles'}
          </p>
        </div>

        {/* Telemetry 6: DD Locker Access */}
        <div
          onClick={() => onNavigateTab('dd_locker')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all group"
          title="Click to view Virtual Due Diligence Locker"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-bold uppercase tracking-wider">DD Locker</span>
            <div className="p-1 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 group-hover:bg-lime-500/20">
              <FolderLock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold font-sora text-[#101212] dark:text-white truncate">
            Virtual Data Room
          </div>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            Watermarked & Audited
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid (Compact 6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('profile')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">Profile Complete</span>
            <div className="p-1 rounded-lg bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {data.metrics.profileCompletionPct}%
          </div>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            Institutional Grade
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">Profile Views</span>
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Eye className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {data.metrics.profileViews}
          </div>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            {data.metrics.profileViewsDelta}
          </p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => {
            const el = document.getElementById('startup-connections-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">Connections</span>
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {connections.length}
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate font-medium">
            {followStats.followersCount} Followers &bull; {followStats.followingCount} Following
          </p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('ask')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">Ask Responses</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {data.metrics.askResponsesCount}
          </div>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            3 new responses
          </p>
        </div>

        {/* Metric 5 */}
        <div
          onClick={() => onNavigateTab('my_applications')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">My Applications</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {data.metrics.opportunitiesAppliedCount}
          </div>
          <p className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] truncate">
            Active Submissions (2 in review)
          </p>
        </div>

        {/* Metric 6 */}
        <div
          onClick={() => onNavigateTab('dd_locker')}
          className="p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
            <span className="text-[10px] font-semibold">DD Requests</span>
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <FolderLock className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-bold font-sora text-[#101212] dark:text-white">
            {data.metrics.ddRequestsCount}
          </div>
          <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold truncate">
            Institutional VCs
          </p>
        </div>
      </div>

      {/* 3. Middle Section: Profile Completion Breakdown & Current Active Ask */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Completion Card (1 Column) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                Profile Completion
              </h3>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Complete all sections to unlock institutional verification
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-[#101212] dark:text-[#D9FF3F]">
              {data.metrics.profileCompletionPct}%
            </span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-[#202422] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D9FF3F] h-full rounded-full transition-all duration-500"
              style={{ width: `${data.metrics.profileCompletionPct}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            {data.completionChecklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    item.completed ? 'bg-emerald-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-transparent'
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className={`font-semibold ${item.completed ? 'text-[#101212] dark:text-white' : 'text-[#565B59] dark:text-[#B6B8B7]'}`}>
                    {item.section}
                  </span>
                </div>

                {item.completed ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (item.section === 'Finances') onNavigateTab('finances');
                      else if (item.section === 'DD Locker') onNavigateTab('dd_locker');
                      else onNavigateTab('profile');
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-[11px] cursor-pointer"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Ask & Funding Target (2 Columns) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Active Ecosystem Ask
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {data.currentAsk.type}
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Highest-priority round currently broadcast to verified investors
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('ask')}
              className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Ask</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!data.currentAsk?.id || data.currentAsk?.title === 'No Active Ask' ? (
            <div className="p-8 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-center space-y-2">
              <p className="text-sm font-bold text-[#101212] dark:text-white">No Active Ecosystem Ask</p>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Create an open funding round, grant request, or advisory ask to broadcast to verified partners.</p>
              <button
                onClick={() => onNavigateTab('startup_asks')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] font-bold text-xs hover:bg-[#C7F020] transition-all cursor-pointer"
              >
                + Create Ecosystem Ask
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-[#101212] dark:text-white font-sora">
                    {data.currentAsk.title}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Instrument: {data.currentAsk.instrument} &bull; Cap: {data.currentAsk.valuationCap}
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7] block">Closing Date:</span>
                  <span className="text-xs font-bold text-[#101212] dark:text-white">{data.currentAsk.closingDate}</span>
                </div>
              </div>

              {/* Funding Numbers */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold tracking-wider block">
                    Raising
                  </span>
                  <span className="text-lg font-bold font-sora text-[#101212] dark:text-white">
                    {data.currentAsk.targetAmount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold tracking-wider block">
                    Committed
                  </span>
                  <span className="text-lg font-bold font-sora text-emerald-600 dark:text-emerald-400">
                    {data.currentAsk.committedAmount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold tracking-wider block">
                    Remaining
                  </span>
                  <span className="text-lg font-bold font-sora text-[#101212] dark:text-white">
                    {data.currentAsk.remainingAmount}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                  <span>Allocation Filled: {data.currentAsk.percentComplete}%</span>
                  <span>Min Ticket: {data.currentAsk.minInvestment}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D9FF3F] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.currentAsk.percentComplete}%` }}
                  />
                </div>
              </div>

              {/* Use of funds preview */}
              {data.currentAsk.useOfFunds && data.currentAsk.useOfFunds.length > 0 && (
                <div className="pt-2 border-t border-gray-200/60 dark:border-[#262A29]/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block mb-1.5">
                    Planned Use of Funds:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.currentAsk.useOfFunds.map((u, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 text-[#101212] dark:text-white"
                      >
                        {u.category}: <strong className="text-[#9EBE12] dark:text-[#D9FF3F]">{u.percentage}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Startup Progress Tracker (4 Columns: Company, Product, Market, Funding) */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Startup Milestone Progress Tracker
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Key operational roadmap across Company, Product, Market traction, and Capital
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Phase: Growth Acceleration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Company & Governance</span>
            </span>
            <div className="space-y-1.5">
              {data.progressTracker.company.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    item.completed ? 'bg-emerald-500 text-white' : 'border border-gray-400'
                  }`}>
                    {item.completed && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className={item.completed ? 'text-[#101212] dark:text-white font-medium' : 'text-[#565B59]'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Product Engineering</span>
            </span>
            <div className="space-y-1.5">
              {data.progressTracker.product.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    item.completed ? 'bg-emerald-500 text-white' : item.current ? 'bg-[#D9FF3F] text-[#101212]' : 'border border-gray-400'
                  }`}>
                    {item.completed ? <Check className="w-2.5 h-2.5" /> : item.current ? '•' : ''}
                  </div>
                  <span className={item.current ? 'font-bold text-[#9EBE12] dark:text-[#D9FF3F]' : item.completed ? 'text-[#101212] dark:text-white font-medium' : 'text-[#565B59]'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Market */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Market & Traction</span>
            </span>
            <div className="space-y-1.5">
              {data.progressTracker.market.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    item.completed ? 'bg-emerald-500 text-white' : item.current ? 'bg-[#D9FF3F] text-[#101212]' : 'border border-gray-400'
                  }`}>
                    {item.completed ? <Check className="w-2.5 h-2.5" /> : item.current ? '•' : ''}
                  </div>
                  <span className={item.current ? 'font-bold text-[#9EBE12] dark:text-[#D9FF3F]' : item.completed ? 'text-[#101212] dark:text-white font-medium' : 'text-[#565B59]'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Funding */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
            <span className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#D9FF3F]" />
              <span>Capital & Funding</span>
            </span>
            <div className="space-y-1.5">
              {data.progressTracker.funding.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    item.completed ? 'bg-emerald-500 text-white' : item.current ? 'bg-[#D9FF3F] text-[#101212]' : 'border border-gray-400'
                  }`}>
                    {item.completed ? <Check className="w-2.5 h-2.5" /> : item.current ? '•' : ''}
                  </div>
                  <span className={item.current ? 'font-bold text-[#9EBE12] dark:text-[#D9FF3F]' : item.completed ? 'text-[#101212] dark:text-white font-medium' : 'text-[#565B59]'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity & Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity (2 Columns) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Recent Ecosystem Activity
            </h3>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">Chronological updates</span>
          </div>

          <div className="space-y-3">
            {data.recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <img src={act.actorAvatar} alt={act.actorName} className="w-9 h-9 rounded-full object-cover mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101212] dark:text-white">{act.actorName}</span>
                      <span className="text-[11px] text-[#565B59] dark:text-[#8E9390]">&bull; {act.actorRole}</span>
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">{act.content}</p>
                    <span className="text-[10px] text-[#565B59] dark:text-[#8E9390] block mt-1">{act.timestamp}</span>
                  </div>
                </div>

                {act.actionable && (
                  <button
                    onClick={() => {
                      if (act.type === 'dd_request') onNavigateTab('dd_locker');
                      else if (act.type === 'opportunity_matched') onNavigateTab('my_applications');
                      else {
                        const el = document.getElementById('startup-connections-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-gray-700 hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white whitespace-nowrap transition-colors cursor-pointer self-center"
                  >
                    {act.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status (1 Column) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <div className="pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Verification Center
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Regulatory & identity attestations
            </p>
          </div>

          <div className="space-y-2">
            {data.verificationStatus.map((v, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between text-xs"
              >
                <span className="font-medium text-[#101212] dark:text-white truncate">{v.item}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.badgeColor}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => showToast('Opening MCA verification checklist...', 'info')}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Submit Pending MSME Proof</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 6. Integrated Connections & Ecosystem Stakeholders Section (Combined into Overview) */}
      <div id="startup-connections-section" className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5 animate-fade-slide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#262A29]">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span>Connections & Ecosystem CRM</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                {connections.length} Total Connections
              </span>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Manage relationships with mentors, institutional investors, peer startups, and incubator partners.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
            {(['All', 'Investor', 'Mentor', 'Startup', 'ESP'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveConnectionCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeConnectionCategory === cat
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All' : `${cat}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search connections by name, role, firm..."
            value={connectionSearchQuery}
            onChange={(e) => setConnectionSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white focus:outline-hidden"
          />
        </div>

        {/* Connections Grid */}
        {connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {connections
            .filter((c) => {
              const matchesCat = activeConnectionCategory === 'All' || c.category === activeConnectionCategory;
              const matchesQuery =
                c.name.toLowerCase().includes(connectionSearchQuery.toLowerCase()) ||
                c.organization.toLowerCase().includes(connectionSearchQuery.toLowerCase()) ||
                c.role.toLowerCase().includes(connectionSearchQuery.toLowerCase());
              return matchesCat && matchesQuery;
            })
            .map((conn) => (
              <div
                key={conn.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F]/50 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={conn.avatar}
                        alt={conn.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#262A29]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#101212] dark:text-white line-clamp-1">
                          {conn.name}
                        </h4>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">
                          {conn.role} &bull; {conn.organization}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        conn.category === 'Investor'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : conn.category === 'Mentor'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : conn.category === 'ESP'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {conn.category}
                    </span>
                  </div>

                  {/* Stage or status pill */}
                  {(conn.investorStage || conn.mentorStage || conn.founderNotes?.relationshipStatus) && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-[#565B59] dark:text-[#8E9390]">Stage:</span>
                      <span className="font-semibold text-[#101212] dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29]">
                        {conn.investorStage || conn.mentorStage || conn.founderNotes?.relationshipStatus}
                      </span>
                    </div>
                  )}

                  {/* Founder private note snippet if exists */}
                  {conn.founderNotes?.notes && (
                    <div className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-100 dark:border-[#262A29] text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      <span className="font-semibold text-[#101212] dark:text-white mr-1">Note:</span>
                      {conn.founderNotes.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-200/60 dark:border-[#262A29]">
                  <button
                    onClick={() => openNoteEditor(conn)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[11px] font-semibold text-[#565B59] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Private Notes</span>
                  </button>

                  <button
                    onClick={() => {
                      showToast(`Starting direct chat with ${conn.name}...`, 'info');
                      window.dispatchEvent(new CustomEvent('xentro-open-messages', { detail: { participant: conn.name } }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#D9FF3F] hover:bg-[#C7F020] text-[11px] font-bold text-[#101212] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
        ) : (
          <div className="py-12 px-6 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#101212] dark:text-white">No active connections yet</h4>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto mt-1">
                Explore the Feed or Discover ecosystem members to connect with founders, mentors, and investors.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Private Founder Notes Editor Modal */}
      {editingNoteConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold font-sora text-[#101212] dark:text-white">
                  Founder Private Note
                </h3>
              </div>
              <button
                onClick={() => setEditingNoteConn(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Confidential notes for {editingNoteConn.name} ({editingNoteConn.organization}). These notes are strictly private to you.
            </p>

            <form onSubmit={savePrivateNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Relationship Stage / Status
                </label>
                <input
                  type="text"
                  value={connRelStatus}
                  onChange={(e) => setConnRelStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white"
                  placeholder="e.g. Due Diligence / Lead Investor Call"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Private Notes
                </label>
                <textarea
                  rows={3}
                  value={connNoteText}
                  onChange={(e) => setConnNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white resize-none"
                  placeholder="Key discussion points, investor feedback, terms agreed upon..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={connNextFollowUp}
                  onChange={(e) => setConnNextFollowUp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-medium text-[#101212] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={() => setEditingNoteConn(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Action Selection Popup Modal (Take Photo, Upload from Gallery, Upload from Files) */}
      {isPhotoActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsPhotoActionModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#202422] border-2 border-[#D9FF3F] shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={avatarImage || data.identity.logo}
                    alt="Current profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/xentro-logo.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#101212] dark:text-white font-sora">
                    Update Profile Photo
                  </h3>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Take a live photo or upload from device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoActionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Take Photo */}
              <button
                type="button"
                onClick={() => {
                  setIsPhotoActionModalOpen(false);
                  startCamera();
                }}
                className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] hover:bg-[#D9FF3F]/10 border border-gray-100 dark:border-[#262A29] hover:border-[#D9FF3F] transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Take Photo
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">
                    Snap a live picture with your camera
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#565B59] group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-colors" />
              </button>

              {/* Option 2: Upload from Gallery */}
              <button
                type="button"
                onClick={() => {
                  setIsPhotoActionModalOpen(false);
                  avatarGalleryInputRef.current?.click();
                }}
                className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] hover:bg-emerald-500/10 border border-gray-100 dark:border-[#262A29] hover:border-emerald-500/50 transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Upload from Gallery
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">
                    Pick an image from your photo album
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#565B59] group-hover:text-[#101212] dark:group-hover:text-emerald-400 transition-colors" />
              </button>

              {/* Option 3: Upload from Files */}
              <button
                type="button"
                onClick={() => {
                  setIsPhotoActionModalOpen(false);
                  avatarFileInputRef.current?.click();
                }}
                className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-[#202422] hover:bg-blue-500/10 border border-gray-100 dark:border-[#262A29] hover:border-blue-500/50 transition-all flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#101212] dark:text-white block">
                    Upload from Files
                  </span>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">
                    Browse files on your computer or device
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#565B59] group-hover:text-[#101212] dark:group-hover:text-blue-400 transition-colors" />
              </button>

              {/* Option 4: Remove Custom Photo (if set) */}
              {avatarImage && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarImage(null);
                    setStartupAvatar(null);
                    setIsPhotoActionModalOpen(false);
                    showToast('Profile photo reset to default', 'info');
                  }}
                  className="w-full p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Custom Photo</span>
                </button>
              )}
            </div>

            {/* Footer Cancel */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsPhotoActionModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Camera Capture Modal (for taking profile photo) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#101212] dark:text-white font-sora">
                    Take Profile Photo
                  </h3>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Position your face or company logo inside the frame
                  </p>
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder area */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-[#D9FF3F]/40">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Circular Overlay Target */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-3/4 rounded-full border-2 border-[#D9FF3F] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                  </div>
                </>
              )}

              {/* Hidden canvas for snapshot rendering */}
              <canvas ref={canvasRef} className="hidden" />

              {cameraError && !capturedPhoto && (
                <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center space-y-3 z-10">
                  <Camera className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-white max-w-xs">{cameraError}</p>
                  <button
                    onClick={() => {
                      avatarCameraInputRef.current?.click();
                      stopCamera();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] font-bold text-xs cursor-pointer shadow-md"
                  >
                    Open Device Camera
                  </button>
                </div>
              )}
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {capturedPhoto ? (
                <>
                  <button
                    type="button"
                    onClick={retakeSnapshot}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={saveCapturedPhoto}
                    className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Set as Profile Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Cancel
                  </button>

                  {!cameraError && (
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
