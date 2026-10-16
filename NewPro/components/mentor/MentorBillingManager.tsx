'use client';

import React from 'react';
import { MentorEarningsWorkspace } from './MentorEarningsWorkspace';

/**
 * XENTRO V1 — MENTOR BILLING MANAGER (REMEDIATED)
 * 
 * Remediated to eliminate legacy simulated payout behavior, fictional HDFC banking
 * details, and client-controlled balance reservations.
 * 
 * Safely delegates to the canonical, RBI-aware MentorEarningsWorkspace.
 */
export const MentorBillingManager: React.FC = () => {
  return <MentorEarningsWorkspace />;
};
