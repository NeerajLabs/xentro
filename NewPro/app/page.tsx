'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

function checkHasValidSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Must have authentic current user with actual ID or email
    const currentUserRaw = localStorage.getItem('xentro_current_user');
    if (currentUserRaw) {
      const user = JSON.parse(currentUserRaw);
      if (user && (user.id || user.email) && user.id !== 'user_startup' && user.id !== 'usr_explorer') {
        return true;
      }
    }

    // 2. Check for active, non-empty session cookie
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith('xentro_session=')) {
        const val = trimmed.substring('xentro_session='.length);
        if (val && val !== '""' && val !== "''" && val !== 'null' && val !== 'undefined' && val.length > 5) {
          return true;
        }
      }
    }

    // 3. Check for valid auth token
    const token = localStorage.getItem('xentro_access_token');
    if (token && token.trim().length > 10) {
      return true;
    }
  } catch (_) {}
  return false;
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isValid = checkHasValidSession();

      if (!isValid) {
        setIsAuthenticated(false);
        // Purge any orphan demo/unauthenticated profile artifacts
        try {
          const profRaw = localStorage.getItem('xentro_user_profile');
          if (profRaw) {
            const prof = JSON.parse(profRaw);
            if (!prof.email || prof.name === 'Founder' || prof.id === 'user_startup') {
              localStorage.removeItem('xentro_user_profile');
              localStorage.removeItem('xentro_active_role');
            }
          }
        } catch (_) {}
        router.replace('/signin');
      } else {
        localStorage.setItem('xentro_onboarding_complete', 'true');
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-lg animate-pulse">
          <img src="/xentro-logo.png" alt="Xentro" className="w-6 h-6 object-contain" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardLayout />;
}
