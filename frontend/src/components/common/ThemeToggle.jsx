import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';

export default function ThemeToggle({ className = '', variant = 'button' }) {
  const { theme, setTheme } = useAuthStore();
  
  // Determine if currently dark
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark/light theme"
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-zipp-ink-200 bg-zipp-surface hover:bg-zipp-ink-100/70 text-xs font-semibold text-zipp-ink-800 shadow-soft transition-all duration-200 ${className}`}
      >
        {isDark ? (
          <>
            <Sun size={14} className="text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-zipp-ink-600 shrink-0" />
            <span className="hidden sm:inline">Dark</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`w-9 h-9 rounded-full flex items-center justify-center border border-zipp-ink-200 bg-zipp-surface hover:bg-zipp-ink-100 text-zipp-ink-700 shadow-soft transition-all duration-200 active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-zipp-ink-700 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
