'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit2,
  X,
  Building2,
  Sparkles,
  UserCheck,
  Star,
  Eye,
  Mail,
  Phone,
  Globe,
  Tag,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  ESPPublicTeamMember,
  ESPPublicCategory,
  ESPRelationshipTypePublic,
  ESPPublicVisibilityStatus,
} from '@/types/espPublicTeam';

interface EditMemberModalProps {
  member: ESPPublicTeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, updates: Partial<ESPPublicTeamMember>) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [publicDesignation, setPublicDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [organization, setOrganization] = useState('');
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

  useEffect(() => {
    if (member) {
      setName(member.name);
      setAvatar(member.avatar || '/images/profile_avatar.webp');
      setPublicDesignation(member.publicDesignation);
      setDepartment(member.department || '');
      setOrganization(member.organization || '');
      setPublicCategory(member.publicCategory);
      setRelationshipType(member.relationshipType);
      setPublicBio(member.publicBio || '');
      setExpertise(member.expertise || []);
      setLinkedin(member.linkedin || '');
      setWebsite(member.website || '');
      setEmail(member.email || '');
      setPhone(member.phone || '');
      setInvestmentTicketSize(member.investmentTicketSize || '');
      setIsFeatured(member.isFeatured || false);
      setVisibilityStatus(member.visibilityStatus);
      setFieldVisibility({
        photo: member.fieldVisibility?.photo ?? true,
        designation: member.fieldVisibility?.designation ?? true,
        department: member.fieldVisibility?.department ?? true,
        bio: member.fieldVisibility?.bio ?? true,
        expertise: member.fieldVisibility?.expertise ?? true,
        linkedin: member.fieldVisibility?.linkedin ?? true,
        email: member.fieldVisibility?.email ?? false,
        phone: member.fieldVisibility?.phone ?? false,
        xentroProfile: member.fieldVisibility?.xentroProfile ?? true,
      });
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicDesignation.trim()) return;

    onSave(member.id, {
      name: name.trim(),
      avatar,
      publicDesignation: publicDesignation.trim(),
      department: department.trim() || undefined,
      organization: organization.trim() || undefined,
      publicBio: publicBio.trim() || undefined,
      publicCategory,
      relationshipType,
      expertise,
      linkedin: linkedin.trim() || undefined,
      website: website.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      investmentTicketSize: investmentTicketSize.trim() || undefined,
      isFeatured,
      visibilityStatus,
      fieldVisibility,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#101212] dark:text-white flex items-center gap-2">
                <span>Edit Public Presentation: {member.name}</span>
                {member.isFeatured && (
                  <span className="p-0.5 bg-amber-500 text-black rounded-full" title="Featured">
                    <Star className="w-3 h-3 fill-black" />
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                Update how this person is displayed on your institution's public profile.
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

        {/* Modal Body with Form & Live Card Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Form: 7 cols */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 p-5 overflow-y-auto space-y-4 text-xs border-b lg:border-b-0 lg:border-r border-[#E5E7EB] dark:border-[#262A29]"
          >
            {/* Role Decoupling Notice */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-blue-700 dark:text-blue-300">
                  Role Decoupling Architecture
                </span>
                {member.sourceType === 'entity_member' ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Workspace Role: {member.internalRoleSnapshot || 'Member'} (Read-Only)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600">
                    Source: {member.sourceType === 'xentro_user' ? 'Xentro User' : 'External Record'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Changes to Public Designation and category below only affect public display. They do not alter
                the user's workspace permissions or system RBAC role.
              </p>
            </div>

            {/* Public Designation & Category */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#101212] dark:text-white mb-1">
                  Public Designation *
                </label>
                <input
                  type="text"
                  required
                  value={publicDesignation}
                  onChange={(e) => setPublicDesignation(e.target.value)}
                  placeholder="e.g. Director of Incubation & Innovation"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Public Category
                  </label>
                  <select
                    value={publicCategory}
                    onChange={(e) => setPublicCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  >
                    <option value="Leadership & Governance">1. Leadership & Governance</option>
                    <option value="Core Team">2. Core Team</option>
                    <option value="Mentors & Advisors">3. Mentors & Advisors</option>
                    <option value="Investment Partners">4. Investment Partners</option>
                    <option value="Faculty Coordinators">5. Faculty & Institutional Coordinators</option>
                    <option value="Student Innovators">6. Student Innovators & Entrepreneurs</option>
                    <option value="Ecosystem Partners">7. Ecosystem & Strategic Partners</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#101212] dark:text-white mb-1">
                    Department / Affiliation
                  </label>
                  <input
                    type="text"
                    value={department || organization}
                    onChange={(e) => {
                      if (member.sourceType === 'entity_member') setDepartment(e.target.value);
                      else setOrganization(e.target.value);
                    }}
                    placeholder="e.g. Center for Innovation"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                  />
                </div>
              </div>
            </div>

            {publicCategory === 'Investment Partners' && (
              <div>
                <label className="block font-bold text-[#101212] dark:text-white mb-1">
                  Investment Ticket Size
                </label>
                <input
                  type="text"
                  value={investmentTicketSize}
                  onChange={(e) => setInvestmentTicketSize(e.target.value)}
                  placeholder="e.g. $100K – $500K"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
                />
              </div>
            )}

            {/* Short Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#101212] dark:text-white">
                  Public Bio
                </label>
                <span
                  className={`text-[10px] font-bold ${
                    publicBio.length > 500 ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  {publicBio.length} / 500 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={publicBio}
                onChange={(e) => setPublicBio(e.target.value)}
                placeholder="High-impact 2-3 sentence overview of their background..."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs"
              />
            </div>

            {/* Expertise Tags */}
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

            {/* Social & Contact */}
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
                  Website URL
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

            {/* Field Toggles & Visibility Controls */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101212] dark:text-white">
                  Field Visibility & Privacy Controls
                </span>
                <span className="text-[10px] text-gray-400">Toggle public visibility</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldVisibility.bio}
                    onChange={(e) => setFieldVisibility({ ...fieldVisibility, bio: e.target.checked })}
                    className="rounded-sm text-[#D9FF3F]"
                  />
                  <span>Show Bio</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldVisibility.expertise}
                    onChange={(e) =>
                      setFieldVisibility({ ...fieldVisibility, expertise: e.target.checked })
                    }
                    className="rounded-sm text-[#D9FF3F]"
                  />
                  <span>Show Expertise</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldVisibility.linkedin}
                    onChange={(e) =>
                      setFieldVisibility({ ...fieldVisibility, linkedin: e.target.checked })
                    }
                    className="rounded-sm text-[#D9FF3F]"
                  />
                  <span>Show LinkedIn</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldVisibility.email}
                    onChange={(e) =>
                      setFieldVisibility({ ...fieldVisibility, email: e.target.checked })
                    }
                    className="rounded-sm text-red-500"
                  />
                  <span className="text-red-600 dark:text-red-400 font-bold">Show Email</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldVisibility.phone}
                    onChange={(e) =>
                      setFieldVisibility({ ...fieldVisibility, phone: e.target.checked })
                    }
                    className="rounded-sm text-red-500"
                  />
                  <span className="text-red-600 dark:text-red-400 font-bold">Show Phone</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded-sm text-amber-500"
                  />
                  <span className="text-amber-500 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    Featured
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-[#262A29] flex items-center justify-between">
                <span className="font-bold text-xs">Card State:</span>
                <select
                  value={visibilityStatus}
                  onChange={(e) => setVisibilityStatus(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] font-bold"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#101212] dark:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] text-xs font-bold hover:opacity-90 shadow-subtle"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* Right: Live Card Preview: 5 cols */}
          <div className="lg:col-span-5 p-5 bg-gray-50/60 dark:bg-[#151716] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-[#D9FF3F]" />
                <span>Live Public Card Preview</span>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  visibilityStatus === 'published'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {visibilityStatus.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              This is how visitors will see this card in the {publicCategory} section:
            </p>

            {/* Rendered Preview Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] shadow-subtle space-y-3 relative overflow-hidden">
              {isFeatured && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-500/10 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                </div>
              )}

              <div className="flex items-start gap-3">
                {fieldVisibility.photo && (
                  <img
                    src={avatar || '/images/profile_avatar.webp'}
                    alt={name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-[#262A29] shrink-0"
                  />
                )}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#101212] dark:text-white truncate">
                    {name}
                  </h4>
                  {fieldVisibility.designation && (
                    <p className="text-xs font-semibold text-[#D9FF3F] truncate">
                      {publicDesignation}
                    </p>
                  )}
                  {fieldVisibility.department && (department || organization) && (
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                      {organization || department}
                    </p>
                  )}
                  {investmentTicketSize && publicCategory === 'Investment Partners' && (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Check: {investmentTicketSize}
                    </p>
                  )}
                </div>
              </div>

              {fieldVisibility.bio && publicBio && (
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] line-clamp-3 leading-relaxed">
                  {publicBio}
                </p>
              )}

              {fieldVisibility.expertise && expertise.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {expertise.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Visible Links */}
              <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fieldVisibility.linkedin && linkedin && (
                    <span className="p-1 rounded-md bg-gray-100 dark:bg-[#262A29] text-blue-600">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
                      </svg>
                    </span>
                  )}
                  {website && (
                    <span className="p-1 rounded-md bg-gray-100 dark:bg-[#262A29] text-gray-500">
                      <Globe className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {fieldVisibility.email && email && (
                    <span className="p-1 rounded-md bg-red-500/10 text-red-500" title={`Email: ${email}`}>
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {fieldVisibility.phone && phone && (
                    <span className="p-1 rounded-md bg-red-500/10 text-red-500" title={`Phone: ${phone}`}>
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {fieldVisibility.xentroProfile && (
                  <span className="text-[10px] font-bold text-[#D9FF3F] flex items-center gap-1 hover:underline">
                    <span>Xentro Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
