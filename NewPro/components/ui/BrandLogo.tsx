import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  href?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  className,
  showWordmark = true,
  wordmarkClassName,
  href = "/",
}) => {
  const content = (
    <div className={cn("inline-flex items-center gap-3 group select-none", className)}>
      <div
        className="relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-[22%]"
        style={{ width: size, height: size }}
      >
        <Image
          src="/xentro-logo.png"
          alt="XENTRO Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showWordmark && (
        <span
          className={cn(
            "font-sora font-semibold tracking-wider text-xl uppercase transition-colors",
            wordmarkClassName || "text-[#101212] dark:text-white"
          )}
        >
          XENTRO
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[#D9FF3F] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};
