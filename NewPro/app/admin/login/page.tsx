'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { verifyAdminCredentials, setAdminSession, isAuthenticatedAdmin } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // If already authenticated as admin, go straight to admin dashboard
    if (isAuthenticatedAdmin()) {
      router.replace('/admin/dashboard');
    }

    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
      const updateTheme = () => {
        setIsDark(document.documentElement.classList.contains('dark'));
      };
      window.addEventListener('storage', updateTheme);
      window.addEventListener('xentro-theme-changed', updateTheme);
      return () => {
        window.removeEventListener('storage', updateTheme);
        window.removeEventListener('xentro-theme-changed', updateTheme);
      };
    }
  }, [router]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('xentro_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('xentro_theme', 'light');
      }
      window.dispatchEvent(new Event('xentro-theme-changed'));
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const session = await verifyAdminCredentials(employeeId, password);
      if (session) {
        setAdminSession(session);
        router.push('/admin/dashboard');
      } else {
        setErrorMsg('Invalid Employee ID or Security Passphrase. Please verify your administrative credentials.');
      }
    } catch {
      setErrorMsg('An authentication protocol error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D0F0F] flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs flex-shrink-0">
            <img src="/xentro-logo.png" alt="Xentro Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sora text-lg font-bold tracking-tight text-[#101212] dark:text-white">
              xentro
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212]">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-all cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#D9FF3F]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Return to User Portal: Direct link to /signin to avoid auto-login to old cached user */}
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs font-semibold text-[#565B59] dark:text-[#A0A4A2] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>Return to User Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Center Login Box */}
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          {/* Security Banner Card */}
          <div className="rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-7 sm:p-9 shadow-xl relative overflow-hidden">
            {/* Subtle glow circle */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D9FF3F]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

            <div className="relative z-10 space-y-6">
              {/* Header Badge & Title */}
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Restricted Access Control</span>
                </div>
                <h1 className="font-sora text-2xl font-bold text-[#101212] dark:text-white tracking-tight">
                  Admin Sign In
                </h1>
                <p className="text-xs text-[#6E7370] dark:text-[#8E9390]">
                  Enter your assigned Employee ID and security passphrase to unlock the operational console.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthenticate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                    Employee ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter administrative ID"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] focus:border-[#D9FF3F] text-xs font-mono text-[#101212] dark:text-white placeholder-[#8E9390] outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white">
                    Security Passphrase
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] focus:border-[#D9FF3F] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E9390] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#101212] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span>Authenticate Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#6E7370] dark:text-[#8E9390] font-mono">
                  All administrative access is cryptographically audited and recorded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center py-3 text-[11px] text-[#6E7370] dark:text-[#8E9390]">
        <span>&copy; {new Date().getFullYear()} Xentro Ecosystem Operations. Internal Administrative Gateway.</span>
      </div>
    </div>
  );
}
