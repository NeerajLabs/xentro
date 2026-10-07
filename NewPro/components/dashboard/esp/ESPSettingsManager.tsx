'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  UserCheck,
  Building2,
  MapPin,
  History,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  ExternalLink,
  Lock,
  Mail,
  FileText,
  Layers,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  mockESPOwnershipSettings,
  mockESPVerificationSettings,
  mockESPEntitlementAllocation,
  mockESPLocations,
  mockESPActivityLog,
  getStoredESPLocations,
  saveStoredESPLocations,
} from '@/data/espWorkspaceData';
import { ESPLocation, ESPActivityLogItem } from '@/types/esp';

export const ESPSettingsManager: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'organization' | 'locations' | 'structure' | 'verification' | 'ownership' | 'entitlements' | 'security' | 'audit'
  >('organization');

  // Organization Legal Entity State
  const [orgLegalName, setOrgLegalName] = useState('T-Hub Foundation');
  const [orgType, setOrgType] = useState('Section 8 Not-for-Profit Entity');
  const [regNumber, setRegNumber] = useState('U73100TG2015NPL097654');
  const [panTaxId, setPanTaxId] = useState('AABCT1234F');
  const [registeredOffice, setRegisteredOffice] = useState('T-Hub 2.0, 20 Inorbit Mall Road, Madhapur, Hyderabad 500081');
  const [signatoryEmail, setSignatoryEmail] = useState('director@t-hub.co');

  // Security Settings State
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(8);
  const [ipRestricted, setIpRestricted] = useState(false);

  const [ownership, setOwnership] = useState(mockESPOwnershipSettings);
  const [verification, setVerification] = useState(mockESPVerificationSettings);
  const [entitlements] = useState(mockESPEntitlementAllocation);
  const [locations, setLocations] = useState<ESPLocation[]>([]);
  const [auditLog, setAuditLog] = useState<ESPActivityLogItem[]>(mockESPActivityLog);

  // Transfer Ownership Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Add Location Modal State
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locState, setLocState] = useState('');
  const [locPostal, setLocPostal] = useState('');
  const [locType, setLocType] = useState('Incubation Lab & Center');

  useEffect(() => {
    setLocations(getStoredESPLocations());
  }, []);

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetEmail) return;

    setOwnership((prev: any) => ({
      ...prev,
      transferPending: true,
      transferTargetEmail,
    }));

    const newLogItem: ESPActivityLogItem = {
      id: `act_${Date.now()}`,
      action: `Initiated ownership transfer request to ${transferTargetEmail}`,
      actorName: ownership.currentOwnerName || 'Super Admin',
      actorRole: 'Super Admin',
      timestamp: 'Just now',
      category: 'ownership',
    };
    setAuditLog([newLogItem, ...auditLog]);

    showToast(`Ownership transfer request dispatched to ${transferTargetEmail}!`, 'success');
    setIsTransferModalOpen(false);
    setTransferTargetEmail('');
  };

  const handleCancelTransfer = () => {
    setOwnership((prev: any) => ({
      ...prev,
      transferPending: false,
      transferTargetEmail: undefined,
    }));
    showToast('Ownership transfer request canceled.', 'info');
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locCity) return;

    const newLoc: ESPLocation = {
      id: `loc_${Date.now()}`,
      name: locName,
      address: locAddress || 'Innovation Campus',
      city: locCity,
      state: locState || 'Telangana',
      country: 'India',
      postalCode: locPostal || '500081',
      isHeadquarters: false,
      isPrimaryCampus: locations.length === 0,
      type: locType,
    };

    const updated = [...locations, newLoc];
    setLocations(updated);
    saveStoredESPLocations(updated);

    showToast(`Added location "${locName}"!`, 'success');
    setIsAddLocationOpen(false);
    setLocName('');
    setLocAddress('');
    setLocCity('');
  };

  const handleRemoveLocation = (id: string, name: string) => {
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    saveStoredESPLocations(updated);
    showToast(`Removed location "${name}".`, 'info');
  };

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Legal entity organization details saved successfully!', 'success');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Security governance policies updated successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Entity Settings & Governance
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Administrative Level
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Institutional ownership, DPIIT/government accreditation, entitlement quota tracking, and campus locations.
          </p>
        </div>
      </div>

      {/* 1. Subnav Navigation (8 Canonical Tabs) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {[
          { id: 'organization' as const, label: 'Organization' },
          { id: 'locations' as const, label: `Locations (${locations.length})` },
          { id: 'structure' as const, label: 'Organization Structure' },
          { id: 'verification' as const, label: 'Verification' },
          { id: 'ownership' as const, label: 'Ownership' },
          { id: 'entitlements' as const, label: 'Plan & Entitlements' },
          { id: 'security' as const, label: 'Security' },
          { id: 'audit' as const, label: `Activity Log (${auditLog.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ORGANIZATION */}
      {activeTab === 'organization' && (
        <form onSubmit={handleSaveOrganization} className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <Building2 className="w-4 h-4 text-[#D9FF3F]" />
              <span>Legal Entity Registration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Legal Entity Name</label>
                <input
                  type="text"
                  value={orgLegalName}
                  onChange={(e) => setOrgLegalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Legal Entity Type</label>
                <input
                  type="text"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">CIN / Registration / Trust No</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">PAN / Tax ID</label>
                <input
                  type="text"
                  value={panTaxId}
                  onChange={(e) => setPanTaxId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Registered Office Address</label>
                <input
                  type="text"
                  value={registeredOffice}
                  onChange={(e) => setRegisteredOffice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Authorized Signatory Email</label>
                <input
                  type="email"
                  value={signatoryEmail}
                  onChange={(e) => setSignatoryEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Save Organization Details
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider">
                  Campus Facilities & Research Labs ({locations.length})
                </h3>
              </div>
              <button
                onClick={() => setIsAddLocationOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Facility</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#101212] dark:text-white">
                        {loc.name}
                      </span>
                      {loc.isHeadquarters ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
                          Headquarters
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                          {loc.type || 'Incubation Center'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                      {loc.address}, {loc.city}, {loc.state} - {loc.postalCode}
                    </p>
                  </div>

                  {!loc.isHeadquarters && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRemoveLocation(loc.id, loc.name)}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove Location
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORGANIZATION STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Hierarchical Structure & Ecosystem Parentage</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  Parent Entity / Governing Body
                </span>
                <div className="font-bold text-sm text-[#101212] dark:text-white">
                  Government of Telangana & Institutional Academic Consortium
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  T-Hub operates under a tripartite public-private partnership between the Government of Telangana, premier academic institutions (IIIT-H, ISB, NALSAR), and private sector industry bodies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Academic Research Partners
                  </span>
                  <ul className="text-xs text-[#101212] dark:text-white space-y-1">
                    <li>• International Institute of Information Technology Hyderabad (IIIT-H)</li>
                    <li>• Indian School of Business (ISB)</li>
                    <li>• NALSAR University of Law</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                    Associated Innovation Centers & Labs
                  </span>
                  <ul className="text-xs text-[#101212] dark:text-white space-y-1">
                    <li>• T-Works Rapid Prototyping Center</li>
                    <li>• AIC T-Hub Foundation (Atal Incubation Centre)</li>
                    <li>• Boeing Aerospace Center of Excellence</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Accreditation & Institutional Verification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Institution Status
                </span>
                <div className="font-bold text-sm text-[#101212] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>DPIIT & State Accredited</span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Recognized as an official Tier-1 Ecosystem Support Partner.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                  Official Domain Verification
                </span>
                <div className="font-bold text-sm text-[#101212] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span>t-hub.co Verified</span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  DNS TXT record matching institutional authority confirmed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] block">
                  Authorized Signatory
                </span>
                <div className="font-bold text-sm text-[#101212] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Identity Verified</span>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Director credentials legally validated under organizational charter.
                </p>
              </div>
            </div>

            {/* Zero Raw Aadhaar exposure compliance notice */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#D9FF3F] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                  Regulatory Identity Data Security (Zero Document Exposure)
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  In compliance with DPDP and ecosystem data policies, raw identity numbers (Aadhaar, PAN, national IDs) and physical verification documents are cryptographically verified off-chain and never exposed across regular staff workspaces or public profiles. Only authorized cryptographic verification badges are shown.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OWNERSHIP */}
      {activeTab === 'ownership' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <UserCheck className="w-4 h-4 text-[#D9FF3F]" />
              <span>Current Primary Ownership</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  Primary Account Holder
                </span>
                <div className="font-bold text-sm text-[#101212] dark:text-white">
                  {ownership.currentOwnerName}
                </div>
                <div className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {ownership.currentOwnerEmail}
                </div>
              </div>

              {!ownership.transferPending ? (
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-white text-white dark:text-[#101212] text-xs font-bold hover:bg-[#D9FF3F] hover:text-[#101212] dark:hover:bg-[#D9FF3F] dark:hover:text-[#101212] transition-all cursor-pointer shadow-subtle self-start sm:self-auto"
                >
                  Initiate Ownership Transfer
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    Transfer Pending to: {ownership.transferTargetEmail}
                  </span>
                  <button
                    onClick={handleCancelTransfer}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PLAN & ENTITLEMENTS */}
      {activeTab === 'entitlements' && (
        <div className="space-y-6 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <Settings className="w-4 h-4 text-[#D9FF3F]" />
              <span>Active Plan Entitlements & Capacity</span>
            </h3>

            <div className="space-y-4">
              {/* Active Endorsements Quota */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#101212] dark:text-white">Active Endorsement Grants</span>
                  <span className="font-bold text-[#D9FF3F]">
                    {entitlements.endorsementsUsed ?? 0} / {entitlements.endorsementsLimit ?? 25} Used ({(entitlements.endorsementsLimit ?? 25) - (entitlements.endorsementsUsed ?? 0)} remaining)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D9FF3F] h-full rounded-full"
                    style={{ width: `${(((entitlements.endorsementsUsed ?? 0) / (entitlements.endorsementsLimit ?? 25))) * 100}%` }}
                  />
                </div>
              </div>

              {/* Member Seats */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#101212] dark:text-white">Internal Workspace Seats (Staff & Faculty)</span>
                  <span className="font-bold text-cyan-500">
                    {entitlements.memberSeatsUsed ?? 0} / {entitlements.memberSeatsLimit ?? 15} Seats
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${(((entitlements.memberSeatsUsed ?? 0) / (entitlements.memberSeatsLimit ?? 15))) * 100}%` }}
                  />
                </div>
              </div>

              {/* Student Seats */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#101212] dark:text-white">Campus Student Innovator Accounts</span>
                  <span className="font-bold text-purple-500">
                    {entitlements.studentSeatsUsed ?? 0} / {entitlements.studentSeatsLimit ?? 500} Students Enrolled
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${(((entitlements.studentSeatsUsed ?? 0) / (entitlements.studentSeatsLimit ?? 500))) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <KeyRound className="w-4 h-4 text-[#D9FF3F]" />
              <span>Workspace Security & Authorization Policy</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                <div>
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                    Mandatory 2-Factor Authentication (2FA)
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Require authenticator OTP for all Super Admins, Program Managers, and Financial Officers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enforce2FA}
                  onChange={(e) => setEnforce2FA(e.target.checked)}
                  className="w-4 h-4 accent-[#D9FF3F]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                <div>
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                    Session Inactivity Timeout
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Automatically log out inactive workspace administrator sessions.
                  </p>
                </div>
                <select
                  value={sessionTimeoutHours}
                  onChange={(e) => setSessionTimeoutHours(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                >
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={24}>24 Hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29]">
                <div>
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                    Restricted Campus IP Allowlisting
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Restrict sensitive financial operations to institutional campus network CIDRs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={ipRestricted}
                  onChange={(e) => setIpRestricted(e.target.checked)}
                  className="w-4 h-4 accent-[#D9FF3F]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Save Security Policy
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 8: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-[#101212] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <History className="w-4 h-4 text-[#D9FF3F]" />
              <span>Immutable Activity & Governance Audit Trail ({auditLog.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action Description</th>
                    <th className="py-2.5 px-3">Actor & Role</th>
                    <th className="py-2.5 px-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                  {auditLog.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {log.action}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold">{log.actorName}</span>
                        <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] block">{log.actorRole}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] uppercase">
                          {log.category || 'General'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Transfer Primary Ownership
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  2-step verified institutional succession
                </p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Target Successor Email (Must be an active Workspace Member)
                </label>
                <input
                  type="email"
                  required
                  placeholder="successor@institution.org"
                  value={transferTargetEmail}
                  onChange={(e) => setTransferTargetEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Transfer Justification / Senate Memo Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. Directorate tenure transition"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                Warning: Once accepted, you will transition to an Incubator Admin role and lose exclusive ownership rights.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Confirm & Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LOCATION MODAL */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Add Campus or Innovation Center
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Register secondary incubation facility
                </p>
              </div>
              <button
                onClick={() => setIsAddLocationOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Facility / Center Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aerospace Innovation Lab"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Street Address</label>
                <input
                  type="text"
                  placeholder="Plot 42, Hitec City"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Hyderabad"
                    value={locCity}
                    onChange={(e) => setLocCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">State</label>
                  <input
                    type="text"
                    placeholder="Telangana"
                    value={locState}
                    onChange={(e) => setLocState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLocationOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
