'use client';

import { UserRole } from '@/lib/userProfile';

/**
 * Dev-only helpers (quick test logins, demo reset). Disabled in normal use.
 * Enabled with `?dev=1` on the URL or NEXT_PUBLIC_XENTRO_DEV_TOOLS === 'true'.
 */
export function isDevToolsEnabled(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === '1') return true;
    } catch {
      // Ignore URL parsing issues
    }
  }
  return process.env.NEXT_PUBLIC_XENTRO_DEV_TOOLS === 'true';
}

/** Display copy for any hub section that has no user data yet. */
export const EMPTY_STATE_COPY = 'Nothing here yet — add it and it will show up here.';

/** Every localStorage key this hub owns (cleared by the dev Reset control). */
const OWNED_STORAGE_KEYS = [
  'xentro_current_user',
  'xentro_onboarding_complete',
  'xentro_user_profile',
  'xentro_active_role',
  'xentro_active_investor_context_v1',
  'xentro_handoff_details',
  'xentro_last_handoff_id',
  'xentro_handoff_received_at',
  'xentro_personal_profile',
  'xentro_mentor_setup',
  'xentro_startup_entities',
  'xentro_investor_entities',
  'xentro_esp_requests',
  'xentro_mentor_profile',
  'xentro_mentor_profile_user_mentor',
  'xentro_startup_basic_info',
  'xentro_startup_team_members',
  'xentro_startup_team_v1',
  'xentro_startup_pitch_deck',
  'xentro_startup_pitch_video',
  'xentro_startup_problem',
  'xentro_startup_solution',
  'xentro_startup_product',
  'xentro_startup_company_info',
  'xentro_startup_market',
  'xentro_startup_business_model',
  'xentro_startup_banner',
  'xentro_startup_avatar',
  'xentro_startup_overall_visibility',
  'xentro_startup_ghost_mode',
  'xentro_startup_privacy_settings',
  'xentro_investor_full_profile_v1',
  'xentro_investor_organizations_v1',
  'xentro_investor_org_memberships_v1',
  'xentro_investor_org_invitations_v1',
  'xentro_individual_investor_profile_v1',
  'xentro_individual_investor_deals_v1',
  'xentro_individual_investor_portfolio_v1',
  'xentro_investor_account_type_v1',
  'xentro_investor_settings_v1',
  'xentro_investor_members_v1',
  'xentro_investor_invitations_v1',
  'xentro_investor_deals_v1',
  'xentro_investor_diligence_docs_v1',
  'xentro_investor_meetings_v1',
  'xentro_investor_portfolio_v1',
  'xentro_investor_subscription_v1',
  'xentro_investor_billing_account_v1',
  'xentro_investor_invoices_v1',
  'xentro_universal_feed_posts',
  'xentro_feed_drafts_v1',
  'xentro_startup_members_v1',
  'xentro_startup_invitations_v1',
  'xentro_startup_verification_v1',
  'xentro_startup_endorsements_v1',
  'xentro_startup_subscription_v1',
  'xentro_startup_billing_account_v1',
  'xentro_startup_payment_methods_v1',
  'xentro_startup_invoices_v1',
  'xentro_startup_payments_v1',
  'xentro_startup_failed_payment_sim',
  'xentro_mentor_offerings',
  'xentro_mentorship_requests',
  'xentro_active_mentorships',
  'xentro_mentorship_transactions',
  'xentro_mentorship_history',
  'xentro_esp_simulated_role',
  'xentro_esp_active_role_simulation',
  'xentro_esp_audit_log_data',
  'xentro_entry_redirect_at',
  'xentro_theme',
];

/** Wipes every hub-owned key from localStorage + sessionStorage (dev only). */
export function resetHubData(): void {
  if (typeof window === 'undefined') return;
  OWNED_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  });
  try {
    document.cookie = 'xentro_session=; path=/; max-age=0; SameSite=Lax';
  } catch {
    // Ignore cookie errors
  }
}

export type DevQuickRole = UserRole | 'reset';

/** Builds a minimal guest/role profile for the dev quick-login control. */
export function buildDevQuickProfile(role: UserRole): Record<string, unknown> {
  const stamp = Date.now();
  const base: Record<string, unknown> = {
    id: `dev_${role}_${stamp}`,
    role,
    joinedAt: new Date().toISOString(),
    avatar: '/xentro-logo.png',
  };
  if (role === 'explorer') {
    return { ...base, name: `Guest ${Math.floor(1000 + Math.random() * 9000)}` };
  }
  if (role === 'startup') {
    return { ...base, name: `Test Founder ${Math.floor(100 + Math.random() * 900)}` };
  }
  if (role === 'mentor') {
    return { ...base, name: `Test Mentor ${Math.floor(100 + Math.random() * 900)}` };
  }
  if (role === 'investor') {
    return { ...base, name: `Test Investor ${Math.floor(100 + Math.random() * 900)}` };
  }
  return { ...base, name: `Test ESP Rep ${Math.floor(100 + Math.random() * 900)}` };
}
