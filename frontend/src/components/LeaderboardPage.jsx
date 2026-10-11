import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    if (index === 0) badges.push({ label: '👑 Campus MVP', color: 'from-amber-400 to-yellow-600' });
    if (Number(item.completed_deliveries) >= 10) badges.push({ label: '⚡ Speed Demon', color: 'from-blue-500 to-indigo-600' });
    if (Number(item.rating) >= 4.8) badges.push({ label: '⭐ Top Rated', color: 'from-purple-500 to-pink-500' });
    if (badges.length === 0) badges.push({ label: '🛵 Rising Star', color: 'from-emerald-500 to-teal-600' });
    return badges;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-yellow-950/40 via-purple-950/40 to-slate-900 border border-yellow-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 mb-2 inline-block">
              🏆 Campus Hall of Fame
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Syne']">
              Carrier Leaderboard & Badges
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-lg">
              Recognizing the fastest, most reliable student carriers across {user?.campus || 'your campus'}. Deliver orders to climb the ranks!
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Your Campus
            </span>
            <span className="text-sm font-bold text-yellow-400 truncate block">
              🏫 {user?.campus || 'Campus'}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (If leaders >= 3) */}
      {!loading && leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 pb-2">
          {/* #2 Silver */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-700/60 text-center flex flex-col items-center shadow-lg"
          >
            <div className="text-2xl mb-1">🥈</div>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-200 text-base mb-2 overflow-hidden">
              {leaders[1]?.avatar_url ? (
                <img src={leaders[1].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[1]?.name?.[0]
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate w-full">{leaders[1]?.name}</h4>
            <span className="text-[11px] text-emerald-400 font-bold mt-1">
              {leaders[1]?.completed_deliveries} trips
            </span>
            <span className="text-[10px] text-slate-400">₹{leaders[1]?.total_earnings}</span>
          </motion.div>

          {/* #1 Gold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-gradient-to-b from-yellow-900/30 to-slate-900/90 border border-yellow-500/50 text-center flex flex-col items-center shadow-2xl relative -translate-y-2"
          >
            <div className="text-3xl mb-1 animate-bounce">👑</div>
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center font-black text-yellow-300 text-xl mb-2 overflow-hidden shadow-lg shadow-yellow-500/20">
              {leaders[0]?.avatar_url ? (
                <img src={leaders[0].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[0]?.name?.[0]
              )}
            </div>
            <h4 className="text-sm font-extrabold text-white truncate w-full">{leaders[0]?.name}</h4>
            <span className="text-xs text-yellow-400 font-black mt-1">
              {leaders[0]?.completed_deliveries} trips completed
            </span>
            <span className="text-[11px] font-bold text-slate-300">₹{leaders[0]?.total_earnings} earned</span>
          </motion.div>

          {/* #3 Bronze */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl bg-slate-900/70 border border-amber-900/40 text-center flex flex-col items-center shadow-lg"
          >
            <div className="text-2xl mb-1">🥉</div>
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-500 text-base mb-2 overflow-hidden">
              {leaders[2]?.avatar_url ? (
                <img src={leaders[2].avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                leaders[2]?.name?.[0]
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate w-full">{leaders[2]?.name}</h4>
            <span className="text-[11px] text-emerald-400 font-bold mt-1">
              {leaders[2]?.completed_deliveries} trips
            </span>
            <span className="text-[10px] text-slate-400">₹{leaders[2]?.total_earnings}</span>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Rankings List */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
          Rankings ({leaders.length} Active Carriers)
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <span>🏁</span>
            <p className="mt-1">No completed deliveries on this campus yet. Be the first!</p>
          </div>
        ) : (
          leaders.map((lead, index) => {
            const badges = getBadges(lead, index);
            return (
              <div
                key={lead.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 text-center font-black text-sm font-['Syne'] ${
                      index === 0
                        ? 'text-yellow-400'
                        : index === 1
                        ? 'text-slate-300'
                        : index === 2
                        ? 'text-amber-500'
                        : 'text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 flex-shrink-0 overflow-hidden">
                    {lead.avatar_url ? (
                      <img src={lead.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      lead.name?.[0]
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm truncate">{lead.name}</span>
                      {badges.map((b, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${b.color} shadow-sm`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-yellow-400 font-semibold">
                        ★ {Number(lead.rating || 5).toFixed(1)}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">
                        {lead.completed_deliveries} deliveries
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Earnings</span>
                  <span className="text-sm sm:text-base font-black text-purple-300 font-['Syne']">
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
