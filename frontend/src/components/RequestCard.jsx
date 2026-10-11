import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Navigation, ArrowRight, User } from 'lucide-react';

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Transit',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

export default function RequestCard({
  request,
  onAccept,
  onView,
  showAccept = false,
}) {
  const sc = statusConfig[request.status] || statusConfig.open;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    request.pickup_location
  )}&destination=${encodeURIComponent(request.dropoff_location)}`;

  return (
    <div
      onClick={() => onView?.(request)}
      className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
    >
      {/* Top Header: Status Pill + Time-ago + Reward */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sc.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {request.created_at
              ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true })
              : ''}
          </span>
        </div>

        {/* Bounty */}
        <div className="text-right">
          <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
            ₹{request.reward}
          </span>
        </div>
      </div>

      {/* Item Title & Optional Note */}
      <div className="mb-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
          {request.title}
        </h3>
        {request.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {request.description}
          </p>
        )}
      </div>

      {/* Pickup -> Dropoff Timeline Visual */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">From:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {request.pickup_location}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">To:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {request.dropoff_location}
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Requester or Carrier avatar snippet */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
            {request.requester_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
            {request.requester_name || 'Campus Student'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Directions Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Directions"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Directions</span>
          </a>

          {/* Full-width Accept Button for Carriers */}
          {showAccept && request.status === 'open' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.(request.id);
              }}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Accept</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
