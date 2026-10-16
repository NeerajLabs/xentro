/**
 * XENTRO V1 — MENTOR FINANCIAL SERVICE
 * 
 * Typed read-only integration adapter for Mentor contractual earnings,
 * withdrawal requests, and payout accounts.
 * 
 * Complies with RBI guidelines and Phase 2 integrity:
 * - Does NOT mock fictional balances or transactions.
 * - Accurately detects and surfaces 'unavailable' state when authoritative backend APIs are absent.
 * - Does not treat unprovisioned endpoints as zero balance (₹0).
 * - Authoritative 24-hour hold calculations derived from server createdAt timestamps.
 */

import {
  EarningsSummary,
  MentorEarning,
  WithdrawalRequest,
  PayoutAccount,
  FinancialApiState,
} from '@/types/mentorFinancials';

export interface FinancialApiResponse<T> {
  data: T | null;
  state: FinancialApiState;
  message?: string;
  isBackendProvisioned: boolean;
}

/**
 * Calculates authoritative 24-hour hold status based on server creation timestamp.
 * Verification holds expire strictly at (createdAt + 24 hours).
 * NOTE: Hold completion is necessary but NOT sufficient for payout.
 * Internal Admin approval is independently required.
 */
export function calculateHoldDetails(createdAtIso: string, currentTimestampMs: number = Date.now()) {
  const createdDate = new Date(createdAtIso);
  const createdAtMs = createdDate.getTime();
  
  // Earliest hold completion: createdAt + 24 hours (86,400,000 ms)
  const HOLD_DURATION_MS = 24 * 60 * 60 * 1000;
  const holdExpiresAtMs = createdAtMs + HOLD_DURATION_MS;
  const holdExpiresAtIso = new Date(holdExpiresAtMs).toISOString();

  const isHoldCompleted = currentTimestampMs >= holdExpiresAtMs;
  const remainingMs = Math.max(0, holdExpiresAtMs - currentTimestampMs);
  
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  return {
    createdAtIso,
    holdExpiresAtIso,
    isHoldCompleted,
    remainingMs,
    remainingFormatted: `${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`,
    remainingHours,
    remainingMinutes,
  };
}

class MentorFinancialService {
  /**
   * Reads authenticated Mentor Earnings Summary from backend.
   * If the authoritative endpoint is unprovisioned, returns state 'unavailable'.
   */
  async getEarningsSummary(mentorId: string): Promise<FinancialApiResponse<EarningsSummary>> {
    if (!mentorId) {
      return {
        data: null,
        state: 'unauthorized',
        message: 'Authenticated mentor session required',
        isBackendProvisioned: false,
      };
    }

    try {
      const res = await fetch(`/api/mentor/${encodeURIComponent(mentorId)}/financials/summary`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 404 || res.status === 501) {
        return {
          data: null,
          state: 'unavailable',
          message: 'Authoritative mentor financial ledger is currently being connected.',
          isBackendProvisioned: false,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          state: 'unauthorized',
          message: 'Unauthorized access to mentor financial records',
          isBackendProvisioned: true,
        };
      }

      if (!res.ok) {
        return {
          data: null,
          state: 'error',
          message: `Server returned error (${res.status})`,
          isBackendProvisioned: true,
        };
      }

      const json = await res.json();
      return {
        data: json.data || null,
        state: 'available',
        isBackendProvisioned: true,
      };
    } catch {
      // Network failure or unhandled exception -> explicit unavailable state
      return {
        data: null,
        state: 'unavailable',
        message: 'Authoritative financial service is awaiting activation.',
        isBackendProvisioned: false,
      };
    }
  }

  /**
   * Reads transaction history from backend.
   */
  async getEarningsHistory(
    mentorId: string
  ): Promise<FinancialApiResponse<MentorEarning[]>> {
    if (!mentorId) {
      return {
        data: null,
        state: 'unauthorized',
        message: 'Authenticated mentor session required',
        isBackendProvisioned: false,
      };
    }

    try {
      const res = await fetch(`/api/mentor/${encodeURIComponent(mentorId)}/financials/earnings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 404 || res.status === 501) {
        return {
          data: null,
          state: 'unavailable',
          message: 'Contractual transaction ledger awaiting activation.',
          isBackendProvisioned: false,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          state: 'unauthorized',
          message: 'Unauthorized access to transaction ledger',
          isBackendProvisioned: true,
        };
      }

      if (!res.ok) {
        return {
          data: null,
          state: 'error',
          message: `Server returned error (${res.status})`,
          isBackendProvisioned: true,
        };
      }

      const json = await res.json();
      return {
        data: json.data || [],
        state: 'available',
        isBackendProvisioned: true,
      };
    } catch {
      return {
        data: null,
        state: 'unavailable',
        message: 'Contractual transaction ledger awaiting activation.',
        isBackendProvisioned: false,
      };
    }
  }

  /**
   * Reads withdrawal requests from backend.
   */
  async getWithdrawals(
    mentorId: string
  ): Promise<FinancialApiResponse<WithdrawalRequest[]>> {
    if (!mentorId) {
      return {
        data: null,
        state: 'unauthorized',
        message: 'Authenticated mentor session required',
        isBackendProvisioned: false,
      };
    }

    try {
      const res = await fetch(`/api/mentor/${encodeURIComponent(mentorId)}/financials/withdrawals`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 404 || res.status === 501) {
        return {
          data: null,
          state: 'unavailable',
          message: 'Withdrawal verification service awaiting activation.',
          isBackendProvisioned: false,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          state: 'unauthorized',
          message: 'Unauthorized access to withdrawal history',
          isBackendProvisioned: true,
        };
      }

      if (!res.ok) {
        return {
          data: null,
          state: 'error',
          message: `Server returned error (${res.status})`,
          isBackendProvisioned: true,
        };
      }

      const json = await res.json();
      return {
        data: json.data || [],
        state: 'available',
        isBackendProvisioned: true,
      };
    } catch {
      return {
        data: null,
        state: 'unavailable',
        message: 'Withdrawal verification service awaiting activation.',
        isBackendProvisioned: false,
      };
    }
  }

  /**
   * Reads masked payout account from backend.
   */
  async getPayoutAccount(
    mentorId: string
  ): Promise<FinancialApiResponse<PayoutAccount>> {
    if (!mentorId) {
      return {
        data: null,
        state: 'unauthorized',
        message: 'Authenticated mentor session required',
        isBackendProvisioned: false,
      };
    }

    try {
      const res = await fetch(`/api/mentor/${encodeURIComponent(mentorId)}/financials/payout-account`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 404 || res.status === 501) {
        return {
          data: null,
          state: 'unavailable',
          message: 'Payout account service awaiting activation.',
          isBackendProvisioned: false,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          data: null,
          state: 'unauthorized',
          message: 'Unauthorized access to payout account',
          isBackendProvisioned: true,
        };
      }

      if (!res.ok) {
        return {
          data: null,
          state: 'error',
          message: `Server returned error (${res.status})`,
          isBackendProvisioned: true,
        };
      }

      const json = await res.json();
      return {
        data: json.data || null,
        state: 'available',
        isBackendProvisioned: true,
      };
    } catch {
      return {
        data: null,
        state: 'unavailable',
        message: 'Payout account service awaiting activation.',
        isBackendProvisioned: false,
      };
    }
  }
}

export const mentorFinancialService = new MentorFinancialService();
