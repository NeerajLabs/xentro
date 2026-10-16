/**
 * XENTRO V1 — MENTOR FINANCIALS CONTRACTS
 * 
 * Strict integer paise financial conventions for Mentor contractual earnings,
 * 10% platform commission accounting, 24-hour verification hold lifecycles,
 * and RBI-aware payout eligibility models.
 * 
 * NOTE: Monetary amounts are represented in integer paise (1 INR = 100 paise).
 */

export type WithdrawalStatus =
  | 'requested'
  | 'under_review'
  | 'approved_hold_active'
  | 'extended_hold'
  | 'ready_for_payout'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

export interface WithdrawalTimelineEvent {
  stage:
    | 'requested'
    | 'admin_review'
    | 'mandatory_hold'
    | 'admin_approved'
    | 'payout_processing'
    | 'settlement_completed';
  title: string;
  description: string;
  timestamp?: string; // ISO 8601 authoritative timestamp
  completed: boolean;
  inProgress: boolean;
  error?: boolean;
  failureReason?: string;
}

export interface FinancialAdjustment {
  id: string;
  type: 'tds_withholding' | 'dispute_deduction' | 'refund_clawback' | 'credit_adjustment' | 'bonus';
  description: string;
  amountPaise: number; // can be negative for deductions or positive for bonuses
  appliedAt: string; // ISO 8601
}

export type EarningTransactionStatus =
  | 'pending_clearance'
  | 'available'
  | 'withdrawn'
  | 'refunded'
  | 'disputed';

export interface MentorEarning {
  id: string;
  transactionReference: string;
  bookingSessionReference: string;
  mentorshipId?: string;
  startupId: string;
  startupName: string;
  founderName: string;
  packageTitle: string;
  sessionDuration: string;
  transactionDate: string; // ISO 8601
  grossPaymentPaise: number; // Customer payment (100%)
  xentroCommissionPaise: number; // Platform commission (10%)
  mentorContractualEarningsPaise: number; // Contractual allocation (90%)
  adjustmentsPaise: number; // Net adjustments
  netPayablePaise: number; // Net payable to mentor
  status: EarningTransactionStatus;
  clearedAt?: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  mentorId: string;
  amountPaise: number;
  payoutAccountId: string;
  maskedBankReference: string;
  status: WithdrawalStatus;
  requestedAt: string; // ISO 8601 authoritative creation timestamp
  holdExpiresAt: string; // requestedAt + 24 hours
  holdCompleted: boolean;
  adminReviewedAt?: string;
  adminApprovedAt?: string;
  adminReviewerId?: string;
  adminApprovalStatus: 'pending' | 'approved' | 'rejected' | 'extended_hold';
  rejectionReason?: string;
  extendedHoldReason?: string;
  payoutStartedAt?: string;
  settledAt?: string;
  providerReference?: string;
  timeline: WithdrawalTimelineEvent[];
}

export interface PayoutAccount {
  id: string;
  mentorId: string;
  bankName: string;
  accountHolderName: string;
  maskedAccountNumber: string; // e.g. "••••••••8812"
  ifscCode: string; // e.g. "HDFC0001248"
  accountType: 'SAVINGS' | 'CURRENT';
  verificationStatus: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  razorpayLinkedStatus: 'not_linked' | 'pending' | 'linked' | 'failed';
  lastVerifiedAt?: string;
}

export interface PayoutEligibility {
  canRequestWithdrawal: boolean;
  minimumWithdrawalPaise: number;
  availableBalancePaise: number;
  hasActiveHold: boolean;
  activeHoldCount: number;
  payoutAccountVerified: boolean;
  eligibilityReasons: string[];
}

export interface EarningsSummary {
  totalEarningsPaise: number;
  availableEarningsPaise: number;
  pendingEarningsPaise: number;
  withdrawalsUnderReviewPaise: number;
  totalWithdrawnPaise: number;
  xentroCommissionPaise: number;
  currency: 'INR';
  asOf: string; // ISO 8601
}

/**
 * State representing API availability for mentor financials.
 */
export type FinancialApiState =
  | 'loading'
  | 'available'
  | 'unavailable' // Backend financial endpoints unprovisioned
  | 'unauthorized'
  | 'error';

/**
 * Helper to convert paise to rupees formatted string (e.g. ₹1,250.00)
 */
export function formatPaiseToRupees(paise: number, includeDecimals = true): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}
