'use client';

import React, { useEffect } from 'react';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Default the Admin Command Centre to dark mode for optimal contrast & high-tech theme
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('xentro_theme');
      if (saved === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        if (!saved) {
          localStorage.setItem('xentro_theme', 'dark');
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white antialiased transition-colors duration-150">
      {children}
    </div>
  );
}
