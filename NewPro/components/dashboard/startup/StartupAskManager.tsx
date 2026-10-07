'use client';

import React from 'react';
import { UserRole } from '@/lib/userProfile';
import { UniversalAskManager } from '../ask/UniversalAskManager';

interface StartupAskManagerProps {
  role?: UserRole;
  defaultTab?: 'overview' | 'asks' | 'drafts' | 'responses';
}

export const StartupAskManager: React.FC<StartupAskManagerProps> = ({
  role = 'startup',
  defaultTab,
}) => {
  return <UniversalAskManager role={role} defaultTab={defaultTab} />;
};

export { UniversalAskManager };
