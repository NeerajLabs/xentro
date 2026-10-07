'use client';

import React, { useState } from 'react';
import { AdminLayout, AdminTab } from '@/components/admin/AdminLayout';
import { AdminOverviewView } from '@/components/admin/AdminOverviewView';
import { AdminPersonalAccountsView } from '@/components/admin/AdminPersonalAccountsView';
import { AdminEntityAccountsView } from '@/components/admin/AdminEntityAccountsView';
import { AdminWorkspacesView } from '@/components/admin/AdminWorkspacesView';
import { AdminStartupOpsView } from '@/components/admin/AdminStartupOpsView';
import { AdminMentorOpsView } from '@/components/admin/AdminMentorOpsView';
import { AdminInvestorOpsView } from '@/components/admin/AdminInvestorOpsView';
import { AdminEspOpsView } from '@/components/admin/AdminEspOpsView';
import { AdminVerificationView } from '@/components/admin/AdminVerificationView';
import { AdminMembershipsView } from '@/components/admin/AdminMembershipsView';
import { AdminRelationshipsView } from '@/components/admin/AdminRelationshipsView';
import { AdminOpportunitiesView } from '@/components/admin/AdminOpportunitiesView';
import { AdminModerationSafetyView } from '@/components/admin/AdminModerationSafetyView';
import { AdminFinanceBillingView } from '@/components/admin/AdminFinanceBillingView';
import { AdminDocumentsView } from '@/components/admin/AdminDocumentsView';
import { AdminAnalyticsView } from '@/components/admin/AdminAnalyticsView';
import { AdminSystemView } from '@/components/admin/AdminSystemView';

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');

  return (
    <AdminLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'overview' && (
        <AdminOverviewView onNavigateTab={(tab) => setCurrentTab(tab)} />
      )}
      {(currentTab === 'personal-accounts' || currentTab === 'users') && (
        <AdminPersonalAccountsView />
      )}
      {currentTab === 'entity-accounts' && <AdminEntityAccountsView />}
      {currentTab === 'workspaces' && <AdminWorkspacesView />}
      {currentTab === 'startups' && <AdminStartupOpsView />}
      {currentTab === 'mentors' && <AdminMentorOpsView />}
      {currentTab === 'investors' && <AdminInvestorOpsView />}
      {currentTab === 'esps' && <AdminEspOpsView />}
      {currentTab === 'verification' && <AdminVerificationView />}
      {currentTab === 'memberships' && <AdminMembershipsView />}
      {currentTab === 'relationships' && <AdminRelationshipsView />}
      {currentTab === 'opportunities' && <AdminOpportunitiesView />}
      {currentTab === 'moderation' && <AdminModerationSafetyView />}
      {currentTab === 'finance' && <AdminFinanceBillingView />}
      {currentTab === 'documents' && <AdminDocumentsView />}
      {currentTab === 'analytics' && <AdminAnalyticsView />}
      {currentTab === 'system' && <AdminSystemView />}
    </AdminLayout>
  );
}

