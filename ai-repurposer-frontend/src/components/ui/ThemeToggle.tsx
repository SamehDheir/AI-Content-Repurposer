"use client";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Paper ⇄ Ink. The icons are swapped by the class on <html> rather than by
 * React state, so the control is already correct on the very first paint.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`group relative h-8 w-8 border border-rule text-ink-2 transition-colors hover:border-signal hover:text-signal ${className}`}
      aria-label="Switch between paper and ink"
      title="Switch between paper and ink"
    >
      <span className="absolute inset-0 flex items-center justify-center">
        {/* Ink (dark) is showing → offer the paper disc. */}
        <svg className="only-dark" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 1.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" />
        </svg>
        <svg className="only-light" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 1.5v13a6.5 6.5 0 0 1 0-13Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
