import React from 'react';

export function Logo({ className = "h-8", variant = "full" }) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Bolt Brand Icon */}
      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/25 flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white text-white">
          <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" />
        </svg>
      </div>
      {variant === "full" && (
        <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
          zipp<span className="text-blue-600 dark:text-blue-400">.</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
