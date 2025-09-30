"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // avoid hydration mismatch

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="h-9 px-3 rounded-xl border bg-white/70 dark:bg-white/5 dark:border-white/10
                 hover:shadow-soft transition text-sm"
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
