'use client';

import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Sparkles,
  Save,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Plus,
  X,
  Target,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { espProfilesData } from '@/data/espProfilesData';
import { FullESPProfile, StartupStage } from '@/types/esp';
import { ESPTeamEcosystemManager } from './ESPTeamEcosystemManager';

interface ESPPublicProfileManagerProps {
  onPreviewProfile: () => void;
  initialSubTab?: 'details' | 'team';
}

export const ESPPublicProfileManager: React.FC<ESPPublicProfileManagerProps> = ({
  onPreviewProfile,
  initialSubTab = 'details',
}) => {
  const { showToast } = useToast();
  const [activeSubSection, setActiveSubSection] = useState<'details' | 'team'>(initialSubTab);
  const defaultProfile = espProfilesData['uni_9'];

  const [name, setName] = useState(defaultProfile.identity.name);
  const [tagline, setTagline] = useState(defaultProfile.identity.tagline);
  const [type, setType] = useState(defaultProfile.identity.type);
  const [orgDetails, setOrgDetails] = useState(
    defaultProfile.identity.organizationTypeDetails || 'Innovation Hub & Accelerator (Public-Private Partnership)'
  );
  const [officialEmail, setOfficialEmail] = useState(
    defaultProfile.identity.officialEmail || defaultProfile.identity.contactEmail
  );
  const [website, setWebsite] = useState(defaultProfile.identity.website);
  const [headquarters, setHeadquarters] = useState(defaultProfile.identity.headquarters);
  const [shortDescription, setShortDescription] = useState(defaultProfile.identity.shortDescription);
  const [coreMission, setCoreMission] = useState(defaultProfile.identity.coreMission);

  const [sectors, setSectors] = useState<string[]>(defaultProfile.identity.primarySectors);
  const [newSector, setNewSector] = useState('');

  const [stages, setStages] = useState<StartupStage[]>(defaultProfile.identity.stagesSupported);

  const allPossibleStages: StartupStage[] = [
    'Idea',
    'Pre-Incubation',
    'MVP',
    'Pre-Seed',
    'Seed',
    'Early Revenue',
    'Growth',
  ];

  const handleToggleStage = (st: StartupStage) => {
    if (stages.includes(st)) {
      setStages(stages.filter((s) => s !== st));
    } else {
      setStages([...stages, st]);
    }
  };

  const handleAddSector = () => {
    if (!newSector.trim()) return;
    if (sectors.includes(newSector.trim())) return;
    setSectors([...sectors, newSector.trim()]);
    setNewSector('');
  };

  const handleRemoveSector = (sec: string) => {
    setSectors(sectors.filter((s) => s !== sec));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Update local reference
    defaultProfile.identity.name = name;
    defaultProfile.identity.tagline = tagline;
    defaultProfile.identity.type = type;
    defaultProfile.identity.organizationTypeDetails = orgDetails;
    defaultProfile.identity.officialEmail = officialEmail;
    defaultProfile.identity.website = website;
    defaultProfile.identity.headquarters = headquarters;
    defaultProfile.identity.shortDescription = shortDescription;
    defaultProfile.identity.coreMission = coreMission;
    defaultProfile.identity.primarySectors = sectors;
    defaultProfile.identity.stagesSupported = stages;

    showToast('ESP Public Profile updated successfully! Changes reflected across the ecosystem.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Top Banner explaining View Layer vs Management Layer */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Public Profile Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Management Layer
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Configure institutional profile information displayed to founders, mentors, and corporate partners.
          </p>
        </div>

        <button
          onClick={onPreviewProfile}
          className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] hover:bg-[#D9FF3F] hover:text-[#101212] dark:hover:bg-[#D9FF3F] dark:hover:text-[#101212] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-subtle self-start sm:self-auto active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Public Profile</span>
        </button>
      </div>

      {/* Sub-navigation tabs: Organization Details vs Team & Ecosystem */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-2">
        <button
          type="button"
          onClick={() => setActiveSubSection('details')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubSection === 'details'
              ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization Details & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubSection === 'team'
              ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team & Ecosystem</span>
        </button>
      </div>

      {activeSubSection === 'team' ? (
        <ESPTeamEcosystemManager onPreviewProfile={onPreviewProfile} />
      ) : (
        /* Profile Form */
        <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D9FF3F]" />
            <span>Institution Identity & Branding</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Institution Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Organization Classification
              </label>
              <input
                type="text"
                value={orgDetails}
                onChange={(e) => setOrgDetails(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                One-Line Tagline / Value Proposition
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Official Inbound Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#565B59]" />
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Official Website Domain
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-[#565B59]" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Headquarters Campus Address
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-rose-500" />
                <input
                  type="text"
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Narrative & Mission */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
            <span>Mission & Narrative Overview</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Overview & What The Organization Does
              </label>
              <textarea
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#101212] dark:text-white">
                Core Institutional Mission Statement
              </label>
              <textarea
                rows={2}
                value={coreMission}
                onChange={(e) => setCoreMission(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>
          </div>
        </div>

        {/* Sectors and Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Focus Sectors */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Primary Sector Focus</span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {sectors.map((sec) => (
                <span
                  key={sec}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5"
                >
                  <span>{sec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSector(sec)}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add new sector..."
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSector();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSector}
                className="p-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stages Supported */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#D9FF3F]" />
              <span>Startup Stages Supported</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {allPossibleStages.map((stage) => {
                const isSelected = stages.includes(stage);
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => handleToggleStage(stage)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#D9FF3F]/20 border-[#D9FF3F] text-[#101212] dark:text-[#D9FF3F]'
                        : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    <span>{stage}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
