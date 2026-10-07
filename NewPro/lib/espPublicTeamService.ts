import {
  ESPPublicTeamMember,
  ESPEcosystemOrgPartner,
  ESPPublicCategory,
  ESPPublicVisibilityStatus,
  ESPPublicViewData,
  ESPPublicSection,
} from '@/types/espPublicTeam';

const PUBLIC_TEAM_STORAGE_KEY = 'xentro_esp_public_team_members_v1';
const ECOSYSTEM_PARTNERS_STORAGE_KEY = 'xentro_esp_ecosystem_partners_v1';
export const ESP_PUBLIC_TEAM_EVENT = 'xentro-esp-public-team-changed';

export const initialPublicTeamMembers: ESPPublicTeamMember[] = [];

export const initialEcosystemPartners: ESPEcosystemOrgPartner[] = [];

class ESPPublicTeamService {
  // --- Public Team Members ---

  public getPublicTeamMembers(espEntityId: string = 'uni_9'): ESPPublicTeamMember[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PUBLIC_TEAM_STORAGE_KEY);
      if (!stored) return [];
      const parsed: ESPPublicTeamMember[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((m) => m.id?.startsWith('pub_team_') || m.name?.includes('Arvind') || m.name?.includes('Radhika'))) {
        localStorage.removeItem(PUBLIC_TEAM_STORAGE_KEY);
        return [];
      }
      return parsed.filter((m) => !m.espEntityId || m.espEntityId === espEntityId);
    } catch {
      return [];
    }
  }

  public savePublicTeamMembers(members: ESPPublicTeamMember[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(members));
      window.dispatchEvent(new CustomEvent(ESP_PUBLIC_TEAM_EVENT, { detail: { members } }));
    } catch (err) {
      console.error('Failed to save ESP public team members:', err);
    }
  }

  public getPublicTeamMemberById(id: string): ESPPublicTeamMember | null {
    const members = this.getPublicTeamMembers();
    return members.find((m) => m.id === id) || null;
  }

  public addPublicTeamMember(
    member: Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>
  ): ESPPublicTeamMember {
    const members = this.getPublicTeamMembers(member.espEntityId);
    const newMember: ESPPublicTeamMember = {
      ...member,
      id: `pub_team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      displayOrder: member.displayOrder || members.length + 1,
    };
    const updated = [newMember, ...members];
    this.savePublicTeamMembers(updated);
    return newMember;
  }

  public updatePublicTeamMember(
    id: string,
    updates: Partial<ESPPublicTeamMember>
  ): ESPPublicTeamMember | null {
    const members = this.getPublicTeamMembers();
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updatedMember: ESPPublicTeamMember = {
      ...members[index],
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    members[index] = updatedMember;
    this.savePublicTeamMembers(members);
    return updatedMember;
  }

  public toggleMemberVisibility(id: string, status: ESPPublicVisibilityStatus): void {
    this.updatePublicTeamMember(id, { visibilityStatus: status });
  }

  public toggleFeatured(id: string): void {
    const member = this.getPublicTeamMemberById(id);
    if (member) {
      this.updatePublicTeamMember(id, { isFeatured: !member.isFeatured });
    }
  }

  public reorderMembers(category: ESPPublicCategory, orderedIds: string[]): void {
    const members = this.getPublicTeamMembers();
    const updated = members.map((m) => {
      if (m.publicCategory === category) {
        const idx = orderedIds.indexOf(m.id);
        if (idx !== -1) {
          return { ...m, displayOrder: idx + 1 };
        }
      }
      return m;
    });
    this.savePublicTeamMembers(updated);
  }

  /**
   * CRITICAL ARCHITECTURAL SAFETY:
   * Removing a person from the Public Profile ONLY deletes their public entry.
   * It NEVER deletes their ESP workspace membership, never revokes RBAC permissions,
   * and never deletes their personal Xentro account.
   */
  public removePublicTeamMember(id: string): boolean {
    const members = this.getPublicTeamMembers();
    const filtered = members.filter((m) => m.id !== id);
    if (filtered.length === members.length) return false;
    this.savePublicTeamMembers(filtered);
    return true;
  }

  // --- Ecosystem Org Partners ---

  public getEcosystemPartners(espEntityId: string = 'uni_9'): ESPEcosystemOrgPartner[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ECOSYSTEM_PARTNERS_STORAGE_KEY);
      if (!stored) return [];
      const parsed: ESPEcosystemOrgPartner[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p) => p.id?.startsWith('org_partner_') || p.name?.includes('Startup India'))) {
        localStorage.removeItem(ECOSYSTEM_PARTNERS_STORAGE_KEY);
        return [];
      }
      return parsed.filter((p) => !p.espEntityId || p.espEntityId === espEntityId);
    } catch {
      return [];
    }
  }

  public saveEcosystemPartners(partners: ESPEcosystemOrgPartner[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ECOSYSTEM_PARTNERS_STORAGE_KEY, JSON.stringify(partners));
      window.dispatchEvent(new CustomEvent(ESP_PUBLIC_TEAM_EVENT, { detail: { partners } }));
    } catch (err) {
      console.error('Failed to save ecosystem partners:', err);
    }
  }

  public addEcosystemPartner(partner: Omit<ESPEcosystemOrgPartner, 'id'>): ESPEcosystemOrgPartner {
    const partners = this.getEcosystemPartners(partner.espEntityId);
    const newPartner: ESPEcosystemOrgPartner = {
      ...partner,
      id: `org_partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      displayOrder: partner.displayOrder || partners.length + 1,
    };
    const updated = [...partners, newPartner];
    this.saveEcosystemPartners(updated);
    return newPartner;
  }

  public updateEcosystemPartner(
    id: string,
    updates: Partial<ESPEcosystemOrgPartner>
  ): ESPEcosystemOrgPartner | null {
    const partners = this.getEcosystemPartners();
    const index = partners.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedPartner = { ...partners[index], ...updates };
    partners[index] = updatedPartner;
    this.saveEcosystemPartners(partners);
    return updatedPartner;
  }

  public removeEcosystemPartner(id: string): boolean {
    const partners = this.getEcosystemPartners();
    const filtered = partners.filter((p) => p.id !== id);
    if (filtered.length === partners.length) return false;
    this.saveEcosystemPartners(filtered);
    return true;
  }

  // --- Bulk Student Add / CSV Importer ---
  public bulkAddStudents(
    students: Array<Omit<ESPPublicTeamMember, 'id' | 'lastUpdated'>>,
    espEntityId: string = 'uni_9'
  ): ESPPublicTeamMember[] {
    const members = this.getPublicTeamMembers(espEntityId);
    const newMembers: ESPPublicTeamMember[] = students.map((s, idx) => ({
      ...s,
      id: `pub_student_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      publicCategory: 'Student Innovators' as const,
      relationshipType: s.relationshipType || 'Student',
      studentPrivacyNotice: true,
      displayOrder: members.length + idx + 1,
      visibilityStatus: s.visibilityStatus || 'published',
      fieldVisibility: {
        photo: s.fieldVisibility?.photo ?? true,
        designation: s.fieldVisibility?.designation ?? true,
        department: s.fieldVisibility?.department ?? true,
        bio: s.fieldVisibility?.bio ?? true,
        expertise: s.fieldVisibility?.expertise ?? true,
        linkedin: s.fieldVisibility?.linkedin ?? true,
        email: false, // strictly enforce false by default for student safety
        phone: false, // strictly enforce false by default for student safety
        xentroProfile: s.fieldVisibility?.xentroProfile ?? true,
      },
    }));

    const updated = [...newMembers, ...members];
    this.savePublicTeamMembers(updated);
    return newMembers;
  }

  // --- Public Profile View Formatter ---
  public getPublicViewData(espEntityId: string = 'uni_9'): ESPPublicViewData {
    const allMembers = this.getPublicTeamMembers(espEntityId);
    const publishedMembers = allMembers
      .filter((m) => m.visibilityStatus === 'published')
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const featuredLeadership = publishedMembers.filter(
      (m) => m.isFeatured && m.publicCategory === 'Leadership & Governance'
    );

    const leadership = publishedMembers.filter(
      (m) => m.publicCategory === 'Leadership & Governance'
    );
    const coreTeam = publishedMembers.filter((m) => m.publicCategory === 'Core Team');
    const mentorsAndAdvisors = publishedMembers.filter(
      (m) => m.publicCategory === 'Mentors & Advisors'
    );
    const investmentPartners = publishedMembers.filter(
      (m) => m.publicCategory === 'Investment Partners'
    );
    const facultyCoordinators = publishedMembers.filter(
      (m) => m.publicCategory === 'Faculty Coordinators'
    );
    const studentInnovators = publishedMembers.filter(
      (m) => m.publicCategory === 'Student Innovators'
    );
    const personEcosystemPartners = publishedMembers.filter(
      (m) => m.publicCategory === 'Ecosystem Partners'
    );

    const orgPartners = this.getEcosystemPartners(espEntityId).filter(
      (p) => p.status === 'published'
    );

    const totalPublishedCount = publishedMembers.length + orgPartners.length;

    return {
      totalPublishedCount,
      featuredLeadership,
      sections: [
        {
          id: 'leadership',
          title: 'Leadership & Governance',
          members: leadership,
          hasContent: leadership.length > 0,
        },
        {
          id: 'core_team',
          title: 'Core Team & Program Operations',
          members: coreTeam,
          hasContent: coreTeam.length > 0,
        },
        {
          id: 'mentors_advisors',
          title: 'Associated Mentors & Domain Advisors',
          members: mentorsAndAdvisors,
          hasContent: mentorsAndAdvisors.length > 0,
        },
        {
          id: 'investment_partners',
          title: 'Partner Venture Funds & Angel Networks',
          members: investmentPartners,
          hasContent: investmentPartners.length > 0,
        },
        {
          id: 'ecosystem_partners',
          title: 'Ecosystem Alliances & Strategic Partners',
          orgPartners: orgPartners,
          personPartners: personEcosystemPartners,
          hasContent: orgPartners.length > 0 || personEcosystemPartners.length > 0,
        },
        {
          id: 'faculty_coordinators',
          title: 'Faculty & Institutional Coordinators',
          members: facultyCoordinators,
          hasContent: facultyCoordinators.length > 0,
        },
        {
          id: 'student_innovators',
          title: 'Student Innovators & Entrepreneurs',
          members: studentInnovators,
          hasContent: studentInnovators.length > 0,
        },
      ],
    };
  }
}

export const espPublicTeamService = new ESPPublicTeamService();
