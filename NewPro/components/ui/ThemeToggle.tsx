"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("xentro_theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("xentro_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-full transition-colors border",
        "border-[#E3E5E3] bg-white text-[#565B59] hover:text-[#101212] hover:border-[#101212]",
        "dark:border-[#262928] dark:bg-[#181B1A] dark:text-[#B6B8B7] dark:hover:text-white dark:hover:border-[#D9FF3F]",
        "focus-xentro",
        className
      )}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 transition-transform hover:rotate-12" />
      ) : (
        <Sun className="w-4 h-4 text-[#D9FF3F] transition-transform hover:rotate-45" />
      )}
    </button>
  );
};
