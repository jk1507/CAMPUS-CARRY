import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function Carrying() {
  const { carrying, fetchCarrying } = useRequestStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCarrying();
  }, []);

  const totalEarningsInTransit = carrying
    .filter((r) => r.status !== 'delivered' && r.status !== 'cancelled')
    .reduce((sum, r) => sum + Number(r.reward || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Carrier Stats banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-purple-900/20 border border-blue-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-2 inline-block">
            🛵 Carrier In-Flight Missions
          </span>
          <h1 className="text-2xl font-black text-white font-['Syne'] tracking-tight">
            My Active Deliveries
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Navigate to pickup, share live tracking, and get paid when marking delivered.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-right">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
            Potential Payout
          </span>
          <span className="text-2xl font-black text-emerald-400 font-['Syne']">
            ₹{totalEarningsInTransit}
          </span>
        </div>
      </div>

      {carrying.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl"
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-900/20 text-blue-400 border border-blue-500/20 flex items-center justify-center text-3xl shadow-lg">
            🛵
          </div>
          <h3 className="text-base font-bold text-white mb-1">No active deliveries</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            You don't have any pending delivery jobs right now. Browse the feed to pick up errands on campus!
          </p>
          <button
            onClick={() => navigate('/app/feed')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
          >
            Open Dispatch Feed
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {carrying.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <RequestCard request={req} onView={setSelected} />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setSelected(req)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <span>📍</span> Open Live Tracking, Navigation & Chat →
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    req.pickup_location
                  )}&destination=${encodeURIComponent(req.dropoff_location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>🗺</span> Turn-by-Turn GPS
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchCarrying}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
