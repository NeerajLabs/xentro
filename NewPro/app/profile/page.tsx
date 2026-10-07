'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?tab=profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0F0F] flex items-center justify-center">
      <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-lg animate-pulse">
        <img src="/xentro-logo.png" alt="Xentro" className="w-6 h-6 object-contain" />
      </div>
    </div>
  );
}
