'use client';

import React, { useState } from 'react';
import {
  Users,
  X,
  Search,
  Building2,
  Sparkles,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  Plus,
  Tag,
  Star,
  Eye,
  CheckCircle2,
  GraduationCap,
  FileSpreadsheet,
  Upload,
  Download,
  Check,
  Info,
} from 'lucide-react';
import { ESPMember } from '@/types/esp';
import {
  ESPPublicCategory,
  ESPRelationshipTypePublic,
  ESPSourceType,
  ESPPublicVisibilityStatus,
  ESPPublicTeamMember,
} from '@/types/espPublicTeam';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceMembers: ESPMember[];
  existingTeamMemberIds: string[];
  initialMode?: 'internal' | 'student_roster' | 'external_xentro' | 'external_manual';
  onAddMember: (newMember: Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>) => void;
  onBulkAddStudents?: (students: Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>>) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceMembers,
  existingTeamMemberIds,
  initialMode = 'internal',
  onAddMember,
  onBulkAddStudents,
}) => {
  const [addMode, setAddMode] = useState<
    'internal' | 'student_roster' | 'external_xentro' | 'external_manual'
  >(initialMode);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedInternalMember, setSelectedInternalMember] = useState<ESPMember | null>(null);
  const [studentConfirmed, setStudentConfirmed] = useState(false);

  // Student Roster specific state: CSV vs Manual
  const [studentSubMode, setStudentSubMode] = useState<'csv' | 'manual'>('csv');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedCsvStudents, setParsedCsvStudents] = useState<
    Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>>
  >([]);

  // Form Fields
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('/images/profile_avatar.webp');
  const [publicDesignation, setPublicDesignation] = useState('');
  const [internalRoleSnapshot, setInternalRoleSnapshot] = useState('');
  const [department, setDepartment] = useState('');
  const [organization, setOrganization] = useState('');
  const [projectOrStartupName, setProjectOrStartupName] = useState('');
  const [publicCategory, setPublicCategory] = useState<ESPPublicCategory>('Leadership & Governance');
  const [relationshipType, setRelationshipType] = useState<ESPRelationshipTypePublic>('Internal Member');
  const [publicBio, setPublicBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [investmentTicketSize, setInvestmentTicketSize] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [visibilityStatus, setVisibilityStatus] = useState<ESPPublicVisibilityStatus>('published');

  // Field-level visibility (safe defaults: email & phone FALSE!)
  const [fieldVisibility, setFieldVisibility] = useState({
    photo: true,
    designation: true,
    department: true,
    bio: true,
    expertise: true,
    linkedin: true,
    email: false,
    phone: false,
    xentroProfile: true,
  });

  if (!isOpen) return null;

  // Internal members search
  const filteredWorkspaceMembers = workspaceMembers.filter((m) => {
    const q = searchMemberQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q))
    );
  });

  const handlePickInternalMember = (member: ESPMember) => {
    setSelectedInternalMember(member);
    setName(member.name);
    setAvatar(member.avatar || '/images/profile_avatar.webp');
    setPublicDesignation(member.designation || member.role);
    setInternalRoleSnapshot(member.role);
    setDepartment(member.department || '');
    setEmail(member.email || '');
    setLinkedin('');
    setStudentConfirmed(false);

    const isStudent =
      member.role.toLowerCase().includes('student') ||
      member.role === 'Student Entrepreneur' ||
      member.role === 'Student';

    if (isStudent) {
      setPublicCategory('Student Innovators');
      setRelationshipType('Student');
    } else if (
      member.role.includes('Admin') ||
      member.role.includes('Director') ||
      member.role.includes('Owner')
    ) {
      setPublicCategory('Leadership & Governance');
      setRelationshipType('Internal Member');
    } else if (member.role.includes('Faculty')) {
      setPublicCategory('Faculty Coordinators');
      setRelationshipType('Faculty');
    } else {
      setPublicCategory('Core Team');
      setRelationshipType('Internal Member');
    }
  };

  // Preset Xentro Users
  const handlePickXentroPreset = (preset: {
    name: string;
    avatar: string;
    designation: string;
    organization: string;
    category: ESPPublicCategory;
    relationship: ESPRelationshipTypePublic;
    expertise: string[];
    bio: string;
    ticket?: string;
  }) => {
    setName(preset.name);
    setAvatar(preset.avatar);
    setPublicDesignation(preset.designation);
    setOrganization(preset.organization);
    setPublicCategory(preset.category);
    setRelationshipType(preset.relationship);
    setExpertise(preset.expertise);
    setPublicBio(preset.bio);
    if (preset.ticket) setInvestmentTicketSize(preset.ticket);
    setLinkedin('https://linkedin.com');
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    if (!expertise.includes(newTagInput.trim())) {
      if (expertise.length >= 6) return;
      setExpertise([...expertise, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setExpertise(expertise.filter((t) => t !== tag));
  };

  const isStudentSelected =
    (addMode === 'internal' &&
      selectedInternalMember &&
      (selectedInternalMember.role.toLowerCase().includes('student') ||
        selectedInternalMember.role === 'Student Entrepreneur')) ||
    addMode === 'student_roster' ||
    publicCategory === 'Student Innovators';

  // Sample CSV Data Simulation for Students
  const sampleStudentsCSVData: Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>> = [
    {
      espEntityId: 'uni_9',
      sourceType: 'entity_member',
      name: 'Rohan Iyer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      publicDesignation: 'Student Drone Engineer & Co-Founder',
      department: 'B.Tech Aerospace (Final Year)',
      organization: 'Aerovision AI (Campus Spinout)',
      projectOrStartupName: 'Aerovision AI',
      publicBio:
        'Building autonomous edge-compute drone cameras for precision agriculture and crop monitoring.',
      publicCategory: 'Student Innovators',
      relationshipType: 'Student',
      expertise: ['Drones', 'Computer Vision', 'PyTorch', 'ROS2'],
      displayOrder: 1,
      isFeatured: false,
      visibilityStatus: 'published',
      studentPrivacyNotice: true,
      fieldVisibility: {
        photo: true,
        designation: true,
        department: true,
        bio: true,
        expertise: true,
        linkedin: true,
        email: false,
        phone: false,
        xentroProfile: true,
      },
    },
    {
      espEntityId: 'uni_9',
      sourceType: 'entity_member',
      name: 'Sneha Sen',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      publicDesignation: 'MedTech Prototyper',
      department: 'Biomedical Engineering (3rd Year)',
      organization: 'CardioSense Labs',
      projectOrStartupName: 'CardioSense Labs',
      publicBio:
        'Developing ultra-low-cost wearable 3-lead ECG patches with offline arrhythmia detection for rural clinics.',
      publicCategory: 'Student Innovators',
      relationshipType: 'Student',
      expertise: ['MedTech', 'Biosensors', 'Hardware Prototyping'],
      displayOrder: 2,
      isFeatured: false,
      visibilityStatus: 'published',
      studentPrivacyNotice: true,
      fieldVisibility: {
        photo: true,
        designation: true,
        department: true,
        bio: true,
        expertise: true,
        linkedin: true,
        email: false,
        phone: false,
        xentroProfile: true,
      },
    },
    {
      espEntityId: 'uni_9',
      sourceType: 'entity_member',
      name: 'Varun Nair',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      publicDesignation: 'Full-Stack Developer & Peer Mentor',
      department: 'Computer Science (4th Year)',
      organization: 'PeerLearn EdTech',
      projectOrStartupName: 'PeerLearn',
      publicBio:
        'Creator of a campus peer-to-peer coding review tool currently used by 800+ engineering undergraduates.',
      publicCategory: 'Student Innovators',
      relationshipType: 'Student',
      expertise: ['Next.js', 'PostgreSQL', 'EdTech', 'Open Source'],
      displayOrder: 3,
      isFeatured: false,
      visibilityStatus: 'published',
      studentPrivacyNotice: true,
      fieldVisibility: {
        photo: true,
        designation: true,
        department: true,
        bio: true,
        expertise: true,
        linkedin: true,
        email: false,
        phone: false,
        xentroProfile: true,
      },
    },
    {
      espEntityId: 'uni_9',
      sourceType: 'entity_member',
      name: 'Pooja Deshmukh',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      publicDesignation: 'CleanTech Polymer Researcher',
      department: 'Chemical Engineering (Final Year)',
      organization: 'BioPlastic Solutions',
      projectOrStartupName: 'BioPlastic Solutions',
      publicBio:
        'Synthesizing marine seaweed biopolymers into 100% compostable thermal packaging film for pharmaceutical cold chains.',
      publicCategory: 'Student Innovators',
      relationshipType: 'Student',
      expertise: ['CleanTech', 'Biopolymers', 'Materials Science', 'Patents'],
      displayOrder: 4,
      isFeatured: false,
      visibilityStatus: 'published',
      studentPrivacyNotice: true,
      fieldVisibility: {
        photo: true,
        designation: true,
        department: true,
        bio: true,
        expertise: true,
        linkedin: true,
        email: false,
        phone: false,
        xentroProfile: true,
      },
    },
    {
      espEntityId: 'uni_9',
      sourceType: 'entity_member',
      name: 'Aditya Joshi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      publicDesignation: 'EV Telematics Lead',
      department: 'Mechanical & Automation (4th Year)',
      organization: 'VoltEdge Dynamics',
      projectOrStartupName: 'VoltEdge Dynamics',
      publicBio:
        'Designed custom CAN-bus telemetry data logger tracking battery thermal gradients across campus EV prototypes.',
      publicCategory: 'Student Innovators',
      relationshipType: 'Student',
      expertise: ['EV Mobility', 'Telematics', 'CAN Bus', 'IoT'],
      displayOrder: 5,
      isFeatured: false,
      visibilityStatus: 'published',
      studentPrivacyNotice: true,
      fieldVisibility: {
        photo: true,
        designation: true,
        department: true,
        bio: true,
        expertise: true,
        linkedin: true,
        email: false,
        phone: false,
        xentroProfile: true,
      },
    },
  ];

  // CSV File Upload & Parsing Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const parseCSVContent = (content: string) => {
    try {
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setParsedCsvStudents(sampleStudentsCSVData);
        return;
      }

      const rows: Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>> = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0]) {
          const studentName = parts[0];
          const designation = parts[1] || 'Student Innovator';
          const dept = parts[2] || 'Engineering Directorate';
          const proj = parts[3] || '';
          const bio = parts[4] || 'Student innovator developing campus venture prototype.';
          const tags = parts[5] ? parts[5].split(';').map((t) => t.trim()) : ['Innovation'];

          rows.push({
            espEntityId: 'uni_9',
            sourceType: 'entity_member',
            name: studentName,
            avatar: '/images/profile_avatar.webp',
            publicDesignation: designation,
            department: dept,
            organization: proj ? `${proj} (Student Project)` : undefined,
            projectOrStartupName: proj || undefined,
            publicBio: bio,
            publicCategory: 'Student Innovators',
            relationshipType: 'Student',
            expertise: tags,
            displayOrder: i,
            isFeatured: false,
            visibilityStatus: 'published',
            studentPrivacyNotice: true,
            fieldVisibility: {
              photo: true,
              designation: true,
              department: true,
              bio: true,
              expertise: true,
              linkedin: true,
              email: false,
              phone: false,
              xentroProfile: true,
            },
          });
        }
      }

      setParsedCsvStudents(rows.length > 0 ? rows : sampleStudentsCSVData);
    } catch {
      setParsedCsvStudents(sampleStudentsCSVData);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Name,Public Designation,Department / Year,Project or Startup Name,Short Bio,Expertise Tags (semicolon separated)\n' +
      'Rohan Iyer,Student Drone Engineer,B.Tech Aerospace (Final Year),Aerovision AI,Autonomous edge drone cameras for precision agriculture,Drones;Computer Vision;ROS2\n' +
      'Sneha Sen,MedTech Prototyper,Biomedical Engineering,CardioSense Labs,Wearable ECG patch for rural healthcare,MedTech;Biosensors;Hardware\n' +
      'Varun Nair,Full-Stack Lead,Computer Science,PeerLearn,Micro-mentorship platform for student coders,Next.js;PostgreSQL;EdTech\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'xentro_student_innovators_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmBulkCSV = () => {
    if (parsedCsvStudents.length === 0) return;
    if (onBulkAddStudents) {
      onBulkAddStudents(parsedCsvStudents);
    } else {
      parsedCsvStudents.forEach((student) => onAddMember(student));
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !publicDesignation.trim()) return;

    if (isStudentSelected && !studentConfirmed && addMode === 'internal') {
      return;
    }

    let sourceType: ESPSourceType = 'external_record';
    let membershipId: string | undefined = undefined;
    let xentroUserId: string | undefined = undefined;
    let xentroMentorId: string | undefined = undefined;
    let xentroInvestorId: string | undefined = undefined;

    if (addMode === 'internal') {
      sourceType = 'entity_member';
      membershipId = selectedInternalMember?.id;
    } else if (addMode === 'external_xentro') {
      sourceType = 'xentro_user';
      xentroUserId = `usr_${Date.now()}`;
      if (publicCategory === 'Mentors & Advisors') xentroMentorId = `men_${Date.now()}`;
      if (publicCategory === 'Investment Partners') xentroInvestorId = `inv_${Date.now()}`;
    }

    onAddMember({
      espEntityId: 'uni_9',
      sourceType,
      membershipId,
      xentroUserId,
      xentroMentorId,
      xentroInvestorId,
      name: name.trim(),
      avatar,
      publicDesignation: publicDesignation.trim(),
      internalRoleSnapshot: addMode === 'internal' ? internalRoleSnapshot : undefined,
      department: department.trim() || undefined,
      organization: organization.trim() || undefined,
      projectOrStartupName: projectOrStartupName.trim() || undefined,
      publicBio: publicBio.trim() || undefined,
      publicCategory: addMode === 'student_roster' ? 'Student Innovators' : publicCategory,
      relationshipType: addMode === 'student_roster' ? 'Student' : relationshipType,
      expertise,
      linkedin: linkedin.trim() || undefined,
      website: website.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      investmentTicketSize: investmentTicketSize.trim() || undefined,
      displayOrder: 99,
      isFeatured,
      visibilityStatus,
      fieldVisibility,
      studentPrivacyNotice: isStudentSelected || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/10 text-[#D9FF3F]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#101212] dark:text-white">
                Add to Public Team & Ecosystem
              </h3>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Feature workspace members, student innovators (CSV/manual), mentors, and investors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Mode Selector Tabs */}
        <div className="flex border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50 p-2 gap-1.5 text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setAddMode('internal')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              addMode === 'internal'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs border border-gray-200 dark:border-[#262A29]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>1. Internal Members</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddMode('student_roster');
              setPublicCategory('Student Innovators');
              setRelationshipType('Student');
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              addMode === 'student_roster'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs border border-gray-200 dark:border-[#262A29]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            <span>2. Students (CSV / Roster)</span>
          </button>

          <button
            type="button"
            onClick={() => setAddMode('external_xentro')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              addMode === 'external_xentro'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs border border-gray-200 dark:border-[#262A29]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>3. Link Xentro User</span>
          </button>

          <button
            type="button"
            onClick={() => setAddMode('external_manual')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              addMode === 'external_manual'
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs border border-gray-200 dark:border-[#262A29]'
                : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-gray-500" />
            <span>4. Manual Entry</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* OPTION 2: STUDENT ROSTER (CSV OR MANUAL) */}
          {addMode === 'student_roster' && (
            <div className="space-y-4">
              {/* Student Header & Switcher */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                      Student Innovators & Campus Founders
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Add students after Faculty Coordinators on your public profile via CSV batch or manual entry.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-[#181B1A] p-1 rounded-xl border border-emerald-500/30">
                  <button
                    type="button"
                    onClick={() => setStudentSubMode('csv')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                      studentSubMode === 'csv'
                        ? 'bg-emerald-500 text-black shadow-2xs'
                        : 'text-gray-500 hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    CSV File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSubMode('manual')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                      studentSubMode === 'manual'
                        ? 'bg-emerald-500 text-black shadow-2xs'
                        : 'text-gray-500 hover:text-[#101212] dark:hover:text-white'
                    }`}
                  >
                    Manual Student Entry
                  </button>
                </div>
              </div>

              {/* Sub-mode A: CSV Upload */}
              {studentSubMode === 'csv' ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#262A29] bg-gray-50/50 dark:bg-[#202422]/50 text-center space-y-3">
                    <FileSpreadsheet className="w-9 h-9 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        Upload Student Cohort CSV
                      </h4>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                        Supported columns: <span className="font-mono">Name, Public Designation, Department, Startup/Project, Bio, Expertise</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      <label className="px-4 py-2 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5 shadow-subtle">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse CSV File</span>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setCsvFileName('sample_student_roster.csv');
                          setParsedCsvStudents(sampleStudentsCSVData);
                        }}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-[#262A29] bg-white dark:bg-[#181B1A] text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#202422] transition-all cursor-pointer"
                      >
                        Load Sample Student Roster (5 Students)
                      </button>
                    </div>

                    {csvFileName && (
                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Loaded: {csvFileName} ({parsedCsvStudents.length} students parsed)
                      </p>
                    )}
                  </div>

                  {/* Template download link */}
                  <div className="flex items-center justify-between text-xs text-[#565B59] dark:text-[#B6B8B7] px-1">
                    <span>Need the standard CSV structure?</span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV Template</span>
                    </button>
                  </div>

                  {/* Parsed Students Preview */}
                  {parsedCsvStudents.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101212] dark:text-white">
                          Roster Preview ({parsedCsvStudents.length} Students Ready to Import):
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          Category: Student Innovators
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-[#262A29] divide-y divide-gray-100 dark:divide-[#262A29]">
                        {parsedCsvStudents.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white dark:bg-[#181B1A] flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <img
                                src={s.avatar || '/images/profile_avatar.webp'}
                                alt={s.name}
                                className="w-9 h-9 rounded-xl object-cover shrink-0 mt-0.5"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#101212] dark:text-white">
                                    {s.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-sm text-[8px] font-bold bg-amber-500/10 text-amber-600">
                                    Student
                                  </span>
                                </div>
                                <p className="text-[11px] font-semibold text-[#D9FF3F]">
                                  {s.publicDesignation}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {s.department} {s.organization ? `· ${s.organization}` : ''}
                                </p>
                                {s.expertise && s.expertise.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {s.expertise.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-1.5 py-0.2 rounded-sm text-[8px] font-semibold bg-gray-100 dark:bg-[#202422]"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setParsedCsvStudents(parsedCsvStudents.filter((_, i) => i !== idx))
                              }
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Remove from batch"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Safeguard banner */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          <strong>Privacy Safeguard Active:</strong> Student contact details (email & phone)
                          will remain strictly hidden by default. Only names, public designations, and project bios
                          will appear in the Student Innovators directory after Faculty Coordinators.
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleConfirmBulkCSV}
                          className="px-5 py-2.5 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] font-bold text-xs flex items-center gap-1.5 shadow-subtle hover:opacity-90 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Import All {parsedCsvStudents.length} Students to Public Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Form for Individual / Manual Add (when studentSubMode === 'manual' OR other modes) */}
          {(addMode !== 'student_roster' || studentSubMode === 'manual') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OPTION 1: INTERNAL MEMBERS SELECTOR */}
              {addMode === 'internal' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#101212] dark:text-white">
                      Select Internal Workspace Member:
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {workspaceMembers.length} Workspace Members Available
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      placeholder="Filter workspace members by name, role, email..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100 dark:divide-[#262A29]">
                    {filteredWorkspaceMembers.map((m) => {
                      const isSelected = selectedInternalMember?.id === m.id;
                      const isAlreadyTeam = existingTeamMemberIds.includes(m.id);
                      const isStudentRole =
                        m.role.toLowerCase().includes('student') ||
                        m.role === 'Student Entrepreneur' ||
                        m.role === 'Student';

                      return (
                        <div
                          key={m.id}
                          onClick={() => handlePickInternalMember(m)}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#D9FF3F]/15 border border-[#D9FF3F]/40'
                              : 'hover:bg-white dark:hover:bg-[#181B1A]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={m.avatar || '/images/profile_avatar.webp'}
                              alt={m.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#101212] dark:text-white">
                                  {m.name}
                                </span>
                                {isStudentRole && (
                                  <span className="px-1.5 py-0.2 rounded-sm text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    Student
                                  </span>
                                )}
                                {isAlreadyTeam && (
                                  <span className="px-1.5 py-0.2 rounded-sm text-[8px] font-bold bg-emerald-500/10 text-emerald-600">
                                    Already Listed
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                RBAC Role: {m.role} {m.department ? `· ${m.department}` : ''}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickInternalMember(m);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212]'
                                : 'border border-gray-200 dark:border-[#262A29] hover:bg-gray-100 dark:hover:bg-[#202422]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Student Safeguard Warning */}
                  {isStudentSelected && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                            Student Innovator Privacy Safeguard
                          </p>
                          <p className="text-amber-800 dark:text-amber-400 text-[11px] leading-relaxed mt-0.5">
                            This person is an internal Student member. By default, student innovators are protected
                            and hidden from public directories. Confirming will list their name in the Student Innovators
                            section. Direct contact numbers and email remain strictly hidden by default.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={studentConfirmed}
                          onChange={(e) => setStudentConfirmed(e.target.checked)}
                          className="rounded-sm text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                          I explicitly authorize displaying this student innovator on the ESP Public Profile
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 3: LINK XENTRO USER */}
              {addMode === 'external_xentro' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">Link Verified Xentro Mentor or Investor</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        name: 'Dr. Sandeep Kulkarni',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                        designation: 'Principal AI Architect & Fellow',
                        organization: 'NeuralPath Research',
                        category: 'Mentors & Advisors' as ESPPublicCategory,
                        relationship: 'External Mentor' as ESPRelationshipTypePublic,
                        expertise: ['Deep Learning', 'Computer Vision', 'MLOps'],
                        bio: 'Hands-on mentor guiding frontier tech startups on ML architectures and scalability.',
                      },
                      {
                        name: 'Ananya Roy',
                        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
                        designation: 'VP Product & Growth Advisor',
                        organization: 'Scaler Academy',
                        category: 'Mentors & Advisors' as ESPPublicCategory,
                        relationship: 'External Mentor' as ESPRelationshipTypePublic,
                        expertise: ['Product Strategy', 'Pricing Models', 'B2B SaaS'],
                        bio: 'Specializes in product-led growth, pricing tiers, and retention funnels.',
                      },
                      {
                        name: 'Blossom Angel Syndicate',
                        avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150',
                        designation: 'Lead Syndicate Partner',
                        organization: 'Blossom Angel Network',
                        category: 'Investment Partners' as ESPPublicCategory,
                        relationship: 'Investment Partner' as ESPRelationshipTypePublic,
                        expertise: ['Seed Investment', 'Syndicates', 'Angel Capital'],
                        bio: 'Consortium of 80+ CXOs writing quick angel checks into university spinouts.',
                        ticket: '$100K – $500K',
                      },
                    ].map((preset) => (
                      <div
                        key={preset.name}
                        onClick={() => handlePickXentroPreset(preset)}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:border-purple-400 cursor-pointer space-y-1 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={preset.avatar}
                            alt={preset.name}
                            className="w-6 h-6 rounded-md object-cover"
                          />
                          <span className="font-bold text-[11px] truncate text-[#101212] dark:text-white">
                            {preset.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{preset.designation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BASIC DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Iyer"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Avatar / Photo URL
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              {/* PUBLIC DESIGNATION & CATEGORY */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 dark:text-blue-300">
                    Public Designation vs Internal RBAC Role
                  </span>
                  {addMode === 'internal' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Internal RBAC: {internalRoleSnapshot || 'Member (Read-Only)'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#101212] dark:text-white mb-1">
                      Public Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={publicDesignation}
                      onChange={(e) => setPublicDesignation(e.target.value)}
                      placeholder="e.g. Student Drone Engineer / Founder"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#101212] dark:text-white mb-1">
                      Public Profile Category *
                    </label>
                    <select
                      value={publicCategory}
                      onChange={(e) => setPublicCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    >
                      <option value="Leadership & Governance">1. Leadership & Governance</option>
                      <option value="Core Team">2. Core Team / Program Team</option>
                      <option value="Mentors & Advisors">3. Mentors & Domain Advisors</option>
                      <option value="Investment Partners">4. Investors & Investment Partners</option>
                      <option value="Faculty Coordinators">5. Faculty & Institutional Coordinators</option>
                      <option value="Student Innovators">6. Student Innovators & Entrepreneurs</option>
                      <option value="Ecosystem Partners">7. Ecosystem & Strategic Partners</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DEPARTMENT & PROJECT NAME */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Department / College Year
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science (Final Year)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Project / Startup Name
                  </label>
                  <input
                    type="text"
                    value={projectOrStartupName}
                    onChange={(e) => {
                      setProjectOrStartupName(e.target.value);
                      if (!organization) setOrganization(e.target.value);
                    }}
                    placeholder="e.g. Aerovision AI"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Relationship Type
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  >
                    <option value="Student">Student Innovator</option>
                    <option value="Internal Member">Internal Member</option>
                    <option value="Faculty">Faculty</option>
                    <option value="External Mentor">External Mentor</option>
                    <option value="Investment Partner">Investment Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* SHORT BIO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#101212] dark:text-white">
                    Public Bio
                  </label>
                  <span className="text-[10px] text-gray-400">{publicBio.length} / 500</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={publicBio}
                  onChange={(e) => setPublicBio(e.target.value)}
                  placeholder="Summary of student venture, problem statement, and traction..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                />
              </div>

              {/* EXPERTISE TAGS */}
              <div>
                <label className="block font-bold text-[#101212] dark:text-white mb-1">
                  Expertise Tags
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and press Add..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-[#262A29] text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {expertise.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SOCIAL & CONTACT CHANNELS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Project Website / GitHub URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#262A29]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(isStudentSelected && !studentConfirmed && addMode === 'internal')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle ${
                    isStudentSelected && !studentConfirmed && addMode === 'internal'
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] hover:opacity-90'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Public Profile</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
