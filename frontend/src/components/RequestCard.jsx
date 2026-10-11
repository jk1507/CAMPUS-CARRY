import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  open: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    label: 'Open for Carrier',
    badgeIcon: '🟢',
  },
  accepted: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    label: 'Accepted',
    badgeIcon: '🛵',
  },
  in_progress: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    label: 'In Transit',
    badgeIcon: '📦',
  },
  delivered: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.25)',
    label: 'Delivered',
    badgeIcon: '✅',
  },
  cancelled: {
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.25)',
    label: 'Cancelled',
    badgeIcon: '❌',
  },
};

export default function RequestCard({
  request,
  onAccept,
  onView,
  showAccept = false,
}) {
  const sc = statusConfig[request.status] || statusConfig.open;

  // Google Maps directions link
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    request.pickup_location
  )}&destination=${encodeURIComponent(request.dropoff_location)}`;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onView?.(request)}
      className="group relative overflow-hidden bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-purple-950/20 transition-all"
    >
      {/* Top Bar: Status Badge + Timestamp + Reward */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              color: sc.color,
              backgroundColor: sc.bg,
              borderColor: sc.border,
            }}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 uppercase tracking-wider"
          >
            <span>{sc.badgeIcon}</span> {sc.label}
          </span>

          <span className="text-[11px] text-slate-400 font-medium">
            {request.created_at
              ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true })
              : ''}
          </span>
        </div>

        {/* Reward Bounty */}
        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Bounty</span>
          <span className="text-xl font-extrabold text-purple-400 font-['Syne']">
            ₹{request.reward}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
          {request.title}
        </h3>
        {request.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {request.description}
          </p>
        )}
      </div>

      {/* Visual Route Points */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-slate-400 text-[11px]">From:</span>
            <span className="font-semibold text-slate-200 truncate">
              {request.pickup_location}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
            <span className="text-slate-400 text-[11px]">To:</span>
            <span className="font-semibold text-slate-200 truncate">
              {request.dropoff_location}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Requester info & Quick Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Requester Profile Snippet */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {request.requester_name ? request.requester_name[0].toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <span className="text-slate-300 font-semibold block truncate">
              {request.requester_name || 'Anonymous Student'}
            </span>
          </div>
        </div>

        {/* Quick Buttons: Google Maps & Accept */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* External Google Maps Route Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all text-xs font-semibold"
            title="Open directions in Google Maps"
          >
            <span>🗺</span>
            <span className="hidden sm:inline">Route</span>
          </a>

          {showAccept && request.status === 'open' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.(request.id);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1"
            >
              <span>🛵</span> Accept
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
