import React from "react";
import Image from "next/image";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Shield, Sparkles, Users2, ArrowUpRight } from "lucide-react";

export const AuthBrandPanel: React.FC = () => {
  return (
    <aside className="relative flex flex-col justify-between w-full h-full min-h-[600px] p-6 lg:p-8 xl:p-12 bg-[#0D0F0F] text-white overflow-hidden select-none">
      {/* Background Ambience: Subtle glowing organic lime & dark gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft lime glow sphere */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D9FF3F]/10 blur-[120px] animate-pulse-subtle" />
        
        {/* Organic deep lime ambient core */}
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] rounded-full bg-[#D9FF3F]/12 blur-[140px]" />
        
        {/* Subtle secondary depth sphere */}
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-[#181B1A] blur-[80px]" />

        {/* Delicate connected network mesh grid lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          fill="none"
        >
          <defs>
            <linearGradient id="lime-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D9FF3F" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#D9FF3F" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#101212" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D9FF3F" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#D9FF3F" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Organic Connected Tri-Lobe Curves (Echoing official logo geometry) */}
          <path
            d="M220,280 C360,180 500,240 560,380 C620,520 480,660 340,620 C200,580 140,420 220,280 Z"
            stroke="url(#lime-glow)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <path
            d="M300,320 C400,260 480,300 510,400 C540,500 450,580 370,550 C290,520 240,410 300,320 Z"
            stroke="#D9FF3F"
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />

          {/* Connected Network Nodes */}
          <circle cx="220" cy="280" r="4" fill="#D9FF3F" fillOpacity="0.8" />
          <circle cx="220" cy="280" r="16" fill="url(#node-glow)" />

          <circle cx="560" cy="380" r="5" fill="#D9FF3F" fillOpacity="0.9" />
          <circle cx="560" cy="380" r="20" fill="url(#node-glow)" />

          <circle cx="340" cy="620" r="4" fill="#D9FF3F" fillOpacity="0.8" />
          <circle cx="340" cy="620" r="16" fill="url(#node-glow)" />

          {/* Intersecting Connection Rays */}
          <line x1="220" y1="280" x2="560" y2="380" stroke="#D9FF3F" strokeWidth="0.75" strokeOpacity="0.15" />
          <line x1="560" y1="380" x2="340" y2="620" stroke="#D9FF3F" strokeWidth="0.75" strokeOpacity="0.15" />
          <line x1="340" y1="620" x2="220" y2="280" stroke="#D9FF3F" strokeWidth="0.75" strokeOpacity="0.15" />
        </svg>
      </div>

      {/* Header: Official Logo & Brand Wordmark */}
      <header className="relative z-10">
        <BrandLogo
          size={46}
          showWordmark={true}
          wordmarkClassName="text-white text-xl font-semibold tracking-wider"
        />
      </header>

      {/* Main Core Brand Narrative */}
      <div className="relative z-10 my-auto py-4 lg:py-6 max-w-xl">
        {/* Accent Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-[#181B1A] border border-[#262928] text-xs font-inter font-medium text-[#B6B8B7]">
          <span className="w-2 h-2 rounded-full bg-[#D9FF3F] animate-pulse" />
          <span>Next-Generation Network Architecture</span>
        </div>

        {/* Headline - Sora Semibold */}
        <h1 className="font-sora font-semibold text-2xl sm:text-3xl xl:text-4xl leading-[1.2] tracking-tight text-white mb-3">
          Build your place in a more{" "}
          <span className="text-[#D9FF3F]">connected tomorrow.</span>
        </h1>

        {/* Supporting text */}
        <p className="font-inter text-sm sm:text-base text-[#B6B8B7] leading-relaxed max-w-lg mb-6">
          Join the Xentro ecosystem and connect with the people, ideas, capital, and opportunities that can move your journey forward.
        </p>

        {/* Subtle Highlight Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <div className="p-4 rounded-xl bg-[#181B1A]/80 border border-[#262928] backdrop-blur-sm transition-colors hover:border-[#D9FF3F]/30">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-1.5 rounded-lg bg-[#D9FF3F]/10 text-[#D9FF3F]">
                <Users2 className="w-4 h-4" />
              </div>
              <h3 className="font-manrope font-bold text-sm text-white">Global Ecosystem</h3>
            </div>
            <p className="font-inter text-xs text-[#B6B8B7] leading-normal">
              Direct access to founders, capital, operators, and visionary opportunities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181B1A]/80 border border-[#262928] backdrop-blur-sm transition-colors hover:border-[#D9FF3F]/30">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-1.5 rounded-lg bg-[#D9FF3F]/10 text-[#D9FF3F]">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-manrope font-bold text-sm text-white">Enterprise Trust</h3>
            </div>
            <p className="font-inter text-xs text-[#B6B8B7] leading-normal">
              Bank-grade identity verification and cryptographic security standards.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: PEOPLE • IDEAS • CAPITAL • OPPORTUNITIES */}
      <div className="relative z-10 py-4 border-t border-[#262928]">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-inter font-bold tracking-wider text-[#B6B8B7]">
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
            PEOPLE
          </span>
          <span className="text-[#565B59]">&bull;</span>
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
            IDEAS
          </span>
          <span className="text-[#565B59]">&bull;</span>
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
            CAPITAL
          </span>
          <span className="text-[#565B59]">&bull;</span>
          <span className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9FF3F]" />
            OPPORTUNITIES
          </span>
        </div>
      </div>

      {/* Footer: Credibility & Status */}
      <footer className="relative z-10 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-inter text-[#565B59]">
        <span>XENTRO Core Protocol &bull; v2.4 Live</span>
        <span>&copy; {new Date().getFullYear()} XENTRO</span>
      </footer>
    </aside>
  );
};
