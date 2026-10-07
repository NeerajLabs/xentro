"use client";

import React, { useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTerms = type === "terms";
  const title = isTerms ? "XENTRO Terms of Service" : "XENTRO Privacy Policy";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E5E3] dark:border-[#262928]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 id="modal-title" className="font-manrope font-bold text-base text-[#101212] dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-[#F7F8F6] dark:hover:bg-[#202422] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm font-inter text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          {isTerms ? (
            <>
              <p>
                Welcome to <strong>XENTRO</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using our services, network protocol, or creating an account, you agree to be bound by these Terms of Service.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                1. Account Registration & Security
              </h3>
              <p>
                You must provide accurate, current, and complete information during registration. You are responsible for safeguarding your credentials and for all activities occurring under your account.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                2. Acceptable Use Policy
              </h3>
              <p>
                You agree not to use the XENTRO ecosystem for unlawful activities, unauthorized data harvesting, or any action that disrupts the integrity or performance of the network.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                3. Intellectual Property
              </h3>
              <p>
                All brand assets, software architecture, marks, and design systems belonging to XENTRO remain the exclusive property of XENTRO and its licensors.
              </p>
            </>
          ) : (
            <>
              <p>
                Your privacy is fundamental to <strong>XENTRO</strong>. This Privacy Policy details how we collect, protect, and utilize your personal information.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                1. Information We Collect
              </h3>
              <p>
                We collect your full name, email address, and authentication telemetry required to verify account ownership and facilitate secure connections.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                2. Data Protection & Cryptographic Standards
              </h3>
              <p>
                Passwords are encrypted using industry-standard hashing before reaching any authentication provider. We never store raw passwords or sell personal data to third parties.
              </p>
              <h3 className="font-manrope font-bold text-sm text-[#101212] dark:text-white pt-2">
                3. Your Rights
              </h3>
              <p>
                You may request access to, correction of, or deletion of your personal account data at any time through your XENTRO profile settings.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6]/50 dark:bg-[#141615]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] transition-colors"
          >
            I Understand &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
