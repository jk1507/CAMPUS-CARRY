import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Flame, Crown } from 'lucide-react';
import client from '../api/client.js';
import useAuthStore from '../store/authStore.js';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/requests/leaderboard', { params: { campus: user?.campus } })
      .then((res) => {
        setLeaders(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.campus]);

  const getBadges = (item, index) => {
    const badges = [];
    if (index === 0) badges.push({ label: 'Campus MVP', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' });
    if (Number(item.completed_deliveries) >= 10) badges.push({ label: 'Speed Demon', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' });
    if (Number(item.rating) >= 4.8) badges.push({ label: 'Top Rated', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' });
    return badges;
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
          Campus Hall of Fame
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Top student carriers in {user?.campus || 'your campus'}. Complete deliveries to climb the ranks.
        </p>
      </div>

      {/* Podium for Top 3 */}
      {!loading && leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
          {/* #2 Silver */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-center flex flex-col items-center shadow-sm">
            <span className="text-xs font-black text-slate-400 font-mono mb-1">#2</span>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 mb-1.5 overflow-hidden">
              {leaders[1]?.avatar_url ? (
                <img src={leaders[1].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[1]?.name?.[0]
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate w-full">
              {leaders[1]?.name}
            </h4>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {leaders[1]?.completed_deliveries} trips
            </span>
          </div>

          {/* #1 Gold */}
          <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/30 border-2 border-amber-400/80 text-center flex flex-col items-center shadow-md relative -translate-y-2">
            <Crown className="w-5 h-5 text-amber-500 mb-0.5" />
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 border-2 border-amber-400 flex items-center justify-center font-black text-sm text-amber-800 dark:text-amber-200 mb-1.5 overflow-hidden">
              {leaders[0]?.avatar_url ? (
                <img src={leaders[0].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[0]?.name?.[0]
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white truncate w-full">
              {leaders[0]?.name}
            </h4>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
              {leaders[0]?.completed_deliveries} trips
            </span>
          </div>

          {/* #3 Bronze */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-center flex flex-col items-center shadow-sm">
            <span className="text-xs font-black text-amber-700 font-mono mb-1">#3</span>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-amber-600 flex items-center justify-center font-bold text-xs text-amber-700 mb-1.5 overflow-hidden">
              {leaders[2]?.avatar_url ? (
                <img src={leaders[2].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[2]?.name?.[0]
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate w-full">
              {leaders[2]?.name}
            </h4>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {leaders[2]?.completed_deliveries} trips
            </span>
          </div>
        </div>
      )}

      {/* Rankings List */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          Rankings ({leaders.length} Carriers)
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No completed deliveries recorded yet on this campus.
          </div>
        ) : (
          leaders.map((lead, index) => {
            const isMe = user?.id === lead.id;
            const badges = getBadges(lead, index);
            return (
              <div
                key={lead.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isMe
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-sm'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-center font-black text-xs font-mono text-slate-400">
                    #{index + 1}
                  </span>

                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                    {lead.avatar_url ? (
                      <img src={lead.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      lead.name?.[0]
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {lead.name} {isMe && '(You)'}
                      </span>
                      {badges.map((b, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${b.color}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="text-amber-500 font-bold">★ {Number(lead.rating || 5).toFixed(1)}</span>
                      <span>·</span>
                      <span>{lead.completed_deliveries} deliveries</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                    ₹{lead.total_earnings}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
