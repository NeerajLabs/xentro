'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function DirectProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawId) return;

    let isCancelled = false;
    const resolveAndNavigate = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${encodeURIComponent(rawId)}`);
        if (res.status === 401) {
          router.replace(`/signin?redirect=/profile/${encodeURIComponent(rawId)}`);
          return;
        }

        if (res.ok) {
          const payload = await res.json();
          let profileType = 'startup';
          if (payload.data?.isEntity) {
            const cType = payload.data?.entity?.canonicalType?.toLowerCase() || '';
            const eType = payload.data?.entity?.entityType?.toLowerCase() || '';
            if (cType.includes('investor') || eType.includes('investor')) profileType = 'investor';
            else if (cType.includes('esp') || eType.includes('esp')) profileType = 'esp';
            else profileType = 'startup';
          } else if (payload.data?.user) {
            const role = String(payload.data?.user?.role || payload.data?.user?.accountType || '').toLowerCase();
            if (role.includes('mentor')) profileType = 'mentor';
            else if (role.includes('investor')) profileType = 'investor';
            else if (role.includes('esp')) profileType = 'esp';
            else if (role.includes('explorer')) profileType = 'explorer';
            else profileType = 'startup';
          }

          if (!isCancelled) {
            router.replace(`/?viewProfile=${encodeURIComponent(rawId)}&profileType=${profileType}`);
          }
        } else {
          // If not in database or error, default to profile view with fallback
          if (!isCancelled) {
            router.replace(`/?viewProfile=${encodeURIComponent(rawId)}&profileType=startup`);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Failed to load profile');
          setLoading(false);
        }
      }
    };

    resolveAndNavigate();
    return () => {
      isCancelled = true;
    };
  }, [rawId, router]);

  return (
    <div className="min-h-screen bg-[#0D0F0F] text-white flex flex-col items-center justify-center p-4">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-lg animate-pulse">
            <img src="/xentro-logo.png" alt="Xentro" className="w-6 h-6 object-contain" />
          </div>
          <p className="text-xs text-[#B6B8B7]">Loading ecosystem profile...</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-red-400 mb-2">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.replace('/')}
            className="text-xs px-4 py-1.5 rounded-full bg-[#D9FF3F] text-black font-bold"
          >
            Back to Ecosystem
          </button>
        </div>
      )}
    </div>
  );
}
