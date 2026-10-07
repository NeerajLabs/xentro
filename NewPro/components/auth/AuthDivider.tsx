import React from "react";
import { cn } from "@/lib/utils";

interface AuthDividerProps {
  label?: string;
  className?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  label = "OR",
  className,
}) => {
  return (
    <div className={cn("relative my-6 flex items-center justify-center", className)}>
      <div className="w-full border-t border-[#E3E5E3] dark:border-[#262928]" />
      <span className="absolute px-3 text-xs font-inter font-semibold tracking-wider uppercase bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7]">
        {label}
      </span>
    </div>
  );
};
