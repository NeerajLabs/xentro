'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('xentro_current_user');
      const userProfile = localStorage.getItem('xentro_user_profile');
      const hasCookie = document.cookie.includes('xentro_session=');

      if (!currentUser && !userProfile && !hasCookie) {
        setIsAuthenticated(false);
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
