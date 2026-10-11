import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Navigation, 
  MessageSquare, 
  ArrowRight,
  Inbox
} from 'lucide-react';
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
    <div className="space-y-4 pb-12">
      {/* Top Carrier Stats Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
            Missions in Flight
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            Active Deliveries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deliver to destination and enter the 4-digit handover OTP.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">
            Potential Payout
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{totalEarningsInTransit}
          </span>
        </div>
      </div>

      {carrying.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bike className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No active missions right now
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
            Accept open requests from the live feed to start earning while walking between classes.
          </p>
          <button
            onClick={() => navigate('/app/feed')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <span>Open Dispatch Feed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {carrying.map((req) => (
            <div key={req.id} className="space-y-2">
              <RequestCard request={req} onView={setSelected} />
              
              {/* Quick Mission Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(req)}
                  className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Verify OTP & Chat</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    req.pickup_location
                  )}&destination=${encodeURIComponent(req.dropoff_location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Turn-by-Turn GPS</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Bottom Sheet Modal */}
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
