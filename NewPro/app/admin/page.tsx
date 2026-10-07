'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticatedAdmin()) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#D9FF3F] border-t-transparent animate-spin" />
    </div>
  );
}
