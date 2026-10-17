'use client';

export type VerificationType =
  | 'INCORPORATION_MCA'
  | 'DPIIT_RECOGNITION'
  | 'MSME_UDYAM'
  | 'OFFICIAL_EMAIL'
  | 'FOUNDER_IDENTITY'
  | 'CORPORATE_WEBSITE';

export interface VerificationItem {
  id: string;
  type: VerificationType;
  title: string;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  documentNumber?: string;
  documentUrl?: string;
  documentName?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  badgeColor: string;
}

export interface VerificationCenterData {
  entityId: string;
  overallStatus: string;
  verifiedCount: number;
  totalCount: number;
  items: VerificationItem[];
}

export const VERIFICATION_UPDATED_EVENT = 'xentro-startup-verification-updated';

class StartupVerificationService {
  private cache: Map<string, VerificationCenterData> = new Map();

  async fetchVerificationStatus(entityId: string): Promise<VerificationCenterData> {
    if (!entityId) return this.getEmptyFallback(entityId);

    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/verification`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.warn(`[StartupVerificationService] HTTP ${res.status} fetching verification`);
        return this.cache.get(entityId) || this.getEmptyFallback(entityId);
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.cache.set(entityId, json.data);
        return json.data;
      }
    } catch (err) {
      console.warn('[StartupVerificationService] Error fetching verification:', err);
    }

    return this.cache.get(entityId) || this.getEmptyFallback(entityId);
  }

  async submitEvidence(
    entityId: string,
    data: {
      type: VerificationType;
      documentNumber?: string;
      documentUrl?: string;
      documentName?: string;
      remarks?: string;
    }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(entityId)}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        await this.fetchVerificationStatus(entityId);
        window.dispatchEvent(new CustomEvent(VERIFICATION_UPDATED_EVENT, { detail: { entityId } }));
        return { success: true, message: json.message };
      }
      return { success: false, message: json.message || 'Submission failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error submitting verification' };
    }
  }

  private getEmptyFallback(entityId: string): VerificationCenterData {
    return {
      entityId,
      overallStatus: 'UNVERIFIED',
      verifiedCount: 0,
      totalCount: 6,
      items: [
        { id: '1', type: 'OFFICIAL_EMAIL', title: 'Official Corporate Email', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
        { id: '2', type: 'FOUNDER_IDENTITY', title: 'Founder Identity (Govt ID)', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
        { id: '3', type: 'INCORPORATION_MCA', title: 'Company Incorporation (MCA / CIN)', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
        { id: '4', type: 'DPIIT_RECOGNITION', title: 'DPIIT Startup Recognition', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
        { id: '5', type: 'MSME_UDYAM', title: 'MSME Udyam Registration', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
        { id: '6', type: 'CORPORATE_WEBSITE', title: 'Official Corporate Website', status: 'NOT_SUBMITTED', badgeColor: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
      ],
    };
  }
}

export const startupVerificationService = new StartupVerificationService();
